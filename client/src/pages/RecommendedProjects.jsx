import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProjectList.css';

export default function RecommendedProjects() {
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Available categories
  const availableCategories = ["Web Development", "Mobile App", "Design", "Writing", "Marketing", "Data Science", "AI/ML"];

  // Fetch recommended projects
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/recommendations/projects', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendedProjects(data.recommended_projects || []);

      // Extract categories from projects for the filter
      if (data.recommended_projects?.length > 0) {
        const projectCategories = new Set();
        data.recommended_projects.forEach(project => {
          if (project.categories && Array.isArray(project.categories)) {
            project.categories.forEach(category => projectCategories.add(category));
          }
        });
        setCategories(Array.from(projectCategories));
      }

      // If there are no projects, check if any recommendation factors exist
      if (data.recommended_projects?.length === 0) {
        setError({
          message: "No recommended projects found",
          details: Object.entries(data.factors)
            .filter(([_, value]) => value === false)
            .map(([key]) => key.replace(/_/g, ' '))
        });
      }
    } catch (err) {
      setError({ message: err.message });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) return <div className="loading">Finding projects for you...</div>;

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h2>Recommended Projects</h2>
        <div className="header-actions">
          <button onClick={() => navigate('/projects')}>
            Browse All Projects
          </button>
        </div>
      </div>


      {error && (
        <div className="recommendation-error">
          <p>{error.message}</p>
          {error.details && (
            <div className="error-details">
              <p>We need more information to give you better recommendations:</p>
              <ul>
                {error.details.map((detail, index) => (
                  <li key={index}>No {detail} data available</li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={fetchRecommendations}>Retry</button>
        </div>
      )}

      {recommendedProjects.length === 0 && !error ? (
        <div className="empty-state">
          <p>No recommended projects available at the moment.</p>
          <button onClick={() => navigate('/projects')}>
            Browse All Projects
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {recommendedProjects.map(project => (
            <div key={project.id} className="project-card recommended">
              <div className="card-header">
                <h3>{project.title}</h3>
                <div className="match-indicator">
                  <span className="match-percentage">{Math.round(project.skill_match_percentage)}% Match</span>
                  {project.hours_match_score > 0 && (
                    <span className="hours-match"></span>
                  )}
                </div>
              </div>

              <div className="project-info">
                <p><strong>Description:</strong> {project.description}</p>
                <p><strong>Budget:</strong> ₹{project.budget}</p>
                <p><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</p>
                {project.expected_work_hours && (
                  <p><strong>Expected Work Hours:</strong> {project.expected_work_hours} hours</p>
                )}
                <p><strong>Client:</strong> {project.client_name}</p>

                {/* Show skills if available */}
                {project.matching_skills > 0 && (
                  <p className="matching-skills">
                    <strong>Matching Skills:</strong> {project.matching_skills} of {project.total_skills}
                  </p>
                )}

                {/* Show categories if available */}
                {project.categories && project.categories.length > 0 && (
                  <div className="project-categories">
                    <strong>Categories:</strong>
                    <div className="category-tags">
                      {project.categories.map((category, index) => (
                        <span key={index} className="category-tag">{category}</span>
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