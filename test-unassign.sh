#!/bin/bash

echo "🧪 Testing Teacher Self-Assignment Feature"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📝 Step 1: Login as Teacher"
echo "----------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@school.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed!${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Login successful!${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

echo "📚 Step 2: Get All Classes"
echo "----------------------------"
CLASSES_RESPONSE=$(curl -s -X GET "$BASE_URL/classes" \
  -H "Authorization: Bearer $TOKEN")

CLASS_ID=$(echo $CLASSES_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$CLASS_ID" ]; then
  echo -e "${RED}❌ No classes found!${NC}"
  echo $CLASSES_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Found classes!${NC}"
echo "Using Class ID: $CLASS_ID"
echo ""

echo "➕ Step 3: Assign Teacher to Class"
echo "-----------------------------------"
ASSIGN_RESPONSE=$(curl -s -X PUT "$BASE_URL/classes/$CLASS_ID/assign-teacher" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assign": true}')

echo $ASSIGN_RESPONSE | jq '.'

if echo $ASSIGN_RESPONSE | grep -q '"status":"success"'; then
  echo -e "${GREEN}✅ Teacher assigned successfully!${NC}"
else
  echo -e "${RED}❌ Assignment failed!${NC}"
fi
echo ""

echo "➖ Step 4: Unassign Teacher from Class"
echo "---------------------------------------"
UNASSIGN_RESPONSE=$(curl -s -X PUT "$BASE_URL/classes/$CLASS_ID/assign-teacher" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assign": false}')

echo $UNASSIGN_RESPONSE | jq '.'

if echo $UNASSIGN_RESPONSE | grep -q '"status":"success"'; then
  if echo $UNASSIGN_RESPONSE | grep -q '"teacher":null'; then
    echo -e "${GREEN}✅ Teacher unassigned successfully! (teacher is now null)${NC}"
  else
    echo -e "${YELLOW}⚠️  Unassigned but teacher field is not null${NC}"
  fi
else
  echo -e "${RED}❌ Unassignment failed!${NC}"
fi
echo ""

echo "🔍 Step 5: Verify Class State"
echo "----------------------------"
VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/classes/$CLASS_ID" \
  -H "Authorization: Bearer $TOKEN")

echo $VERIFY_RESPONSE | jq '.'
echo ""

echo "=========================================="
echo "🎉 Test Complete!"
echo "=========================================="
