# How to Get Your Wix Site ID

## Method 1: From Wix Dashboard (Easiest)

1. **Go to your Wix site dashboard**: https://www.wix.com/my-account/site-selector
2. **Select your site** from the list
3. **Click on Settings** (gear icon in the left sidebar)
4. **Go to Advanced** → **Developer Tools**
5. **Your Site ID** will be displayed there (it's a long string like: `abc123-def456-ghi789`)

## Method 2: From Your Site URL

If you know your Wix site URL, the Site ID is often in the URL structure, but the dashboard method is more reliable.

## Method 3: Check Your Wix Account

1. Go to https://www.wix.com/my-account
2. Click on your site
3. Look for Site Settings → Advanced → Developer Tools

## After Getting Your Site ID

Add it to your `.env.local` file:

```env
NEXT_PUBLIC_WIX_SITE_ID=your_actual_site_id_here
```

Then **restart your dev server** (stop with Ctrl+C and run `npm run dev` again).
