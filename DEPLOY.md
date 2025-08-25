# DriftAI Deployment Guide

## Backend Deployment

### Railway Deployment

1. **Prerequisites:**
   - Railway account
   - PostgreSQL database service
   - Redis service

2. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://contractrecplatform.web.app
   
   # Database (from Railway PostgreSQL service)
   DATABASE_HOST=<railway-postgres-host>
   DATABASE_PORT=5432
   DATABASE_USERNAME=<railway-postgres-user>
   DATABASE_PASSWORD=<railway-postgres-password>
   DATABASE_NAME=<railway-postgres-database>
   
   # Redis (from Railway Redis service)
   REDIS_HOST=<railway-redis-host>
   REDIS_PORT=6379
   
   # Storage Configuration
   STORAGE_DRIVER=local
   LOCAL_STORAGE_DIR=./data
   
   # Optional: AWS S3 (if using S3 storage)
   # AWS_REGION=us-east-1
   # AWS_ACCESS_KEY_ID=<your-access-key>
   # AWS_SECRET_ACCESS_KEY=<your-secret-key>
   # AWS_S3_BUCKET=<your-bucket>
   
   # Authentication
   JWT_SECRET=<generate-strong-secret>
   
   # AI Services (optional)
   # OPENAI_API_KEY=<your-openai-key>
   # OPENAI_ORG_ID=<your-openai-org-id>
   ```

3. **Deploy Steps:**
   ```bash
   # Connect Railway CLI (if not already connected)
   railway login
   
   # From backend directory
   cd backend
   
   # Deploy to Railway
   railway up
   
   # Set environment variables through Railway dashboard or CLI
   railway variables set NODE_ENV=production
   railway variables set CORS_ORIGIN=https://contractrecplatform.web.app
   # ... set other variables
   ```

4. **Health Check:**
   - Endpoint: `https://<your-railway-backend-url>/api/v1/health/live`
   - Should return: `{"status": "ok"}`

### Render Deployment

1. **Create render.yaml (optional):**
   ```yaml
   services:
     - type: web
       name: driftai-backend
       env: node
       buildCommand: npm ci && npm run build
       startCommand: npm run start:prod
       healthCheckPath: /api/v1/health/live
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 3001
         - key: CORS_ORIGIN
           value: https://contractrecplatform.web.app
   ```

### Other Platforms

- **Fly.io**: Use the provided Dockerfile
- **Google Cloud Run**: Use the provided Dockerfile
- **AWS ECS**: Use the provided Dockerfile with ECS task definition

## Frontend Deployment

The frontend is already configured for Firebase Hosting deployment via GitHub Actions.

### CI/CD Pipeline Update

After deploying the backend, update the GitHub repository secrets:

1. Go to Repository Settings > Secrets and Variables > Actions
2. Update `NEXT_PUBLIC_API_URL` to point to your deployed backend URL
   - Example: `https://your-backend-url.railway.app`
3. Re-run the "Deploy to Firebase Hosting" workflow

## Local Development

Use Docker Compose for local development:

```bash
# From project root
docker-compose up -d

# Access services:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

## Storage Configuration

### Local Storage (Development/Simple Deployment)
- Files stored in `./data` directory
- Automatic directory creation
- Served via `/api/v1/storage/files` endpoint

### AWS S3 (Production Recommended)
- Set `STORAGE_DRIVER=s3`
- Configure AWS credentials and bucket
- Provides signed URLs for secure file access

## Database Migrations

The application uses TypeORM with automatic synchronization in development. For production:

1. Set `synchronize: false` in database configuration
2. Generate and run migrations:
   ```bash
   npm run migration:generate
   npm run migration:run
   ```

## Monitoring

- Health endpoints: `/api/v1/health/live` and `/api/v1/health/ready`
- Application logs available in deployment platform
- Monitor storage usage if using local storage

## Security Considerations

- Use strong JWT secrets
- Configure CORS origins properly
- Use HTTPS in production
- Secure database and Redis connections
- Consider rate limiting for API endpoints