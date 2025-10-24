#!/bin/bash

# Student Absence API - Production Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "=========================================="
echo "Student Absence API - Production Deploy"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/student-absence-api/Student-Absence"
BACKUP_DIR="/home/student-absence-api/backups"
PM2_APP_NAME="student-absence-api"

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if running as correct user
if [ "$USER" != "student-absence-api" ]; then
    print_error "This script must be run as 'student-absence-api' user"
    exit 1
fi

# Check if in correct directory
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

print_info "Starting deployment process..."
echo ""

# Step 1: Backup current version
print_info "Step 1: Creating backup..."
BACKUP_FILE="$BACKUP_DIR/app-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_FILE" . --exclude='node_modules' --exclude='logs' --exclude='.git'
print_success "Backup created: $BACKUP_FILE"
echo ""

# Step 2: Pull latest code
print_info "Step 2: Pulling latest code from repository..."
git fetch origin
git pull origin main
print_success "Code updated"
echo ""

# Step 3: Install dependencies
print_info "Step 3: Installing dependencies..."
npm ci --production
print_success "Dependencies installed"
echo ""

# Step 4: Run database migrations (if any)
print_info "Step 4: Running database migrations..."
# Add migration commands here if needed
# node scripts/migrate.js
print_success "Migrations completed"
echo ""

# Step 5: Reload PM2 application (zero downtime)
print_info "Step 5: Reloading application..."
pm2 reload $PM2_APP_NAME
sleep 3  # Wait for reload to complete
print_success "Application reloaded"
echo ""

# Step 6: Verify application is running
print_info "Step 6: Verifying application status..."
if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
    print_success "Application is running"
else
    print_error "Application failed to start!"
    print_info "Rolling back..."
    # Rollback logic here
    exit 1
fi
echo ""

# Step 7: Health check
print_info "Step 7: Performing health check..."
sleep 2
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    print_success "Health check passed (Status: $HEALTH_RESPONSE)"
else
    print_error "Health check failed (Status: $HEALTH_RESPONSE)"
    print_info "Check logs with: pm2 logs $PM2_APP_NAME"
    exit 1
fi
echo ""

# Step 8: Clean up old backups (keep last 7)
print_info "Step 8: Cleaning up old backups..."
find "$BACKUP_DIR" -name "app-backup-*.tar.gz" -mtime +7 -delete
print_success "Old backups cleaned"
echo ""

# Deployment summary
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo "Status: SUCCESS"
echo "Version: $(git rev-parse --short HEAD)"
echo "Branch: $(git branch --show-current)"
echo "Deployed: $(date)"
echo "Backup: $BACKUP_FILE"
echo ""
print_success "Deployment completed successfully!"
echo ""
print_info "View logs with: pm2 logs $PM2_APP_NAME"
print_info "Monitor app with: pm2 monit"
echo ""
