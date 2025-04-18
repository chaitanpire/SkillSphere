import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/MyProposals.css';

export default function MyProposals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'freelancer') {
      navigate('/dashboard');
      return;
    }

    const fetchProposals = async () => {
      try {
        console.log('Fetching proposals for user:', user);
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:4000/api/projects/proposals/my', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch proposals');
        }

        const data = await response.json();
        setProposals(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [user, navigate]);

  const handleWithdraw = async (proposalId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/proposals/${proposalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw proposal');
      }

      setProposals(proposals.filter(p => p.id !== proposalId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading your proposals...</div>;
  }

  return (
    <div className="my-proposals-container">
      <h1>Your Proposals</h1>

      {error && (
        <div className="error-alert">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="empty-state">
          <p>You haven't submitted any proposals yet.</p>
          <button
            onClick={() => navigate('/projects')}
            className="primary-button"
          >
            Browse Projects
          </button>
        </div>
      ) : (
        <div className="proposals-grid">
          {proposals.map(proposal => (
            <div key={proposal.id} className="proposal-card">
              <div className="card-header">
                <h3>{proposal.project_title}</h3>
                <span className={`status-badge ${proposal.status}`}>
                  {proposal.status}
                </span>
              </div>

              <div className="project-info">
                <p><strong>Client:</strong> {proposal.client_name}</p>
                <p><strong>Budget:</strong> ₹{proposal.project_budget}</p>
                <p><strong>Deadline:</strong> {new Date(proposal.project_deadline).toLocaleDateString()}</p>
              </div>

              <div className="proposal-details">
                <h4>Your Proposal</h4>
                <p><strong>Amount:</strong> ₹{proposal.proposed_amount}</p>
                <p><strong>Submitted:</strong> {new Date(proposal.submitted_at).toLocaleString()}</p>
                <div className="cover-letter">
                  <p><strong>Cover Letter:</strong></p>
                  <p>{proposal.cover_letter}</p>
                </div>
              </div>

              <div className="actions">
                {proposal.status === 'pending' && (
                  <button
                    onClick={() => handleWithdraw(proposal.id)}
                    className="withdraw-button"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}