import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/ProjectList.css';
export default function CompletedProjects() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'freelancer') {
            navigate('/dashboard');
            return;
        }

        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:4000/api/users/${user.id}/projects`, {
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
        <div className="freelancer-projects-container">

            {error && (
                <div className="error">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Try Again</button>
                </div>
            )}

            {projects.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't taken up any projects yet.</p>
                    <button
                        onClick={() => navigate('/projects')}
                        className="primary-button"
                    >
                        Browse Projects
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
                                <p><strong>Work Hours:</strong> {project.expected_work}</p>
                                <p><strong>Proposed Amount:</strong> {project.proposed_amount || 0}</p>
                                {project.skills && project.skills.length > 0 && (
                                    <div className="project-skills">
                                        <p><strong>Required Skills:</strong></p>
                                        <div className="skill-tags">
                                            {project.skills.map(skill => (
                                                <span key={skill.id} className="skill-tag">{skill.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>


                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}