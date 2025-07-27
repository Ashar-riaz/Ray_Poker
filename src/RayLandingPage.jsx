import React from "react";
import "./RayLandingPage.css";
import landingImg from './assets/landing_img.png';
import { Link } from "react-router-dom";


const RayLandingPage = () => {
  return (
    <div className="container">
      <header>
        <div className="logo">
          <div className="logo-icon">R</div>
          <span>Ray</span>
        </div>
        <nav>
          {/* <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a> */}
        </nav>
        <div className="header-actions">
          <Link to="/login" className="login-btn"style={{ textDecoration: "none" }}>Log in</Link>
          <Link to="/signup" className="signup-btn" style={{ textDecoration: "none" }}>Get Started</Link>
        </div>
      </header>

      <main className="hero">
        <div className="hero-content">
          <h1>Play Poker<br />with Ray</h1>
          <p>Your AI poker coach that<br />reads the game like a pro.</p>

          <div className="hero-actions">
            <button className="primary-btn1">ATTACH</button>
            <button className="secondary-btn">Refer</button>
          </div>

          <div className="ask-ray">
            <input type="text" placeholder="Ask Ray about..." />
            <button>Ask</button>
          </div>
        </div>

        <div className="hero-character">
          <div className="character">
            <img src={landingImg} alt="Ray AI character" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RayLandingPage;
