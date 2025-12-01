const mongoose = require('mongoose');

// Connection for database
function connectToDb() {
  return mongoose.connect(process.env.DB_CONNECT)
    .then(() => {
      console.log("✅ Connected to database");
    })
    .catch((err) => {
      console.error("❌ Database connection error:", err);
      process.exit(1); // Exit process on DB connection failure
    });
}

module.exports = connectToDb;