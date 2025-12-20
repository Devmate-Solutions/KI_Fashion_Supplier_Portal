# 🚀 Vercel Deployment Guide - KL Fashion Supplier Portal

## 📋 Quick Start Checklist

- [ ] GitHub repository is ready
- [ ] Backend API is accessible via HTTPS
- [ ] Vercel account created
- [ ] Environment variables prepared

---

## 🔑 Required Environment Variables

### For Vercel Dashboard

Add this single environment variable to Vercel:

| Variable Name              | Value                                                  | Required | Environments                     |
| -------------------------- | ------------------------------------------------------ | -------- | -------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://kl-backend-v2-production-5f50.up.railway.app` | ✅ Yes   | Production, Preview, Development |

---

## 📝 Step-by-Step Deployment Instructions

### Step 1: Prepare Your Repository

Ensure your latest code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **"Import Project"**
3. Select **"Import Git Repository"**
4. Choose your GitHub repository: `Devmate-Solutions/KI_Fashion_Supplier_Portal`
5. Click **"Import"**

### Step 3: Configure Project Settings

Vercel will auto-detect Next.js. Confirm these settings:

- **Framework Preset:** Next.js
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install` (auto-detected)
- **Node Version:** 18.x or higher

### Step 4: Add Environment Variables

**CRITICAL:** Before deploying, add the environment variable:

1. In the import screen, expand **"Environment Variables"**
2. Add the variable:
   - **Name:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** `https://kl-backend-v2-production-5f50.up.railway.app`
3. Select environments: ✅ Production, ✅ Preview, ✅ Development
4. Click **"Add"**

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Once deployed, you'll get a URL like: `https://your-project-name.vercel.app`

### Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Test login functionality
3. Verify API connection is working
4. Check all pages load correctly

---

## 🔧 Backend Requirements

### CORS Configuration

Your backend MUST allow requests from your Vercel domain. Update your backend CORS settings:

```javascript
// Example backend CORS configuration (Node.js/Express)
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://your-project-name.vercel.app",
    "https://your-custom-domain.com",
    // Add all your Vercel preview URLs or use a pattern
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
```

### API Endpoints Required

Ensure your backend has these endpoints accessible:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/dispatch-orders` - Get dispatch orders
- `POST /api/dispatch-orders` - Create dispatch order
- `GET /api/products` - Get products
- `GET /api/purchase-orders` - Get purchase orders
- `GET /api/returns` - Get returns
- `GET /api/ledger` - Get ledger data
- And all other API endpoints used in the portal

---

## 🎯 Post-Deployment Tasks

### 1. Add Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `supplier.klfashion.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate to be issued (automatic)

### 2. Update Backend CORS

After getting your Vercel domain, update backend CORS to allow it:

```javascript
origin: [
  "https://kl-supplier-portal.vercel.app",
  // ... other domains
];
```

### 3. Configure Environment Variables for Multiple Environments

If you need different API URLs for preview vs production:

**Production:**

- `NEXT_PUBLIC_API_BASE_URL` = `https://your-production-backend.com/api`

**Preview:**

- `NEXT_PUBLIC_API_BASE_URL` = `https://your-staging-backend.com/api`

**Development:**

- `NEXT_PUBLIC_API_BASE_URL` = `http://localhost:5000/api`

---

## 🔍 Troubleshooting

### Build Fails

**Error:** `NEXT_PUBLIC_API_BASE_URL is not defined`

**Solution:**

1. Go to **Project Settings** → **Environment Variables**
2. Add the missing variable
3. Redeploy: **Deployments** → **⋯** → **Redeploy**

---

**Error:** `Module not found` or dependency errors

**Solution:**

```bash
# Locally test the build
npm run build

# If successful, push and redeploy
git push origin main
```

---

### API Connection Issues

**Error:** CORS error in browser console

**Solution:**

1. Update backend CORS to allow your Vercel domain
2. Ensure `credentials: true` is set in backend CORS
3. Verify API URL is correct (no trailing slashes)

---

**Error:** 404 on API calls

**Solution:**

1. Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
2. Check backend is accessible from the internet
3. Test API URL directly in browser: `https://your-backend/api/auth/me`

---

### Authentication Issues

**Error:** Login works locally but not on Vercel

**Solution:**

1. Check cookie settings in backend (ensure `sameSite`, `secure` are correct)
2. Verify backend allows credentials from Vercel domain
3. Check browser console for cookie errors

---

### Image Upload Issues

**Error:** Images not uploading or displaying

**Solution:**

1. Verify backend image upload endpoint is working
2. Check image size limits (both frontend and backend)
3. Ensure backend returns correct image URLs

---

## 🎨 Vercel Dashboard Features

### Deployments

- **Production:** Main branch deployments
- **Preview:** Pull request and branch deployments
- **Rollback:** Click **"⋯"** → **"Promote to Production"** on any previous deployment

### Environment Variables

Update variables:

1. **Settings** → **Environment Variables**
2. Edit or add variables
3. **Save**
4. Redeploy for changes to take effect

### Analytics (Optional)

Enable Vercel Analytics:

1. **Analytics** tab in dashboard
2. Click **"Enable"**
3. Add analytics script (automatic with Vercel)

### Logs

View runtime logs:

1. **Deployments** → Click on a deployment
2. **View Function Logs**
3. Filter by timeframe and severity

---

## 🔐 Security Best Practices

### ✅ Completed in This Project

- ✅ Environment variables for sensitive data
- ✅ HTTPS enforced (automatic on Vercel)
- ✅ Security headers configured (X-Frame-Options, CSP, etc.)
- ✅ No API keys in client-side code
- ✅ CORS properly configured
- ✅ Authentication tokens stored in httpOnly cookies

### 📋 Backend Checklist

- [ ] CORS allows only specific domains (not `*`)
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] JWT tokens with expiration
- [ ] HTTPS enforced on backend
- [ ] SQL injection protection
- [ ] XSS protection

---

## 📊 Performance Optimization

### Already Implemented

- ✅ Next.js automatic code splitting
- ✅ Image optimization via Next.js Image component
- ✅ Gzip compression enabled
- ✅ React strict mode for better optimization

### Recommended

1. **Enable Vercel Speed Insights:**

   - Go to **Speed Insights** tab
   - Click **"Enable"**

2. **Monitor Core Web Vitals:**

   - Check **Analytics** → **Web Vitals**
   - Optimize pages with poor scores

3. **Use SWR Caching:**
   - Already implemented in the project
   - Configure `dedupingInterval` for your needs

---

## 🆘 Common Vercel CLI Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# View logs
vercel logs [deployment-url]

# Pull environment variables
vercel env pull

# Add environment variable
vercel env add NEXT_PUBLIC_API_BASE_URL

# Remove environment variable
vercel env rm NEXT_PUBLIC_API_BASE_URL
```

---

## 📧 Support & Resources

### Vercel Documentation

- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)

### Project Support

- **Email:** support@klfashion.com
- **GitHub Issues:** [Create an issue](https://github.com/Devmate-Solutions/KI_Fashion_Supplier_Portal/issues)

---

## ✅ Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All environment variables are set in Vercel
- [ ] Backend CORS allows Vercel domain
- [ ] All pages load correctly in local production build (`npm run build && npm start`)
- [ ] Login and authentication work
- [ ] API calls are successful
- [ ] Images load correctly
- [ ] Forms submit successfully
- [ ] No console errors in browser
- [ ] Mobile responsive design works
- [ ] All navigation links work
- [ ] Error pages display correctly (404, 500)

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ Build completes without errors
✅ Vercel provides a live URL
✅ Login page loads and accepts credentials
✅ Dashboard displays after login
✅ API calls return data (check Network tab)
✅ No CORS errors in console
✅ Images and assets load correctly
✅ All features work as in local development

---

## 📝 Quick Reference

**Environment Variable:**

```
NEXT_PUBLIC_API_BASE_URL=https://kl-backend-v2-production-5f50.up.railway.app
```

**Vercel Dashboard:**

```
https://vercel.com/dashboard
```

**GitHub Repository:**

```
https://github.com/Devmate-Solutions/KI_Fashion_Supplier_Portal
```

**Backend API:**

```
https://kl-backend-v2-production-5f50.up.railway.app
```

---

**Last Updated:** December 2025
**Version:** 2.0.0
**Status:** Production Ready ✅
