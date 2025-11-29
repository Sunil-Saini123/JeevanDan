import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

function ReceiverDashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🟣 ReceiverDashboard: Component mounted');
    console.log('🟣 ReceiverDashboard: Current user:', user);
    console.log('🟣 ReceiverDashboard: Loading:', loading);
  }, []);

  useEffect(() => {
    console.log('🟣 ReceiverDashboard: User state changed:', user);
  }, [user]);

  const handleLogout = () => {
    console.log('🟣 ReceiverDashboard: Logout clicked');
    logout();
    navigate('/');
  };

  if (loading) {
    console.log('🟣 ReceiverDashboard: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-red-900">
        <div className="text-white text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-xl">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔴 ReceiverDashboard: No user data, showing error');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No user data available</p>
          <button
            onClick={() => navigate('/receiver/login')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  console.log('🟣 ReceiverDashboard: Rendering dashboard for:', user.fullName);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-red-600">🩸 JeevanDan</h1>
            <p className="text-sm text-gray-600">Receiver Dashboard</p>
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
            Welcome, {user?.fullName || 'User'}! 👋
          </h2>
          <p className="text-gray-600">
            Contact: {user?.contactNumber || 'Not available'}
          </p>
          <p className="text-gray-600">
            Email: {user?.email || 'Not available'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/receiver/create-request')}
              className="bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 transition text-lg font-semibold"
            >
              🆘 Create Blood Request
            </button>
            <button
              onClick={() => navigate('/receiver/my-requests')}
              className="bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
            >
              📋 My Requests
            </button>
            <button
              onClick={() => navigate('/receiver/history')}
              className="bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition text-lg font-semibold"
            >
              📊 Donation History
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-red-800 mb-3">📌 How it Works</h3>
          <ol className="space-y-2 text-red-900">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Create a blood request with details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>AI matches you with nearby donors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Donors receive notification and can accept</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>You get matched donors' contact information</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}

export default ReceiverDashboard;