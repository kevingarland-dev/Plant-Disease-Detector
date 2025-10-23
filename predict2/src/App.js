import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeScreen from "./HomeScreen";
import PredictScreen from "./predict";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/predict" element={<PredictScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
