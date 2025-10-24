# 🧪 Testing Guide for Student Absence API

## Quick Start

### 1. Seed the Database
```bash
node src/seed.js
```

This will create:
- 4 Users (1 manager, 2 teachers, 1 receptionist)
- 10 Students
- 3 Classes
- 2 Sample notifications

### 2. Test Credentials
```
Manager:      manager@school.com      / password123
Teacher 1:    teacher1@school.com     / password123
Teacher 2:    teacher2@school.com     / password123
Receptionist: receptionist@school.com / password123
```

## Testing Methods

### Method 1: Using cURL (Terminal)

#### 1. Login as Manager
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@school.com",
    "password": "password123"
  }'
```

Save the token from the response!

#### 2. Get All Students
```bash
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3. Get All Classes
```bash
curl -X GET http://localhost:3000/api/classes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Method 2: Using Postman

1. **Import the API Documentation**
   - Open Postman
   - Import → Link → `http://localhost:3000/api-docs`
   - Or manually create requests using the examples below

2. **Create a Collection**
   - Name: Student Absence API
   - Add requests for each endpoint

3. **Set up Environment Variables**
   - Variable: `baseUrl` = `http://localhost:3000/api`
   - Variable: `token` = (set after login)

### Method 3: Using VS Code REST Client Extension

1. **Install REST Client Extension**
   - Open VS Code Extensions
   - Search for "REST Client" by Huachao Mao
   - Install it

2. **Use the test-api.rest file**
   - Open `test-api.rest`
   - Click "Send Request" above any endpoint
   - Results appear in a new tab

### Method 4: Using Swagger UI (Easiest!)

1. **Open Swagger UI**
   ```
   http://localhost:3000/api-docs
   ```

2. **Authenticate**
   - Click "Authorize" button (top right)
   - Login first to get a token:
     - Go to `/api/auth/login` endpoint
     - Try it out with credentials
     - Copy the token from response
   - Paste token in authorization dialog
   - Click "Authorize"

3. **Test Endpoints**
   - Expand any endpoint
   - Click "Try it out"
   - Fill in parameters
   - Click "Execute"

## Testing Scenarios

### Scenario 1: Complete User Flow

```bash
# 1. Login as Receptionist
POST /api/auth/login
{
  "email": "receptionist@school.com",
  "password": "password123"
}
# Save the token!

# 2. Get all students
GET /api/students
Authorization: Bearer YOUR_TOKEN

# 3. Send request to teacher about a student
POST /api/notifications/request
Authorization: Bearer YOUR_TOKEN
{
  "studentId": "STUDENT_ID_FROM_STEP_2",
  "message": "Is Ahmed Ali present in class?"
}

# 4. Login as Teacher
POST /api/auth/login
{
  "email": "teacher1@school.com",
  "password": "password123"
}
# Save the new token!

# 5. Get notifications
GET /api/notifications
Authorization: Bearer TEACHER_TOKEN

# 6. Respond to the request
PUT /api/notifications/NOTIFICATION_ID/respond
Authorization: Bearer TEACHER_TOKEN
{
  "status": "present",
  "responseMessage": "Yes, Ahmed is present in class"
}

# 7. Login back as Receptionist and check notifications
POST /api/auth/login
{
  "email": "receptionist@school.com",
  "password": "password123"
}

GET /api/notifications
Authorization: Bearer RECEPTIONIST_TOKEN
```

### Scenario 2: Manager Operations

```bash
# 1. Login as Manager
POST /api/auth/login
{
  "email": "manager@school.com",
  "password": "password123"
}

# 2. Create a new student
POST /api/students
Authorization: Bearer MANAGER_TOKEN
{
  "studentCode": "STU011",
  "nama": "New Student",
  "class": "CLASS_ID_HERE",
  "enrollmentDate": "2024-10-22"
}

# 3. Create a new class
POST /api/classes
Authorization: Bearer MANAGER_TOKEN
{
  "name": "Chemistry 101",
  "description": "Basic Chemistry",
  "teacher": "TEACHER_ID_HERE",
  "capacity": 25,
  "startDate": "2024-10-22"
}

# 4. Add student to class
POST /api/classes/CLASS_ID/students
Authorization: Bearer MANAGER_TOKEN
{
  "studentId": "STUDENT_ID"
}
```

## Common Issues & Solutions

### Issue: "Unauthorized" or "Invalid token"
**Solution:** 
- Make sure you logged in first
- Copy the full token from login response
- Include "Bearer " prefix in Authorization header

### Issue: "Forbidden" or "Access denied"
**Solution:**
- Check user role permissions
- Only managers can create/update/delete
- Teachers can only respond to notifications
- Receptionists can only send requests

### Issue: "Student not found" or "Class not found"
**Solution:**
- Run `node src/seed.js` first to populate database
- Use actual IDs from the database
- Get IDs by listing all students/classes first

## API Response Examples

### Successful Login
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "671234567890",
      "name": "Admin Manager",
      "email": "manager@school.com",
      "role": "manager"
    }
  }
}
```

### Get Students Response
```json
{
  "status": "success",
  "results": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 10
  },
  "data": {
    "students": [
      {
        "_id": "671234567890",
        "studentCode": "STU001",
        "nama": "Ahmed Ali",
        "class": {
          "_id": "671234567891",
          "name": "Mathematics 101"
        },
        "isActive": true
      }
    ]
  }
}
```

## Next Steps

1. ✅ Seed the database: `node src/seed.js`
2. ✅ Start the server: `npm run dev`
3. ✅ Open Swagger UI: `http://localhost:3000/api-docs`
4. ✅ Test login endpoint
5. ✅ Test other endpoints with the token

Happy Testing! 🚀
