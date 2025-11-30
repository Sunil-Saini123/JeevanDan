// frontend/src/pages/donor/DonationHistory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

function DonationHistory() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({
    totalDonations: 0,
    livesSaved: 0,
    lastDonation: null,
    nextEligibleDate: null,
    bloodGroup: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDonationHistory();
    loadDonorProfile();
  }, []);

  const loadDonorProfile = async () => {
    try {
      const res = await api.get('/donor/profile');
      if (res.data?.donor) {
        setStats(prev => ({
          ...prev,
          lastDonation: res.data.donor.lastDonationDate,
          nextEligibleDate: res.data.nextAvailableDate,
          bloodGroup: res.data.donor.bloodGroup
        }));
      }
    } catch (err) {
      console.error('Load profile error:', err);
    }
  };

  const loadDonationHistory = async () => {
    try {
      const response = await api.get('/donor/donation-history');
      
      const fetchedDonations = response.data?.donations;
      
      if (Array.isArray(fetchedDonations)) {
        setDonations(fetchedDonations);
        const totalDonations = response.data?.totalDonations || 0;
        setStats(prev => ({
          ...prev,
          totalDonations,
          livesSaved: totalDonations * 3 // Each donation saves ~3 lives
        }));
      } else {
        console.warn('Unexpected response format:', response.data);
        setDonations([]);
      }
    } catch (err) {
      console.error('Load history error:', err);
      setError('Failed to load donation history');
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysSinceLastDonation = () => {
    if (!stats.lastDonation) return null;
    return Math.floor((new Date() - new Date(stats.lastDonation)) / (1000 * 60 * 60 * 24));
  };

  const getDaysUntilEligible = () => {
    if (!stats.nextEligibleDate) return null;
    const days = Math.ceil((new Date(stats.nextEligibleDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-green-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-xl text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/donor/dashboard')}
            className="text-gray-600 hover:text-gray-800 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-green-600">📊 Donation History</h1>
          <p className="text-sm text-gray-600">Track your life-saving journey</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Total Donations */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100 text-sm">Total Donations</span>
              <div className="text-3xl">💉</div>
            </div>
            <p className="text-4xl font-bold">{stats.totalDonations}</p>
          </div>

          {/* Lives Saved */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-100 text-sm">Lives Saved</span>
              <div className="text-3xl">❤️</div>
            </div>
            <p className="text-4xl font-bold">{stats.livesSaved}</p>
            <p className="text-xs text-red-100 mt-1">~3 lives per donation</p>
          </div>

          {/* Blood Group */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100 text-sm">Blood Group</span>
              <div className="text-3xl">🩸</div>
            </div>
            <p className="text-4xl font-bold">{stats.bloodGroup || 'N/A'}</p>
          </div>

          {/* Next Donation */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">Next Donation</span>
              <div className="text-3xl">📅</div>
            </div>
            {getDaysUntilEligible() !== null && getDaysUntilEligible() > 0 ? (
              <>
                <p className="text-3xl font-bold">{getDaysUntilEligible()}</p>
                <p className="text-xs text-blue-100 mt-1">days remaining</p>
              </>
            ) : (
              <p className="text-2xl font-bold">Ready!</p>
            )}
          </div>
        </div>

        {/* Impact Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🌟 Your Impact</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl mb-2">🏥</div>
              <p className="text-2xl font-bold text-green-600">{stats.totalDonations}</p>
              <p className="text-sm text-gray-600">Emergency Responses</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl mb-2">👨‍👩‍👧‍👦</div>
              <p className="text-2xl font-bold text-red-600">{stats.livesSaved}</p>
              <p className="text-sm text-gray-600">Families Helped</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">⏱️</div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.lastDonation ? getDaysSinceLastDonation() : 0}
              </p>
              <p className="text-sm text-gray-600">Days Since Last Donation</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
            <p className="text-gray-700 text-center">
              💪 <strong>Fun Fact:</strong> One blood donation can save up to 3 lives! 
              {stats.totalDonations > 0 && ` You've potentially saved ${stats.livesSaved} people.`}
            </p>
          </div>
        </div>

        {/* Timeline Header */}
        {donations.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📜 Donation Timeline</h2>
            <p className="text-gray-600">Your complete donation history</p>
          </div>
        )}

        {donations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">💉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No donations yet</h2>
            <p className="text-gray-600 mb-6">
              Start your life-saving journey by accepting blood requests
            </p>
            <button
              onClick={() => navigate('/donor/requests')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              View Blood Requests
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map((donation, index) => (
              <div key={donation.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center text-2xl">
                      💉
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Donation #{stats.totalDonations - index}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(donation.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{donation.bloodGroup}</p>
                    <p className="text-sm text-gray-600">
                      {donation.unitsNeeded} {donation.unitsNeeded === 1 ? 'unit' : 'units'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Receiver:</span> {donation.receiver}
                      </p>
                      {donation.location && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Hospital:</span> {donation.location.hospital}
                        </p>
                      )}
                    </div>
                    <div>
                      {donation.location && (
                        <>
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">City:</span> {donation.location.city}, {donation.location.state}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Pincode:</span> {donation.location.pincode}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Completed</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {Math.floor((new Date() - new Date(donation.date)) / (1000 * 60 * 60 * 24))} days ago
                    </p>
                    <p className="text-xs text-green-600 font-semibold">
                      ~3 lives saved 💚
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Motivational Footer */}
        {donations.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-lg p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Thank You, Hero! 🦸</h3>
            <p className="text-green-100 mb-4">
              You've made {stats.totalDonations} {stats.totalDonations === 1 ? 'donation' : 'donations'} and potentially saved {stats.livesSaved} lives.
            </p>
            <p className="text-sm text-green-100">
              Every donation counts. Keep up the amazing work! 💪
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default DonationHistory;