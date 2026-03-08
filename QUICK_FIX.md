# Quick Fix: Missing Wix Site ID

## The Problem
Your Wix Site ID is missing from the environment variables. This is required for the API to work.

## Quick Solution

### Step 1: Get Your Site ID

**Option A - From Wix Dashboard:**
1. Go to: https://www.wix.com/my-account/site-selector
2. Select your site
3. Go to: **Settings** → **Advanced** → **Developer Tools**
4. Copy your **Site ID**

**Option B - From Browser:**
1. Log into your Wix account
2. Go to your site editor
3. The Site ID might be visible in the URL or in site settings

### Step 2: Update `.env.local`

Create or edit the `.env.local` file in your project root with:

```env
NEXT_PUBLIC_WIX_CLIENT_ID=f70e4578-88dd-4e18-a162-f0b64f4dd734
NEXT_PUBLIC_WIX_ACCOUNT_ID=1510fbf9-5839-46ae-a724-04b3460c1057
NEXT_PUBLIC_WIX_SITE_ID=PASTE_YOUR_SITE_ID_HERE
NEXT_PUBLIC_WIX_API_KEY=IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjNjZWVkZTU3LWUyOGUtNDE2Ni04YmIzLWU0NTIyYTI3OTRiYVwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjE3ODQ3YWE2LTVmN2ItNDczMC04ZDRlLTkzMzUyNDBlNmE1ZFwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxNTEwZmJmOS01ODM5LTQ2YWUtYTcyNC0wNGIzNDYwYzEwNTdcIn19IiwiaWF0IjoxNzY2ODAyMDA5fQ.i-X-JPvZ5qahhYHRcB5TmjVUs0TgEgUFsO3s_MGg1tT3YcrdI_svjxx7VB_D3wn7d6fRTFlyIH6aF7E9rJo9ibnqL-VHZmOnIZ_4PhXlhqOYEOwwz4LFhSx4dAReGM7_5case5ZSvaP2ks6mmdKgPu-5d91ihkhzuFVlEZzQXQ3k41ht0mRK9S6WfBclsXooRR9i4IwkPyA79mqxMpcEUfAMBB6gPW6dzeeOOEaR5u2L8USTcZ0LzYDplrEpniRLlc7BINA-GOW8Wg6aOoW_ZSTh5JBW1Nejv9VGGqN8t39pKgj35m7wD5p2-FT_T22N40KHyWa5jMoxYj1u_SnDmw
```

Replace `PASTE_YOUR_SITE_ID_HERE` with your actual Site ID.

### Step 3: Restart Dev Server

1. **Stop** the current server (press `Ctrl+C` in terminal)
2. **Start** it again:
   ```bash
   npm run dev
   ```

### Step 4: Test

1. Visit: http://localhost:3001/debug
2. Check if all environment variables show ✓ (green checkmarks)
3. Visit: http://localhost:3001/collections
4. Your hats should now appear!

## Still Not Working?

If you still see errors after adding the Site ID:
1. Check the debug page: http://localhost:3001/debug
2. Look at the terminal/console for error messages
3. Verify the Site ID is correct (no extra spaces, correct format)
4. Make sure you restarted the dev server after adding the Site ID
