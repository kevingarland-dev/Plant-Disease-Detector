from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import noise_cancellation, silero

load_dotenv(".env.local")


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
            - Ask clarifying questions when needed
            
            When a user describes symptoms:
            1. Ask about the plant type if not mentioned
            2. Inquire about specific symptoms (leaf color, spots, wilting, etc.)
            3. Provide your best diagnosis with confidence level
            4. Offer treatment recommendations
            5. Suggest preventive measures
            
            Always be helpful and encouraging to farmers and plant enthusiasts.""",
        )


async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        stt="assemblyai/universal-streaming:en",
        llm="openai/gpt-4.1-mini",
        tts="cartesia/sonic-2:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
        vad=silero.VAD.load(),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            # For telephony applications, use `BVCTelephony` instead for best results
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    await session.generate_reply(
        instructions="Greet the user warmly as PlantSense.AI Voice Assistant. Let them know you can help diagnose plant diseases and provide treatment advice. Ask them to describe their plant issue or tell you what plant they're concerned about."
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))