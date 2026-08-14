import React, { useState, useEffect } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useVoiceAssistant, useRoomContext } from '@livekit/components-react';
import { Leaf, Mic, X, Loader, AlertCircle, BrainCircuit, Volume2 } from 'lucide-react';
import '@livekit/components-styles';
import './HybridAssistantModal.css';
import { RoomEvent } from 'livekit-client';

function HybridAssistantModal({ isOpen, onClose, predictionData }) {
  const [token, setToken] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const LIVEKIT_URL = "wss://fafa-bk0tle5p.livekit.cloud";
  const API_BASE_URL = "https://plant-disease-detector-production-6e4b.up.railway.app";

  useEffect(() => {
    if (isOpen && !token) {
      connectToAssistant();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const connectToAssistant = async () => {
    setConnecting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/voice-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          predictionData: predictionData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get token');
      }

      const data = await response.json();
      setToken(data.token);
      setConnecting(false);
    } catch (err) {
      console.error('Error connecting to assistant:', err);
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
    <div className="hybrid-modal-overlay" onClick={handleClose}>
      <div className="hybrid-modal-content" onClick={(e) => e.stopPropagation()}>
        {!token ? (
          <div className="hybrid-modal-connecting">
            {connecting ? (
              <>
                <div className="hybrid-spinner"></div>
                <p>Connecting to PlantSense Voice AI...</p>
              </>
            ) : error ? (
              <>
                <AlertCircle className="hybrid-error-icon" size={48} color="#d32f2f" />
                <p className="hybrid-error-text">{error}</p>
                <button className="hybrid-retry-btn" onClick={connectToAssistant}>
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
            <VoiceAssistantUI
              onDisconnect={handleClose}
              predictionData={predictionData}
            />
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}

function VoiceAssistantUI({ onDisconnect, predictionData }) {
  const [liveCaption, setLiveCaption] = useState('');
  const [predictionSent, setPredictionSent] = useState(false);
  const room = useRoomContext();
  const { state } = useVoiceAssistant();

  // Listen for agent speech transcriptions for live subtitle captions
  useEffect(() => {
    if (!room) return;

    const handleTranscription = (segments, participant) => {
      if (participant?.identity !== room.localParticipant.identity) {
        const finalSegments = segments.filter(s => s.final);
        const nonFinalSegments = segments.filter(s => !s.final);

        let text = '';
        if (finalSegments.length > 0) {
          text = finalSegments.map(s => s.text).join(' ').trim();
        } else if (nonFinalSegments.length > 0) {
          text = nonFinalSegments.map(s => s.text).join(' ').trim();
        }

        if (text) {
          setLiveCaption(text);
        }
      }
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);

    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }, [room]);

  // Send diagnosis context to agent on initial room connection
  useEffect(() => {
    if (room && predictionData && !predictionSent) {
      const predictionMessage = `The user just analyzed a plant image. Here is the diagnosis context: Disease: ${predictionData.disease}, Confidence: ${predictionData.confidence}%, Description: ${predictionData.description}. Be ready to answer questions regarding treatment and care.`;

      const sendPred = async () => {
        try {
          if (room.localParticipant && room.state === 'connected') {
            await room.localParticipant.sendText(predictionMessage, { topic: 'lk.chat' });
            setPredictionSent(true);
          }
        } catch (err) {
          console.error('Error sending diagnosis context:', err);
        }
      };
      sendPred();
    }
  }, [room, predictionData, predictionSent]);

  const isWaiting = state === 'initializing' || state === 'disconnected' || !state;
  const isThinking = state === 'thinking';
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';

  return (
    <div className="hybrid-modal-ui voice-only-ui">
      <div className="hybrid-modal-header">
        <div className="hybrid-modal-header-info">
          <h3><Leaf size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> PlantSense.AI</h3>
          <span className="hybrid-modal-mode-badge">
            <Mic size={14} style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} /> Voice Assistant
          </span>
        </div>
        <div className="hybrid-modal-header-actions">
          <button className="hybrid-modal-close-btn" onClick={onDisconnect} title="Close Voice Assistant">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="modal-voice-mode">
        <div className="modal-voice-status-container">
          <div className={`modal-voice-indicator ${isWaiting ? 'waiting' : isThinking ? 'thinking' : isListening ? 'listening' : isSpeaking ? 'speaking' : 'ready'}`}>
            <div className="modal-voice-pulse"></div>
            {isThinking && <div className="modal-voice-pulse-secondary"></div>}
            <div className="modal-voice-icon">
              {isWaiting ? <Loader className="spin" size={44} color="#7a9c7a" /> :
                isListening ? <Mic size={44} color="#3e5c3e" /> :
                  isThinking ? <BrainCircuit size={44} color="#3e5c3e" /> :
                    isSpeaking ? <Volume2 size={44} color="#2b3a2f" /> :
                      <Mic size={44} color="#2b3a2f" />}
            </div>
          </div>
          <div className="modal-voice-state-text">
            {isWaiting ? 'Initializing Voice Agent...' :
              state === 'listening' ? 'Listening...' :
                state === 'thinking' ? 'Thinking...' :
                  state === 'speaking' ? 'Speaking...' : 'Ready'}
          </div>
        </div>

        {/* Live Subtitle Caption */}
        {liveCaption && isSpeaking && (
          <div className="voice-live-caption">
            <p>"{liveCaption}"</p>
          </div>
        )}

        <div className="modal-voice-instructions">
          <p>
            {isWaiting
              ? 'Please wait while the AI agent connects to the audio channel...'
              : isListening
                ? 'Listening to you... speak your question naturally.'
                : isSpeaking
                  ? 'PlantSense AI is speaking. You can speak to interrupt anytime.'
                  : 'Speak naturally about your plant health concerns and remedies.'}
          </p>
          <p className="modal-voice-tip">
            🌿 Powered by real-time speech AI & plant pathology intelligence
          </p>
        </div>
      </div>
    </div>
  );
}

export default HybridAssistantModal;
