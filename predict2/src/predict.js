import React, { useState} from "react";

import HybridAssistantModal from "./HybridAssistantModal";
import "./predict.css";

function PredictScreen() {
  
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  
  const API_BASE_URL = "https://plant-disease-detector-ax66.onrender.com";

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for next tick to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please check permissions or use Upload Photo instead.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg');
      setPreview(imageData);
      
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Cleanup camera on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handlePredict = async () => {
    if (!preview) {
      alert("Please select or capture an image first!");
      return;
    }

    // Convert base64 preview to blob without using fetch
    const base64Data = preview.split(',')[1];
    const mimeType = preview.split(',')[0].split(':')[1].split(';')[0];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const file = new File([blob], "plant-image.jpg", { type: mimeType });

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

        <div className="image-options">
          <button 
            className="option-btn"
            onClick={() => document.getElementById('imageInput').click()}
          >
            📁 Upload Photo
          </button>
          <button 
            className="option-btn"
            onClick={startCamera}
          >
            📷 Take Photo
          </button>
        </div>

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
            Ask PlantSense AI
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
        title="Talk or Chat with PlantSense AI Assistant"
      >
        🎤
      </button>

      {/* Camera Modal */}
      {showCamera && (
        <div className="camera-modal-overlay" onClick={stopCamera}>
          <div className="camera-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="camera-header">
              <h3>📷 Capture Plant Photo</h3>
              <button className="camera-close-btn" onClick={stopCamera}>✕</button>
            </div>
            <div className="camera-view">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                className="camera-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="camera-controls">
              <button className="camera-capture-btn" onClick={capturePhoto}>
                📸 Capture
              </button>
              <button className="camera-cancel-btn" onClick={stopCamera}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hybrid Assistant Modal (Voice + Text) */}
      <HybridAssistantModal 
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}

export default PredictScreen;
