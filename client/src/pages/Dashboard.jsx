import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch(`http://localhost:4000/api/dashboard/stats/${user.id}`);
        if (!statsResponse.ok) throw new Error('Failed to load stats');
        const statsData = await statsResponse.json();
        setStats(statsData);
        // Fetch activity
        const activityResponse = await fetch(`http://localhost:4000/api/dashboard/activity/${user.id}`);
        if (!activityResponse.ok) throw new Error('Failed to load activity');
        const activityData = await activityResponse.json();
        setActivity(activityData);

      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err.message);
      } finally {
        setStatsLoading(false);
        setActivityLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, statsLoading, activityLoading]);

  if (loading) return <div className="loading">Loading user data...</div>;
  if (!user) return <div className="error">Please login to view dashboard</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const { name, role } = user;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'message': return '💬';
      case 'project': return '📋';
      case 'proposal': return '📝';
      default: return '🔔';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, <span className="highlight">{name}</span> 👋</h1>
        <p className="subtitle">Here's what's happening today</p>
      </div>

      {statsLoading ? (
        <div className="loading">Loading statistics...</div>
      ) : (
        <div className="stats-grid">
          {role === 'freelancer' && (
            <div className="stat-card earnings" onClick={() => navigate('/earnings')}>
              <h3>Earnings</h3>
              <p className="value">₹{stats?.earnings?.toLocaleString() || '0'}</p>
              <p className="label">This month</p>
            </div>
          )}

          <div className="stat-card projects" onClick={() => navigate(role === 'client' ? '/client-projects' : '/projects')}>
            <h3>{role === 'client' ? 'Your Projects' : 'Available Projects'}</h3>
            <p className="value">{role === 'client' ? stats?.your_projects : stats?.available_projects}</p>
            <p className="label">{role === 'client' ? 'Unassigned' : 'New this week'}</p>
          </div>

          <div className="stat-card pending" onClick={() => navigate(role === 'client' ? '/client-projects?status=pending' : '/my-proposals')}>
            <h3>Pending</h3>
            <p className="value">{stats?.pending || 0}</p>
            <p className="label">{role === 'client' ? 'In Progress' : 'Your proposals'}</p>
          </div>

          <div className="stat-card completed" onClick={() => navigate(role === 'client' ? '/client-projects?status=completed' : '/completed-work')}>
            <h3>Completed</h3>
            <p className="value">{stats?.completed || 0}</p>
            <p className="label">All time</p>
          </div>
        </div>
      )}


      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {activityLoading ? (
          <div className="loading">Loading activity...</div>
        ) : activity.length > 0 ? (
          <div className="activity-list">
            {activity.map((item, index) => (
              <div key={index} className="activity-item" onClick={() => {
                console.log('Activity item clicked:', item);
                if (item.type === 'message') navigate('/messages');
                if (item.type === 'project') navigate(`/client-projects`);
                if (item.type === 'proposal') navigate('/my-proposals');
              }}>
                <div className="activity-icon">{getActivityIcon(item.type)}</div>
                <div className="activity-content">
                  <p>{item.title} - {item.status}</p>
                  <small>{new Date(item.date).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-activity">No recent activity</p>
        )}
      </div>
    </div>
  );
}