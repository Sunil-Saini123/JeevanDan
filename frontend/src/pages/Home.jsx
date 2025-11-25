import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 text-white">
      {/* Hero Section */}
      <header className="text-center py-20">
        <h1 className="text-6xl font-bold mb-4">🩸 JeevanDan</h1>
        <p className="text-2xl text-purple-200">Save Lives Through Blood Donation</p>
      </header>

      {/* User Type Selection */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Donor Card */}
          <div className="bg-white text-gray-800 rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💉</div>
              <h2 className="text-3xl font-bold text-purple-600 mb-2">I want to Donate Blood</h2>
              <p className="text-gray-600">Be a hero, save lives</p>
            </div>
            
            <div className="flex gap-4">
              <Link 
                to="/donor/login" 
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition text-center"
              >
                Login
              </Link>
              <Link 
                to="/donor/register" 
                className="flex-1 border-2 border-purple-600 text-purple-600 py-3 rounded-lg font-semibold hover:bg-purple-50 transition text-center"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Receiver Card */}
          <div className="bg-white text-gray-800 rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏥</div>
              <h2 className="text-3xl font-bold text-red-600 mb-2">I need Blood</h2>
              <p className="text-gray-600">Find donors near you</p>
            </div>
            
            <div className="flex gap-4">
              <Link 
                to="/receiver/login" 
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition text-center"
              >
                Login
              </Link>
              <Link 
                to="/receiver/register" 
                className="flex-1 border-2 border-red-600 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-50 transition text-center"
              >
                Register
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Home;