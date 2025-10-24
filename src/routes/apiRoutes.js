const express = require("express");
const { verifyToken, optionalAuth } = require("../middleware/auth");
// const { apiLimiter } = require("../middleware/security"); // DISABLED

const router = express.Router();

// Apply rate limiting to API routes - DISABLED
// router.use(apiLimiter);

// @desc    Get API info
// @route   GET /api
// @access  Public
router.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the API",
    version: "1.0.0",
    documentation: "/api/docs",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      health: "/health",
    },
  });
});

// @desc    Get API documentation
// @route   GET /api/docs
// @access  Public
router.get("/docs", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API Documentation",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: {
          method: "POST",
          path: "/api/auth/register",
          description: "Register a new user",
          body: {
            name: "string (required)",
            email: "string (required)",
            password: "string (required)",
            confirmPassword: "string (required)",
          },
        },
        login: {
          method: "POST",
          path: "/api/auth/login",
          description: "Login user",
          body: {
            email: "string (required)",
            password: "string (required)",
          },
        },
        logout: {
          method: "POST",
          path: "/api/auth/logout",
          description: "Logout user",
          headers: {
            Authorization: "Bearer <token>",
          },
        },
        me: {
          method: "GET",
          path: "/api/auth/me",
          description: "Get current user",
          headers: {
            Authorization: "Bearer <token>",
          },
        },
        updatePassword: {
          method: "PUT",
          path: "/api/auth/update-password",
          description: "Update user password",
          headers: {
            Authorization: "Bearer <token>",
          },
          body: {
            currentPassword: "string (required)",
            newPassword: "string (required)",
          },
        },
        forgotPassword: {
          method: "POST",
          path: "/api/auth/forgot-password",
          description: "Request password reset",
          body: {
            email: "string (required)",
          },
        },
        resetPassword: {
          method: "PUT",
          path: "/api/auth/reset-password/:token",
          description: "Reset password with token",
          body: {
            password: "string (required)",
          },
        },
      },
      users: {
        getAllUsers: {
          method: "GET",
          path: "/api/users",
          description: "Get all users (Admin only)",
          headers: {
            Authorization: "Bearer <token>",
          },
          query: {
            page: "number (optional)",
            limit: "number (optional)",
          },
        },
        getUser: {
          method: "GET",
          path: "/api/users/:id",
          description: "Get user by ID",
          headers: {
            Authorization: "Bearer <token>",
          },
        },
        updateUser: {
          method: "PUT",
          path: "/api/users/:id",
          description: "Update user",
          headers: {
            Authorization: "Bearer <token>",
          },
          body: {
            name: "string (optional)",
            email: "string (optional)",
            avatar: "string (optional)",
          },
        },
        deleteUser: {
          method: "DELETE",
          path: "/api/users/:id",
          description: "Delete user (Admin only)",
          headers: {
            Authorization: "Bearer <token>",
          },
        },
        getMyProfile: {
          method: "GET",
          path: "/api/users/profile/me",
          description: "Get current user profile",
          headers: {
            Authorization: "Bearer <token>",
          },
        },
        updateMyProfile: {
          method: "PUT",
          path: "/api/users/profile/me",
          description: "Update current user profile",
          headers: {
            Authorization: "Bearer <token>",
          },
          body: {
            name: "string (optional)",
            email: "string (optional)",
            avatar: "string (optional)",
          },
        },
      },
    },
  });
});

// @desc    Get protected data
// @route   GET /api/protected
// @access  Private
router.get("/protected", verifyToken, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "This is protected data",
    user: req.user,
  });
});

// @desc    Get optional auth data
// @route   GET /api/optional
// @access  Optional
router.get("/optional", optionalAuth, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "This endpoint works with or without authentication",
    user: req.user || null,
  });
});

module.exports = router;
