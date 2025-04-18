import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProposalForm() {
    const { id } = useParams(); // Get the project ID from URL params
    const projectId = parseInt(id); // Convert to integer
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        cover_letter: '',
        proposed_amount: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Verify projectId is valid when component mounts
    useEffect(() => {
        if (isNaN(projectId)) {
            console.error('Invalid project ID in URL');
            navigate('/projects'); // Redirect if invalid project ID
        }
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

        // Double-check projectId before submission
        if (isNaN(projectId)) {
            alert('Invalid project');
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
                    ...formData,
                    proposed_amount: parseFloat(formData.proposed_amount)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit proposal');
            }

            alert('Proposal submitted successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Submission error:', error);
            alert(error.message || 'Failed to submit proposal');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isNaN(projectId)) {
        return <div>Invalid project</div>;
    }

    return (
        <div className="proposal-form-container">
            <h2>Submit Proposal for Project #{projectId}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="cover_letter">Cover Letter</label>
                    <textarea
                        id="cover_letter"
                        name="cover_letter"
                        value={formData.cover_letter}
                        onChange={handleChange}
                        placeholder="Explain why you're the best fit for this project..."
                        rows={6}
                        className={errors.cover_letter ? 'error' : ''}
                    />
                    {errors.cover_letter && (
                        <span className="error-message">{errors.cover_letter}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="proposed_amount">Proposed Amount (₹)</label>
                    <input
                        id="proposed_amount"
                        type="number"
                        name="proposed_amount"
                        value={formData.proposed_amount}
                        onChange={handleChange}
                        placeholder="Enter your proposed amount"
                        min="1"
                        step="0.01"
                        className={errors.proposed_amount ? 'error' : ''}
                    />
                    {errors.proposed_amount && (
                        <span className="error-message">{errors.proposed_amount}</span>
                    )}
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