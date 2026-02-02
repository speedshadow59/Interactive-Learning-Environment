# System Architecture

## Overview
The Interactive Learning Environment uses a modern three-tier architecture with a React frontend, Node.js/Express backend, and MongoDB database.

## Architecture Layers

### 1. Presentation Layer (Frontend)
- **Technology**: React 18 with React Router
- **State Management**: Zustand for global state
- **Styling**: CSS with responsive design
- **Components**:
  - Authentication pages (Login, Register)
  - Student/Teacher dashboards
  - Course and challenge pages
  - Navigation and layout components

### 2. API Layer (Backend)
- **Technology**: Express.js running on Node.js
- **Middleware**: 
  - CORS for cross-origin requests
  - JWT authentication
  - Request validation (Joi)
  - Error handling
- **Structure**: Model-View-Controller (MVC) pattern
  - Controllers: Handle request logic
  - Routes: Define API endpoints
  - Models: MongoDB schemas
  - Services: Business logic
  - Middleware: Cross-cutting concerns

### 3. Data Layer (Database)
- **Technology**: MongoDB
- **Collections**:
  - Users: Student and teacher profiles
  - Courses: Course definitions and metadata
  - Challenges: Programming challenge definitions
  - Submissions: Code submissions and results
  - Progress: Student progress tracking and achievements

## Data Flow

```
User Action (Frontend)
    ↓
React Component
    ↓
API Client (axios)
    ↓
Express Route Handler
    ↓
Controller/Service Logic
    ↓
MongoDB Query
    ↓
Response sent back to Frontend
    ↓
State Updated (Zustand)
    ↓
UI Re-rendered
```

## Authentication Flow

1. User submits login/register form
2. Frontend sends credentials to backend
3. Backend validates and creates/verifies user
4. JWT token generated and returned
5. Frontend stores token in localStorage
6. Token included in all subsequent API requests
7. Backend validates token in auth middleware

## API Design Principles

- **RESTful**: Uses standard HTTP methods (GET, POST, PUT, DELETE)
- **Resource-based**: URLs represent resources (/courses, /challenges)
- **JSON**: All requests/responses in JSON format
- **Stateless**: Server doesn't store client context
- **Versioned**: API path includes version prefix

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Load Balancer                      │
└─────────────────────────────────────────────────────┘
              ↓                    ↓
    ┌──────────────────┐  ┌──────────────────┐
    │  Frontend (CDN)  │  │  API Cluster     │
    │  - React Build   │  │  - Multiple      │
    │  - Static Assets │  │    Express       │
    │  - HTML/CSS/JS   │  │    Instances     │
    └──────────────────┘  └──────────────────┘
              ↓                    ↓
              └────────┬───────────┘
                       ↓
         ┌──────────────────────────┐
         │   MongoDB Cluster        │
         │ - Replica Set (HA)       │
         │ - Automatic Failover     │
         │ - Sharding (Optional)    │
         └──────────────────────────┘
```

## Security Architecture

### Authentication & Authorization
- JWT tokens with 7-day expiration
- Password hashing with bcrypt
- Role-based access control (RBAC)
  - Student: Can access own data and courses
  - Teacher: Can manage courses and view student data
  - Admin: Full system access

### API Security
- CORS configuration for approved origins
- Input validation on all endpoints
- SQL injection prevention through MongoDB
- XSS protection via JSON serialization
- Rate limiting (implement in future)
- HTTPS/TLS for all communications

### Data Security
- MongoDB authentication required
- Sensitive fields excluded from responses
- Password field never included in API responses
- Database backups encrypted

## Scalability Considerations

### Horizontal Scaling
- Stateless API allows multiple instances
- Load balancer distributes requests
- Database replication for read scaling

### Performance Optimization
- Database indexing on frequently queried fields
- API response caching (future enhancement)
- Frontend code splitting and lazy loading
- CDN for static assets

### Monitoring & Logging
- Request/response logging
- Error tracking and alerting
- Performance monitoring
- Database query analysis

## Technologies Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | UI framework |
| Frontend | React Router | Client-side routing |
| Frontend | Zustand | State management |
| Frontend | Axios | HTTP client |
| Backend | Node.js | Runtime |
| Backend | Express | Web framework |
| Backend | MongoDB | Database |
| Backend | Mongoose | ODM |
| Backend | JWT | Authentication |
| Backend | Bcrypt | Password hashing |
| Deployment | Docker | Containerization |
| Deployment | Docker Compose | Local development |
