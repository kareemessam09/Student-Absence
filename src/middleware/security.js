const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const xss = require("xss-clean");

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const generalLimiter = createRateLimit(
  15 * 60 * 1000, 
  100,
  "Too many requests from this IP, please try again later."
);

// Strict rate limiter for auth routes
const authLimiter = createRateLimit(
  15 * 60 * 1000, 
  5, 
  "Too many authentication attempts from this IP, please try again later."
);

// API rate limiter
const apiLimiter = createRateLimit(
  15 * 60 * 1000, 
  50,
  "Too many API requests from this IP, please try again later."
);

const sanitizeData = mongoSanitize();

const preventParameterPollution = hpp();

const sanitizeXSS = xss();

module.exports = {
  securityHeaders,
  corsOptions,
  generalLimiter,
  authLimiter,
  apiLimiter,
  sanitizeData,
  preventParameterPollution,
  sanitizeXSS,
};
