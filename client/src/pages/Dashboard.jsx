import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return <p>Loading...</p>;

  const { name, email, role, profile } = user;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
      <h2>Welcome back, <span style={{ color: '#007bff' }}>{name}</span> 👋</h2>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Role:</strong> {role.charAt(0).toUpperCase() + role.slice(1)}</p>

      {profile ? (
        <>
          <hr style={{ margin: '1.5rem 0' }} />
          <h3>Your Profile Details</h3>
          <p><strong>Bio:</strong> {profile.bio || <i>No bio yet</i>}</p>
          <p><strong>Location:</strong> {profile.location || <i>Not set</i>}</p>
          <p><strong>Hourly Rate:</strong> {profile.hourly_rate ? `₹${profile.hourly_rate}/hr` : <i>Not set</i>}</p>
          <p><strong>Experience:</strong> {profile.experience ? `${profile.experience} years` : <i>Not specified</i>}</p>
          <p><strong>Rating:</strong> ⭐ {profile.rating ?? 'N/A'}</p>

          <Link to={`/profile/${user.id}`} className="nav-link" style={{ color: '#007bff', textDecoration: 'underline' }}>
            Edit Profile →
          </Link>
        </>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <p>You haven't created your profile yet.</p>
          <Link to={`/profile/${user.id}`} className="nav-link" style={{ color: '#007bff', textDecoration: 'underline' }}>
            Complete Profile →
          </Link>
        </div>
      )}
    </div>
  );
}
