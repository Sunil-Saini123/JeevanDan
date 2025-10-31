const mongoose = require("mongoose");

const receiverSchema = new mongoose.Schema({
  requesterName: { type: String, required: true },   // the person making the request
  relationToPatient: { type: String },               // e.g., self, father, mother, sibling, friend

  patientName: { type: String, required: true },     // actual patient’s name
  patientAge: { type: Number, min: 0 },
  patientGender: { type: String, enum: ["Male", "Female", "Other"] },

  bloodGroup: { 
    type: String, 
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], 
    required: true 
  },

  contactNumber: { type: String, required: true },

  // GeoJSON for exact location (where blood is needed)
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },

  emergencyLevel: { 
    type: String, 
    enum: ["Normal", "Urgent", "Critical"], 
    default: "Normal" 
  },

  neededBy: { type: Date, required: true }, // deadline

  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor" },

  confirmedByDonor: { type: Boolean, default: false },
  confirmedByReceiver: { type: Boolean, default: false },

  // optional supporting doc (e.g., doctor note / test report / admit slip)
//   proofDocument: {
//     fileUrl: { type: String }, 
//     verified: { type: Boolean, default: false }
//   },

  createdAt: { type: Date, default: Date.now }
});

receiverSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Receiver", receiverSchema);
