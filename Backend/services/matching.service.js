const Donor = require('../models/donor.models');
const Request = require('../models/request.model');

// Blood compatibility matrix
const BLOOD_COMPATIBILITY = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal receiver
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'] // Universal donor
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in km
  const lat1 = coord1[1] * Math.PI / 180;
  const lat2 = coord2[1] * Math.PI / 180;
  const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Calculate match score
const calculateMatchScore = (donor, request) => {
  let score = 0;

  // 1. Blood Compatibility (40%)
  const compatibleBloodGroups = BLOOD_COMPATIBILITY[request.bloodGroup] || [];
  if (compatibleBloodGroups.includes(donor.bloodGroup)) {
    score += 40;
    // Exact match bonus
    if (donor.bloodGroup === request.bloodGroup) {
      score += 5;
    }
  } else {
    return 0; // Incompatible blood group = no match
  }

  // 2. Distance Score (30%)
  const distance = calculateDistance(
    donor.location.coordinates,
    request.location.coordinates
  );
  
  if (distance <= 5) score += 30;
  else if (distance <= 10) score += 25;
  else if (distance <= 20) score += 20;
  else if (distance <= 50) score += 10;
  else score += 0;

  // 3. Availability Score (15%)
  if (donor.isAvailable) {
    score += 15;
  }

  // 4. Health Score (10%)
  if (!donor.healthInfo?.chronicDiseases && !donor.healthInfo?.onMedication) {
    score += 10;
  } else if (!donor.healthInfo?.chronicDiseases || !donor.healthInfo?.onMedication) {
    score += 5;
  }

  // 5. Reliability Score (5%)
  // Based on donation history
  if (donor.totalDonations >= 5) score += 5;
  else if (donor.totalDonations >= 3) score += 3;
  else if (donor.totalDonations >= 1) score += 2;

  // 6. Last Donation Date Check
  if (donor.lastDonationDate) {
    const monthsSinceLastDonation = 
      (Date.now() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsSinceLastDonation < 3) {
      return 0; // Cannot donate if less than 3 months
    }
  }

  // 7. Urgency Bonus
  if (request.urgency === 'critical') {
    score += 5;
  }

  return Math.min(score, 100); // Cap at 100
};

// Find matching donors
const findMatchingDonors = async (requestId) => {
  try {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Find compatible donors
    const compatibleBloodGroups = BLOOD_COMPATIBILITY[request.bloodGroup] || [];
    
    const donors = await Donor.find({
      bloodGroup: { $in: compatibleBloodGroups },
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: request.location.coordinates
          },
          $maxDistance: 50000 // 50km radius
        }
      }
    });

    // Calculate match scores
    const scoredDonors = donors.map(donor => ({
      donor: donor._id,
      donorData: donor,
      matchScore: calculateMatchScore(donor, request),
      distance: calculateDistance(
        donor.location.coordinates,
        request.location.coordinates
      )
    }));

    // Filter out zero scores and sort
    const validMatches = scoredDonors
      .filter(match => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    // Take top matches based on units required
    const topMatches = validMatches.slice(0, request.unitsRequired * 3); // 3x buffer

    // Update request with matched donors
    request.matchedDonors = topMatches.map(match => ({
      donor: match.donor,
      matchScore: match.matchScore,
      notifiedAt: new Date(),
      response: 'pending'
    }));

    await request.save();

    return {
      success: true,
      matchCount: topMatches.length,
      matches: topMatches,
      request
    };

  } catch (error) {
    throw error;
  }
};

// Auto-match when request is created
const autoMatchDonors = async (requestId) => {
  return await findMatchingDonors(requestId);
};

module.exports = {
  findMatchingDonors,
  autoMatchDonors,
  calculateMatchScore,
  calculateDistance
};