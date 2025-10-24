const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [];

// Only use file transports if not in serverless environment (Vercel/Lambda)
// Check for Vercel, AWS Lambda, or if running as a serverless function
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;
if (!isServerless) {
  // Ensure logs directory exists (only in non-serverless)
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  transports.push(
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
    })
  );
}

// Always log to console (works in serverless)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "express-app" },
  transports: transports,
});

module.exports = logger;
