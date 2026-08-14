import os
import json
import logging
import base64
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

load_dotenv()  # loads .env from the project root
load_dotenv(".env.local")
load_dotenv(os.path.join(os.path.dirname(__file__), "plantsense_voice", ".env.local"))

import numpy as np
import tensorflow as tf
from PIL import Image
from io import BytesIO
import time
import random

app = FastAPI(title="Plant Disease API", description="Plant disease classification with symptoms and remedies")

if os.path.exists("build/static"):
    app.mount("/static", StaticFiles(directory="build/static"), name="static")

CONFIDENCE_THRESHOLD = 0.70

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "service": "PlantSense AI Backend"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    predictionData: Optional[dict] = None
    voice: Optional[str] = "nova" # Options: "nova", "shimmer", "alloy", "echo"

SYSTEM_PROMPT = """You are PlantSense AI, a warm, highly knowledgeable agronomy and plant pathology specialist.
Your goal is to help farmers, gardeners, and plant enthusiasts identify, treat, and prevent plant diseases.

Your specialty covers 17 plant conditions across Maize/Corn, Potato, and Tomato:
- Corn: Cercospora leaf spot, Common rust, Northern Leaf Blight, Healthy
- Potato: Early blight, Late blight, Healthy
- Tomato: Bacterial spot, Early blight, Late blight, Leaf Mold, Septoria leaf spot, Spider mites (Two-spotted), Target Spot, Yellow Leaf Curl Virus, Mosaic virus, Healthy

Guidelines for responses:
1. Provide actionable, practical diagnosis, organic & chemical treatment options, and prevention advice.
2. Keep responses concise, conversational, and natural (between 2 to 4 sentences or concise bullet points).
3. Do NOT use markdown asterisks (*, **) or emojis, as they sound unnatural when spoken by human voice engines.
4. If a diagnosis is provided in the prompt context, acknowledge it directly and offer immediate next steps.
"""

@app.post("/assistant/chat")
async def chat_assistant(req: ChatRequest):
    """Direct AI Chat & High-Quality Voice Assistant endpoint."""
    try:
        openai_key = os.getenv("OPENAI_API_KEY")
        
        system_instruction = SYSTEM_PROMPT
        if req.predictionData:
            pred_disease = req.predictionData.get("disease", "Unknown")
            pred_conf = req.predictionData.get("confidence", "")
            pred_desc = req.predictionData.get("description", "")
            system_instruction += f"\n\nCURRENT DIAGNOSIS CONTEXT: The user is currently viewing analysis for: {pred_disease} (Confidence: {pred_conf}%). Symptoms/Info: {pred_desc}. Reference this disease directly."

        formatted_messages = [{"role": "system", "content": system_instruction}]
        for m in req.messages:
            formatted_messages.append({"role": m.role, "content": m.content})
            
        if openai_key:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=openai_key)
            completion = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=formatted_messages,
                temperature=0.7,
                max_tokens=300,
            )
            reply = completion.choices[0].message.content

            # Generate natural, human-like voice audio using OpenAI TTS
            audio_base64 = None
            try:
                selected_voice = req.voice if req.voice in ["nova", "shimmer", "alloy", "echo", "fable", "onyx"] else "nova"
                tts_resp = await client.audio.speech.create(
                    model="tts-1",
                    voice=selected_voice,
                    input=reply,
                )
                audio_base64 = base64.b64encode(tts_resp.content).decode("utf-8")
            except Exception as tts_err:
                logger.warning(f"OpenAI TTS synthesis error: {tts_err}")

            return {"reply": reply, "audio": audio_base64}
        else:
            last_user_msg = req.messages[-1].content.lower() if req.messages else ""
            reply = "I am PlantSense AI. For best results, ensure proper air circulation, avoid overhead watering, and isolate infected plants immediately."
            if req.predictionData:
                reply = f"Based on your diagnosis of {req.predictionData.get('disease')}, {req.predictionData.get('description', '')}"
            return {"reply": reply, "audio": None}
    except Exception as e:
        logger.error(f"Error in assistant chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
 

# Load disease data
disease_data = []
if os.path.exists("plant_disease_database.json"):
    try:
        with open("plant_disease_database.json", "r") as f:
            disease_data = json.load(f)
    except Exception as e:
        logger.error(f"Error loading disease database: {e}")

MODEL = None
MODEL_PATH = "plant_disease_1.h5"
try:
    if os.path.exists(MODEL_PATH):
        MODEL = tf.keras.models.load_model(MODEL_PATH)
        logger.info(f"Model loaded successfully from {MODEL_PATH}")
    else:
        logger.warning(f"Model file not found at {MODEL_PATH}")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")

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
        image = image.resize((256, 256))
        image_array = np.array(image, dtype=np.float32)
        return image_array
    except Exception as e:
        raise ValueError(f"Error processing image: {str(e)}")
 





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
        # Use a fixed room name so the Windows agent (agent_windows.py) is always in the same room
        room_name = "plant-voice-assistant"
        
        # Create token with LiveKit API
        try:
            from livekit import api
        except ImportError:
            raise HTTPException(status_code=501, detail="LiveKit is not installed on this server.")

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
        
        
        
        
        # Get disease info from .json file - randomly select from all matching entries
        normalized_pred = predicted_class.lower().strip()
        description = "Sorry, There's no detailed information for this disease yet."
        matching_entries = [entry for entry in disease_data if entry["Disease"].lower().strip() == normalized_pred]
        if matching_entries:
            description = random.choice(matching_entries)["response"]

    
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
    
    

