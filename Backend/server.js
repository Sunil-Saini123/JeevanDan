require('dotenv').config();
const { server } = require('./app');
const connectDB = require('./db/db');

const PORT = process.env.PORT || 3000;

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// Better error handling
connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => { // Listen on all interfaces
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 WebSocket server ready`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  });