import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import '../styles/index.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const fetchUnreadCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:4000/api/messages/unread-count', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.count);
                }
            } catch (err) {
                console.error('Error fetching unread count:', err);
            }
        };

        fetchUnreadCount();

        if (socket) {
            socket.on('update_unread_count', fetchUnreadCount);
        }

        return () => {
            if (socket) {
                socket.off('update_unread_count');
            }
        };
    }, [user, socket]);

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

                {user.role === 'client' && (
                    <>
                        <span className="divider">|</span>
                        <Link
                            to="/client-projects"
                            className={`nav-link ${location.pathname === '/client-projects' ? 'active-link' : ''}`}
                        >
                            My Projects
                        </Link>
                    </>
                )}

                {user.role === 'freelancer' && (
                    <>
                        <span className="divider">|</span>
                        <Link
                            to="/my-proposals"
                            className={`nav-link ${location.pathname === '/my-proposals' ? 'active-link' : ''}`}
                        >
                            My Proposals
                        </Link>
                    </>
                )}

                <span className="divider">|</span>
                <Link
                    to="/messages"
                    className={`nav-link ${location.pathname.startsWith('/messages') ? 'active-link' : ''}`}
                >
                    Messages
                    {unreadCount > 0 && <span className="unread-count">{unreadCount}</span>}
                </Link>
            </div>

            <button
                className="logout-btn"
                onClick={() => {
                    if (socket) socket.disconnect();
                    logout();
                    window.location.href = '/';
                }}
            >
                Logout
            </button>
        </nav>
    );
}