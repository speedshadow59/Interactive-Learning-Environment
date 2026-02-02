# Setup and Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** (local or cloud instance) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **Docker** (optional, for containerized setup) - [Download](https://www.docker.com/)

## Project Structure

```
Interactive-Learning-Environment/
├── backend/              # Node.js/Express server
├── frontend/             # React web application
├── database/             # Database schemas and migrations
├── docs/                 # Project documentation
├── docker-compose.yml    # Docker composition
├── README.md            # Project overview
└── .env.example         # Environment variables template
```

## Local Setup (Without Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/speedshadow59/Interactive-Learning-Environment.git
cd Interactive-Learning-Environment
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure Environment Variables
```bash
# Copy the example env file to the root directory
cp ../.env.example ../.env

# Edit .env file with your configuration
# Important variables:
# - MONGODB_URI=mongodb://localhost:27017/interactive-learning-env
# - JWT_SECRET=your-secret-key
# - BACKEND_PORT=5000
```

#### Run Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend should now be running on `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Configure Environment Variables
The frontend uses the `.env` file in the root directory:
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

#### Run Frontend Server
```bash
npm start
```

The frontend should open in your browser at `http://localhost:3000`

### 4. Verify Installation

1. **Backend Health Check**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response: `{"status":"Backend API is running"}`

2. **Frontend**: Open `http://localhost:3000` in your browser
   - Should see the login page
   - Try registering a test account

## Docker Setup

### Using Docker Compose (Recommended)

#### 1. Install Docker
Follow the [Docker installation guide](https://docs.docker.com/get-docker/)

#### 2. Build and Run

```bash
# From the project root directory
docker-compose up -d

# This will:
# - Create MongoDB container
# - Build and run backend container
# - Build and run frontend container
```

#### 3. Access the Application

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- MongoDB: `localhost:27017`

#### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### 5. Stop Services

```bash
docker-compose down

# Also remove volumes
docker-compose down -v
```

### Manual Docker Build

#### Backend
```bash
cd backend
docker build -t ile-backend .
docker run -p 5000:5000 --env-file ../.env ile-backend
```

#### Frontend
```bash
cd frontend
docker build -t ile-frontend .
docker run -p 3000:3000 ile-frontend
```

## Database Setup

### MongoDB Local Installation

#### Windows
```bash
# Using chocolatey
choco install mongodb

# Or download from: https://www.mongodb.com/try/download/community
```

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
curl https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
```

### MongoDB Cloud (Atlas)

1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interactive-learning-env?retryWrites=true&w=majority
   ```

## Development Workflow

### Running Tests

#### Backend
```bash
cd backend
npm test
npm run test:coverage
```

#### Frontend
```bash
cd frontend
npm test
```

### Linting

#### Backend
```bash
cd backend
npm run lint
```

### Building for Production

#### Backend
```bash
cd backend
npm run build
```

#### Frontend
```bash
cd frontend
npm run build
```

## Troubleshooting

### Common Issues

#### Backend won't start
- Check if port 5000 is available
- Verify MongoDB is running
- Check `.env` file configuration
- Review error logs in console

#### Frontend won't load
- Clear browser cache
- Check if port 3000 is available
- Verify API URL in `.env` is correct
- Check browser console for errors

#### MongoDB connection error
- Verify MongoDB is running
- Check connection string in `.env`
- For local: `mongodb://localhost:27017/interactive-learning-env`
- For Atlas: Include credentials and cluster URL

#### Docker issues
```bash
# Rebuild containers
docker-compose build --no-cache

# Reset everything
docker-compose down -v
docker-compose up -d
```

## Environment Variables Reference

```env
# Backend
BACKEND_PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/interactive-learning-env
MONGODB_USER=admin
MONGODB_PASSWORD=password
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_PORT=3000
REACT_APP_API_URL=http://localhost:5000/api

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Feature Flags
ENABLE_ADAPTIVE_LEARNING=true
ENABLE_COLLABORATIVE_FEATURES=true
ENABLE_GAMIFICATION=true
```

## Next Steps

1. **Create Test Accounts**
   - Register a student account
   - Register a teacher account
   - Login and explore

2. **Create Sample Data**
   - Teacher creates a course
   - Add challenges to the course
   - Student enrolls and completes challenges

3. **Explore Features**
   - Check student/teacher dashboards
   - Submit code and see results
   - Track progress

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [API documentation](API.md)
3. Check the [system architecture](ARCHITECTURE.md)
4. Review [requirements documentation](REQUIREMENTS.md)
