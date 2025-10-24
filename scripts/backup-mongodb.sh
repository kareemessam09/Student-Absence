#!/bin/bash

# MongoDB Backup Script for Student Absence API

set -e

# Configuration
BACKUP_DIR="/home/student-absence-api/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="studentAbsence"
DB_USER="studentapp"
DB_PASS="${MONGODB_PASSWORD:-AppSecurePassword456!}"  # Use env variable or default
RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting MongoDB backup...${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Backing up database: $DB_NAME"
mongodump \
  --db="$DB_NAME" \
  --username="$DB_USER" \
  --password="$DB_PASS" \
  --authenticationDatabase="$DB_NAME" \
  --out="$BACKUP_DIR/mongodb_backup_$DATE"

# Compress backup
echo "Compressing backup..."
tar -czf "$BACKUP_DIR/mongodb_backup_$DATE.tar.gz" \
  -C "$BACKUP_DIR" "mongodb_backup_$DATE"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/mongodb_backup_$DATE"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/mongodb_backup_$DATE.tar.gz" | cut -f1)

echo -e "${GREEN}✅ Backup completed successfully${NC}"
echo "File: mongodb_backup_$DATE.tar.gz"
echo "Size: $BACKUP_SIZE"
echo "Location: $BACKUP_DIR"

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "mongodb_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo -e "${GREEN}✅ Cleanup completed${NC}"

# List recent backups
echo ""
echo "Recent backups:"
ls -lh "$BACKUP_DIR" | tail -5
