import React, { useState, useEffect } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useVoiceAssistant } from '@livekit/components-react';
import '@livekit/components-styles';
import './VoiceAssistantModal.css';

function VoiceAssistantModal({ isOpen, onClose }) {
  const [token, setToken] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const LIVEKIT_URL = "wss://fafa-bk0tle5p.livekit.cloud" ;
  const API_BASE_URL ="https://plantsense.up.railway.app";

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
  const [agentHasSpoken, setAgentHasSpoken] = useState(false);

  useEffect(() => {
    setIsListening(state === 'listening');
    // Track when agent has spoken for the first time
    if (state === 'speaking' && !agentHasSpoken) {
      setAgentHasSpoken(true);
    }
  }, [state, agentHasSpoken]);

  // Show waiting state until agent speaks
  const isWaiting = !agentHasSpoken && state !== 'speaking';
  const isThinking = state === 'thinking';

  return (
    <div className="voice-assistant-ui">
      <h2>PlantSense AI Voice Assistant</h2>
      
      <div className="voice-status-container">
        <div className={`voice-indicator ${isWaiting ? 'waiting' : isThinking ? 'thinking' : isListening ? 'listening' : 'speaking'}`}>
          <div className="voice-pulse"></div>
          {isThinking && <div className="voice-pulse-secondary"></div>}
          <div className="voice-icon">{isWaiting ? '⏳' : '🎤'}</div>
        </div>
        <div className="voice-state-text">
          {isWaiting ? 'Waiting for agent...' :
           state === 'listening' ? 'Listening...' : 
           state === 'thinking' ? 'Processing your message...' : 
           state === 'speaking' ? 'Speaking...' : 'Connected'}
        </div>
      </div>
      
      <div className="voice-instructions">
        <p>{isWaiting ? 'Please wait while the AI agent initializes...' : 'Describe your plant\'s symptoms or ask about diseases'}</p>
        <p className="voice-tip">{isWaiting ? 'This usually takes just a few seconds' : 'The AI can help diagnose issues and provide treatment advice'}</p>
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
