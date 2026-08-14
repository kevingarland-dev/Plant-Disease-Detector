import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeScreen from "./HomeScreen";
import PredictScreen from "./predict";
import HerbariumScreen from "./HerbariumScreen";
import ModelsScreen from "./ModelsScreen";
import ContactScreen from "./ContactScreen";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/predict" element={<PredictScreen />} />
        <Route path="/herbarium" element={<HerbariumScreen />} />
        <Route path="/models" element={<ModelsScreen />} />
        <Route path="/contact" element={<ContactScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
