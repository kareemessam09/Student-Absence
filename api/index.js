// Vercel serverless function handler
const connectDB = require('../src/config/database');

// Ensure database connection for each request
let isConnected = false;
let app = null;

module.exports = async (req, res) => {
  try {
    // Connect to database if not already connected
    if (!isConnected) {
      console.log('Connecting to database...');
      await connectDB();
      isConnected = true;
      console.log('Database connected successfully');
    }
    
    // Initialize app if not already initialized
    if (!app) {
      console.log('Initializing app...');
      app = require('../src/app');
      console.log('App initialized successfully');
    }
    
    return app(req, res);
  } catch (error) {
    console.error('Error in serverless handler:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};
