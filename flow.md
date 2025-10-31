# JeevanDan Project Flow

## Project Overview
A blood donation platform connecting receivers (who need blood) with donors (who can donate) in real-time using AI-powered matching based on location, health status, and compatibility.

---

## Development Flow

### 1. **Database Schema Design**

#### Donor Model (already exists)
- Personal Info (name, email, phone, age, gender)
- Blood group, weight, health status
- Location (coordinates, address)
- Availability status
- Medical history
- Last donation date
- Verification status

#### Receiver Model (already exists)
- Personal Info
- Blood group needed
- Urgency level
- Required units
- Hospital/location details
- Medical condition details
- Request status (pending, matched, fulfilled, cancelled)

#### Request Model (new)
- Receiver ID
- Donor ID (when matched)
- Status (pending, accepted, rejected, completed)
- Timestamps
- Location details
- Urgency level

---

### 2. **Backend Development Flow**

#### Phase 1: Authentication & User Management
1. **Donor Registration & Login**
   - Email/phone verification
   - Password hashing (bcrypt)
   - JWT token generation
   - Profile creation

2. **Receiver Registration & Login**
   - Similar to donor
   - Additional medical verification

#### Phase 2: Core Features
1. **Donor Services**
   - Update availability status
   - Update location (real-time)
   - View donation history
   - Accept/reject requests

2. **Receiver Services**
   - Create blood request
   - View matched donors
   - Track request status
   - Cancel request

#### Phase 3: Matching Algorithm (AI Integration)
1. **Matching Criteria**
   - Blood group compatibility
   - Distance (geo-location)
   - Donor availability
   - Health status
   - Last donation date (>3 months)
   - AI scoring based on:
     - Match percentage
     - Response history
     - Reliability score

2. **Real-time Notification System**
   - WebSocket/Socket.io for live updates
   - Send requests to top matched donors
   - Real-time status updates

---

### 3. **API Endpoints Structure**

#### Authentication
```
POST /api/auth/donor/register
POST /api/auth/donor/login
POST /api/auth/receiver/register
POST /api/auth/receiver/login
```

#### Donor Endpoints
```
GET    /api/donor/profile
PUT    /api/donor/profile
PUT    /api/donor/availability
PUT    /api/donor/location
GET    /api/donor/requests
POST   /api/donor/accept-request/:requestId
POST   /api/donor/reject-request/:requestId
```

#### Receiver Endpoints
```
GET    /api/receiver/profile
PUT    /api/receiver/profile
POST   /api/receiver/create-request
GET    /api/receiver/requests
GET    /api/receiver/matched-donors/:requestId
DELETE /api/receiver/cancel-request/:requestId
```

#### Matching Endpoints
```
POST   /api/match/find-donors
GET    /api/match/request-status/:requestId
```

---

### 4. **Frontend Development Flow**

#### Phase 1: UI Components
1. **Common Components**
   - Navbar
   - Footer
   - Loading spinner
   - Alert/Notification
   - Map component (Google Maps/Mapbox)

2. **Authentication Pages**
   - Login (donor/receiver selection)
   - Register (donor/receiver forms)
   - Forgot password

#### Phase 2: Donor Dashboard
1. **Profile Management**
   - View/edit profile
   - Update availability toggle
   - Location update

2. **Request Management**
   - Incoming requests list
   - Request details view
   - Accept/Reject actions
   - Donation history

#### Phase 3: Receiver Dashboard
1. **Request Creation**
   - Multi-step form
   - Blood group selection
   - Urgency level
   - Location picker
   - Medical details

2. **Donor Matching**
   - View matched donors
   - AI match percentage display
   - Donor profiles
   - Send request button

3. **Request Tracking**
   - Active requests
   - Status updates
   - Donor responses
   - Request history

---

### 5. **AI Integration Flow**

1. **Data Collection**
   - Donor location data
   - Health metrics
   - Response history
   - Success rate

2. **Matching Algorithm**
   ```
   Score = (Blood_Compatibility * 40%) + 
           (Distance_Score * 30%) + 
           (Availability_Score * 15%) + 
           (Health_Score * 10%) + 
           (Reliability_Score * 5%)
   ```

3. **Machine Learning (Future)**
   - Predict donor availability
   - Optimize matching
   - Fraud detection

---

### 6. **Implementation Steps**

#### Week 1-2: Backend Foundation
- [ ] Set up Express server
- [ ] MongoDB connection
- [ ] Create models (Request model)
- [ ] Authentication middleware
- [ ] Basic CRUD operations

#### Week 3-4: Core Features
- [ ] Donor registration/login
- [ ] Receiver registration/login
- [ ] Profile management
- [ ] Request creation

#### Week 5-6: Matching System
- [ ] Geo-location services
- [ ] Matching algorithm
- [ ] Request routing system
- [ ] Status management

#### Week 7-8: Frontend
- [ ] React setup with Vite
- [ ] Component structure
- [ ] Authentication pages
- [ ] Donor dashboard
- [ ] Receiver dashboard

#### Week 9-10: Real-time Features
- [ ] WebSocket integration
- [ ] Live notifications
- [ ] Real-time status updates
- [ ] Map integration

#### Week 11-12: Testing & Deployment
- [ ] Unit testing
- [ ] Integration testing
- [ ] Bug fixes
- [ ] Deployment (Vercel/Netlify + Railway/Render)

---

### 7. **Technology Stack**

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT for auth
- Socket.io (real-time)
- Google Maps API (location)

**Frontend:**
- React + Vite
- React Router
- Axios
- Socket.io-client
- Material-UI/Tailwind CSS
- React Leaflet/Google Maps

**AI/ML (Future):**
- Python Flask/FastAPI
- TensorFlow/Scikit-learn
- Distance calculation algorithms

---

### 8. **Key Features to Implement**

1. ✅ User authentication (both types)
2. ✅ Profile management
3. 🔄 Real-time location tracking
4. 🔄 AI-powered matching
5. 🔄 Request management system
6. 🔄 Notification system
7. 🔄 Map visualization
8. ⏳ Admin dashboard
9. ⏳ Analytics & reporting
10. ⏳ Emergency SOS feature

---

### 9. **Data Flow Diagram**

```
Receiver Creates Request
        ↓
System Searches Available Donors
        ↓
AI Matching Algorithm Ranks Donors
        ↓
Top Matched Donors Receive Notification
        ↓
Donor Accepts/Rejects Request
        ↓
Receiver Gets Notification
        ↓
Connection Established
        ↓
Donation Process
        ↓
Status Updated (Completed/Cancelled)
```

---

### 10. **Security Considerations**

- Input validation on all forms
- Rate limiting on APIs
- JWT token expiration
- Password hashing (bcrypt)
- HTTPS only
- CORS configuration
- Data encryption
- User verification (email/phone)
- Privacy controls for location data

---

This flow provides a structured approach to building the JeevanDan platform. Start with the backend foundation and gradually add features while keeping the end goal in mind.