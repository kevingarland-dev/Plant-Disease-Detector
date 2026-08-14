import React from 'react';
import { Leaf, Cpu, Network } from 'lucide-react';
import './predict.css';

export default function ModelsScreen() {
  return (
    <div className="predict-root">
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
        <h1 className="predict-title">Our <em>Models</em>.</h1>
        <p className="predict-subtitle">Test and compare different specialized neural networks within the workspace.</p>
      </div>

      <div style={{maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}}>
        <div style={{background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)'}}>
           <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px'}}>
             <div style={{background: '#eaf1ea', padding: '12px', borderRadius: '50%'}}>
               <Cpu color="#4a6741" size={24} />
             </div>
             <h3 style={{margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#1a2a1f'}}>Standard ResNet-50</h3>
           </div>
           <p style={{color: '#667b66', lineHeight: '1.5'}}>Our high-speed baseline model trained on 1,400 general crop diseases. Perfect for quick initial screening.</p>
           <button style={{marginTop: '20px', padding: '10px 20px', borderRadius: '20px', border: '1px solid #d0e0d0', background: 'transparent', cursor: 'pointer', color: '#4a6741', fontWeight: '500', transition: 'all 0.2s'}}>Test Model</button>
        </div>

        <div style={{background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)'}}>
           <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px'}}>
             <div style={{background: '#eaf1ea', padding: '12px', borderRadius: '50%'}}>
               <Network color="#4a6741" size={24} />
             </div>
             <h3 style={{margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#1a2a1f'}}>Advanced Vision Transformer</h3>
           </div>
           <p style={{color: '#667b66', lineHeight: '1.5'}}>Cutting-edge ViT model with superior accuracy on complex foliar patterns and early-stage deficiencies.</p>
           <button style={{marginTop: '20px', padding: '10px 20px', borderRadius: '20px', border: '1px solid #d0e0d0', background: 'transparent', cursor: 'pointer', color: '#4a6741', fontWeight: '500', transition: 'all 0.2s'}}>Test Model</button>
        </div>
      </div>
    </div>
  );
}
