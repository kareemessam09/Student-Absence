const express = require("express");
const compression = require("compression");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

require("dotenv").config();
const connectDB = require("./config/database");
const logger = require("./config/logger");
const { initSocket } = require("./config/socket");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const { errorHandler } = require("./middleware/errorHandler");
const {
  securityHeaders,
  corsOptions,
  // generalLimiter, // DISABLED
  sanitizeData,
  preventParameterPollution,
  sanitizeXSS,
} = require("./middleware/security");
const {
  requestLogger,
  requestId,
  responseTime,
} = require("./middleware/requestLogger");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const classRoutes = require("./routes/classRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const statisticsRoutes = require("./routes/statisticsRoutes");
const apiRoutes = require("./routes/apiRoutes");
const { scheduleNotificationCleanup } = require("./services/schedulerService");

const app = express();

app.set("trust proxy", 1);

// Only create logs directory if not in serverless environment
// Vercel sets VERCEL=1, Lambda sets AWS_LAMBDA_FUNCTION_NAME and LAMBDA_TASK_ROOT
try {
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  
  if (!isServerless) {
    const logsDir = path.join(__dirname, "..", "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }
} catch (error) {
  // Silently fail in serverless - logging will use console only
  console.log('Skipping logs directory creation (serverless environment)');
}

app.use(requestId);
app.use(responseTime);
app.use(requestLogger);
app.use(compression());
app.use(securityHeaders);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitizeData);
app.use(sanitizeXSS);
app.use(preventParameterPollution);

app.use(cors(corsOptions));

// Rate limiting - DISABLED
// app.use("/api", generalLimiter);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api", apiRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  });
}

app.all("*", (req, res, next) => {
  const error = new Error(`Can't find ${req.originalUrl} on this server!`);
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    // Initialize scheduled tasks (only if not in serverless environment)
    if (!process.env.VERCEL) {
      scheduleNotificationCleanup();
    }

    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
      logger.info(`Swagger UI available at /api-docs`);
    });

    // Initialize websocket server
    initSocket(server);

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received. Shutting down gracefully...");
      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start server only if not in Vercel serverless environment
if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;
