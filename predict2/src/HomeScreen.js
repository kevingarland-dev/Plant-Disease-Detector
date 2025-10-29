import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomeScreen.css";

function HomeScreen() {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate("/predict");
  };

  return (
    <div className="home-container">
      <img 
        src="./plantsense-logo.png" 
        alt="PlantSense.AI Logo" 
        className="home-logo"
      />
      <h1>Welcome to PlantSense.AI</h1>
      <p>Detect plant diseases instantly and get insights powered by AI.</p>
      <button onClick={handleNavigate}>Go to Disease Detection</button>
    </div>
  );
}

export default HomeScreen;
