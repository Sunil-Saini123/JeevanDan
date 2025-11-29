const Donor = require('../models/donor.models');
const Request = require('../models/request.model');
const { hashPassword, comparePassword, generateToken } = require('../services/auth.services');
const { cascadeToNextDonor } = require('../services/matching.service');

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
    if (!donor) return res.status(404).json({ error: 'Donor not found' });

    const canDonate = donor.canDonate;
    let nextAvailableDate = null;
    
    if (donor.lastDonationDate && !canDonate) {
      nextAvailableDate = new Date(donor.lastDonationDate);
      nextAvailableDate.setMonth(nextAvailableDate.getMonth() + 3);
    }

    res.json({
      donor: donor.toObject(),
      canDonate,
      nextAvailableDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Donor Profile
const updateDonorProfile = async (req, res) => {
  try {
    // Don't allow updating password or email through this endpoint
    const { password, email, ...updateData } = req.body;

    const donor = await Donor.findById(req.user.id);
    if (!donor) return res.status(404).json({ error: 'Donor not found' });

    // ✅ CHECK: If trying to enable availability, validate 3-month rule
    if (req.body.isAvailable === true || req.body.isAvailable === 'true') {
      if (donor.lastDonationDate) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        if (new Date(donor.lastDonationDate) > threeMonthsAgo) {
          return res.status(400).json({ 
            error: 'You must wait 3 months after last donation before becoming available again.',
            lastDonationDate: donor.lastDonationDate,
            canDonateAfter: new Date(new Date(donor.lastDonationDate).setMonth(new Date(donor.lastDonationDate).getMonth() + 3))
          });
        }
      }
    }

    const updatedDonor = await Donor.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', donor: updatedDonor });
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
    const donor = await Donor.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    const requests = await Request.find({
      'matchedDonors.donor': req.user.id,
      status: { $nin: ['completed', 'cancelled', 'expired'] }
    })
      .populate('receiver', 'fullName email contactNumber')
      .sort({ createdAt: -1 });

    const transformedRequests = requests.map(request => {
      const donorMatch = request.matchedDonors.find(
        m => m.donor.toString() === req.user.id
      );

      return {
        id: request._id,
        bloodGroup: request.bloodGroup,
        unitsNeeded: request.unitsRequired,
        urgencyLevel: request.urgency,
        requiredBy: request.requiredBy || request.createdAt,
        createdAt: request.createdAt,
        status: request.status,
        patientDetails: request.patientDetails ? {
          name: request.patientDetails.name,
          age: request.patientDetails.age,
          gender: request.patientDetails.gender,
          medicalCondition: request.patientDetails.medicalCondition
        } : null,
        address: request.location ? {
          hospital: request.location.address?.hospital,
          city: request.location.address?.city,
          state: request.location.address?.state,
          pincode: request.location.address?.pincode
        } : null,
        response: donorMatch?.response || 'pending',
        respondedAt: donorMatch?.respondedAt,
        matchScore: donorMatch?.matchScore,
        distance: donorMatch?.distance,
        donationStatus: donorMatch?.donationStatus || 'scheduled',           // ✅ added
        confirmationCode: donorMatch?.confirmationCode || null,             // ✅ added
        acceptedAt: donorMatch?.acceptedAt || null,                         // ✅ optional
        startedAt: donorMatch?.startedAt || null,                           // ✅ optional
        completedAt: donorMatch?.completedAt || null,                       // ✅ optional
        receiver: donorMatch?.response === 'accepted' ? {
          fullName: request.receiver?.fullName,
          email: request.receiver?.email,
          contactNumber: request.receiver?.contactNumber
        } : null,
        priority: donorMatch?.priority,
      };
    });

    res.json({ requests: transformedRequests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate OTP
const genOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Accept Request
const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findOne({
      _id: requestId,
      'matchedDonors.donor': req.user.id
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });

    const donorMatch = request.matchedDonors.find(m => m.donor.toString() === req.user.id);
    if (!donorMatch) return res.status(404).json({ error: 'You are not matched to this request' });
    if (donorMatch.response !== 'pending') return res.status(400).json({ error: 'Already responded' });

    // Check if already full
    const currentAccepted = request.matchedDonors.filter(m => m.response === 'accepted').length;
    if (currentAccepted >= request.unitsRequired) {
      donorMatch.response = 'superseded';
      donorMatch.respondedAt = new Date();
      await request.save();
      return res.status(409).json({ 
        error: 'This request has already been accepted by enough donors.',
        status: request.status
      });
    }

    donorMatch.response = 'accepted';
    donorMatch.respondedAt = new Date();
    donorMatch.acceptedAt = new Date();
    donorMatch.confirmationCode = genOTP();
    if (!donorMatch.donationStatus) donorMatch.donationStatus = 'scheduled';

    request.unitsAccepted = (request.unitsAccepted || 0) + (donorMatch.unitsCommitted || 1);

    // Mark remaining pending as superseded if limit reached
    if (request.unitsAccepted >= request.unitsRequired) {
      request.matchedDonors.forEach(m => {
        if (m.response === 'pending') {
          m.response = 'superseded';
          m.respondedAt = new Date();
        }
      });
    }

    await request.save();

    res.json({
      message: 'Request accepted. Share OTP with receiver.',
      otp: donorMatch.confirmationCode,
      donationStatus: donorMatch.donationStatus,
      status: request.status
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

    if (!request) return res.status(404).json({ error: 'Request not found' });

    const donorMatch = request.matchedDonors.find(m => m.donor.toString() === req.user.id);
    if (!donorMatch) return res.status(404).json({ error: 'You are not matched to this request' });
    if (donorMatch.response !== 'pending') return res.status(400).json({ error: 'Already responded' });

    donorMatch.response = 'rejected';
    donorMatch.respondedAt = new Date();
    donorMatch.confirmationCode = undefined;

    await request.save();
    await cascadeToNextDonor(requestId);

    res.json({ message: 'Request rejected', status: request.status });
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
          select: 'fullName contactNumber email'
        }
      });

    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // ✅ Transform based on ACTUAL donationHistory schema
    const donations = donor.donationHistory
      .map(donation => {
        const request = donation.requestId;
        
        if (!request) return null;
        
        return {
          id: donation._id,
          date: donation.donatedOn,
          bloodGroup: request.bloodGroup || donor.bloodGroup,
          unitsNeeded: request.unitsRequired || 1,
          receiver: request.receiver?.fullName || 'Unknown',
          receiverContact: request.receiver?.contactNumber,
          // ✅ location.address is an object in Request model
          location: request.location ? {
            hospital: request.location.address?.hospital,
            city: request.location.address?.city,
            state: request.location.address?.state,
            pincode: request.location.address?.pincode
          } : null,
          urgencyLevel: request.urgency,
          status: 'completed'
        };
      })
      .filter(d => d !== null);

    res.json({
      totalDonations: donor.totalDonations,
      lastDonationDate: donor.lastDonationDate,
      donations
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