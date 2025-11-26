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
    default: 1,
    min: 1
  },
  requiredBy: {
    type: Date,
    default: function() {
      // Default to 24 hours from creation for Moderate
      // 6 hours for Urgent, 2 hours for Critical
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
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String,
    hospital: String
  },
  status: {
    type: String,
    enum: ['pending', 'partially_matched', 'fully_matched', 'completed', 'cancelled'],
    default: 'pending'
  },
  medicalDetails: {
    condition: String,
    notes: String,
    requiredBy: Date
  },
  matchedDonors: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    matchScore: Number,
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
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
requestSchema.index({ location: '2dsphere' });

// Virtual to check if request is fulfilled
requestSchema.virtual('isFulfilled').get(function() {
  return this.unitsMatched >= this.unitsRequired;
});

// Update status based on units matched
requestSchema.pre('save', function(next) {
  if (this.unitsMatched === 0) {
    this.status = 'pending';
  } else if (this.unitsMatched < this.unitsRequired) {
    this.status = 'partially_matched';
  } else if (this.unitsMatched >= this.unitsRequired) {
    this.status = 'fully_matched';
  }
  next();
});

module.exports = mongoose.model('Request', requestSchema);