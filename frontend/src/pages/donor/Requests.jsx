// frontend/src/pages/donor/Requests.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

function DonorRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]); // ✅ Default to empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.get('/donor/requests');
      
      // ✅ Defensive check
      const fetchedRequests = response.data?.requests;
      
      if (Array.isArray(fetchedRequests)) {
        setRequests(fetchedRequests);
      } else {
        console.warn('Unexpected response format:', response.data);
        setRequests([]);
      }
    } catch (err) {
      console.error('Load requests error:', err);
      setError('Failed to load requests');
      setRequests([]); // ✅ Ensure array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    if (!confirm('Accept this request?')) return;
    setActionLoading(requestId);
    try {
      const res = await api.post(`/donor/accept-request/${requestId}`);
      alert(`✅ Accepted. OTP to share: ${res.data?.otp || 'N/A'}`);
      loadRequests();
    } catch (err) {
      alert('Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!confirm('Are you sure you want to reject this request?')) return;

    setActionLoading(requestId);
    try {
      await api.post(`/donor/reject-request/${requestId}`);
      loadRequests(); // Reload
      alert('Request rejected');
    } catch (err) {
      alert('Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      Critical: 'bg-red-600 text-white',
      Urgent: 'bg-orange-500 text-white',
      Moderate: 'bg-blue-500 text-white'
    };
    return colors[urgency] || 'bg-gray-500 text-white';
  };

  const getResponseBadge = (response) => {
    const badges = {
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return badges[response] || 'bg-gray-100 text-gray-800';
  };

  const getDonationStatusBadge = (status) => {
    const map = {
      scheduled: 'bg-blue-100 text-blue-700',
      started: 'bg-indigo-100 text-indigo-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-purple-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-xl text-gray-600">Loading requests...</p>
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
          <h1 className="text-2xl font-bold text-purple-600">📋 Blood Requests</h1>
          <p className="text-sm text-gray-600">
            Requests matched to your blood group and location
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

        {/* ✅ Simplified check - requests defaults to [] */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No blood requests yet</h2>
            <p className="text-gray-600">
              You'll receive notifications when someone needs your blood group
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-red-600">
                        {request.bloodGroup}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(request.urgencyLevel)}`}>
                        {request.urgencyLevel}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getResponseBadge(request.response)}`}>
                        {request.response.toUpperCase()}
                      </span>
                      {request.donationStatus && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDonationStatusBadge(request.donationStatus)}`}>
                          {request.donationStatus.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      {request.unitsNeeded} {request.unitsNeeded === 1 ? 'unit' : 'units'} needed
                    </p>
                  </div>

                  <div className="text-right">
                    {request.matchScore && (
                      <p className="text-sm font-semibold text-green-600">
                        ⭐ Match: {request.matchScore}%
                      </p>
                    )}
                    {request.distance && (
                      <p className="text-sm text-gray-600">
                        📍 {request.distance.toFixed(1)} km away
                      </p>
                    )}
                  </div>
                </div>

                {/* Patient Details */}
                {request.patientDetails && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Patient Information</h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-600">
                        <span className="font-semibold">Name:</span> {request.patientDetails.name}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">Age:</span> {request.patientDetails.age}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">Gender:</span> {request.patientDetails.gender}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">Condition:</span> {request.patientDetails.medicalCondition}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location Details */}
                {request.address && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">📍 Location</h4>
                    <p className="text-sm text-gray-700">
                      {request.address.hospital}, {request.address.city}, {request.address.state} - {request.address.pincode}
                    </p>
                  </div>
                )}

                {/* Receiver Contact (only if accepted) */}
                {request.response === 'accepted' && request.receiver && (
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-green-800 mb-2">✓ Receiver Contact Details</h4>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Name:</span> {request.receiver.fullName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Phone:</span> {request.receiver.contactNumber}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Email:</span> {request.receiver.email}
                    </p>
                  </div>
                )}

                {/* Time Info */}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <p>Required by: {new Date(request.requiredBy).toLocaleString()}</p>
                  <p>Posted: {new Date(request.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Action Buttons */}
                {request.response === 'pending' && request.donationStatus === 'scheduled' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 font-semibold"
                    >
                      {actionLoading === request.id ? 'Processing...' : '✓ Accept Request'}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 font-semibold"
                    >
                      {actionLoading === request.id ? 'Processing...' : '✕ Reject'}
                    </button>
                  </div>
                )}

                {request.response === 'accepted' && (
                  <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg text-center font-semibold">
                    ✓ You accepted this request on {new Date(request.respondedAt).toLocaleDateString()}
                  </div>
                )}

                {request.response === 'rejected' && (
                  <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-lg text-center">
                    You rejected this request
                  </div>
                )}

                {/* OTP Block - only for accepted requests */}
                {request.response === 'accepted' && request.confirmationCode && (
                  <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm">
                    <p className="font-semibold text-purple-800 mb-1">Your OTP (share only with receiver in person):</p>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1 bg-white border rounded text-purple-700 tracking-widest font-bold">
                        {request.confirmationCode}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(request.confirmationCode);
                          alert('OTP copied');
                        }}
                        className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">
                      Donation not counted until receiver starts and completes it.
                    </p>
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

export default DonorRequests;