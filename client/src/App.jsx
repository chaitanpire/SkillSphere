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
import MyProposals from './pages/MyProposals';
import ClientProjects from './pages/ClientProjects';
import ProjectProposals from './pages/ProjectProposals';
import EditProfileWrapper from './pages/EditProfileWrapper';
import { Component } from 'react';
import { SocketProvider } from './context/SocketContext';
import MessagesInbox from './components/messages/MessagesInbox';
import MessageThread from './components/messages/MessageThread';
// import SkillSelector from './components/SkillSelector'; 



class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}


// function ProtectedRoute({ children }) {
//   const { user } = useAuth();
//   return user ? children : <Navigate to="/" />;
// }
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  console.log('[ProtectedRoute]', { user, loading, location: window.location.pathname });

  if (loading) {
    console.log('[ProtectedRoute] Waiting for auth verification...');
    return <div>Loading authentication...</div>;
  }

  if (!user) {
    console.log('[ProtectedRoute] No user - redirecting to home');
    return <Navigate to="/" />;
  }

  console.log('[ProtectedRoute] User authorized:', user.id);
  return children;
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
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
            {/* <Route path="/edit-profile/:id" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} /> */}
            <Route
              path="/edit-profile/:id"
              element={
                <ProtectedRoute>
                  <EditProfileWrapper />
                </ProtectedRoute>
              }
            />
            <Route path="/projects/:id/propose" element={<ProposalForm />} />
            <Route path="/my-proposals" element={<MyProposals />} />
            <Route path="/client-projects" element={<ClientProjects />} />
            <Route path="/projects/:id/proposals" element={<ErrorBoundary><ProjectProposals /></ErrorBoundary>} />
            <Route path="/messages" element={<MessagesInbox />} />
            <Route path="/messages/:otherUserId" element={<MessageThread />} />
          </Routes>

        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
