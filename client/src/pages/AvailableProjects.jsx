import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProjectList.css'; // Use your consistent style sheet

export default function FreelancerProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/projects/available', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
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
  }, []);

  if (loading) return <div className="loading">Loading available projects...</div>;

  return (
    <div className="projects-container">
      <h2>Available Projects</h2>

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects available at the moment.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="card-header">
                <h3>{project.title}</h3>
                <span className="status">{project.status || 'Open'}</span>
              </div>

              <div className="project-info">
                <p><strong>Description:</strong> {project.description}</p>
                <p><strong>Budget:</strong> ₹{project.budget}</p>
                <p><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</p>
                <p><strong>Client:</strong> {project.client_name}</p>
              </div>

              <div className="actions">
                <button
                  className="view-button"
                  onClick={() => navigate(`/projects/${project.id}/propose`)}
                >
                  Submit Proposal
                </button>
                <button
                  className="view-button"
                  onClick={() => navigate(`/messages/${project.client_id}`)}
                >
                  Message Client
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
