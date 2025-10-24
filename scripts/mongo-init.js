// MongoDB initialization script
// This runs when the MongoDB container starts for the first time

db = db.getSiblingDB('studentAbsence');

// Create application user
db.createUser({
  user: 'studentapp',
  pwd: process.env.MONGODB_APP_PASSWORD || 'ChangeThisPassword123!',
  roles: [
    {
      role: 'readWrite',
      db: 'studentAbsence',
    },
  ],
});

print('✅ MongoDB initialized with studentAbsence database and user');
