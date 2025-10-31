const express = require("express");
const router = express.Router();
const Donor = require("../models/donor.models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  donorLoginValidation,
  donorSignupValidation,
  validateRequest,
} = require("../services/auth.services");

// Signup page (optional frontend rendering)
router.get("/signup", (req, res) => {
  res.send("signup page");
});

// ✅ Signup Route
router.post("/signup", donorSignupValidation, validateRequest, async (req, res) => {
  try {
    const {
      fullName,
      email,
      contactNumber,
      bloodGroup,
      age,
      gender,
      password,
      lastDonationDate,
      healthInfo, // { weight, chronicDiseases, onMedication }
      coordinates, // expecting [lng, lat] from frontend
    } = req.body;

    // Check if donor already exists
    const existing = await Donor.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Donor already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const donor = new Donor({
      fullName,
      email,
      contactNumber,
      bloodGroup,
      age,
      gender,
      password: hashedPassword,
      lastDonationDate: lastDonationDate || null,
      healthInfo,
      location: {
        type: "Point",
        coordinates: coordinates, // must be [lng, lat]
      },
    });

    await donor.save();
    res.status(201).json({ message: "Donor registered successfully", donor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login page (optional frontend rendering)
router.get("/login", (req, res) => {
  res.send("login page");
});

// ✅ Login Route
router.post("/login", donorLoginValidation, validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    const donor = await Donor.findOne({ email });
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    const isMatch = await bcrypt.compare(password, donor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: donor._id, email: donor.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token, donor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
