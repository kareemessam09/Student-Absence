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

Connect to the server using Socket.IO client and pass `userId` in `auth` (preferred) or query:

```javascript
const socket = io(BASE_URL, { auth: { userId: CURRENT_USER_ID } });
```

Events emitted by server:

- `notification:new` (to teacher when receptionist sends request; to receptionist when teacher sends message)
  - Payload: `{ id, type, status, student: { id, studentCode, nama }, class: { id, name }, message, createdAt }`
- `notification:updated` (to requester when recipient responds)
  - Payload: `{ id, status, responseMessage, responseDate }`
- `notification:read` (to sender when recipient reads)
  - Payload: `{ id, readBy, readAt }`
