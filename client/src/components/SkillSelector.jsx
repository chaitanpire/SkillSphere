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
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch skills data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [skillsRes, userSkillsRes] = await Promise.all([
          fetch('http://localhost:4000/api/users/skills',
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`

              }
            }
          ),
          fetch(`http://localhost:4000/api/users/${id}/skills`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`

              }
            }
          )
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

  const updateSkills = async (newSkills) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:4000/api/users/${id}/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skills: newSkills })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update skills');
      }

      // Update local state only after successful API call
      setUserSkills(newSkills);
      onSkillsChange(newSkills);
    } catch (err) {
      console.error('Error updating skills:', err);
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSkillChange = (e) => {
    const { value, checked } = e.target;
    const skillId = parseInt(value);

    let newSkills;
    if (checked) {
      newSkills = [...userSkills, skillId];
    } else {
      newSkills = userSkills.filter(id => id !== skillId);
    }

    updateSkills(newSkills);
  };

  if (loading) {
    return <div className="loading">Loading skills...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="skill-selector">
      {/* <h3>Skills {isUpdating && <span className="updating-indicator">(Updating...)</span>}</h3> */}
      <div className="skills-grid">
        {allSkills.map(skill => (
          <label key={skill.id} className="skill-item">
            <input
              type="checkbox"
              value={skill.id}
              checked={userSkills.includes(skill.id)}
              onChange={handleSkillChange}
              disabled={isUpdating}
            />
            <span className="skill-name">{skill.name}</span>
          </label>
        ))}
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