import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectFilters from '../components/ProjectFilters';
import '../styles/ProjectList.css';

export default function FreelancerProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const navigate = useNavigate();

  const fetchProjects = async (filters = {}) => {
    try {
      setLoading(true);

      // Build query string from filters
      const queryParams = new URLSearchParams();

      if (filters.minBudget) queryParams.append('minBudget', filters.minBudget);
      if (filters.maxBudget) queryParams.append('maxBudget', filters.maxBudget);
      if (filters.minWorkHours) queryParams.append('minWorkHours', filters.minWorkHours);
      if (filters.maxWorkHours) queryParams.append('maxWorkHours', filters.maxWorkHours);
      if (filters.skills) queryParams.append('skills', filters.skills);

      const queryString = queryParams.toString();
      const url = `http://localhost:4000/api/projects/available${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
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

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    fetchProjects(filters);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleResetFilters = () => {
    setActiveFilters({});
    fetchProjects({});
  };

  if (loading) return <div className="loading">Loading available projects...</div>;

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h2>Available Projects</h2>

        <button
          className="filter-toggle"
          onClick={() => navigate('/recommended-projects')}
        >
          Recommended Projects
        </button>

        <button
          className="filter-toggle"
          onClick={toggleFilters}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showFilters && (
        <ProjectFilters 
          onApplyFilters={handleApplyFilters} 
          initialFilters={activeFilters} 
        />
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={() => fetchProjects()}>Try Again</button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>
            {Object.keys(activeFilters).length > 0
              ? 'No projects match your filter criteria.'
              : 'No projects available at the moment.'}
          </p>
          {Object.keys(activeFilters).length > 0 && (
            <button
              className="reset-filters"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          )}
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
                {project.expected_work_hours && (
                  <p><strong>Expected Work Hours:</strong> {project.expected_work_hours} hours</p>
                )}
                <p><strong>Client:</strong> {project.client_name}</p>

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