# Requirements Analysis

## Functional Requirements

### User Management
- **FR1**: Users can register with role selection (student/teacher)
- **FR2**: Users can login with email and password
- **FR3**: Users can create and manage their profiles
- **FR4**: Students can view their progress and achievements
- **FR5**: Teachers can manage student rosters

### Course Management
- **FR6**: Teachers can create and publish courses
- **FR7**: Courses can be organized by difficulty level and target grade
- **FR8**: Students can enroll in available courses
- **FR9**: Courses contain ordered lessons and challenges

### Challenge System
- **FR10**: Challenges support block-based programming interface
- **FR11**: Challenges include test cases for validation
- **FR12**: Challenges provide hints and guidance
- **FR13**: Multiple programming languages supported (JavaScript, Python)
- **FR14**: Real-time code execution and feedback

### Progress Tracking
- **FR15**: System tracks student completion of challenges
- **FR16**: Points are awarded for successful submissions
- **FR17**: First-attempt completion tracked separately
- **FR18**: Time spent on challenges is recorded

### Gamification
- **FR19**: Students earn points for completing challenges
- **FR20**: Badges awarded for achievements
- **FR21**: Leaderboards display top performers
- **FR22**: Experience points contribute to level progression

### Teacher Dashboard
- **FR23**: Teachers can view student progress analytics
- **FR24**: Teachers can generate progress reports
- **FR25**: Teachers can provide feedback on submissions
- **FR26**: Analytics show completion rates and performance trends

### Adaptive Learning
- **FR27**: System recommends challenges based on performance
- **FR28**: Difficulty adapts to student skill level
- **FR29**: Learning path adjusts based on progress
- **FR30**: System identifies struggling students for intervention

## Non-Functional Requirements

### Performance
- **NFR1**: Page load time < 2 seconds
- **NFR2**: API response time < 500ms
- **NFR3**: Support 10,000 concurrent users
- **NFR4**: Code execution timeout: 5 seconds per test

### Security
- **NFR5**: Password hashing with bcrypt
- **NFR6**: JWT token-based authentication
- **NFR7**: HTTPS/TLS encryption
- **NFR8**: Input validation and sanitization
- **NFR9**: Role-based access control

### Usability
- **NFR10**: Mobile-responsive design
- **NFR11**: Accessibility (WCAG 2.1 AA)
- **NFR12**: Intuitive user interface
- **NFR13**: Clear error messages
- **NFR14**: Help documentation available

### Reliability
- **NFR15**: 99.5% uptime SLA
- **NFR16**: Automated backups daily
- **NFR17**: Error logging and monitoring
- **NFR18**: Graceful error handling

### Scalability
- **NFR19**: Horizontal scaling capability
- **NFR20**: Database replication for high availability
- **NFR21**: CDN for static assets
- **NFR22**: Caching strategy for frequently accessed data

## Technical Requirements

- Node.js backend with Express
- React frontend with responsive design
- MongoDB for data persistence
- JWT for authentication
- Docker containerization
- RESTful API architecture
- Continuous Integration/Deployment ready

## AT2 Evidence Matrix (Current Build)

| Requirement | Status | Implementation Evidence |
| --- | --- | --- |
| FR1-FR2 Registration/Login | ✅ | `backend/src/controllers/authController.js`, `backend/src/routes/authRoutes.js`, `frontend/src/pages/LoginPage.js`, `frontend/src/pages/RegisterPage.js` |
| FR4 Student progress view | ✅ | `GET /dashboard/student`, `frontend/src/pages/StudentDashboard.js` |
| FR6-FR9 Course management/enrolment | ✅ | `backend/src/routes/courseRoutes.js`, `frontend/src/pages/TeacherDashboard.js`, `frontend/src/pages/CoursesPage.js` |
| FR10-FR14 Challenge + block/text coding + execution | ✅ | `frontend/src/components/BlockEditor.js`, `backend/src/routes/challengeRoutes.js`, `backend/src/routes/executeRoutes.js` |
| FR15-FR18 Progress tracking + points/time | ✅ | `backend/src/models/Progress.js`, `backend/src/models/Submission.js`, `backend/src/routes/progressRoutes.js` |
| FR19-FR20 Gamification badges/points | ✅ | `backend/src/models/Badge.js`, `backend/src/routes/badgeRoutes.js`, `frontend/src/components/BadgesDisplay.js` |
| FR23 Teacher analytics dashboard | ✅ | `GET /dashboard/teacher`, `GET /dashboard/teacher/analytics`, `frontend/src/pages/TeacherDashboard.js` |
| FR24 Progress report export | ✅ | `GET /dashboard/teacher/export.csv`, Teacher dashboard Export button |
| FR25 Teacher feedback on submissions | ✅ | `PATCH /submissions/:id/feedback`, `GET /submissions/course/:courseId` in `backend/src/routes/submissionRoutes.js` |
| FR26 Performance/completion trends | ✅ | Per-course pass rate and completion metrics in `GET /dashboard/teacher/analytics` |
| Objective 3 Assignment workflow with deadlines | ✅ | `backend/src/models/Assignment.js`, `backend/src/routes/assignmentRoutes.js`, `frontend/src/pages/TeacherDashboard.js`, `frontend/src/pages/StudentDashboard.js` |
| NFR5-NFR6 Auth security | ✅ | bcrypt hashing + JWT in auth controller and middleware |
| NFR8-NFR9 Input sanitization + RBAC | ✅ | `backend/src/middleware/errorHandler.js`, role checks across routes |
| NFR11 Accessibility WCAG 2.1 AA | ✅ | `frontend/src/components/AccessibilityPanel.js`, `frontend/src/styles/Accessibility.css` |
| NFR13 Clear error messages | ✅ | Consistent API and UI error handling in route responses and dashboards |
| NFR17-NFR18 Logging and graceful errors | ✅ | Centralized error middleware in `backend/src/middleware/errorHandler.js` |

### Remaining Priority Items

- FR5 Teacher roster management UI can be expanded with class grouping views and filters.
- FR21 Leaderboard remains optional in current AT2 scope and can be added as stretch.
- Formal validation evidence still required: user testing rounds, accessibility audit output, and load/security testing reports.
