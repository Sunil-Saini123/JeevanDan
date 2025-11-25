import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import api from '../../utils/api';

function DonorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDonations: 0,
    pendingRequests: 0,
    isAvailable: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/donor/profile');
      setStats({
        totalDonations: response.data.donor?.totalDonations || 0,
        pendingRequests: 0,
        isAvailable: response.data.donor?.isAvailable || false
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await api.put('/donor/availability', {
        isAvailable: !stats.isAvailable
      });
      setStats({
        ...stats,
        isAvailable: response.data.donor.isAvailable
      });
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-purple-600">🩸 JeevanDan</h1>
            <p className="text-sm text-gray-600">Donor Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome, {user?.fullName}! 👋
          </h2>
          <p className="text-gray-600">
            Blood Group: <span className="font-bold text-purple-600">{user?.bloodGroup}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Total Donations */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1">Total Donations</p>
                <p className="text-4xl font-bold">{stats.totalDonations}</p>
              </div>
              <div className="text-5xl opacity-50">💉</div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 mb-1">Pending Requests</p>
                <p className="text-4xl font-bold">{stats.pendingRequests}</p>
              </div>
              <div className="text-5xl opacity-50">⏳</div>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className={`bg-gradient-to-br ${stats.isAvailable ? 'from-blue-500 to-blue-600' : 'from-gray-500 to-gray-600'} rounded-2xl shadow-lg p-6 text-white transition-all duration-500`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 mb-1 text-sm font-medium">Availability Status</p>
                <p className="text-2xl font-bold">{stats.isAvailable ? 'Available to Donate' : 'Currently Unavailable'}</p>
              </div>
              <div className="text-5xl opacity-50 animate-pulse">
                {stats.isAvailable ? '✅' : '❌'}
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${stats.isAvailable ? 'text-white' : 'text-blue-200'}`}>
                  {stats.isAvailable ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>
              
              <button
                onClick={toggleAvailability}
                className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 shadow-lg ${
                  stats.isAvailable 
                    ? 'bg-green-400 hover:bg-green-300' 
                    : 'bg-gray-400 hover:bg-gray-300'
                }`}
                aria-label="Toggle availability"
              >
                <span
                  className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center text-lg ${
                    stats.isAvailable 
                      ? 'translate-x-11' 
                      : 'translate-x-1'
                  }`}
                >
                  {stats.isAvailable ? '✓' : '✕'}
                </span>
              </button>
            </div>
            
            <p className="text-xs text-blue-100 mt-3 opacity-80">
              {stats.isAvailable 
                ? '💡 You will receive blood request notifications' 
                : '💡 You won\'t receive any notifications'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <button className="bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition">
              📋 View Blood Requests
            </button>
            <button className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition">
              📊 Donation History
            </button>
            <button className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition">
              👤 Update Profile
            </button>
            <button className="bg-yellow-600 text-white py-3 px-6 rounded-lg hover:bg-yellow-700 transition">
              📍 Update Location
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DonorDashboard;