const express = require('express');
const router = express.Router();
const { authMiddleware, isReceiver } = require('../middleware/auth.middleware');
const {
  matchDonors,
  getRequestStatus
} = require('../controllers/matching.controller');

// Protected routes (Receiver only for manual matching)
router.post('/find-donors/:requestId', authMiddleware, isReceiver, matchDonors);

// Public route for status (can be accessed by both)
router.get('/request-status/:requestId', authMiddleware, getRequestStatus);

module.exports = router;