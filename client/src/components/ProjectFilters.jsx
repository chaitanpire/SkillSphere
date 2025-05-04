import React, { useState, useEffect } from 'react';
import '../styles/ProjectFilters.css';

const ProjectFilters = ({ onApplyFilters, initialFilters = {} }) => {
  // Initialize with processed initialFilters
  const [filters, setFilters] = useState({
    minBudget: initialFilters.minBudget || '',
    maxBudget: initialFilters.maxBudget || '',
    minWorkHours: initialFilters.minWorkHours || '',
    maxWorkHours: initialFilters.maxWorkHours || '',
    skills: initialFilters.skills ? initialFilters.skills.split(',').map(Number) : []
  });
  const [activeFilters, setActiveFilters] = useState({ ...filters });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    budget: true,
    hours: true,
    skills: true
  });

  // Update filters when initialFilters prop changes
  useEffect(() => {
    setFilters({
      minBudget: initialFilters.minBudget || '',
      maxBudget: initialFilters.maxBudget || '',
      minWorkHours: initialFilters.minWorkHours || '',
      maxWorkHours: initialFilters.maxWorkHours || '',
      skills: initialFilters.skills ? initialFilters.skills.split(',').map(Number) : []
    });
    setActiveFilters({
      minBudget: initialFilters.minBudget || '',
      maxBudget: initialFilters.maxBudget || '',
      minWorkHours: initialFilters.minWorkHours || '',
      maxWorkHours: initialFilters.maxWorkHours || '',
      skills: initialFilters.skills ? initialFilters.skills.split(',').map(Number) : []
    });
  }, [initialFilters]);

  // Fetch available skills when component mounts
  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:4000/api/users/skills', {
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
        setFilteredSkills(data);
      } catch (err) {
        console.error('Error fetching skills:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  // Filter skills based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSkills(availableSkills);
    } else {
      const filtered = availableSkills.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSkills(filtered);
    }
  }, [searchTerm, availableSkills]);

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleApplyFilters = () => {
    // Convert to appropriate types for backend
    const processedFilters = {
      minBudget: filters.minBudget !== '' ? Number(filters.minBudget) : null,
      maxBudget: filters.maxBudget !== '' ? Number(filters.maxBudget) : null,
      minWorkHours: filters.minWorkHours !== '' ? Number(filters.minWorkHours) : null,
      maxWorkHours: filters.maxWorkHours !== '' ? Number(filters.maxWorkHours) : null,
      skills: filters.skills.length > 0 ? filters.skills.join(',') : null
    };

    // Save the current filters as active filters
    setActiveFilters({ ...filters });

    onApplyFilters(processedFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      minBudget: '',
      maxBudget: '',
      minWorkHours: '',
      maxWorkHours: '',
      skills: []
    };

    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setSearchTerm('');
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

      {/* Active Filters Display */}
      {(activeFilters.minBudget || activeFilters.maxBudget ||
        activeFilters.minWorkHours || activeFilters.maxWorkHours ||
        activeFilters.skills.length > 0) && (
          <div className="active-filters">
            <h4>Active Filters:</h4>
            <div className="active-filters-content">
              {activeFilters.minBudget && <span className="filter-tag">Min Budget: ₹{activeFilters.minBudget}</span>}
              {activeFilters.maxBudget && <span className="filter-tag">Max Budget: ₹{activeFilters.maxBudget}</span>}
              {activeFilters.minWorkHours && <span className="filter-tag">Min Hours: {activeFilters.minWorkHours}</span>}
              {activeFilters.maxWorkHours && <span className="filter-tag">Max Hours: {activeFilters.maxWorkHours}</span>}
              {activeFilters.skills.length > 0 && (
                <span className="filter-tag">
                  Skills: {activeFilters.skills.map(id => {
                    const skill = availableSkills.find(s => s.id === id);
                    return skill ? skill.name : null;
                  }).filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        )}

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

      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('skills')}>
          <h4>Required Skills</h4>
          <span className="toggle-icon">
            {expandedSections.skills ? '−' : '+'}
          </span>
        </div>
        {expandedSections.skills && (
          <div className="skills-filter">
            <div className="skill-search-container">
              <input
                type="text"
                placeholder="Search skills..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="skill-search-input"
              />
            </div>
            {loading ? (
              <div className="loading">Loading skills...</div>
            ) : (
              <div className="skills-list">
                {filteredSkills.length > 0 ? (
                  filteredSkills.map(skill => (
                    <div
                      key={skill.id}
                      className={`skill-item ${filters.skills.includes(skill.id) ? 'selected' : ''}`}
                      onClick={() => handleSkillChange(skill.id)}
                    >
                      {skill.name}
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    {searchTerm ? 'No matching skills found' : 'No skills available'}
                  </div>
                )}
              </div>
            )}

            {filters.skills.length > 0 && (
              <div className="selected-skills">
                <strong>Selected:</strong> {filters.skills.map(id => {
                  const skill = availableSkills.find(s => s.id === id);
                  return skill ? skill.name : null;
                }).filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      <button className="apply-filters-btn" onClick={handleApplyFilters}>
        Apply Filters
      </button>
    </div>
  );
};

export default ProjectFilters;