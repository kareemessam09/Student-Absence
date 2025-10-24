# 🚀 Frontend Integration Guide - Student Absence API

## Base Configuration

```javascript
// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const WS_URL = 'http://localhost:3000'; // For Socket.IO

// Store token in localStorage/sessionStorage
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');
```

## HTTP Headers Setup

```javascript
// For all authenticated requests, include:
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
}
```

---

## 📋 COMPLETE API ENDPOINTS REFERENCE

### ⚠️ IMPORTANT NOTES:
- **All endpoints** (except auth) require `Authorization: Bearer TOKEN` header
- Base URL: `http://localhost:3000/api`
- All responses follow this format:
  ```json
  {
    "status": "success",
    "data": { ... },
    "message": "Optional message"
  }
  ```

---

## 🔐 1. AUTHENTICATION ENDPOINTS

### 1.1 Login
```http
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "user@school.com",
  "password": "password123"
}

Response:
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "671234567890",
      "name": "User Name",
      "email": "user@school.com",
      "role": "manager|teacher|receptionist"
    }
  }
}
```

**Frontend Usage:**
```javascript
async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.status === 'success') {
    setToken(data.token);
    return data.data.user;
  }
  throw new Error(data.message);
}
```

### 1.2 Register (Manager only - requires token)
```http
POST /api/auth/register
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "New User",
  "email": "newuser@school.com",
  "password": "password123",
  "role": "teacher"  // or "receptionist" or "manager"
}
```

### 1.3 Get Current User Info
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### 1.4 Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### 1.5 Update Password
```http
PUT /api/auth/update-password
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

### 1.6 Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

Body:
{
  "email": "user@school.com"
}
```

### 1.7 Reset Password
```http
PUT /api/auth/reset-password/{resetToken}
Content-Type: application/json

Body:
{
  "password": "newpassword123"
}
```

---

## 👨‍🎓 2. STUDENT ENDPOINTS

### 2.1 Get All Students (with pagination)
```http
GET /api/students?page=1&limit=10
Authorization: Bearer {token}

Response:
{
  "status": "success",
  "results": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalResults": 50
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
        "isActive": true,
        "enrollmentDate": "2024-09-01T00:00:00.000Z",
        "createdAt": "2024-09-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Frontend Usage:**
```javascript
async function getStudents(page = 1, limit = 10) {
  const response = await fetch(
    `${API_BASE_URL}/students?page=${page}&limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }
  );
  return await response.json();
}
```

### 2.2 Get Student by ID
```http
GET /api/students/{studentId}
Authorization: Bearer {token}
```

### 2.3 Get Students by Class
```http
GET /api/students/class/{classId}
Authorization: Bearer {token}
```

### 2.4 Create Student (Manager only)
```http
POST /api/students
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "studentCode": "STU011",
  "nama": "New Student Name",
  "class": "671234567891",  // Class ID
  "enrollmentDate": "2024-10-22"
}
```

### 2.5 Update Student (Manager only)
```http
PUT /api/students/{studentId}
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "nama": "Updated Name",
  "class": "671234567891",
  "isActive": true
}
```

### 2.6 Delete Student (Manager only)
```http
DELETE /api/students/{studentId}
Authorization: Bearer {token}
```

---

## 📚 3. CLASS ENDPOINTS

### 3.1 Get All Classes (with pagination)
```http
GET /api/classes?page=1&limit=10
Authorization: Bearer {token}

Response:
{
  "status": "success",
  "results": 3,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 3
  },
  "data": {
    "classes": [
      {
        "_id": "671234567891",
        "name": "Mathematics 101",
        "description": "Basic mathematics",
        "teacher": {
          "_id": "671234567892",
          "name": "John Smith"
        },
        "students": [],
        "capacity": 30,
        "isActive": true,
        "startDate": "2024-09-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 3.2 Get Class by ID
```http
GET /api/classes/{classId}
Authorization: Bearer {token}
```

### 3.3 Get Classes by Teacher
```http
GET /api/classes/teacher/{teacherId}
Authorization: Bearer {token}
```

**Frontend Usage for Teachers:**
```javascript
// Get classes for logged-in teacher
async function getMyClasses(userId) {
  const response = await fetch(
    `${API_BASE_URL}/classes/teacher/${userId}`,
    {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }
  );
  return await response.json();
}
```

### 3.4 Create Class (Manager only)
```http
POST /api/classes
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "Biology 101",
  "description": "Introduction to Biology",
  "teacher": "671234567892",  // Teacher user ID
  "capacity": 25,
  "startDate": "2024-10-22"
}
```

### 3.5 Update Class (Manager only)
```http
PUT /api/classes/{classId}
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "Advanced Biology",
  "capacity": 30,
  "isActive": true
}
```

### 3.6 Delete Class (Manager only)
```http
DELETE /api/classes/{classId}
Authorization: Bearer {token}
```

### 3.7 Add Student to Class (Manager only)
```http
POST /api/classes/{classId}/students
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "studentId": "671234567890"
}
```

### 3.8 Remove Student from Class (Manager only)
```http
DELETE /api/classes/{classId}/students/{studentId}
Authorization: Bearer {token}
```

---

## 🔔 4. NOTIFICATION ENDPOINTS

### 4.1 Get My Notifications
```http
GET /api/notifications?page=1&limit=10
Authorization: Bearer {token}

Response:
{
  "status": "success",
  "results": 2,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 2
  },
  "data": {
    "notifications": [
      {
        "_id": "671234567893",
        "from": {
          "_id": "671234567894",
          "name": "Mary Brown",
          "role": "receptionist"
        },
        "to": {
          "_id": "671234567895",
          "name": "John Smith",
          "role": "teacher"
        },
        "student": {
          "_id": "671234567896",
          "studentCode": "STU001",
          "nama": "Ahmed Ali"
        },
        "class": {
          "_id": "671234567897",
          "name": "Mathematics 101"
        },
        "type": "request",  // or "response" or "message"
        "status": "pending",  // or "approved", "rejected", "absent", "present"
        "message": "Is Ahmed Ali present in class?",
        "responseMessage": null,
        "isRead": false,
        "createdAt": "2024-10-22T10:00:00.000Z",
        "responseDate": null
      }
    ]
  }
}
```

**Frontend Usage:**
```javascript
async function getNotifications(page = 1) {
  const response = await fetch(
    `${API_BASE_URL}/notifications?page=${page}&limit=10`,
    {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }
  );
  return await response.json();
}
```

### 4.2 Get Notification by ID
```http
GET /api/notifications/{notificationId}
Authorization: Bearer {token}
```

### 4.3 Get Unread Notification Count
```http
GET /api/notifications/unread/count
Authorization: Bearer {token}

Response:
{
  "status": "success",
  "data": {
    "count": 5
  }
}
```

**Frontend Usage (for badge display):**
```javascript
async function getUnreadCount() {
  const response = await fetch(
    `${API_BASE_URL}/notifications/unread/count`,
    {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }
  );
  const data = await response.json();
  return data.data.count;
}
```

### 4.4 Get Notifications by Student
```http
GET /api/notifications/student/{studentId}
Authorization: Bearer {token}
```

### 4.5 Send Request to Teacher (Receptionist only)
```http
POST /api/notifications/request
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "studentId": "671234567896",
  "message": "Is this student present in class today?"
}

Note: The API automatically determines which teacher to notify based on the student's class
```

**Frontend Usage (Receptionist):**
```javascript
async function sendRequestToTeacher(studentId, message) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/request`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ studentId, message })
    }
  );
  return await response.json();
}
```

### 4.6 Teacher Sends Message to Receptionist (Teacher only)
```http
POST /api/notifications/message
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "receptionistId": "671234567894",
  "studentId": "671234567896",
  "message": "Please send this student to the office"
}
```

### 4.7 Respond to Notification (Teacher only)
```http
PUT /api/notifications/{notificationId}/respond
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "status": "present",  // or "absent", "approved", "rejected"
  "responseMessage": "Yes, the student is present in class"
}
```

**Frontend Usage (Teacher):**
```javascript
async function respondToNotification(notificationId, status, responseMessage) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}/respond`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status, responseMessage })
    }
  );
  return await response.json();
}
```

### 4.8 Mark Notification as Read
```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer {token}
```

---

## 👥 5. USER ENDPOINTS

### 5.1 Get My Profile
```http
GET /api/users/profile/me
Authorization: Bearer {token}

Response:
{
  "status": "success",
  "data": {
    "user": {
      "_id": "671234567890",
      "name": "User Name",
      "email": "user@school.com",
      "role": "teacher",
      "isActive": true,
      "lastLogin": "2024-10-22T10:00:00.000Z",
      "createdAt": "2024-09-01T00:00:00.000Z"
    }
  }
}
```

### 5.2 Update My Profile
```http
PUT /api/users/profile/me
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "Updated Name",
  "email": "newemail@school.com"
}
```

### 5.3 Get All Users (Admin/Manager only)
```http
GET /api/users?page=1&limit=10
Authorization: Bearer {token}
```

### 5.4 Get User by ID
```http
GET /api/users/{userId}
Authorization: Bearer {token}
```

### 5.5 Update User (requires permission)
```http
PUT /api/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "Updated Name",
  "isActive": false
}
```

### 5.6 Delete User (Admin/Manager only)
```http
DELETE /api/users/{userId}
Authorization: Bearer {token}
```

---

## 🔌 6. WEBSOCKET (Socket.IO) - REAL-TIME NOTIFICATIONS

### Setup Socket.IO Client

```javascript
import { io } from 'socket.io-client';

// Connect to socket server
const socket = io('http://localhost:3000', {
  auth: {
    userId: currentUser._id  // Send user ID for authentication
  }
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to socket server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from socket server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Listen to Real-Time Events

```javascript
// 1. New Notification Received
socket.on('notification:new', (notification) => {
  console.log('📨 New notification:', notification);
  // Update UI: show toast, update notification list, increment badge
  /*
  notification = {
    id: "notification_id",
    type: "request|message",
    status: "pending",
    student: { id: "...", studentCode: "STU001", nama: "Ahmed Ali" },
    class: { id: "...", name: "Mathematics 101" },
    message: "...",
    createdAt: "2025-01-01T00:00:00.000Z"
  }
  */
});

// 2. Notification Updated (Response received)
socket.on('notification:updated', (notification) => {
  console.log('🔄 Notification updated:', notification);
  // Update UI: update the notification in the list
  /*
  notification = {
    id: "notification_id",
    status: "approved|rejected|absent|present",
    responseMessage: "...",
    responseDate: "2025-01-01T00:05:00.000Z"
  }
  */
});

// 3. Notification Read (Someone read your notification)
socket.on('notification:read', (data) => {
  console.log('👁️ Notification read:', data);
  // Update UI: mark notification as read
  /*
  data = {
    id: "notification_id",
    readBy: "user_id",
    readAt: "2025-01-01T00:06:00.000Z"
  }
  */
});
```

### Complete Socket.IO Integration Example

```javascript
// Initialize socket connection
function initializeSocket(userId) {
  const socket = io('http://localhost:3000', {
    auth: { userId }
  });

  socket.on('connect', () => {
    console.log('Connected to notification server');
  });

  // Handle new notifications
  socket.on('notification:new', (notification) => {
    // Show toast notification
    showToast(`New ${notification.type} from ${notification.from.name}`);
    
    // Update notification list
    addNotificationToList(notification);
    
    // Increment unread badge
    updateUnreadBadge();
  });

  // Handle notification updates
  socket.on('notification:updated', (notification) => {
    // Update specific notification in UI
    updateNotificationInList(notification.id, notification);
    
    // Show toast
    showToast(`Response received: ${notification.status}`);
  });

  // Handle read receipts
  socket.on('notification:read', (data) => {
    markNotificationAsReadInUI(data.id);
  });

  return socket;
}
```

---

## 📦 7. COMPLETE FRONTEND EXAMPLE (React/Vue/Vanilla JS)

### API Service Class

```javascript
class StudentAbsenceAPI {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    localStorage.setItem('token', token);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.getToken() && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    this.setToken(data.token);
    return data.data.user;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
  }

  async getMe() {
    const data = await this.request('/auth/me');
    return data.data.user;
  }

  // Students
  async getStudents(page = 1, limit = 10) {
    const data = await this.request(`/students?page=${page}&limit=${limit}`);
    return data;
  }

  async getStudent(id) {
    const data = await this.request(`/students/${id}`);
    return data.data.student;
  }

  async createStudent(studentData) {
    const data = await this.request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    return data.data.student;
  }

  async updateStudent(id, studentData) {
    const data = await this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
    return data.data.student;
  }

  async deleteStudent(id) {
    await this.request(`/students/${id}`, { method: 'DELETE' });
  }

  // Classes
  async getClasses(page = 1, limit = 10) {
    const data = await this.request(`/classes?page=${page}&limit=${limit}`);
    return data;
  }

  async getClass(id) {
    const data = await this.request(`/classes/${id}`);
    return data.data.class;
  }

  async getClassesByTeacher(teacherId) {
    const data = await this.request(`/classes/teacher/${teacherId}`);
    return data.data.classes;
  }

  async createClass(classData) {
    const data = await this.request('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
    return data.data.class;
  }

  // Notifications
  async getNotifications(page = 1, limit = 10) {
    const data = await this.request(`/notifications?page=${page}&limit=${limit}`);
    return data;
  }

  async getUnreadCount() {
    const data = await this.request('/notifications/unread/count');
    return data.data.count;
  }

  async sendRequestToTeacher(studentId, message) {
    const data = await this.request('/notifications/request', {
      method: 'POST',
      body: JSON.stringify({ studentId, message }),
    });
    return data.data.notification;
  }

  async respondToNotification(notificationId, status, responseMessage) {
    const data = await this.request(`/notifications/${notificationId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ status, responseMessage }),
    });
    return data.data.notification;
  }

  async markNotificationAsRead(notificationId) {
    const data = await this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    return data.data.notification;
  }

  async sendMessageToReceptionist(receptionistId, studentId, message) {
    const data = await this.request('/notifications/message', {
      method: 'POST',
      body: JSON.stringify({ receptionistId, studentId, message }),
    });
    return data.data.notification;
  }
}

// Usage
const api = new StudentAbsenceAPI();

// Login
try {
  const user = await api.login('manager@school.com', 'password123');
  console.log('Logged in:', user);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Get students
const students = await api.getStudents(1, 10);
console.log('Students:', students.data.students);

// Get unread notifications
const unreadCount = await api.getUnreadCount();
console.log('Unread:', unreadCount);
```

---

## 🎯 ROLE-BASED USAGE GUIDE

### Manager Dashboard
```javascript
// What managers can do:
- Create/Update/Delete Students
- Create/Update/Delete Classes
- Create/Update/Delete Users
- View all notifications
- Manage class enrollments (add/remove students from classes)

// Example: Manager creates a student
await api.createStudent({
  studentCode: 'STU011',
  nama: 'New Student',
  class: classId,
  enrollmentDate: '2024-10-22'
});
```

### Teacher Dashboard
```javascript
// What teachers can do:
- View their classes: GET /api/classes/teacher/{teacherId}
- View students in their classes
- View notifications sent to them
- Respond to receptionist requests
- Send messages to receptionist
- Mark notifications as read

// Example: Teacher responds to request
await api.respondToNotification(notificationId, 'present', 'Student is in class');

// Example: Teacher sends message to receptionist
await api.sendMessageToReceptionist(receptionistId, studentId, 'Please send student to office');
```

### Receptionist Dashboard
```javascript
// What receptionists can do:
- View all students
- View all classes
- Send requests to teachers
- View responses from teachers
- Mark notifications as read

// Example: Receptionist asks about a student
await api.sendRequestToTeacher(studentId, 'Is this student present in class?');
```

---

## ⚡ IMPORTANT IMPLEMENTATION NOTES

### 1. **Authentication Flow**
```javascript
// 1. User logs in
const user = await api.login(email, password);

// 2. Store user data and token
localStorage.setItem('user', JSON.stringify(user));
localStorage.setItem('token', token);

// 3. On app load, check if user is authenticated
const token = localStorage.getItem('token');
if (token) {
  try {
    const user = await api.getMe();
    // User is authenticated
  } catch (error) {
    // Token expired, redirect to login
    localStorage.clear();
  }
}

// 4. On logout
await api.logout();
localStorage.clear();
```

### 2. **Socket.IO Connection**
```javascript
// Connect AFTER login
const user = await api.login(email, password);
const socket = initializeSocket(user._id);

// Disconnect on logout
socket.disconnect();
```

### 3. **Error Handling**
```javascript
try {
  const students = await api.getStudents();
} catch (error) {
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
  } else if (error.message.includes('403')) {
    // Forbidden - show access denied
  } else {
    // Show error message
    alert(error.message);
  }
}
```

### 4. **Pagination**
```javascript
// Always handle pagination
const response = await api.getStudents(page, limit);
console.log('Total pages:', response.pagination.totalPages);
console.log('Total results:', response.pagination.totalResults);
```

### 5. **Real-Time Updates**
```javascript
// Update UI when receiving socket events
socket.on('notification:new', (notification) => {
  // Add to notification list
  setNotifications(prev => [notification, ...prev]);
  
  // Increment unread count
  setUnreadCount(prev => prev + 1);
  
  // Show toast
  showToast(`New ${notification.type} received`);
});
```

---

## 🔧 TESTING ENDPOINTS

Use these test credentials:
```
Manager:      manager@school.com / password123
Teacher 1:    teacher1@school.com / password123
Teacher 2:    teacher2@school.com / password123
Receptionist: receptionist@school.com / password123
```

---

## 📱 CORS Configuration

If your frontend is on a different domain/port, add it to `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

---

## 🚨 COMMON ERRORS

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No token or invalid token | Login again |
| 403 Forbidden | Insufficient permissions | Check user role |
| 404 Not Found | Invalid ID or endpoint | Verify ID/endpoint |
| 429 Too Many Requests | Rate limit exceeded | Wait 15 minutes |
| 500 Internal Server Error | Server error | Check server logs |

---

This guide contains ALL the endpoints you need for your frontend application! 🎉
