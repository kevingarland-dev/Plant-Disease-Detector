import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Welcome to PlantSense 🌱</h1>
      <p>Detect plant diseases instantly and get insights powered by AI.</p>
      <button onClick={() => navigate("/predict")}>
        Go to Disease Detection
      </button>
    </div>
  );
};

export default Home;
