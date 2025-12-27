# Deployment Guide - KL Supplier Portal

## Prerequisites

Before deploying to Vercel, ensure you have:

1. A Vercel account (sign up at https://vercel.com)
2. Your KL Fashion backend API URL
3. Vercel CLI installed (optional): `npm i -g vercel`

## Environment Variables Required

### Required Variables

| Variable Name              | Description                                 | Example                                               |
| -------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | The base URL for the KL Fashion backend API | `https://kifashionbackend2-production.up.railway.app` |

> **Note:** The `NEXT_PUBLIC_` prefix makes this variable accessible in the browser. This is required for API calls from the client side.

## Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**

   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**

   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your repository
   - Vercel will automatically detect it's a Next.js project

3. **Configure Environment Variables**

   - In the "Configure Project" step, expand "Environment Variables"
   - Add the following variable:
   - **Name:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** Your backend API URL (e.g., `https://kifashionbackend2-production.up.railway.app`)
     - **Environment:** Select all (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - Your app will be available at `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   vercel
   ```

4. **Add Environment Variables**

   ```bash
   vercel env add NEXT_PUBLIC_API_BASE_URL
   ```

   When prompted, enter your backend API URL.

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Custom Domain (Optional)

- Go to your project settings in Vercel Dashboard
- Navigate to "Domains"
- Add your custom domain (e.g., `supplier.klfashion.com`)
- Update your DNS records as instructed

### 2. Backend CORS Configuration

Ensure your backend API allows requests from your Vercel domain:

```javascript
// Example backend CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://your-project-name.vercel.app",
    "https://supplier.klfashion.com", // Your custom domain
  ],
  credentials: true,
};
```

### 3. Environment Variables Updates

To update environment variables after deployment:

**Via Dashboard:**

- Go to Project Settings → Environment Variables
- Edit the variable
- Redeploy for changes to take effect

**Via CLI:**

```bash
vercel env rm NEXT_PUBLIC_API_BASE_URL production
vercel env add NEXT_PUBLIC_API_BASE_URL production
```

## Build Configuration

The project uses the following build settings (automatically detected by Vercel):

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` or `next build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`
- **Node Version:** 18.x or higher

## Troubleshooting

### Build Failures

1. **Check build logs** in Vercel Dashboard
2. Ensure all dependencies are in `package.json`
3. Verify environment variables are set correctly

### API Connection Issues

1. **Verify `NEXT_PUBLIC_API_BASE_URL`** is set correctly
2. **Check backend CORS** allows your Vercel domain
3. **Inspect browser console** for specific error messages

### Authentication Issues

1. Ensure cookies work across domains (backend must allow credentials)
2. Check that the backend API is accessible from the internet
3. Verify JWT token handling in the backend

## Performance Optimization

### Recommended Vercel Settings

1. **Enable Edge Caching** for static assets
2. **Use Image Optimization** (Next.js automatic)
3. **Enable Compression** (Vercel default)

### Monitoring

- Use Vercel Analytics to monitor performance
- Check "Runtime Logs" for server-side errors
- Monitor API response times

## Security Checklist

- [ ] Backend API uses HTTPS
- [ ] CORS is properly configured
- [ ] API authentication is secure (JWT tokens)
- [ ] Environment variables are not exposed in client code (except `NEXT_PUBLIC_*`)
- [ ] Sensitive routes are protected with authentication
- [ ] Input validation is implemented on both frontend and backend

## Support

For deployment issues:

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs

For application issues:

- Contact: suppliers@klfashion.com

## Quick Reference Commands

```bash
# Local development
npm run dev

# Production build (test locally)
npm run build
npm start

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]
```

## Default Backend API

The application is pre-configured with the default backend:

```
https://kifashionbackend2-production.up.railway.app
```

If you're using this default backend, you can skip setting `NEXT_PUBLIC_API_BASE_URL` as it will use the default value.

---

**Last Updated:** December 2025
**Version:** 1.0.0
