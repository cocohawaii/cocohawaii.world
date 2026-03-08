# 🚀 Deploy to cocohawaii.world (Without Git)

## Option 1: Deploy via Vercel CLI (Easiest - No Git Needed!)

### Step 1: Install Vercel CLI
```powershell
npm install -g vercel
```

### Step 2: Login to Vercel
```powershell
vercel login
```
(This will open your browser to authenticate)

### Step 3: Deploy from Current Folder
```powershell
cd "C:\Users\Stan\Cursor Websites\CocoHawaii Website 2026"
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → `cocohawaii-website` (or any name)
- **Directory?** → `./` (current directory)
- **Override settings?** → No

### Step 4: Add Environment Variables
```powershell
vercel env add NEXT_PUBLIC_WIX_CLIENT_ID production
# Enter: f70e4578-88dd-4e18-a162-f0b64f4dd734

vercel env add NEXT_PUBLIC_WIX_ACCOUNT_ID production
# Enter: 1510fbf9-5839-46ae-a724-04b3460c1057

vercel env add NEXT_PUBLIC_WIX_SITE_ID production
# Enter: 9aaa89a5-25af-48f6-9c3f-88d916792133

vercel env add NEXT_PUBLIC_WIX_METASITE_ID production
# Enter: e2051e40-d8bd-4f0b-b7e4-f04012108b4e

vercel env add NEXT_PUBLIC_WIX_API_KEY production
# Enter: IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjM3ZDhlYzFkLTJlODEtNGEyMC1hZTg1LTFmYTk4NTgxNzJkZlwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjQwMWI3ZmYzLTY1MDgtNGUxZS1hNzQ1LWM1MGYzNTNlOTRkMFwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxNTEwZmJmOS01ODM5LTQ2YWUtYTcyNC0wNGIzNDYwYzEwNTdcIn19IiwiaWF0IjoxNzY3ODk1OTc1fQ.L0vyqe7C5xjhufk9wnU5I4c6X3S8X41VAEfyU0uvXgl6k984rHZXhNVnLkZdSAUptVyZZ507reVFv3qFVd9R8PPlYTFJbM5thh0ztuNLoLNB23vPZDi-SVXI_8nhSUtMHja6fLTb1Vmcx2njXv_v76YegzQHz7xhTGxs7JY7n7ZNSndJR9SpIUK6JBeWYu3S7J7OJo7o9jcM9eCaw2mfsToafTH7SJ3JhUSVUeS9fG0syaWfUA5trdU5la3Jm2HLHv-t592G7HCwljAhFjpzfamULJP7g7QkgsuL7wbzqoUNks47Zsw-0pCA8E8cob8k-EHyM-oKPsp-pe-PmSGr3Q
```

### Step 5: Deploy to Production
```powershell
vercel --prod
```

### Step 6: Add Domain
```powershell
vercel domains add cocohawaii.world
```

Then follow DNS instructions at your domain registrar.

---

## Option 2: Deploy via Vercel Dashboard (Upload Files)

### Step 1: Create a ZIP file
1. Select all files in your project folder
2. Right-click → "Send to" → "Compressed (zipped) folder"
3. Name it: `cocohawaii-website.zip`

### Step 2: Go to Vercel
1. Visit **https://vercel.com**
2. Sign in (create account if needed)
3. Click **"Add New..."** → **"Project"**

### Step 3: Upload Project
1. Click **"Browse"** or drag & drop your ZIP file
2. Vercel will extract and detect Next.js

### Step 4: Configure
- **Framework**: Next.js (auto-detected)
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Step 5: Add Environment Variables
Before deploying, click **"Environment Variables"** and add:
- `NEXT_PUBLIC_WIX_CLIENT_ID` = `f70e4578-88dd-4e18-a162-f0b64f4dd734`
- `NEXT_PUBLIC_WIX_ACCOUNT_ID` = `1510fbf9-5839-46ae-a724-04b3460c1057`
- `NEXT_PUBLIC_WIX_SITE_ID` = `9aaa89a5-25af-48f6-9c3f-88d916792133`
- `NEXT_PUBLIC_WIX_METASITE_ID` = `e2051e40-d8bd-4f0b-b7e4-f04012108b4e`
- `NEXT_PUBLIC_WIX_API_KEY` = `IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjM3ZDhlYzFkLTJlODEtNGEyMC1hZTg1LTFmYTk4NTgxNzJkZlwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjQwMWI3ZmYzLTY1MDgtNGUxZS1hNzQ1LWM1MGYzNTNlOTRkMFwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxNTEwZmJmOS01ODM5LTQ2YWUtYTcyNC0wNGIzNDYwYzEwNTdcIn19IiwiaWF0IjoxNzY3ODk1OTc1fQ.L0vyqe7C5xjhufk9wnU5I4c6X3S8X41VAEfyU0uvXgl6k984rHZXhNVnLkZdSAUptVyZZ507reVFv3qFVd9R8PPlYTFJbM5thh0ztuNLoLNB23vPZDi-SVXI_8nhSUtMHja6fLTb1Vmcx2njXv_v76YegzQHz7xhTGxs7JY7n7ZNSndJR9SpIUK6JBeWYu3S7J7OJo7o9jcM9eCaw2mfsToafTH7SJ3JhUSVUeS9fG0syaWfUA5trdU5la3Jm2HLHv-t592G7HCwljAhFjpzfamULJP7g7QkgsuL7wbzqoUNks47Zsw-0pCA8E8cob8k-EHyM-oKPsp-pe-PmSGr3Q`

**Important**: Select **"Production", "Preview", and "Development"** for each!

### Step 6: Deploy
Click **"Deploy"** and wait 2-3 minutes

### Step 7: Add Domain
1. Go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `cocohawaii.world`
4. Follow DNS instructions
5. Add DNS records at your domain registrar
6. Wait 15-30 minutes for propagation

---

## ✅ You're Done!

Your site will be live at:
- **https://cocohawaii.world** (once DNS propagates)
- **https://your-project.vercel.app** (immediately)

---

## Recommended: Option 1 (Vercel CLI)

It's faster and easier! Just run:
```powershell
npm install -g vercel
vercel login
vercel
```

Then add environment variables and deploy!
