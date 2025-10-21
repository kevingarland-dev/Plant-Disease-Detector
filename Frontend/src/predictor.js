import React, { useState } from "react";
import "./App.css"; // keep your existing CSS file

const Predictor = () => {
  const API_URL = "http://127.0.0.1:8000/predict"; // adjust if backend runs elsewhere

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [voicePopup, setVoicePopup] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const predict = async () => {
    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];
    if (!file) return alert("Please select an image first!");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      setLoading(false);

      setResult({
        disease: data.disease || data.class || "Unknown Disease",
        description:
          data.description || data.nlp_description || "No description available.",
        confidence:
          data.confidence !== undefined
            ? `${(data.confidence * 100).toFixed(2)}%`
            : null,
      });
    } catch (error) {
      setLoading(false);
      setResult({
        error: `${error.message}`,
      });
    }
  };

  const toggleVoiceAssistant = () => setVoicePopup(!voicePopup);
  const stopVoiceAgent = () =>
    document.getElementById("voice-status").textContent = "Stopped.";

  return (
    <div className="container">
      <h1>🌿 PlantSense.AI</h1>
      <p className="subtitle">Smart plant disease analysis powered by AI 🌎</p>

      <div className="file-input">
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {preview && <img id="preview" src={preview} alt="Preview" />}

      <button onClick={predict}>🔍 Analyze Plant Health</button>

      {loading && (
        <div id="loading" style={{ textAlign: "center" }}>
          <div className="spinner"></div>
          <p>Analyzing your plant image...</p>
        </div>
      )}

      <div id="result">
        {result && !result.error && (
          <div>
            <div className="prediction-header">
              ✅ Detected Disease: <strong>{result.disease}</strong><br />
              {result.confidence && (
                <small>Confidence: {result.confidence}</small>
              )}
            </div>
            <div className="symptoms-section">
              <div className="section-title">DESCRIPTION</div>
              <div className="symptom-item">{result.description}</div>
            </div>
          </div>
        )}

        {result && result.error && (
          <div className="error">
            ❌ {result.error}
            <br />
            <br />
            Ensure the API is running and accessible at:
            <br />
            {API_URL}
          </div>
        )}
      </div>

      <footer>© 2025 PlantSense.AI | Empowering Farmers with Intelligence</footer>

      {/* 🎙️ Voice Assistant Button */}
      <button
        id="voiceAssistantBtn"
        className={`mic-btn ${voicePopup ? "listening" : ""}`}
        onClick={toggleVoiceAssistant}
        title="Talk to PlantSense AI"
      >
        🎙️
      </button>

      {/* 🧠 Voice Assistant Popup */}
      {voicePopup && (
        <div id="voiceAssistantPopup" className="voice-popup" style={{ display: "flex" }}>
          <div className="voice-header">
            <span>🎧 PlantSense AI Voice Assistant</span>
            <button className="close-btn" onClick={toggleVoiceAssistant}>
              ×
            </button>
          </div>
          <div className="voice-body">
            <div className="listening-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p id="voice-status">Listening...</p>
          </div>
          <div className="voice-footer">
            <button className="stop-btn" onClick={stopVoiceAgent}>
              🛑 Stop
            </button>
          </div>
          
        </div>
      )}
      
    </div>
  );
};

export default Predictor;
