import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Scan, Cpu, ShieldCheck, Sprout } from "lucide-react";
import "./HomeScreen.css";
import heroImage from "./assets/ai_agriculture.jpg";

function ScrollReveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "visible" : ""}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="home-root">
      {/* Top Navbar */}
      <nav className="home-navbar">
        <div className="home-logo">
          <div className="home-logo-icon">
            <Leaf size={20} color="#fff" />
          </div>
          <span>PlantSense.AI</span>
        </div>
        <div className="home-nav-links">
          <a href="/contact">CONTACT</a>
        </div>
        <div></div>
      </nav>

      {/* Main Hero Logo Area */}
      <section className="home-hero">
        <ScrollReveal>
          <div className="hero-center-icon">
            <Leaf size={40} color="#7a9c7a" strokeWidth={1.5} />
          </div>
          <h1 className="hero-title">PlantSense.AI</h1>
        </ScrollReveal>
        
        <div className="hero-columns">
          <ScrollReveal delay={100}>
            <div className="hero-col">
              <h3>About Us</h3>
              <div className="icon-grid">
                 <div className="icon-box"><Scan size={28} strokeWidth={1.5} /><span>Scan</span></div>
                 <div className="icon-box"><Cpu size={28} strokeWidth={1.5} /><span>Analyze</span></div>
                 <div className="icon-box"><ShieldCheck size={28} strokeWidth={1.5} /><span>Protect</span></div>
                 <div className="icon-box"><Sprout size={28} strokeWidth={1.5} /><span>Grow</span></div>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="hero-col">
              <h3>Diagnose Early</h3>
              <p>Upload a high-resolution photo of your plant's foliage. Our neural networks identify 400+ botanical pathogens with clinical accuracy. Ensure the vitality of your crops by catching diseases before they spread.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Organic Image Break */}
      <section className="home-image-break">
        <div className="organic-blob blob-1"></div>
        <div className="organic-blob blob-2"></div>
        <div className="organic-blob blob-3"></div>
        <ScrollReveal>
          <div className="image-organic-wrapper">
             <img src={heroImage} alt="AI and Agriculture" />
          </div>
        </ScrollReveal>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <ScrollReveal>
          <div className="features-grid">
            <div className="feature-block">
              <h3>Predict</h3>
              <p>Upload your plant images and let our AI provide instant, accurate diagnosis for common diseases.</p>
              <button className="home-action-btn" onClick={() => navigate('/predict')}>START NOW</button>
            </div>
          </div>
        </ScrollReveal>
      </section>
      
      {/* Footer / Contact snippet */}
      <section className="home-footer-snippet">
         <ScrollReveal>
           <div className="footer-columns">
              <div className="footer-col">
                 <div className="footer-logo">
                    <div className="footer-logo-icon"><Leaf size={18} /></div>
                    <span>PlantSense.AI</span>
                 </div>
                 <p className="footer-desc">Empowering agriculture with advanced artificial intelligence. Clean, fast, and clinically accurate.</p>
              </div>
              <div className="footer-col">
                 <h3>Contact</h3>
                 <p>123 Agri-Tech Blvd<br/>Innovation City</p>
                 <p>hello@plantsense.ai</p>
              </div>
           </div>
         </ScrollReveal>
      </section>
    </div>
  );
}
