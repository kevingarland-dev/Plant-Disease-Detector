"""
Windows-compatible voice agent that connects directly to LiveKit rooms.
This bypasses the Worker framework which has Windows compatibility issues.
"""
import asyncio
import logging
import os
import aiohttp
from dotenv import load_dotenv
from livekit import rtc, api
from livekit.agents import AgentSession, Agent, RoomInputOptions, JobContext, JobRequest, utils
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
            instructions="""You are a helpful voice AI assistant.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            You are curious, friendly, and have a sense of humor.
            You will assist users with information relating to a disease their plant has.
            You will provide treatment advice based on the disease the user describes
            You will ask relevant questions to diagnose the disease and provide treatment options.
            If you are unsure about something, you will ask for clarification.""",
        )


async def run_agent_in_room(room_name: str, http_session: aiohttp.ClientSession):
    """Connect to a LiveKit room and run the agent."""
    # Generate token for the agent
    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    token.with_identity("plant-assistant-agent")
    token.with_name("PlantSense AI")
    token.with_grants(api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True,
    ))
    
    # Create room instance
    room = rtc.Room()
    
    try:
        logger.info(f"Connecting to room: {room_name}")
        await room.connect(LIVEKIT_URL, token.to_jwt())
        logger.info(f"Connected to room: {room_name}")
        
        # Set up HTTP session context for plugins
        utils.http_context._session_stack.set([http_session])
        
        # Start agent session
        session = AgentSession(
            stt="assemblyai/universal-streaming:en",
            llm="openai/gpt-4.1-mini",
            tts="cartesia/sonic-2:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
            vad=silero.VAD.load(),
            # turn_detection removed - not compatible with direct connection
        )
        
        await session.start(
            room=room,
            agent=Assistant(),
            room_input_options=RoomInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
                text_enabled=True,  # Explicitly enable text input
            ),
        )
        
        await session.generate_reply(
            instructions="Greet the user and offer your assistance."
        )
        
        logger.info("Agent session started successfully")
        
        # Keep the connection alive
        while room.connection_state == rtc.ConnectionState.CONN_CONNECTED:
            await asyncio.sleep(1)
            
    except Exception as e:
        logger.error(f"Error in agent: {e}", exc_info=True)
    finally:
        await room.disconnect()
        logger.info("Disconnected from room")


async def monitor_rooms():
    """Monitor for new rooms and connect agents to them."""
    logger.info("🌱 PlantSense Voice Agent (Windows Mode) starting...")
    logger.info(f"LiveKit URL: {LIVEKIT_URL}")
    logger.info("Monitoring for room connections...")
    
    # Create persistent HTTP session
    async with aiohttp.ClientSession() as http_session:
        # For simplicity, we'll connect to a fixed room name
        # In production, you'd want to monitor for new rooms via webhooks
        ROOM_NAME = "plant-voice-assistant"
        
        while True:
            try:
                await run_agent_in_room(ROOM_NAME, http_session)
            except Exception as e:
                logger.error(f"Agent crashed, restarting in 5 seconds: {e}")
                await asyncio.sleep(5)


if __name__ == "__main__":
    try:
        asyncio.run(monitor_rooms())
    except KeyboardInterrupt:
        print("\n👋 Agent stopped")
