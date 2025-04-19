import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/EditProfile.css';

export default function EditProfile() {
    // Hooks and state initialization
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    
    const [state, setState] = useState({
        loading: true,
        authorized: false,
        formData: {
            bio: '',
            location: '',
            hourly_rate: '',
            experience: ''
        },
        error: null
    });

    // Derived values
    const userId = parseInt(paramId);
    const isOwner = !authLoading && user?.id === userId;

    // Main effect for authorization and data loading
    useEffect(() => {
        let isMounted = true;

        const verifyAndLoad = async () => {
            try {
                // Wait for auth to complete
                if (authLoading) return;

                // Authorization check
                if (!user || !isOwner) {
                    console.warn(`Unauthorized access: User ${user?.id} trying to edit ${userId}`);
                    navigate('/dashboard');
                    return;
                }

                // Fetch profile data
                const response = await fetch(`http://localhost:4000/api/users/${userId}`);
                if (!response.ok) throw new Error('Failed to fetch profile');
                
                const data = await response.json();
                const profile = data.profile || {};

                if (isMounted) {
                    setState({
                        loading: false,
                        authorized: true,
                        formData: {
                            bio: profile.bio || '',
                            location: profile.location || '',
                            hourly_rate: profile.hourly_rate || '',
                            experience: profile.experience || ''
                        },
                        error: null
                    });
                }
            } catch (error) {
                console.error('Profile load error:', error);
                if (isMounted) {
                    setState(prev => ({
                        ...prev,
                        loading: false,
                        error: error.message
                    }));
                }
            }
        };

        verifyAndLoad();

        return () => {
            isMounted = false;
        };
    }, [authLoading, user, userId, navigate, isOwner]);

    // Handle form changes
    const handleChange = e => {
        const { name, value } = e.target;
        setState(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                [name]: value
            }
        }));
    };

    // Handle form submission
    const handleSubmit = async e => {
        e.preventDefault();
        
        try {
            const response = await fetch(`http://localhost:4000/api/users/${userId}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(state.formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Profile update failed');
            }

            alert('Profile updated successfully!');
            navigate(`/profile/${userId}`);
        } catch (error) {
            console.error('Update error:', error);
            alert(error.message || 'An error occurred while updating your profile');
        }
    };

    // Render loading states
    if (authLoading || state.loading) {
        return <div className="loading">Loading profile data...</div>;
    }

    // Render error state
    if (state.error) {
        return (
            <div className="error-container">
                <h3>Error Loading Profile</h3>
                <p>{state.error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    // Render unauthorized state (should theoretically never reach here due to redirect)
    if (!state.authorized) {
        return <div className="unauthorized">You don't have permission to edit this profile</div>;
    }

    // Main form render
    return (
        <div className="edit-profile-container">
            <h2>Edit Your Profile</h2>
            
            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                    <label>Bio</label>
                    <textarea
                        name="bio"
                        placeholder="Tell us about yourself..."
                        value={state.formData.bio}
                        onChange={handleChange}
                        rows="5"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Location</label>
                        <input
                            name="location"
                            placeholder="City, Country"
                            value={state.formData.location}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Hourly Rate (₹)</label>
                        <input
                            type="number"
                            name="hourly_rate"
                            placeholder="0.00"
                            value={state.formData.hourly_rate}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Experience (years)</label>
                        <input
                            type="number"
                            name="experience"
                            placeholder="0"
                            value={state.formData.experience}
                            onChange={handleChange}
                            min="0"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-button">
                        Save Changes
                    </button>
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => navigate(`/profile/${userId}`)}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}