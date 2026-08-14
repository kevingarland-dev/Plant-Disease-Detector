import React from 'react';
import { Leaf, Grid, BookOpen } from 'lucide-react';
import './predict.css';

export default function HerbariumScreen() {
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

      <div className="predict-hero" style={{marginBottom: '30px'}}>
        <h1 className="predict-title">Your <em>Herbarium</em>.</h1>
        <p className="predict-subtitle">A collection of your past botanical analyses and diagnosed specimens.</p>
      </div>

      <div style={{maxWidth: '1000px', margin: '0 auto', width: '100%'}}>
        <div style={{background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <BookOpen size={48} color="#7a9c7a" style={{marginBottom: '20px'}} />
          <h2 style={{fontFamily: 'Playfair Display, serif', color: '#1a2a1f'}}>No specimens saved yet.</h2>
          <p style={{color: '#8fa08f'}}>Analyses you perform will be securely stored here for future reference.</p>
        </div>
      </div>
    </div>
  );
}
