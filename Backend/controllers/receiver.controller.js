const Receiver = require('../models/receiver.models');
const Request = require('../models/request.model');
const Donor = require('../models/donor.models');
const { hashPassword, comparePassword, generateToken } = require('../services/auth.services');
const { autoMatchDonors } = require('../services/matching.service');

// Register Receiver
const registerReceiver = async (req, res) => {
  try {
    const { email, password, ...otherDetails } = req.body;

    const existingReceiver = await Receiver.findOne({ email });
    if (existingReceiver) {
      return res.status(400).json({ error: 'Receiver already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const receiver = new Receiver({
      ...otherDetails,
      email,
      password: hashedPassword
    });

    await receiver.save();

    const token = generateToken({ id: receiver._id, role: 'receiver' });

    res.status(201).json({
      message: 'Receiver registered successfully',
      token,
      receiver: {
        id: receiver._id,
        name: receiver.name,
        email: receiver.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login Receiver
const loginReceiver = async (req, res) => {
  try {
    const { email, password } = req.body;

    const receiver = await Receiver.findOne({ email });
    if (!receiver) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, receiver.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: receiver._id, role: 'receiver' });

    res.json({
      message: 'Login successful',
      token,
      receiver: {
        id: receiver._id,
        name: receiver.name,
        email: receiver.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Receiver Profile
const getReceiverProfile = async (req, res) => {
  try {
    const receiver = await Receiver.findById(req.user.id).select('-password');
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }
    // ✅ FIX: Wrap in object
    res.json({ receiver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Receiver Profile
const updateReceiverProfile = async (req, res) => {
  try {
    const { password, email, ...updateData } = req.body;

    const receiver = await Receiver.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    res.json({ message: 'Profile updated successfully', receiver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Updated createRequest function
const createRequest = async (req, res) => {
  try {
    const {
      bloodGroup,
      urgencyLevel,
      unitsNeeded,
      location,
      address,
      patientDetails,
      notes
    } = req.body;

    // Validate
    if (!bloodGroup || !location?.coordinates || !address?.hospital) {
      return res.status(400).json({ 
        error: 'Missing required fields: bloodGroup, location, and hospital' 
      });
    }

    if (location.coordinates.length !== 2) {
      return res.status(400).json({ 
        error: 'Invalid coordinates. Expected [longitude, latitude]' 
      });
    }

    // ✅ Create request matching ACTUAL schema
    const request = new Request({
      receiver: req.user.id,
      bloodGroup,
      urgency: urgencyLevel || 'Moderate', // ✅ Schema uses 'urgency'
      unitsRequired: unitsNeeded || 1, // ✅ Schema uses 'unitsRequired'
      requiredBy: req.body.requiredBy ? new Date(req.body.requiredBy) : undefined, // ✅ Let default handle it
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: { // ✅ Schema has address object
          hospital: address.hospital,
          city: address.city,
          state: address.state,
          pincode: address.pincode
        }
      },
      patientDetails: { // ✅ Schema uses 'patientDetails' NOT 'medicalDetails'
        name: patientDetails?.name,
        age: patientDetails?.age,
        gender: patientDetails?.gender,
        medicalCondition: patientDetails?.medicalCondition || notes
      }
    });

    await request.save();

    // Auto-match donors
    try {
      const { autoMatchDonors } = require('../services/matching.service');
      const matchResult = await autoMatchDonors(request._id);
      
      return res.status(201).json({
        message: 'Request created and matched successfully',
        request: {
          id: matchResult.request._id,
          bloodGroup: matchResult.request.bloodGroup,
          urgencyLevel: matchResult.request.urgency,
          unitsNeeded: matchResult.request.unitsRequired,
          status: matchResult.request.status,
          matchedDonorsCount: matchResult.matchCount,
          createdAt: matchResult.request.createdAt
        },
        matchCount: matchResult.matchCount
      });
    } catch (matchError) {
      console.error('Matching error:', matchError);
      return res.status(201).json({
        message: 'Request created, but matching failed',
        request: {
          id: request._id,
          bloodGroup: request.bloodGroup,
          urgencyLevel: request.urgency,
          unitsNeeded: request.unitsRequired,
          status: request.status,
          matchedDonorsCount: 0,
          createdAt: request.createdAt
        },
        matchError: matchError.message
      });
    }

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Replace getMyRequests (Line ~140-151):
const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ receiver: req.user.id })
      .populate('matchedDonors.donor', 'fullName email contactNumber bloodGroup')
      .sort({ createdAt: -1 });

    // ✅ Transform based on ACTUAL schema
    const transformedRequests = requests.map(request => {
      const acceptedDonors = request.matchedDonors?.filter(m => m.response === 'accepted') || [];
      
      return {
        id: request._id,
        bloodGroup: request.bloodGroup,
        urgencyLevel: request.urgency, // ✅ Map urgency to urgencyLevel
        unitsNeeded: request.unitsRequired, // ✅ Map unitsRequired to unitsNeeded
        requiredBy: request.requiredBy || request.createdAt, // ✅ CORRECT
        createdAt: request.createdAt,
        status: request.status,
        
        // Counts
        matchedDonorsCount: request.matchedDonors?.length || 0,
        acceptedDonors: acceptedDonors,
        acceptedCount: acceptedDonors.length,
        
        // ✅ patientDetails from schema
        patientDetails: request.patientDetails ? {
          name: request.patientDetails.name,
          age: request.patientDetails.age,
          gender: request.patientDetails.gender,
          medicalCondition: request.patientDetails.medicalCondition
        } : null,
        
        // ✅ location.address is an object
        address: request.location ? {
          hospital: request.location.address?.hospital,
          city: request.location.address?.city,
          state: request.location.address?.state,
          pincode: request.location.address?.pincode
        } : null
      };
    });

    res.json({ requests: transformedRequests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Replace getMatchedDonors (Line ~153-166):
const getMatchedDonors = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findOne({
      _id: requestId,
      receiver: req.user.id
    }).populate('matchedDonors.donor', 'fullName email contactNumber bloodGroup location isAvailable totalDonations');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // ✅ Transform matched donors
    const matchedDonors = request.matchedDonors.map(match => {
      const donor = match.donor;
      
      return {
        id: match._id,
        response: match.response,
        donationStatus: match.donationStatus || 'scheduled',
        matchScore: match.matchScore || 0,
        distance: match.distance || 0,
        respondedAt: match.respondedAt,
        donor: {
          id: donor._id,
          fullName: donor.fullName,
          email: donor.email,
          contactNumber: donor.contactNumber,
          bloodGroup: donor.bloodGroup,
          isAvailable: donor.isAvailable,
          totalDonations: donor.totalDonations || 0,
          // ✅ Donor location.address is a STRING
          location: donor.location ? {
            address: donor.location.address, // String, not object
            coordinates: donor.location.coordinates
          } : null
        }
      };
    });

    res.json({
      requestId: request._id,
      bloodGroup: request.bloodGroup,
      status: request.status,
      urgencyLevel: request.urgency,
      unitsNeeded: request.unitsRequired,
      createdAt: request.createdAt,
      matchedDonors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel Request
const cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findOneAndUpdate(
      { _id: requestId, receiver: req.user.id },
      { status: 'cancelled' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Request cancelled successfully', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const startDonation = async (req, res) => {
  try {
    const receiverId = req.user.id;
    const { requestId } = req.params;
    const { donorId, otp } = req.body;

    const request = await Request.findOne({
      _id: requestId,
      receiver: receiverId,
      'matchedDonors.donor': donorId
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });

    const md = request.matchedDonors.find(m => m.donor.toString() === donorId);
    if (!md) return res.status(404).json({ error: 'Donor match not found' });
    if (md.response !== 'accepted') return res.status(400).json({ error: 'Donor not accepted yet' });
    if (md.donationStatus !== 'scheduled') return res.status(400).json({ error: 'Invalid donation state' });
    if (!md.confirmationCode) return res.status(400).json({ error: 'No OTP set' });
    if (md.confirmationCode !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' });

    md.donationStatus = 'started';
    md.startedAt = new Date();

    await request.save();

    res.json({ message: 'Donation started', status: request.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const completeDonation = async (req, res) => {
  try {
    const receiverId = req.user.id;
    const { requestId } = req.params;
    const { donorId, unitsDonated = 1 } = req.body;

    const request = await Request.findOne({
      _id: requestId,
      receiver: receiverId,
      'matchedDonors.donor': donorId
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });

    const md = request.matchedDonors.find(m => m.donor.toString() === donorId);
    if (!md) return res.status(404).json({ error: 'Donor match not found' });
    if (md.donationStatus !== 'started') return res.status(400).json({ error: 'Donation not started' });

    md.donationStatus = 'completed';
    md.completedAt = new Date();

    // Increment confirmed units
    request.unitsMatched = (request.unitsMatched || 0) + Math.max(1, Number(unitsDonated));

    await request.save();

    // Update donor stats (make unavailable)
    await Donor.findByIdAndUpdate(donorId, {
      $inc: { totalDonations: 1 },
      $set: { lastDonationDate: new Date(), isAvailable: false }
    });

    res.json({ message: 'Donation completed', status: request.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerReceiver,
  loginReceiver,
  getReceiverProfile,
  updateReceiverProfile,
  createRequest,
  getMyRequests,
  getMatchedDonors,
  cancelRequest,
  startDonation,
  completeDonation
};