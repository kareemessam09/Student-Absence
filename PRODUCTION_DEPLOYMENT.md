# Production Deployment Guide - Student Absence API

## Table of Contents
1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [Server Setup](#server-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Process Management](#process-management)
7. [Nginx Configuration](#nginx-configuration)
8. [SSL/TLS Setup](#ssltls-setup)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Backup Strategy](#backup-strategy)

---

## Pre-deployment Checklist

### Security
- [ ] Generate secure JWT_SECRET
- [ ] Update all default passwords
- [ ] Configure CORS allowed origins
- [ ] Review and enable rate limiting
- [ ] Set up firewall rules
- [ ] Enable MongoDB authentication
- [ ] Configure SSL certificates
- [ ] Review API endpoints security

### Configuration
- [ ] Set NODE_ENV=production
- [ ] Configure production database
- [ ] Update ALLOWED_ORIGINS
- [ ] Set proper LOG_LEVEL
- [ ] Configure PM2 ecosystem
- [ ] Set up backup schedule
- [ ] Configure monitoring tools

### Testing
- [ ] Run all tests locally
- [ ] Test database connections
- [ ] Verify all API endpoints
- [ ] Test authentication flow
- [ ] Verify file uploads work
- [ ] Check WebSocket connections

---

## Server Setup

### 1. Server Requirements
```bash
# Minimum Requirements
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- OS: Ubuntu 20.04 LTS or later
- Node.js: v16.0.0 or later
- MongoDB: v5.0 or later
```

### 2. Initial Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 3. Create Application User
```bash
# Create non-root user for application
sudo adduser student-absence-api
sudo usermod -aG sudo student-absence-api

# Switch to new user
sudo su - student-absence-api
```

---

## Environment Configuration

### 1. Generate Secure JWT Secret
```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Configure .env.production
```bash
# Copy and edit production environment file
cp .env.example .env.production

# Edit with secure values
nano .env.production
```

**Required Changes:**
```env
NODE_ENV=production
PORT=3000

# Production Database (MongoDB Atlas or local)
MONGODB_URI=mongodb://username:password@localhost:27017/studentAbsence?authSource=admin

# Secure JWT Secret (use generated value)
JWT_SECRET=your-generated-secure-secret-here
JWT_EXPIRE=7d

# Production Frontend URLs
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Production Logging
LOG_LEVEL=warn
```

---

## Database Setup

### 1. Secure MongoDB Installation
```bash
# Enable authentication
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "SecurePassword123!",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase"]
})

# Create application-specific user
use studentAbsence
db.createUser({
  user: "studentapp",
  pwd: "AppSecurePassword456!",
  roles: [{ role: "readWrite", db: "studentAbsence" }]
})

# Exit
exit
```

### 2. Enable MongoDB Authentication
```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Add security section
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

### 3. Update Connection String
```env
MONGODB_URI=mongodb://studentapp:AppSecurePassword456!@localhost:27017/studentAbsence?authSource=studentAbsence
```

### 4. Import Production Data
```bash
# Import classes
node scripts/import_classes.js

# Import students
node scripts/import_students.js /path/to/students.xlsx

# Sync students to classes
node scripts/sync_class_students.js

# Seed initial admin user (if needed)
node src/seed.js
```

---

## Application Deployment

### 1. Clone Repository
```bash
cd /home/student-absence-api
git clone https://github.com/yourusername/Student-Absence.git
cd Student-Absence
```

### 2. Install Dependencies
```bash
# Install production dependencies only
npm ci --production

# Or install all (if you need dev tools)
npm install
```

### 3. Set Environment
```bash
# Copy production environment file
cp .env.production .env

# Ensure correct permissions
chmod 600 .env
```

### 4. Test Application
```bash
# Test startup
NODE_ENV=production node src/app.js

# Verify connection
curl http://localhost:3000/health
```

---

## Process Management

### 1. PM2 Setup
```bash
# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u student-absence-api --hp /home/student-absence-api
```

### 2. PM2 Commands
```bash
# View all processes
pm2 list

# View logs
pm2 logs student-absence-api

# Monitor
pm2 monit

# Restart
pm2 restart student-absence-api

# Stop
pm2 stop student-absence-api

# Delete
pm2 delete student-absence-api

# View detailed info
pm2 info student-absence-api
```

### 3. Zero-Downtime Deployment
```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm ci --production

# Reload with zero downtime
pm2 reload student-absence-api
```

---

## Nginx Configuration

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/student-absence-api
```

**Configuration:**
```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# Upstream Node.js application
upstream student_absence_api {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration (will be configured by certbot)
    # ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Client body size (for file uploads)
    client_max_body_size 10M;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Logging
    access_log /var/log/nginx/student-absence-api-access.log;
    error_log /var/log/nginx/student-absence-api-error.log;
    
    # API endpoints
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://student_absence_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Auth endpoints (stricter rate limiting)
    location /api/auth {
        limit_req zone=auth_limit burst=5 nodelay;
        
        proxy_pass http://student_absence_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket support
    location /socket.io {
        proxy_pass http://student_absence_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://student_absence_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
    
    # API documentation
    location /api-docs {
        proxy_pass http://student_absence_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 2. Enable Configuration
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/student-absence-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL/TLS Setup

### 1. Obtain SSL Certificate (Let's Encrypt)
```bash
# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts to configure
```

### 2. Auto-renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot auto-renews via cron/systemd timer
sudo systemctl status certbot.timer
```

---

## Monitoring & Maintenance

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Web-based monitoring (PM2 Plus)
pm2 link <secret> <public>

# View PM2 logs
pm2 logs --lines 100
```

### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop

# Check system resources
htop

# Check disk usage
df -h

# Check MongoDB status
sudo systemctl status mongod

# Check Nginx status
sudo systemctl status nginx
```

### 3. Log Management
```bash
# View application logs
tail -f logs/combined.log
tail -f logs/error.log

# View PM2 logs
pm2 logs

# View Nginx logs
sudo tail -f /var/log/nginx/student-absence-api-access.log
sudo tail -f /var/log/nginx/student-absence-api-error.log

# Rotate logs (configure logrotate)
sudo nano /etc/logrotate.d/student-absence-api
```

**Logrotate Configuration:**
```
/home/student-absence-api/Student-Absence/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 student-absence-api student-absence-api
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 4. Health Checks
```bash
# Create health check script
nano ~/health-check.sh
```

```bash
#!/bin/bash
ENDPOINT="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ API is healthy"
    exit 0
else
    echo "❌ API is down (Status: $RESPONSE)"
    # Restart application
    pm2 restart student-absence-api
    exit 1
fi
```

```bash
# Make executable
chmod +x ~/health-check.sh

# Add to crontab (check every 5 minutes)
crontab -e
*/5 * * * * /home/student-absence-api/health-check.sh >> /home/student-absence-api/health-check.log 2>&1
```

---

## Backup Strategy

### 1. MongoDB Backup
```bash
# Create backup script
nano ~/backup-mongodb.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/student-absence-api/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="studentAbsence"
DB_USER="studentapp"
DB_PASS="AppSecurePassword456!"

mkdir -p $BACKUP_DIR

# Backup database
mongodump --db=$DB_NAME --username=$DB_USER --password=$DB_PASS --authenticationDatabase=$DB_NAME --out=$BACKUP_DIR/mongodb_backup_$DATE

# Compress backup
tar -czf $BACKUP_DIR/mongodb_backup_$DATE.tar.gz $BACKUP_DIR/mongodb_backup_$DATE
rm -rf $BACKUP_DIR/mongodb_backup_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_backup_*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: mongodb_backup_$DATE.tar.gz"
```

```bash
# Make executable
chmod +x ~/backup-mongodb.sh

# Schedule daily backup at 2 AM
crontab -e
0 2 * * * /home/student-absence-api/backup-mongodb.sh >> /home/student-absence-api/backup.log 2>&1
```

### 2. Application Backup
```bash
# Backup application files
tar -czf student-absence-app-$(date +%Y%m%d).tar.gz Student-Absence/
```

### 3. Restore from Backup
```bash
# Extract backup
tar -xzf mongodb_backup_20250125_020000.tar.gz

# Restore database
mongorestore --db=studentAbsence --username=studentapp --password=AppSecurePassword456! --authenticationDatabase=studentAbsence mongodb_backup_20250125_020000/studentAbsence
```

---

## Performance Optimization

### 1. MongoDB Indexes
```javascript
// Ensure indexes are created
// Run in mongosh
use studentAbsence

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.students.createIndex({ studentCode: 1 }, { unique: true })
db.students.createIndex({ class: 1 })
db.classes.createIndex({ name: 1 })
db.classes.createIndex({ teacher: 1 })
db.notifications.createIndex({ requestDate: 1, status: 1 })
db.notifications.createIndex({ to: 1, isRead: 1 })
```

### 2. Node.js Optimization
```bash
# Already configured in PM2 ecosystem.config.js
# - Cluster mode for multi-core usage
# - Automatic restarts
# - Memory limits
# - Log rotation
```

### 3. Nginx Caching
```nginx
# Add to nginx config (optional for static content)
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api-docs {
    proxy_cache api_cache;
    proxy_cache_valid 200 1h;
    # ... rest of proxy settings
}
```

---

## Security Hardening

### 1. Firewall Configuration
```bash
# Install UFW
sudo apt install ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Fail2Ban (Brute Force Protection)
```bash
# Install fail2ban
sudo apt install fail2ban

# Configure
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/*error.log
maxretry = 5
findtime = 600
bantime = 3600
```

### 3. MongoDB Security
```bash
# Bind to localhost only (if app is on same server)
# Edit /etc/mongod.conf
net:
  bindIp: 127.0.0.1
  port: 27017
```

---

## Troubleshooting

### Common Issues

**Issue: Application won't start**
```bash
# Check logs
pm2 logs student-absence-api --lines 50

# Check if port is in use
sudo lsof -i :3000

# Check MongoDB connection
mongosh --host localhost --port 27017
```

**Issue: High memory usage**
```bash
# Check PM2 status
pm2 list

# Restart if needed
pm2 restart student-absence-api

# Check configured memory limit in ecosystem.config.js
```

**Issue: Database connection timeout**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check authentication
mongosh "mongodb://studentapp:password@localhost:27017/studentAbsence"

# Review connection string in .env
```

**Issue: SSL certificate errors**
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Check certificate expiry
sudo certbot certificates
```

---

## Deployment Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Security review completed
- [ ] Database backup working
- [ ] SSL certificate installed
- [ ] Monitoring configured
- [ ] Error alerts set up
- [ ] Load testing completed
- [ ] Documentation updated

### Launch
- [ ] Deploy to production
- [ ] Verify all endpoints
- [ ] Test authentication
- [ ] Test WebSocket connections
- [ ] Monitor logs for errors
- [ ] Check performance metrics

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Check error rates
- [ ] Review access logs
- [ ] Verify backups running
- [ ] Document any issues
- [ ] Update team on status

---

## Support & Maintenance

### Regular Maintenance Tasks
- Daily: Check logs, monitor performance
- Weekly: Review security logs, check disk space
- Monthly: Update dependencies, security patches
- Quarterly: Review and optimize database

### Emergency Contacts
- DevOps: [Contact Info]
- Database Admin: [Contact Info]
- Security Team: [Contact Info]

### Update Procedure
1. Test updates in staging environment
2. Backup database
3. Deploy during maintenance window
4. Use PM2 reload for zero downtime
5. Monitor for issues
6. Rollback if necessary

---

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Production Checklist](https://docs.mongodb.com/manual/administration/production-checklist-operations/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
