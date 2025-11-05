# PlantSense AI Assistant Components

This document explains how to use the different assistant components in your React app.

## Components Overview

### 1. **TextChatAssistant** - Text-Only Chat
A standalone text chat interface that communicates with the LiveKit voice agent via data channels.

**Features:**
- Pure text-based interaction
- No audio/microphone required
- Chat history display
- Real-time messaging

**Usage:**
```jsx
import TextChatAssistant from './TextChatAssistant';

function App() {
  return <TextChatAssistant />;
}
```

### 2. **HybridAssistant** - Voice + Text Toggle
A unified interface that allows users to switch between voice and text modes dynamically.

**Features:**
- Choose between voice or text before connecting
- Toggle between modes during conversation
- Seamless mode switching
- Shared conversation context

**Usage:**
```jsx
import HybridAssistant from './HybridAssistant';

function App() {
  return <HybridAssistant />;
}
```

### 3. **VoiceAssistant** (Existing) - Voice-Only
Your existing voice-only assistant component.

## Integration Examples

### Example 1: Add Text Chat to Existing App

```jsx
import React, { useState } from 'react';
import VoiceAssistant from './VoiceAssistant';
import TextChatAssistant from './TextChatAssistant';

function PlantDiagnosisPage() {
  const [assistantMode, setAssistantMode] = useState('voice'); // 'voice' or 'text'

  return (
    <div>
      <h1>Plant Disease Diagnosis</h1>
      
      <div className="assistant-mode-selector">
        <button onClick={() => setAssistantMode('voice')}>
          Voice Assistant
        </button>
        <button onClick={() => setAssistantMode('text')}>
          Text Chat
        </button>
      </div>

      {assistantMode === 'voice' ? (
        <VoiceAssistant />
      ) : (
        <TextChatAssistant />
      )}
    </div>
  );
}
```

### Example 2: Use Hybrid Assistant

```jsx
import React from 'react';
import HybridAssistant from './HybridAssistant';

function App() {
  return (
    <div className="app">
      <header>
        <h1>PlantSense AI</h1>
      </header>
      
      <main>
        <HybridAssistant />
      </main>
    </div>
  );
}
```

### Example 3: Modal Integration

```jsx
import React, { useState } from 'react';
import TextChatAssistant from './TextChatAssistant';

function PlantDashboard() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChat(true)}>
        💬 Ask AI Assistant
      </button>

      {showChat && (
        <div className="modal">
          <TextChatAssistant />
          <button onClick={() => setShowChat(false)}>Close</button>
        </div>
      )}
    </div>
  );
}
```

## How It Works

### Text Communication Flow

1. **User sends message:**
   - User types message in text input
   - Message is sent via `room.localParticipant.publishData()` to the `lk.chat` topic
   - Message is displayed in the chat UI

2. **Agent receives and processes:**
   - LiveKit agent automatically monitors the `lk.chat` topic
   - Agent processes the text input through the LLM
   - Agent generates a response

3. **User receives response:**
   - Agent sends response back via the `lk.chat` data channel
   - Frontend receives data via `useDataChannel` hook
   - Response is displayed in the chat UI

### Backend Requirements

**No changes needed!** Your existing LiveKit agent setup already supports text input by default. The agent automatically:
- Listens to the `lk.chat` topic
- Processes text messages through the same LLM pipeline
- Responds via the same data channel

### Disabling Text Input (Optional)

If you want to disable text input for voice-only mode, modify your agent:

```python
# In agent.py or agent_windows.py
await session.start(
    room=ctx.room,
    agent=Assistant(),
    room_input_options=RoomInputOptions(
        text_enabled=False,  # Disable text input
        noise_cancellation=noise_cancellation.BVC(),
    ),
)
```

## Customization

### Styling
Each component has its own CSS file:
- `TextChatAssistant.css`
- `HybridAssistant.css`

Modify these files to match your app's design.

### Custom Message Handling

You can add custom logic for handling messages:

```jsx
const onDataReceived = (payload, participant, kind, topic) => {
  if (topic === 'lk.chat') {
    const decoder = new TextDecoder();
    const text = decoder.decode(payload);
    
    // Custom processing
    if (text.includes('disease')) {
      // Highlight disease mentions
    }
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: text,
      sender: 'agent',
      timestamp: new Date()
    }]);
  }
};
```

## Environment Variables

Make sure these are set in your `.env` file:

```env
REACT_APP_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
REACT_APP_API_BASE_URL=https://your-backend-url.com
```

## Testing

1. Start your LiveKit agent:
   ```bash
   cd plantsense_voice
   python agent_windows.py
   # or
   python start_agent.py
   ```

2. Start your React app:
   ```bash
   cd predict2
   npm start
   ```

3. Test text chat:
   - Click "Chat with PlantSense AI"
   - Type a message like "My tomato plant has brown spots"
   - Wait for the agent's response

## Troubleshooting

### Messages not sending
- Check browser console for errors
- Verify LiveKit connection is established
- Ensure agent is running and connected to the room

### No response from agent
- Check agent logs for errors
- Verify the agent is listening to `lk.chat` topic
- Ensure LLM API keys are configured

### Audio not working in hybrid mode
- Check browser microphone permissions
- Verify audio is enabled in LiveKit room settings
- Test with voice-only component first

## Advanced: Custom Text Input Handler

If you need custom text processing on the agent side:

```python
# In your agent file
from livekit.agents import AgentSession, RoomInputOptions
from livekit.agents.voice.room_io import TextInputEvent

def custom_text_input_handler(session: AgentSession, event: TextInputEvent) -> None:
    message = event.text
    
    # Custom command handling
    if message.startswith('/'):
        if message == '/help':
            session.say("Available commands: /help, /diseases")
            return
    
    # Default behavior
    session.interrupt()
    session.generate_reply(user_input=message)

# Use in session start
session = AgentSession(
    # ... other config
    room_input_options=RoomInputOptions(
        text_input_cb=custom_text_input_handler
    )
)
```

## Next Steps

1. Choose which component fits your needs best
2. Import and integrate into your app
3. Customize styling to match your design
4. Test with your LiveKit agent
5. Deploy!

For more information, see the [LiveKit Agents documentation](https://docs.livekit.io/agents/build/text/).
