import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProposalForm() {
    const { id } = useParams();
    const projectId = parseInt(id);
    const { user } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [formData, setFormData] = useState({
        cover_letter: '',
        proposed_amount: '',
        estimated_days: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch project details to display and validate against
    useEffect(() => {
        if (isNaN(projectId)) {
            console.error('Invalid project ID in URL');
            navigate('/projects');
            return;
        }

        const fetchProject = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:4000/api/projects/${projectId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Project not found');
                }

                const data = await response.json();
                setProject(data);

                // Pre-populate proposed amount with project budget as default
                setFormData(prev => ({
                    ...prev,
                    proposed_amount: data.budget
                }));
            } catch (err) {
                console.error('Error loading project:', err);
                navigate('/projects');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, navigate]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.cover_letter.trim()) {
            newErrors.cover_letter = 'Cover letter is required';
        } else if (formData.cover_letter.length < 50) {
            newErrors.cover_letter = 'Cover letter should be at least 50 characters';
        }

        if (!formData.proposed_amount) {
            newErrors.proposed_amount = 'Proposed amount is required';
        } else if (isNaN(formData.proposed_amount) || parseFloat(formData.proposed_amount) <= 0) {
            newErrors.proposed_amount = 'Please enter a valid positive number';
        }

        if (!formData.estimated_days) {
            newErrors.estimated_days = 'Estimated days is required';
        } else if (isNaN(formData.estimated_days) || parseInt(formData.estimated_days) <= 0) {
            newErrors.estimated_days = 'Please enter a valid number of days';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (!user || user.role !== 'freelancer') {
            alert('Only freelancers can submit proposals');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/projects/${projectId}/proposals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    cover_letter: formData.cover_letter,
                    proposed_amount: parseFloat(formData.proposed_amount),
                    estimated_days: parseInt(formData.estimated_days)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit proposal');
            }

            alert('Proposal submitted successfully!');
            navigate('/freelancer/proposals');
        } catch (error) {
            console.error('Submission error:', error);
            alert(error.message || 'Failed to submit proposal');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading project details...</div>;
    }

    if (!project) {
        return <div className="error">Project not found</div>;
    }

    return (
        <div className="proposal-form-container">
            <h2>Submit Proposal</h2>

            <div className="project-summary">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="project-meta">
                    <div className="meta-item">
                        <strong>Budget:</strong> ₹{project.budget}
                    </div>
                    <div className="meta-item">
                        <strong>Expected Work Hours:</strong> {project.expected_work_hours || 'Not specified'}
                    </div>
                    <div className="meta-item">
                        <strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}
                    </div>
                </div>

                {project.skills && project.skills.length > 0 && (
                    <div className="project-skills">
                        <strong>Required Skills:</strong>
                        <div className="skill-tags">
                            {project.skills.map(skill => (
                                <span key={skill.id} className="skill-tag">{skill.name}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="proposal-form">
                <div className="form-group">
                    <label htmlFor="cover_letter">Cover Letter</label>
                    <textarea
                        id="cover_letter"
                        name="cover_letter"
                        value={formData.cover_letter}
                        onChange={handleChange}
                        placeholder="Explain why you're the best fit for this project, your relevant experience, and how you plan to approach it..."
                        rows={8}
                        className={errors.cover_letter ? 'error' : ''}
                    />
                    {errors.cover_letter && (
                        <span className="error-message">{errors.cover_letter}</span>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="proposed_amount">Proposed Amount (₹)</label>
                        <input
                            id="proposed_amount"
                            type="number"
                            name="proposed_amount"
                            value={formData.proposed_amount}
                            onChange={handleChange}
                            placeholder="Enter your bid amount"
                            min="1"
                            step="0.01"
                            className={errors.proposed_amount ? 'error' : ''}
                        />
                        {errors.proposed_amount && (
                            <span className="error-message">{errors.proposed_amount}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="estimated_days">Estimated Completion (Days)</label>
                        <input
                            id="estimated_days"
                            type="number"
                            name="estimated_days"
                            value={formData.estimated_days}
                            onChange={handleChange}
                            placeholder="Number of days needed"
                            min="1"
                            className={errors.estimated_days ? 'error' : ''}
                        />
                        {errors.estimated_days && (
                            <span className="error-message">{errors.estimated_days}</span>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="submit-button"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
            </form>
        </div>
    );
}