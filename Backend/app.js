const express = require('express');
const cors = require('cors');
const http = require('http'); // ✅ ADD
const { Server } = require('socket.io'); // ✅ ADD
const donorRoutes = require('./routes/donor.routes');
const receiverRoutes = require('./routes/receiver.routes');
const matchingRoutes = require('./routes/matching.routes');
const socketService = require('./services/socket.service'); // ✅ ADD
const cron = require('node-cron');
const { cascadeToNextDonor } = require('./services/matching.service');
const Request = require('./models/request.model');
const Donor = require('./models/donor.models');

const app = express();

// ✅ CREATE HTTP SERVER
const server = http.createServer(app);

// ✅ SETUP SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// ✅ INITIALIZE SOCKET SERVICE
socketService.initialize(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/donor', donorRoutes);
app.use('/api/receiver', receiverRoutes);
app.use('/api/match', matchingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'JeevanDan API is running',
    socketConnections: socketService.getConnectedUsersCount() // ✅ ADD
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Check expired notifications every hour
cron.schedule('0 * * * *', async () => {
  console.log('🔄 Checking expired donor notifications...');
  try {
    const activeRequests = await Request.find({
      status: { $nin: ['completed', 'cancelled', 'expired'] }
    });

    for (const request of activeRequests) {
      await cascadeToNextDonor(request._id);
    }
  } catch (error) {
    console.error('❌ Cascade cron error:', error);
  }
});

// Re-enable donors after 3-month cooldown (daily at midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Checking donor availability cooldowns...');
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const result = await Donor.updateMany(
      {
        isAvailable: false,
        lastDonationDate: { $lte: threeMonthsAgo }
      },
      { $set: { isAvailable: true } }
    );

    console.log(`✅ Re-enabled ${result.modifiedCount} donors`);
  } catch (error) {
    console.error('❌ Availability cron error:', error);
  }
});

module.exports = { app, server }; // ✅ EXPORT BOTH