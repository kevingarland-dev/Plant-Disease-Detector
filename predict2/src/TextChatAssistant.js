import React, { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, useRoomContext, useDataChannel } from '@livekit/components-react';
import '@livekit/components-styles';
import './TextChatAssistant.css';

function TextChatAssistant() {
  const [token, setToken] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const LIVEKIT_URL = process.env.REACT_APP_LIVEKIT_URL || 'wss://final-llm-a8copwku.livekit.cloud';
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://plant-disease-detector-ax66.onrender.com';

  const connectToChatAgent = async () => {
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
        throw new Error('Failed to get chat token');
      }

      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      console.error('Error connecting to chat agent:', err);
      setError(err.message);
      setConnecting(false);
    }
  };

  const disconnectFromChatAgent = () => {
    setToken(null);
    setConnecting(false);
  };

  return (
    <div className="text-chat-container">
      {!token ? (
        <div className="text-chat-controls">
          <button 
            className="chat-connect-btn"
            onClick={connectToChatAgent}
            disabled={connecting}
          >
            {connecting ? '🔄 Connecting...' : '💬 Chat with PlantSense AI'}
          </button>
          {error && <div className="chat-error">Error: {error}</div>}
          <p className="chat-hint">
            Click to start a text conversation with our AI assistant about your plant health concerns
          </p>
        </div>
      ) : (
        <LiveKitRoom
          token={token}
          serverUrl={LIVEKIT_URL}
          connect={true}
          audio={false}
          video={false}
          onDisconnected={disconnectFromChatAgent}
        >
          <ChatUI onDisconnect={disconnectFromChatAgent} />
        </LiveKitRoom>
      )}
    </div>
  );
}

function ChatUI({ onDisconnect }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const room = useRoomContext();

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
    if (room) {
      setMessages([{
        id: Date.now(),
        text: "Hello! I'm PlantSense AI. I can help you diagnose plant diseases and provide treatment advice. What plant issue can I help you with today?",
        sender: 'agent',
        timestamp: new Date()
      }]);
    }
  }, [room]);

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

  return (
    <div className="chat-ui">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>💬 PlantSense AI Chat</h3>
          <span className="chat-status">● Connected</span>
        </div>
        <button className="chat-close-btn" onClick={onDisconnect}>
          ✕
        </button>
      </div>

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

export default TextChatAssistant;
