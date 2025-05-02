import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

const SkillSelector = ({ selectedSkills = [], onSkillsChange }) => {
  const { id } = useParams();
  const { user } = useAuth();

  const [allSkills, setAllSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all skills and user skills in parallel
        const [skillsRes, userSkillsRes] = await Promise.all([
          fetch('http://localhost:4000/api/users/skills', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }),
          fetch(`http://localhost:4000/api/users/${id}/skills`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
        ]);

        if (!skillsRes.ok || !userSkillsRes.ok) {
          throw new Error('Failed to fetch skills data');
        }

        const [skillsData, userSkillsData] = await Promise.all([
          skillsRes.json(),
          userSkillsRes.json()
        ]);

        setAllSkills(Array.isArray(skillsData) ? skillsData : []);
        setUserSkills(Array.isArray(userSkillsData) ? userSkillsData.map(skill => skill.id) : []);
      } catch (err) {
        console.error('Error loading skills:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSkillChange = (e) => {
    const { value, checked } = e.target;
    const skillId = parseInt(value);

    const newSelectedSkills = checked
      ? [...selectedSkills, skillId]
      : selectedSkills.filter(id => id !== skillId);

    onSkillsChange(newSelectedSkills);
  };

  if (loading) {
    return (
      <div className="skills-loading">
        <div className="loading-spinner"></div>
        <span>Loading skills...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="skills-error">
        <span>⚠️ Error loading skills: {error}</span>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="skill-selector">
      <p className="skill-hint">Select the skills you possess</p>
      
      <div className="skills-grid">
        {allSkills.length > 0 ? (
          allSkills.map(skill => (
            <label key={skill.id} className="skill-item">
              <input
                type="checkbox"
                value={skill.id}
                checked={userSkills.includes(skill.id) || selectedSkills.includes(skill.id)}
                onChange={handleSkillChange}
              />
              <span className="skill-name">{skill.name}</span>
            </label>
          ))
        ) : (
          <p className="no-skills">No skills available</p>
        )}
      </div>
    </div>
  );
};

SkillSelector.propTypes = {
  selectedSkills: PropTypes.arrayOf(PropTypes.number),
  onSkillsChange: PropTypes.func.isRequired
};

SkillSelector.defaultProps = {
  selectedSkills: []
};

export default SkillSelector;