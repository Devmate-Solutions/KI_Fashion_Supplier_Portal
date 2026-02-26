# 🔌 API Configuration - Backend Connection

## 📍 Backend API Base URL

**Location:** `lib/constants.js`

```javascript
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://kifashionbackend2-production.up.railway.app";
```

## ⚠️ Important: No `/api` Suffix

The backend API base URL should **NOT** include `/api` at the end because:

1. **Frontend API calls** use paths like `/auth/login`, `/products`, `/dispatch-orders`
2. These paths are **appended directly** to the base URL
3. If base URL already has `/api`, it would create double paths like `/api/api/auth/login`

## 📝 How API Calls Work

### Example: Login Request

**Base URL:** `https://kifashionbackend2-production.up.railway.app`  
**API Path:** `/auth/login`  
**Final URL:** `https://kifashionbackend2-production.up.railway.app/auth/login`

### Code Flow

1. **API Client** (`lib/apiClient.js`):

   ```javascript
   const apiClient = axios.create({
     baseURL: API_BASE_URL, // No /api here
   });
   ```

2. **API Functions** (`lib/api/auth.js`):

   ```javascript
   export async function login(credentials) {
     const { data } = await apiClient.post("/auth/login", credentials);
     // Makes request to: baseURL + "/auth/login"
     return data;
   }
   ```

3. **Result:**
   - Base: `https://kifashionbackend2-production.up.railway.app`
   - Path: `/auth/login`
   - **Final:** `https://kifashionbackend2-production.up.railway.app/auth/login`

## 🔧 Environment Variable

### For Vercel

**Variable Name:** `NEXT_PUBLIC_API_BASE_URL`  
**Value:** `https://kifashionbackend2-production.up.railway.app`  
**⚠️ Note:** Do NOT include `/api` at the end

### For Local Development

Create `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://kifashionbackend2-production.up.railway.app
```

Or use local backend:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## 📂 File Structure

```
lib/
├── constants.js          # API_BASE_URL definition
├── apiClient.js          # Axios instance with baseURL
└── api/
    ├── auth.js           # Uses: apiClient.post("/auth/login")
    ├── products.js       # Uses: apiClient.get("/products")
    ├── dispatchOrders.js # Uses: apiClient.get("/dispatch-orders")
    └── ...
```

## ✅ Verification

To verify the API configuration is correct:

1. **Check base URL:**

   ```javascript
   // In browser console
    
   ```

2. **Test API call:**

   ```javascript
   // In browser console
   fetch("https://kifashionbackend2-production.up.railway.app/auth/me")
     .then((r) => r.json())
     .then(console.log)
     .catch(console.error);
   ```

3. **Check Network Tab:**
   - Open DevTools → Network tab
   - Try logging in
   - Verify the request URL is correct (no double `/api`)

## 🚨 Common Mistakes

### ❌ Wrong Configuration

```javascript
// DON'T DO THIS
API_BASE_URL = "https://kifashionbackend2-production.up.railway.app/api";
// Results in: /api/api/auth/login (double /api)
```

### ✅ Correct Configuration

```javascript
// DO THIS
API_BASE_URL = "https://kifashionbackend2-production.up.railway.app";
// Results in: /auth/login (correct)
```

## 🔗 Backend Endpoints

All backend endpoints are accessed via:

- **Auth:** `/auth/login`, `/auth/register`, `/auth/me`
- **Products:** `/products`, `/products/:id`
- **Dispatch Orders:** `/dispatch-orders`, `/dispatch-orders/:id`
- **Purchase Orders:** `/purchase-orders`, `/purchase-orders/:id`
- **Returns:** `/returns`, `/returns/:id`
- **Ledger:** `/ledger`
- **Settings:** `/settings`

All paths are relative to the base URL defined in `lib/constants.js`.

---

**Last Updated:** December 2025  
**Status:** ✅ Configured Correctly
