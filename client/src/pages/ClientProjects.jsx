import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ClientProjects() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'client') {
            navigate('/dashboard');
            return;
        }

        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:4000/api/projects/client', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch projects');
                }

                const data = await response.json();
                setProjects(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [user, navigate]);

    if (loading) return <div className="loading">Loading your projects...</div>;

    return (
        <div className="client-projects-container">

            {error && (
                <div className="error">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Try Again</button>
                </div>
            )}

            {projects.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't created any projects yet.</p>
                    <button
                        onClick={() => navigate('/post-project')}
                        className="primary-button"
                    >
                        Create New Project
                    </button>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map(project => (
                        <div key={project.id} className="project-card">
                            <div className="card-header">
                                <h3>{project.title}</h3>
                                <span className="status">
                                    {project.status || 'Active'}
                                </span>
                            </div>

                            <div className="project-info">
                                <p><strong>Description:</strong> {project.description}</p>
                                <p><strong>Budget:</strong> ₹{project.budget}</p>
                                <p><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</p>
                                <p><strong>Proposals:</strong> {project.proposal_count || 0}</p>
                            </div>

                            <div className="actions">
                                <button
                                    onClick={() => navigate(`/projects/${project.id}/proposals`)}
                                    className="view-button"
                                >
                                    View Proposals
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}