# 🚀 Quick Deploy DriftAI

## One-Click Deployments

### Backend (Railway)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/zxjfvD?referralCode=HKsPVP)

**Or manually:**
1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub repo"  
3. Select `zramsky/DriftAI`
4. Set root directory to `/backend`
5. Add PostgreSQL and Redis services
6. Add environment variables (see below)

### Frontend (Vercel)  
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zramsky/DriftAI&root-directory=frontend)

**Or manually:**
1. Go to https://vercel.com/dashboard
2. Click "New Project" → Import from Git
3. Select `zramsky/DriftAI`  
4. Set root directory to `/frontend`
5. Add environment variable: `NEXT_PUBLIC_API_URL=<your-railway-backend-url>`

## Required Environment Variables

### Backend (Railway)
```
NODE_ENV=production
CORS_ORIGIN=https://contractrecplatform.web.app
STORAGE_DRIVER=local
LOCAL_STORAGE_DIR=./data
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
```

Database and Redis will be auto-configured by Railway services.

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

## Deployment Status

- ✅ Code pushed to GitHub
- ⏳ Backend deployment (Railway)  
- ⏳ Frontend deployment (Vercel)
- ⏳ End-to-end testing

## Quick Test URLs

After deployment:
- Backend Health: `https://your-railway-app.railway.app/api/v1/health/live`
- Frontend: `https://your-vercel-app.vercel.app`
- Production: `https://contractrecplatform.web.app` (after CI/CD setup)

## What's Next?

1. Deploy backend using Railway button above
2. Copy the Railway backend URL  
3. Deploy frontend using Vercel button above
4. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
5. Test the deployment
6. Optionally set up CI/CD for automatic deployments

## Manual CLI Deployment

If you prefer CLI:

```bash
# Backend (Railway)
cd backend
railway link  # Select project interactively
railway up --detach

# Frontend (Vercel)  
cd frontend
vercel --prod
```

The one-click buttons above are the fastest way to get started!