const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receiver',
    required: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  urgency: {
    type: String,
    enum: ['Critical', 'Urgent', 'Moderate'],
    default: 'Moderate'
  },
  unitsRequired: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 50  // ✅ Increased for realistic scenarios
  },
  requiredBy: {
    type: Date,
    default: function() {
      const hours = this.urgency === 'Critical' ? 2 : 
                    this.urgency === 'Urgent' ? 6 : 24;
      return new Date(Date.now() + hours * 60 * 60 * 1000);
    }
  },
  unitsMatched: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // ✅ FIXED: location.address should be an OBJECT
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: {  // ✅ Changed from String to Object
      hospital: { type: String, required: true },
      city: String,
      state: String,
      pincode: String
    }
  },
  
  status: {
    type: String,
    enum: ['pending', 'partially_matched', 'fully_matched', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  // ✅ FIXED: Changed from medicalDetails to patientDetails
  patientDetails: {
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    medicalCondition: String,
    additionalNotes: String
  },
  
  matchedDonors: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    distance: {  // ✅ Added distance field
      type: Number,
      min: 0
    },
    notifiedAt: Date,
    response: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    respondedAt: Date,
    donationStatus: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    }
  }],
  
  // ✅ Add expiration for auto-cleanup
  expiresAt: {
    type: Date,
    index: { expires: 0 }
  }
  
}, {
  timestamps: true
});

// Index for geospatial queries
requestSchema.index({ 'location.coordinates': '2dsphere' });

// ✅ Set expiration time based on requiredBy
requestSchema.pre('save', function(next) {
  // Auto-expire 24 hours after requiredBy date
  if (this.requiredBy) {
    this.expiresAt = new Date(this.requiredBy.getTime() + 24 * 60 * 60 * 1000);
  }
  
  // Update status based on units matched
  if (this.unitsMatched === 0) {
    this.status = 'pending';
  } else if (this.unitsMatched < this.unitsRequired) {
    this.status = 'partially_matched';
  } else if (this.unitsMatched >= this.unitsRequired) {
    this.status = 'fully_matched';
  }
  
  next();
});

// Virtual to check if request is fulfilled
requestSchema.virtual('isFulfilled').get(function() {
  return this.unitsMatched >= this.unitsRequired;
});

module.exports = mongoose.model('Request', requestSchema);