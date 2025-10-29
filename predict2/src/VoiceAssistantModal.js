import React, { useState, useEffect } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useVoiceAssistant } from '@livekit/components-react';
import '@livekit/components-styles';
import './VoiceAssistantModal.css';

function VoiceAssistantModal({ isOpen, onClose }) {
  const [token, setToken] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const LIVEKIT_URL = 'wss://final-llm-a8copwku.livekit.cloud';
  const API_BASE_URL = 'http://127.0.0.1:8000';

  useEffect(() => {
    if (isOpen && !token) {
      connectToVoiceAgent();
    }
  }, [isOpen]);

  const connectToVoiceAgent = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/voice-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get voice token: ${errorText}`);
      }

      const data = await response.json();
      setToken(data.token);
      setConnecting(false);
    } catch (err) {
      console.error('Error connecting to voice agent:', err);
      setError(err.message);
      setConnecting(false);
    }
  };

  const handleClose = () => {
    setToken(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="voice-modal-overlay" onClick={handleClose}>
      <div className="voice-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="voice-modal-close" onClick={handleClose}>×</button>
        
        {!token ? (
          <div className="voice-modal-connecting">
            {connecting ? (
              <>
                <div className="voice-spinner"></div>
                <p>Connecting to PlantSense AI...</p>
              </>
            ) : error ? (
              <>
                <div className="voice-error-icon">⚠️</div>
                <p className="voice-error-text">{error}</p>
                <button className="voice-retry-btn" onClick={connectToVoiceAgent}>
                  Retry Connection
                </button>
              </>
            ) : null}
          </div>
        ) : (
          <LiveKitRoom
            token={token}
            serverUrl={LIVEKIT_URL}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={handleClose}
          >
            <VoiceAssistantUI onDisconnect={handleClose} />
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}

function VoiceAssistantUI({ onDisconnect }) {
  const { state } = useVoiceAssistant();
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsListening(state === 'listening');
    // Only show "Connected" after we've moved past initializing
    if (state && state !== 'initializing') {
      setIsConnected(true);
    }
  }, [state]);

  return (
    <div className="voice-assistant-ui">
      <h2>PlantSense AI Voice Assistant</h2>
      
      <div className="voice-status-container">
        <div className={`voice-indicator ${isListening ? 'listening' : 'speaking'}`}>
          <div className="voice-pulse"></div>
          <div className="voice-icon">🎤</div>
        </div>
        <div className="voice-state-text">
          {!isConnected ? 'Connecting...' :
           state === 'listening' ? 'Listening...' : 
           state === 'thinking' ? 'Thinking...' : 
           state === 'speaking' ? 'Speaking...' : 'Connected'}
        </div>
      </div>
      
      <div className="voice-instructions">
        <p>Describe your plant's symptoms or ask about diseases</p>
        <p className="voice-tip">The AI can help diagnose issues and provide treatment advice</p>
      </div>

      <button 
        className="voice-end-btn"
        onClick={onDisconnect}
      >
        End Conversation
      </button>
    </div>
  );
}

export default VoiceAssistantModal;
