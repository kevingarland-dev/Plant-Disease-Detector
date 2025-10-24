from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import logging
import os
import numpy as np
import tensorflow as tf
from PIL import Image
from io import BytesIO
from fastapi.responses import FileResponse
from fastapi import UploadFile, File, HTTPException 
from fastapi.staticfiles import StaticFiles





app = FastAPI(title="Plant Disease API", description="Plant disease classification with symptoms and remedies")
app.mount("/static", StaticFiles(directory="build/static"), name="static")
CONFIDENCE_THRESHOLD = 0.70
# Enable CORS (so frontend can connect easily)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load disease data once at startup
with open("plant_disease_dataset.json", "r") as f:
    disease_data = json.load(f)
    
try:
    MODEL_PATH = "plant_disease_1.h5"
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    MODEL = tf.keras.models.load_model(MODEL_PATH)
    logger.info(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    MODEL = None
CLASS_NAMES = [
    "Corn Cercospora leaf spot Gray leaf spot", 'Corn Common rust',
    'Corn (maize) Northern Leaf Blight', 'Corn (maize) healthy',
    'Potato Early blight', 'Potato Late_blight', 'Potato healthy',
    'Tomato Bacterial spot', 'Tomato Early blight', 'Tomato Late blight',
    'Tomato Leaf Mold', 'Tomato Septoria leaf spot',
    'Tomato Spider mites Two-spotted spider mite', 'Tomato Target Spot',
    'Tomato Yellow Leaf Curl Virus', 'Tomato mosaic virus',
    'Tomato healthy'
]

def read_file_as_image(data) -> np.ndarray:
    """Process uploaded image data and prepare it for model prediction."""
    try:
        image = Image.open(BytesIO(data)).convert("RGB")
        # Try 256x256 which is common for plant disease models
        image = image.resize((256, 256))
        image_array = np.array(image, dtype=np.float32)
        # Some models expect values in [0, 255] range, others in [0, 1]
        # Let's try without normalization first
        return image_array
    except Exception as e:
        raise ValueError(f"Error processing image: {str(e)}")


@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    file_path = os.path.join("build", "index.html")
    return FileResponse(file_path)

@app.get("/", response_class=FileResponse)
async def root():
    file_path = os.path.join(os.getcwd(), "home.html")
    return FileResponse(file_path, media_type = "text/html") 


# Removed conflicting GET /predict route


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Predict plant disease from uploaded image."""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (max 10MB)
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        # Process image
        image = read_file_as_image(file_content)
        img_batch = np.expand_dims(image, 0)
        
        # Check if model is loaded
        if MODEL is None:
            raise HTTPException(status_code=503, detail="Model not available")
        
        # Make prediction
        logger.info(f"Making prediction for file: {file.filename}")
        logger.info(f"Image shape after preprocessing: {img_batch.shape}")
        predictions = MODEL.predict(img_batch)
        probabilities = predictions[0]
        predicted_index = int(np.argmax(probabilities))
        raw_confidence = float(np.max(probabilities))
        confidence = round(raw_confidence * 100, 2)  # Convert to percentage
        predicted_class = CLASS_NAMES[predicted_index] if predicted_index < len(CLASS_NAMES) else str(predicted_index)
        
        
        
        # Get top 3 predictions
        top3_indices = np.argsort(probabilities)[-3:][::-1]
        top3_predictions = []
        for idx in top3_indices:
            class_name = CLASS_NAMES[idx] if idx < len(CLASS_NAMES) else str(idx)
            pred_conf = float(probabilities[idx])
            top3_predictions.append({
                "disease": class_name,
                "confidence": round(pred_conf * 100, 2)  # Convert to percentage
            })
            
        threshold_pct = CONFIDENCE_THRESHOLD * 100  # Convert threshold to percentage
        if confidence < threshold_pct:
            response = {
                "class": "Uncertain",
                "confidence": confidence,
                "predictions": top3_predictions,
                "message": "PlantSense.ai is not able to make a confident prediction based on the provided image. This may be due to poor image quality or the disease not being represented in the training data."
            }
        else:
            response = {
            "class": predicted_class,
            "confidence": confidence,
            "index": predicted_index,
            "predictions": top3_predictions  # Add top 3 predictions to response
        }
            
        
        
        
        logger.info(f"Prediction response: {response}")
        
        
        
        
        # Get disease info from the already loaded disease_data
        normalized_pred = predicted_class.lower().strip()
        description = "Sorry, There's no detailed information for this disease yet."
        for entry in disease_data:
            if entry["Disease"].lower().strip() == normalized_pred:
                description = entry["response"]
                break

    
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
        

    # Return combined response with both predictions and disease info
    threshold_pct = CONFIDENCE_THRESHOLD * 100  # Convert threshold to percentage
    if confidence < threshold_pct:
        final_response = {
            "disease": "Uncertain Prediction",
            "description": "PlantSense.ai is not able to make a confident prediction based on the provided image. This may be due to poor image quality or the disease not being represented in the training data.",
            "confidence": confidence,  # Already in percentage
            "predictions": top3_predictions,
            "isUncertain": True
        }
    else:
        final_response = {
            "disease": predicted_class,
            "description": description,
            "confidence": confidence,  # Already in percentage
            "predictions": top3_predictions,
            "isUncertain": False
        }
    
    logger.info(f"Sending final response: {final_response}")
    return final_response
    
    

