import React, { useEffect, useState } from 'react';

export default function FreelancerProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data));
  }, []);

  return (
    <div>
      <h2>Available Projects</h2>
      {projects.length === 0 ? (
        <p>No projects available.</p>
      ) : (
        <ul>
          {projects.map(proj => (
            <li key={proj.id} style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
              <h3>{proj.title}</h3>
              <p>{proj.description}</p>
              <p>Budget: ₹{proj.budget}</p>
              <p>Deadline: {proj.deadline}</p>
              <p>Posted by: {proj.client_name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
