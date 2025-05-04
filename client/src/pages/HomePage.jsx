import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/HomePage.css'; // Create this CSS file

const HomePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="home-container">
            <header className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Welcome to <span>SkillSphere</span></h1>
                    <p className="hero-subtitle">Connect with top talent or find your dream projects</p>

                    <div className="cta-buttons">
                        <a href="/login" className="cta-button primary">
                            Login
                        </a>
                        <a href="/signup" className="cta-button secondary">
                            Sign Up
                        </a>
                    </div>
                </div>
            </header>

            <section className="features-section">
                <h2>Why Choose SkillSphere?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">💼</div>
                        <h3>Find Projects</h3>
                        <p>Browse thousands of projects matching your skills and expertise</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">👥</div>
                        <h3>Hire Talent</h3>
                        <p>Connect with skilled professionals for your business needs</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📈</div>
                        <h3>Grow Your Career</h3>
                        <p>Build your portfolio and showcase your work to potential clients</p>
                    </div>
                </div>
            </section>
            <section className="testimonial-section">
                <h2>What Our Users Say</h2>
                <div className="testimonial-card">
                    <p>"How are you missing it?"</p>
                    <div className="testimonial-author">
                        <img src="src/images/elecpendi.png" alt="Sarah J." className="author-avatar" />
                        <span>Elec Pendi, PW</span>
                    </div>
                </div>
            </section>
            <footer className="home-footer">
                <p>© {new Date().getFullYear()} SkillSphere. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default HomePage;