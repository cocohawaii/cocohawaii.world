# Update to New Headless Project Client ID

## ✅ New Client ID

You've created a new headless project with Client ID:
```
c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6
```

## 📋 Update Vercel Environment Variable

1. Go to: https://vercel.com/coco-hawaiis-projects/cocohawaii-website/settings/environment-variables

2. Find: `NEXT_PUBLIC_WIX_CLIENT_ID`

3. Update the value to:
   ```
   c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6
   ```

4. Save (Vercel will auto-redeploy)

## 🔑 About CMS Data

**Important:** The headless project is just the **authentication/connection**. 

The actual **CMS collections** must exist in your **Wix SITE**:

1. Go to your Wix SITE dashboard (not the headless project)
   - Site ID: `9aaa89a5-25af-48f6-9c3f-88d916792133`

2. Go to **Content Manager**

3. Check if collection **"CocoHawaiiExoticHats"** exists:
   - ✅ If it exists: Make sure it has products/hats in it
   - ❌ If it doesn't exist: Create it and add your hats

4. The collection name must match exactly: `CocoHawaiiExoticHats`

## 🎯 How It Works

- **Headless Project** = Authentication (Client ID)
- **Wix Site** = Where your actual data/collections live
- **Collection** = "CocoHawaiiExoticHats" with your hat products

The headless project connects to your Wix site to read the collections!

## ✅ After Updating

1. Update Client ID in Vercel
2. Wait for redeploy
3. Check: https://cocohawaii-website.vercel.app
4. Your hats should appear!
