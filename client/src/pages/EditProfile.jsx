import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import SkillSelector from '../components/SkillSelector';
import '../styles/EditProfile.css';

export default function EditProfile() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: paramId } = useParams();

    const [state, setState] = useState({
        loading: true,
        authorized: false,
        formData: {
            bio: '',
            location: '',
            experience: '',
            skills: []
        },
        error: null,
        isSubmitting: false,
        success: false
    });

    const userId = parseInt(paramId);
    const isOwner = !authLoading && user?.id === userId;

    useEffect(() => {
        let isMounted = true;

        const verifyAndLoad = async () => {
            try {
                if (authLoading) return;

                if (!user || !isOwner) {
                    navigate('/dashboard');
                    return;
                }

                const response = await fetch(`http://localhost:4000/api/users/${userId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch profile');

                const data = await response.json();
                const profile = data.profile || {};

                // Fetch user skills separately
                const skillsResponse = await fetch(`http://localhost:4000/api/users/${userId}/skills`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const skillsData = skillsResponse.ok ? await skillsResponse.json() : [];
                const userSkillIds = Array.isArray(skillsData) ? skillsData.map(skill => skill.id) : [];

                if (isMounted) {
                    setState({
                        loading: false,
                        authorized: true,
                        formData: {
                            bio: profile.bio || '',
                            location: profile.location || '',
                            experience: profile.experience || '',
                            skills: userSkillIds
                        },
                        error: null,
                        isSubmitting: false
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

    const handleSkillsChange = (newSkills) => {
        setState(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                skills: newSkills
            }
        }));
    };

    const updateProfile = async () => {
        const response = await fetch(`http://localhost:4000/api/users/${userId}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                bio: state.formData.bio,
                location: state.formData.location,
                experience: state.formData.experience
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Profile update failed');
        }
    };

    const updateSkills = async () => {
        const response = await fetch(`http://localhost:4000/api/users/${userId}/skills`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ skills: state.formData.skills })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Skills update failed');
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        try {
            setState(prev => ({ ...prev, isSubmitting: true, error: null }));

            // Update profile and skills in parallel
            await Promise.all([updateProfile(), updateSkills()]);

            setState(prev => ({ ...prev, isSubmitting: false, success: true }));

            setTimeout(() => navigate(`/profile/${userId}`), 1500);
        } catch (error) {
            console.error('Update error:', error);
            setState(prev => ({
                ...prev,
                isSubmitting: false,
                error: error.message
            }));
        }
    };

    if (authLoading || state.loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner large"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3>Error Loading Profile</h3>
                <p>{state.error}</p>
                <button
                    className="retry-button"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!state.authorized) {
        return (
            <div className="unauthorized-container">
                <h3>Access Denied</h3>
                <p>You don't have permission to edit this profile</p>
                <button
                    className="back-button"
                    onClick={() => navigate('/dashboard')}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="edit-profile-container">
            <div className="edit-profile-header">
                <h2>Edit Your Profile</h2>
                <p className="edit-profile-subtitle">
                    Update your information to keep your profile fresh and accurate
                </p>
            </div>

            {state.success && (
                <div className="success-message">
                    ✅ Profile updated successfully! Redirecting...
                </div>
            )}

            {state.error && (
                <div className="error-message">
                    ⚠️ {state.error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-section">
                    <h3 className="section-title">Basic Information</h3>

                    <div className="form-group">
                        <label>Bio</label>
                        <textarea
                            name="bio"
                            placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                            value={state.formData.bio}
                            onChange={handleChange}
                            rows="5"
                            maxLength="500"
                        />
                        <div className="character-count">
                            {state.formData.bio.length}/500 characters
                        </div>
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
                            <label>Experience (years)</label>
                            <input
                                type="number"
                                name="experience"
                                placeholder="0"
                                value={state.formData.experience}
                                onChange={handleChange}
                                min="0"
                                max="50"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="section-title">Skills</h3>
                    <SkillSelector
                        selectedSkills={state.formData.skills}
                        onSkillsChange={handleSkillsChange}
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => navigate(`/profile/${userId}`)}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="save-button"
                        disabled={state.isSubmitting}
                    >
                        {state.isSubmitting ? (
                            <>
                                <span className="spinner"></span>
                                Saving...
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}