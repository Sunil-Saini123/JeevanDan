const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema({
  fullName: { type: String, required: true, minlength: 3 },
  age: { type: Number, required: true, min: 18, max: 65 },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  bloodGroup: {
    type: String,
    required: true,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },
  password: { type: String, required: true, minlength: 6 },

  contactNumber: {
    type: String,
    required: true,
    match: [/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"],
    unique: true,
  },

  email: {
    type: String,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    unique: true,
  },

  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },

  lastDonationDate: { type: Date },
  totalDonations: { type: Number, default: 0 },

  donationHistory: [
    {
      requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Receiver" },
      donatedOn: { type: Date, default: Date.now },
    },
  ],

  healthInfo: {
    weight: { type: Number, min: 40 }, // many orgs require ≥ 45kg
    chronicDiseases: {type: Boolean,default : false},
    onMedication: { type: Boolean, default: false },
  },

  createdAt: { type: Date, default: Date.now },
});

// Enable geospatial queries
donorSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Donor", donorSchema);
