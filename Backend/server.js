require('dotenv').config();
const { server } = require('./app'); // ✅ CHANGED from app to server
const connectDB = require('./db/db');

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => { // ✅ CHANGED from app.listen to server.listen
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSocket server ready`);
  });
});