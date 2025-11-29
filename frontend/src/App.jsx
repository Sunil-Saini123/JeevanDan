import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';

// Auth pages
import DonorLogin from './pages/auth/DonorLogin';
import DonorRegister from './pages/auth/DonorRegister';
import ReceiverLogin from './pages/auth/ReceiverLogin';
import ReceiverRegister from './pages/auth/ReceiverRegister';

// Donor pages
import DonorDashboard from './pages/donor/Dashboard';
import DonorRequests from './pages/donor/Requests';
import DonationHistory from './pages/donor/DonationHistory';

// Receiver pages
import ReceiverDashboard from './pages/receiver/Dashboard';
import CreateRequest from './pages/receiver/CreateRequest';
import MyRequests from './pages/receiver/MyRequests';
import MatchedDonors from './pages/receiver/MatchedDonors';
import ReceiverHistory from './pages/receiver/ReceiverHistory.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          
          {/* Donor Auth Routes */}
          <Route path="/donor/login" element={<DonorLogin />} />
          <Route path="/donor/register" element={<DonorRegister />} />
          
          {/* Receiver Auth Routes */}
          <Route path="/receiver/login" element={<ReceiverLogin />} />
          <Route path="/receiver/register" element={<ReceiverRegister />} />
          
          {/* Protected Donor Routes */}
          <Route path="/donor/dashboard" element={
            <ProtectedRoute allowedRole="donor">
              <DonorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/donor/requests" element={
            <ProtectedRoute allowedRole="donor">
              <DonorRequests />
            </ProtectedRoute>
          } />
          <Route path="/donor/history" element={
            <ProtectedRoute allowedRole="donor">
              <DonationHistory />
            </ProtectedRoute>
          } />
          
          {/* Protected Receiver Routes */}
          <Route path="/receiver/dashboard" element={
            <ProtectedRoute allowedRole="receiver">
              <ReceiverDashboard />
            </ProtectedRoute>
          } />
          <Route path="/receiver/create-request" element={
            <ProtectedRoute allowedRole="receiver">
              <CreateRequest />
            </ProtectedRoute>
          } />
          <Route path="/receiver/my-requests" element={
            <ProtectedRoute allowedRole="receiver">
              <MyRequests />
            </ProtectedRoute>
          } />
          <Route path="/receiver/request/:requestId/donors" element={
            <ProtectedRoute allowedRole="receiver">
              <MatchedDonors />
            </ProtectedRoute>
          } />
          <Route path="/receiver/history" element={
            <ProtectedRoute allowedRole="receiver">
              <ReceiverHistory />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
