# Vercel Deployment Guide - Student Absence API

## ✅ Prerequisites

- [Vercel Account](https://vercel.com/signup) (Free tier works great)
- [Vercel CLI](https://vercel.com/cli) installed globally (optional but recommended)
- MongoDB Atlas connection string ready
- GitHub/GitLab/Bitbucket repository (or deploy directly)

## 🚀 Quick Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the repository: `Student-Absence`

3. **Configure Environment Variables**
   
   In the Vercel project settings, add these environment variables:

   ```env
   NODE_ENV=production
   
   MONGODB_URI=mongodb+srv://kareem:kareem123@firstcluster.slijueo.mongodb.net/studentAbsence?retryWrites=true&w=majority&appName=FirstCluster
   
   JWT_SECRET=b2ab0b6ceb7eb33fd4eb272d2ff6f6317dea8583a142e9df21c0612139d7b483b4058edbb1e3458e7bc261ab92df006ed621a99b6282e3ff066f4ba7495993b2
   
   JWT_EXPIRE=7d
   
   ALLOWED_ORIGINS=https://yourdomain.com,https://your-frontend.vercel.app
   
   LOG_LEVEL=info
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (2-3 minutes)
   - Your API will be live at: `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # First deployment
   vercel
   
   # Follow prompts:
   # - Set up and deploy? Yes
   # - Which scope? (your account)
   # - Link to existing project? No
   # - Project name? student-absence-api
   # - Directory? ./
   # - Override settings? No
   ```

4. **Add Environment Variables**
   ```bash
   # Add each environment variable
   vercel env add MONGODB_URI production
   # Paste your MongoDB URI when prompted
   
   vercel env add JWT_SECRET production
   # Paste your JWT secret when prompted
   
   vercel env add ALLOWED_ORIGINS production
   # Paste your frontend URLs when prompted
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## 🔧 Configuration Files

### vercel.json
Already configured in your project:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ]
}
```

### api/index.js
Serverless handler configured to:
- Cache database connections
- Handle requests efficiently
- Work with Vercel's serverless architecture

## 🌐 Testing Your Deployment

After deployment, test your API:

```bash
# Get your Vercel URL (example: https://student-absence-api.vercel.app)

# Test health endpoint
curl https://your-project.vercel.app/health

# Test API info
curl https://your-project.vercel.app/api

# Test login
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@school.com","password":"password123"}'
```

## 📝 Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `MONGODB_URI` | Your MongoDB Atlas URI | Database connection |
| `JWT_SECRET` | Your secure JWT secret | Authentication |
| `JWT_EXPIRE` | `7d` | Token expiration |
| `ALLOWED_ORIGINS` | Your frontend URLs | CORS settings |
| `LOG_LEVEL` | `info` | Logging level |

## 🔄 Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: For every pull request or branch push

## 🎯 Important Notes for Vercel

### 1. Scheduled Tasks (Cron Jobs)
⚠️ **The notification cleanup scheduler won't work on Vercel serverless**

For scheduled tasks, use [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs):

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/notifications/cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Or use external cron service like:
- [EasyCron](https://www.easycron.com/)
- [Cron-job.org](https://cron-job.org/)
- GitHub Actions

### 2. WebSocket Limitations
Socket.IO may have limitations on Vercel. Consider:
- Using Vercel's built-in WebSocket support
- Or deploying WebSocket server separately (Heroku, Railway, etc.)

### 3. Cold Starts
First request after inactivity may be slower (1-2 seconds). 
This is normal for serverless.

### 4. MongoDB Atlas IP Whitelist
- Add `0.0.0.0/0` to MongoDB Atlas IP Whitelist
- Or use "Allow Access from Anywhere" (for Vercel)

## 🔒 Security Checklist

Before going live:

- [ ] MongoDB Atlas IP whitelist configured
- [ ] JWT_SECRET is secure and unique
- [ ] ALLOWED_ORIGINS set to your actual frontend URLs
- [ ] Environment variables added in Vercel
- [ ] Test all endpoints
- [ ] API documentation accessible
- [ ] Rate limiting configured
- [ ] MongoDB authentication enabled

## 📊 Monitoring

### View Logs
```bash
# Using Vercel CLI
vercel logs

# Or view in dashboard:
# https://vercel.com/your-username/your-project/logs
```

### Performance Monitoring
- Check deployment analytics in Vercel Dashboard
- Monitor MongoDB Atlas metrics
- Set up error tracking (Sentry, LogRocket, etc.)

## 🔗 Custom Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain: `api.yourdomain.com`
3. Configure DNS as instructed by Vercel
4. SSL certificate automatically provisioned

## 🚨 Troubleshooting

### Issue: Database connection timeout
```bash
# Solution: Add 0.0.0.0/0 to MongoDB Atlas IP whitelist
```

### Issue: CORS errors
```bash
# Solution: Update ALLOWED_ORIGINS in Vercel environment variables
```

### Issue: 404 on API routes
```bash
# Solution: Check vercel.json routes configuration
# Ensure api/index.js exists and is properly configured
```

### Issue: Function timeout
```bash
# Solution: Vercel has 10s timeout on Hobby plan
# Upgrade to Pro for 60s timeout if needed
```

### Issue: Environment variables not working
```bash
# Solution: 
# 1. Redeploy after adding env variables
# 2. Check variable names match exactly
# 3. Use vercel env pull to test locally
```

## 📱 Mobile App Integration

Update your Flutter app with Vercel URL:

```dart
// In your Flutter app config
class ApiConfig {
  static const String baseUrl = 'https://your-project.vercel.app';
  static const String apiUrl = '$baseUrl/api';
}
```

## 🔄 Deployment Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs

# Pull environment variables for local testing
vercel env pull

# Remove project
vercel remove
```

## 📈 Performance Tips

1. **Database Connection Caching**
   - Already implemented in `src/config/database.js`
   - Reuses connections between function invocations

2. **Response Caching**
   - Use Vercel Edge Caching for static responses
   - Add cache headers where appropriate

3. **Bundle Size**
   - Keep dependencies minimal
   - Vercel automatically optimizes

## 🎉 Post-Deployment

1. **Update Frontend**
   - Update API URL in your Flutter app
   - Test all endpoints from mobile app

2. **Test Features**
   - Login/Registration
   - Class management
   - Student management  
   - Notifications
   - Statistics/Reports

3. **Monitor**
   - Check Vercel analytics
   - Monitor MongoDB Atlas metrics
   - Set up error alerts

4. **Documentation**
   - Update API documentation URL
   - Share Vercel URL with team

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://cloud.mongodb.com/)
- Your API: `https://your-project.vercel.app`
- API Docs: `https://your-project.vercel.app/api-docs`

---

## ✅ You're Ready to Deploy!

Your application is configured for Vercel. Just:
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

Your API will be live in minutes! 🚀
