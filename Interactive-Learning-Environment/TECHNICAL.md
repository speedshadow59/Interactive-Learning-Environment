# Interactive Learning Platform - Technical Documentation

## Architecture Overview

This project is a web-based interactive programming platform designed for primary and secondary school students. It follows a three-tier architecture as specified in the AT2 report.

### Technology Stack

**Note:** The prototype uses Node.js/Express instead of Flask/Python for the backend. This decision was made to:
- Leverage existing React frontend skills for full-stack JavaScript development
- Enable faster development in a solo project context
- Utilize the NPM ecosystem for rapid iteration
- Plan PostgreSQL migration path for scalability

Future production deployments should consider the Flask/Python backend specified in the AT2 report for better alignment with educational computing standards.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  - Block-based coding interface                            │
│  - Student dashboard                                       │
│  - Teacher dashboard                                       │
│  - Interactive lessons                                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────────────┐
│                  Backend (Express.js)                       │
│  - Authentication & Authorization                          │
│  - Block-to-Python code conversion                         │
│  - Adaptive learning logic                                 │
│  - Progress tracking                                       │
│  - GDPR-compliant data handling                           │
└────────────────────┬────────────────────────────────────────┘
                     │ Database Driver
┌────────────────────▼────────────────────────────────────────┐
│           Database (MongoDB - Prototype)                    │
│  - Users (students & teachers)                             │
│  - Courses & Lessons                                       │
│  - Challenges                                              │
│  - Progress records                                        │
│  - Submissions                                             │
│  - Badges & Gamification data                             │
└─────────────────────────────────────────────────────────────┘
```

**Future Architecture (Production):**
- Backend: Flask/Python
- Database: PostgreSQL
- Deploy with Docker, Kubernetes for scalability

## Core Features Implementation

### 1. Block-Based Programming Interface
- Located: `frontend/src/components/BlockEditor.js`
- Provides drag-and-drop visual programming blocks
- Supports both JavaScript and Python block templates
- Real-time code preview generation
- Immediate feedback on block placement and parameters

### 2. Block-to-Text Code Transition
- Seamless toggle between block mode and text-based code mode
- Converts block structures to valid JavaScript/Python
- Students can learn syntax gradually
- Code editor shows generated code in real-time

### 3. Student Dashboard
- Located: `frontend/src/pages/StudentDashboard.js`
- View enrolled courses
- Track progress per course
- Display earned badges
- See challenge completion status
- View performance analytics

### 4. Teacher Dashboard
- Located: `frontend/src/pages/TeacherDashboard.js`
- Monitor class progress
- View individual student metrics
- Set and manage assignments (in development)
- Export progress reports (implementation pending)
- Class overview with performance analytics

### 5. Gamification System
- Badge system for achievement recognition
- Points awarded for challenge completion
- Difficulty-based scoring (easy=50pts, medium=75pts, hard=100pts)
- Progress visualization
- Motivational feedback

### 6. Adaptive Learning
- Difficulty adjustment based on performance
- Hint system that provides guidance
- Progressive complexity in challenges
- Personalized learning paths (implementation in progress)

### 7. Authentication & Authorization
- Student and teacher role-based access
- Secure password hashing with bcryptjs
- JWT token-based authentication
- Rate limiting on login attempts (production)
- Session management

### 8. Data Protection (GDPR Compliance)
- Minimal data collection (username, email, progress only)
- Password hashing (bcryptjs with salt)
- Secure transmission (HTTPS in production)
- User data export capability (implementation pending)
- Data deletion on request (implementation pending)
- Clear privacy policy required before signup

## Database Schema

### Users Collection
```javascript
{
  username: String (unique, min 3 chars),
  email: String (unique, validated),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String (enum: 'student', 'teacher', 'admin'),
  grade: Number (1-13 for students),
  school: String,
  avatar: String,
  bio: String,
  preferences: {
    theme: String (light/dark),
    notifications: Boolean,
    language: String
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Courses Collection
```javascript
{
  title: String,
  description: String,
  instructor: ObjectId (ref: User),
  targetGrades: [Number],
  difficulty: String (beginner/intermediate/advanced),
  topics: [String],
  challenges: [ObjectId] (ref: Challenge),
  enrolledStudents: [ObjectId] (ref: User),
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Challenges Collection
```javascript
{
  title: String,
  description: String,
  course: ObjectId (ref: Course),
  difficulty: String (easy/medium/hard),
  objectives: [String],
  instructions: String,
  initialCode: String,
  expectedOutput: String,
  testCases: [{ input, expectedOutput, description }],
  hints: [String],
  gamificationPoints: Number,
  isBlockBased: Boolean,
  blocklyXml: String,
  isProgrammingChallenge: Boolean,
  isPublished: Boolean,
  createdBy: ObjectId (ref: User),
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Progress Collection
```javascript
{
  student: ObjectId (ref: User),
  course: ObjectId (ref: Course),
  challengesCompleted: [ObjectId] (ref: Challenge),
  totalPoints: Number,
  completionPercentage: Number,
  lastAccessedAt: Date,
  startedAt: Date,
  completedAt: Date,
  badges: [ObjectId] (ref: Badge)
}
```

### Submissions Collection
```javascript
{
  student: ObjectId (ref: User),
  challenge: ObjectId (ref: Challenge),
  course: ObjectId (ref: Course),
  code: String,
  language: String (javascript/python),
  result: String (pending/passed/failed),
  feedback: String,
  submittedAt: Date,
  executionTime: Number,
  errorLog: String
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/users/profile` - Get current user profile

### Courses
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get specific course
- `POST /api/courses/:id/enroll` - Enroll in course
- `PUT /api/courses/:id` - Update course (teacher only)

### Challenges
- `GET /api/challenges/:id` - Get challenge details
- `POST /api/challenges` - Create challenge (teacher only)

### Submissions
- `POST /api/submissions` - Submit solution
- `GET /api/submissions/:id` - Get submission details

### Progress
- `GET /api/progress/student/:id/course/:courseId` - Get student progress
- `PUT /api/progress/student/:id/course/:courseId` - Update progress

### Dashboard
- `GET /api/dashboard/student` - Student dashboard data
- `GET /api/dashboard/teacher` - Teacher dashboard data

### Badges
- `GET /api/badges` - Get all badges
- `GET /api/badges/student/:id` - Get student badges

## Security Measures

### Implemented
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ Input validation with Joi
- ✅ CORS configuration
- ✅ Authentication middleware
- ✅ Role-based access control

### TODO (Production)
- [ ] HTTPS/SSL enforcement
- [ ] Rate limiting on API endpoints
- [ ] CSRF token protection
- [ ] SQL injection prevention (MongoDB injection for current stack)
- [ ] XSS prevention headers
- [ ] Security audit logging
- [ ] Two-factor authentication
- [ ] Session timeout management

## Performance Optimization

### Target Metrics
- Load time: < 3 seconds on low-spec devices
- Time to Interactive (TTI): < 5 seconds
- First Contentful Paint (FCP): < 2 seconds
- Lighthouse score: > 80

### Implemented Optimizations
- ✅ Docker containerization for consistent performance
- ✅ Minimal CSS/JS bundle sizes
- ✅ Responsive design for various screen sizes
- ✅ Efficient React component rendering

### TODO
- [ ] Code splitting and lazy loading
- [ ] Image optimization and compression
- [ ] Service worker for offline capability
- [ ] CDN integration for static assets
- [ ] Database query optimization
- [ ] Caching strategies (Redis)
- [ ] Regular performance monitoring

## Accessibility (WCAG 2.1 AA)

### Implemented
- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy
- ✅ Alt text for images (visual elements)
- ✅ Color contrast ratios compliant
- ✅ Keyboard navigation support
- ✅ Mobile/responsive design
- ✅ Form labels and validation
- ✅ Accessibility panel with high contrast mode
- ✅ Text size adjustment (75-200%)
- ✅ Screen reader optimizations
- ✅ Keyboard shortcuts for accessibility features

### Accessibility Features
- **AccessibilityPanel Component** - Global accessibility controls
  - High contrast mode toggle (black background, white text, 21:1 contrast)
  - Text size adjustment with keyboard shortcuts (Alt+/Alt--)
  - Screen reader announcements using ARIA live regions
  - Keyboard shortcuts for all major features
  - Settings persisted in localStorage

- **Keyboard Navigation**
  - Tab navigation through all interactive elements
  - Alt+A: Toggle accessibility panel
  - Alt+H: Toggle high contrast
  - Alt++: Increase text size
  - Alt+-: Decrease text size
  - Alt+R: Reset settings
  - Enter/Space: Activate buttons
  - Arrow keys: Navigate lists

- **Screen Reader Support**
  - ARIA roles on custom components
  - aria-label on icon-only buttons
  - aria-live regions for announcements
  - aria-describedby on settings
  - Semantic HTML for automatic roles

### TODO
- [ ] Comprehensive accessibility audit with automated tools
- [ ] Screen reader testing with NVDA/JAWS
- [ ] Dyslexia-friendly font options (OpenDyslexic)
- [ ] Reduced motion preferences (prefers-reduced-motion)
- [ ] ARIA labels on block editor components
- [ ] Focus indicator customization
- [ ] Language/translation support

## Error Handling & Logging

### Backend Error Handling Middleware
```javascript
// Centralized error management:
- AppError class for operational errors
- Automatic error type detection (CastError, ValidationError, etc.)
- User-friendly error messages
- Stack traces in development only
- HTTP status code mapping
- Request context logging (path, method, user)
```

### Error Types Handled
- **CastError**: Invalid MongoDB ObjectIds
- **ValidationError**: Mongoose schema validation
- **JsonWebTokenError**: Invalid JWT tokens
- **TokenExpiredError**: Expired authentication tokens
- **Duplicate Key Error**: Unique constraint violations

### Logging Strategy
```
Development: Full error details, stack traces
Production: User-friendly messages, error reference IDs
Audit Trail: GDPR-relevant actions logged with timestamp and user ID
```

### Features
- ✅ Comprehensive error handling middleware
- ✅ Input sanitization to prevent XSS
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ GDPR-compliant logging
- ✅ Async/await error wrapping

### TODO
- [ ] Error tracking service (Sentry)
- [ ] Detailed error analytics dashboard
- [ ] Automated alerting on critical errors
- [ ] Error recovery suggestions
- [ ] User-facing error feedback forms

## GDPR Compliance & Data Protection

### Privacy Routes (`/api/privacy`)

#### `GET /api/privacy/profile`
Returns user's currently stored personal data following GDPR Article 15 (Right of Access)
```json
{
  "personalData": {
    "id": "user_id",
    "email": "user@school.edu",
    "name": "John Doe",
    "role": "student",
    "createdAt": "2025-01-15T10:00:00Z",
    "lastLogin": "2025-01-20T14:30:00Z"
  },
  "enrollments": [],
  "teachingCourses": [],
  "points": 250,
  "badges": []
}
```

#### `POST /api/privacy/export`
Exports all user data as JSON with 30-day expiry (GDPR Article 20 - Right to Data Portability)
- File format: JSON with timestamp and expiry date
- Data included: Personal data, courses, badges, consent records
- File name: `user-data-{userId}-{timestamp}.json`

#### `POST /api/privacy/delete-request`
Initiates account deletion with 30-day grace period (GDPR Article 17 - Right to be Forgotten)
- Sets `deletionScheduled` with grace period
- Immediately deactivates account
- Returns cancellation window and cancel URL

#### `POST /api/privacy/cancel-deletion`
Cancels pending deletion during grace period

#### `POST /api/privacy/consent`
Updates privacy consent preferences (GDPR Article 6 - Lawful Basis: Consent)
- Marketing emails opt-in/out
- Analytics tracking opt-in/out
- Third-party data sharing opt-in/out
- Timestamp recorded for audit trail

#### `GET /api/privacy/policy`
Returns comprehensive privacy policy document

### GDPR Implementation Details

**Data Collection**
- Minimal collection: Only what's necessary for platform operation
- Email, name, grade, password hash
- Learning progress and submissions
- Optional: Avatar, preferences

**Data Storage**
- All passwords hashed with bcryptjs (10 salt rounds)
- Sensitive data encrypted in transit (HTTPS)
- Database access restricted to application layer
- Audit logging for all data access

**Retention Policy**
- Active accounts: Data retained while account active
- Deleted accounts: Purged within 30 days
- Educational records: 7 years per school policy
- Audit logs: 90 days for security
- Session logs: Cleared daily

**User Data Model Fields** (in User schema)
```javascript
privacyConsent: {
  marketingEmails: Boolean,
  analyticsTracking: Boolean,
  thirdPartySharing: Boolean,
  updatedAt: Date
},
lastLogin: Date,
deletionScheduled: {
  requestedAt: Date,
  deleteAt: Date,
  gracePeriodDays: Number
},
isActive: Boolean
```

**Security Headers**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

**Input Sanitization**
- XSS prevention: Strip HTML tags, remove javascript: protocol
- Injection prevention: Validate all inputs
- Rate limiting: Exponential backoff on failed attempts

### Compliance Checklist
- ✅ Right of Access (Article 15) - Export endpoint
- ✅ Right to Rectification (Article 16) - Profile update
- ✅ Right to Erasure (Article 17) - Delete request with grace period
- ✅ Right to Data Portability (Article 20) - JSON export
- ✅ Right to Object (Article 21) - Consent management
- ✅ Data Protection by Design (Article 25)
  - Minimal data collection
  - Secure password hashing
  - Encryption in transit
- ✅ Consent Management (Article 6)
  - Explicit opt-in for non-essential processing
  - Timestamp recording
  - Easy withdrawal mechanism
- ✅ Privacy Policy (Article 13/14) - Comprehensive document
- ✅ Audit Logging (Recital 32)
  - GDPR-relevant actions logged
  - Timestamps and user IDs recorded

### TODO
- [ ] Data Processing Agreement (DPA) with school
- [ ] Privacy by Design documentation
- [ ] Formal privacy impact assessment
- [ ] Third-party processor agreements
- [ ] Breach notification procedures
- [ ] Parental consent workflows for under-13s
- [ ] Data retention automation scripts

## Testing & Evaluation Plan

### Test Coverage (6 Test Cases per AT2)

**Test Case 1: Block-Based Interface (Objective 1)**
- User can create visual block program
- Blocks can be rearranged in sequence
- Code generation from blocks works correctly
- All block types (Print, Variable, If, For, Function) available
- Blocks accept parameters

**Test Case 2: Python Conversion & Execution (Objective 2)**
- Block program converts to syntactically correct Python
- Generated Python executes and produces expected output
- Execution handles edge cases (zero, empty strings, arrays)
- Test coverage:
  - Arithmetic operations
  - String manipulation
  - Conditional logic
  - Loop structures
  - Function definitions

**Test Case 3: Teacher Features & Analytics (Objective 3)**
- Teacher can view class progress (average %)
- Teacher can track individual student metrics
- Teacher can assign challenges to students/groups
- Teacher can export student data (CSV/PDF)
- Teacher dashboard shows:
  - Class average completion rate
  - Individual student scores
  - Challenge difficulty distribution
  - Time spent per student

**Test Case 4: User Engagement & Motivation (Objective 4)**
- Students earn badges for achievements
- Points system correctly awards progress
- Difficulty level adjusts based on performance
- Leaderboards display correctly (optional)
- Streak tracking and bonuses work
- Success metric: 70%+ challenge completion rate

**Test Case 5: Platform Usability (Objective 5)**
- All buttons have appropriate aria-labels
- Color contrast meets WCAG AA standards (4.5:1 minimum)
- Keyboard navigation works (Tab, Enter, Arrow keys)
- Text can be resized (75% - 200%)
- High contrast mode functional
- Responsive on mobile (320px - 1920px)

**Test Case 6: Data Protection & Security (Objective 6)**
- User data export available and complete
- Account deletion request with 30-day grace period
- Privacy consent changes logged with timestamps
- Passwords stored as bcrypt hashes (verified: not plain text)
- No SQL injection vulnerabilities
- No XSS vulnerabilities
- Rate limiting prevents brute force (max 5 login attempts per minute)

### Unit Testing
- Block-to-Python code conversion logic
- Badge earning calculations
- Points/streak system
- Password hashing and comparison
- JWT token generation and validation
- User authentication flow
- Test file: `backend/tests/test.spec.js`

### Integration Testing
- User registration → Login → Dashboard flow
- Enroll in course → View lessons → Submit challenge → Earn badge
- Teacher assign challenge → Student submit → Teacher review
- Privacy export functionality
- Data deletion completion

### API Testing
- All endpoints respond with appropriate status codes
- Authentication middleware validates tokens
- Authorization middleware enforces role-based access
- Error handling returns meaningful messages
- Request validation rejects invalid inputs

### Performance Testing Targets
- **Load Time**: < 3 seconds on low-spec devices
  - Tested on: Chromebook (2GB RAM, MediaTek processor)
  - Measured: DOMContentLoaded, Time to Interactive
- **Time to Interactive (TTI)**: < 5 seconds
- **First Contentful Paint (FCP)**: < 2 seconds
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 100ms for typical queries

### Accessibility Testing Checklist (WCAG 2.1 AA)

**Color & Contrast**
- ✅ Text contrast ratio ≥ 4.5:1 (normal text)
- ✅ UI component contrast ≥ 3:1
- ✅ High contrast mode: 21:1 (black/white)
- ✅ No information conveyed by color alone

**Keyboard Navigation**
- ✅ Tab order logical and visible
- ✅ All interactive elements keyboard accessible
- ✅ Focus indicator clearly visible
- ✅ Keyboard shortcuts documented
- ✅ No keyboard traps

**Screen Reader Support**
- ✅ Semantic HTML (headings, lists, buttons)
- ✅ ARIA labels on custom controls
- ✅ ARIA live regions for dynamic content
- ✅ Form labels associated with inputs
- ✅ Alternative text for images

**Responsive Design**
- ✅ Works on 320px (mobile) to 1920px (desktop)
- ✅ Touch targets ≥ 44×44 pixels
- ✅ Text resizable without loss of functionality
- ✅ No horizontal scrolling required
- ✅ Flexible layouts (flexbox/grid)

**Cognitive Accessibility**
- ✅ Clear, simple language
- ✅ Consistent navigation
- ✅ Predictable component behavior
- ✅ Error messages helpful and visible
- ✅ Undo/cancel options where possible

### User Testing Plan (Per AT2 Requirements)

**Round 1: Usability Testing** (Weeks 10-12)
- Participants: 10 students (ages 11-18) + 5 teachers
- Duration: 30-minute sessions
- Tasks:
  1. Create a simple block program
  2. Enroll in a course and complete a challenge
  3. (Teachers) Assign challenge and view progress
- Success criteria:
  - ≥80% task completion rate
  - ≤3 errors per user
  - ≥7/10 SUS score

**Round 2: Improvements Validation** (Weeks 14-16)
- Participants: 10 students + 5 teachers (different group)
- Duration: 30-minute sessions
- Tasks: Same as Round 1 (post-improvements)
- Validation metrics:
  - Error reduction by ≥20%
  - Task completion rate improvement
  - SUS score increase
  - Student feedback on engagement

**Success Metrics**
- System Usability Scale (SUS) score: > 80%
- Error reduction: ≥ 20% between rounds
- Challenge completion rate: ≥ 70%
- Learning rate improvement: ≥ 15% (compare pre/post test scores)
- User satisfaction: ≥ 4/5 on 5-point scale

### Security Testing
- ✅ Input sanitization prevents XSS
- ✅ Password hashing verified (bcrypt)
- ✅ JWT token expiration enforced
- ✅ Rate limiting active (100 requests/15 min)
- ✅ CORS policy restrictive
- ✅ SQL injection prevention (MongoDB)
- ✅ HTTPS headers set (in production)

### TODO
- [ ] Run full accessibility audit (axe/Wave tools)
- [ ] Record user testing sessions
- [ ] Generate usability heatmaps
- [ ] Performance profiling on real devices
- [ ] Load testing (50+ concurrent users)
- [ ] Security penetration testing

## Deployment & DevOps

### Current Setup
- Docker Compose for local development
- Three containers: Frontend, Backend, Database
- Environment variables in .env file

### Production Considerations
- Container orchestration (Kubernetes)
- Database migration to PostgreSQL
- Backup and disaster recovery procedures
- Monitoring and logging (ELK stack)
- CI/CD pipeline (GitHub Actions)
- Load balancing for scalability

## Future Enhancements (Post-MVP)

1. **Offline Mode** - Local storage sync with server
2. **Collaborative Features** - Pair programming, peer review
3. **Advanced Analytics** - Detailed learning analytics dashboard
4. **LMS Integration** - Google Classroom, Microsoft Teams SSO
5. **Mobile App** - React Native version
6. **Advanced Gamification** - Leaderboards, challenges, tournaments
7. **AI-Powered Hints** - Intelligent hint generation
8. **Content Management** - Teacher-created lessons
9. **Assessment Tools** - Automated quizzes and tests
10. **Parent Dashboard** - Progress notifications for guardians

## References

All development follows the pedagogical framework and design rationale outlined in the AT2 report:
- Constructivism (Papert, 1980)
- Zone of Proximal Development (Vygotsky)
- Self-Determination Theory (Ryan & Deci, 2000)
- Cognitive Load Theory (Sweller, 1988)
- Bloom's Taxonomy for learning progression
- SAMR model for technology integration

## Getting Started

See README.md for installation and development instructions.

---

**Last Updated:** February 17, 2026
**Status:** Prototype Phase
**Version:** 1.0.0-alpha
