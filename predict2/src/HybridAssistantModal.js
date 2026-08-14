import React, { useState, useEffect, useRef } from 'react';
import { Leaf, Mic, MicOff, MessageSquare, X, Send, Volume2, VolumeX, Sparkles, AlertCircle } from 'lucide-react';
import './HybridAssistantModal.css';

const API_BASE_URL = "https://plant-disease-detector-production-6e4b.up.railway.app";

function HybridAssistantModal({ isOpen, onClose, predictionData }) {
  const [mode, setMode] = useState('voice'); // 'voice' or 'text'
  const [voiceState, setVoiceState] = useState('waiting'); // 'waiting', 'listening', 'thinking', 'speaking'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceState('listening');
        setStreamingText('');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setStreamingText(interimTranscript || finalTranscript);

        if (finalTranscript) {
          handleSendMessage(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition event:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setError(`Microphone: ${event.error}`);
        }
        setVoiceState('waiting');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (voiceState === 'listening') {
          setVoiceState('waiting');
        }
      };

      recognitionRef.current = recognition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceState]);

  // Handle modal open/close & initial greeting
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setStreamingText('');
      
      let initialGreeting = "Hello! I'm PlantSense AI. I can help diagnose plant diseases and provide treatment advice. How can I help you today?";
      if (predictionData && predictionData.disease) {
        initialGreeting = `Hello! I see you just analyzed a plant with ${predictionData.disease} (${predictionData.confidence}% confidence). Would you like treatment steps or prevention tips for this?`;
      }

      setMessages([
        {
          id: 'initial',
          sender: 'agent',
          text: initialGreeting,
          timestamp: new Date()
        }
      ]);

      if (mode === 'voice' && !isMuted) {
        speakText(initialGreeting);
      }
    } else {
      stopListening();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const currentAudioRef = useRef(null);

  const playAudioOrFallback = (text, audioBase64) => {
    if (isMuted) return;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    if (audioBase64) {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        currentAudioRef.current = audio;
        setVoiceState('speaking');
        audio.onended = () => {
          setVoiceState('waiting');
          currentAudioRef.current = null;
        };
        audio.onerror = () => {
          console.warn('Audio playback error, falling back to speech synthesis');
          speakText(text);
        };
        audio.play().catch(() => {
          speakText(text);
        });
        return;
      } catch (err) {
        console.warn('Error playing base64 audio:', err);
      }
    }

    speakText(text);
  };

  const speakText = (text) => {
    if (isMuted || !synthRef.current) return;
    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = synthRef.current.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Female')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => setVoiceState('speaking');
      utterance.onend = () => setVoiceState('waiting');
      utterance.onerror = () => setVoiceState('waiting');

      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setVoiceState('waiting');
    }
  };

  const startListening = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Recognition stop error:', err);
      }
    }
    setIsListening(false);
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    setInputText('');
    setStreamingText('');
    stopListening();

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setVoiceState('thinking');

    try {
      const formattedHistory = newMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedHistory,
          predictionData: predictionData,
          voice: "nova" // Natural human voice
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.reply || "I'm sorry, I couldn't generate a response. Please try again.";

      // Typing animation
      let currentWordIndex = 0;
      const words = aiReply.split(' ');
      const agentMsgId = Date.now() + 1;

      setMessages(prev => [
        ...prev,
        {
          id: agentMsgId,
          sender: 'agent',
          text: words[0] || '',
          timestamp: new Date()
        }
      ]);

      const interval = setInterval(() => {
        currentWordIndex++;
        if (currentWordIndex < words.length) {
          const partialText = words.slice(0, currentWordIndex + 1).join(' ');
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.id === agentMsgId) {
              last.text = partialText;
            }
            return updated;
          });
        } else {
          clearInterval(interval);
        }
      }, 35);

      // Play high quality voice audio if in voice mode
      if (mode === 'voice' && !isMuted) {
        playAudioOrFallback(aiReply, data.audio);
      } else {
        setVoiceState('waiting');
      }

    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'agent',
          text: "I'm having trouble connecting to the knowledge base right now. Please check your connection and try again.",
          timestamp: new Date()
        }
      ]);
      setVoiceState('waiting');
    }
  };

  const handleClose = () => {
    stopListening();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    onClose();
  };

  const toggleMute = () => {
    if (!isMuted) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setVoiceState('waiting');
    }
    setIsMuted(!isMuted);
  };

  if (!isOpen) return null;

  return (
    <div className="hybrid-modal-overlay" onClick={handleClose}>
      <div className="hybrid-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="hybrid-modal-header">
          <div className="hybrid-modal-header-info">
            <Leaf size={22} color="#a7f3d0" />
            <div>
              <h3>PlantSense AI</h3>
            </div>
            <span className="hybrid-modal-mode-badge">
              {mode === 'voice' ? 'Voice Assistant' : 'Text Chat'}
            </span>
          </div>

          <div className="hybrid-modal-header-actions">
            {mode === 'voice' && (
              <button 
                className="modal-mode-toggle-btn" 
                onClick={toggleMute}
                title={isMuted ? "Unmute Voice" : "Mute Voice"}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}

            <button 
              className="modal-mode-toggle-btn"
              onClick={() => {
                const nextMode = mode === 'voice' ? 'text' : 'voice';
                setMode(nextMode);
                if (nextMode === 'text') {
                  stopListening();
                  if (synthRef.current) synthRef.current.cancel();
                }
              }}
              title={mode === 'voice' ? "Switch to Text Chat" : "Switch to Voice Mode"}
            >
              {mode === 'voice' ? <MessageSquare size={18} /> : <Mic size={18} />}
            </button>

            <button className="hybrid-modal-close-btn" onClick={handleClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* VOICE MODE */}
        {mode === 'voice' ? (
          <div className="modal-voice-mode">
            <div className="modal-voice-status-container">
              
              <div 
                className={`modal-voice-indicator ${voiceState}`}
                onClick={isListening ? stopListening : startListening}
                style={{ cursor: 'pointer' }}
                title={isListening ? "Click to stop listening" : "Click to speak"}
              >
                <div className="modal-voice-pulse"></div>
                <div className="modal-voice-pulse-secondary"></div>
                <div className="modal-voice-icon">
                  {voiceState === 'listening' ? (
                    <Mic size={48} color="#22c55e" />
                  ) : voiceState === 'speaking' ? (
                    <Volume2 size={48} color="#059669" />
                  ) : voiceState === 'thinking' ? (
                    <Sparkles size={48} color="#f59e0b" />
                  ) : (
                    <MicOff size={48} color="#6b7280" />
                  )}
                </div>
              </div>

              <div className="modal-voice-state-text">
                {voiceState === 'listening' && "Listening to you..."}
                {voiceState === 'thinking' && "Analyzing..."}
                {voiceState === 'speaking' && "PlantSense is speaking..."}
                {voiceState === 'waiting' && "Tap the microphone to speak"}
              </div>

              {streamingText && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  padding: '12px 20px',
                  borderRadius: '16px',
                  maxWidth: '85%',
                  textAlign: 'center',
                  color: '#1e3a1e',
                  fontSize: '15px',
                  fontWeight: '500'
                }}>
                  "{streamingText}"
                </div>
              )}
            </div>

            {/* Recent agent message transcript display */}
            {messages.length > 0 && (
              <div style={{
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '16px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                width: '90%',
                maxWidth: '540px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#059669', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Latest Response
                </div>
                <p style={{ margin: 0, fontSize: '14.5px', lineHeight: '1.6', color: '#1f2937' }}>
                  {messages[messages.length - 1].text}
                </p>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', marginTop: '16px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          /* TEXT MODE */
          <div className="modal-text-mode">
            <div className="modal-chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`modal-chat-message ${msg.sender}`}>
                  <div className="modal-message-content">
                    <div className="modal-message-bubble">
                      <p>{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested quick chips if looking at a diagnosis */}
            {predictionData && predictionData.disease && messages.length <= 2 && (
              <div style={{ display: 'flex', gap: '8px', padding: '0 20px 10px', overflowX: 'auto' }}>
                {["Organic treatment", "Chemical fungicide", "How to prevent spread"].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(`What is the recommended ${suggestion.toLowerCase()} for ${predictionData.disease}?`)}
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#166534',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    💡 {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="modal-chat-input-bar">
              <input
                type="text"
                className="modal-chat-input"
                placeholder="Ask anything about symptoms, cures, or prevention..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button 
                className="modal-chat-send-btn" 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HybridAssistantModal;
