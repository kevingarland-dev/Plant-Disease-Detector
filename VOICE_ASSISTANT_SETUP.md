# PlantSense.AI Voice Assistant Integration Guide

This guide explains how to set up and use the LiveKit voice agent integrated with your Plant Disease Detector.

## Overview

The voice assistant allows users to:
- Describe plant symptoms verbally
- Get disease diagnoses through conversation
- Receive treatment recommendations
- Ask questions about plant health

## Architecture

The integration consists of three main components:

1. **LiveKit Voice Agent** (`plantsense_voice/agent.py`)
   - Powered by OpenAI GPT-4.1-mini for natural language understanding
   - Uses AssemblyAI for speech-to-text
   - Uses Cartesia for text-to-speech
   - Has access to plant disease database

2. **FastAPI Backend** (`plantapi.py`)
   - Generates LiveKit tokens for secure connections
   - Serves the plant disease prediction API
   - Provides disease information to the voice agent

3. **React Frontend** (`predict2/src/VoiceAssistant.js`)
   - User interface for voice conversations
   - Connects to LiveKit rooms
   - Visual feedback for listening/speaking states

## Setup Instructions

### 1. Backend Setup (Python)

#### Install Dependencies

For the main API:
```bash
pip install -r requirements.txt
```

For the voice agent:
```bash
cd plantsense_voice
pip install -e .
```

#### Environment Variables

Make sure your `.env` or `plantsense_voice/.env.local` contains:
```
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
OPENAI_API_KEY=your_openai_key
ASSEMBLYAI_API_KEY=your_assemblyai_key
CARTESIA_API_KEY=your_cartesia_key
```

### 2. Frontend Setup (React)

#### Install Dependencies

```bash
cd predict2
npm install
```

This will install:
- `@livekit/components-react` - React components for LiveKit
- `@livekit/components-styles` - Styling for LiveKit components
- `livekit-client` - LiveKit client SDK

#### Environment Variables (Optional)

Create `predict2/.env` if you want to override defaults:
```
REACT_APP_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
REACT_APP_API_BASE_URL=http://localhost:8000
```

### 3. Running the Application

#### Start the FastAPI Backend

```bash
uvicorn plantapi:app --reload --host 0.0.0.0 --port 8000
```

#### Start the LiveKit Voice Agent

In a separate terminal:
```bash
cd plantsense_voice
python agent.py start
```

Or using the LiveKit CLI:
```bash
cd plantsense_voice
livekit-agent start
```

#### Start the React Frontend

In another terminal:
```bash
cd predict2
npm start
```

The app will be available at `http://localhost:3000`

## Usage

### Accessing the Voice Assistant

1. Navigate to the predict page: `http://localhost:3000/predict`
2. If you get an uncertain prediction, click the "🎤 Try Voice Assistant" button
3. Or directly go to: `http://localhost:3000/voice`

### Using the Voice Assistant

1. Click "🎤 Talk to PlantSense AI" button
2. Allow microphone access when prompted
3. Wait for the assistant to greet you
4. Describe your plant's symptoms or ask questions
5. The assistant will:
   - Ask clarifying questions
   - Search the disease database
   - Provide diagnosis and treatment advice
6. Click "End Conversation" when done

### Example Conversations

**Example 1: Describing symptoms**
```
User: "My tomato plant has yellow spots on the leaves"
Assistant: "I can help with that. Are the spots circular or irregular? 
           And are they appearing on older or newer leaves?"
User: "They're circular and on the older leaves"
Assistant: "Based on those symptoms, it sounds like Tomato Septoria leaf spot..."
```

**Example 2: Direct disease inquiry**
```
User: "Tell me about corn common rust"
Assistant: "Corn Common rust is a fungal disease that affects corn plants..."
```

## API Endpoints

### POST /voice-token

Generates a LiveKit access token for connecting to the voice agent.

**Response:**
```json
{
  "token": "eyJhbGc...",
  "url": "wss://your-livekit-url.livekit.cloud",
  "room": "plantsense_user_1234567890"
}
```

### POST /predict

Existing endpoint for image-based disease prediction (unchanged).

## Voice Agent Functions

The agent has access to two main functions:

### `get_disease_info(disease_name: str)`
Retrieves detailed information about a specific disease from the database.

### `search_disease_by_symptoms(plant_type: str, symptoms: str)`
Searches for diseases matching the described symptoms for a specific plant type.

## Troubleshooting

### Voice agent not connecting
- Verify LiveKit credentials in `.env.local`
- Check that the LiveKit agent is running
- Ensure the backend is generating tokens correctly

### No audio output
- Check browser permissions for microphone
- Verify Cartesia API key is valid
- Check browser console for errors

### Agent not responding
- Verify OpenAI API key has sufficient credits
- Check AssemblyAI API key is valid
- Review agent logs for errors

### CORS errors
- Ensure FastAPI CORS middleware is configured correctly
- Check that frontend is making requests to the correct backend URL

## Customization

### Modifying Agent Instructions

Edit `plantsense_voice/agent.py`, line 33-60 to customize the agent's behavior and personality.

### Adding More Disease Data

Update `plant_disease_dataset.json` with additional disease information. The agent will automatically have access to it.

### Styling the Voice Interface

Edit `predict2/src/VoiceAssistant.css` to customize the appearance of the voice interface.

## Production Deployment

### Backend
1. Deploy FastAPI app to a cloud service (Render, Railway, etc.)
2. Set environment variables in the deployment platform
3. Deploy LiveKit agent as a separate service or worker

### Frontend
1. Build the React app: `npm run build`
2. Deploy to Netlify, Vercel, or similar
3. Set environment variables for production URLs

### LiveKit Cloud
- Use LiveKit Cloud for production-grade voice infrastructure
- Configure webhook endpoints for monitoring
- Set up proper room management and cleanup

## Security Considerations

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Implement rate limiting on token generation endpoint
- Consider adding authentication for production use
- Rotate API keys regularly

## Cost Optimization

- Monitor OpenAI API usage (GPT-4.1-mini is cost-effective)
- Set up usage alerts for AssemblyAI and Cartesia
- Implement session timeouts to prevent abandoned connections
- Consider caching common disease queries

## Support

For issues or questions:
- Check the LiveKit documentation: https://docs.livekit.io
- Review OpenAI API docs: https://platform.openai.com/docs
- Check AssemblyAI docs: https://www.assemblyai.com/docs
