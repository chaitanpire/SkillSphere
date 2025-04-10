import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav>
            <div>
                {!user && (
                    <>
                        <Link to="/" className="nav-link">Login</Link>
                        <span style={{ color: '#fff', margin: '0 10px' }}>|</span>
                        <Link to="/signup" className="nav-link">Signup</Link>
                    </>
                )}

                {user && (
                    <>
                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                        <span style={{ color: '#fff', margin: '0 10px' }}>|</span>
                        <Link to={`/profile/${user.id}`} className="nav-link">My Profile</Link>
                    </>
                )}

                {user?.role === 'client' && (
                    <>
                        <span style={{ color: '#fff', margin: '0 10px' }}>|</span>
                        <Link to="/post-project" className="nav-link">Add Project</Link>
                    </>
                )}

                {user?.role === 'freelancer' && (
                    <>
                        <span style={{ color: '#fff', margin: '0 10px' }}>|</span>
                        <Link to="/projects" className="nav-link">Browse Projects</Link>
                    </>
                )}
            </div>

            {user && (
                <button
                    className="logout-btn"
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
