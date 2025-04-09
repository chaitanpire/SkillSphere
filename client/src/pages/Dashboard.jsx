import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.name} 👋</h1>
      <p>Role: {user?.role}</p>
      <p>Email: {user?.email}</p>
    </div>
  );
}
