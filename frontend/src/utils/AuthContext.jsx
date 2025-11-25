import { createContext, useState, useContext, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const type = localStorage.getItem('userType');
    
    if (token && type) {
      setUserType(type);
      loadUserProfile(type);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async (type) => {
    try {
      const endpoint = type === 'donor' ? '/donor/profile' : '/receiver/profile';
      const response = await api.get(endpoint);
      const userData = response.data.donor || response.data.receiver || response.data;
      setUser(userData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (token, type) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userType', type);
    setUserType(type);
    await loadUserProfile(type);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    setUser(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ user, userType, loading, login, logout, loadUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);