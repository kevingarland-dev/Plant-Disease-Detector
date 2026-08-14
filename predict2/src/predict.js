import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Camera, Loader2, Leaf, AlertTriangle } from "lucide-react";
import HybridAssistantModal from "./HybridAssistantModal";
import "./predict.css";

function PredictScreen() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  // predictions state removed to fix warning
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = "https://plant-disease-detector-production-6e4b.up.railway.app";

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setResult(null); // clear previous results
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setShowCamera(true);

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
      setResult(null);
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

  useEffect(() => {
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

  // Helper to determine urgency styling based on disease (mock logic based on name)
  const isHealthy = result?.disease?.toLowerCase().includes("healthy");
  const urgencyLevel = isHealthy ? "Low" : "High";
  const urgencyColor = isHealthy ? "#22c55e" : "#f97316";

  return (
    <div className="predict-root">
      {/* Navigation */}
      <nav className="predict-navbar">
        <div className="predict-logo">
          <div className="predict-logo-icon">
            <Leaf size={20} color="#fff" />
          </div>
          <span>PlantSense.AI</span>
        </div>
        <div className="predict-nav-links">
          <a href="/contact">CONTACT</a>
        </div>
        <div></div>
      </nav>

      {/* Hero Section */}
      <div className="predict-hero">
        <h1 className="predict-title">Diagnosis at <em>the root</em>.</h1>
        <p className="predict-subtitle">
          Upload a high-resolution photo of your plant's foliage. Our neural networks identify 400+ botanical pathogens with clinical accuracy.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="predict-upload-container">
        {/* Left Badges */}
        <div className="predict-side-badges">
          <div className="predict-badge">
            <span className="badge-dot green"></span> NEURAL ENGINE ACTIVE
          </div>
          <div className="predict-badge">
            <span className="badge-dot orange"></span> LIBRARY 1,400 CLASSES
          </div>
        </div>

        <div 
          className={`predict-dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !preview && fileInputRef.current.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            style={{ display: "none" }} 
          />
          
          {preview ? (
            <div className="preview-container">
               <img src={preview} alt="Plant Preview" className="preview-image-small" />
               <div className="preview-actions">
                  <button className="predict-reselect-btn" onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    setResult(null);
                  }}>Change Image</button>
               </div>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="upload-icon-wrapper">
                <Leaf className="upload-icon" size={32} />
              </div>
              <h3>Drop plant image here</h3>
              <p>Supports JPEG, PNG, or WEBP up to 10MB</p>
              
              <div className="dropzone-buttons">
                <button 
                  className="predict-browse-btn" 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                >
                  <UploadCloud size={16} /> Browse
                </button>
                <button 
                  className="predict-camera-btn" 
                  onClick={(e) => { e.stopPropagation(); startCamera(); }}
                >
                  <Camera size={16} /> Camera
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="analyze-action-wrapper">
           <button 
             className={`predict-analyze-btn ${preview ? 'ready' : ''}`} 
             onClick={handlePredict}
             disabled={!preview || loading}
           >
             {loading ? <Loader2 className="spin" size={18} /> : <UploadCloud size={18} />}
             {loading ? "Analyzing Specimen..." : "Analyze Specimen"}
           </button>
        </div>
      </div>

      {/* Diagnostic Report Section */}
      {(preview && (loading || result)) && (
        <div className="diagnostic-report-section">
          <div className="report-divider">
            <hr />
            <span>DIAGNOSTIC REPORT</span>
            <hr />
          </div>

          <div className="report-grid">
            {/* Subject Analysis (Image) */}
            <div className="report-image-col">
              <div className="col-header">SUBJECT ANALYSIS</div>
              <div className="report-image-wrapper">
                <img src={preview} alt="Analyzed Plant" className="report-image" />
              </div>
            </div>

            {/* Results Column */}
            <div className="report-data-col">
              {loading ? (
                <div className="loading-card">
                  <Loader2 className="spin large-spinner" size={40} />
                  <h3>Analyzing leaf morphology...</h3>
                  <p>Cross-referencing visual markers with botanical disease library</p>
                </div>
              ) : result ? (
                <div className="result-card">
                  <div className="urgency-pill" style={{ backgroundColor: isHealthy ? '#dcfce7' : '#ffedd5', color: isHealthy ? '#166534' : '#c2410c' }}>
                    {urgencyLevel.toUpperCase()} URGENCY
                  </div>
                  <h2 className="disease-title">{result.disease}</h2>
                  
                  <p className="confidence-text">
                    Identified with <strong>{result.confidence}% confidence</strong>. {isHealthy ? "The plant shows vigorous growth, healthy foliage, and no visible disease." : "Disease indicators detected based on foliar symptoms."}
                  </p>

                  <hr className="subtle-hr" />

                  <div className="symptoms-urgency-row">
                    <div className="symptoms-col">
                      <div className="mini-title">KEY SYMPTOMS / INFO</div>
                      <ul className="symptoms-list">
                        {/* We are parsing the description to create bullet points if possible, otherwise just display it */}
                        {result.description.split('. ').filter(s => s.length > 2).slice(0, 3).map((sentence, i) => (
                          <li key={i}>{sentence.trim()}{sentence.endsWith('.') ? '' : '.'}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="urgency-col">
                      <div className="mini-title">URGENCY LEVEL</div>
                      <div className="urgency-bar-container">
                        <div className="urgency-bar-track">
                          <div className="urgency-bar-fill" style={{ width: isHealthy ? '20%' : '80%', backgroundColor: urgencyColor }}></div>
                        </div>
                        <span className="urgency-label" style={{ color: urgencyColor }}>{urgencyLevel}</span>
                      </div>
                      <p className="urgency-desc">
                        {isHealthy ? "Routine care and observation recommended." : "Action required to prevent further spread."}
                      </p>
                    </div>
                  </div>

                  <hr className="subtle-hr" />

                  <div className="treatment-section">
                    <div className="mini-title title-bold">Recommended Treatment</div>
                    <div className="treatment-list">
                      <div className="treatment-item">
                        <span className="step-num">01</span>
                        <p>{isHealthy ? "Maintain consistent watering at the base of the plant to keep soil evenly moist." : "Isolate the infected plant from other houseplants immediately."}</p>
                      </div>
                      <div className="treatment-item">
                        <span className="step-num">02</span>
                        <p>{isHealthy ? "Provide adequate sunlight depending on the plant species." : "Prune and safely discard heavily spotted leaves using sterilized shears."}</p>
                      </div>
                      {!isHealthy && (
                        <div className="treatment-item">
                          <span className="step-num">03</span>
                          <p>Apply appropriate fungicide or treatment if symptoms persist.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Uncertainty Warning Message */}
      {result && result.isUncertain && (
        <div className="uncertainty-banner">
          <AlertTriangle size={20} />
          <span>Note: PlantSense.AI is not fully confident. Consider taking another photo or consulting an expert.</span>
        </div>
      )}

      {/* Floating Microphone */}
      <button className="voice-fab" onClick={() => setIsVoiceModalOpen(true)}>
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
              <video ref={videoRef} autoPlay playsInline className="camera-video" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="camera-controls">
              <button className="camera-capture-btn" onClick={capturePhoto}>📸 Capture</button>
              <button className="camera-cancel-btn" onClick={stopCamera}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <HybridAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        predictionData={result}
      />
    </div>
  );
}

export default PredictScreen;
