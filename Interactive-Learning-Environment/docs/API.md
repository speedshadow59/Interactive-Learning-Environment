# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "grade": 8
}

Response (201):
{
  "message": "User registered successfully",
  "user": { ... },
  "token": "jwt_token_here"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "message": "Login successful",
  "user": { ... },
  "token": "jwt_token_here"
}
```

### Users

#### Get Profile
```
GET /users/profile
Authorization: Bearer <token>

Response (200):
{
  "_id": "user_id",
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "grade": 8,
  ...
}
```

#### Update Profile
```
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Learning to code!",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}

Response (200):
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

### Courses

#### Get All Courses
```
GET /courses?difficulty=beginner&targetGrade=7

Response (200):
[
  {
    "_id": "course_id",
    "title": "Introduction to Python",
    "description": "Learn Python basics",
    "difficulty": "beginner",
    "instructor": { ... },
    "enrolledStudents": [...],
    ...
  }
]
```

#### Get Course Details
```
GET /courses/:courseId

Response (200):
{
  "_id": "course_id",
  "title": "Introduction to Python",
  ...
  "challenges": [...]
}
```

#### Create Course
```
POST /courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Introduction to Python",
  "description": "Learn Python basics",
  "targetGrades": [7, 8, 9],
  "difficulty": "beginner",
  "topics": ["variables", "loops", "functions"]
}

Response (201):
{
  "message": "Course created successfully",
  "course": { ... }
}
```

#### Enroll in Course
```
POST /courses/:courseId/enroll
Authorization: Bearer <token>

Response (200):
{
  "message": "Enrolled successfully",
  "course": { ... }
}
```

### Challenges

#### Get Course Challenges
```
GET /challenges/course/:courseId

Response (200):
[
  {
    "_id": "challenge_id",
    "title": "Hello World",
    "description": "Write your first program",
    "difficulty": "easy",
    "instructions": "...",
    ...
  }
]
```

#### Get Challenge Details
```
GET /challenges/:challengeId

Response (200):
{
  "_id": "challenge_id",
  "title": "Hello World",
  ...
}
```

#### Create Challenge
```
POST /challenges
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Hello World",
  "description": "Write your first program",
  "course": "course_id",
  "difficulty": "easy",
  "instructions": "Write a program that prints 'Hello, World!'",
  "testCases": [
    {
      "input": "",
      "expectedOutput": "Hello, World!",
      "description": "Should print Hello, World!"
    }
  ],
  "gamificationPoints": 100
}

Response (201):
{
  "message": "Challenge created successfully",
  "challenge": { ... }
}
```

### Submissions

#### Submit Code
```
POST /submissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "challenge": "challenge_id",
  "course": "course_id",
  "code": "console.log('Hello, World!');",
  "language": "javascript"
}

Response (201):
{
  "message": "Submission received",
  "submission": { ... }
}
```

#### Get Student Submissions
```

#### Get Course Submissions (Teacher/Admin)
```
GET /submissions/course/:courseId
Authorization: Bearer <token>

Response (200):
{
  "submissions": [
    {
      "_id": "submission_id",
      "student": { "firstName": "Alice", "lastName": "Smith", "email": "alice@student.edu" },
      "challenge": { "title": "Loop Basics", "difficulty": "easy" },
      "result": "passed",
      "feedback": "Great loop usage",
      "submittedAt": "2026-02-18T10:00:00.000Z"
    }
  ]
}
```

#### Add/Update Submission Feedback (Teacher/Admin)
```
PATCH /submissions/:submissionId/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "feedback": "Nice approach. Add comments to explain your logic."
}

Response (200):
{
  "message": "Feedback saved",
  "submission": { ... }
}
```
GET /submissions/student/:studentId
Authorization: Bearer <token>

Response (200):
[
  {
    "_id": "submission_id",
    "student": { ... },
    "challenge": { ... },
    "result": "passed",
    "testsPassed": 3,
    "totalTests": 3,
    ...
  }
]
```

### Progress

#### Get Student Progress
```
GET /progress/student/:studentId/course/:courseId
Authorization: Bearer <token>

Response (200):
{
  "_id": "progress_id",
  "student": "student_id",
  "course": "course_id",
  "completedChallenges": [...],
  "totalPoints": 500,
  "currentLevel": 3,
  ...
}
```

#### Update Progress
```
PUT /progress/student/:studentId/course/:courseId
Authorization: Bearer <token>
Content-Type: application/json

{
  "challengeId": "challenge_id",
  "pointsEarned": 100
}

Response (200):
{
  "message": "Progress updated",
  "progress": { ... }
}
```

### Dashboard

#### Student Dashboard
```
GET /dashboard/student
Authorization: Bearer <token>

Response (200):
{
  "user": { ... },
  "enrolledCourses": [...],
  "totalPoints": 500,
  "progressByCourse": [...]
}
```

#### Teacher Dashboard
```

#### Teacher Analytics Summary
```
GET /dashboard/teacher/analytics
Authorization: Bearer <token>

Response (200):
{
  "summary": {
    "totalCourses": 3,
    "totalStudents": 28,
    "totalAssignments": 12,
    "overdueAssignments": 2,
    "totalSubmissions": 140,
    "passRate": 84
  },
  "courseBreakdown": [
    {
      "id": "course_id",
      "title": "Python Basics",
      "enrolledCount": 10,
      "totalSubmissions": 40,
      "passRate": 88,
      "averagePoints": 420,
      "completedChallenges": 24,
      "isPublished": true
    }
  ]
}
```

#### Teacher Analytics CSV Export
```
GET /dashboard/teacher/export.csv
Authorization: Bearer <token>

Response (200): text/csv download
```
GET /dashboard/teacher
Authorization: Bearer <token>

Response (200):
{
  "totalCourses": 5,
  "totalStudents": 45,
  "courses": [...]
}
```

#### Student Analytics (Teacher)
```

### Assignments

#### Get Assignment Form Options (Teacher/Admin)
```
GET /assignments/teacher/options
Authorization: Bearer <token>

Response (200):
{
  "courses": [
    {
      "id": "course_id",
      "title": "Python Basics",
      "challenges": [{ "id": "challenge_id", "title": "Variables" }],
      "students": [{ "id": "student_id", "name": "Alice Smith", "email": "alice@student.edu" }]
    }
  ]
}
```

#### Create Assignment (Teacher/Admin)
```
POST /assignments
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Homework 1",
  "description": "Complete loop challenge",
  "courseId": "course_id",
  "challengeId": "challenge_id",
  "dueDate": "2026-02-28T18:00:00.000Z",
  "assignedTo": ["student_id_1", "student_id_2"]
}

Response (201):
{
  "message": "Assignment created",
  "assignment": { ... }
}
```

#### Get Teacher Assignments with Tracking
```
GET /assignments/teacher
Authorization: Bearer <token>

Response (200):
{
  "assignments": [
    {
      "id": "assignment_id",
      "title": "Homework 1",
      "courseTitle": "Python Basics",
      "challengeTitle": "Loops",
      "assignedCount": 20,
      "submittedCount": 14,
      "lateCount": 2,
      "missingCount": 4,
      "pendingCount": 6,
      "isOverdue": false,
      "missingStudentNames": ["Student A", "Student B"],
      "pendingStudentNames": ["Student C"]
    }
  ]
}
```

#### Get Student Assignments
```
GET /assignments/student
Authorization: Bearer <token>

Response (200):
{
  "assignments": [
    {
      "id": "assignment_id",
      "title": "Homework 1",
      "courseTitle": "Python Basics",
      "challengeTitle": "Loops",
      "dueDate": "2026-02-28T18:00:00.000Z",
      "status": "pending"
    }
  ]
}
```
GET /dashboard/student/:studentId
Authorization: Bearer <token>

Response (200):
{
  "student": { ... },
  "totalSubmissions": 42,
  "passedSubmissions": 38,
  "averageScore": 90.5,
  "progress": [...]
}
```

## Error Responses

```json
{
  "message": "Error description",
  "error": {}
}
```

### Common Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
