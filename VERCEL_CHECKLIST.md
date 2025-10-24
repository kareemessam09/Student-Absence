# 🚀 Vercel Deployment - Quick Checklist

## ✅ Pre-Deployment

- [x] MongoDB Atlas connection tested and working
- [x] JWT secret generated
- [x] Environment variables ready
- [x] vercel.json configured
- [x] api/index.js serverless handler created
- [x] Database connection caching implemented
- [x] Data imported (classes and students)

## 📋 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 2. Import to Vercel
- Go to https://vercel.com
- Click "Add New Project"
- Import your GitHub repository

### 3. Configure Environment Variables
Add these in Vercel Dashboard:

```
NODE_ENV=production

MONGODB_URI=mongodb+srv://kareem:kareem123@firstcluster.slijueo.mongodb.net/studentAbsence?retryWrites=true&w=majority&appName=FirstCluster

JWT_SECRET=b2ab0b6ceb7eb33fd4eb272d2ff6f6317dea8583a142e9df21c0612139d7b483b4058edbb1e3458e7bc261ab92df006ed621a99b6282e3ff066f4ba7495993b2

JWT_EXPIRE=7d

ALLOWED_ORIGINS=*

LOG_LEVEL=info
```

### 4. Deploy
- Click "Deploy"
- Wait 2-3 minutes
- ✅ Done!

## 🧪 Test Deployment

```bash
# Replace with your Vercel URL
export API_URL="https://your-project.vercel.app"

# Health check
curl $API_URL/health

# API info
curl $API_URL/api

# Login test
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@school.com","password":"password123"}'
```

## 📱 Update Flutter App

```dart
// Update API URL in your Flutter app
class ApiConfig {
  static const String baseUrl = 'https://your-project.vercel.app';
}
```

## ⚠️ Important MongoDB Atlas Settings

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Or add specific Vercel IPs if needed

## 🎯 Your URLs

After deployment:
- **API Base:** `https://your-project.vercel.app`
- **Health Check:** `https://your-project.vercel.app/health`
- **API Docs:** `https://your-project.vercel.app/api-docs`
- **Login:** `https://your-project.vercel.app/api/auth/login`

## 📝 Test Credentials

```
Manager:      manager@school.com / password123
Teacher:      teacher1@school.com / password123
Receptionist: receptionist@school.com / password123
```

## 🔄 Continuous Deployment

Every push to `main` branch automatically deploys to production!

## 📊 Files Configured

✅ vercel.json - Vercel configuration
✅ api/index.js - Serverless handler  
✅ src/app.js - Updated for serverless
✅ src/config/database.js - Connection caching
✅ .vercelignore - Exclude unnecessary files
✅ .env.production - Production environment template

## 🎉 You're Ready!

Everything is configured. Just push to GitHub and import to Vercel!

See VERCEL_DEPLOYMENT.md for detailed instructions.
