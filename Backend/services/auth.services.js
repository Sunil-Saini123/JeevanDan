const { body, validationResult } = require("express-validator");

// signup validations
const donorSignupValidation = [
  body("fullName").isLength({ min: 3 }).withMessage("Full name must be at least 3 chars"),
  body("email").isEmail().withMessage("Valid email required"),
  body("contactNumber").matches(/^[6-9]\d{9}$/).withMessage("Enter valid 10-digit Indian mobile number"),
  body("bloodGroup").isIn(["A+","A-","B+","B-","AB+","AB-","O+","O-"]).withMessage("Invalid blood group"),
  body("age").isInt({ min: 18, max: 65 }).withMessage("Age must be between 18 and 65"),
  body("gender").isIn(["Male", "Female", "Other"]).withMessage("Invalid gender"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
];


// Login validations
const donorLoginValidation = [
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
  donorSignupValidation,
  donorLoginValidation,
  validateRequest
};