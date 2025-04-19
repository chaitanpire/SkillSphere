import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/ProjectProposals.css';

export default function ProjectProposals() {
    const { id: projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('rating');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'client') {
            navigate('/dashboard');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('token');

                // Fetch project details
                const projectRes = await fetch(`http://localhost:4000/api/projects/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!projectRes.ok) throw new Error('Failed to load project');

                const projectData = await projectRes.json();

                // Verify current user is the project owner
                if (projectData.client_id !== user.id) {
                    navigate('/dashboard');
                    return;
                }

                // Fetch proposals with freelancer ratings
                const proposalsRes = await fetch(
                    `http://localhost:4000/api/projects/${projectId}/proposals?sort=${sortBy}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (!proposalsRes.ok) throw new Error('Failed to load proposals');

                const proposalsData = await proposalsRes.json();
                console.log('Proposals:', proposalsData);
                // Ensure all proposals have a rating with default value if undefined
                const processedProposals = proposalsData.map(proposal => ({
                    ...proposal,
                    freelancer_rating: proposal.freelancer_rating || 0
                }));

                setProject(projectData);
                setProposals(processedProposals);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId, user, navigate, sortBy]);

    const handleAccept = async (proposalId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/proposals/${proposalId}/accept`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to accept proposal');
            }

            const data = await response.json();

            // Update local state
            setProposals(proposals.map(p => {
                if (p.id === proposalId) return { ...p, status: 'accepted' };
                if (p.status === 'pending') return { ...p, status: 'rejected' };
                return p;
            }));

            setProject(prev => ({ ...prev, status: 'in_progress', freelancer_id: data.proposal.freelancer_id }));

        } catch (err) {
            setError(err.message);
        }
    };

    const handleReject = async (proposalId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/proposals/${proposalId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: rejectReason })
            });

            if (!response.ok) {
                throw new Error('Failed to reject proposal');
            }

            setProposals(proposals.map(p =>
                p.id === proposalId ? { ...p, status: 'rejected' } : p
            ));

            setShowRejectModal(null);
            setRejectReason('');
        } catch (err) {
            setError(err.message);
        }
    };
    const handleMarkComplete = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/projects/${projectId}/complete`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to mark project as complete');

            setProject(prev => ({ ...prev, status: 'completed' }));
            // navigate to transactions page or show success message
            alert('Project marked as complete. Please proceed to the transactions page.');
            navigate('/transactions');
        } catch (err) {
            setError(err.message);
        }
    };

    const sortedProposals = [...proposals].sort((a, b) => {
        if (sortBy === 'rating') return b.freelancer_rating - a.freelancer_rating;
        return a.proposed_amount - b.proposed_amount;
    });

    if (loading) return <div className="loading">Loading proposals...</div>;
    return (
        <div className="project-proposals-container">
            <button onClick={() => navigate(-1)} className="back-button">
                ←
            </button>

            <div className="project-header">
                <h1>Proposals for: {project?.title}</h1>
                <p className="project-description">{project?.description}</p>
                <div className="project-meta">
                    <span>Budget: ₹{project?.budget}</span>
                    <span>Status: {project?.status}</span>
                </div>
            </div>

            {error && (
                <div className="error-alert">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            )}

            <div className="sort-controls">
                <label>Sort by:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="rating">Highest Rating</option>
                    <option value="price">Lowest Price</option>
                </select>
            </div>

            {proposals.length === 0 ? (
                <div className="empty-state">
                    <p>No proposals yet for this project</p>
                </div>
            ) : (
                <div className="proposals-list">
                    {sortedProposals.map(proposal => (
                        <div key={proposal.id} className={`proposal-card ${proposal.status}`}>
                            <div className="proposal-header">
                                <div className="freelancer-info">
                                    <h3>{proposal.freelancer_name}</h3>
                                    <div className="rating">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i} className={i < Math.floor(proposal.freelancer_rating || 0) ? 'filled' : ''}>
                                                ★
                                            </span>
                                        ))}
                                        <span>({(proposal.freelancer_rating || 0)})</span>
                                    </div>
                                    <p className="freelancer-location">
                                        {proposal.freelancer_location || 'Location not specified'}
                                    </p>
                                </div>
                                <span className={`status-badge ${proposal.status}`}>
                                    {proposal.status || 'pending'}
                                </span>
                            </div>

                            <div className="proposal-details">
                                <div className="proposal-meta">
                                    <p><strong>Amount:</strong> ₹{proposal.proposed_amount}</p>
                                    <p><strong>Delivery Time:</strong> {proposal.estimated_days} days</p>
                                    <p><strong>Submitted:</strong> {new Date(proposal.submitted_at).toLocaleString()}</p>
                                </div>
                                {project?.status === 'in_progress' && (
                                    <button
                                        className="mark-complete-button"
                                        onClick={handleMarkComplete}
                                    >
                                        Mark Project as Complete
                                    </button>
                                )}

                                <div className="cover-letter">
                                    <h4>Cover Letter:</h4>
                                    <p>{proposal.cover_letter}</p>
                                </div>

                                {proposal.freelancer_skills && (
                                    <div className="skills">
                                        <h4>Skills:</h4>
                                        <div className="skill-tags">
                                            {proposal.freelancer_skills.split(',').map(skill => (
                                                <span key={skill} className="skill-tag">{skill.trim()}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {project?.status === 'open' && proposal.status === 'pending' && (
                                <div className="actions">
                                    <button
                                        onClick={() => handleAccept(proposal.id)}
                                        className="accept-button"
                                    >
                                        Accept Proposal
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(proposal.id)}
                                        className="reject-button"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Proposal Modal */}
            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Reject Proposal</h3>
                        <p>Are you sure you want to reject this proposal?</p>

                        <div className="form-group">
                            <label>Reason (optional):</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Provide feedback to the freelancer..."
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => {
                                    setShowRejectModal(null);
                                    setRejectReason('');
                                }}
                                className="cancel-button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleReject(showRejectModal)}
                                className="confirm-reject-button"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}