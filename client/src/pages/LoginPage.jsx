import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthPages.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.token) {
      login(data);
      navigate('/dashboard');
    } else {
      alert(data.error || 'Login failed');
    }
  };

  return (
    <div className="auth-background">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">SkillSphere</Link>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-title">Welcome Back</h2>
          <input
            className="auth-input"
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />
          <input
            className="auth-input"
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />
          <button type="submit" className="auth-button">Log In</button>
          <p className="auth-link-text">
            Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}