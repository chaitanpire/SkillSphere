import React, { useState, useEffect } from 'react'; // Added useEffect import
import { useNavigate } from 'react-router-dom';

export default function FreelancerProjects() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        // Optionally show error to user
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="projects-container">
      <h2>Available Projects</h2>
      {projects.length === 0 ? (
        <p>Loading projects...</p>
      ) : (
        <div className="projects-list">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <h3>{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <div className="project-details">
                <span>Budget: ₹{project.budget}</span>
                <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                <span>Posted by: {project.client_name}</span>
              </div>
              <button
                className="proposal-button"
                onClick={() => navigate(`/projects/${project.id}/propose`)}
              >
                Submit Proposal
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}