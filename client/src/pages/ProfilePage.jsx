import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/users/${id}`);
                if (!res.ok) throw new Error('Failed to fetch profile');
                const data = await res.json();
                setProfileUser(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchProfile();
    }, [id]);

    if (loading) return <div className="profile-loading">Loading profile...</div>;
    if (error) return <div className="profile-error">Error: {error}</div>;

    const isOwner = user?.id === parseInt(id);
    const { profile } = profileUser || {};

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
            <h2>{isOwner ? "Your" : `${profileUser.name}'s`} Profile</h2>
            <p><strong>Name:</strong> {profileUser.name}</p>
            <p><strong>Email:</strong> {profileUser.email}</p>
            <p><strong>Role:</strong> {profileUser.role}</p>

            <hr style={{ margin: '1.5rem 0' }} />

            {profile ? (
                <>
                    <p><strong>Bio:</strong> {profile.bio || <i>No bio yet</i>}</p>
                    <p><strong>Location:</strong> {profile.location || <i>Not set</i>}</p>
                    <p><strong>Hourly Rate:</strong> {profile.hourly_rate ? `₹${profile.hourly_rate}/hr` : <i>Not set</i>}</p>
                    <p><strong>Experience:</strong> {profile.experience ? `${profile.experience} years` : <i>Not specified</i>}</p>
                    <p><strong>Rating:</strong> ⭐ {profile.rating ? Number(profile.rating).toFixed(1) : 'N/A'}</p>
                </>
            ) : (
                <p>This user hasn't set up a profile yet.</p>
            )}

            {isOwner && (
                <button
                    className="edit-profile-btn"
                    onClick={() => window.location.href = `/edit-profile/${user.id}`}
                >
                    {profile ? 'Edit Profile' : 'Add Profile Info'}
                </button>
            )}
        </div>
    );
}