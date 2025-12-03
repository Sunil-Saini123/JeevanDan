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

// Re-enable donors after gender-specific cooldown (daily at midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('\n🔄 === Checking donor cooldown periods ===');
  try {
    const now = new Date();
    
    // ✅ Men: 90 days (3 months)
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const menResult = await Donor.updateMany(
      {
        isAvailable: false,
        gender: 'Male',
        lastDonationDate: { $lte: ninetyDaysAgo }
      },
      { $set: { isAvailable: true } }
    );

    console.log(`✅ Re-enabled ${menResult.modifiedCount} male donors (90-day cooldown)`);

    // ✅ Women: 120 days (4 months)
    const oneTwentyDaysAgo = new Date(now);
    oneTwentyDaysAgo.setDate(oneTwentyDaysAgo.getDate() - 120);
    
    const womenResult = await Donor.updateMany(
      {
        isAvailable: false,
        gender: 'Female',
        lastDonationDate: { $lte: oneTwentyDaysAgo }
      },
      { $set: { isAvailable: true } }
    );

    console.log(`✅ Re-enabled ${womenResult.modifiedCount} female donors (120-day cooldown)`);
    
    const totalReEnabled = menResult.modifiedCount + womenResult.modifiedCount;
    console.log(`🎉 Total donors re-enabled: ${totalReEnabled}\n`);

  } catch (error) {
    console.error('❌ Availability cron error:', error);
  }
});

console.log('✅ Cron jobs initialized:');
console.log('   📅 Expired notifications: Every hour');
console.log('   📅 Donor cooldown: Daily at midnight (Male: 90d, Female: 120d)');

module.exports = { app, server }; // ✅ EXPORT BOTH