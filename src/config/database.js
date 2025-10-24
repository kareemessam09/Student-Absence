const mongoose = require("mongoose");
const logger = require("./logger");

let cachedConnection = null;

const connectDB = async () => {
  // Return cached connection for serverless (Vercel)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    logger.info('Using cached database connection');
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = conn;
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error("Database connection error:", error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
