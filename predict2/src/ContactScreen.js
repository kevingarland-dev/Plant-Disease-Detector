import React from 'react';
import { Leaf, Mail, MapPin } from 'lucide-react';
import './predict.css';

export default function ContactScreen() {
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
        <h1 className="predict-title">Get in <em>Touch</em>.</h1>
        <p className="predict-subtitle">Have questions or want to collaborate? We'd love to hear from you.</p>
      </div>

      <div style={{maxWidth: '800px', margin: '0 auto', width: '100%'}}>
        <div style={{background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px'}}>
          
          <div>
            <h3 style={{fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: '#1a2a1f', marginTop: 0}}>Contact Info</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '15px', color: '#4a6741'}}>
                 <Mail size={20} /> <span style={{color: '#667b66'}}>kojoe278@gmail.com</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '15px', color: '#4a6741'}}>
                 <MapPin size={20} /> <span style={{color: '#667b66'}}>College of Science, KNUST</span>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: '#1a2a1f', marginTop: 0}}>Send a Message</h3>
            <form style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px'}}>
              <input type="text" placeholder="Your Name" style={{padding: '12px', borderRadius: '8px', border: '1px solid #d0e0d0', outline: 'none'}} />
              <input type="email" placeholder="Your Email" style={{padding: '12px', borderRadius: '8px', border: '1px solid #d0e0d0', outline: 'none'}} />
              <textarea placeholder="Your Message" rows={4} style={{padding: '12px', borderRadius: '8px', border: '1px solid #d0e0d0', outline: 'none', resize: 'vertical'}}></textarea>
              <button type="button" style={{background: '#3e5c3e', color: '#fff', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'}}>Send Message</button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
