import React, { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useVoiceAssistant, useRoomContext, useDataChannel, useChat } from '@livekit/components-react';
import '@livekit/components-styles';
import './HybridAssistantModal.css';

function HybridAssistantModal({ isOpen, onClose, predictionData }) {
  const [token, setToken] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('voice'); // 'voice' or 'text'

  const LIVEKIT_URL = "wss://fafa-bk0tle5p.livekit.cloud" ;
  const API_BASE_URL ="https://plantsense.up.railway.app";

  useEffect(() => {
    if (isOpen && !token) {
      connectToAssistant();
    }
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
                <p>Connecting to PlantSense AI...</p>
              </>
            ) : error ? (
              <>
                <div className="hybrid-error-icon">⚠️</div>
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
            audio={mode === 'voice'}
            video={false}
            onDisconnected={handleClose}
          >
            <HybridUI 
              initialMode={mode} 
              onDisconnect={handleClose}
              onModeChange={setMode}
              predictionData={predictionData}
            />
            {mode === 'voice' && <RoomAudioRenderer />}
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}

function HybridUI({ initialMode, onDisconnect, onModeChange, predictionData }) {
  const [mode, setMode] = useState(initialMode);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [predictionSent, setPredictionSent] = useState(false);
  const messagesEndRef = useRef(null);
  const room = useRoomContext();
  const { state } = useVoiceAssistant();

  // Listen for incoming text messages from the agent
  const onDataReceived = (payload, participant, kind, topic) => {
    console.log('🔔 Data received:', { 
      topic, 
      kind, 
      participantIdentity: participant?.identity,
      localIdentity: room?.localParticipant?.identity,
      payloadType: typeof payload,
      payloadLength: payload?.length || payload?.byteLength
    });
    
    // Try to decode the payload
    let text;
    try {
      if (typeof payload === 'string') {
        text = payload;
      } else if (payload instanceof Uint8Array || payload instanceof ArrayBuffer) {
        const decoder = new TextDecoder();
        text = decoder.decode(payload);
      } else {
        console.warn('Unknown payload type:', payload);
        return;
      }
      
      console.log('📝 Decoded text:', text);
      console.log('👤 From participant:', participant?.identity);
      console.log('🏠 Local participant:', room?.localParticipant?.identity);
      
      // Add message if it's from someone else
      if (participant?.identity !== room?.localParticipant?.identity) {
        console.log('✅ Adding message to chat');
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: text,
          sender: 'agent',
          timestamp: new Date()
        }]);
      } else {
        console.log('⏭️ Skipping own message');
      }
    } catch (error) {
      console.error('Error decoding message:', error);
    }
  };

  // Listen to lk.chat (for user messages)
  useDataChannel('lk.chat', onDataReceived);

  // Listen for transcription messages (agent responses) using text stream
  useEffect(() => {
    if (!room) return;

    const handleTextStream = async (text, participant, publication) => {
      console.log('📨 Text stream received:', { 
        text, 
        participant: participant?.identity,
        topic: publication?.topic 
      });
      
      if (participant?.identity !== room.localParticipant.identity) {
        console.log('✅ Adding text to chat from:', participant?.identity);
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: text,
          sender: 'agent',
          timestamp: new Date()
        }]);
      }
    };

    // Subscribe to text streams from remote participants
    const subscribeToTextStreams = async () => {
      for (const [, participant] of room.remoteParticipants) {
        console.log('👥 Subscribing to text from:', participant.identity);
        
        // Listen for text received from this participant
        participant.on('textReceived', (text, publication) => {
          handleTextStream(text, participant, publication);
        });
      }
    };

    // Subscribe to existing participants
    subscribeToTextStreams();

    // Subscribe to new participants
    const handleParticipantConnected = (participant) => {
      console.log('🆕 New participant connected:', participant.identity);
      participant.on('textReceived', (text, publication) => {
        handleTextStream(text, participant, publication);
      });
    };

    room.on('participantConnected', handleParticipantConnected);

    return () => {
      room.off('participantConnected', handleParticipantConnected);
      // Clean up participant listeners
      for (const [, participant] of room.remoteParticipants) {
        participant.off('textReceived', handleTextStream);
      }
    };
  }, [room]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send prediction data to agent when room connects
  useEffect(() => {
    if (room && predictionData && !predictionSent) {
      const predictionMessage = `The user just analyzed a plant image. Here's the diagnosis: Disease: ${predictionData.disease}, Confidence: ${predictionData.confidence}%, Description: ${predictionData.description}. Please acknowledge this information and be ready to provide more detailed advice about this disease.`;
      
      try {
        room.localParticipant.sendText(predictionMessage, { topic: 'lk.chat' });
        setPredictionSent(true);
        console.log('✅ Prediction data sent to agent');
      } catch (err) {
        console.error('Error sending prediction data:', err);
      }
    }
  }, [room, predictionData, predictionSent]);

  // Add welcome message when connected in text mode
  useEffect(() => {
    if (room && mode === 'text' && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        text: "Hello! I'm PlantSense AI. I can help you diagnose plant diseases and provide treatment advice. What plant issue can I help you with today?",
        sender: 'agent',
        timestamp: new Date()
      }]);
    }
  }, [room, mode]);

  const sendMessage = async () => {
    if (!inputText.trim() || isSending || !room) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Add user message to chat
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    }]);

    try {
      // Send text to the agent via LiveKit text stream
      console.log('Sending text message:', userMessage);
      await room.localParticipant.sendText(userMessage, { topic: 'lk.chat' });
      console.log('Text message sent successfully');
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "Sorry, I couldn't send your message. Please try again.",
        sender: 'system',
        timestamp: new Date()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'voice' ? 'text' : 'voice';
    setMode(newMode);
    onModeChange(newMode);
    
    if (newMode === 'text' && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        text: "Switched to text mode. How can I help you with your plants?",
        sender: 'agent',
        timestamp: new Date()
      }]);
    }
  };

  return (
    <div className="hybrid-modal-ui">
      <div className="hybrid-modal-header">
        <div className="hybrid-modal-header-info">
          <h3>🌱 PlantSense AI</h3>
          <span className="hybrid-modal-mode-badge">
            {mode === 'voice' ? '🎤 Voice Mode' : '💬 Text Mode'}
          </span>
        </div>
        <div className="hybrid-modal-header-actions">
          <button 
            className="modal-mode-toggle-btn"
            onClick={toggleMode}
            title={`Switch to ${mode === 'voice' ? 'text' : 'voice'} mode`}
          >
            {mode === 'voice' ? '💬' : '🎤'}
          </button>
          <button className="hybrid-modal-close-btn" onClick={onDisconnect}>
            ✕
          </button>
        </div>
      </div>

      {mode === 'voice' ? (
        <VoiceMode state={state} />
      ) : (
        <TextMode 
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          isSending={isSending}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
          messagesEndRef={messagesEndRef}
        />
      )}
    </div>
  );
}

function VoiceMode({ state }) {
  const [agentHasSpoken, setAgentHasSpoken] = useState(false);

  useEffect(() => {
    if (state === 'speaking' && !agentHasSpoken) {
      setAgentHasSpoken(true);
    }
  }, [state, agentHasSpoken]);

  const isWaiting = !agentHasSpoken && state !== 'speaking';
  const isThinking = state === 'thinking';
  const isListening = state === 'listening';

  return (
    <div className="modal-voice-mode">
      <div className="modal-voice-status-container">
        <div className={`modal-voice-indicator ${isWaiting ? 'waiting' : isThinking ? 'thinking' : isListening ? 'listening' : 'speaking'}`}>
          <div className="modal-voice-pulse"></div>
          {isThinking && <div className="modal-voice-pulse-secondary"></div>}
          <div className="modal-voice-icon">{isWaiting ? '⏳' : '🎤'}</div>
        </div>
        <div className="modal-voice-state-text">
          {isWaiting ? 'Initializing...' :
           state === 'listening' ? 'Listening...' : 
           state === 'thinking' ? 'Processing...' : 
           state === 'speaking' ? 'Speaking...' : 'Ready'}
        </div>
      </div>
      
      <div className="modal-voice-instructions">
        <p>
          {isWaiting 
            ? 'Please wait while the AI agent initializes...' 
            : 'Speak naturally about your plant health concerns'}
        </p>
        <p className="modal-voice-tip">
          {isWaiting 
            ? 'This usually takes just a few seconds' 
            : 'The AI will listen and respond to your questions'}
        </p>
      </div>
    </div>
  );
}

function TextMode({ messages, inputText, setInputText, isSending, sendMessage, handleKeyPress, messagesEndRef }) {
  return (
    <div className="modal-text-mode">
      <div className="modal-chat-messages">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`modal-chat-message ${msg.sender}`}
          >
            <div className="modal-message-content">
              <div className="modal-message-avatar">
                {msg.sender === 'agent' ? '🌱' : msg.sender === 'user' ? '👤' : 'ℹ️'}
              </div>
              <div className="modal-message-bubble">
                <p>{msg.text}</p>
                <span className="modal-message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="modal-chat-input-container">
        <textarea
          className="modal-chat-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your plant's symptoms..."
          disabled={isSending}
          rows={1}
        />
        <button 
          className="modal-chat-send-btn"
          onClick={sendMessage}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? '⏳' : '➤'}
        </button>
      </div>

      <div className="modal-chat-footer">
        <p className="modal-chat-tip">💡 Tip: Describe symptoms like leaf color, spots, or wilting</p>
      </div>
    </div>
  );
}

export default HybridAssistantModal;
