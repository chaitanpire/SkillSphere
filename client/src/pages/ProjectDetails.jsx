import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { notify } from '../utils/notify';

function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize useForm after all other hooks
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/projects/${id}`);
        const data = await res.json();
        setProject(data);
      } catch (err) {
        notify.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const onSubmit = async (data) => {
    try {
      const res = await fetch(`http://localhost:4000/api/projects/${id}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      // Handle response
    } catch (err) {
      notify.error('Submission failed');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div>
      <h2>{project.title}</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <textarea
          {...register('cover_letter', { required: 'Required' })}
          placeholder="Your proposal"
        />
        {errors.cover_letter && <span>{errors.cover_letter.message}</span>}
        
        <input
          type="number"
          {...register('proposed_amount', { 
            required: 'Required',
            min: { value: 1, message: 'Must be positive' }
          })}
          placeholder="Your amount"
        />
        {errors.proposed_amount && <span>{errors.proposed_amount.message}</span>}
        
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default ProjectDetails;