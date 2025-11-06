const { findMatchingDonors } = require('../services/matching.service');
const Request = require('../models/request.model');

// Trigger manual matching
const matchDonors = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Verify request belongs to logged-in receiver
    const request = await Request.findOne({
      _id: requestId,
      receiver: req.user.id
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status === 'cancelled' || request.status === 'completed') {
      return res.status(400).json({ error: 'Cannot match for this request' });
    }

    const result = await findMatchingDonors(requestId);

    res.json({
      message: `Found ${result.matchCount} matching donors`,
      ...result
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get request status with match details
const getRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findById(requestId)
      .populate('receiver', 'fullName email contactNumber')
      .populate('matchedDonors.donor', 'fullName email contactNumber bloodGroup location isAvailable');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Calculate match statistics
    const stats = {
      totalMatches: request.matchedDonors.length,
      pending: request.matchedDonors.filter(m => m.response === 'pending').length,
      accepted: request.matchedDonors.filter(m => m.response === 'accepted').length,
      rejected: request.matchedDonors.filter(m => m.response === 'rejected').length,
      unitsRequired: request.unitsRequired,
      unitsMatched: request.unitsMatched,
      fulfillmentPercentage: (request.unitsMatched / request.unitsRequired * 100).toFixed(2)
    };

    res.json({
      request,
      stats
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  matchDonors,
  getRequestStatus
};