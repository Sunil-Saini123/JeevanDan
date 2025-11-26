// frontend/src/pages/receiver/MyRequests.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import api from '../../utils/api';

function MyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]); // ✅ Default to empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.get('/receiver/requests');
      
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

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      await api.delete(`/receiver/request/${requestId}`);
      loadRequests(); // Reload
    } catch (err) {
      alert('Failed to cancel request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      matched: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      Critical: 'bg-red-600 text-white',
      Urgent: 'bg-orange-500 text-white',
      Moderate: 'bg-blue-500 text-white'
    };
    return colors[urgency] || 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-red-600" viewBox="0 0 24 24">
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/receiver/dashboard')}
              className="text-gray-600 hover:text-gray-800 mb-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-red-600">📋 My Blood Requests</h1>
          </div>
          <button
            onClick={() => navigate('/receiver/create-request')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            + New Request
          </button>
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
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No requests yet</h2>
            <p className="text-gray-600 mb-6">Create your first blood request to get started</p>
            <button
              onClick={() => navigate('/receiver/create-request')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
            >
              🆘 Create Request
            </button>
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {request.unitsNeeded} {request.unitsNeeded === 1 ? 'unit' : 'units'} needed
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Created: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Required: {new Date(request.requiredBy).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Matched Donors:</span> {request.matchedDonorsCount || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Accepted:</span> {request.acceptedDonors?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {request.matchedDonorsCount > 0 && (
                    <button
                      onClick={() => navigate(`/receiver/request/${request.id}/donors`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      👥 View Matched Donors ({request.matchedDonorsCount})
                    </button>
                  )}
                  
                  {(request.status === 'pending' || request.status === 'matched') && (
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      ✕ Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyRequests;