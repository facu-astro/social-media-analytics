# Deployment Guide

This guide will help you deploy your Social Media Analytics Dashboard to free hosting services.

## Architecture Overview

- **Frontend**: Next.js app deployed to Vercel
- **Backend**: Python FastAPI server deployed to Railway or Render
- **Database**: None required (stateless API)

## Prerequisites

1. GitHub account
2. Vercel account (free)
3. Railway account (free) OR Render account (free)
4. Sprout Social API key
5. OpenAI API key

## Step 1: Prepare Your Repository

1. **Initialize Git and push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit: Social Media Analytics Dashboard"
   git branch -M main
   git remote add origin https://github.com/yourusername/social-media-analytics.git
   git push -u origin main
   ```

## Step 2: Deploy Backend (Railway - Recommended)

1. **Go to [Railway](https://railway.app/)**
2. **Sign in with GitHub**
3. **Create New Project** → **Deploy from GitHub repo**
4. **Select your repository**
5. **Configure the service**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python api_server.py`

6. **Add Environment Variables**:
   - `SPROUT_API_KEY`: Your Sprout Social API key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 8000 (Railway will override this)
   - `HOST`: 0.0.0.0

7. **Deploy** and note your Railway URL (e.g., `https://your-app.railway.app`)

### Alternative: Deploy Backend to Render

1. **Go to [Render](https://render.com/)**
2. **Sign in with GitHub**
3. **New** → **Web Service**
4. **Connect your repository**
5. **Configure**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python api_server.py`
   - **Environment**: Python 3

6. **Add Environment Variables** (same as Railway)
7. **Deploy** and note your Render URL

## Step 3: Deploy Frontend (Vercel)

1. **Go to [Vercel](https://vercel.com/)**
2. **Sign in with GitHub**
3. **New Project** → **Import Git Repository**
4. **Select your repository**
5. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

6. **Add Environment Variables**:
   - `BACKEND_URL`: Your Railway/Render URL from Step 2

7. **Deploy**

## Step 4: Test the Deployment

1. **Visit your Vercel URL**
2. **Enter a Sprout Social profile ID**
3. **Click "Analyze Performance"**
4. **Verify**:
   - Data loads correctly
   - Charts display properly
   - AI strategies generate successfully

## Step 5: Custom Domain (Optional)

### For Vercel (Frontend):
1. Go to your project settings
2. Add your custom domain
3. Configure DNS records as instructed

### For Railway (Backend):
1. Go to your service settings
2. Add custom domain
3. Configure DNS records

## Troubleshooting

### Backend Issues:
- **Check Railway/Render logs** for errors
- **Verify environment variables** are set correctly
- **Test API endpoints** directly: `https://your-backend-url/health`

### Frontend Issues:
- **Check Vercel function logs**
- **Verify BACKEND_URL** environment variable
- **Test API routes**: `https://your-frontend-url/api/validate-keys`

### Common Errors:

1. **"Backend server is not available"**
   - Check if backend is deployed and running
   - Verify BACKEND_URL in Vercel environment variables

2. **"Invalid API credentials"**
   - Check Sprout Social and OpenAI API keys
   - Ensure keys are set in backend environment variables

3. **CORS errors**
   - Backend includes CORS middleware
   - Should not occur with proper setup

## Environment Variables Summary

### Frontend (Vercel):
```
BACKEND_URL=https://your-backend-url.railway.app
```

### Backend (Railway/Render):
```
SPROUT_API_KEY=your_sprout_social_api_key
OPENAI_API_KEY=your_openai_api_key
PORT=8000
HOST=0.0.0.0
```

## Development vs Production

### Development:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Use `backend/config.json` for API keys

### Production:
- Frontend: Your Vercel URL
- Backend: Your Railway/Render URL
- Use environment variables for API keys

## Monitoring and Maintenance

1. **Monitor usage** on Railway/Render dashboards
2. **Check logs** regularly for errors
3. **Update dependencies** periodically
4. **Monitor API usage** for Sprout Social and OpenAI

## Cost Considerations

- **Vercel**: Free tier includes 100GB bandwidth
- **Railway**: Free tier includes $5/month credit
- **Render**: Free tier with limitations (sleeps after inactivity)
- **APIs**: Pay per usage (Sprout Social + OpenAI)

Choose Railway for better reliability, or Render if you prefer the free tier limitations.
