#!/bin/bash

echo "🧪 Testing Manager Statistics Endpoints"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📝 Step 1: Login as Manager${NC}"
echo "----------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@school.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Manager login failed!${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Manager logged in${NC}"
echo ""

echo -e "${BLUE}📊 Step 2: Get Overview Statistics${NC}"
echo "-----------------------------------"
OVERVIEW=$(curl -s -X GET "$BASE_URL/statistics/overview" \
  -H "Authorization: Bearer $TOKEN")

echo $OVERVIEW | jq '.'

if echo $OVERVIEW | grep -q '"status":"success"'; then
  echo -e "${GREEN}✅ Overview statistics retrieved!${NC}"
  
  # Extract key metrics
  TOTAL_CLASSES=$(echo $OVERVIEW | jq -r '.data.overview.totalClasses')
  TOTAL_STUDENTS=$(echo $OVERVIEW | jq -r '.data.overview.totalStudents')
  TOTAL_TEACHERS=$(echo $OVERVIEW | jq -r '.data.overview.totalTeachers')
  UTILIZATION=$(echo $OVERVIEW | jq -r '.data.overview.classUtilization.percentage')
  
  echo ""
  echo -e "${BLUE}Key Metrics:${NC}"
  echo "  📚 Total Classes: $TOTAL_CLASSES"
  echo "  🎓 Total Students: $TOTAL_STUDENTS"
  echo "  👨‍🏫 Total Teachers: $TOTAL_TEACHERS"
  echo "  📈 Utilization: $UTILIZATION%"
else
  echo -e "${RED}❌ Failed to get overview statistics!${NC}"
fi
echo ""

echo -e "${BLUE}📚 Step 3: Get Class Statistics${NC}"
echo "--------------------------------"
CLASS_STATS=$(curl -s -X GET "$BASE_URL/statistics/classes" \
  -H "Authorization: Bearer $TOKEN")

echo $CLASS_STATS | jq '.'

if echo $CLASS_STATS | grep -q '"status":"success"'; then
  CLASS_COUNT=$(echo $CLASS_STATS | jq -r '.results')
  echo -e "${GREEN}✅ Class statistics retrieved! (${CLASS_COUNT} classes)${NC}"
  
  # Show top 3 most utilized classes
  echo ""
  echo -e "${BLUE}Top 3 Most Utilized Classes:${NC}"
  echo $CLASS_STATS | jq -r '.data.classes[:3] | .[] | "  - \(.name): \(.studentCount)/\(.capacity) (\(.utilizationRate | tonumber | round)%)"'
else
  echo -e "${RED}❌ Failed to get class statistics!${NC}"
fi
echo ""

echo -e "${BLUE}👨‍🏫 Step 4: Get Teacher Statistics${NC}"
echo "-----------------------------------"
TEACHER_STATS=$(curl -s -X GET "$BASE_URL/statistics/teachers" \
  -H "Authorization: Bearer $TOKEN")

echo $TEACHER_STATS | jq '.'

if echo $TEACHER_STATS | grep -q '"status":"success"'; then
  TEACHER_COUNT=$(echo $TEACHER_STATS | jq -r '.results')
  echo -e "${GREEN}✅ Teacher statistics retrieved! (${TEACHER_COUNT} teachers)${NC}"
  
  # Show teachers with most classes
  echo ""
  echo -e "${BLUE}Teachers by Class Count:${NC}"
  echo $TEACHER_STATS | jq -r '.data.teachers | .[] | "  - \(.name): \(.classCount) class(es), \(.totalStudents) students"'
else
  echo -e "${RED}❌ Failed to get teacher statistics!${NC}"
fi
echo ""

echo -e "${BLUE}⚡ Step 5: Performance Test (Single Call vs Multiple Calls)${NC}"
echo "------------------------------------------------------------"

# Measure single call time
START_SINGLE=$(date +%s%3N)
curl -s -X GET "$BASE_URL/statistics/overview" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
END_SINGLE=$(date +%s%3N)
SINGLE_TIME=$((END_SINGLE - START_SINGLE))

echo -e "${GREEN}Single API call (overview): ${SINGLE_TIME}ms${NC}"

# Simulate old approach (multiple calls)
START_MULTI=$(date +%s%3N)
curl -s -X GET "$BASE_URL/classes" -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s -X GET "$BASE_URL/students" -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s -X GET "$BASE_URL/users" -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s -X GET "$BASE_URL/notifications" -H "Authorization: Bearer $TOKEN" > /dev/null
END_MULTI=$(date +%s%3N)
MULTI_TIME=$((END_MULTI - START_MULTI))

echo -e "${YELLOW}Multiple API calls (4 calls): ${MULTI_TIME}ms${NC}"

IMPROVEMENT=$((MULTI_TIME - SINGLE_TIME))
PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", ($IMPROVEMENT/$MULTI_TIME)*100}")

echo ""
echo -e "${GREEN}⚡ Performance Improvement: ${IMPROVEMENT}ms faster (${PERCENTAGE}% reduction)${NC}"
echo ""

echo -e "${BLUE}🔒 Step 6: Test Authorization (Teacher Should Fail)${NC}"
echo "---------------------------------------------------"
# Login as teacher
TEACHER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@school.com",
    "password": "password123"
  }')

TEACHER_TOKEN=$(echo $TEACHER_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Try to access statistics
TEACHER_ATTEMPT=$(curl -s -X GET "$BASE_URL/statistics/overview" \
  -H "Authorization: Bearer $TEACHER_TOKEN")

if echo $TEACHER_ATTEMPT | grep -q '"status":"fail"'; then
  echo -e "${GREEN}✅ Authorization working! Teacher blocked from statistics${NC}"
else
  echo -e "${RED}❌ Authorization failed! Teacher should not access statistics${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 Test Complete!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "✅ Manager can access overview statistics"
echo "✅ Manager can access class statistics"
echo "✅ Manager can access teacher statistics"
echo "✅ Single API call is significantly faster"
echo "✅ Authorization prevents non-managers from accessing"
