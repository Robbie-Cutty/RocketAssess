# Rocket Assess Platform

A modern, secure, and scalable assessment platform built with **React (frontend)**, **Django (backend)**, and **MySQL (database)**. Features comprehensive security, testing, caching, and deployment configurations.

## 🚀 Features

### Core Functionality
- **Role-based access control**: Organization → Teachers → Students
- **Secure test invitations**: Private, email-based invites only
- **Auto-scoring system**: Instant results and analytics
- **Real-time notifications**: Email alerts and dashboard updates
- **Question pool management**: Reusable questions across tests
- **Comprehensive analytics**: Detailed reports and insights

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password hashing**: All passwords properly encrypted
- **Input validation**: Comprehensive sanitization and validation
- **CORS protection**: Environment-specific CORS configuration
- **XSS protection**: HTML escaping and content security policies
- **Rate limiting**: API rate limiting and brute force protection

### Performance Features
- **Redis caching**: Intelligent caching for frequently accessed data
- **Database optimization**: Query optimization and connection pooling
- **Static file optimization**: CDN-ready static file serving
- **Gzip compression**: Reduced bandwidth usage
- **Pagination**: Efficient data loading

## 🏗️ Architecture

```
ask/
├── backend/                  # Django backend
│   ├── api/                 # Main application
│   │   ├── models.py        # Database models
│   │   ├── views.py         # API endpoints
│   │   ├── serializers.py   # Data validation
│   │   ├── tests.py         # Comprehensive tests
│   │   └── urls.py          # URL routing
│   ├── core/               # Django settings
│   │   ├── settings.py     # Main configuration
│   │   └── urls.py         # URL configuration
│   ├── requirements.txt    # Python dependencies
│   └── manage.py          # Django management
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Route pages
│   │   ├── tests/         # Frontend tests
│   │   └── styles/        # CSS styles
│   ├── package.json       # Node dependencies
│   └── Dockerfile         # Frontend container
├── nginx/                 # Nginx configuration
├── docker-compose.yml     # Multi-container setup
├── Dockerfile            # Backend container
└── README.md             # This file
```

## 🛠️ Installation

### Prerequisites
- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- MySQL 8.0+
- Redis 7+

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rocket-assess
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin: http://localhost:8000/admin

### Manual Installation

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
export SECRET_KEY="your-secret-key"
export DB_NAME="rocket_assess"
export DB_USER="your_db_user"
export DB_PASSWORD="your_db_password"
export REDIS_URL="redis://localhost:6379/1"

# Run migrations
python manage.py migrate
python manage.py collectstatic

# Start the server
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test --verbosity=2 --coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Security Tests
```bash
# Backend security scan
bandit -r backend/api/

# Frontend security audit
cd frontend
npm audit
```

## 🔒 Security Configuration

### Environment Variables
```env
# Django
SECRET_KEY=your-super-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database
DB_NAME=rocket_assess
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=3306

# Redis
REDIS_URL=redis://localhost:6379/1

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Security Headers
The application includes comprehensive security headers:
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Content-Security-Policy: Comprehensive CSP
- HSTS: Strict transport security

## 📊 Performance Optimization

### Caching Strategy
- **Redis caching**: 15-minute TTL for frequently accessed data
- **Database query optimization**: select_related and prefetch_related
- **Static file caching**: 1-year cache for static assets
- **API response caching**: Intelligent caching based on request patterns

### Database Optimization
- **Connection pooling**: Persistent database connections
- **Query optimization**: Efficient queries with proper indexing
- **Migration management**: Automated database migrations

## 🚀 Deployment

### Production Deployment

1. **Set up production environment**
   ```bash
   # Configure production settings
   export DEBUG=False
   export ALLOWED_HOSTS=your-domain.com
   export CORS_ALLOWED_ORIGINS=https://your-domain.com
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Set up SSL certificates**
   ```bash
   # Configure SSL in nginx/nginx.conf
   # Update CORS_ALLOWED_ORIGINS for HTTPS
   ```

### CI/CD Pipeline
The project includes a comprehensive GitHub Actions pipeline:
- **Automated testing**: Backend and frontend tests
- **Security scanning**: Bandit and npm audit
- **Docker builds**: Automated container builds
- **Deployment**: Automated deployment to production

## 📈 Monitoring and Logging

### Logging Configuration
- **Structured logging**: JSON-formatted logs
- **Log rotation**: Automated log management
- **Error tracking**: Comprehensive error reporting

### Health Checks
- **Application health**: `/health/` endpoint
- **Database connectivity**: Automated health checks
- **Redis connectivity**: Cache health monitoring

## 🔧 Development

### Code Quality
- **Linting**: ESLint for frontend, flake8 for backend
- **Formatting**: Prettier for frontend, black for backend
- **Type checking**: TypeScript support (optional)

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
# Make changes
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create pull request
# Automated tests and security scans run
# Code review and approval
# Merge to main branch
```

## 📚 API Documentation

### Authentication
All API endpoints require JWT authentication:
```bash
# Login to get token
curl -X POST http://localhost:8000/api/login-teacher/ \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@example.com", "password": "password"}'

# Use token in requests
curl -X GET http://localhost:8000/api/tests/ \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Key Endpoints
- `POST /api/register-organization/` - Organization registration
- `POST /api/login-teacher/` - Teacher authentication
- `POST /api/login-student/` - Student authentication
- `GET /api/tests/` - List tests (authenticated)
- `POST /api/submit-test/` - Submit test answers
- `GET /api/test-results/` - Get test results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript
- Write comprehensive tests
- Update documentation for new features
- Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: dongjunzejeff@gmail.com
- Documentation: [Wiki](https://github.com/your-repo/wiki)

## 🔄 Changelog

### Version 2.0.0 (Current)
- ✅ Comprehensive security improvements
- ✅ JWT authentication implementation
- ✅ Redis caching integration
- ✅ Comprehensive test suite
- ✅ Docker containerization
- ✅ CI/CD pipeline
- ✅ Performance optimizations
- ✅ Production deployment configuration

### Version 1.0.0 (Previous)
- ✅ Basic assessment functionality
- ✅ User role management
- ✅ Email notifications
- ✅ Auto-scoring system