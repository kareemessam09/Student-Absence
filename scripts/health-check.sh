#!/bin/bash

# Health Check Script for Student Absence API

# Configuration
ENDPOINT="${API_ENDPOINT:-http://localhost:3000/health}"
MAX_RETRIES=3
RETRY_DELAY=5

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT" 2>&1)
    echo "$response"
}

echo "Checking API health at: $ENDPOINT"

for i in $(seq 1 $MAX_RETRIES); do
    RESPONSE=$(check_health)
    
    if [ "$RESPONSE" -eq 200 ]; then
        echo -e "${GREEN}✅ API is healthy (Status: $RESPONSE)${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Attempt $i/$MAX_RETRIES: API returned status $RESPONSE${NC}"
        
        if [ $i -lt $MAX_RETRIES ]; then
            echo "Waiting $RETRY_DELAY seconds before retry..."
            sleep $RETRY_DELAY
        fi
    fi
done

# All retries failed
echo -e "${RED}❌ API health check failed after $MAX_RETRIES attempts${NC}"
echo "Last status code: $RESPONSE"

# Optional: Restart the application
if command -v pm2 &> /dev/null; then
    echo "Attempting to restart application..."
    pm2 restart student-absence-api
    echo "Application restarted. Please monitor logs."
fi

exit 1
