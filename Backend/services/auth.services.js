const { body, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Password hashing
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Password comparison
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: '7d'
  });
};

// Signup validations
const donorSignupValidation = [
  body("fullName").isLength({ min: 3 }).withMessage("Full name must be at least 3 chars"),
  body("email").isEmail().withMessage("Valid email required"),
  body("contactNumber").matches(/^[6-9]\d{9}$/).withMessage("Enter valid 10-digit Indian mobile number"),
  body("bloodGroup").isIn(["A+","A-","B+","B-","AB+","AB-","O+","O-"]).withMessage("Invalid blood group"),
  body("age").isInt({ min: 18, max: 65 }).withMessage("Age must be between 18 and 65"),
  body("gender").isIn(["Male", "Female", "Other"]).withMessage("Invalid gender"),
  body("weight").optional().isFloat({ min: 40 }).withMessage("Weight must be at least 40 kg"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
  body("location.coordinates").isArray({ min: 2, max: 2 }).withMessage("Coordinates must be [longitude, latitude]"),
];

// Login validations
const donorLoginValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Receiver signup validations
const receiverSignupValidation = [
  body("fullName").isLength({ min: 3 }).withMessage("Full name must be at least 3 chars"),
  body("email").isEmail().withMessage("Valid email required"),
  body("contactNumber").matches(/^[6-9]\d{9}$/).withMessage("Enter valid 10-digit Indian mobile number"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
];

// Receiver login validations
const receiverLoginValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Middleware to handle validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  donorSignupValidation,
  donorLoginValidation,
  receiverSignupValidation,
  receiverLoginValidation,
  validateRequest
};