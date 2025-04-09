import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PostProject() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: ''
    });

    const navigate = useNavigate();

    const handleChange = e =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const res = await fetch('http://localhost:4000/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (res.ok) {
            alert('Project posted!');
            navigate('/dashboard');
        } else {
            alert(data.error || 'Failed to post project');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Post New Project</h2>
            <input name="title" placeholder="Title" onChange={handleChange} required />
            <textarea name="description" placeholder="Description" onChange={handleChange} required />
            <input name="budget" placeholder="Budget" onChange={handleChange} required />
            <input name="deadline" type="date" onChange={handleChange} required />
            <button type="submit">Post</button>
        </form>
    );
}
