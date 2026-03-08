# Fix Wix API Connection - Step by Step Guide

## The Problem
All API endpoints are returning 404 errors, which means the API can't find your collection.

## Most Likely Causes

### 1. Site ID is Incorrect
**Check this first!**

1. Go to: https://www.wix.com/my-account/site-selector
2. Select your site
3. Go to **Settings** → **Advanced** → **Developer Tools**
4. Copy the **Site ID** exactly
5. Compare it to what's in your `.env.local` file
6. If they don't match, update `.env.local` and restart the server

### 2. IST Token Permissions
Your IST token needs specific permissions:

1. Go to: https://www.wix.com/my-account/site-selector
2. Select your site
3. Go to **Settings** → **Advanced** → **API Keys**
4. Find your IST token
5. Make sure it has:
   - ✅ **Data Collections** permission
   - ✅ **Read** access enabled
   - ✅ Created for the **correct site**

### 3. Collection Type
Verify your collection type in Wix:

1. Go to **Content Manager** → **Collections**
2. Find "CocoHawaiiExoticHats"
3. Check if it's:
   - A **Data Collection** (Headless CMS) ✅
   - A **Wix Stores Product** ❌ (uses different API)
   - Something else ❌

### 4. Regenerate IST Token
If nothing works, try creating a new IST token:

1. Go to **Settings** → **Advanced** → **API Keys**
2. Create a new **Instance Token (IST)**
3. Make sure to:
   - Select the correct site
   - Grant **Data Collections** permissions
   - Copy the token immediately (you can't see it again)
4. Update `.env.local` with the new token
5. Restart the server

## Test Your Connection

Visit these URLs to test:

1. **Debug Page**: http://localhost:3001/debug
2. **Test IST Token**: http://localhost:3001/api/test-ist-token
3. **Verify Site ID**: http://localhost:3001/api/verify-site-id

## Quick Fix Checklist

- [ ] Site ID matches exactly in Wix dashboard and `.env.local`
- [ ] IST token has Data Collections permissions
- [ ] IST token was created for the correct site
- [ ] Collection is a Data Collection (not Stores product)
- [ ] Collection name is exactly "CocoHawaiiExoticHats"
- [ ] Restarted the dev server after updating `.env.local`

## If Still Not Working

The issue is likely one of these:
1. **Site ID is wrong** - Most common issue
2. **IST token is for wrong site** - Check which site the token was created for
3. **API endpoint structure changed** - Wix might have updated their API

Try regenerating the IST token with the correct permissions and site selection.

