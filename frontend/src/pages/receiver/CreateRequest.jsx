// frontend/src/pages/receiver/CreateRequest.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import api from '../../utils/api';

function CreateRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    bloodGroup: '',
    unitsNeeded: 1,
    urgencyLevel: 'Moderate',
    requiredBy: '',
    hospital: '',
    city: '',
    state: '',
    pincode: '',
    patientName: '',
    patientAge: '',
    patientGender: '',
    medicalCondition: '',
    notes: ''
  });

  const [location, setLocation] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGettingLocation(false);
      },
      (error) => {
        setError('Unable to get location: ' + error.message);
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!location) {
      setError('Please allow location access');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        bloodGroup: formData.bloodGroup,
        unitsNeeded: parseInt(formData.unitsNeeded),
        urgencyLevel: formData.urgencyLevel,
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        address: {
          hospital: formData.hospital,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        },
        patientDetails: {
          name: formData.patientName,
          age: parseInt(formData.patientAge),
          gender: formData.patientGender,
          medicalCondition: formData.medicalCondition
        },
        requiredBy: new Date(formData.requiredBy),
        notes: formData.notes
      };

      await api.post('/receiver/create-request', payload);
      navigate('/receiver/my-requests');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.bloodGroup) {
      setError('Please select blood group');
      return;
    }
    if (currentStep === 2 && !location) {
      setError('Please allow location access');
      return;
    }
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/receiver/dashboard')}
              className="text-gray-600 hover:text-gray-800 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h2 className="text-3xl font-bold text-red-600 mb-2">
              🆘 Create Blood Request
            </h2>
            <p className="text-gray-600">
              Fill in the details to find matching donors
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= step ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-24 h-1 ${
                    currentStep > step ? 'bg-red-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Blood Requirements */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Blood Requirements</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Blood Group *
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Units Needed *
                    </label>
                    <input
                      type="number"
                      name="unitsNeeded"
                      value={formData.unitsNeeded}
                      onChange={handleChange}
                      required
                      min={1}
                      max={10}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Urgency Level *
                    </label>
                    <select
                      name="urgencyLevel"
                      value={formData.urgencyLevel}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    >
                      <option value="Moderate">Moderate</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Required By *
                    </label>
                    <input
                      type="datetime-local"
                      name="requiredBy"
                      value={formData.requiredBy}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Hospital Location</h3>
                
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    📍 We need your location to find nearby donors
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gettingLocation || location}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {gettingLocation ? 'Getting Location...' : location ? '✓ Location Captured' : '📍 Get Current Location'}
                </button>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Hospital Name *
                    </label>
                    <input
                      type="text"
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                      placeholder="Hospital name"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                      placeholder="6-digit pincode"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Patient Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Patient Details</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                      placeholder="Patient name"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Patient Age *
                    </label>
                    <input
                      type="number"
                      name="patientAge"
                      value={formData.patientAge}
                      onChange={handleChange}
                      required
                      min={1}
                      max={120}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                      placeholder="Age"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Patient Gender *
                    </label>
                    <select
                      name="patientGender"
                      value={formData.patientGender}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Medical Condition *
                    </label>
                    <input
                      type="text"
                      name="medicalCondition"
                      value={formData.medicalCondition}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                      placeholder="Brief description"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    placeholder="Any additional information..."
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  ← Previous
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  {loading ? 'Creating Request...' : '✓ Create Request'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateRequest;