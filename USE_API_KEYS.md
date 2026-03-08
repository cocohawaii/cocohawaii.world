# ✅ How to Use Your API Keys

## You Have API Keys! (Not IST Tokens)

I can see you have these API Keys generated:
- ✅ "Coco Hawaii"
- ✅ "Manage CH Website"  
- ✅ "Coco Hawaii Site"

These are **REAL REST API keys** (they don't start with "IST.")!

## 📋 Steps to Use Them

### Step 1: Copy the Full Token

1. In your API Keys dashboard, click on one of the keys (e.g., "Coco Hawaii Site")
2. **Copy the FULL token** - not just the truncated preview shown
3. The token should be quite long

### Step 2: Check Permissions

1. Click **"Show permissions"** on the key you want to use
2. **VERIFY:**
   - ✅ "Data Collections" → **"Read"** is checked
   - ✅ Other necessary permissions are enabled
3. If permissions are missing, you may need to regenerate the key with correct permissions

### Step 3: Add to Vercel

1. Go to: https://vercel.com/coco-hawaiis-projects/cocohawaii-website/settings/environment-variables
2. Find: `NEXT_PUBLIC_WIX_API_KEY`
3. **Replace the IST token** with your **API Key token**
4. Save
5. Vercel will auto-redeploy

### Step 4: Test

After redeploy, visit:
- https://cocohawaii-website.vercel.app/api/test-api-keys

This will test if the API Key works!

## 🔑 About Secrets Manager

**You DON'T need Secrets Manager for this!**

Secrets Manager is for storing **third-party** API keys (like external services).
Your **Wix API Keys** go directly in Vercel environment variables.

## ✅ What Should Work

Once you use a proper API Key (not IST token):
- ✅ REST API calls should work
- ✅ Collection queries should return data
- ✅ Your hats should appear on the website!

## 🎯 Quick Checklist

- [ ] Collection "CocoHawaiiExoticHats" exists ✅ (confirmed)
- [ ] Collection has hats ✅ (confirmed)
- [ ] Copy FULL API Key token from dashboard
- [ ] Check API Key has "Data Collections" → "Read" permission
- [ ] Add API Key to Vercel as `NEXT_PUBLIC_WIX_API_KEY`
- [ ] Wait for Vercel redeploy
- [ ] Test at `/api/test-api-keys`
- [ ] Check website - hats should appear!

## ⚠️ Important

**Make sure:**
- The API Key is for the **same site** where your collection exists
- The API Key has **Data Collections Read** permission
- You copy the **FULL token** (not truncated preview)
