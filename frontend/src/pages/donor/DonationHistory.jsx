// frontend/src/pages/donor/DonationHistory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

function DonationHistory() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDonationHistory();
  }, []);

  const loadDonationHistory = async () => {
    try {
      const response = await api.get('/donor/donation-history');
      
      // ✅ Defensive check
      const fetchedDonations = response.data?.donations;
      
      if (Array.isArray(fetchedDonations)) {
        setDonations(fetchedDonations);
        setTotalDonations(response.data?.totalDonations || 0);
      } else {
        console.warn('Unexpected response format:', response.data);
        setDonations([]);
        setTotalDonations(0);
      }
    } catch (err) {
      console.error('Load history error:', err);
      setError('Failed to load donation history');
      setDonations([]); // ✅ Ensure array on error
      setTotalDonations(0);
    } finally {
      setLoading(false);
    }
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
          <p className="text-sm text-gray-600">
            Total Donations: <span className="font-bold text-green-600">{totalDonations}</span>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Stats Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold mb-2">{totalDonations}</h2>
              <p className="text-green-100">Total Lives Saved</p>
            </div>
            <div className="text-6xl opacity-50">💉</div>
          </div>
          <div className="mt-6 pt-6 border-t border-green-400">
            <p className="text-green-100">
              Thank you for your generous contributions! Each donation can save up to 3 lives.
            </p>
          </div>
        </div>

        {donations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">💉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No donations yet</h2>
            <p className="text-gray-600 mb-6">
              Accept blood requests to start your donation journey
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
                        Donation #{totalDonations - index}
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
                          <span className="font-semibold">Location:</span> {donation.location.hospital}, {donation.location.city}
                        </p>
                      )}
                    </div>
                    <div>
                      {donation.location?.pincode && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Pincode:</span> {donation.location.pincode}
                        </p>
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
                  <p className="text-xs text-gray-500">
                    {Math.floor((new Date() - new Date(donation.date)) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default DonationHistory;