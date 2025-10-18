const { body, param, query, validationResult } = require("express-validator");

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "fail",
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Common validation rules
const validateObjectId = (field = "id") => {
  return param(field).isMongoId().withMessage("Invalid ID format");
};

const validateEmail = (field = "email") => {
  return body(field)
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email");
};

const validatePassword = (field = "password") => {
  return body(field)
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    );
};

const validateName = (field = "name") => {
  return body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces");
};

// Pagination validation
const validatePagination = () => {
  return [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ];
};

// User registration validation
const validateUserRegistration = () => {
  return [
    validateName("name"),
    validateEmail("email"),
    validatePassword("password"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
    handleValidationErrors,
  ];
};

// User login validation
const validateUserLogin = () => {
  return [
    validateEmail("email"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ];
};

// Update user validation
const validateUserUpdate = () => {
  return [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    handleValidationErrors,
  ];
};

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validateEmail,
  validatePassword,
  validateName,
  validatePagination,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
};
