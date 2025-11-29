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

// Calculate match score (now accepts distance as parameter)
const calculateMatchScore = (donor, request, distance) => {
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
  if (request.urgency === 'Critical') {
    score += 5;
  }

  return Math.min(score, 100);
};

// Find matching donors
const findMatchingDonors = async (requestId) => {
  try {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Validate request location
    if (!request.location?.coordinates || request.location.coordinates.length !== 2) {
      throw new Error('Invalid request location');
    }

    // Find compatible donors
    const compatibleBloodGroups = BLOOD_COMPATIBILITY[request.bloodGroup] || [];
    
    console.log(`🔍 Searching for donors with blood groups: ${compatibleBloodGroups.join(', ')}`);

    // Find available donors with compatible blood groups
    const donors = await Donor.find({
      bloodGroup: { $in: compatibleBloodGroups },
      isAvailable:true,
      'location.coordinates': { $exists: true, $ne: null }
    });

    console.log(`📊 Found ${donors.length} potential donors`);

    // Calculate match scores and distances
    const scoredDonors = [];

    for (const donor of donors) {
      // Validate donor location
      if (!donor.location?.coordinates || donor.location.coordinates.length !== 2) {
        console.log(`⚠️ Skipping donor ${donor._id} - invalid location`);
        continue;
      }

      const distance = calculateDistance(
        donor.location.coordinates,
        request.location.coordinates
      );

      // Skip if too far (> 100km)
      if (distance > 100) {
        continue;
      }

      const matchScore = calculateMatchScore(donor, request, distance);

      // Only include if score > 30
      if (matchScore > 30) {
        scoredDonors.push({
          donor: donor._id,
          donorData: donor,
          matchScore,
          distance: Math.round(distance * 10) / 10
        });
      }
    }

    console.log(`✅ Found ${scoredDonors.length} valid matches`);

    // Sort by match score
    const validMatches = scoredDonors
      .sort((a, b) => b.matchScore - a.matchScore);

    // Take top matches
    // const topMatches = validMatches.slice(0, Math.min(10, request.unitsRequired * 3));
    // ✅ CHANGED: Parallel notification strategy
    const getNotificationCount = (urgency, unitsRequired) => {
      const buffer = urgency === 'Critical' ? 3 : urgency === 'Urgent' ? 2 : 1;
      return Math.min(unitsRequired + buffer, validMatches.length);
    };

    const notifyCount = getNotificationCount(request.urgency, request.unitsRequired);

    // Group donors by similarity (±5 score, ±2 km)
    const topMatch = validMatches[0];
    const similarDonors = validMatches.filter((m, idx) => {
      if (idx === 0) return true;
      return Math.abs(m.matchScore - topMatch.matchScore) <= 5 &&
             Math.abs(m.distance - topMatch.distance) <= 2;
    });

    const finalCount = Math.max(similarDonors.length, notifyCount);
    const topMatches = validMatches.slice(0, finalCount);

    // Add this helper function before the matchedDonors mapping (around line 175)
    const getExpiryHours = (urgency) => {
      switch (urgency) {
        case 'Critical': return 6;
        case 'Urgent': return 12;
        case 'Normal': return 24;
        default: return 24;
      }
    };

    const expiryHours = getExpiryHours(request.urgency);

    // Update request with matched donors
    request.matchedDonors = topMatches.map((match, index) => ({
      donor: match.donor,
      matchScore: match.matchScore,
      distance: match.distance,
      notifiedAt: new Date(),
      notificationExpiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
      response: 'pending',
      donationStatus: 'scheduled',
      unitsCommitted: 1,
      priority: index + 1
    }));
    // REMOVE manual status assignment; let model pre-save handle
    // if (topMatches.length === 0) request.status = 'pending'; else request.status = 'matched';
    await request.save();

    console.log(`💾 Saved ${topMatches.length} matches to request ${requestId}`);
    console.log(`💾 Notified ${topMatches.length} donors (${similarDonors.length} similar) for request ${requestId}`);

    return {
      success: true,
      matchCount: topMatches.length,
      matches: topMatches,
      request
    };

  } catch (error) {
    console.error('❌ Matching error:', error);
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