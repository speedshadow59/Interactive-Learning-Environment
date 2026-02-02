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

## Deployment

See [SETUP.md](docs/SETUP.md) for detailed deployment instructions for different environments.

## References

See the Challenge Definition Report for comprehensive research and theoretical foundations supporting this project.

## License

This project is developed as part of the Computing Project at Ulster University.

## Contact

- Student: Laurynas Pielikys (B00842548)
- Mentor: Tazar Hussain
- Course: Computing Project (COM668)
