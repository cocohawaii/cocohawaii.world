# 🔴 CRITICAL FIX - DO THIS NOW

## The Problem

You're **STILL using the IST token** in Vercel! 

The debug page shows: `IST.eyJraWQiOiJQb3pI...` - this means you haven't replaced it with your API Key yet.

## ✅ EXACT STEPS TO FIX

### Step 1: Get Your API Key Token

1. Go to your Wix dashboard → **API Keys** section
2. Click on one of your API Keys (e.g., "Coco Hawaii Site")
3. **Click to reveal/copy the FULL token**
4. Copy the **ENTIRE token** (it's long, not just the preview)

### Step 2: Check Which Site Has Your Collection

**IMPORTANT:** Your collection might be in the **OLD site**, not the new headless project!

Check both:
- **Old Site**: `9aaa89a5-25af-48f6-9c3f-88d916792133`
- **New Headless Site**: `54942d63-ccfb-4be3-9a63-9cdf74dca14a`

**Where is your collection actually located?**

### Step 3: Update Vercel Environment Variables

1. Go to: https://vercel.com/coco-hawaiis-projects/cocohawaii-website/settings/environment-variables

2. **Find:** `NEXT_PUBLIC_WIX_API_KEY`

3. **DELETE the IST token** (the one starting with "IST.")

4. **PASTE your API Key token** (from Step 1)

5. **Also check Site ID:**
   - If collection is in **old site**: Use `9aaa89a5-25af-48f6-9c3f-88d916792133`
   - If collection is in **new site**: Use `54942d63-ccfb-4be3-9a63-9cdf74dca14a`

6. **SAVE** - Vercel will redeploy

### Step 4: Verify API Key Permissions

In Wix dashboard, on your API Key:
- Click **"Show permissions"**
- **MUST HAVE:** "Data Collections" → **"Read"** ✅
- If missing, regenerate the key with correct permissions

## 🎯 Quick Test

After updating, visit:
- https://cocohawaii-website.vercel.app/api/test-api-keys

This will show if the API Key works!

## ⚠️ Common Mistakes

1. ❌ Using IST token instead of API Key
2. ❌ Using wrong Site ID (collection in different site)
3. ❌ API Key missing "Data Collections" permission
4. ❌ Copying truncated preview instead of full token

## ✅ What Should Work

Once you:
- ✅ Use API Key (not IST token)
- ✅ Use correct Site ID (where collection actually is)
- ✅ API Key has Data Collections Read permission

**It WILL work!**
