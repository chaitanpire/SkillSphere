import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';



export default function Navbar() {
    const { user, logout } = useAuth();

    const navStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        background: '#333',
        color: '#fff',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    };

    const linkStyle = {
        marginRight: '15px',
        textDecoration: 'none',
        color: '#fff',
        fontWeight: 'bold',
    };

    const buttonStyle = {
        background: '#ff4d4d',
        color: '#fff',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '5px',
        cursor: 'pointer',
    };

    const buttonHoverStyle = {
        background: '#ff1a1a',
    };

    return (
        <nav style={navStyle}>
            <div>
                {!user && (
                    <>
                        <Link to="/" style={linkStyle}>Login</Link>
                        <span style={{ color: '#fff', margin: '0 10px' }}>|</span>
                        <Link to="/signup" style={linkStyle}>Signup</Link>
                    </>
                )}

                {user && (
                    <>
                        <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
                        <span style={{ color: '#fff', margin: '0 10px' }}>|</span>
                        <Link to={`/profile/${user.id}`} style={linkStyle}>My Profile</Link>

                    </>
                )}

                {user && user.role === 'client' && (
                    <>
                        <span style={{ color: '#fff', margin: '0 10px' }}>|</span>
                        <Link to="/post-project" style={linkStyle}>Add Project</Link>
                    </>
                )}

                {user && user.role === 'freelancer' && (
                    <>
                        <span style={{ color: '#fff', margin: '0 10px' }}>|</span>
                        <Link to="/projects" style={linkStyle}>Browse Projects</Link>
                    </>
                )}



            </div>
            {user && (
                <button
                    style={buttonStyle}
                    onMouseOver={(e) => e.target.style.background = buttonHoverStyle.background}
                    onMouseOut={(e) => e.target.style.background = buttonStyle.background}
                    onClick={() => {
                        logout();
                        window.location.href = '/';
                    }}
                >
                    Logout
                </button>
            )}
        </nav>
    );
}