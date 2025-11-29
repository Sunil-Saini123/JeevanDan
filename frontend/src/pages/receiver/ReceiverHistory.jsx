import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

function ReceiverHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get('/receiver/history');
      setHistory(res.data?.history || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load donation history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-red-600" viewBox="0 0 24 24">
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
            onClick={() => navigate('/receiver/dashboard')}
            className="text-gray-600 hover:text-gray-800 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-red-600">📊 Donation History</h1>
          <p className="text-sm text-gray-600">Your completed blood donation requests</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No completed donations yet</h2>
            <p className="text-gray-600 mb-6">Your completed blood requests will appear here</p>
            <button
              onClick={() => navigate('/receiver/create-request')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
            >
              🆘 Create Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-red-600">
                        {item.bloodGroup}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        COMPLETED
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {item.unitsReceived} {item.unitsReceived === 1 ? 'unit' : 'units'} received
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Completed: {new Date(item.receivedOn).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Hospital:</span> {item.hospital || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Donors:</span> {item.donors?.length || 0}
                    </p>
                  </div>
                  {item.notes && (
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Notes:</span> {item.notes}
                      </p>
                    </div>
                  )}
                </div>

                {item.donors && item.donors.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">👥 Donors</h4>
                    <div className="space-y-1">
                      {item.donors.map((donor, idx) => (
                        <div key={idx} className="text-sm text-gray-700">
                          <span className="font-semibold">{donor.fullName}</span>
                          <span className="ml-2 text-gray-500">• {donor.bloodGroup}</span>
                          {donor.contactNumber && (
                            <span className="ml-2 text-gray-500">• {donor.contactNumber}</span>
                          )}
                        </div>
                      ))}
                    </div>
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

export default ReceiverHistory;