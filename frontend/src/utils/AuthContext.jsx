import { createContext, useState, useContext, useEffect } from 'react';
import api from './api';
import socketService from './socket';

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
      loadUserProfile(type).then(profile => {
        // ✅ Reconnect socket on page reload
        if (profile && profile._id) {
          socketService.connect(profile._id);
        }
      });
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
      return userData; // ✅ ADD RETURN
    } catch (error) {
      console.error('Failed to load profile:', error);
      logout();
      return null; // ✅ ADD RETURN
    } finally {
      setLoading(false);
    }
  };

  const login = async (token, type) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userType', type);
    setUserType(type);
    const profile = await loadUserProfile(type);
    
    // ✅ Connect socket with user ID
    if (profile && profile._id) {
      socketService.connect(profile._id);
    }
  };

  const logout = () => {
    socketService.disconnect(); // ✅ ADD THIS LINE
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