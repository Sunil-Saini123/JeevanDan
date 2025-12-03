const Donor = require('../models/donor.models');
const Request = require('../models/request.model');
const socketService = require('./socket.service');

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

// Urgency-specific radius in km
const URGENCY_RADIUS = {
  Critical: 15,  // 15km for critical
  Urgent: 10,    // 10km for urgent  
  Moderate: 5    // 5km for moderate
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
    if (donor.bloodGroup === request.bloodGroup) {
      score += 5;
    }
  } else {
    return 0;
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

  // ✅ 6. UPDATED: Gender-Specific Last Donation Check
  if (donor.lastDonationDate) {
    const daysSinceLastDonation = 
      (Date.now() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24);
    
    // Men: 90 days (3 months), Women: 120 days (4 months)
    const minGapDays = donor.gender === 'Female' ? 120 : 90;
    
    if (daysSinceLastDonation < minGapDays) {
      console.log(`⏭️ Skipping ${donor.fullName}: Last donated ${Math.floor(daysSinceLastDonation)} days ago (${donor.gender} needs ${minGapDays}+ days)`);
      return 0; // Cannot donate yet
    }
    
    console.log(`✅ ${donor.fullName} (${donor.gender}): ${Math.floor(daysSinceLastDonation)} days since last donation (min: ${minGapDays})`);
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

    // ✅ ADD: Get urgency-specific radius
    const maxRadius = URGENCY_RADIUS[request.urgency] || 10;
    console.log(`🔍 Searching donors for ${request.urgency} urgency within ${maxRadius}km radius`);

    // Find compatible donors
    const compatibleBloodGroups = BLOOD_COMPATIBILITY[request.bloodGroup] || [];
    
    console.log(`🔍 Searching for donors with blood groups: ${compatibleBloodGroups.join(', ')}`);

    // Find available donors with compatible blood groups
    const donors = await Donor.find({
      bloodGroup: { $in: compatibleBloodGroups },
      isAvailable: true,
      'location.coordinates': { $exists: true, $ne: null }
    });

    console.log(`📊 Found ${donors.length} potential donors`);

    // Calculate match scores and distances
    const scoredDonors = [];

    for (const donor of donors) {
      const donorCoords = donor.currentLocation?.coordinates && 
                          donor.currentLocation.coordinates.length === 2 &&
                          donor.currentLocation.lastUpdated &&
                          (new Date() - new Date(donor.currentLocation.lastUpdated)) < 24 * 60 * 60 * 1000
        ? donor.currentLocation.coordinates
        : donor.location?.coordinates;

      if (!donorCoords || donorCoords.length !== 2) {
        console.log(`⚠️ Skipping donor ${donor._id} - invalid location`);
        continue;
      }

      const distance = calculateDistance(
        donorCoords,
        request.location.coordinates
      );

      // ✅ CHANGED: Use urgency-based radius instead of fixed 60km
      if (distance > maxRadius) {
        console.log(`⏭️ Skipping ${donor.fullName}: ${distance.toFixed(1)}km > ${maxRadius}km (${request.urgency} limit)`);
        continue;
      }

      const matchScore = calculateMatchScore(donor, request, distance);

      if (matchScore > 30) {
        scoredDonors.push({
          donor: donor._id,
          donorData: donor,
          matchScore,
          distance: Math.round(distance * 10) / 10,
          usingCurrentLocation: donorCoords === donor.currentLocation?.coordinates
        });
        console.log(`✅ Match found: ${donor.fullName} - ${distance.toFixed(1)}km, score: ${matchScore}`);
      }
    }

    console.log(`✅ Found ${scoredDonors.length} valid matches within ${maxRadius}km`);

    // ✅ ADD: Handle no matches found
    if (scoredDonors.length === 0) {
      console.log(`⚠️ No donors found within ${maxRadius}km for ${request.urgency} urgency`);
      
      // Save request with no matches
      request.matchedDonors = [];
      await request.save();
      
      // Notify receiver
      socketService.emitToUser(request.receiver, 'noDonorsFound', {
        requestId: request._id,
        urgency: request.urgency,
        searchRadius: maxRadius,
        bloodGroup: request.bloodGroup,
        message: `No compatible donors found within ${maxRadius}km. Try upgrading urgency or waiting for new donors.`
      });

      return {
        success: true,
        matchCount: 0,
        matches: [],
        request,
        reason: `No donors within ${maxRadius}km radius`
      };
    }

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
        case 'Moderate': return 24;
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

    // ✅ ADD: Emit to matched donors
    topMatches.forEach(match => {
      socketService.emitToUser(match.donor, 'newBloodRequest', {
        requestId: request._id,
        bloodGroup: request.bloodGroup,
        urgency: request.urgency,
        unitsNeeded: request.unitsRequired,
        distance: match.distance,
        matchScore: match.matchScore,
        hospital: request.location?.address?.hospital
      });
    });


    console.log(`💾 Saved ${topMatches.length} matches to request ${requestId}`);
    console.log(`📡 Notified ${topMatches.length} donors within ${maxRadius}km`);

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

const cascadeToNextDonor = async (requestId) => {
  try {
    const request = await Request.findById(requestId);
    if (!request || request.status === 'completed') return;

    const now = new Date();

    const expiredMatches = request.matchedDonors.filter(
      m => m.response === 'pending' && 
           m.notificationExpiresAt && 
           now > new Date(m.notificationExpiresAt)
    );

    if (expiredMatches.length === 0) return { success: true };

    expiredMatches.forEach(m => {
      m.response = 'expired';
      m.respondedAt = new Date();
    });

    // ✅ ADD: Progressive radius expansion
    const baseRadius = URGENCY_RADIUS[request.urgency] || 10;
    const expandedRadius = baseRadius * 1.5; // Expand by 50% on cascade
    
    console.log(`🔄 Cascading: Expanding radius from ${baseRadius}km to ${expandedRadius}km`);

    const alreadyMatchedDonorIds = request.matchedDonors.map(m => m.donor.toString());
    const compatibleBloodGroups = BLOOD_COMPATIBILITY[request.bloodGroup] || [];
    
    const donors = await Donor.find({
      _id: { $nin: alreadyMatchedDonorIds },
      bloodGroup: { $in: compatibleBloodGroups },
      isAvailable: true,
      'location.coordinates': { $exists: true, $ne: null }
    });

    const scoredDonors = [];

    for (const donor of donors) {
      const donorCoords = donor.currentLocation?.coordinates && 
                          donor.currentLocation.coordinates.length === 2 &&
                          donor.currentLocation.lastUpdated &&
                          (new Date() - new Date(donor.currentLocation.lastUpdated)) < 24 * 60 * 60 * 1000
        ? donor.currentLocation.coordinates
        : donor.location?.coordinates;

      if (!donorCoords || donorCoords.length !== 2) continue;

      const distance = calculateDistance(donorCoords, request.location.coordinates);
      
      // ✅ CHANGED: Use expanded radius
      if (distance > expandedRadius) {
        console.log(`⏭️ Skip cascade: ${donor.fullName} at ${distance.toFixed(1)}km > ${expandedRadius}km`);
        continue;
      }

      const matchScore = calculateMatchScore(donor, request, distance);
      if (matchScore > 30) {
        scoredDonors.push({
          donor: donor._id,
          matchScore,
          distance: Math.round(distance * 10) / 10
        });
        console.log(`✅ Cascade match: ${donor.fullName} - ${distance.toFixed(1)}km, score: ${matchScore}`);
      }
    }

    const validMatches = scoredDonors.sort((a, b) => b.matchScore - a.matchScore);
    const neededUnits = request.unitsRequired - (request.unitsAccepted || 0);
    const newMatches = validMatches.slice(0, Math.min(neededUnits, expiredMatches.length));

    if (newMatches.length === 0) {
      console.log(`⚠️ No cascade donors found within ${expandedRadius}km`);
      
      socketService.emitToUser(request.receiver, 'cascadeFailed', {
        requestId: request._id,
        message: `Previous donors didn't respond. No additional donors found within ${expandedRadius}km.`,
        suggestUpgrade: true
      });
      
      return { success: true, cascadedCount: 0 };
    }

    const getExpiryHours = (urgency) => {
      switch (urgency) {
        case 'Critical': return 6;
        case 'Urgent': return 12;
        case 'Moderate': return 24;
        default: return 24;
      }
    };

    const expiryHours = getExpiryHours(request.urgency);

    newMatches.forEach((match, index) => {
      request.matchedDonors.push({
        donor: match.donor,
        matchScore: match.matchScore,
        distance: match.distance,
        notifiedAt: new Date(),
        notificationExpiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
        response: 'pending',
        donationStatus: 'scheduled',
        unitsCommitted: 1,
        priority: request.matchedDonors.length + index + 1
      });
    });

    await request.save();

    newMatches.forEach(match => {
      socketService.emitToUser(match.donor, 'newBloodRequest', {
        requestId: request._id,
        bloodGroup: request.bloodGroup,
        urgency: request.urgency,
        unitsNeeded: request.unitsRequired,
        distance: match.distance,
        matchScore: match.matchScore,
        hospital: request.location?.address?.hospital,
        isCascaded: true,
        expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000)
      });
    });

    console.log(`♻️ Cascaded ${newMatches.length} donors within ${expandedRadius}km`);
    
    return { success: true, cascadedCount: newMatches.length };
  } catch (error) {
    console.error('❌ Cascade error:', error);
    throw error;
  }
};

module.exports = {
  findMatchingDonors,
  autoMatchDonors,
  cascadeToNextDonor, // ✅ ADD export
  calculateMatchScore,
  calculateDistance
};