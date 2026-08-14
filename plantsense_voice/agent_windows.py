"""
Windows-compatible voice agent that connects directly to LiveKit rooms.
Compatible with livekit-agents v1.6+
"""
import asyncio
import logging
import os
from dotenv import load_dotenv
from livekit import rtc, api
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.agents.utils import http_context
from livekit.plugins import noise_cancellation, silero

# Load environment variables
load_dotenv(".env.local")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are PlantSense Voice Assistant, a specialized AI for plant disease diagnosis and treatment.

            Your capabilities:
            - Help users identify plant diseases based on their descriptions
            - Provide detailed treatment advice and remedies
            - Answer questions about plant health, symptoms, and care
            - Guide users through the diagnosis process

            Your knowledge includes diseases for:
            - Corn/Maize (Cercospora leaf spot, Common rust, Northern Leaf Blight)
            - Potato (Early blight, Late blight)
            - Tomato (Bacterial spot, Early blight, Late blight, Leaf Mold, Septoria leaf spot, Spider mites, Target Spot, Yellow Leaf Curl Virus, Mosaic virus)

            Communication style:
            - Be conversational, friendly, and empathetic
            - Use clear, simple language without technical jargon unless necessary
            - Keep responses concise and to the point
            - No emojis, asterisks, or complex formatting in speech
            - Ask clarifying questions when needed""",
        )


async def run_agent_in_room(room_name: str):
    """Connect to a LiveKit room and run the agent."""
    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    token.with_identity("plant-assistant-agent")
    token.with_name("PlantSense AI")
    token.with_grants(api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True,
    ))
    
    room = rtc.Room()
    
    try:
        logger.info(f"Connecting to room: {room_name}")
        await room.connect(LIVEKIT_URL, token.to_jwt())
        logger.info(f"Connected to room: {room_name}")
        
        # livekit-agents v1.6+: no manual HTTP session setup needed
        session = AgentSession(
            stt="assemblyai/universal-streaming:en",
            llm="openai/gpt-4.1-mini",
            tts="cartesia/sonic-2:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
            vad=silero.VAD.load(),
        )
        
        await session.start(
            room=room,
            agent=Assistant(),
            room_input_options=RoomInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
                text_enabled=True,
            ),
        )
        
        await session.generate_reply(
            instructions="Greet the user warmly as PlantSense-AI Voice Assistant. Let them know you can help diagnose plant diseases and provide treatment advice. Ask them to describe their plant issue or tell you what plant they are concerned about."
        )
        
        logger.info("Agent session started successfully")
        
        # Keep alive until room disconnects
        while room.connection_state == rtc.ConnectionState.CONN_CONNECTED:
            await asyncio.sleep(1)
            
    except Exception as e:
        logger.error(f"Error in agent: {e}", exc_info=True)
    finally:
        await room.disconnect()
        logger.info("Disconnected from room")


async def monitor_rooms():
    """Connect to the fixed room and restart on crash."""
    logger.info("🌱 PlantSense Voice Agent (Windows Mode) starting...")
    logger.info(f"LiveKit URL: {LIVEKIT_URL}")
    
    ROOM_NAME = "plant-voice-assistant"
    logger.info(f"Joining room: {ROOM_NAME}")
    
    async with http_context.open():
        while True:
            try:
                await run_agent_in_room(ROOM_NAME)
            except Exception as e:
                logger.error(f"Agent crashed, restarting in 5 seconds: {e}")
                await asyncio.sleep(5)


if __name__ == "__main__":
    try:
        asyncio.run(monitor_rooms())
    except KeyboardInterrupt:
        print("\n👋 Agent stopped")
