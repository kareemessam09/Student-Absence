const swaggerJSDoc = require("swagger-jsdoc");

const servers = [
  {
    url: "/",
    description: "Current server",
  },
];

const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
  schemas: {
    User: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        role: { type: "string", enum: ["teacher", "manager", "receptionist"] },
        isActive: { type: "boolean" },
      },
    },
    Student: {
      type: "object",
      properties: {
        id: { type: "string" },
        studentCode: { type: "string" },
        nama: { type: "string" },
        class: { type: "string" },
        isActive: { type: "boolean" },
      },
    },
    Class: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        teacher: { type: "string" },
        capacity: { type: "integer" },
        isActive: { type: "boolean" },
      },
    },
    Notification: {
      type: "object",
      properties: {
        id: { type: "string" },
        from: { type: "string" },
        to: { type: "string" },
        student: { type: "string" },
        class: { type: "string" },
        type: { type: "string", enum: ["request", "response", "message"] },
        status: {
          type: "string",
          enum: ["pending", "approved", "rejected", "absent", "present"],
        },
        message: { type: "string" },
        responseMessage: { type: "string" },
        isRead: { type: "boolean" },
        requestDate: { type: "string", format: "date-time" },
        responseDate: { type: "string", format: "date-time" },
      },
    },
  },
};

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Abscent API",
      version: "1.0.0",
      description:
        "API for managing students, classes, users, and notifications",
    },
    servers,
    components,
    security: [{ bearerAuth: [] }],
    paths: {
      "/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          responses: {
            200: { description: "Server is running" },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    password: { type: "string" },
                    confirmPassword: { type: "string" },
                    role: {
                      type: "string",
                      enum: ["teacher", "manager", "receptionist"],
                    },
                  },
                  required: ["name", "email", "password", "confirmPassword"],
                },
              },
            },
          },
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                  required: ["email", "password"],
                },
              },
            },
          },
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "List users (admin/manager)",
          parameters: [
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Get user",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "OK" },
            404: { description: "Not Found" },
          },
        },
        put: {
          tags: ["Users"],
          summary: "Update user",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
        delete: {
          tags: ["Users"],
          summary: "Delete user",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/students": {
        get: {
          tags: ["Students"],
          summary: "List students",
          parameters: [
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
            { in: "query", name: "class", schema: { type: "string" } },
          ],
          responses: { 200: { description: "OK" } },
        },
        post: {
          tags: ["Students"],
          summary: "Create student (manager)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    studentCode: { type: "string" },
                    nama: { type: "string" },
                    class: { type: "string" },
                  },
                  required: ["studentCode", "nama", "class"],
                },
              },
            },
          },
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/students/{id}": {
        get: {
          tags: ["Students"],
          summary: "Get student",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "OK" },
            404: { description: "Not Found" },
          },
        },
        put: {
          tags: ["Students"],
          summary: "Update student (manager)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
        delete: {
          tags: ["Students"],
          summary: "Delete student (manager)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/students/class/{classId}": {
        get: {
          tags: ["Students"],
          summary: "Get students by class",
          parameters: [
            {
              in: "path",
              name: "classId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/classes": {
        get: {
          tags: ["Classes"],
          summary: "List classes",
          parameters: [
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
            { in: "query", name: "teacher", schema: { type: "string" } },
          ],
          responses: { 200: { description: "OK" } },
        },
        post: {
          tags: ["Classes"],
          summary: "Create class (manager)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    teacher: { type: "string" },
                    capacity: { type: "integer" },
                  },
                  required: ["name", "teacher"],
                },
              },
            },
          },
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/classes/{id}": {
        get: {
          tags: ["Classes"],
          summary: "Get class",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "OK" },
            404: { description: "Not Found" },
          },
        },
        put: {
          tags: ["Classes"],
          summary: "Update class (manager)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
        delete: {
          tags: ["Classes"],
          summary: "Delete class (manager)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/classes/teacher/{teacherId}": {
        get: {
          tags: ["Classes"],
          summary: "Get classes by teacher",
          parameters: [
            {
              in: "path",
              name: "teacherId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/classes/{id}/students": {
        post: {
          tags: ["Classes"],
          summary: "Add student to class (manager)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { studentId: { type: "string" } },
                  required: ["studentId"],
                },
              },
            },
          },
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/classes/{id}/students/{studentId}": {
        delete: {
          tags: ["Classes"],
          summary: "Remove student from class (manager)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "studentId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/notifications": {
        get: {
          tags: ["Notifications"],
          summary: "List notifications for current user",
          parameters: [
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
            { in: "query", name: "status", schema: { type: "string" } },
            { in: "query", name: "type", schema: { type: "string" } },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/notifications/request": {
        post: {
          tags: ["Notifications"],
          summary: "Receptionist sends request to class teacher",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    studentId: { type: "string" },
                    message: { type: "string" },
                  },
                  required: ["studentId"],
                },
              },
            },
          },
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/notifications/message": {
        post: {
          tags: ["Notifications"],
          summary: "Teacher sends message to receptionist",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    receptionistId: { type: "string" },
                    studentId: { type: "string" },
                    message: { type: "string" },
                  },
                  required: ["receptionistId", "studentId"],
                },
              },
            },
          },
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/notifications/{id}/respond": {
        put: {
          tags: ["Notifications"],
          summary: "Teacher responds to a notification",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    responseMessage: { type: "string" },
                  },
                  required: ["status"],
                },
              },
            },
          },
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/notifications/{id}/read": {
        put: {
          tags: ["Notifications"],
          summary: "Mark notification as read",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/notifications/unread/count": {
        get: {
          tags: ["Notifications"],
          summary: "Get unread notifications count",
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/notifications/student/{studentId}": {
        get: {
          tags: ["Notifications"],
          summary: "List notifications by student",
          parameters: [
            {
              in: "path",
              name: "studentId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
