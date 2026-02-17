# Interactive Learning Environment

A web-based platform designed to teach coding and programming to primary and secondary school students through gamified, interactive challenges and adaptive learning experiences.

## Project Overview

This project aims to address the gap in accessible programming education by providing:
- **Visual block-based programming** with gradual transition to text-based coding
- **Interactive lessons** for hands-on learning
- **Teacher dashboards** for progress tracking and analytics
- **Gamification elements** to maintain student motivation
- **Adaptive learning** features that personalize experiences
- **Collaborative features** for peer learning

## Technology Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js/Express
- **Database**: MongoDB
- **Authentication**: JWT-based auth
- **Block Editor**: Custom visual programming interface
- **Deployment**: Docker-ready

## Project Structure

```
Interactive-Learning-Environment/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components (Student, Teacher, Admin)
│   │   ├── services/        # API and external services
│   │   ├── stores/          # State management
│   │   ├── styles/          # Global and component styles
│   │   └── utils/           # Helper functions
│   └── package.json
│
├── backend/                  # Node.js/Express server
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/          # Database schemas
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── config/          # Configuration files
│   └── package.json
│
├── database/                 # Database files and schemas
│   ├── schemas/             # Data models and schema definitions
│   └── migrations/          # Database migration scripts
│
├── docs/                     # Project documentation
│   ├── REQUIREMENTS.md       # Detailed requirements
│   ├── API.md               # API documentation
│   ├── ARCHITECTURE.md      # System architecture
│   └── SETUP.md             # Setup and installation guide
│
├── docker-compose.yml        # Docker composition file
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/speedshadow59/Interactive-Learning-Environment.git
cd Interactive-Learning-Environment
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Configure environment variables:
```bash
# Copy the example env file
cp .env.example .env
# Edit .env with your configuration
```

4. Start the application:
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Key Features

### For Students
- Visual block-based programming editor
- Interactive coding challenges with instant feedback
- Gamification system (points, badges, achievements)
- Progress tracking
- Collaborative learning features
- Gradual difficulty progression

### For Teachers
- Student dashboard with progress analytics
- Class management tools
- Custom challenge creation
- Student performance insights
- Progress reports

### For Administrators
- User management
- Platform analytics
- Content management
- System configuration

## Development Guidelines

### Frontend Development
- Component-based architecture
- TypeScript for type safety
- Responsive design with Tailwind CSS
- State management with Zustand/Redux
- API calls via Axios/Fetch

### Backend Development
- RESTful API architecture
- Model-View-Controller pattern
- Comprehensive error handling
- Input validation and sanitization
- JWT authentication

### Database
- MongoDB collections for users, courses, challenges, submissions
- Indexing for performance optimization
- Data validation at schema level

## Contributing

Please ensure code follows the project standards:
- Write meaningful commit messages
- Add tests for new features
- Document API changes
- Follow TypeScript/JavaScript best practices

## Implementation Status (AT2 Aligned)

### ✅ Completed Features

**Core Functionality (Objectives 1-2)**
- ✅ Block-based visual programming interface with drag-and-drop
- ✅ Real-time Python code preview and execution
- ✅ Block-to-code conversion engine
- ✅ Toggle between block and text coding modes
- ✅ Full test case library in `backend/tests/test.spec.js`

**User Management & Authentication**
- ✅ User registration with role selection (student/teacher)
- ✅ Secure JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Role-based access control

**Learning Platform**
- ✅ Course management system
- ✅ Challenge creation and management
- ✅ Student progress tracking
- ✅ Badge earning system
- ✅ Points/gamification system
- ✅ Adaptive difficulty levels

**Dashboards**
- ✅ Student dashboard with course overview and progress
- ✅ Teacher dashboard with class metrics
- ✅ Progress visualization and tracking

**Security & Privacy (Objective 6)**
- ✅ GDPR compliance routes (`/api/privacy/*`)
  - Data export (Article 20)
  - Data access view (Article 15)
  - Account deletion with grace period (Article 17)
  - Privacy consent management (Article 6)
- ✅ Comprehensive privacy policy endpoint
- ✅ Input sanitization and XSS prevention
- ✅ Rate limiting (100 req/15 min)
- ✅ CORS security headers
- ✅ Error handling middleware with logging

**Accessibility (Objective 5)**
- ✅ AccessibilityPanel component with:
  - High contrast mode (black/white, 21:1 contrast)
  - Text size adjustment (75-200%)
  - Screen reader optimizations
  - Keyboard shortcuts (Alt+A, Alt+H, Alt+±, Alt+R)
- ✅ ARIA labels on interactive elements
- ✅ WCAG 2.1 AA color contrast compliance
- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ Semantic HTML structure

**Infrastructure**
- ✅ Docker containerization (3 services)
- ✅ Docker Compose orchestration
- ✅ Environment configuration
- ✅ Database seeding with sample data

### 🔄 In Progress / To Refine

**Teacher Features (Objective 3)**
- ⏳ Assignment system (set tasks, deadlines)
- ⏳ Detailed progress analytics
- ⏳ Class management interface
- ⏳ Export student data (CSV/PDF)
- ⏳ Peer review functionality

**Testing & Validation**
- ⏳ Full test suite execution
- ⏳ User testing sessions (Round 1 & 2)
- ⏳ Performance benchmarking
- ⏳ Accessibility audit (axe/Wave tools)

**Code Quality**
- ⏳ JSDoc comments on all functions
- ⏳ Component refactoring for production standards
- ⏳ API documentation (Swagger/OpenAPI)
- ⏳ Unit test coverage increase

### 🚀 Future Enhancements (Post-MVP)

- Offline mode with local caching
- Google Classroom / MS Teams integration
- Leaderboards and tournaments
- AI-powered hint generation
- Mobile app (React Native)
- Video lessons and tutorials
- Advanced analytics dashboard
- Parent notifications
- PostgreSQL migration for production

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 16+ (for local development)
- MongoDB (included in Docker Compose)

### Running the Application

```bash
# Start all services
docker-compose up -d

# Seed database with sample data
docker-compose exec backend node src/seed.js

# Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MongoDB: localhost:27017
```

### Test Accounts (After Seeding)

**Students:**
- Email: `alice@student.edu` | Password: `password123`
- Email: `bob@student.edu` | Password: `password123`

**Teachers:**
- Email: `john@teacher.edu` | Password: `password123`
- Email: `jane@teacher.edu` | Password: `password123`

### Accessibility Features

- **Toggle accessibility panel**: Alt+A
- **High contrast**: Alt+H
- **Increase text**: Alt++
- **Decrease text**: Alt+−
- **Reset settings**: Alt+R

## API Reference

See [TECHNICAL.md](TECHNICAL.md) for:
- Complete API endpoint documentation
- Database schema details
- Security implementation details
- GDPR compliance specifics
- Accessibility feature documentation
- Performance optimization guidelines

## Next Steps for Assessment

1. **Run Test Suite**
   ```bash
   npm test --prefix backend
   ```

2. **Execute User Testing**
   - Prepare test materials from Round 1 & 2 plans
   - Document usability findings
   - Implement improvements based on feedback

3. **Performance Testing**
   - Test load time on low-spec devices
   - Benchmark API response times
   - Stress test with 50+ concurrent users

4. **Security Audit**
   - Run OWASP vulnerability scanner
   - Penetration testing
   - Code security review

5. **Accessibility Testing**
   - Automated audit with axe or Wave tools
   - Screen reader testing (NVDA/JAWS)
   - Keyboard-only navigation validation
   - Manual WCAG review

## Deployment

See [SETUP.md](docs/SETUP.md) for detailed deployment instructions for different environments.

## Technical Documentation

- [TECHNICAL.md](TECHNICAL.md) - Architecture, API, security, GDPR, accessibility
- [REQUIREMENTS.md](docs/REQUIREMENTS.md) - Functional and non-functional requirements
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design overview
- [RISK_ANALYSIS.md](docs/RISK_ANALYSIS.md) - Risk assessment and mitigation
- [API.md](docs/API.md) - API endpoint reference

## References

- AT2 Report: COM668 Computing Project Specification
- Key Publications:
  - Constructivism in Learning (Papert, 1980)
  - Zone of Proximal Development (Vygotsky)
  - Self-Determination Theory (Ryan & Deci, 2000)
  - Cognitive Load Theory (Sweller, 1988)

## License

This project is developed as part of the Computing Project at Ulster University.

## Contact

- Student: Laurynas Pielikys (B00842548)
- Mentor: Tazar Hussain
- Course: Computing Project (COM668)
