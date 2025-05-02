import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthPages.css';

export default function SignupPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'freelancer' });
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:4000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            console.log(data); // Debugging: Log the server response

            if (!res.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            if (data.token) {
                login({ token: data.token, user: data.user });
                navigate('/dashboard');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="auth-background">
            <div className="auth-container">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">SkillSphere</Link>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2 className="auth-title">Get Started</h2>
                    <input
                        className="auth-input"
                        name="name"
                        placeholder="Full Name"
                        onChange={handleChange}
                        required
                    />
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
                    <select
                        className="auth-select"
                        name="role"
                        onChange={handleChange}
                        value={formData.role}
                    >
                        <option value="freelancer">Freelancer</option>
                        <option value="client">Client</option>
                    </select>
                    <button type="submit" className="auth-button">Create Account</button>
                    <p className="auth-link-text">
                        Already have an account? <Link to="/login" className="auth-link">Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}