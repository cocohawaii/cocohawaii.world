# Quick Setup - Add Your Wix API Token

## Step 1: Create/Update `.env.local` file

Create a file named `.env.local` in the root directory of your project with this content:

```env
NEXT_PUBLIC_WIX_CLIENT_ID=f70e4578-88dd-4e18-a162-f0b64f4dd734
NEXT_PUBLIC_WIX_ACCOUNT_ID=1510fbf9-5839-46ae-a724-04b3460c1057
NEXT_PUBLIC_WIX_SITE_ID=YOUR_SITE_ID_HERE
NEXT_PUBLIC_WIX_API_KEY=IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjNjZWVkZTU3LWUyOGUtNDE2Ni04YmIzLWU0NTIyYTI3OTRiYVwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjE3ODQ3YWE2LTVmN2ItNDczMC04ZDRlLTkzMzUyNDBlNmE1ZFwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxNTEwZmJmOS01ODM5LTQ2YWUtYTcyNC0wNGIzNDYwYzEwNTdcIn19IiwiaWF0IjoxNzY2ODAyMDA5fQ.i-X-JPvZ5qahhYHRcB5TmjVUs0TgEgUFsO3s_MGg1tT3YcrdI_svjxx7VB_D3wn7d6fRTFlyIH6aF7E9rJo9ibnqL-VHZmOnIZ_4PhXlhqOYEOwwz4LFhSx4dAReGM7_5case5ZSvaP2ks6mmdKgPu-5d91ihkhzuFVlEZzQXQ3k41ht0mRK9S6WfBclsXooRR9i4IwkPyA79mqxMpcEUfAMBB6gPW6dzeeOOEaR5u2L8USTcZ0LzYDplrEpniRLlc7BINA-GOW8Wg6aOoW_ZSTh5JBW1Nejv9VGGqN8t39pKgj35m7wD5p2-FT_T22N40KHyWa5jMoxYj1u_SnDmw
```

## Step 2: Get Your Wix Site ID

1. Go to https://www.wix.com/my-account/site-selector
2. Select your site
3. Go to **Settings** → **Advanced** → **Developer Tools**
4. Copy your **Site ID** and replace `YOUR_SITE_ID_HERE` above

## Step 3: Restart Your Dev Server

After saving `.env.local`:

1. Stop your current dev server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

## Step 4: Test

Visit http://localhost:3001/collections - you should now see your hats from the `CocoHawaiiExoticHats` collection!

## Troubleshooting

If you still don't see data:
- Check the browser console (F12) for errors
- Check the terminal where the dev server is running for API errors
- Verify your Site ID is correct
- Make sure the collection name in Wix is exactly `CocoHawaiiExoticHats` (case-sensitive)
