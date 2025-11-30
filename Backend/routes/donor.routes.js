const express = require("express");
const router = express.Router();
const { authMiddleware, isDonor } = require("../middleware/auth.middleware");
const {
  donorSignupValidation,
  donorLoginValidation,
  validateRequest,
} = require("../services/auth.services");
const {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonorProfile,
  updateAvailability,
  updateLocation,
  getDonorRequests,
  acceptRequest,
  rejectRequest,
  getDonationHistory,
  updateCurrentLocation,
} = require("../controllers/donor.controller");

// Public routes
router.post(
  "/register",
  donorSignupValidation,
  validateRequest,
  registerDonor
);
router.post("/login", donorLoginValidation, validateRequest, loginDonor);

// Protected routes
router.get("/profile", authMiddleware, isDonor, getDonorProfile);
router.put("/profile", authMiddleware, isDonor, updateDonorProfile);
router.put("/availability", authMiddleware, isDonor, updateAvailability);
router.put("/location", authMiddleware, isDonor, updateLocation);
router.put("/current-location", authMiddleware, isDonor, updateCurrentLocation);
router.get("/requests", authMiddleware, isDonor, getDonorRequests);
router.post(
  "/accept-request/:requestId",
  authMiddleware,
  isDonor,
  acceptRequest
);
router.post(
  "/reject-request/:requestId",
  authMiddleware,
  isDonor,
  rejectRequest
);
router.get("/donation-history", authMiddleware, isDonor, getDonationHistory);

module.exports = router;
