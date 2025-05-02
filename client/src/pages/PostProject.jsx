import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SkillSelector from '../components/ProjectSkillSelector';
import '../styles/PostProject.css';

const PostProject = () => {
    const [state, setState] = useState({
        step: 1,
        formData: {
            title: '',
            description: '',
            budget: '',
            deadline: '',
            skills: []
        },
        loading: false,
        error: null,
        isSubmitting: false,
        success: false
    });
    
    const navigate = useNavigate();

    const handleInputChange = (e) => {
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

    const validateStep1 = () => {
        if (!state.formData.title.trim()) {
            setState(prev => ({ ...prev, error: 'Project title is required' }));
            return false;
        }
        if (!state.formData.description.trim()) {
            setState(prev => ({ ...prev, error: 'Project description is required' }));
            return false;
        }
        return true;
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (validateStep1()) {
            setState(prev => ({ ...prev, step: 2, error: null }));
        }
    };

    const handleBack = () => {
        setState(prev => ({ ...prev, step: 1, error: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setState(prev => ({ ...prev, isSubmitting: true, error: null }));
        
        try {
            // Step 1: Create the project
            const token = localStorage.getItem('token');
            const projectResponse = await fetch('http://localhost:4000/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: state.formData.title,
                    description: state.formData.description,
                    budget: state.formData.budget,
                    deadline: state.formData.deadline
                })
            });
    
            if (!projectResponse.ok) {
                const errorData = await projectResponse.json();
                throw new Error(errorData.message || 'Failed to create project');
            }
    
            const projectData = await projectResponse.json();
            const projectId = projectData.id;
    
            // Step 2: Add skills if any were selected
            if (state.formData.skills.length > 0) {
                const skillsResponse = await fetch(`http://localhost:4000/api/projects/${projectId}/skills`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ skills: state.formData.skills }) // Send the entire skills array
                });
    
                if (!skillsResponse.ok) {
                    const errorData = await skillsResponse.json();
                    throw new Error(errorData.message || 'Project created but failed to add skills');
                }
            }
    
            setState(prev => ({ ...prev, isSubmitting: false, success: true }));
            
            setTimeout(() => {
                navigate('/client-projects', { 
                    state: { 
                        success: true,
                        message: 'Project posted successfully!' 
                    } 
                });
            }, 1500);
        } catch (err) {
            console.error('Error:', err);
            setState(prev => ({
                ...prev,
                isSubmitting: false,
                error: err.message || 'Failed to post project'
            }));
        }
    };

    return (
        <div className="project-form-container">
            <h1>Post a New Project</h1>
            

            {state.error && (
                <div className="error-message">
                    ⚠️ {state.error}
                </div>
            )}

            {state.success && (
                <div className="success-message">
                    ✅ Project posted successfully! Redirecting...
                </div>
            )}

            <form onSubmit={state.step === 1 ? handleNext : handleSubmit}>
                {state.step === 1 ? (
                    <div className="form-section">
                        <div className="form-group">
                            <label>Project Title</label>
                            <input
                                type="text"
                                name="title"
                                value={state.formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter project title"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={state.formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe your project in detail"
                                rows={6}
                                required
                            />
                        </div>

                        <div className="form-actions single">
                            <button 
                                type="submit" 
                                className="next-btn"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="form-section">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Budget ($)</label>
                                <input
                                    type="number"
                                    name="budget"
                                    value={state.formData.budget}
                                    onChange={handleInputChange}
                                    placeholder="Estimated budget"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Deadline</label>
                                <input
                                    type="date"
                                    name="deadline"
                                    value={state.formData.deadline}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Required Skills</label>
                            <SkillSelector
                                selectedSkills={state.formData.skills}
                                onSkillsChange={handleSkillsChange}
                            />
                        </div>

                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="back-btn"
                                onClick={handleBack}
                                disabled={state.isSubmitting}
                            >
                                Back
                            </button>
                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={state.isSubmitting}
                            >
                                {state.isSubmitting ? (
                                    <>
                                        <span className="spinner"></span>
                                        Posting...
                                    </>
                                ) : 'Post Project'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default PostProject;