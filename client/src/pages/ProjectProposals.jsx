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

    useEffect(() => {
        if (!user || user.role !== 'client') {
            navigate('/dashboard');
            return;
        }

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch project details
                const projectRes = await fetch(`http://localhost:4000/api/projects/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Fetch proposals
                const proposalsRes = await fetch(`http://localhost:4000/api/projects/${projectId}/proposals`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!projectRes.ok || !proposalsRes.ok) {
                    throw new Error('Failed to load data');
                }

                const projectData = await projectRes.json();
                const proposalsData = await proposalsRes.json();

                setProject(projectData);
                setProposals(proposalsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId, user, navigate]);

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

            // Update local state
            setProposals(proposals.map(p => {
                if (p.id === proposalId) return { ...p, status: 'accepted' };
                if (p.project_id === projectId) return { ...p, status: 'rejected' };
                return p;
            }));

            setProject({ ...project, status: 'assigned' });

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
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reject proposal');
            }

            setProposals(proposals.map(p =>
                p.id === proposalId ? { ...p, status: 'rejected' } : p
            ));

        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="loading">Loading proposals...</div>;

    return (
        <div className="project-proposals-container">
            <button onClick={() => navigate(-1)} className="back-button">
                ← Back to Projects
            </button>

            <h1>Proposals for: {project?.title}</h1>
            <p className="project-description">{project?.description}</p>

            {error && (
                <div className="error-alert">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            )}

            {proposals.length === 0 ? (
                <div className="empty-state">
                    <p>No proposals yet for this project</p>
                </div>
            ) : (
                <div className="proposals-list">
                    {proposals.map(proposal => (
                        <div key={proposal.id} className={`proposal-card ${proposal.status}`}>
                            <div className="proposal-header">
                                <h3>From: {proposal.freelancer_name}</h3>
                                <span className="status-badge">
                                    {proposal.status || 'pending'}
                                </span>
                            </div>

                            <div className="proposal-details">
                                <p><strong>Amount:</strong> ₹{proposal.proposed_amount}</p>
                                <p><strong>Submitted:</strong> {new Date(proposal.submitted_at).toLocaleString()}</p>
                                <div className="cover-letter">
                                    <p><strong>Cover Letter:</strong></p>
                                    <p>{proposal.cover_letter}</p>
                                </div>
                            </div>

                            {project.status !== 'assigned' && proposal.status === 'pending' && (
                                <div className="actions">
                                    <button
                                        onClick={() => handleAccept(proposal.id)}
                                        className="accept-button"
                                    >
                                        Accept Proposal
                                    </button>
                                    <button
                                        onClick={() => handleReject(proposal.id)}
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
        </div>
    );
}