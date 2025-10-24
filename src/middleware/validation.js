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
const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("role")
    .isIn(["teacher", "manager", "receptionist"])
    .withMessage("Invalid role"),
  handleValidationErrors,
];

// User login validation
const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

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

// Student validation
const validateStudent = () => {
  return [
    body("studentCode")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Student code must be between 3 and 20 characters")
      .matches(/^[A-Z0-9]+$/)
      .withMessage(
        "Student code must contain only uppercase letters and numbers"
      ),
    body("nama")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("class").isMongoId().withMessage("Invalid class ID"),
    handleValidationErrors,
  ];
};

// Class validation
const validateClass = () => {
  return [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Class name must be between 2 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
    body("teacher").isMongoId().withMessage("Invalid teacher ID"),
    body("capacity")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Capacity must be between 1 and 100"),
    handleValidationErrors,
  ];
};

// Notification validation
const validateNotificationRequest = () => {
  return [
    body("studentId").isMongoId().withMessage("Invalid student ID"),
    body("message")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Message cannot exceed 500 characters"),
    handleValidationErrors,
  ];
};

const validateNotificationResponse = () => {
  return [
    body("approved")
      .isBoolean()
      .withMessage("Approved field must be a boolean (true or false)"),
    body("responseMessage")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Response message cannot exceed 500 characters"),
    handleValidationErrors,
  ];
};

const validateTeacherMessage = () => {
  return [
    body("receptionistId").isMongoId().withMessage("Invalid receptionist ID"),
    body("studentId").isMongoId().withMessage("Invalid student ID"),
    body("message")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Message cannot exceed 500 characters"),
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
  validateStudent,
  validateClass,
  validateNotificationRequest,
  validateNotificationResponse,
  validateTeacherMessage,
};
