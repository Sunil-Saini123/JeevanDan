// frontend/src/pages/receiver/MatchedDonors.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';

function MatchedDonors() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    loadMatchedDonors();
  }, [requestId]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.warn('Geolocation error:', error)
      );
    }
  }, []);

  const loadMatchedDonors = async () => {
    try {
      const response = await api.get(`/receiver/matched-donors/${requestId}`); // fixed path
      
      setRequest({
        id: response.data?.requestId,
        bloodGroup: response.data?.bloodGroup,
        status: response.data?.status
      });
      
      // ✅ Defensive check
      const fetchedDonors = response.data?.matchedDonors;
      
      if (Array.isArray(fetchedDonors)) {
        setDonors(fetchedDonors);
      } else {
        console.warn('Unexpected response format:', response.data);
        setDonors([]);
      }
    } catch (err) {
      console.error('Load donors error:', err);
      setError('Failed to load matched donors');
      setDonors([]); // ✅ Ensure array on error
    } finally {
      setLoading(false);
    }
  };

  const getResponseBadge = (response) => {
    const badges = {
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return badges[response] || 'bg-gray-100 text-gray-800';
  };

  const startDonation = async (donorId) => {
    if (!otpInput) return alert('Enter OTP from donor');
    await api.post(`/receiver/request/${requestId}/start-donation`, { donorId, otp: otpInput });
    setOtpInput('');
    await loadMatchedDonors();
  };

  const completeDonation = async (donorId) => {
    await api.post(`/receiver/request/${requestId}/complete-donation`, { donorId, unitsDonated: 1 });
    await loadMatchedDonors();
  };

  const calculateLiveDistance = (donorCoordinates) => {
    if (!currentLocation || !donorCoordinates || donorCoordinates.length !== 2) {
      return null;
    }

    const [donorLon, donorLat] = donorCoordinates;
    const { latitude: currLat, longitude: currLon } = currentLocation;

    const R = 6371;
    const dLat = (donorLat - currLat) * Math.PI / 180;
    const dLon = (donorLon - currLon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(currLat * Math.PI / 180) * Math.cos(donorLat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-red-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-xl text-gray-600">Loading donors...</p>
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
            onClick={() => navigate('/receiver/my-requests')}
            className="text-gray-600 hover:text-gray-800 mb-2"
          >
            ← Back to My Requests
          </button>
          <h1 className="text-2xl font-bold text-red-600">
            👥 Matched Donors for {request?.bloodGroup} Request
          </h1>
          <p className="text-sm text-gray-600">
            Status: <span className="font-semibold">{request?.status}</span>
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

        {donors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No donors matched yet</h2>
            <p className="text-gray-600">
              Our AI is searching for compatible donors near you...
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {donors.map((match, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {match.donor.fullName}
                    </h3>
                    <p className="text-lg text-red-600 font-semibold">
                      {match.donor.bloodGroup}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getResponseBadge(match.response)}`}>
                    {match.response.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📍</span>
                    <span className="text-gray-600">
                      {currentLocation && match.donor.currentLocation?.coordinates ? 
                        `${calculateLiveDistance(match.donor.currentLocation.coordinates)} km away (live 🟢)` : 
                        `${match.distance} km away`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <span className="text-gray-600">
                      Match Score: {match.matchScore ? `${match.matchScore}%` : 'Calculating...'}
                    </span>
                  </div>

                  {match.donor.isAvailable !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{match.donor.isAvailable ? '✅' : '❌'}</span>
                      <span className="text-gray-600">
                        {match.donor.isAvailable ? 'Currently Available' : 'Currently Unavailable'}
                      </span>
                    </div>
                  )}
                </div>

                {match.response === 'accepted' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">✓ Contact Details</h4>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Phone:</span> {match.donor.contactNumber}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Email:</span> {match.donor.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Responded: {new Date(match.respondedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {match.response === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⏳ Waiting for donor response...
                    </p>
                  </div>
                )}

                {match.response === 'rejected' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      ✕ Donor declined
                    </p>
                    {match.respondedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(match.respondedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {match.response === 'accepted' && match.donationStatus === 'scheduled' && (
                  <div className="mt-4 space-y-2">
                    <input
                      className="border px-3 py-2 rounded w-full text-sm"
                      placeholder="Enter donor OTP"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value)}
                    />
                    <button
                      onClick={() => startDonation(match.donor.id || match.donor._id)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      ▶ Start Donation
                    </button>
                  </div>
                )}
                {match.donationStatus === 'started' && (
                  <button
                    onClick={() => completeDonation(match.donor.id || match.donor._id)}
                    className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                  >
                    ✅ Complete Donation
                  </button>
                )}
                {match.donationStatus === 'completed' && (
                  <div className="mt-4 bg-green-100 text-green-800 px-3 py-2 rounded text-sm font-semibold">
                    Donation Completed
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MatchedDonors;