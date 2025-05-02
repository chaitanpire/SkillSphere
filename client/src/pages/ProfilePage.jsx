import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/api/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch profile');
        }

        const data = await res.json();
        console.log('Profile data:', data); // Debug log
        setProfileUser(data);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const isOwner = user?.id === parseInt(id);
  const { profile = {} } = profileUser || {};

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Profile</h3>
        <p>{error}</p>
        <button
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  const renderSection = (title, content, fallback = 'Not specified') => {
    if (!content) return null;
    return (
      <section className="profile-section">
        <h3 className="section-title">{title}</h3>
        {typeof content === 'string' ? (
          <p>{content || <span className="empty-field">{fallback}</span>}</p>
        ) : (
          content
        )}
      </section>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>{isOwner ? "Your Profile" : `${profileUser?.name}'s Profile`}</h2>
          {isOwner && (
            <button
              className="edit-profile-btn"
              onClick={() => navigate(`/edit-profile/${user.id}`)}
            >
              {Object.keys(profile).length > 0 ? 'Edit Profile' : 'Complete Profile'}
            </button>
          )}
        </div>

        <div className="profile-content">
          {renderSection(
            'Basic Information',
            <>
              <p><strong>Name:</strong> {profileUser?.name}</p>
              <p><strong>Email:</strong> {profileUser?.email}</p>
              <p><strong>Role:</strong> {profileUser?.role}</p>
            </>
          )}

          {Object.keys(profile).length > 0 ? (
            <>
              {renderSection('About', profile.bio)}
              {renderSection(
                'Professional Details',
                <>
                  <p><strong>Location:</strong> {profile.location}</p>
                  <p><strong>Experience:</strong> {profile.experience ? `${profile.experience} years` : null}</p>
                  <p><strong>Rating:</strong> {profile.rating ? (
                    <span className="rating">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`star ${i < Math.round(profile.rating) ? 'filled' : ''}`}>★</span>
                      ))}
                      ({Number(profile.rating).toFixed(1)})
                    </span>
                  ) : null}</p>
                </>
              )}

              {profileUser?.skills && profileUser.skills.length > 0 && renderSection(
                'Skills',
                <div className="skills-container">
                  {profileUser.skills.map(skill => (
                    <span key={skill.id} className="skill-tag">
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}

              {profile.education && renderSection(
                'Education',
                `${profile.education.degree} - ${profile.education.institution} (${profile.education.year})`
              )}

              {profile.certifications?.length > 0 && renderSection(
                'Certifications',
                <ul className="certifications-list">
                  {profile.certifications.map((cert, index) => (
                    <li key={index}>{cert}</li>
                  ))}
                </ul>
              )}

              {profile.portfolio && renderSection(
                'Portfolio',
                <a href={profile.portfolio} target="_blank" rel="noreferrer" className="portfolio-link">
                  {profile.portfolio}
                </a>
              )}

              {profile.languages?.length > 0 && renderSection(
                'Languages',
                profile.languages.join(', ')
              )}
            </>
          ) : (
            <div className="empty-profile">
              <p>This user hasn't set up a profile yet.</p>
              {isOwner && (
                <button
                  className="create-profile-btn"
                  onClick={() => navigate(`/edit-profile/${user.id}`)}
                >
                  Create Your Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}