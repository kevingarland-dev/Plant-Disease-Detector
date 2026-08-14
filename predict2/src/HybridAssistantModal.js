import React, { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useVoiceAssistant, useRoomContext, useDataChannel } from '@livekit/components-react';
import { Leaf, Mic, MessageSquare, X, Loader, Send, AlertCircle, User, Info, Lightbulb, BrainCircuit } from 'lucide-react';
import '@livekit/components-styles';
import './HybridAssistantModal.css';
import { RoomEvent } from 'livekit-client';

function HybridAssistantModal({ isOpen, onClose, predictionData }) {
  const [token, setToken] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('voice'); // 'voice' or 'text'

  const LIVEKIT_URL = "wss://fafa-bk0tle5p.livekit.cloud" ;
  const API_BASE_URL = "https://plant-disease-detector-production-6e4b.up.railway.app";

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
  const [streamingText, setStreamingText] = useState('');
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
      
      // Attempt to parse JSON (LiveKit ChatManager format)
      try {
        const parsed = JSON.parse(text);
        if (parsed.message) {
          text = parsed.message;
        }
      } catch (e) {
        // Not JSON, use raw text
      }
      
      console.log('📝 Processed text:', text);
      console.log('👤 From participant:', participant?.identity);
      console.log('🏠 Local participant:', room?.localParticipant?.identity);
      
      // Add message if it's from someone else
      if (participant?.identity !== room?.localParticipant?.identity) {
        console.log('✅ Adding message to chat');
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          // Prevent duplicates if DataChannel and Transcription arrive at the same time
          if (lastMsg && lastMsg.text.includes(text)) return prev;
          
          if (lastMsg && lastMsg.sender === 'agent') {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastMsg,
              text: (lastMsg.text + ' ' + text).trim()
            };
            return updated;
          } else {
            return [...prev, {
              id: Date.now(),
              text: text,
              sender: 'agent',
              timestamp: new Date()
            }];
          }
        });
      } else {
        console.log('⏭️ Skipping own message');
      }
    } catch (error) {
      console.error('Error decoding message:', error);
    }
  };

  // Listen to lk.chat (for user messages)
  useDataChannel('lk.chat', onDataReceived);

  // Listen for transcriptions (agent speech converted to text)
  useEffect(() => {
    if (!room) return;

    const handleTranscription = (segments, participant) => {
      if (participant?.identity !== room.localParticipant.identity) {
        const finalSegments = segments.filter(s => s.final);
        const nonFinalSegments = segments.filter(s => !s.final);
        
        let finalText = '';
        if (finalSegments.length > 0) {
          finalText = finalSegments.map(s => s.text).join(' ').trim();
        }
        
        let tempText = '';
        if (nonFinalSegments.length > 0) {
          tempText = nonFinalSegments.map(s => s.text).join(' ').trim();
        }
        
        setStreamingText(tempText);
        
        if (finalText) {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.sender === 'agent') {
              if (lastMsg.text.endsWith(finalText)) return prev;
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...lastMsg,
                text: (lastMsg.text + ' ' + finalText).trim()
              };
              return updated;
            } else {
              return [...prev, {
                id: Date.now() + Math.random(),
                text: finalText,
                sender: 'agent',
                timestamp: new Date()
              }];
            }
          });
        }
      }
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);

    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
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
          <h3><Leaf size={20} style={{marginRight: '8px', verticalAlign: 'text-bottom'}}/> PlantSense.AI</h3>
          <span className="hybrid-modal-mode-badge">
            {mode === 'voice' ? <><Mic size={14} style={{verticalAlign: 'text-bottom', marginRight: '4px'}}/> Voice Mode</> : <><MessageSquare size={14} style={{verticalAlign: 'text-bottom', marginRight: '4px'}}/> Text Mode</>}
          </span>
        </div>
        <div className="hybrid-modal-header-actions">
          <button 
            className="modal-mode-toggle-btn"
            onClick={toggleMode}
            title={`Switch to ${mode === 'voice' ? 'text' : 'voice'} mode`}
          >
            {mode === 'voice' ? <MessageSquare size={18} /> : <Mic size={18} />}
          </button>
          <button className="hybrid-modal-close-btn" onClick={onDisconnect}>
            <X size={20} />
          </button>
        </div>
      </div>

      {mode === 'voice' ? (
        <VoiceMode state={state} />
      ) : (
        <TextMode 
          messages={messages}
          streamingText={streamingText}
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
  const isWaiting = state === 'initializing' || state === 'disconnected' || !state;
  const isThinking = state === 'thinking';
  const isListening = state === 'listening';

  return (
    <div className="modal-voice-mode">
      <div className="modal-voice-status-container">
        <div className={`modal-voice-indicator ${isWaiting ? 'waiting' : isThinking ? 'thinking' : isListening ? 'listening' : 'speaking'}`}>
          <div className="modal-voice-pulse"></div>
          {isThinking && <div className="modal-voice-pulse-secondary"></div>}
          <div className="modal-voice-icon">
            {isWaiting ? <Loader className="spin" size={44} color="#7a9c7a" /> : 
             isListening ? <Mic size={44} color="#3e5c3e" /> : 
             isThinking ? <BrainCircuit size={44} color="#3e5c3e" /> : 
             <Mic size={44} color="#2b3a2f" />}
          </div>
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

function TextMode({ messages, streamingText, inputText, setInputText, isSending, sendMessage, handleKeyPress, messagesEndRef }) {
  const displayMessages = [...messages];
  if (streamingText) {
    if (displayMessages.length > 0 && displayMessages[displayMessages.length - 1].sender === 'agent') {
      const last = displayMessages[displayMessages.length - 1];
      displayMessages[displayMessages.length - 1] = {
        ...last,
        text: (last.text + ' ' + streamingText).trim()
      };
    } else {
      displayMessages.push({
        id: 'streaming-temp',
        text: streamingText,
        sender: 'agent',
        timestamp: new Date()
      });
    }
  }

  return (
    <div className="modal-text-mode">
      <div className="modal-chat-messages">
        {displayMessages.map((msg) => (
          <div 
            key={msg.id} 
            className={`modal-chat-message ${msg.sender}`}
          >
            <div className="modal-message-content">
              <div className={`modal-message-avatar ${msg.sender}`}>
                {msg.sender === 'agent' ? <Leaf size={20} color="#3e5c3e" /> : msg.sender === 'user' ? <User size={20} color="#ffffff" /> : <Info size={20} color="#1976d2" />}
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
          {isSending ? <Loader className="spin" size={20} /> : <Send size={20} />}
        </button>
      </div>

      <div className="modal-chat-footer">
        <p className="modal-chat-tip"><Lightbulb size={14} style={{verticalAlign: 'text-bottom', marginRight: '4px'}} /> Tip: Describe symptoms like leaf color, spots, or wilting</p>
      </div>
    </div>
  );
}

export default HybridAssistantModal;
