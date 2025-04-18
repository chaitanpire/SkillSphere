import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import PostProject from './pages/PostProject';
import ProfilePage from './pages/ProfilePage';
import AvailableProjects from './pages/AvailableProjects';
import EditProfile from './pages/EditProfile';
import ProposalForm from './pages/ProposalForm';
import ProposalsList from './pages/ProposalsList';
import MyProposals from './pages/MyProposals';
import ClientProjects from './pages/ClientProjects';
import ProjectProposals from './pages/ProjectProposals';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/post-project" element={<ProtectedRoute><PostProject /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><AvailableProjects /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/projects/:id/propose" element={<ProposalForm />} />
          {/* <Route path="/projects/:id/proposals" element={<ProposalsList />} /> */}
          <Route path="/my-proposals" element={<MyProposals />} />
          <Route path="/client-projects" element={<ClientProjects />} />
          <Route path="/projects/:id/proposals" element={<ProjectProposals />} />

        </Routes>

      </Router>
    </AuthProvider>
  );
}

export default App;
