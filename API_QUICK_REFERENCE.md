# 📋 API Quick Reference - Student Absence System

**Base URL:** `http://localhost:3000/api`

## 🔐 Authentication Header
```javascript
headers: {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'Content-Type': 'application/json'
}
```

---

## 🚀 QUICK START

### 1. Login
```javascript
POST /api/auth/login
Body: { "email": "manager@school.com", "password": "password123" }
// Returns: { token, user }
```

### 2. Get Current User
```javascript
GET /api/auth/me
// Returns: { user }
```

---

## 📊 ESSENTIAL ENDPOINTS BY ROLE

### 👨‍💼 MANAGER (Full Access)

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| Get all students | GET | `/students?page=1&limit=10` | - |
| Create student | POST | `/students` | `{ studentCode, nama, class, enrollmentDate }` |
| Update student | PUT | `/students/:id` | `{ nama, class, isActive }` |
| Delete student | DELETE | `/students/:id` | - |
| Get all classes | GET | `/classes?page=1&limit=10` | - |
| Create class | POST | `/classes` | `{ name, description, teacher, capacity, startDate }` |
| Update class | PUT | `/classes/:id` | `{ name, capacity, isActive }` |
| Delete class | DELETE | `/classes/:id` | - |
| Add student to class | POST | `/classes/:id/students` | `{ studentId }` |
| Remove student from class | DELETE | `/classes/:id/students/:studentId` | - |
| Register user | POST | `/auth/register` | `{ name, email, password, role }` |

### 👨‍🏫 TEACHER

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| Get my classes | GET | `/classes/teacher/:myUserId` | - |
| Get students in class | GET | `/students/class/:classId` | - |
| Get my notifications | GET | `/notifications?page=1&limit=10` | - |
| Respond to request | PUT | `/notifications/:id/respond` | `{ status: "present/absent", responseMessage }` |
| Send message to receptionist | POST | `/notifications/message` | `{ receptionistId, studentId, message }` |
| Mark as read | PUT | `/notifications/:id/read` | - |

### 👩‍💼 RECEPTIONIST

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| Get all students | GET | `/students?page=1&limit=10` | - |
| Get all classes | GET | `/classes?page=1&limit=10` | - |
| Send request to teacher | POST | `/notifications/request` | `{ studentId, message }` |
| Get my notifications | GET | `/notifications?page=1&limit=10` | - |
| Mark as read | PUT | `/notifications/:id/read` | - |
| Get unread count | GET | `/notifications/unread/count` | - |

---

## 🎯 COMMON WORKFLOWS

### Workflow 1: Receptionist Checks Student Presence
```javascript
// 1. Get student
GET /api/students/:studentId

// 2. Send request to teacher
POST /api/notifications/request
Body: { "studentId": "xxx", "message": "Is student present?" }

// 3. Wait for socket event or poll notifications
GET /api/notifications

// 4. View teacher's response in notification
```

### Workflow 2: Teacher Responds
```javascript
// 1. Get notifications
GET /api/notifications

// 2. Respond to request
PUT /api/notifications/:notificationId/respond
Body: { "status": "present", "responseMessage": "Yes, student is here" }

// 3. Receptionist receives socket event 'notification:updated'
```

### Workflow 3: Manager Creates Class with Students
```javascript
// 1. Create class
POST /api/classes
Body: { "name": "Math 101", "teacher": "teacherId", "capacity": 30, "startDate": "2024-10-22" }
// Returns: { class: { _id: "classId", ... } }

// 2. Create students
POST /api/students
Body: { "studentCode": "STU001", "nama": "Ahmed", "class": "classId", "enrollmentDate": "2024-10-22" }

// 3. Or add existing students to class
POST /api/classes/:classId/students
Body: { "studentId": "existingStudentId" }
```

---

## 🔌 SOCKET.IO EVENTS

### Connect
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000', {
  auth: { userId: currentUser._id }
});
```

### Listen to Events
```javascript
// New notification received
socket.on('notification:new', (data) => {
  // data = { id, type, status, student, class, message, createdAt }
  console.log('New notification:', data);
  updateUI();
});

// Notification updated (response received)
socket.on('notification:updated', (data) => {
  // data = { id, status, responseMessage, responseDate }
  console.log('Notification updated:', data);
  updateNotificationInList(data.id);
});

// Notification read
socket.on('notification:read', (data) => {
  // data = { id, readBy, readAt }
  console.log('Notification read:', data);
});
```

---

## 📦 RESPONSE FORMATS

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "status": "fail" | "error",
  "message": "Error description",
  "errors": []
}
```

### Paginated Response
```json
{
  "status": "success",
  "results": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalResults": 50
  },
  "data": { ... }
}
```

---

## 🔑 NOTIFICATION STATUS VALUES

| Status | Description |
|--------|-------------|
| `pending` | Request sent, waiting for teacher response |
| `present` | Teacher confirmed student is present |
| `absent` | Teacher confirmed student is absent |
| `approved` | Teacher approved the request |
| `rejected` | Teacher rejected the request |

---

## 🎨 NOTIFICATION TYPES

| Type | Sender | Receiver | Purpose |
|------|--------|----------|---------|
| `request` | Receptionist | Teacher | Ask about student status |
| `response` | Teacher | Receptionist | Response to request (via respond endpoint) |
| `message` | Teacher | Receptionist | Proactive message about student |

---

## ⚡ QUICK CODE SNIPPETS

### Login & Store Token
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'manager@school.com', password: 'password123' })
});
const data = await response.json();
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.data.user));
```

### Get Data with Auth
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/students', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(data.data.students);
```

### Send Notification Request (Receptionist)
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/notifications/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    studentId: 'student_id_here',
    message: 'Is this student present in class?'
  })
});
const data = await response.json();
```

### Respond to Notification (Teacher)
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/notifications/notif_id/respond', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'present',
    responseMessage: 'Yes, student is in class'
  })
});
const data = await response.json();
```

---

## 🧪 TEST CREDENTIALS

```
Manager:      manager@school.com      / password123
Teacher 1:    teacher1@school.com     / password123
Teacher 2:    teacher2@school.com     / password123
Receptionist: receptionist@school.com / password123
```

---

## 🔧 ENVIRONMENT SETUP

If frontend is on different port, update `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080
```

---

## 📞 SUPPORT ENDPOINTS

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Check server status |
| `GET /api-docs` | Swagger documentation |

---

## 🚨 HTTP STATUS CODES

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (login required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

**Full Documentation:** See `FRONTEND_INTEGRATION_GUIDE.md`

**Need Help?** Open Swagger UI: http://localhost:3000/api-docs
