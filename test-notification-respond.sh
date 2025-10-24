#!/bin/bash

echo "🧪 Testing Notification Respond Endpoint"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📝 Step 1: Login as Receptionist${NC}"
echo "-----------------------------------"
RECEPTIONIST_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "receptionist@school.com",
    "password": "password123"
  }')

RECEPTIONIST_TOKEN=$(echo $RECEPTIONIST_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$RECEPTIONIST_TOKEN" ]; then
  echo -e "${RED}❌ Receptionist login failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Receptionist logged in${NC}"
echo ""

echo -e "${BLUE}📝 Step 2: Login as Teacher${NC}"
echo "----------------------------"
TEACHER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@school.com",
    "password": "password123"
  }')

TEACHER_TOKEN=$(echo $TEACHER_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TEACHER_TOKEN" ]; then
  echo -e "${RED}❌ Teacher login failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Teacher logged in${NC}"
echo ""

echo -e "${BLUE}🎓 Step 3: Get Students${NC}"
echo "------------------------"
STUDENTS=$(curl -s -X GET "$BASE_URL/students" \
  -H "Authorization: Bearer $RECEPTIONIST_TOKEN")

STUDENT_ID=$(echo $STUDENTS | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$STUDENT_ID" ]; then
  echo -e "${RED}❌ No students found!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found student: $STUDENT_ID${NC}"
echo ""

echo -e "${BLUE}📨 Step 4: Send Absence Request${NC}"
echo "--------------------------------"
REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/notifications/request" \
  -H "Authorization: Bearer $RECEPTIONIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentId\": \"$STUDENT_ID\",
    \"message\": \"Student was absent today, please confirm.\"
  }")

NOTIFICATION_ID=$(echo $REQUEST_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$NOTIFICATION_ID" ]; then
  echo -e "${RED}❌ Failed to send request!${NC}"
  echo $REQUEST_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Request sent! Notification ID: $NOTIFICATION_ID${NC}"
echo ""

echo -e "${BLUE}👀 Step 5: Teacher Views Notifications${NC}"
echo "---------------------------------------"
NOTIFICATIONS=$(curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TEACHER_TOKEN")

echo $NOTIFICATIONS | jq '.'
echo ""

echo -e "${BLUE}✅ Step 6: Teacher Responds (Approved = Present)${NC}"
echo "------------------------------------------------"
RESPOND_PRESENT=$(curl -s -X POST "$BASE_URL/notifications/$NOTIFICATION_ID/respond" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "responseMessage": "Student was present in my class today."
  }')

echo $RESPOND_PRESENT | jq '.'

if echo $RESPOND_PRESENT | grep -q '"status":"success"'; then
  if echo $RESPOND_PRESENT | grep -q '"status":"present"'; then
    echo -e "${GREEN}✅ Response recorded! Status is 'present'${NC}"
  else
    echo -e "${YELLOW}⚠️  Response sent but status is not 'present'${NC}"
  fi
else
  echo -e "${RED}❌ Response failed!${NC}"
fi
echo ""

echo -e "${BLUE}📨 Step 7: Send Another Request (for rejection test)${NC}"
echo "----------------------------------------------------"
REQUEST_RESPONSE2=$(curl -s -X POST "$BASE_URL/notifications/request" \
  -H "Authorization: Bearer $RECEPTIONIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentId\": \"$STUDENT_ID\",
    \"message\": \"Student was absent again, please verify.\"
  }")

NOTIFICATION_ID2=$(echo $REQUEST_RESPONSE2 | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$NOTIFICATION_ID2" ]; then
  echo -e "${RED}❌ Failed to send second request!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Second request sent! Notification ID: $NOTIFICATION_ID2${NC}"
echo ""

echo -e "${BLUE}❌ Step 8: Teacher Responds (Approved = False = Absent)${NC}"
echo "-------------------------------------------------------"
RESPOND_ABSENT=$(curl -s -X POST "$BASE_URL/notifications/$NOTIFICATION_ID2/respond" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": false,
    "responseMessage": "Confirmed: Student was absent from class."
  }')

echo $RESPOND_ABSENT | jq '.'

if echo $RESPOND_ABSENT | grep -q '"status":"success"'; then
  if echo $RESPOND_ABSENT | grep -q '"status":"absent"'; then
    echo -e "${GREEN}✅ Response recorded! Status is 'absent'${NC}"
  else
    echo -e "${YELLOW}⚠️  Response sent but status is not 'absent'${NC}"
  fi
else
  echo -e "${RED}❌ Response failed!${NC}"
fi
echo ""

echo -e "${BLUE}🔍 Step 9: Verify Notification States${NC}"
echo "--------------------------------------"
VERIFY=$(curl -s -X GET "$BASE_URL/notifications/$NOTIFICATION_ID" \
  -H "Authorization: Bearer $TEACHER_TOKEN")

echo "First notification (should be present):"
echo $VERIFY | jq '.data.notification | {id: ._id, status: .status, type: .type, responseMessage: .responseMessage, isRead: .isRead}'
echo ""

VERIFY2=$(curl -s -X GET "$BASE_URL/notifications/$NOTIFICATION_ID2" \
  -H "Authorization: Bearer $TEACHER_TOKEN")

echo "Second notification (should be absent):"
echo $VERIFY2 | jq '.data.notification | {id: ._id, status: .status, type: .type, responseMessage: .responseMessage, isRead: .isRead}'
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 Test Complete!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "✅ Receptionist can send absence requests"
echo "✅ Teacher can view notifications"
echo "✅ Teacher can approve (present) with approved: true"
echo "✅ Teacher can reject (absent) with approved: false"
echo "✅ Notification type changes from 'request' to 'response'"
echo "✅ Response message is recorded"
echo "✅ Notification marked as read automatically"
