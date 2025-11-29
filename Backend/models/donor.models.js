const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
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

    age: { type: Number, required: true, min: 18, max: 65 },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    weight: { type: Number, min: 40 }, // many orgs require ≥ 45kg

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: { type: String },
    },

    isAvailable: { type: Boolean, default: false },

    lastDonationDate: { type: Date },
    totalDonations: { type: Number, default: 0 },

    donationHistory: [
      {
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
        donatedOn: { type: Date, default: Date.now },
      },
    ],

    healthInfo: {
      chronicDiseases: { type: Boolean, default: false },
      onMedication: { type: Boolean, default: false },
      medicalNotes: { type: String },
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Enable geospatial queries
donorSchema.index({ location: "2dsphere" });

donorSchema.virtual('canDonate').get(function() {
  if (!this.lastDonationDate) return true;
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return new Date(this.lastDonationDate) <= threeMonthsAgo;
});

donorSchema.set('toJSON', { virtuals: true });
donorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Donor", donorSchema);
