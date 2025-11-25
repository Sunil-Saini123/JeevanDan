import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Pages
import Home from './pages/Home';
import DonorLogin from './pages/auth/DonorLogin';
import DonorRegister from './pages/auth/DonorRegister';
import ReceiverLogin from './pages/auth/ReceiverLogin';
import ReceiverRegister from './pages/auth/ReceiverRegister';
import DonorDashboard from './pages/donor/Dashboard';
import ReceiverDashboard from './pages/receiver/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Donor Routes */}
          <Route path="/donor/login" element={<DonorLogin />} />
          <Route path="/donor/register" element={<DonorRegister />} />
          <Route 
            path="/donor/dashboard" 
            element={
              <ProtectedRoute allowedRole="donor">
                <DonorDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Receiver Routes */}
          <Route path="/receiver/login" element={<ReceiverLogin />} />
          <Route path="/receiver/register" element={<ReceiverRegister />} />
          <Route 
            path="/receiver/dashboard" 
            element={
              <ProtectedRoute allowedRole="receiver">
                <ReceiverDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
