import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Profile structure template
const createEmptyProfile = () => ({
  bio: null,
  location: null,
  hourly_rate: null,
  experience: null,
  rating: null,
  profile_picture: null
});

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    loading: true,
    error: null
  });

  // Normalize user data with guaranteed profile
  const normalizeUser = (userData) => {
    return {
      ...userData,
      profile: userData.profile || createEmptyProfile()
    };
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setAuthState({ user: null, loading: false, error: null });
        return;
      }

      try {
        const response = await fetch('http://localhost:4000/api/auth/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Session expired or invalid token');
        }

        const data = await response.json();
        setAuthState({
          user: normalizeUser(data.user),
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('token');
        setAuthState({
          user: null,
          loading: false,
          error: error.message
        });
      }
    };

    verifyAuth();
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    setAuthState({
      user: normalizeUser(data.user),
      loading: false,
      error: null
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      loading: false,
      error: null
    });
  };

  return (
    <AuthContext.Provider value={{
      user: authState.user,
      loading: authState.loading,
      error: authState.error,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}