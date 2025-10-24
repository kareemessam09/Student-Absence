# 🎯 FRONTEND DEVELOPER - START HERE

## What You Need to Build Your App

### 1️⃣ API Base URL
```
http://localhost:3000/api
```

### 2️⃣ Required Headers for All Requests (except login)
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

### 3️⃣ Login First to Get Token
```javascript
POST http://localhost:3000/api/auth/login
Body: {
  "email": "manager@school.com",
  "password": "password123"
}

// Response includes:
{
  "token": "eyJhbGc...",  // Use this in Authorization header
  "data": {
    "user": {
      "_id": "user_id",   // Use this for Socket.IO
      "name": "User Name",
      "role": "manager"    // Use this for UI permissions
    }
  }
}
```

---

## 📱 ESSENTIAL ENDPOINTS FOR YOUR APP

### FOR ALL ROLES (After Login):

#### Get Students List
```javascript
GET /api/students?page=1&limit=10
// Returns: { data: { students: [...] }, pagination: {...} }
```

#### Get Classes List
```javascript
GET /api/classes?page=1&limit=10
// Returns: { data: { classes: [...] }, pagination: {...} }
```

#### Get My Notifications
```javascript
GET /api/notifications?page=1&limit=10
// Returns: { data: { notifications: [...] }, pagination: {...} }
```

#### Get Unread Notification Count (for badge)
```javascript
GET /api/notifications/unread/count
// Returns: { data: { count: 5 } }
```

#### Mark Notification as Read
```javascript
PUT /api/notifications/{notificationId}/read
// No body needed
```

---

### FOR RECEPTIONIST ROLE:

#### Send Request to Teacher
```javascript
POST /api/notifications/request
Body: {
  "studentId": "671234567890",
  "message": "Is this student present in class?"
}
```

---

### FOR TEACHER ROLE:

#### Get My Classes
```javascript
GET /api/classes/teacher/{myUserId}
// Use the user._id from login response
```

#### Respond to Request
```javascript
PUT /api/notifications/{notificationId}/respond
Body: {
  "status": "present",  // or "absent", "approved", "rejected"
  "responseMessage": "Yes, student is in class"
}
```

#### Send Message to Receptionist
```javascript
POST /api/notifications/message
Body: {
  "receptionistId": "671234567890",
  "studentId": "671234567891",
  "message": "Please send this student to the office"
}
```

---

### FOR MANAGER ROLE:

#### Create Student
```javascript
POST /api/students
Body: {
  "studentCode": "STU011",
  "nama": "Ahmed Ali",
  "class": "classId",
  "enrollmentDate": "2024-10-22"
}
```

#### Update Student
```javascript
PUT /api/students/{studentId}
Body: {
  "nama": "Updated Name",
  "class": "newClassId",
  "isActive": true
}
```

#### Delete Student
```javascript
DELETE /api/students/{studentId}
```

#### Create Class
```javascript
POST /api/classes
Body: {
  "name": "Mathematics 101",
  "description": "Basic math",
  "teacher": "teacherUserId",
  "capacity": 30,
  "startDate": "2024-10-22"
}
```

#### Add Student to Class
```javascript
POST /api/classes/{classId}/students
Body: {
  "studentId": "671234567890"
}
```

---

## 🔌 REAL-TIME NOTIFICATIONS (Socket.IO)

### Install Socket.IO Client
```bash
npm install socket.io-client
```

### Connect to Server
```javascript
import { io } from 'socket.io-client';

// Connect after login
const socket = io('http://localhost:3000', {
  auth: {
    userId: loggedInUser._id  // From login response
  }
});

socket.on('connect', () => {
  console.log('Connected to notifications');
});
```

### Listen for New Notifications
```javascript
socket.on('notification:new', (notification) => {
  // Someone sent you a notification
  console.log('New notification:', notification);
  
  // Update your UI:
  // - Add notification to list
  // - Increment unread badge
  // - Show toast/alert
});
```

### Listen for Notification Updates
```javascript
socket.on('notification:updated', (notification) => {
  // Someone responded to your notification
  console.log('Response received:', notification);
  
  // Update your UI:
  // - Update the notification in your list
  // - Show toast with response
});
```

---

## 💻 COMPLETE EXAMPLE CODE

### React/Next.js Example

```javascript
// api.js - API Service
export class API {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.getToken() && { 'Authorization': `Bearer ${this.getToken()}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data.user;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    localStorage.clear();
  }

  // Students
  async getStudents(page = 1, limit = 10) {
    return this.request(`/students?page=${page}&limit=${limit}`);
  }

  // Notifications
  async getNotifications(page = 1) {
    return this.request(`/notifications?page=${page}&limit=10`);
  }

  async getUnreadCount() {
    const data = await this.request('/notifications/unread/count');
    return data.data.count;
  }

  async sendRequest(studentId, message) {
    return this.request('/notifications/request', {
      method: 'POST',
      body: JSON.stringify({ studentId, message }),
    });
  }

  async respondToNotification(id, status, responseMessage) {
    return this.request(`/notifications/${id}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ status, responseMessage }),
    });
  }
}

export const api = new API();
```

```javascript
// socket.js - Socket.IO Setup
import { io } from 'socket.io-client';

export function initSocket(userId, callbacks) {
  const socket = io('http://localhost:3000', {
    auth: { userId }
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('notification:new', (notification) => {
    if (callbacks.onNew) callbacks.onNew(notification);
  });

  socket.on('notification:updated', (notification) => {
    if (callbacks.onUpdated) callbacks.onUpdated(notification);
  });

  return socket;
}
```

```javascript
// LoginPage.jsx
import { useState } from 'react';
import { api } from './api';
import { initSocket } from './socket';

export function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('manager@school.com');
  const [password, setPassword] = useState('password123');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await api.login(email, password);
      
      // Initialize socket after login
      const socket = initSocket(user._id, {
        onNew: (notification) => {
          console.log('New notification!', notification);
          // Update your state/UI
        },
        onUpdated: (notification) => {
          console.log('Notification updated!', notification);
          // Update your state/UI
        }
      });
      
      onLoginSuccess(user, socket);
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password"
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

```javascript
// StudentList.jsx
import { useState, useEffect } from 'react';
import { api } from './api';

export function StudentList() {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, [page]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents(page, 10);
      setStudents(data.data.students);
    } catch (error) {
      alert('Error loading students: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Students</h2>
      {students.map(student => (
        <div key={student._id}>
          {student.studentCode} - {student.nama}
        </div>
      ))}
      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        Previous
      </button>
      <button onClick={() => setPage(p => p + 1)}>
        Next
      </button>
    </div>
  );
}
```

---

## 🧪 TEST YOUR INTEGRATION

### 1. Test Login
```javascript
const user = await api.login('manager@school.com', 'password123');
console.log('Logged in as:', user.name, user.role);
```

### 2. Test Getting Data
```javascript
const students = await api.getStudents(1, 10);
console.log('Students:', students.data.students);
```

### 3. Test Notifications
```javascript
const notifications = await api.getNotifications(1);
console.log('Notifications:', notifications.data.notifications);

const unreadCount = await api.getUnreadCount();
console.log('Unread:', unreadCount);
```

---

## 📋 RESPONSE FORMAT

All API responses follow this format:

### Success
```json
{
  "status": "success",
  "data": {
    "students": [...],
    "notifications": [...]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalResults": 50
  }
}
```

### Error
```json
{
  "status": "fail",
  "message": "Error description"
}
```

---

## 🎨 UI PERMISSIONS BY ROLE

```javascript
const userRole = loggedInUser.role;

// Show/hide features based on role
const canCreateStudent = userRole === 'manager';
const canCreateClass = userRole === 'manager';
const canSendRequest = userRole === 'receptionist';
const canRespond = userRole === 'teacher';
const canSendMessage = userRole === 'teacher';

// Example
{canCreateStudent && (
  <button onClick={createStudent}>Create Student</button>
)}
```

---

## 🚀 QUICK SETUP STEPS

1. **Start the API server** (already done ✅)
2. **Test login in browser:**
   - Open `test-client.html`
   - Login with test credentials
   - See it working!

3. **In your frontend project:**
   ```bash
   npm install socket.io-client
   ```

4. **Copy the API class** from above or use `FRONTEND_INTEGRATION_GUIDE.md`

5. **Implement:**
   - Login page → get token & user
   - Store token in localStorage
   - Initialize Socket.IO after login
   - Build your UI with the endpoints above

---

## 📚 NEED MORE DETAILS?

- **Complete endpoints:** See `FRONTEND_INTEGRATION_GUIDE.md`
- **Quick reference:** See `API_QUICK_REFERENCE.md`
- **Full API docs:** See `API_DOCUMENTATION.md`
- **Test examples:** See `TEST_GUIDE.md`
- **Interactive testing:** Open http://localhost:3000/api-docs

---

## ✅ YOU'RE READY!

You now have everything you need:
- ✅ API is running on http://localhost:3000
- ✅ Database is seeded with test data
- ✅ Test credentials available
- ✅ Complete endpoint documentation
- ✅ Socket.IO for real-time updates
- ✅ Code examples in multiple formats
- ✅ HTML test client to see it working

**Start building your frontend app now!** 🎉

---

## 💡 TIPS

1. **Always check the token** - If you get 401, user needs to login again
2. **Use Socket.IO** - Don't poll for notifications, let Socket.IO push them to you
3. **Handle errors** - Wrap API calls in try-catch
4. **Show loading states** - API calls are async
5. **Cache user data** - Store user info in state/context after login
6. **Test with different roles** - Login as manager, teacher, and receptionist to see different permissions

Good luck! 🚀
