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
    const [summaries, setSummaries] = useState({}); // State to store summaries
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [freelancerRating, setFreelancerRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');

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

            // Show rating modal instead of navigating away
            setShowRatingModal(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmitRating = async () => {
        // Find the accepted proposal to get the freelancer ID
        const acceptedProposal = proposals.find(p => p.status === 'accepted');

        if (!acceptedProposal) {
            setError('Could not find the freelancer to rate');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            console.log('Submitting rating:', {
                rated_id: acceptedProposal.freelancer_id,
                project_id: projectId,
                rating: freelancerRating,
                comment: ratingComment
            });

            const response = await fetch(`http://localhost:4000/api/users/ratings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rated_id: acceptedProposal.freelancer_id,
                    project_id: projectId,
                    rating: freelancerRating,
                    comment: ratingComment
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit rating');
            }

            // Close the rating modal and stay on the same page
            setShowRatingModal(false);

            // Show success message
            alert('Thank you for your rating! The project is now marked as complete.');

            // Refresh the proposal data to show updated ratings
            window.location.reload();

        } catch (err) {
            console.error('Rating submission error:', err);
            setError(err.message);
        }
    };

    const handleSummarize = async (proposalId, coverLetter) => {
        setSummaries(prev => ({ ...prev, [proposalId]: 'Summarizing...' }));

        try {
            const response = await fetch('https://models.aixplain.com/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer 2daee4480c2a62f87e472fb681d871057dcece65c58c02c692cbd59470b215a0`
                },
                body: JSON.stringify({
                    model: "6646261c6eb563165658bbb1",
                    messages: [
                        {
                            role: "system",
                            content: "You are a summarization assistant."
                        },
                        {
                            role: "user",
                            content: `Summarize the following text: ${coverLetter}`
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to summarize the cover letter');
            }

            const data = await response.json();
            const summary = data.choices[0].message.content;

            setSummaries(prev => ({ ...prev, [proposalId]: summary }));
        } catch (err) {
            console.error('Error summarizing cover letter:', err);
            alert('Failed to summarize the cover letter. Please try again.');
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

                                    <span className={`status-badge ${proposal.status}`}>
                                        {proposal.status || 'pending'}
                                    </span>

                                    <div className="freelancer-profile">
                                        <button onClick={() => navigate(`/profile/${proposal.freelancer_id}`)}>
                                            View Profile
                                        </button>
                                    </div>

                                    <div className="rating">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i} className={i < Math.floor(Number(proposal.freelancer_rating) || 0) ? 'filled' : ''}>
                                                ★
                                            </span>
                                        ))}
                                        <span>({Number(proposal.freelancer_rating) || 0})</span>
                                    </div>
                                    <p className="freelancer-location">
                                        {proposal.freelancer_location || 'Location not specified'}
                                    </p>
                                </div>

                            </div>

                            <div className="proposal-details">
                                <div className="proposal-meta">
                                    <p><strong>Amount:</strong> ₹{proposal.proposed_amount}</p>
                                    <p><strong>Submitted:</strong> {new Date(proposal.submitted_at).toLocaleString()}</p>
                                </div>
                                {project?.status === 'in_progress' && proposal?.status === 'accepted' && (
                                    <button
                                        className="mark-complete-button"
                                        onClick={handleMarkComplete}
                                    >
                                        Mark Project as Complete
                                    </button>
                                )}
                                <div className='summary'>
                                    {summaries[proposal.id] == undefined && (
                                        <button
                                            className="summary-button"
                                            onClick={() => handleSummarize(proposal.id, proposal.cover_letter)}
                                        > Summarise </button>
                                    )}
                                    {summaries[proposal.id] && (
                                        <div className="summary">
                                            <h4>Summary:</h4>
                                            <p>{summaries[proposal.id]}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="cover-letter">
                                    <h4>Cover Letter:</h4>
                                    <div className="scrollable-box" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        <p>{proposal.cover_letter}</p>
                                    </div>
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
                                        disabled={proposal.status !== 'pending'} // Disable button after action
                                    >
                                        Accept Proposal
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(proposal.id)}
                                        className="reject-button"
                                        disabled={proposal.status !== 'pending'} // Disable button after action
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

            {/* Rating Modal */}
            {showRatingModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Rate the Freelancer</h3>
                        <p>Please rate the freelancer's work on this project:</p>

                        <div className="rating-stars">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                    key={i}
                                    className={i < freelancerRating ? 'star filled' : 'star'}
                                    onClick={() => setFreelancerRating(i + 1)}
                                    style={{
                                        cursor: 'pointer',
                                        fontSize: '2rem',
                                        color: i < freelancerRating ? '#ffc107' : '#e4e5e9',
                                        marginRight: '5px'
                                    }}
                                >
                                    ★
                                </span>
                            ))}
                            <span style={{ marginLeft: '10px' }}>
                                {freelancerRating > 0 ? `${freelancerRating} star${freelancerRating > 1 ? 's' : ''}` : 'Select rating'}
                            </span>
                        </div>

                        <div className="form-group">
                            <label>Comments (optional):</label>
                            <textarea
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                placeholder="Share your experience working with this freelancer..."
                                style={{ width: '100%', minHeight: '100px', padding: '8px', marginTop: '5px' }}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => setShowRatingModal(false)}
                                className="cancel-button"
                                style={{ marginRight: '10px' }}
                            >
                                Skip Rating
                            </button>
                            <button
                                onClick={() => handleSubmitRating()}
                                className="submit-rating-button"
                                disabled={freelancerRating === 0}
                                style={{
                                    backgroundColor: freelancerRating > 0 ? '#4CAF50' : '#ccc',
                                    color: 'white',
                                    padding: '10px 15px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: freelancerRating > 0 ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Submit Rating
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}