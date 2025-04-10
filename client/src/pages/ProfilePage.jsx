import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [profileUser, setProfileUser] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:4000/api/users/${id}`)
            .then(res => res.json())
            .then(data => setProfileUser(data));
    }, [id]);

    if (!profileUser) return <p>Loading profile...</p>;

    const isOwner = user?.id === parseInt(id);

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
            <h2>{isOwner ? "Your" : `${profileUser.name}'s`} Profile</h2>
            <p><strong>Name:</strong> {profileUser.name}</p>
            <p><strong>Email:</strong> {profileUser.email}</p>
            <p><strong>Role:</strong> {profileUser.role}</p>

            <hr style={{ margin: '1.5rem 0' }} />

            {profileUser.profile ? (
                <>
                    <p><strong>Bio:</strong> {profileUser.profile.bio || <i>No bio yet</i>}</p>
                    <p><strong>Location:</strong> {profileUser.profile.location || <i>Not set</i>}</p>
                    <p><strong>Hourly Rate:</strong> {profileUser.profile.hourly_rate ? `₹${profileUser.profile.hourly_rate}/hr` : <i>Not set</i>}</p>
                    <p><strong>Experience:</strong> {profileUser.profile.experience ? `${profileUser.profile.experience} years` : <i>Not specified</i>}</p>
                    <p><strong>Rating:</strong> ⭐ {profileUser.profile.rating ?? 'N/A'}</p>
                </>
            ) : (
                <p>This user hasn't set up a profile yet.</p>
            )}

            {isOwner && (
                <button
                    className="edit-profile-btn"
                    onClick={() => window.location.href = '/edit-profile'}
                >
                    Add Profile Info
                </button>
            )}
        </div>
    );
}
