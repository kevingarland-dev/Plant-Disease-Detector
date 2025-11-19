import React, { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useVoiceAssistant, useRoomContext, useDataChannel } from '@livekit/components-react';
import '@livekit/components-styles';
import './HybridAssistant.css';

function HybridAssistant() {
  const [token, setToken] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('voice'); // 'voice' or 'text'

  const LIVEKIT_URL = "wss://final-llm-a8copwku.livekit.cloud" ;
  const API_BASE_URL ="https://plant-disease-detector-ax66.onrender.com";

  const connectToAssistant = async () => {
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
        throw new Error('Failed to get token');
      }

      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      console.error('Error connecting to assistant:', err);
      setError(err.message);
      setConnecting(false);
    }
  };

  const disconnectFromAssistant = () => {
    setToken(null);
    setConnecting(false);
  };

  return (
    <div className="hybrid-assistant-container">
      {!token ? (
        <div className="hybrid-assistant-controls">
          <h2>🌱 PlantSense AI Assistant</h2>
          <p className="hybrid-subtitle">Choose how you'd like to interact</p>
          
          <div className="mode-selector">
            <button
              className={`mode-btn ${mode === 'voice' ? 'active' : ''}`}
              onClick={() => setMode('voice')}
            >
              <span className="mode-icon">🎤</span>
              <span className="mode-label">Voice Chat</span>
              <span className="mode-desc">Talk naturally</span>
            </button>
            <button
              className={`mode-btn ${mode === 'text' ? 'active' : ''}`}
              onClick={() => setMode('text')}
            >
              <span className="mode-icon">💬</span>
              <span className="mode-label">Text Chat</span>
              <span className="mode-desc">Type your questions</span>
            </button>
          </div>

          <button 
            className="hybrid-connect-btn"
            onClick={connectToAssistant}
            disabled={connecting}
          >
            {connecting ? '🔄 Connecting...' : `Start ${mode === 'voice' ? 'Voice' : 'Text'} Chat`}
          </button>
          
          {error && <div className="hybrid-error">Error: {error}</div>}
          
          <p className="hybrid-hint">
            Get expert advice on plant diseases and treatment options
          </p>
        </div>
      ) : (
        <LiveKitRoom
          token={token}
          serverUrl={LIVEKIT_URL}
          connect={true}
          audio={mode === 'voice'}
          video={false}
          onDisconnected={disconnectFromAssistant}
        >
          <HybridUI 
            initialMode={mode} 
            onDisconnect={disconnectFromAssistant} 
          />
          {mode === 'voice' && <RoomAudioRenderer />}
        </LiveKitRoom>
      )}
    </div>
  );
}

function HybridUI({ initialMode, onDisconnect }) {
  const [mode, setMode] = useState(initialMode);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const room = useRoomContext();
  const { state } = useVoiceAssistant();

  // Listen for incoming text messages from the agent
  const onDataReceived = (payload, participant, kind, topic) => {
    if (topic === 'lk.chat') {
      const decoder = new TextDecoder();
      const text = decoder.decode(payload);
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: text,
        sender: 'agent',
        timestamp: new Date()
      }]);
    }
  };

  useDataChannel('lk.chat', onDataReceived);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message when connected
  useEffect(() => {
    if (room && mode === 'text') {
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
      // Send text to the agent via LiveKit data channel
      const encoder = new TextEncoder();
      const data = encoder.encode(userMessage);
      await room.localParticipant.publishData(data, { topic: 'lk.chat' });
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
    <div className="hybrid-ui">
      <div className="hybrid-header">
        <div className="hybrid-header-info">
          <h3>🌱 PlantSense AI</h3>
          <span className="hybrid-mode-badge">
            {mode === 'voice' ? '🎤 Voice Mode' : '💬 Text Mode'}
          </span>
        </div>
        <div className="hybrid-header-actions">
          <button 
            className="mode-toggle-btn"
            onClick={toggleMode}
            title={`Switch to ${mode === 'voice' ? 'text' : 'voice'} mode`}
          >
            {mode === 'voice' ? '💬' : '🎤'}
          </button>
          <button className="hybrid-close-btn" onClick={onDisconnect}>
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
    <div className="voice-mode">
      <div className="voice-status-container">
        <div className={`voice-indicator ${isWaiting ? 'waiting' : isThinking ? 'thinking' : isListening ? 'listening' : 'speaking'}`}>
          <div className="voice-pulse"></div>
          {isThinking && <div className="voice-pulse-secondary"></div>}
          <div className="voice-icon">{isWaiting ? '⏳' : '🎤'}</div>
        </div>
        <div className="voice-state-text">
          {isWaiting ? 'Initializing...' :
           state === 'listening' ? 'Listening...' : 
           state === 'thinking' ? 'Processing...' : 
           state === 'speaking' ? 'Speaking...' : 'Ready'}
        </div>
      </div>
      
      <div className="voice-instructions">
        <p>
          {isWaiting 
            ? 'Please wait while the AI agent initializes...' 
            : 'Speak naturally about your plant health concerns'}
        </p>
        <p className="voice-tip">
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
    <div className="text-mode">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`chat-message ${msg.sender}`}
          >
            <div className="message-content">
              <div className="message-avatar">
                {msg.sender === 'agent' ? '🌱' : msg.sender === 'user' ? '👤' : 'ℹ️'}
              </div>
              <div className="message-bubble">
                <p>{msg.text}</p>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your plant's symptoms..."
          disabled={isSending}
          rows={1}
        />
        <button 
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? '⏳' : '➤'}
        </button>
      </div>

      <div className="chat-footer">
        <p className="chat-tip">💡 Tip: Describe symptoms like leaf color, spots, or wilting</p>
      </div>
    </div>
  );
}

export default HybridAssistant;
