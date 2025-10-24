# Student Absence Management API

A comprehensive Express.js + MongoDB backend system for managing student attendance with role-based access control, real-time notifications via Socket.IO, and complete REST API.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- MongoDB >= 4.0

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp env.example .env

# 3. Start MongoDB (if not running)
sudo systemctl start mongodb

# 4. Seed the database with test data
npm run seed

# 5. Start the development server
npm run dev
```

### Access Points
- **API Server:** http://localhost:3000
- **API Documentation (Swagger):** http://localhost:3000/api-docs
- **Test Client:** Open `test-client.html` in your browser
- **Health Check:** http://localhost:3000/health

### Test Credentials
```
Manager:      manager@school.com      / password123
Teacher 1:    teacher1@school.com     / password123
Teacher 2:    teacher2@school.com     / password123
Receptionist: receptionist@school.com / password123
```

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| **FRONTEND_INTEGRATION_GUIDE.md** | Complete guide for frontend developers with all endpoints, examples, and Socket.IO setup |
| **API_QUICK_REFERENCE.md** | Quick reference cheat sheet for all endpoints |
| **API_DOCUMENTATION.md** | Detailed API documentation with data models and workflows |
| **TEST_GUIDE.md** | Testing guide with cURL, Postman, and Swagger examples |
| **test-client.html** | Live HTML/JavaScript test client |
| **test-api.rest** | VS Code REST Client test file |

---

## 🏗️ Architecture

### Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.IO
- **Security:** Helmet, CORS, Rate Limiting, XSS Protection
- **Documentation:** Swagger/OpenAPI
- **Logging:** Winston

### Project Structure
```
src/
├── app.js                 # Application entry point
├── config/               # Configuration files
│   ├── database.js       # MongoDB connection
│   ├── logger.js         # Winston logger setup
│   ├── socket.js         # Socket.IO configuration
│   └── swagger.js        # Swagger documentation setup
├── controllers/          # Route controllers
│   ├── authController.js
│   ├── classController.js
│   ├── notificationController.js
│   ├── studentController.js
│   └── userController.js
├── middleware/           # Custom middleware
│   ├── auth.js           # JWT authentication
│   ├── errorHandler.js   # Global error handling
│   ├── requestLogger.js  # Request logging
│   ├── security.js       # Security headers, rate limiting
│   └── validation.js     # Request validation
├── models/              # Mongoose models
│   ├── Class.js
│   ├── Notification.js
│   ├── Student.js
│   └── User.js
├── routes/              # Route definitions
│   ├── apiRoutes.js
│   ├── authRoutes.js
│   ├── classRoutes.js
│   ├── notificationRoutes.js
│   ├── studentRoutes.js
│   └── userRoutes.js
└── services/            # Business logic
    ├── classService.js
    ├── notificationService.js
    └── studentService.js
```

---

## 🔐 Authentication & Authorization

### User Roles
- **Manager:** Full access to all resources (CRUD on students, classes, users)
- **Teacher:** View classes, respond to notifications, send messages
- **Receptionist:** Send request notifications, view students and classes

### Authentication Flow
1. User logs in with email/password → receives JWT token
2. Token must be included in `Authorization: Bearer {token}` header
3. Middleware verifies token and user permissions for each request

---

## 📋 API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (Manager only)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-password` - Update password
- `POST /api/auth/forgot-password` - Forgot password
- `PUT /api/auth/reset-password/:token` - Reset password

### Students
- `GET /api/students` - Get all students (paginated)
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/class/:classId` - Get students by class
- `POST /api/students` - Create student (Manager only)
- `PUT /api/students/:id` - Update student (Manager only)
- `DELETE /api/students/:id` - Delete student (Manager only)

### Classes
- `GET /api/classes` - Get all classes (paginated)
- `GET /api/classes/:id` - Get class by ID
- `GET /api/classes/teacher/:teacherId` - Get classes by teacher
- `POST /api/classes` - Create class (Manager only)
- `PUT /api/classes/:id` - Update class (Manager only)
- `DELETE /api/classes/:id` - Delete class (Manager only)
- `POST /api/classes/:id/students` - Add student to class (Manager only)
- `DELETE /api/classes/:id/students/:studentId` - Remove student from class (Manager only)

### Notifications
- `GET /api/notifications` - Get my notifications
- `GET /api/notifications/:id` - Get notification by ID
- `GET /api/notifications/unread/count` - Get unread count
- `GET /api/notifications/student/:studentId` - Get by student
- `POST /api/notifications/request` - Send request (Receptionist only)
- `POST /api/notifications/message` - Send message (Teacher only)
- `PUT /api/notifications/:id/respond` - Respond (Teacher only)
- `PUT /api/notifications/:id/read` - Mark as read

### Users
- `GET /api/users/profile/me` - Get my profile
- `PUT /api/users/profile/me` - Update my profile
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

**📖 For complete endpoint details, see `FRONTEND_INTEGRATION_GUIDE.md`**

---

## 🔌 Real-Time Features (Socket.IO)

### Connection
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000', {
  auth: { userId: currentUser._id }
});
```

### Events
- `notification:new` - New notification received
- `notification:updated` - Notification updated (response received)
- `notification:read` - Notification marked as read

**📖 For complete Socket.IO integration, see `FRONTEND_INTEGRATION_GUIDE.md`**

---

## 🧪 Testing

### Run Database Seeding
```bash
npm run seed
```
This creates:
- 4 Users (1 manager, 2 teachers, 1 receptionist)
- 10 Students
- 3 Classes
- 2 Sample notifications

### Testing Options

#### 1. Swagger UI (Recommended)
1. Open http://localhost:3000/api-docs
2. Click "Authorize" button
3. Login to get token
4. Test any endpoint interactively

#### 2. HTML Test Client
1. Open `test-client.html` in your browser
2. Login with test credentials
3. Use quick actions or custom requests
4. See real-time notifications

#### 3. VS Code REST Client
1. Install REST Client extension
2. Open `test-api.rest`
3. Click "Send Request" above any endpoint

#### 4. cURL
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@school.com","password":"password123"}'

# Get students (replace TOKEN)
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛡️ Security Features

- **Helmet.js:** Security headers
- **CORS:** Cross-Origin Resource Sharing protection
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **JWT Authentication:** Secure token-based auth
- **Password Hashing:** bcrypt with salt rounds
- **Input Sanitization:** MongoDB injection prevention
- **XSS Protection:** Cross-site scripting prevention
- **HPP Protection:** HTTP Parameter Pollution prevention
- **Request Validation:** Express-validator for all inputs

---

## 📝 Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/studentAbsence

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRE=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (64+ characters)
- [ ] Configure production MongoDB URI
- [ ] Set appropriate CORS origins
- [ ] Configure SSL/TLS
- [ ] Set up process manager (PM2)
- [ ] Configure reverse proxy (Nginx)
- [ ] Enable MongoDB authentication
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Deploy with PM2
```bash
npm install -g pm2
pm2 start src/app.js --name student-absence-api
pm2 save
pm2 startup
```

---

## 📊 Database Models

### User
- name, email, password (hashed)
- role: manager | teacher | receptionist
- isActive, lastLogin

### Student
- studentCode (unique)
- nama (name)
- class (reference to Class)
- isActive, enrollmentDate

### Class
- name, description
- teacher (reference to User)
- students (array of Student references)
- capacity, isActive, startDate

### Notification
- from (User), to (User)
- student (Student), class (Class)
- type: request | response | message
- status: pending | approved | rejected | absent | present
- message, responseMessage
- isRead, requestDate, responseDate

---

## 🔄 Workflows

### Receptionist → Teacher Communication
1. Receptionist sends request about a student
2. Teacher receives real-time notification via Socket.IO
3. Teacher responds with status (present/absent)
4. Receptionist receives update via Socket.IO

### Teacher → Receptionist Communication
1. Teacher sends proactive message about a student
2. Receptionist receives real-time notification
3. Receptionist can view and mark as read

---

## 📖 Additional Documentation

# API Documentation

## Overview

This API provides a comprehensive system for managing students, classes, users, and notifications with role-based access control.

## Authentication

All endpoints (except auth endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## User Roles

- **Manager**: Can manage all resources (students, classes, users)
- **Teacher**: Can view classes they teach and respond to notifications
- **Receptionist**: Can send request notifications to teachers

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password

### User Endpoints

- `GET /api/users` - Get all users (Manager only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Manager only)
- `GET /api/users/profile/me` - Get current user profile
- `PUT /api/users/profile/me` - Update current user profile

### Student Endpoints

- `GET /api/students` - Get all students (with pagination)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student (Manager only)
- `PUT /api/students/:id` - Update student (Manager only)
- `DELETE /api/students/:id` - Delete student (Manager only)
- `GET /api/students/class/:classId` - Get students by class

### Class Endpoints

- `GET /api/classes` - Get all classes (with pagination)
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create new class (Manager only)
- `PUT /api/classes/:id` - Update class (Manager only)
- `DELETE /api/classes/:id` - Delete class (Manager only)
- `GET /api/classes/teacher/:teacherId` - Get classes by teacher
- `POST /api/classes/:id/students` - Add student to class (Manager only)
- `DELETE /api/classes/:id/students/:studentId` - Remove student from class (Manager only)

### Notification Endpoints

- `GET /api/notifications` - Get notifications for current user
- `GET /api/notifications/:id` - Get notification by ID
- `POST /api/notifications/request` - Send request to teacher (Receptionist only)
- `POST /api/notifications/message` - Teacher sends message to receptionist (Teacher only)
- `PUT /api/notifications/:id/respond` - Respond to notification (Teacher only)
- `PUT /api/notifications/:id/read` - Mark notification as read
- `GET /api/notifications/unread/count` - Get unread notification count
- `GET /api/notifications/student/:studentId` - Get notifications by student

## Data Models

### Student

```json
{
  "studentCode": "STU001",
  "nama": "John Doe",
  "class": "class_id",
  "isActive": true,
  "enrollmentDate": "2024-01-01T00:00:00.000Z"
}
```

### Class

```json
{
  "name": "Mathematics 101",
  "description": "Basic mathematics course",
  "teacher": "teacher_id",
  "students": ["student_id1", "student_id2"],
  "capacity": 30,
  "isActive": true,
  "startDate": "2024-01-01T00:00:00.000Z"
}
```

### User

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "teacher|manager|receptionist",
  "isActive": true,
  "lastLogin": "2024-01-01T00:00:00.000Z"
}
```

### Notification

```json
{
  "from": "user_id",
  "to": "user_id",
  "student": "student_id",
  "class": "class_id",
  "type": "request|response|message",
  "status": "pending|approved|rejected|absent|present",
  "message": "Request/Message content",
  "responseMessage": "Response message",
  "isRead": false,
  "requestDate": "2024-01-01T00:00:00.000Z",
  "responseDate": "2024-01-01T00:00:00.000Z"
}
```

## Workflow: Receptionist ↔ Teacher Communication

### A) Receptionist → Teacher (request/response)

```bash
POST /api/notifications/request
{
  "studentId": "student_id",
  "message": "Request for student information"
}
```

Teacher responds:

```bash
PUT /api/notifications/:id/respond
{
  "status": "present|absent|approved|rejected",
  "responseMessage": "Student is present in class"
}
```

### B) Teacher → Receptionist (message)

```bash
POST /api/notifications/message
Authorization: Bearer <teacher-token>
{
  "receptionistId": "user_id",
  "studentId": "student_id",
  "message": "Please send the student to the office"
}
```

## Query Parameters

### Pagination

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Filtering

- `class`: Filter students by class ID
- `teacher`: Filter classes by teacher ID
- `status`: Filter notifications by status
- `type`: Filter notifications by type

## Error Responses

All errors follow this format:

```json
{
  "status": "fail|error",
  "message": "Error description",
  "errors": []
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Example Usage

### Send Notification Request

```bash
POST /api/notifications/request
Authorization: Bearer <receptionist-token>
{
  "studentId": "student_id",
  "message": "Need to verify student attendance"
}
```

### Respond to Notification

```bash
PUT /api/notifications/notification_id/respond
Authorization: Bearer <teacher-token>
{
  "status": "present",
  "responseMessage": "Student is present in class"
}
```

### Teacher Message to Receptionist

```bash
POST /api/notifications/message
Authorization: Bearer <teacher-token>
{
  "receptionistId": "user_id",
  "studentId": "student_id",
  "message": "Please send the student to the office"
}
```

## WebSocket (Socket.IO)

Connection

- URL: same host as API
- Namespace: default (`/`)
- Room model: each user joins `user:{userId}` automatically on connect
- Authentication: pass `userId` in the `auth` payload (current implementation)

```javascript
import { io } from "socket.io-client";

// Using auth payload (recommended for this build)
const socket = io(BASE_URL, {
  auth: { userId: CURRENT_USER_ID },
});

socket.on("connect", () => {
  console.log("connected", socket.id);
});
```

Events emitted by server

- `notification:new`

  - When: receptionist sends request to teacher OR teacher sends message to receptionist
  - Payload:
    ```json
    {
      "id": "notification_id",
      "type": "request|message",
      "status": "pending",
      "student": { "id": "...", "studentCode": "STU001", "nama": "John Doe" },
      "class": { "id": "...", "name": "Class A" },
      "message": "...",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
    ```

- `notification:updated`

  - When: teacher responds to a receptionist request
  - Payload:
    ```json
    {
      "id": "notification_id",
      "status": "approved|rejected|absent|present",
      "responseMessage": "...",
      "responseDate": "2025-01-01T00:05:00.000Z"
    }
    ```

- `notification:read`
  - When: recipient opens/reads the notification; sent to the original sender
  - Payload:
    ```json
    {
      "id": "notification_id",
      "readBy": "user_id",
      "readAt": "2025-01-01T00:06:00.000Z"
    }
    ```

Client examples

```javascript
socket.on("notification:new", (evt) => {
  // update badge, show toast, refetch list, etc.
});

socket.on("notification:updated", (evt) => {
  // update the specific notification status in UI
});

socket.on("notification:read", (evt) => {
  // optionally mark sent notification as read in sender view
});
```

Notes

- Reconnection is handled by Socket.IO client by default.
- For production, consider authenticating sockets with JWT and deriving `userId` server-side during the handshake.
