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
from fastapi import UploadFile, File, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from livekit import api
import time





app = FastAPI(title="Plant Disease API", description="Plant disease classification with symptoms and remedies")
app.mount("/static", StaticFiles(directory="build/static"), name="static")
CONFIDENCE_THRESHOLD = 0.70

# LiveKit configuration
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", )
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", )
LIVEKIT_URL = os.getenv("LIVEKIT_URL", )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load disease data
with open("plant_disease_database.json", "r") as f:
    disease_data = json.load(f)
    
try:
    MODEL_PATH = "final_model.h5"
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    MODEL = tf.keras.models.load_model(MODEL_PATH)
    logger.info(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    MODEL = None
CLASS_NAMES = ['Apple___Apple_scab', 
'Apple___Black_rot',
'Apple___Cedar_apple_rust',
'Apple___healthy',
'Blueberry___healthy',
'Cherry_(including_sour)___Powdery_mildew',
'Cherry_(including_sour)___healthy',
'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
'Corn_(maize)___Common_rust_',
'Corn_(maize)___Northern_Leaf_Blight',
'Corn_(maize)___healthy',
'Grape___Black_rot', 
'Grape___Esca_(Black_Measles)',
'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
'Grape___healthy',
'Orange___Haunglongbing_(Citrus_greening)',
'Peach___Bacterial_spot',
'Peach___healthy',
'Pepper,_bell___Bacterial_spot',
'Pepper,_bell___healthy',
'Potato___Early_blight',
'Potato___Late_blight',
'Potato___healthy',
'Raspberry___healthy',
'Soybean___healthy',
'Squash___Powdery_mildew',
'Strawberry___Leaf_scorch',
'Strawberry___healthy', 
'Tomato___Bacterial_spot', 
'Tomato___Early_blight', 
'Tomato___Late_blight', 
'Tomato___Leaf_Mold',
'Tomato___Septoria_leaf_spot',
'Tomato___Spider_mites Two-spotted_spider_mite',
'Tomato___Target_Spot',
'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
'Tomato___Tomato_mosaic_virus',
'Tomato___healthy',
'Unknown']
def read_file_as_image(data) -> np.ndarray:
    """Process uploaded image data and prepare it for model prediction."""
    try:
        image = Image.open(BytesIO(data)).convert("RGB")
        
        image = image.resize((256, 256))
        image_array = np.array(image, dtype=np.float32)
        
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





@app.post("/voice-token")
async def get_voice_token(request: Request):
    """Generate a LiveKit token for voice assistant connection."""
    try:
        # Extract prediction data from request body if provided
        prediction_data = None
        try:
            body = await request.json()
            prediction_data = body.get("predictionData", None)
        except:
            # Request body might be empty, which is fine
            pass
        
        # Generate a unique identity for current user session
        identity = f"user_{int(time.time() * 1000)}"
        room_name = f"plantsense_{identity}"
        
        # Create token with LiveKit API
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token.with_identity(identity).with_name(identity).with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
            )
        )
        
        jwt_token = token.to_jwt()
        
        logger.info(f"Generated voice token for identity: {identity}, room: {room_name}")
        if prediction_data:
            logger.info(f"Prediction data provided: {prediction_data}")
        
        return {
            "token": jwt_token,
            "url": LIVEKIT_URL,
            "room": room_name,
            "predictionData": prediction_data
        }
    except Exception as e:
        logger.error(f"Error generating voice token: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate voice token: {str(e)}")


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Predict plant disease from uploaded image."""
    try:
        #File type and size validation
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        
        image = read_file_as_image(file_content)
        img_batch = np.expand_dims(image, 0)
        
        # Check if model is loaded
        if MODEL is None:
            raise HTTPException(status_code=503, detail="Model not available")
        
        # Prediction Logic
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
                "class": predicted_class,  # Just use the predicted class as is
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
        
        
        
        
        # Get disease info from .json file
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
        

    # Threshold Logic for uncertain predictions
    threshold_pct = CONFIDENCE_THRESHOLD * 100  # Convert threshold to percentage
    if confidence < threshold_pct:
        final_response = {
            "disease": predicted_class,  # Use the actual predicted class name
            "description": description,  # Include the description of the top prediction
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
    
    

