# Wix Headless Authentication Guide

## Which Option to Choose?

**✅ Choose: "Create Custom Headless Experiences" / "Create a project"**

This is the correct option for:
- Next.js websites connecting to Wix CMS
- External frontends using Wix as a headless CMS
- Your use case: Coco Hawaii website

**❌ NOT: "Build Wix Apps"**
- That's for building apps for Wix App Market
- Not what you need

---

## Wix Headless Authentication

According to Wix documentation, **headless projects use different authentication** than regular OAuth apps.

### Option 1: Headless Authentication (Recommended)

Wix Headless has its own authentication strategies. You might already have what you need:

1. **Client ID** (from Headless settings) ✅ You have: `f70e4578-88dd-4e18-a162-f0b64f4dd734`
2. **Site ID** ✅ You have: `9aaa89a5-25af-48f6-9c3f-88d916792133`
3. **API Token** - This should work, but IST tokens from Dev Center might not be REST-compatible

### Option 2: OAuth Client Credentials (If Headless Auth Doesn't Work)

If headless authentication doesn't work, you can try OAuth:

1. Create a **Wix App** (not just headless project)
2. Get **App Secret Key** (Client Secret)
3. Use OAuth Client Credentials flow

---

## Next Steps

### Step 1: Create Headless Project

1. Click **"Create Custom Headless Experiences"**
2. Click **"Create a project"**
3. Follow the setup wizard
4. This should give you proper headless credentials

### Step 2: Check What You Get

After creating the headless project, you should get:
- ✅ Client ID (you already have this)
- ❓ API Key/Token (might be different from IST token)
- ❓ Site ID confirmation

### Step 3: Test Authentication

Once you have the credentials:
1. Add them to Vercel environment variables
2. Test at: `https://cocohawaii-website.vercel.app/api/test-oauth-token`
3. Check if it works!

---

## Important Note

The IST token you have might be for **internal Wix flows only**, not REST APIs. 

When you create a **headless project**, Wix should provide:
- Proper API credentials for REST API access
- OR instructions for headless-specific authentication

---

## If Headless Project Doesn't Work

If creating a headless project doesn't give you working REST API credentials:

1. Create a **Wix App** instead (the other option)
2. Get App Secret Key
3. Use OAuth Client Credentials flow (already implemented in the code)

---

## Summary

**Choose: "Create Custom Headless Experiences" → "Create a project"**

This is specifically designed for your use case: external Next.js site connecting to Wix CMS.
