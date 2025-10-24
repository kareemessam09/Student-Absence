# ✅ Teacher Self-Assignment Feature - IMPLEMENTED

## Overview
Teachers can now assign/unassign themselves to/from classes through the API.

---

## 🎯 New Endpoint

### **Assign/Unassign Teacher to Class**

```http
PUT /api/classes/:classId/assign-teacher
Authorization: Bearer <teacher_jwt_token>
Content-Type: application/json

Body:
{
  "assign": true  // or false to unassign
}
```

---

## 📋 Complete Implementation Details

### 1. **Endpoint Details**
- **URL**: `/api/classes/:classId/assign-teacher`
- **Method**: `PUT`
- **Authentication**: Required (JWT Token)
- **Authorization**: Teachers only
- **Content-Type**: `application/json`

### 2. **Request Body**
```json
{
  "assign": boolean  // required
}
```

- `assign: true` → Assigns the authenticated teacher to the class
- `assign: false` → Unassigns the authenticated teacher from the class

### 3. **Response Formats**

#### ✅ Success (200 OK)
```json
{
  "status": "success",
  "message": "Successfully assigned to class",
  "data": {
    "class": {
      "_id": "68f92d51207e77586e93e779",
      "name": "Mathematics 101",
      "description": "Basic mathematics",
      "teacher": {
        "_id": "68fa5963f8fecea3cbea7ccf",
        "name": "John Smith",
        "email": "teacher1@school.com"
      },
      "students": [...],
      "capacity": 30,
      "isActive": true
    }
  }
}
```

#### ❌ Error (400 Bad Request)
```json
{
  "status": "fail",
  "message": "Please provide 'assign' field as boolean (true/false)"
}
```

#### ❌ Error (403 Forbidden)
```json
{
  "status": "fail",
  "message": "You can only unassign yourself from classes you are currently teaching"
}
```

#### ❌ Error (404 Not Found)
```json
{
  "status": "fail",
  "message": "Class not found"
}
```

---

## 🔒 Security Features

### ✅ What Teachers CAN Do:
1. **Assign themselves** to any class (set `teacher` field to their own ID)
2. **Unassign themselves** from classes they currently teach

### ❌ What Teachers CANNOT Do:
1. **Assign other teachers** to classes (attempts will fail)
2. **Unassign other teachers** from classes (validation prevents this)
3. **Modify other class fields** (name, capacity, students, etc.)
4. **Use this endpoint as manager/admin** (role check prevents this)

### 🔑 Security Implementation:
- Teacher ID is extracted from **JWT token** (not from request body)
- Role verification ensures **only teachers** can access this endpoint
- Validation prevents unassigning other teachers
- All changes are logged for audit trail

---

## 🧪 Testing Guide

### Prerequisites
1. Server running on `http://localhost:3000`
2. Database seeded with test data (`npm run seed`)

### Test Credentials
```
Teacher 1: teacher1@school.com / password123
Teacher 2: teacher2@school.com / password123
Manager:   manager@school.com / password123
```

---

### **Test 1: Login as Teacher**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@school.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "68fa5963f8fecea3cbea7ccf",
      "name": "John Smith",
      "email": "teacher1@school.com",
      "role": "teacher"
    }
  }
}
```

**Important**: Copy the `token` value for subsequent requests!

---

### **Test 2: Get All Classes**

```bash
curl -X GET http://localhost:3000/api/classes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "classes": [
      {
        "_id": "68f92d51207e77586e93e779",
        "name": "Mathematics 101",
        "teacher": { ... },
        ...
      },
      ...
    ]
  }
}
```

**Copy a class `_id` for the next test!**

---

### **Test 3: Assign Teacher to Class**

```bash
curl -X PUT http://localhost:3000/api/classes/CLASS_ID_HERE/assign-teacher \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "assign": true
  }'
```

**Expected Result**: ✅ 200 OK
```json
{
  "status": "success",
  "message": "Successfully assigned to class",
  "data": {
    "class": {
      "_id": "...",
      "name": "Mathematics 101",
      "teacher": {
        "_id": "68fa5963f8fecea3cbea7ccf",
        "name": "John Smith"
      }
    }
  }
}
```

---

### **Test 4: Unassign Teacher from Class**

```bash
curl -X PUT http://localhost:3000/api/classes/CLASS_ID_HERE/assign-teacher \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "assign": false
  }'
```

**Expected Result**: ✅ 200 OK
```json
{
  "status": "success",
  "message": "Successfully unassigned from class",
  "data": {
    "class": {
      "_id": "...",
      "name": "Mathematics 101",
      "teacher": null
    }
  }
}
```

---

### **Test 5: Verify Manager CANNOT Use This Endpoint**

```bash
# First login as manager
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@school.com",
    "password": "password123"
  }'

# Try to use assign-teacher endpoint
curl -X PUT http://localhost:3000/api/classes/CLASS_ID_HERE/assign-teacher \
  -H "Authorization: Bearer MANAGER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "assign": true
  }'
```

**Expected Result**: ❌ 403 Forbidden
```json
{
  "status": "fail",
  "message": "Access denied. Insufficient permissions."
}
```

---

### **Test 6: Try to Unassign Another Teacher**

```bash
# Login as Teacher 2
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher2@school.com",
    "password": "password123"
  }'

# Try to unassign from a class taught by Teacher 1
curl -X PUT http://localhost:3000/api/classes/CLASS_TAUGHT_BY_TEACHER1/assign-teacher \
  -H "Authorization: Bearer TEACHER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assign": false
  }'
```

**Expected Result**: ❌ 403 Forbidden
```json
{
  "status": "fail",
  "message": "You can only unassign yourself from classes you are currently teaching"
}
```

---

## 📱 Frontend Integration

### React/React Native Example

```javascript
// API Service
class StudentAbsenceAPI {
  async assignTeacherToClass(classId, assign) {
    const response = await fetch(
      `${API_BASE_URL}/classes/${classId}/assign-teacher`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ assign })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update class assignment');
    }
    
    return data;
  }
}

// Usage in Component
const handleToggleClass = async (classId, isAssigned) => {
  try {
    setLoading(true);
    
    const result = await api.assignTeacherToClass(classId, !isAssigned);
    
    toast.success(result.message);
    
    // Refresh class list
    await fetchClasses();
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Flutter/Dart Example

```dart
// API Service
class StudentAbsenceAPI {
  Future<Map<String, dynamic>> assignTeacherToClass(
    String classId, 
    bool assign
  ) async {
    final response = await http.put(
      Uri.parse('$baseUrl/classes/$classId/assign-teacher'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${getToken()}',
      },
      body: json.encode({'assign': assign}),
    );

    final data = json.decode(response.body);

    if (response.statusCode != 200) {
      throw Exception(data['message'] ?? 'Failed to update class');
    }

    return data;
  }
}

// Usage in Widget
Future<void> _toggleClassAssignment(String classId, bool isAssigned) async {
  try {
    setState(() => _loading = true);

    final result = await api.assignTeacherToClass(classId, !isAssigned);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(result['message'])),
    );

    // Refresh
    await _loadClasses();
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(e.toString())),
    );
  } finally {
    setState(() => _loading = false);
  }
}
```

---

## 🔄 Changes Made to Backend

### 1. **JWT Token Enhancement**
- **File**: `src/controllers/authController.js`
- **Change**: Added `role` field to JWT payload
- **Before**: `{ id: userId }`
- **After**: `{ id: userId, role: userRole }`

### 2. **New Controller Function**
- **File**: `src/controllers/classController.js`
- **Function**: `assignTeacherToClass`
- **Purpose**: Handle teacher self-assignment requests

### 3. **New Service Function**
- **File**: `src/services/classService.js`
- **Function**: `assignTeacherToClass`
- **Logic**: 
  - Validate teacher role
  - Assign/unassign teacher
  - Prevent unauthorized unassignments

### 4. **New Route**
- **File**: `src/routes/classRoutes.js`
- **Route**: `PUT /:id/assign-teacher`
- **Middleware**: `verifyToken`, `authorize('teacher')`
- **Order**: Placed before generic `/:id` route to prevent conflicts

---

## 📊 Database Impact

### Changes to Class Document
```javascript
{
  "teacher": ObjectId | null
}
```

- When assigned: `teacher` = teacher's user ID
- When unassigned: `teacher` = `null`

### No Migration Required
- Existing classes with teachers remain unchanged
- New functionality works with existing data structure

---

## 🎯 Use Cases

### UC1: Teacher Joins Available Class
1. Teacher views all available classes
2. Teacher selects a class they want to teach
3. Teacher clicks "Assign Me"
4. API: `PUT /classes/:id/assign-teacher` with `{ assign: true }`
5. Teacher is now assigned to the class

### UC2: Teacher Leaves Class
1. Teacher views their current classes
2. Teacher selects a class to leave
3. Teacher clicks "Unassign Me"
4. API: `PUT /classes/:id/assign-teacher` with `{ assign: false }`
5. Teacher is removed from the class

### UC3: Manager Views Teacher Assignments
1. Manager gets all classes: `GET /classes`
2. Each class shows which teacher is assigned
3. Manager can manually reassign using: `PUT /classes/:id` (existing endpoint)

---

## ⚠️ Important Notes

1. **Token Refresh Required**: Users who logged in before this update need to **re-login** to get the new JWT token with `role` field

2. **Route Order Matters**: The `/assign-teacher` route MUST be before the generic `/:id` route in the router

3. **Single Teacher Per Class**: A class can only have ONE teacher at a time (by design)

4. **Managers Still Have Full Control**: Managers can still assign/unassign any teacher using the existing `PUT /classes/:id` endpoint

---

## 🚀 Deployment Checklist

- [x] Update JWT token to include `role`
- [x] Create `assignTeacherToClass` controller
- [x] Create `assignTeacherToClass` service
- [x] Add route with correct order
- [x] Test teacher assignment
- [x] Test teacher unassignment
- [x] Test permission restrictions
- [x] Document the feature

---

## 📞 Support

If you encounter any issues:

1. **401 Unauthorized**: Check that token is valid and included in header
2. **403 Forbidden**: Verify user is logged in as a teacher (not manager/admin)
3. **404 Not Found**: Verify class ID exists
4. **400 Bad Request**: Ensure `assign` field is boolean

---

**Feature Status**: ✅ **COMPLETE AND READY FOR PRODUCTION**

