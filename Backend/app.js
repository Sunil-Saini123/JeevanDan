const express = require('express');
const cors = require('cors');
const donorRoutes = require('./routes/donor.routes');
const receiverRoutes = require('./routes/receiver.routes');
const matchingRoutes = require('./routes/matching.routes'); // 🆕 ADD THIS


const app = express();

// Connect to Database


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/donor', donorRoutes);
app.use('/api/receiver', receiverRoutes);
app.use('/api/match', matchingRoutes); // 🆕 ADD THIS

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'JeevanDan API is running' });
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

module.exports = app;