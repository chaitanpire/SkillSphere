import React, { useState, useEffect } from 'react';
import '../styles/ProjectFilters.css';

const ProjectFilters = ({ onApplyFilters }) => {
  const [filters, setFilters] = useState({
    minBudget: '',
    maxBudget: '',
    minWorkHours: '',
    maxWorkHours: '',
    skills: []
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    budget: true,
    hours: true,
    skills: true
  });

  // Fetch available skills when component mounts
  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:4000/api/skills', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch skills');
        }

        const data = await response.json();
        setAvailableSkills(data);
      } catch (err) {
        console.error('Error fetching skills:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillChange = (skillId) => {
    setFilters(prev => {
      const updatedSkills = prev.skills.includes(skillId)
        ? prev.skills.filter(id => id !== skillId)
        : [...prev.skills, skillId];
      
      return {
        ...prev,
        skills: updatedSkills
      };
    });
  };

  const handleApplyFilters = () => {
    // Convert to appropriate types for backend
    const processedFilters = {
      minBudget: filters.minBudget !== '' ? parseFloat(filters.minBudget) : null,
      maxBudget: filters.maxBudget !== '' ? parseFloat(filters.maxBudget) : null,
      minWorkHours: filters.minWorkHours !== '' ? parseInt(filters.minWorkHours) : null,
      maxWorkHours: filters.maxWorkHours !== '' ? parseInt(filters.maxWorkHours) : null,
      skills: filters.skills.length > 0 ? filters.skills.join(',') : null
    };
    
    onApplyFilters(processedFilters);
  };

  const handleReset = () => {
    setFilters({
      minBudget: '',
      maxBudget: '',
      minWorkHours: '',
      maxWorkHours: '',
      skills: []
    });
    onApplyFilters({});
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h3>Filter Projects</h3>
        <div className="filters-actions">
          <button className="action-btn reset-btn" onClick={handleReset}>
            Clear All
          </button>
        </div>
      </div>

      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('budget')}>
          <h4>Budget Range</h4>
          <span className="toggle-icon">
            {expandedSections.budget ? '−' : '+'}
          </span>
        </div>
        {expandedSections.budget && (
          <div className="range-filters">
            <div className="range-input">
              <label>Minimum (₹)</label>
              <input
                type="number"
                name="minBudget"
                value={filters.minBudget}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
              />
            </div>
            <div className="range-input">
              <label>Maximum (₹)</label>
              <input
                type="number"
                name="maxBudget"
                value={filters.maxBudget}
                onChange={handleInputChange}
                min="0"
                placeholder="No limit"
              />
            </div>
          </div>
        )}
      </div>

      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('hours')}>
          <h4>Work Hours</h4>
          <span className="toggle-icon">
            {expandedSections.hours ? '−' : '+'}
          </span>
        </div>
        {expandedSections.hours && (
          <div className="range-filters">
            <div className="range-input">
              <label>Minimum</label>
              <input
                type="number"
                name="minWorkHours"
                value={filters.minWorkHours}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
              />
            </div>
            <div className="range-input">
              <label>Maximum</label>
              <input
                type="number"
                name="maxWorkHours"
                value={filters.maxWorkHours}
                onChange={handleInputChange}
                min="0"
                placeholder="No limit"
              />
            </div>
          </div>
        )}
      </div>

      {availableSkills.length > 0 && (
        <div className="filter-section">
          <div className="section-header" onClick={() => toggleSection('skills')}>
            <h4>Required Skills</h4>
            <span className="toggle-icon">
              {expandedSections.skills ? '−' : '+'}
            </span>
          </div>
          {expandedSections.skills && (
            <div className="skills-filter">
              {availableSkills.map(skill => (
                <div key={skill.id} className="skill-option">
                  <input
                    type="checkbox"
                    id={`skill-${skill.id}`}
                    checked={filters.skills.includes(skill.id)}
                    onChange={() => handleSkillChange(skill.id)}
                  />
                  <label htmlFor={`skill-${skill.id}`}>
                    <span className="custom-checkbox"></span>
                    {skill.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button className="apply-filters-btn" onClick={handleApplyFilters}>
        Apply Filters
      </button>
    </div>
  );
};

export default ProjectFilters;