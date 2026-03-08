# 🚀 Quick Deploy to cocohawaii.world

## Fast Track (5 Steps)

### 1️⃣ Push to GitHub
```bash
git init
git add .
git commit -m "Deploy Coco Hawaii Website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cocohawaii-website.git
git push -u origin main
```

### 2️⃣ Deploy to Vercel
1. Go to **https://vercel.com**
2. Click **"Add New Project"**
3. Import your GitHub repo
4. Add these **Environment Variables**:
   - `NEXT_PUBLIC_WIX_CLIENT_ID` = `f70e4578-88dd-4e18-a162-f0b64f4dd734`
   - `NEXT_PUBLIC_WIX_ACCOUNT_ID` = `1510fbf9-5839-46ae-a724-04b3460c1057`
   - `NEXT_PUBLIC_WIX_SITE_ID` = `9aaa89a5-25af-48f6-9c3f-88d916792133`
   - `NEXT_PUBLIC_WIX_METASITE_ID` = `e2051e40-d8bd-4f0b-b7e4-f04012108b4e`
   - `NEXT_PUBLIC_WIX_API_KEY` = `IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjM3ZDhlYzFkLTJlODEtNGEyMC1hZTg1LTFmYTk4NTgxNzJkZlwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjQwMWI3ZmYzLTY1MDgtNGUxZS1hNzQ1LWM1MGYzNTNlOTRkMFwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxNTEwZmJmOS01ODM5LTQ2YWUtYTcyNC0wNGIzNDYwYzEwNTdcIn19IiwiaWF0IjoxNzY3ODk1OTc1fQ.L0vyqe7C5xjhufk9wnU5I4c6X3S8X41VAEfyU0uvXgl6k984rHZXhNVnLkZdSAUptVyZZ507reVFv3qFVd9R8PPlYTFJbM5thh0ztuNLoLNB23vPZDi-SVXI_8nhSUtMHja6fLTb1Vmcx2njXv_v76YegzQHz7xhTGxs7JY7n7ZNSndJR9SpIUK6JBeWYu3S7J7OJo7o9jcM9eCaw2mfsToafTH7SJ3JhUSVUeS9fG0syaWfUA5trdU5la3Jm2HLHv-t592G7HCwljAhFjpzfamULJP7g7QkgsuL7wbzqoUNks47Zsw-0pCA8E8cob8k-EHyM-oKPsp-pe-PmSGr3Q`
5. Click **"Deploy"**

### 3️⃣ Connect Domain
1. In Vercel → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `cocohawaii.world`
4. Follow DNS instructions (add A or CNAME record at your domain registrar)
5. Wait 15-30 minutes for DNS propagation

### 4️⃣ Done! 🎉
Your site will be live at: **https://cocohawaii.world**

---

## Need Help?

See full guide: `DEPLOY_TO_COCOHAWAII_WORLD.md`
