const mongoose = require("mongoose");

const receiverSchema = new mongoose.Schema({
  fullName: { type: String, required: true, minlength: 3 },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    unique: true,
  },
  password: { type: String, required: true, minlength: 6 },
  contactNumber: {
    type: String,
    required: true,
    match: [/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"],
    unique: true,
  },

  // Optional: Additional receiver info
  age: { type: Number, min: 0 },
  gender: { type: String, enum: ["Male", "Female", "Other"] },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model("Receiver", receiverSchema);
