import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function ProposalsList() {
    const { id: projectId } = useParams();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projectTitle, setProjectTitle] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true; // Track mounted state

        const fetchData = async () => {
            console.log('Fetching proposals for project ID:', projectId);
            try {
                setLoading(true);
                setError(null);

                // Fetch project title and proposals in parallel
                const [projectRes, proposalsRes] = await Promise.all([
                    fetch(`http://localhost:4000/api/projects/${projectId}`),
                    fetch(`http://localhost:4000/api/projects/${projectId}/proposals`)
                ]);

                if (!projectRes.ok || !proposalsRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const projectData = await projectRes.json();
                const proposalsData = await proposalsRes.json();

                if (isMounted) {
                    setProjectTitle(projectData.title);
                    setProposals(proposalsData);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error loading data:', err);
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false; // Cleanup function
        };
    }, [projectId, proposals]);

    if (loading) return <p>Loading proposals...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="proposals-container">
            <h2>Proposals for: {projectTitle}</h2>
            {proposals.length === 0 ? (
                <p>No proposals yet for this project.</p>
            ) : (
                <ul className="proposals-list">
                    {proposals.map(proposal => (
                        <li key={proposal.id} className="proposal-card">
                            <div className="proposal-header">
                                <h3>{proposal.freelancer_name}</h3>
                                <span className={`status-badge ${proposal.status}`}>
                                    {proposal.status}
                                </span>
                            </div>
                            <div className="proposal-details">
                                <p><strong>Amount:</strong> ₹{proposal.proposed_amount}</p>
                                <p><strong>Submitted:</strong> {new Date(proposal.created_at).toLocaleString()}</p>
                                <div className="cover-letter">
                                    <p><strong>Cover Letter:</strong></p>
                                    <p>{proposal.cover_letter}</p>
                                </div>
                            </div>
                            {proposal.status === 'pending' && (
                                <div className="proposal-actions">
                                    <button className="accept-button">Accept</button>
                                    <button className="reject-button">Reject</button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}