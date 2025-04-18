import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function ProposalsList() {
    const { id: projectId } = useParams();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projectTitle, setProjectTitle] = useState('');

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/projects/${projectId}/proposals`);
                const data = await res.json();
                setProposals(data);
            } catch (err) {
                console.error('Failed to load proposals:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProposals();
        // fetch project title
        const fetchProjectTitle = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/projects/${projectId}`);
                const data = await res.json();
                setProjectTitle(data.title);
            } catch (err) {
                console.error('Failed to load project title:', err);
            }
        };
        fetchProjectTitle();

    }, [projectId]);

    if (loading) return <p>Loading proposals...</p>;

    return (
        <div className="proposals-container">
            <h2>Proposals for the Project: {projectTitle}</h2>
            {proposals.length === 0 ? (
                <p>No proposals yet.</p>
            ) : (
                <ul className="proposals-list">
                    {proposals.map(proposal => (
                        <li key={proposal.id} className="proposal-card">
                            <h3>From: {proposal.freelancer_name}</h3>
                            <p><strong>Amount:</strong> ₹{proposal.proposed_amount}</p>
                            <p><strong>Cover Letter:</strong> {proposal.cover_letter}</p>
                            <p><strong>Status:</strong> {proposal.status}</p>
                            <div className="proposal-actions">
                                <button>Accept</button>
                                <button>Reject</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}