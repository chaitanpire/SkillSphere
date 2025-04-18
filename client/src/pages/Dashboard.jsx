import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return <div className="loading">Loading...</div>;

  const { name, email, role, profile } = user;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome back, <span className="highlight">{name}</span> 👋</h2>
        <div className="user-info">
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Role:</strong> {role.charAt(0).toUpperCase() + role.slice(1)}</p>
        </div>
      </div>

      <div className="profile-section">
        <h3>Your Profile</h3>
        {profile ? (
          <>
            <div className="profile-details">
              <p><strong>Bio:</strong> {profile.bio || <i>Not provided</i>}</p>
              <p><strong>Location:</strong> {profile.location || <i>Not set</i>}</p>
              <p><strong>Rate:</strong> {profile.hourly_rate ? `₹${profile.hourly_rate}/hr` : <i>Not set</i>}</p>
            </div>
            <Link to={`/profile/${user.id}`} className="edit-link">
              Edit Profile
            </Link>
          </>
        ) : (
          <div className="profile-empty">
            <p>Your profile is incomplete</p>
            <Link to={`/profile/${user.id}`} className="edit-link">
              Complete Profile
            </Link>
          </div>
        )}
      </div>

      {role === 'client' ? (
        <div className="client-actions">
          <button onClick={() => navigate('/post-project')} className="primary-button">
            Create New Project
          </button>
          <button
            onClick={() => navigate('/client-projects')}  // Changed this line
            className="secondary-button"
          >
            View Your Projects
          </button>
        </div>
      ) : (
        <div className="freelancer-actions">
          <button
            onClick={() => navigate('/my-proposals')}
            className="primary-button"
          >
            View Your Proposals
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="secondary-button"
          >
            Browse New Projects
          </button>
        </div>
      )}
    </div>
  );
}