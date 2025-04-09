import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const isLoggedIn = !!localStorage.getItem('authToken'); // Replace with your auth logic
        if (!isLoggedIn) {
            navigate('/login');
        } else {
            navigate('/dashboard');
        }
    }, [navigate]);

    return null; // Empty component since redirection happens immediately
};

export default HomePage;