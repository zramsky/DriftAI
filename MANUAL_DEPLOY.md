# Manual Deployment Steps

Since we can't use interactive CLI tools, here are the manual steps to deploy:

## Backend Deployment - Railway

### Option 1: GitHub Integration (Recommended)

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Create New Project**: Click "New Project"
3. **Select "Deploy from GitHub repo"**
4. **Connect your GitHub repo**: `zramsky/DriftAI`
5. **Select the backend folder**: Set root directory to `/backend`
6. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm run start:prod`
   - Port: `3001`

### Option 2: CLI Deployment (Alternative)

If you can access Railway CLI interactively:

```bash
# In backend directory
cd backend

# Link to project (choose workspace interactively)
railway link

# Deploy
railway up --detach

# Check status
railway status
```

## Required Environment Variables

After deployment, add these environment variables in Railway dashboard:

```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://contractrecplatform.web.app

# Database (add PostgreSQL service in Railway)
DATABASE_HOST=<railway-postgres-host>
DATABASE_PORT=5432  
DATABASE_USERNAME=<railway-postgres-user>
DATABASE_PASSWORD=<railway-postgres-password>
DATABASE_NAME=<railway-postgres-database>

# Redis (add Redis service in Railway)  
REDIS_HOST=<railway-redis-host>
REDIS_PORT=6379

# Storage
STORAGE_DRIVER=local
LOCAL_STORAGE_DIR=./data

# Authentication
JWT_SECRET=<generate-strong-secret-here>

# Optional AI services
OPENAI_API_KEY=<your-openai-key>
OPENAI_ORG_ID=<your-openai-org>
```

## Frontend Deployment - Vercel

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Import Project**: Click "New Project"  
3. **Import from Git**: Select your `zramsky/DriftAI` repo
4. **Configure Project**:
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. **Environment Variables**: Add `NEXT_PUBLIC_API_URL=<your-railway-backend-url>`
6. **Deploy**: Click Deploy

### Option 2: Vercel CLI

```bash
# In frontend directory
cd frontend

# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Manual Steps Summary

1. **Deploy Backend**:
   - Railway dashboard → New Project → GitHub repo → `/backend` folder
   - Add PostgreSQL and Redis services
   - Configure environment variables
   
2. **Deploy Frontend**:
   - Vercel dashboard → New Project → GitHub repo → `/frontend` folder  
   - Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
   
3. **Test**:
   - Backend health: `<railway-url>/api/v1/health/live`
   - Frontend: `<vercel-url>`

## Getting Service URLs

After deployment:
- **Railway Backend URL**: Found in Railway dashboard under your service
- **Vercel Frontend URL**: Found in Vercel dashboard after deployment

Let me know the backend URL once deployed, and I'll help you configure the frontend!