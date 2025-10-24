// Vercel serverless function handler
const app = require('../src/app');
const connectDB = require('../src/config/database');

// Ensure database connection for each request
let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  
  return app(req, res);
};
