from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from database.models import Base, Disease, Symptom, Remedy
import uvicorn
import numpy as np 
from io import BytesIO
from PIL import Image
import tensorflow as tf
from typing import List, Optional
import logging
import os



# If using Windows Authentication
connection_string = ("postgresql://plantdb_ug30_user:eoRp81LDAYiK8CBCjpjEsSqwUQaA6Go9@dpg-d3kckcd6ubrc73ds5nlg-a.oregon-postgres.render.com/plantdb_ug30")

engine = create_engine(connection_string)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



app = FastAPI(title="Plant Disease API", description="Plant disease classification with symptoms and remedies")
templates = Jinja2Templates(directory="frontend")

# Enable CORS with more restrictive settings for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load your existing model with error handling
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
    "Corn Cercospora leaf spot Gray leaf spot", 'Corn Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy',
    'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
    'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
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

@app.get("/")
async def root():
    return {"message": "Plant Disease Classification API with Database"}

@app.get("/health")
async def health_check():
    """Health check endpoint to verify API and model status."""
    model_status = "loaded" if MODEL is not None else "failed"
    return {
        "status": "healthy" if MODEL is not None else "unhealthy",
        "model_status": model_status,
        "database": "connected"  # You could add actual DB health check here
    }

@app.get("/predict", response_class=HTMLResponse)
async def get_predict_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


    

@app.post("/predict")
async def predict(file: UploadFile = File(...), db: Session = Depends(get_db)):
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
        confidence = float(np.max(probabilities))
        predicted_class = CLASS_NAMES[predicted_index] if predicted_index < len(CLASS_NAMES) else str(predicted_index)
        
        # Log top 3 predictions for debugging
        top3_indices = np.argsort(probabilities)[-3:][::-1]
        logger.info(f"Top 3 predictions:")
        for i, idx in enumerate(top3_indices):
            class_name = CLASS_NAMES[idx] if idx < len(CLASS_NAMES) else str(idx)
            logger.info(f"  {i+1}. {class_name} (index {idx}): {probabilities[idx]:.4f}")
        
        # Log some statistics about the predictions
        logger.info(f"Prediction stats: min={np.min(probabilities):.4f}, max={np.max(probabilities):.4f}, mean={np.mean(probabilities):.4f}")
        
        # Get disease information from database with eager loading
        from sqlalchemy.orm import joinedload
        disease_info = db.query(Disease).options(
            joinedload(Disease.symptoms),
            joinedload(Disease.remedies)
        ).filter(Disease.name == predicted_class).first()
        
        response = {
            "class": predicted_class,
            "confidence": confidence,
            "index": predicted_index,
        }
        
        # Add database information if disease exists
        if disease_info:
            response["disease_info"] = {
                "id": disease_info.id,
                "scientific_name": disease_info.scientific_name,
                "plant_type": disease_info.plant_type,
                "severity_level": disease_info.severity_level,
                "description": disease_info.description,
                "symptoms": [{"name": s.name, "description": s.description} for s in disease_info.symptoms],
                "remedies": [{"name": r.name, "type": r.type, "description": r.description} for r in disease_info.remedies]
            }
        
        logger.info(f"Prediction completed: {predicted_class} with confidence {confidence:.4f}")
        return response
    
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# New endpoints for database management
@app.get("/diseases/", response_model=List[dict])
async def get_diseases(db: Session = Depends(get_db)):
    """Get list of all diseases."""
    try:
        diseases = db.query(Disease).all()
        return [{"id": d.id, "name": d.name, "plant_type": d.plant_type, "severity_level": d.severity_level} for d in diseases]
    except Exception as e:
        logger.error(f"Error fetching diseases: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/diseases/{disease_id}")
async def get_disease_details(disease_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific disease."""
    try:
        from sqlalchemy.orm import joinedload
        disease = db.query(Disease).options(
            joinedload(Disease.symptoms),
            joinedload(Disease.remedies)
        ).filter(Disease.id == disease_id).first()
        
        if not disease:
            raise HTTPException(status_code=404, detail="Disease not found")
        
        return {
            "id": disease.id,
            "name": disease.name,
            "scientific_name": disease.scientific_name,
            "plant_type": disease.plant_type,
            "severity_level": disease.severity_level,
            "description": disease.description,
            "symptoms": [{"name": s.name, "description": s.description} for s in disease.symptoms],
            "remedies": [{"name": r.name, "description": r.description, "type": r.type} for r in disease.remedies]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    # Create database tables if they don't exist
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")
    
    uvicorn.run(app, host="localhost", port=8080, log_level="info")
