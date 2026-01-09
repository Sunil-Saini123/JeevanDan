# 🩸 JeevanDan - Blood Donation Platform

A real-time blood donation platform connecting donors with receivers in emergency situations. Built with MERN stack and Socket.io for instant notifications.

🔗 **Live Demo:** [Jeevan Dan Website](https://jeevan-dan-rosy.vercel.app/)

## 🌟 Features

### For Blood Donors
- ✅ Register with blood group and location
- 📍 Get notified of nearby blood requests
- 🔔 Real-time notifications based on urgency
- 📊 Track donation history
- ⏰ Automatic availability management with gender-specific cooldown periods
- 🎯 Smart matching based on distance and compatibility

### For Blood Receivers
- 🆘 Create urgent/critical blood requests
- 📍 Automatic location-based donor matching
- 👥 View matched donors in real-time
- 🔐 OTP-based donation verification
- 📈 Track request status and history
- ⚡ Multi-level urgency system (Critical/Urgent/Moderate)

### System Features
- 🔄 **Real-time Updates** - Socket.io powered instant notifications
- 🎯 **Smart Matching** - Distance and blood compatibility based
- 🌊 **Cascade System** - Automatically finds alternative donors if first donor doesn't respond
- 🔒 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- ⏱️ **Automated Jobs** - Cron jobs for donor availability and request expiry
- 📱 **Responsive Design** - Works on all devices

---

## 🏗️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Node-cron** - Scheduled jobs

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.io-client** - Real-time updates
- **Tailwind CSS** - Styling

---

## 📁 Project Structure

```
JeevanDan/
├── Backend/
│   ├── controllers/       # Request handlers
│   │   ├── donor.controller.js
│   │   ├── receiver.controller.js
│   │   └── matching.controller.js
│   ├── models/           # Database schemas
│   │   ├── donor.models.js
│   │   ├── receiver.models.js
│   │   └── request.model.js
│   ├── routes/           # API routes
│   │   ├── donor.routes.js
│   │   ├── receiver.routes.js
│   │   └── matching.routes.js
│   ├── services/         # Business logic
│   │   ├── auth.services.js
│   │   ├── matching.service.js
│   │   └── socket.service.js
│   ├── middleware/       # Custom middleware
│   │   └── auth.middleware.js
│   ├── db/              # Database connection
│   │   └── db.js
│   ├── app.js           # Express app setup
│   ├── server.js        # Server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   │   ├── GlobalNotifications.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/        # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── auth/     # Authentication pages
│   │   │   ├── donor/    # Donor pages
│   │   │   └── receiver/ # Receiver pages
│   │   ├── utils/        # Utilities
│   │   │   ├── api.js
│   │   │   ├── socket.js
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/Sunil-Saini123/JeevanDan.git
cd JeevanDan
```

#### 2. Backend Setup
```bash
cd Backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
# Required variables:
# - DB_CONNECT (MongoDB connection string)
# - JWT_SECRET (random secret key)
# - PORT (default: 3000)
# - CLIENT_URL (frontend URL)
```

**Backend `.env` example:**
```env
PORT=3000
DB_CONNECT=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/jeevandan?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with backend URL
```

**Frontend `.env` example:**
```env
VITE_API_URL=http://localhost:3000
```

#### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

---

## 📡 API Endpoints

### Authentication

#### Donor
- `POST /api/donor/register` - Register new donor
- `POST /api/donor/login` - Donor login

#### Receiver
- `POST /api/receiver/register` - Register new receiver
- `POST /api/receiver/login` - Receiver login

### Donor Endpoints (Protected)
- `GET /api/donor/profile` - Get donor profile
- `PUT /api/donor/profile` - Update profile
- `PUT /api/donor/availability` - Toggle availability
- `PUT /api/donor/location` - Update location
- `GET /api/donor/requests` - Get nearby blood requests
- `POST /api/donor/accept-request/:id` - Accept blood request
- `POST /api/donor/reject-request/:id` - Reject blood request
- `GET /api/donor/donation-history` - Get donation history

### Receiver Endpoints (Protected)
- `GET /api/receiver/profile` - Get receiver profile
- `PUT /api/receiver/profile` - Update profile
- `POST /api/receiver/create-request` - Create blood request
- `GET /api/receiver/requests` - Get all requests
- `GET /api/receiver/requests/:id` - Get request details
- `DELETE /api/receiver/requests/:id` - Cancel request
- `POST /api/receiver/start-donation/:id` - Start donation process
- `POST /api/receiver/complete-donation/:id` - Complete donation
- `GET /api/receiver/history` - Get request history

### Matching Endpoints
- `GET /api/match/donors/:requestId` - Get matched donors for request

---

## 🔔 Socket Events

### Donor Events
- `newBloodRequest` - New matching blood request nearby
- `donationStarted` - Receiver started donation process
- `donationCompleted` - Donation completed successfully

### Receiver Events
- `donorAccepted` - Donor accepted your request
- `donorRejected` - Donor rejected your request
- `noDonorsFound` - No compatible donors available
- `cascadeFailed` - Finding alternative donors

---

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with salt rounds
- **Protected Routes** - Middleware-based authorization
- **CORS Protection** - Configured allowed origins
- **Input Validation** - Express-validator
- **Environment Variables** - Sensitive data protection
- **OTP Verification** - Donation process verification

---

## 🎯 Key Features Explained

### Smart Matching Algorithm
1. **Blood Compatibility Check** - Matches compatible blood groups
2. **Distance Calculation** - Uses Haversine formula for accurate distance
3. **Urgency-based Radius**:
   - Critical: 15 km
   - Urgent: 10 km  
   - Moderate: 5 km
4. **Match Scoring System** (100-point scale):
   - Blood Compatibility: 40% (45% for exact match)
   - Distance: 30%
   - Availability: 15%
   - Health Status: 10%
   - Donation History: 5%
5. **Dynamic Parallel Notifications**:
   - **Similarity Grouping**: Groups donors within ±5 score points AND ±2 km of top match
   - **Urgency Buffer**: 
     - Critical: units + 3 buffer (e.g., 1 unit = notify 4 donors minimum)
     - Urgent: units + 2 buffer (e.g., 1 unit = notify 3 donors minimum)
     - Moderate: units + 1 buffer (e.g., 1 unit = notify 2 donors minimum)
   - **Final Count**: Notifies whichever is larger between similar group OR urgency buffer
   - **Example**: If top donor scores 95 at 3km:
     - Similar group: All donors with score 90-100 at 1-5km (say 6 donors)
     - Urgency buffer for Critical: 4 donors
     - **Result**: Notifies all 6 similar donors (larger group)

### Cascade System
- **Time-based Expiry**: Notifications expire based on urgency
  - Critical: 6 hours
  - Urgent: 12 hours
  - Moderate: 24 hours
- **Progressive Radius Expansion**: Search radius expands by 50% when cascading
  - Critical: 15km → 22.5km
  - Urgent: 10km → 15km
  - Moderate: 5km → 7.5km
- **Auto-notification**: Finds new donors when previous ones don't respond
- **First-Accept Wins**: First donor to accept gets priority, others auto-rejected
- **Real-time Updates**: Socket.io notifications to all parties instantly

### Concurrent Request Handling
- **Parallel Matching**: Multiple donors notified simultaneously for faster response
- **Race Condition Protection**: System handles multiple simultaneous accepts safely
- **Fair Competition**: Similarity grouping ensures equally qualified donors get equal opportunity
- **Smart Selection**: System takes max(similar donors, urgency buffer) for optimal coverage
- **Real-time Synchronization**: All status changes broadcast instantly via WebSocket

---

**Made with 🩸 to save lives**
