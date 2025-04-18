import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/index.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Don't render navbar if no user is logged in
    if (!user) {
        return null;
    }

    return (
        <nav>
            <div className="nav-links-container">
                <Link
                    to="/dashboard"
                    className={`nav-link ${location.pathname === '/dashboard' ? 'active-link' : ''}`}
                >
                    Dashboard
                </Link>
                <span className="divider">|</span>
                <Link
                    to={`/profile/${user.id}`}
                    className={`nav-link ${location.pathname === `/profile/${user.id}` ? 'active-link' : ''}`}
                >
                    My Profile
                </Link>

                {user.role === 'client' && (
                    <>
                        <span className="divider">|</span>
                        <Link
                            to="/post-project"
                            className={`nav-link ${location.pathname === '/post-project' ? 'active-link' : ''}`}
                        >
                            Add Project
                        </Link>
                    </>
                )}

                {user.role === 'freelancer' && (
                    <>
                        <span className="divider">|</span>
                        <Link
                            to="/projects"
                            className={`nav-link ${location.pathname === '/projects' ? 'active-link' : ''}`}
                        >
                            Browse Projects
                        </Link>
                    </>
                )}
            </div>

            <button
                className="logout-btn"
                onClick={() => {
                    logout();
                    window.location.href = '/';
                }}
            >
                Logout
            </button>
        </nav>
    );
}