import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EditProfile() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        bio: '',
        location: '',
        hourly_rate: '',
        experience: ''
    });

    useEffect(() => {
        if (user?.id) {
            fetch(`http://localhost:4000/api/users/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    const profile = data.profile || {};
                    setFormData({
                        bio: profile.bio || '',
                        location: profile.location || '',
                        hourly_rate: profile.hourly_rate || '',
                        experience: profile.experience || ''
                    });
                });
        }
    }, [user]);

    const handleChange = e =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        const res = await fetch(`http://localhost:4000/api/users/${user.id}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            alert('Profile updated!');
            navigate(`/profile/${user.id}`);
        } else {
            alert('Failed to update profile');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Edit Profile</h2>
            <textarea name="bio" placeholder="Bio" value={formData.bio} onChange={handleChange} />
            <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} />
            <input name="hourly_rate" placeholder="Hourly Rate" value={formData.hourly_rate} onChange={handleChange} />
            <input name="experience" placeholder="Experience (in years)" value={formData.experience} onChange={handleChange} />
            <button type="submit">Save Changes</button>
        </form>
    );
}
