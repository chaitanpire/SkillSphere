import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav style={{ padding: '10px', background: '#eee' }}>
            <Link to="/" style={{ marginRight: '10px' }}>Login</Link>
            <Link to="/signup" style={{ marginRight: '10px' }}>Signup</Link>
            {user && (
                <>
                    <Link to="/dashboard" style={{ marginRight: '10px' }}>Dashboard</Link>
                    <button onClick={logout}>Logout</button>
                </>
            )}
        </nav>
    );
}
