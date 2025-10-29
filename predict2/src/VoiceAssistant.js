import React, { useState, useEffect, useCallback } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useVoiceAssistant } from '@livekit/components-react';
import '@livekit/components-styles';
import './VoiceAssistant.css';

function VoiceAssistantComponent() {
  const [token, setToken] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const LIVEKIT_URL = process.env.REACT_APP_LIVEKIT_URL || 'wss://final-llm-a8copwku.livekit.cloud';
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

  const connectToVoiceAgent = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      // Request a token from your backend
      const response = await fetch(`${API_BASE_URL}/voice-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get voice token');
      }

      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      console.error('Error connecting to voice agent:', err);
      setError(err.message);
      setConnecting(false);
    }
  };

  const disconnectFromVoiceAgent = () => {
    setToken(null);
    setConnecting(false);
  };

  return (
    <div className="voice-assistant-container">
      {!token ? (
        <div className="voice-assistant-controls">
          <button 
            className="voice-connect-btn"
            onClick={connectToVoiceAgent}
            disabled={connecting}
          >
            {connecting ? '🔄 Connecting...' : '🎤 Talk to PlantSense AI'}
          </button>
          {error && <div className="voice-error">Error: {error}</div>}
          <p className="voice-hint">
            Click to start a voice conversation with our AI assistant about your plant health concerns
          </p>
        </div>
      ) : (
        <LiveKitRoom
          token={token}
          serverUrl={LIVEKIT_URL}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={disconnectFromVoiceAgent}
        >
          <VoiceAssistantUI onDisconnect={disconnectFromVoiceAgent} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}
    </div>
  );
}

function VoiceAssistantUI({ onDisconnect }) {
  const { state, audioTrack } = useVoiceAssistant();
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setIsListening(state === 'listening');
  }, [state]);

  return (
    <div className="voice-assistant-active">
      <div className="voice-status">
        <div className={`voice-indicator ${isListening ? 'listening' : 'speaking'}`}>
          <div className="voice-pulse"></div>
          <div className="voice-icon">🎤</div>
        </div>
        <div className="voice-state-text">
          {state === 'listening' ? 'Listening...' : 
           state === 'thinking' ? 'Thinking...' : 
           state === 'speaking' ? 'Speaking...' : 'Connected'}
        </div>
      </div>
      
      <div className="voice-info">
        <p>PlantSense AI Voice Assistant is active</p>
        <p className="voice-tip">Describe your plant's symptoms or ask about diseases</p>
      </div>

      <button 
        className="voice-disconnect-btn"
        onClick={onDisconnect}
      >
        End Conversation
      </button>
    </div>
  );
}

export default VoiceAssistantComponent;
