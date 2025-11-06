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
    res.json(receiver);
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
      urgency,
      unitsRequired,
      location,
      medicalDetails
    } = req.body;

    // Validate coordinates [longitude, latitude]
    if (!location?.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Invalid location coordinates. Format: [longitude, latitude]' });
    }

    const request = new Request({
      receiver: req.user.id,
      bloodGroup,
      urgency: urgency || 'normal',
      unitsRequired: unitsRequired || 1,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
        hospital: location.hospital
      },
      medicalDetails
    });

    await request.save();

    // 🆕 AUTO-MATCH DONORS
    try {
      const matchResult = await autoMatchDonors(request._id);
      
      return res.status(201).json({
        message: 'Request created successfully',
        request: matchResult.request,
        matchCount: matchResult.matchCount,
        matches: matchResult.matches
      });
    } catch (matchError) {
      // Even if matching fails, request is created
      console.error('Matching error:', matchError);
      return res.status(201).json({
        message: 'Request created successfully, but matching failed',
        request,
        matchError: matchError.message
      });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Requests by Receiver
const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ receiver: req.user.id })
      .populate('matchedDonors.donor', 'name email phone bloodGroup')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Matched Donors for a Request
const getMatchedDonors = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findOne({
      _id: requestId,
      receiver: req.user.id
    }).populate('matchedDonors.donor', 'name email phone bloodGroup location');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request.matchedDonors);
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

module.exports = {
  registerReceiver,
  loginReceiver,
  getReceiverProfile,
  updateReceiverProfile,
  createRequest,
  getMyRequests,
  getMatchedDonors,
  cancelRequest
};