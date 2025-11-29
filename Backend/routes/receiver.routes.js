const express = require('express');
const router = express.Router();
const { authMiddleware, isReceiver } = require('../middleware/auth.middleware');
const {
  receiverSignupValidation,
  receiverLoginValidation,
  validateRequest
} = require('../services/auth.services');
const {
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
} = require('../controllers/receiver.controller');

// Public routes
router.post('/register', receiverSignupValidation, validateRequest, registerReceiver);
router.post('/login', receiverLoginValidation, validateRequest, loginReceiver);

// Protected routes
router.get('/profile', authMiddleware, isReceiver, getReceiverProfile);
router.put('/profile', authMiddleware, isReceiver, updateReceiverProfile);
router.post('/create-request', authMiddleware, isReceiver, createRequest);
router.get('/requests', authMiddleware, isReceiver, getMyRequests);
router.get('/matched-donors/:requestId', authMiddleware, isReceiver, getMatchedDonors);
router.delete('/cancel-request/:requestId', authMiddleware, isReceiver, cancelRequest);
router.post('/request/:requestId/start-donation', authMiddleware, isReceiver, startDonation);
router.post('/request/:requestId/complete-donation', authMiddleware, isReceiver, completeDonation);

module.exports = router;