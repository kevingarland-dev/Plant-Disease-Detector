import React, { useState, useRef} from "react";
import "./predict.css";

function PredictScreen() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [setVoiceText] = useState("");
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const rafRef = useRef(null);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const API_BASE_URL = "https://plant-disease-detector-2-rzau.onrender.com";

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleVoice = async () => {
    if (!isListening) {
      // start recognition + audio analyser
      try {
        // start SpeechRecognition
        const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Rec) {
          const recognition = new Rec();
          recognition.continuous = false;
          recognition.interimResults = false;

          recognition.onstart = () => setIsListening(true);
          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setVoiceText(transcript);
            processVoiceCommand(transcript);
          };
          recognition.onerror = (e) => {
            console.error('Speech recognition error:', e.error || e);
          };
          recognition.onend = () => {
            // allow a short delay so UI shows the end
            stopVoice();
          };

          recognitionRef.current = recognition;
          recognition.start();
        } else {
          console.warn('SpeechRecognition not supported');
        }

        // start microphone + analyser for visualizer
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const update = () => {
          analyser.getByteFrequencyData(data);
          // compute a simple volume level
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255; // 0..1
          setVoiceLevel(avg);
          rafRef.current = requestAnimationFrame(update);
        };

        rafRef.current = requestAnimationFrame(update);
      } catch (error) {
        console.error('Voice start error', error);
        alert('Unable to access microphone: ' + (error.message || error));
      }
    } else {
      // stop everything
      stopVoice();
    }
  };

  const stopVoice = () => {
    setIsListening(false);
    setVoiceLevel(0);
    // stop recognition
    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
    } catch (e) {}

    // stop analyser and audio
    try {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
        audioContextRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    } catch (e) {
      console.error('Error stopping audio', e);
    }
  };

  const processVoiceCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('analyze') || lowerCommand.includes('analyse')) {
      handlePredict();
    } else if (lowerCommand.includes('upload') || lowerCommand.includes('add image')) {
      document.getElementById('imageInput').click();
    }
  };

  const handlePredict = async () => {
    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select an image first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResult(null);
    setPredictions([]);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        body: formData,
        mode: "cors",
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      setResult({
        disease: data.disease || "Unknown Disease",
        description: data.description || "No description available.",
        confidence: data.confidence,
        isUncertain: data.isUncertain === true
      });
      setPredictions(data.predictions || []);
    } catch (error) {
      setResult({ disease: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="content-wrapper">
        {/* Left Panel */}
        <div className="left-panel">
        <div className="logo">PlantSense.AI</div>

        <label htmlFor="imageInput" className="add-image">
          {preview ? (
            <img id="preview" src={preview} alt="Preview" />
          ) : (
            <span>Add Image</span>
          )}
        </label>

        <input
          type="file"
          id="imageInput"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />

        <button className="analyse-btn" onClick={handlePredict} disabled={loading}>
          {loading ? "Analysing..." : "Analyse Plant"}
        </button>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="description">
          {result ? (
            <>
              <div className="prediction-header">
                {result.isUncertain ? (
                  <strong style={{ color: '#9c6d1e' }}>⚠️ {result.disease}</strong>
                ) : (
                  <strong>✅ Detected Disease: {result.disease}</strong>
                )}
              </div>
              <div className="symptoms-section">
                <div className="symptom-item" style={result.isUncertain ? { color: '#854d0e' } : undefined}>
                  {result.description}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="desc-title">Description</div>
              Upload a plant image to see predictions.
            </>
          )}
        </div>

        <div className="bar-section">
          <div className="desc-title">Confidence Levels</div>
          <svg width="100%" height="160">
            {predictions.map((pred, index) => {
              const barHeight = 30;
              const barGap = 15;
              const yOffset = index * (barHeight + barGap);
              const colors = ["#22c55e", "#78b48e", "#9bb9a6"];
              const color = colors[index % colors.length];
              return (
                <g key={index} transform={`translate(0, ${yOffset})`}>
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height={barHeight}
                    fill="#f0f0f0"
                    rx="4"
                  />
                  <rect
                    className="confidence-bar"
                    x="0"
                    y="0"
                    width={`${pred.confidence}%`}
                    height={barHeight}
                    fill={color}
                    rx="4"
                  />
                  <text
                    x="10"
                    y={barHeight / 2 + 4}
                    className="confidence-label"
                  >
                    {pred.disease}
                  </text>
                  <text
                    x="98%"
                    y={barHeight / 2 + 4}
                    className="confidence-value"
                    textAnchor="end"
                  >
                    {pred.confidence}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      </div>

      <footer>
        © 2025 PlantSense.AI | Empowering Farmers with Artificial Intelligence
      </footer>
      {/* floating microphone button */}
      <button 
        className={`voice-btn ${isListening ? 'listening' : ''}`} 
        onClick={toggleVoice}
        title="Click to use voice commands"
      >
        🎤
      </button>

      {/* voice visual: small pulsing circle above the mic when listening */}
      {isListening && (
        <div className="voice-visual" aria-hidden>
          <div className="voice-wave" style={{ transform: `scale(${0.6 + voiceLevel * 1.4})`, opacity: 0.6 + voiceLevel * 0.4 }} />
          <div className="voice-core" style={{ transform: `scale(${0.8 + voiceLevel * 0.6})` }} />
        </div>
      )}
    </div>
  );
}

export default PredictScreen;
