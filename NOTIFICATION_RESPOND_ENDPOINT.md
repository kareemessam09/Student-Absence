# ✅ Notification Respond Endpoint - IMPLEMENTED

## Overview
Teachers can now respond to absence request notifications sent by receptionists.

---

## 🎯 Endpoint Details

### **Respond to Notification**

```http
POST /api/notifications/:id/respond
Authorization: Bearer <teacher_jwt_token>
Content-Type: application/json

Body:
{
  "approved": true,           // boolean - true for present, false for absent
  "responseMessage": "string" // optional - teacher's comment
}
```

**Alternative Method** (also supported):
```http
PUT /api/notifications/:id/respond
```
Both POST and PUT methods work for this endpoint.

---

## 📋 Request/Response Details

### Request Parameters

**URL Parameter:**
- `:id` - The notification ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "approved": boolean,           // required - true = present, false = absent
  "responseMessage": string      // optional - max 500 characters
}
```

### Response Formats

#### ✅ Success (200 OK)
```json
{
  "status": "success",
  "message": "Response recorded successfully",
  "data": {
    "notification": {
      "_id": "68fb94e2d92fde65a416407c",
      "from": {
        "_id": "68f944e17dbf06151d2a4226",
        "name": "Sarah Johnson",
        "email": "receptionist@school.com",
        "role": "receptionist"
      },
      "to": {
        "_id": "68fa5963f8fecea3cbea7ccf",
        "name": "John Smith",
        "email": "teacher1@school.com",
        "role": "teacher"
      },
      "student": {
        "_id": "68f92d51207e77586e93e77f",
        "studentCode": "STU001",
        "nama": "Ahmed Ali"
      },
      "class": {
        "_id": "68f92d51207e77586e93e779",
        "name": "Mathematics 101"
      },
      "type": "response",           // Changed from "request" to "response"
      "status": "present",          // "present" or "absent" based on approved
      "message": "Absence request for Ahmed Ali (STU001) from Mathematics 101",
      "responseMessage": "Student was present in class",
      "isRead": true,               // Automatically set to true
      "requestDate": "2025-10-24T15:01:54.395Z",
      "responseDate": "2025-10-24T15:30:00.000Z",  // Set when responded
      "createdAt": "2025-10-24T15:01:54.398Z",
      "updatedAt": "2025-10-24T15:30:00.000Z"
    }
  }
}
```

#### ❌ Error Responses

**404 - Notification Not Found**
```json
{
  "status": "fail",
  "message": "Notification not found"
}
```

**403 - Unauthorized**
```json
{
  "status": "fail",
  "message": "You are not authorized to respond to this notification"
}
```

**400 - Already Responded**
```json
{
  "status": "fail",
  "message": "This notification has already been responded to"
}
```

**400 - Validation Error**
```json
{
  "status": "fail",
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Approved field must be a boolean (true or false)",
      "param": "approved"
    }
  ]
}
```

---

## 🔒 Security & Authorization

### Authentication Required
- **JWT Token** must be included in `Authorization: Bearer <token>` header
- Token must be valid and not expired

### Role-Based Access
- **Teachers only** can respond to notifications
- Teacher must be the **recipient** (`notification.to`) of the notification
- Teachers cannot respond to notifications sent to other teachers

### Validation Rules
1. **approved** must be a boolean (`true` or `false`)
2. **responseMessage** is optional, max 500 characters
3. Notification must exist and be in `pending` status
4. Notification must be of type `request`
5. Only the recipient teacher can respond

---

## 🎯 Business Logic

### When `approved: true` (Student Present)
1. Set notification `status` to `"present"`
2. Set `type` to `"response"`
3. Set `responseDate` to current timestamp
4. Set `isRead` to `true`
5. Save `responseMessage` if provided
6. Emit real-time Socket.IO event to receptionist

### When `approved: false` (Student Absent)
1. Set notification `status` to `"absent"`
2. Set `type` to `"response"`
3. Set `responseDate` to current timestamp
4. Set `isRead` to `true`
5. Save `responseMessage` if provided
6. Emit real-time Socket.IO event to receptionist

### What Gets Updated
```javascript
{
  type: "request" → "response",
  status: "pending" → "present" or "absent",
  responseMessage: null → "your message",
  responseDate: null → Date.now(),
  isRead: false → true
}
```

---

## 🧪 Testing Guide

### Prerequisites
1. Server running on `http://localhost:3000`
2. Database seeded with test data (`npm run seed`)
3. A pending notification exists

### Test Credentials
```
Teacher:      teacher1@school.com / password123
Receptionist: receptionist@school.com / password123
```

---

### **Manual Test: Approve (Present)**

```bash
# 1. Login as receptionist and send request
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "receptionist@school.com",
    "password": "password123"
  }'
# Copy the token

curl -X POST http://localhost:3000/api/notifications/request \
  -H "Authorization: Bearer <receptionist-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_ID_HERE",
    "message": "Student was absent, please verify"
  }'
# Copy the notification _id

# 2. Login as teacher
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@school.com",
    "password": "password123"
  }'
# Copy the token

# 3. Respond with approved = true (student was present)
curl -X POST http://localhost:3000/api/notifications/NOTIFICATION_ID/respond \
  -H "Authorization: Bearer <teacher-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "responseMessage": "Student was present in my class"
  }'
```

**Expected:** Status is `"present"`, type is `"response"`, isRead is `true`

---

### **Manual Test: Reject (Absent)**

```bash
curl -X POST http://localhost:3000/api/notifications/NOTIFICATION_ID/respond \
  -H "Authorization: Bearer <teacher-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": false,
    "responseMessage": "Confirmed: Student was absent from my class"
  }'
```

**Expected:** Status is `"absent"`, type is `"response"`, isRead is `true`

---

### **Automated Test**

```bash
./test-notification-respond.sh
```

This script tests:
- ✅ Receptionist sends request
- ✅ Teacher views notifications
- ✅ Teacher approves (approved: true → status: present)
- ✅ Teacher rejects (approved: false → status: absent)
- ✅ Notification state changes correctly

---

## 📱 Frontend Integration

### React/React Native Example

```javascript
// API Service
class StudentAbsenceAPI {
  async respondToNotification(notificationId, approved, responseMessage) {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/respond`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ 
          approved,
          responseMessage 
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to respond to notification');
    }
    
    return data;
  }
}

// Usage in Component
const handleApprove = async (notificationId) => {
  try {
    setLoading(true);
    
    const result = await api.respondToNotification(
      notificationId,
      true, // approved = true means student was present
      "Student was present in class today"
    );
    
    toast.success(result.message);
    
    // Refresh notifications list
    await fetchNotifications();
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

const handleReject = async (notificationId) => {
  try {
    setLoading(true);
    
    const result = await api.respondToNotification(
      notificationId,
      false, // approved = false means student was absent
      "Student was absent from class"
    );
    
    toast.success(result.message);
    
    await fetchNotifications();
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
  Future<Map<String, dynamic>> respondToNotification(
    String notificationId,
    bool approved,
    String? responseMessage,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/notifications/$notificationId/respond'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${getToken()}',
      },
      body: json.encode({
        'approved': approved,
        if (responseMessage != null) 'responseMessage': responseMessage,
      }),
    );

    final data = json.decode(response.body);

    if (response.statusCode != 200) {
      throw Exception(data['message'] ?? 'Failed to respond');
    }

    return data;
  }
}

// Usage in Widget
Future<void> _respondToNotification(
  String notificationId,
  bool approved,
) async {
  try {
    setState(() => _loading = true);

    final result = await api.respondToNotification(
      notificationId,
      approved,
      approved 
        ? 'Student was present in class'
        : 'Student was absent from class',
    );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(result['message'])),
    );

    await _loadNotifications();
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

### 1. **Updated Validation** (`src/middleware/validation.js`)
- Changed from `status` validation to `approved` boolean validation
- Validates `approved` must be `true` or `false`
- `responseMessage` remains optional (max 500 chars)

### 2. **Updated Controller** (`src/controllers/notificationController.js`)
- Accepts `approved` boolean from request body
- Converts `approved: true` → `status: "present"`
- Converts `approved: false` → `status: "absent"`
- Changed success message to "Response recorded successfully"

### 3. **Updated Service** (`src/services/notificationService.js`)
- Populates `from`, `to`, `student`, and `class` fields
- Sets `type` from `"request"` to `"response"`
- Sets `isRead` to `true` automatically
- Sets `responseDate` to current timestamp
- Returns fully populated notification object
- Emits Socket.IO event to receptionist

### 4. **Updated Routes** (`src/routes/notificationRoutes.js`)
- Added `POST /:id/respond` route (new)
- Kept `PUT /:id/respond` route (backward compatible)
- Both methods work identically

---

## 🎯 Use Cases

### UC1: Teacher Confirms Student Was Present
1. Receptionist sends absence request for Ahmed
2. Teacher receives notification
3. Teacher checks and finds Ahmed was actually present
4. Teacher responds with `approved: true`
5. Backend sets status to `"present"`
6. Receptionist gets notified via Socket.IO

### UC2: Teacher Confirms Student Was Absent
1. Receptionist sends absence request for Sara
2. Teacher receives notification
3. Teacher verifies Sara was indeed absent
4. Teacher responds with `approved: false`
5. Backend sets status to `"absent"`
6. Attendance record created (if implemented)

### UC3: Teacher Adds Additional Context
1. Teacher responds to notification
2. Includes detailed message: "Student arrived late at 10:30 AM but was marked present"
3. `responseMessage` saved in database
4. Receptionist can view the details

---

## 🔔 Real-Time Updates

### Socket.IO Event Emitted
When a teacher responds, the following event is emitted to the receptionist:

```javascript
Event: "notification:updated"
Payload: {
  id: "68fb94e2d92fde65a416407c",
  status: "present",  // or "absent"
  responseMessage: "Student was present in class",
  responseDate: "2025-10-24T15:30:00.000Z"
}
```

Frontend can listen to this event:
```javascript
socket.on('notification:updated', (data) => {
  console.log('Notification updated:', data);
  // Update UI to show response
  updateNotificationInList(data.id, data);
});
```

---

## ⚠️ Important Notes

1. **One Response Only**: Once a notification is responded to, it cannot be changed (status !== pending check)

2. **Auto Read**: Responding to a notification automatically marks it as read

3. **Type Change**: Notification type changes from `"request"` to `"response"`

4. **Boolean Only**: The `approved` field MUST be boolean (`true` or `false`), not string or number

5. **Populated Fields**: Response includes full user, student, and class objects (not just IDs)

6. **Backward Compatible**: Both POST and PUT methods work for this endpoint

---

## 📊 Database Impact

### Notification Document Changes
```javascript
// Before Response
{
  type: "request",
  status: "pending",
  isRead: false,
  responseMessage: null,
  responseDate: null
}

// After Response (approved: true)
{
  type: "response",
  status: "present",
  isRead: true,
  responseMessage: "Student was present in class",
  responseDate: "2025-10-24T15:30:00.000Z"
}

// After Response (approved: false)
{
  type: "response",
  status: "absent",
  isRead: true,
  responseMessage: "Student was absent from class",
  responseDate: "2025-10-24T15:30:00.000Z"
}
```

---

## 🚀 Deployment Checklist

- [x] Update validation to accept `approved` boolean
- [x] Update controller to convert `approved` to `status`
- [x] Update service to populate all fields
- [x] Update service to change type to "response"
- [x] Update service to set isRead to true
- [x] Add POST route for the endpoint
- [x] Test with receptionist → teacher flow
- [x] Verify Socket.IO events work
- [x] Document the endpoint

---

## 📞 Troubleshooting

### 404 Error
**Issue**: `Can't find /api/notifications/:id/respond on this server!`
**Solution**: Restart the server to load the new route

### 403 Forbidden
**Issue**: "You are not authorized to respond to this notification"
**Solution**: 
- Verify you're logged in as a teacher
- Verify the notification was sent to YOU (check `notification.to` matches your user ID)

### 400 Validation Error
**Issue**: "Approved field must be a boolean"
**Solution**: Send `approved: true` or `approved: false` (not string "true"/"false")

### 400 Already Responded
**Issue**: "This notification has already been responded to"
**Solution**: This notification was already processed. Create a new request to test.

---

**Feature Status**: ✅ **COMPLETE AND READY FOR PRODUCTION**

