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
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    contactNumber: '',
    age: '',
    weight: '',
    address: ''
  });
  const [updating, setUpdating] = useState(false);
  const [donorInfo, setDonorInfo] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await api.get('/donor/profile');
      setDonorInfo(res.data);
    })();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/donor/profile');
      setStats({
        totalDonations: response.data.donor?.totalDonations || 0,
        pendingRequests: response.data.pendingRequests || 0, // ✅ CHANGED
        isAvailable: response.data.donor?.isAvailable || false
      });
      
      // Set profile data for editing
      setProfileData({
        fullName: response.data.donor?.fullName || '',
        contactNumber: response.data.donor?.contactNumber || '',
        age: response.data.donor?.age || '',
        weight: response.data.donor?.weight || '',
        address: response.data.donor?.address || ''
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      // Check if trying to enable and donor is in cooldown
      if (!stats.isAvailable && donorInfo && !donorInfo.canDonate) {
        alert(`⏳ You must wait 3 months after last donation.\nYou can donate again after ${new Date(donorInfo.nextAvailableDate).toLocaleDateString()}`);
        return;
      }

      const response = await api.put('/donor/availability', {
        isAvailable: !stats.isAvailable
      });
      setStats({
        ...stats,
        isAvailable: response.data.donor.isAvailable
      });
    } catch (error) {
      console.error('Failed to update availability:', error);
      alert(error.response?.data?.error || 'Failed to update availability');
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      await api.put('/donor/profile', profileData);
      alert('✅ Profile updated successfully!');
      setShowProfileEdit(false);
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('❌ Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
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
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome, {user?.fullName}! 👋
              </h2>
              <p className="text-gray-600">
                Blood Group: <span className="font-bold text-purple-600">{user?.bloodGroup}</span>
              </p>
              <p className="text-gray-600">
                Contact: {user?.contactNumber}
              </p>
            </div>
            <button
              onClick={() => setShowProfileEdit(!showProfileEdit)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {showProfileEdit ? '✕ Cancel' : '✏️ Edit Profile'}
            </button>
          </div>
        </div>

        {/* Profile Edit Form */}
        {showProfileEdit && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Update Profile</h3>
            <form onSubmit={handleProfileUpdate}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={profileData.contactNumber}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={profileData.age}
                    onChange={handleProfileChange}
                    min="18"
                    max="65"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={profileData.weight}
                    onChange={handleProfileChange}
                    min="50"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  {updating ? 'Updating...' : '✓ Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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
                <span className={`text-sm font-semibold ${stats.isAvailable ? 'text-black' : 'text-blue-400'}`}>
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
                  className={` h-8 w-8 transform rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center text-lg ${
                    stats.isAvailable 
                      ? 'translate-x-11' 
                      : 'translate-x-1'
                  }`}
                >
                  {stats.isAvailable ? '✓' : '✕'}
                </span>
              </button>
            </div>
            
            {stats.isAvailable ? (
              <div className="mt-3 flex items-center gap-2 text-white text-opacity-90">
                <span className="text-base">💡</span>
                <p className="text-xs">You'll receive blood request notifications</p>
              </div>
            ) : donorInfo?.nextAvailableDate ? (
              <div className="mt-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3 border border-white border-opacity-30">
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-0.5">🔒</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800 mb-1">
                      {/* ✅ CHANGED: Gender-specific text */}
                      {donorInfo.donor?.gender === 'Female' ? '4-Month' : '3-Month'} Cooldown Period
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      Available from: {new Date(donorInfo.nextAvailableDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    {/* ✅ ADD: Days remaining */}
                    {donorInfo.cooldownInfo?.daysRemaining && (
                      <p className="text-xs text-gray-600 mt-1">
                        {donorInfo.cooldownInfo.daysRemaining} days remaining
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-white text-opacity-80">
                <span className="text-base">ℹ️</span>
                <p className="text-xs">Toggle ON when ready to donate</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/donor/requests')}
              className="bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 transition font-semibold text-lg"
            >
              📋 View Blood Requests
            </button>
            <button 
              onClick={() => navigate('/donor/history')}
              className="bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition font-semibold text-lg"
            >
              📊 Donation History
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-purple-800 mb-3">📌 How it Works</h3>
          <ol className="space-y-2 text-purple-900">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Toggle your availability status when you're ready to donate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Receive notifications for matching blood requests</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Accept requests that fit your schedule</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Save lives and track your donation history</span>
            </li>
          </ol>
          <div className="mt-4 pt-4 border-t border-purple-300">
            <p className="text-sm text-purple-800">
              <span className="font-semibold">💡 Note:</span> Location tracking will be automatic once you enable availability. Socket.io will handle real-time updates.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DonorDashboard;