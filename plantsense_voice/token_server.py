from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
import os
from dotenv import load_dotenv

load_dotenv(".env.local")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LiveKit credentials
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://final-llm-a8copwku.livekit.cloud")

@app.get("/")
async def root():
    return {"message": "PlantSense LiveKit Token Server", "status": "running"}

@app.post("/voice-token")
async def get_voice_token():
    """Generate a LiveKit token for voice chat"""
    try:
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
            raise HTTPException(
                status_code=500,
                detail="LiveKit credentials not configured"
            )
        
        # Generate a unique room name
        import uuid
        room_name = f"plantsense-{uuid.uuid4().hex[:8]}"
        
        # Create token
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token.with_identity(f"user-{uuid.uuid4().hex[:8]}")
        token.with_name("PlantSense User")
        token.with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
            )
        )
        
        jwt_token = token.to_jwt()
        
        return {
            "token": jwt_token,
            "url": LIVEKIT_URL,
            "room": room_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
