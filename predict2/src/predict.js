import React, { useState, useRef} from "react";
import { useNavigate } from "react-router-dom";
import VoiceAssistantModal from "./VoiceAssistantModal";
import "./predict.css";

function PredictScreen() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const API_BASE_URL = "http://127.0.0.1:8000";

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
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
                  <strong style={{ color: '#9c6d1e' }}>Suspected Disease</strong>
                ) : (
                  <strong>✅ Detected Disease: {result.disease}</strong>
                )}
              </div>
              <div className="symptoms-section">
                <div className="symptom-item">
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

      {/* Uncertainty Warning Message */}
      {result && result.isUncertain && (
        <div className="uncertainty-warning">
          ⚠️ Note: PlantSense.AI is not fully confident in this prediction. This may be due to image quality or the disease not being represented in training data. Consider taking another photo or consulting an expert.
          <button 
            className="voice-assistant-link-btn"
            onClick={() => setIsVoiceModalOpen(true)}
            style={{
              marginLeft: '10px',
              padding: '8px 16px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🎤 Try Voice Assistant
          </button>
        </div>
      )}

      <footer>
        © 2025 PlantSense.AI | Empowering Farmers with Artificial Intelligence
      </footer>
      
      {/* floating microphone button for voice assistant */}
      <button 
        className="voice-btn" 
        onClick={() => setIsVoiceModalOpen(true)}
        title="Talk to PlantSense AI Assistant"
      >
        🎤
      </button>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal 
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}

export default PredictScreen;
