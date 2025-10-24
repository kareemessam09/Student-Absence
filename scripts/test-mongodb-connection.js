#!/usr/bin/env node
/*
  Script: test-mongodb-connection.js
  Purpose: Test MongoDB connection with provided URI
*/

require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async (uri) => {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log(`📍 URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`); // Hide password
    console.log('');

    // Set mongoose options
    mongoose.set('strictQuery', false);

    // Connect to MongoDB
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });

    console.log('✅ Successfully connected to MongoDB!');
    console.log('');

    // Get connection details
    const connection = mongoose.connection;
    console.log('📊 Connection Details:');
    console.log(`   Host: ${connection.host}`);
    console.log(`   Port: ${connection.port}`);
    console.log(`   Database: ${connection.name}`);
    console.log(`   Ready State: ${connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log('');

    // Test database operations
    console.log('🧪 Testing database operations...');
    
    // List collections
    const collections = await connection.db.listCollections().toArray();
    console.log(`   Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Get database stats
    const stats = await connection.db.stats();
    console.log('📈 Database Statistics:');
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Objects: ${stats.objects}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    console.log('✅ All tests passed! Connection is working properly.');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('');
    console.error('Error details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Name: ${error.name}`);
    console.error('');

    if (error.message.includes('authentication failed')) {
      console.error('💡 Troubleshooting: Authentication failed');
      console.error('   - Check username and password');
      console.error('   - Verify database user exists');
      console.error('   - Check user permissions');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('💡 Troubleshooting: Cannot reach MongoDB server');
      console.error('   - Check internet connection');
      console.error('   - Verify MongoDB Atlas cluster is running');
      console.error('   - Check if IP address is whitelisted in MongoDB Atlas');
    } else if (error.message.includes('connection timeout')) {
      console.error('💡 Troubleshooting: Connection timeout');
      console.error('   - Check firewall settings');
      console.error('   - Verify network connectivity');
    }

    process.exit(1);
  }
};

// Get URI from command line or environment
const uri = process.argv[2] || process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ No MongoDB URI provided!');
  console.error('');
  console.error('Usage:');
  console.error('  node scripts/test-mongodb-connection.js <mongodb-uri>');
  console.error('  or set MONGODB_URI in .env file');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/test-mongodb-connection.js "mongodb+srv://user:pass@cluster.mongodb.net/dbname"');
  process.exit(1);
}

// Run test
testConnection(uri);
