import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProjectList.css';

export default function RecommendedProjects() {
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    min_budget: '',
    max_budget: '',
    preferred_categories: []
  });
  const navigate = useNavigate();

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

  // Fetch current preferences
  const fetchPreferences = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/recommendations/preferences', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences({
          min_budget: data.min_budget || '',
          max_budget: data.max_budget || '',
          preferred_categories: data.preferred_categories || []
        });
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/recommendations/preferences', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        setPreferencesOpen(false);
        fetchRecommendations(); // Refresh recommendations with new preferences
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
    }
  };

  // Handle preference changes
  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  // Handle category selection
  const handleCategoryChange = (category) => {
    setPreferences(prev => {
      const categories = [...prev.preferred_categories];
      if (categories.includes(category)) {
        return {
          ...prev,
          preferred_categories: categories.filter(c => c !== category)
        };
      } else {
        return {
          ...prev,
          preferred_categories: [...categories, category]
        };
      }
    });
  };

  useEffect(() => {
    fetchRecommendations();
    fetchPreferences();
  }, []);

  if (loading) return <div className="loading">Finding projects for you...</div>;

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h2>Recommended Projects</h2>
      </div>

      {preferencesOpen && (
        <div className="preferences-panel">
          <h3>Recommendation Preferences</h3>
          <div className="preferences-form">
            <div className="form-group">
              <label>Minimum Budget</label>
              <input
                type="number"
                name="min_budget"
                value={preferences.min_budget}
                onChange={handlePreferenceChange}
                placeholder="Min Budget"
              />
            </div>
            
            <div className="form-group">
              <label>Maximum Budget</label>
              <input
                type="number"
                name="max_budget"
                value={preferences.max_budget}
                onChange={handlePreferenceChange}
                placeholder="Max Budget"
              />
            </div>
            
            <div className="form-group">
              <label>Preferred Project Categories</label>
              <div className="category-selection">
                {["Web Development", "Mobile App", "Design", "Writing", "Marketing", "Data Science", "AI/ML"].map(category => (
                  <div className="category-option" key={category}>
                    <input
                      type="checkbox"
                      id={`category-${category}`}
                      checked={preferences.preferred_categories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                    />
                    <label htmlFor={`category-${category}`}>{category}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="save-preferences" onClick={savePreferences}>
              Save Preferences
            </button>
          </div>
        </div>
      )}

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
          <button onClick={() => navigate('/available-projects')}>
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