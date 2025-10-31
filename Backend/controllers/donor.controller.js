const Donor = require('../models/donor.models');
const Request = require('../models/request.model');
const { hashPassword, comparePassword, generateToken } = require('../services/auth.services');

// Register Donor
const registerDonor = async (req, res) => {
  try {
    const { email, password, fullName, contactNumber, age, gender, bloodGroup, weight, location } = req.body;

    // Check if donor exists
    const existingDonor = await Donor.findOne({ $or: [{ email }, { contactNumber }] });
    if (existingDonor) {
      return res.status(400).json({ error: 'Donor already exists with this email or phone number' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create donor
    const donor = new Donor({
      fullName,
      email,
      password: hashedPassword,
      contactNumber,
      age,
      gender,
      bloodGroup,
      weight,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address
      }
    });

    await donor.save();

    // Generate token
    const token = generateToken({ id: donor._id, role: 'donor' });

    res.status(201).json({
      message: 'Donor registered successfully',
      token,
      donor: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        bloodGroup: donor.bloodGroup
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login Donor
const loginDonor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find donor
    const donor = await Donor.findOne({ email });
    if (!donor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await comparePassword(password, donor.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ id: donor._id, role: 'donor' });

    res.json({
      message: 'Login successful',
      token,
      donor: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
        isAvailable: donor.isAvailable
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Donor Profile
const getDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findById(req.user.id).select('-password');
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    res.json(donor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Donor Profile
const updateDonorProfile = async (req, res) => {
  try {
    // Don't allow updating password or email through this endpoint
    const { password, email, ...updateData } = req.body;

    const donor = await Donor.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    res.json({ message: 'Profile updated successfully', donor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Availability
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const donor = await Donor.findByIdAndUpdate(
      req.user.id,
      { isAvailable },
      { new: true }
    ).select('-password');

    res.json({ 
      message: `Availability ${isAvailable ? 'enabled' : 'disabled'}`, 
      donor 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Location
const updateLocation = async (req, res) => {
  try {
    const { coordinates, address } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ error: 'Invalid coordinates format. Expected [longitude, latitude]' });
    }

    const donor = await Donor.findByIdAndUpdate(
      req.user.id,
      { 
        location: {
          type: 'Point',
          coordinates,
          address
        }
      },
      { new: true }
    ).select('-password');

    res.json({ message: 'Location updated successfully', donor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Donor Requests
const getDonorRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      'matchedDonors.donor': req.user.id
    })
    .populate('receiver', 'fullName email contactNumber')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept Request
const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findOne({
      _id: requestId,
      'matchedDonors.donor': req.user.id
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update the specific donor's response
    const donorMatch = request.matchedDonors.find(
      m => m.donor.toString() === req.user.id
    );

    if (!donorMatch) {
      return res.status(404).json({ error: 'You are not matched to this request' });
    }

    if (donorMatch.response !== 'pending') {
      return res.status(400).json({ error: 'Request already responded to' });
    }

    donorMatch.response = 'accepted';
    donorMatch.respondedAt = new Date();

    // Increment unitsMatched
    request.unitsMatched += 1;

    await request.save();

    // Update donor's donation history
    await Donor.findByIdAndUpdate(req.user.id, {
      $push: {
        donationHistory: {
          requestId: request._id,
          donatedOn: new Date()
        }
      },
      $inc: { totalDonations: 1 },
      lastDonationDate: new Date()
    });

    res.json({ 
      message: 'Request accepted successfully', 
      request 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject Request
const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findOne({
      _id: requestId,
      'matchedDonors.donor': req.user.id
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const donorMatch = request.matchedDonors.find(
      m => m.donor.toString() === req.user.id
    );

    if (!donorMatch) {
      return res.status(404).json({ error: 'You are not matched to this request' });
    }

    if (donorMatch.response !== 'pending') {
      return res.status(400).json({ error: 'Request already responded to' });
    }

    donorMatch.response = 'rejected';
    donorMatch.respondedAt = new Date();

    await request.save();

    res.json({ 
      message: 'Request rejected', 
      request 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Donation History
const getDonationHistory = async (req, res) => {
  try {
    const donor = await Donor.findById(req.user.id)
      .populate({
        path: 'donationHistory.requestId',
        populate: {
          path: 'receiver',
          select: 'fullName contactNumber'
        }
      });

    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    res.json({
      totalDonations: donor.totalDonations,
      lastDonationDate: donor.lastDonationDate,
      history: donor.donationHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonorProfile,
  updateAvailability,
  updateLocation,
  getDonorRequests,
  acceptRequest,
  rejectRequest,
  getDonationHistory
};