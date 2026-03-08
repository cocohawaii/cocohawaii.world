# ✅ Headless Project Checklist

## Current Status

- ✅ Client ID: `c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6` (Updated in Vercel)
- ✅ Site ID: `54942d63-ccfb-4be3-9a63-9cdf74dca14a` (Updated in Vercel)
- ❌ **Still getting 404 errors**

## 🔴 The Real Problem

1. **IST tokens don't work** - They return 404 for REST APIs
2. **Wix SDK needs authentication** - OAuthStrategy requires an access token or proper setup
3. **Collection might not exist** in your new headless project

## ✅ What to Check in Your Headless Project

### Step 1: Check for API Key (NOT IST Token)

1. Go to: https://manage.wix.com/dashboard/54942d63-ccfb-4be3-9a63-9cdf74dca14a/
2. Look for:
   - **Settings** → **API Keys** or **Headless Settings**
   - **Generate API Key** button
   - This should be different from IST token (should NOT start with "IST.")

### Step 2: Check for Client Secret

1. In headless project dashboard
2. Look for **"App Settings"** or **"Secrets"** section
3. Find **"App Secret Key"** or **"Client Secret"**
4. If you find it, we'll use it for OAuth Client Credentials

### Step 3: Verify Collection Exists

1. Go to: https://manage.wix.com/dashboard/54942d63-ccfb-4be3-9a63-9cdf74dca14a/database/
2. Check if collection **"CocoHawaiiExoticHats"** exists
3. If it doesn't exist:
   - Create it
   - Add your hat products
   - Collection name must be exactly: `CocoHawaiiExoticHats`

### Step 4: Check Headless Client Settings

1. In headless project dashboard
2. Go to **"Headless Settings"** or **"Headless Clients"**
3. Check your client configuration:
   - Client ID should match: `c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6`
   - Look for **"API Key"** or **"Secret Key"** section
   - Check if there are any permissions/scopes to enable

## 🎯 Possible Solutions

### Solution 1: Get API Key from Headless Project
- Generate an API Key (not IST token)
- Add to Vercel as `NEXT_PUBLIC_WIX_API_KEY`
- This should work with REST APIs

### Solution 2: Use OAuth Client Credentials
- Get Client Secret from headless project
- Use it to get OAuth access token
- Code already implemented for this

### Solution 3: Use Old Site with New Client
- Keep old Site ID: `9aaa89a5-25af-48f6-9c3f-88d916792133`
- Use new Client ID: `c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6`
- Get API Key from headless project
- Collection exists in old site

## 📋 Action Items

Please check your headless project dashboard and tell me:

1. ❓ Do you see an **API Key** section (not IST token)?
2. ❓ Do you see a **Client Secret** or **App Secret Key**?
3. ❓ Does collection **"CocoHawaiiExoticHats"** exist in the database?
4. ❓ What sections do you see in the headless project settings?

Once I know what's available, I can configure the code correctly!
