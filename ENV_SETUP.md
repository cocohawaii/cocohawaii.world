# Environment Variables Setup

## Your Wix API Token

Add this to your `.env.local` file in the root directory:

```env
# Wix Configuration
NEXT_PUBLIC_WIX_CLIENT_ID=f70e4578-88dd-4e18-a162-f0b64f4dd734
NEXT_PUBLIC_WIX_ACCOUNT_ID=1510fbf9-5839-46ae-a724-04b3460c1057
NEXT_PUBLIC_WIX_SITE_ID=your_wix_site_id_here
NEXT_PUBLIC_WIX_API_KEY=IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjNjZWVkZTU3LWUyOGUtNDE2Ni04YmIzLWU0NTIyYTI3OTRiYVwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjE3ODQ3YWE2LTVmN2ItNDczMC04ZDRlLTkzMzUyNDBlNmE1ZFwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxNTEwZmJmOS01ODM5LTQ2YWUtYTcyNC0wNGIzNDYwYzEwNTdcIn19IiwiaWF0IjoxNzY2ODAyMDA5fQ.i-X-JPvZ5qahhYHRcB5TmjVUs0TgEgUFsO3s_MGg1tT3YcrdI_svjxx7VB_D3wn7d6fRTFlyIH6aF7E9rJo9ibnqL-VHZmOnIZ_4PhXlhqOYEOwwz4LFhSx4dAReGM7_5case5ZSvaP2ks6mmdKgPu-5d91ihkhzuFVlEZzQXQ3k41ht0mRK9S6WfBclsXooRR9i4IwkPyA79mqxMpcEUfAMBB6gPW6dzeeOOEaR5u2L8USTcZ0LzYDplrEpniRLlc7BINA-GOW8Wg6aOoW_ZSTh5JBW1Nejv9VGGqN8t39pKgj35m7wD5p2-FT_T22N40KHyWa5jMoxYj1u_SnDmw

# PayPal Configuration (optional)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
```

## How to Get Your Wix Site ID

1. Go to your Wix dashboard
2. Navigate to **Settings** → **Advanced** → **Developer Tools**
3. Your **Site ID** will be displayed there
4. Copy it and replace `your_wix_site_id_here` in the `.env.local` file

## Important Notes

- The `.env.local` file should be in the root directory of your project
- **DO NOT** commit `.env.local` to git (it's already in `.gitignore`)
- After updating `.env.local`, restart your dev server for changes to take effect
- The API token you provided is an OAuth token (starts with "IST.")

## After Setting Up

1. Create/update `.env.local` with the values above
2. Add your Wix Site ID
3. Restart your dev server:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```
4. Visit http://localhost:3001/collections to see your hats!
