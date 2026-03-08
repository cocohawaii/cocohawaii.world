# Vercel Deployment Instructions

## Environment Variables to Set in Vercel

After deployment, you MUST add these environment variables in Vercel Dashboard:

1. Go to your project in Vercel Dashboard
2. Go to Settings > Environment Variables
3. Add these variables:

```
NEXT_PUBLIC_WIX_CLIENT_ID=f70e4578-88dd-4e18-a162-f0b64f4dd734
NEXT_PUBLIC_WIX_ACCOUNT_ID=1510fbf9-5839-46ae-a724-04b3460c1057
NEXT_PUBLIC_WIX_SITE_ID=9aaa89a5-25af-48f6-9c3f-88d916792133
NEXT_PUBLIC_WIX_METASITE_ID=e2051e40-d8bd-4f0b-b7e4-f04012108b4e
NEXT_PUBLIC_WIX_API_KEY=IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjM3ZDhlYzFkLTJlODEtNGEyMC1hZTg1LTFmYTk4NTgxNzJkZlwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjQwMWI3ZmYzLTY1MDgtNGUxZS1hNzQ1LWM1MGYzNTNlOTRkMFwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxNTEwZmJmOS01ODM5LTQ2YWUtYTcyNC0wNGIzNDYwYzEwNTdcIn19IiwiaWF0IjoxNzY3ODk1OTc1fQ.L0vyqe7C5xjhufk9wnU5I4c6X3S8X41VAEfyU0uvXgl6k984rHZXhNVnLkZdSAUptVyZZ507reVFv3qFVd9R8PPlYTFJbM5thh0ztuNLoLNB23vPZDi-SVXI_8nhSUtMHja6fLTb1Vmcx2njXv_v76YegzQHz7xhTGxs7JY7n7ZNSndJR9SpIUK6JBeWYu3S7J7OJo7o9jcM9eCaw2mfsToafTH7SJ3JhUSVUeS9fG0syaWfUA5trdU5la3Jm2HLHv-t592G7HCwljAhFjpzfamULJP7g7QkgsuL7wbzqoUNks47Zsw-0pCA8E8cob8k-EHyM-oKPsp-pe-PmSGr3Q
```

**IMPORTANT:** Make sure to set these for:
- ✅ Production
- ✅ Preview  
- ✅ Development

## After Deployment

1. Your site will be live at: `https://your-project-name.vercel.app`
2. Test all features:
   - Homepage
   - Collections page
   - Product pages
   - Member signup/login
   - Order flow
   - Custom hat creator

## Video Issue Note

The video proxy may still need work. If videos don't display:
1. Check that videos are set to "Public" in Wix CMS
2. Verify API key has Media permissions
3. Check server logs in Vercel Dashboard > Functions
