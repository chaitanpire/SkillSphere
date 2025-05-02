import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/SkillSelector.css';

const SkillSelector = ({ selectedSkills = [], onSkillsChange }) => {
    const [allSkills, setAllSkills] = useState([]);
    const [filteredSkills, setFilteredSkills] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:4000/api/users/skills', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch skills');
                }

                const data = await response.json();
                setAllSkills(data);
                setFilteredSkills(data);
            } catch (err) {
                console.error('Error fetching skills:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSkills();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredSkills(allSkills);
        } else {
            const filtered = allSkills.filter(skill =>
                skill.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredSkills(filtered);
        }
    }, [searchTerm, allSkills]);

    const handleSkillToggle = (skillId) => {
        const newSelectedSkills = selectedSkills.includes(skillId)
            ? selectedSkills.filter(id => id !== skillId)
            : [...selectedSkills, skillId];

        onSkillsChange(newSelectedSkills);
    };

    if (loading) return <div className="loading">Loading skills...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="skill-selector">
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="skill-search-input"
                />
            </div>

            <div className="skills-list">
                {filteredSkills.length > 0 ? (
                    filteredSkills.map(skill => (
                        <div
                            key={skill.id}
                            className={`skill-item ${selectedSkills.includes(skill.id) ? 'selected' : ''}`}
                            onClick={() => handleSkillToggle(skill.id)}
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

            {selectedSkills.length > 0 && (
                <div className="selected-skills">
                    <strong>Selected:</strong> {selectedSkills.map(id => {
                        const skill = allSkills.find(s => s.id === id);
                        return skill ? skill.name : null;
                    }).filter(Boolean).join(', ')}
                </div>
            )}
        </div>
    );
};

SkillSelector.propTypes = {
    selectedSkills: PropTypes.arrayOf(PropTypes.number),
    onSkillsChange: PropTypes.func.isRequired
};

export default SkillSelector;