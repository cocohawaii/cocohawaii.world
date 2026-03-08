# ✅ OAuth Setup Guide - Complete Instructions

## 🎯 What We Just Built

I've created the OAuth flow for your Wix Headless CMS:

1. ✅ **`/api/wix/login`** - Redirects users to Wix OAuth login
2. ✅ **`/api/wix/callback`** - Exchanges authorization code for access token
3. ✅ **Updated `lib/wix.ts`** - Now uses OAuth access tokens for CMS calls

---

## 📋 Step 1: Get Your Client Secret

1. **Go to Wix Dashboard** → Headless Settings
2. **Click on "Coco Hawaii"** client
3. **Look for "OAuth Settings"** or **"Secrets"** section
4. **Copy the Client Secret** (it will be a long string)

---

## 📋 Step 2: Add Redirect URL in Wix

1. **In the same OAuth Settings page**, find **"Redirect URLs"** or **"Allowed Redirect URIs"**
2. **Add these URLs:**

   **For local development:**
   ```
   http://localhost:3001/api/wix/callback
   ```

   **For Vercel (after deployment):**
   ```
   https://cocohawaii-website.vercel.app/api/wix/callback
   ```
   (Or your custom domain: `https://cocohawaii.world/api/wix/callback`)

3. **Click "Save"**

---

## 📋 Step 3: Set Environment Variables

### In Vercel:

Add these **3 environment variables**:

1. **`WIX_CLIENT_ID`**
   - Value: `c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6`
   - ⚠️ **NOT** `NEXT_PUBLIC_` prefix (server-side only)

2. **`WIX_CLIENT_SECRET`**
   - Value: (the Client Secret you copied from Step 1)
   - ⚠️ **NOT** `NEXT_PUBLIC_` prefix (server-side only, keep secret!)

3. **`WIX_REDIRECT_URI`**
   - For production: `https://cocohawaii-website.vercel.app/api/wix/callback`
   - (Or your custom domain)
   - ⚠️ **NOT** `NEXT_PUBLIC_` prefix

### In `.env.local` (for local development):

```env
WIX_CLIENT_ID=c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6
WIX_CLIENT_SECRET=your_client_secret_here
WIX_REDIRECT_URI=http://localhost:3001/api/wix/callback
```

---

## 📋 Step 4: Test the OAuth Flow

### Local Development:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Visit:** `http://localhost:3001/api/wix/login`
   - This will redirect you to Wix login
   - After logging in, you'll be redirected back
   - The access token will be stored in a cookie

3. **Visit your homepage:** `http://localhost:3001`
   - The CMS data should now load!

### Production (Vercel):

1. **After deploying**, visit: `https://cocohawaii-website.vercel.app/api/wix/login`
2. **Complete OAuth flow**
3. **Visit homepage** - CMS data should load!

---

## 🔄 How It Works

```
User visits /api/wix/login
    ↓
Redirects to Wix OAuth login
    ↓
User approves app
    ↓
Wix redirects to /api/wix/callback?code=XXX
    ↓
Server exchanges code → access token
    ↓
Access token stored in httpOnly cookie
    ↓
All CMS calls use access token automatically
```

---

## 🚨 Important Notes

### ⚠️ Access Token Expiration

- OAuth access tokens expire (usually 1-4 hours)
- When expired, user needs to visit `/api/wix/login` again
- In production, you might want to:
  - Store tokens in a database
  - Implement token refresh
  - Auto-redirect to login if token expired

### ⚠️ Server-Side Only

- OAuth tokens are stored in **httpOnly cookies** (server-side only)
- CMS calls happen **server-side** (in API routes or Server Components)
- **Never** expose tokens to the browser

### ⚠️ First-Time Setup

- **First user visit** will need to authenticate
- After that, token is stored in cookie
- Subsequent visits work automatically (until token expires)

---

## 🧪 Testing

### Check if OAuth is working:

1. **Visit:** `/api/wix/login` - Should redirect to Wix
2. **After callback:** Check browser cookies for `wix_access_token`
3. **Visit homepage:** Should see hats from CMS

### Debug endpoint:

Visit `/debug` to see:
- OAuth token status
- CMS connection status
- Environment variables

---

## 🎯 Next Steps

1. ✅ Get Client Secret from Wix
2. ✅ Add Redirect URLs in Wix OAuth Settings
3. ✅ Add environment variables to Vercel
4. ✅ Test OAuth flow
5. ✅ Verify CMS data loads

---

## ❓ Troubleshooting

### "Missing WIX_CLIENT_SECRET"
- Make sure you added `WIX_CLIENT_SECRET` (not `NEXT_PUBLIC_WIX_CLIENT_SECRET`)
- Check it's set in Vercel environment variables

### "Invalid redirect_uri"
- Make sure redirect URL in Wix matches exactly what's in `WIX_REDIRECT_URI`
- Check for trailing slashes, http vs https, etc.

### "CMS still returns 404"
- Make sure you've completed OAuth flow (visit `/api/wix/login`)
- Check that access token cookie is set
- Verify token hasn't expired

---

## 📚 Summary

**You now have:**
- ✅ OAuth login endpoint
- ✅ OAuth callback endpoint  
- ✅ CMS calls using OAuth tokens
- ✅ Secure token storage (httpOnly cookies)

**You need to:**
- 🔑 Get Client Secret from Wix
- 🔗 Add Redirect URLs in Wix
- 🔧 Set environment variables in Vercel
- 🧪 Test the flow

Once you complete these steps, your CMS connection will work! 🎉
