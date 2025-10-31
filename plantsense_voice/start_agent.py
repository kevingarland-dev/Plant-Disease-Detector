"""
Windows-compatible startup script for the LiveKit voice agent.
Run this instead of 'python agent.py dev' on Windows.
"""
import asyncio
import logging
import os
from dotenv import load_dotenv
from livekit import agents, rtc

# Import the entrypoint from agent.py
from agent import entrypoint

# Load environment variables
load_dotenv(".env.local")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def main():
    """Start the agent worker."""
    # Disable IPC for Windows compatibility
    worker_options = agents.WorkerOptions(
        entrypoint_fnc=entrypoint,
        initialize_process_fnc=None,  # Disable process initialization
    )
    
    worker = agents.Worker(worker_options)
    
    print("🌱 PlantSense Voice Agent starting...")
    print(f"LiveKit URL: {os.getenv('LIVEKIT_URL')}")
    print("Waiting for connections...")
    
    await worker.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Agent stopped")
