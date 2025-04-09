import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
    const { user } = useAuth(); // Get the current user from the AuthContext
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            // Redirect to the dashboard if the user is logged in
            navigate('/dashboard');
        } else {
            // Optionally, you can redirect to a different page if the user is not logged in
            navigate('/login');
        }
    }, [user, navigate]);

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1>Welcome to SkillSphere</h1>
            <p>Your platform for managing and showcasing skills.</p>
            <div style={{ marginTop: '20px' }}>
                <a href="/login" style={{ marginRight: '15px', textDecoration: 'none', color: '#007BFF' }}>
                    Login
                </a>
                <a href="/signup" style={{ textDecoration: 'none', color: '#007BFF' }}>
                    Signup
                </a>
            </div>
        </div>
    );
};

export default HomePage;