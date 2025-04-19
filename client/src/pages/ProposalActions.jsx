import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProposalActions({ proposalId, onUpdate }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const navigate = useNavigate();

    const acceptProposal = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:4000/api/proposals/${proposalId}/accept`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ project_id: projectId }) // Send project_id in body
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to accept proposal');
            }

            const data = await response.json();

            // Update local state with the returned data
            onUpdate({
                ...data.proposal,
                status: 'accepted' // Ensure status is set
            });

            // Navigate to project page with success state
            navigate(`/project/${data.proposal.project_id}`, {
                state: {
                    success: true,
                    message: 'Proposal accepted successfully!'
                }
            });

        } catch (err) {
            console.error('Proposal acceptance error:', err);
            setError(err.message);
            // Optionally: show a toast notification
        } finally {
            setIsLoading(false);
        }
    };

    const rejectProposal = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:4000/api/proposals/${proposalId}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ reason: rejectReason })
            });

            if (!response.ok) {
                throw new Error('Failed to reject proposal');
            }

            const data = await response.json();
            onUpdate(data.proposal);
            setShowRejectModal(false);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="proposal-actions">
            {error && <div className="error-message">{error}</div>}

            <button
                onClick={acceptProposal}
                disabled={isLoading}
                className="accept-button"
            >
                {isLoading ? 'Accepting...' : 'Accept Proposal'}
            </button>

            <button
                onClick={() => setShowRejectModal(true)}
                disabled={isLoading}
                className="reject-button"
            >
                Reject Proposal
            </button>

            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Reject Proposal</h3>
                        <p>Please provide a reason for rejection (optional):</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                        />
                        <div className="modal-actions">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="cancel-button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={rejectProposal}
                                disabled={isLoading}
                                className="confirm-reject-button"
                            >
                                {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}