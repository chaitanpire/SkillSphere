import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/EditProfile.css';

export default function EditProfile() {
    const { user, loading } = useAuth(); // Add loading state from your auth context
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        bio: '',
        location: '',
        hourly_rate: '',
        experience: ''
    });

    useEffect(() => {
        // Only proceed if user data is loaded
        if (!loading) {
            // Redirect if no user or trying to edit another user's profile
            if (!user || parseInt(id) !== user.id) {
                navigate('/dashboard');
                return;
            }

            // Fetch profile data
            fetch(`http://localhost:4000/api/users/${id}`)
                .then(res => res.json())
                .then(data => {
                    const profile = data.profile || {};
                    setFormData({
                        bio: profile.bio || '',
                        location: profile.location || '',
                        hourly_rate: profile.hourly_rate || '',
                        experience: profile.experience || ''
                    });
                })
                .catch(err => console.error('Error fetching profile:', err));
        }
    }, [id, user, loading, navigate]);

    const handleChange = e =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:4000/api/users/${id}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    bio: formData.bio,
                    location: formData.location,
                    // Only include fields that have changed
                })
            });

            if (res.ok) {
                alert('Profile updated successfully!');
                navigate(`/profile/${id}`);
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Update error:', err);
            alert('An error occurred while updating your profile');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="edit-profile-container">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                    <label>Bio</label>
                    <textarea
                        name="bio"
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Location</label>
                    <input
                        name="location"
                        placeholder="Your location"
                        value={formData.location}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Hourly Rate (₹)</label>
                    <input
                        type="number"
                        name="hourly_rate"
                        placeholder="Your hourly rate"
                        value={formData.hourly_rate}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Experience (years)</label>
                    <input
                        type="number"
                        name="experience"
                        placeholder="Years of experience"
                        value={formData.experience}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-button">Save Changes</button>
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => navigate(`/profile/${id}`)}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}