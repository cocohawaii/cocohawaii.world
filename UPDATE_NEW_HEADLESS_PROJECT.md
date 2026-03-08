# Update to New Headless Project

## ✅ What You Have

- **New Headless Project Site ID**: `54942d63-ccfb-4be3-9a63-9cdf74dca14a`
- **New Client ID**: `c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6` ✅ Updated in Vercel

## 📋 Update Vercel Environment Variables

Go to: https://vercel.com/coco-hawaiis-projects/cocohawaii-website/settings/environment-variables

### Update These Variables:

1. **NEXT_PUBLIC_WIX_CLIENT_ID** ✅ (Already updated)
   - Value: `c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6`

2. **NEXT_PUBLIC_WIX_SITE_ID** ⚠️ (NEEDS UPDATE)
   - **OLD**: `9aaa89a5-25af-48f6-9c3f-88d916792133`
   - **NEW**: `54942d63-ccfb-4be3-9a63-9cdf74dca14a`
   - Update to the new value!

3. **Keep These** (if still needed):
   - `NEXT_PUBLIC_WIX_ACCOUNT_ID`: `1510fbf9-5839-46ae-a724-04b3460c1057`
   - `NEXT_PUBLIC_WIX_METASITE_ID`: `e2051e40-d8bd-4f0b-b7e4-f04012108b4e` (might not be needed with new project)
   - `NEXT_PUBLIC_WIX_API_KEY`: (IST token - might not be needed with OAuth SDK)

## 🔑 Important: Check Your Collection

1. Go to your **new headless project dashboard**:
   - https://manage.wix.com/dashboard/54942d63-ccfb-4be3-9a63-9cdf74dca14a/database/

2. Check if collection **"CocoHawaiiExoticHats"** exists:
   - ✅ If it exists: Make sure it has products/hats
   - ❌ If it doesn't exist: 
     - Create it in Content Manager
     - Add your hat products
     - Collection name must be exactly: `CocoHawaiiExoticHats`

## 🎯 After Updating

1. Update `NEXT_PUBLIC_WIX_SITE_ID` in Vercel
2. Wait for auto-redeploy (1-2 minutes)
3. Visit: https://cocohawaii-website.vercel.app
4. Your hats should appear!

## ✅ Summary

- ✅ Client ID updated
- ⚠️ Site ID needs update: `54942d63-ccfb-4be3-9a63-9cdf74dca14a`
- ⚠️ Check collection exists in new site
- ✅ Code is ready to use Wix SDK with OAuth
