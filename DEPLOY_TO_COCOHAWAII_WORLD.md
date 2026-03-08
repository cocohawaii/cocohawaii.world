# 🚀 Deploy to cocohawaii.world

## Step-by-Step Deployment Guide

### Prerequisites
- ✅ GitHub account
- ✅ Vercel account (free)
- ✅ Domain: cocohawaii.world (you own this)

---

## Step 1: Push Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Coco Hawaii Website"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (e.g., `cocohawaii-website`)
   - **DO NOT** initialize with README (we already have files)

3. **Push to GitHub**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cocohawaii-website.git
   git push -u origin main
   ```

---

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in (use GitHub)

2. **Click "Add New..." → "Project"**

3. **Import your GitHub repository**:
   - Select `cocohawaii-website` (or your repo name)
   - Click "Import"

4. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

5. **Add Environment Variables**:
   Click "Environment Variables" and add:
   
   ```
   NEXT_PUBLIC_WIX_CLIENT_ID = f70e4578-88dd-4e18-a162-f0b64f4dd734
   NEXT_PUBLIC_WIX_ACCOUNT_ID = 1510fbf9-5839-46ae-a724-04b3460c1057
   NEXT_PUBLIC_WIX_SITE_ID = 9aaa89a5-25af-48f6-9c3f-88d916792133
   NEXT_PUBLIC_WIX_METASITE_ID = e2051e40-d8bd-4f0b-b7e4-f04012108b4e
   NEXT_PUBLIC_WIX_API_KEY = IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjM3ZDhlYzFkLTJlODEtNGEyMC1hZTg1LTFmYTk4NTgxNzJkZlwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjQwMWI3ZmYzLTY1MDgtNGUxZS1hNzQ1LWM1MGYzNTNlOTRkMFwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxNTEwZmJmOS01ODM5LTQ2YWUtYTcyNC0wNGIzNDYwYzEwNTdcIn19IiwiaWF0IjoxNzY3ODk1OTc1fQ.L0vyqe7C5xjhufk9wnU5I4c6X3S8X41VAEfyU0uvXgl6k984rHZXhNVnLkZdSAUptVyZZ507reVFv3qFVd9R8PPlYTFJbM5thh0ztuNLoLNB23vPZDi-SVXI_8nhSUtMHja6fLTb1Vmcx2njXv_v76YegzQHz7xhTGxs7JY7n7ZNSndJR9SpIUK6JBeWYu3S7J7OJo7o9jcM9eCaw2mfsToafTH7SJ3JhUSVUeS9fG0syaWfUA5trdU5la3Jm2HLHv-t592G7HCwljAhFjpzfamULJP7g7QkgsuL7wbzqoUNks47Zsw-0pCA8E8cob8k-EHyM-oKPsp-pe-PmSGr3Q
   ```
   
   **Important**: Make sure to select **"Production", "Preview", and "Development"** for each variable!

6. **Click "Deploy"**

7. **Wait 2-3 minutes** for deployment to complete

---

## Step 3: Connect Domain cocohawaii.world

1. **In Vercel Dashboard**, go to your project

2. **Click "Settings" → "Domains"**

3. **Click "Add Domain"**

4. **Enter**: `cocohawaii.world`

5. **Vercel will show DNS records** you need to add:
   - Usually an **A record** pointing to Vercel's IP
   - Or a **CNAME record** pointing to Vercel's domain

6. **Go to your domain registrar** (where you bought cocohawaii.world):
   - GoDaddy, Namecheap, Cloudflare, etc.

7. **Add DNS Records**:
   - **Type**: A or CNAME (as Vercel instructs)
   - **Name**: @ (or root domain)
   - **Value**: The value Vercel provides
   - **TTL**: 3600 (or default)

8. **Wait for DNS propagation** (5 minutes to 48 hours, usually 15-30 minutes)

9. **Vercel will automatically detect** when DNS is configured correctly

10. **SSL Certificate** will be automatically provisioned by Vercel (free!)

---

## Step 4: Verify Deployment

1. **Visit**: https://cocohawaii.world
2. **Check**: Website loads correctly
3. **Test**: All pages work
4. **Monitor**: Vercel dashboard for any errors

---

## Step 5: Optional - Add www Subdomain

If you want `www.cocohawaii.world` to work:

1. In Vercel → Settings → Domains
2. Add: `www.cocohawaii.world`
3. Vercel will auto-configure it
4. Add CNAME record at your registrar:
   - **Name**: www
   - **Value**: cname.vercel-dns.com (or what Vercel shows)

---

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all environment variables are set
- Verify `package.json` has correct scripts

### Domain Not Working
- Wait 24-48 hours for DNS propagation
- Check DNS records are correct
- Verify domain is pointing to Vercel

### Wix CMS Not Loading
- Verify environment variables in Vercel
- Check Wix API token is valid
- Test API connection in Vercel logs

### Need Help?
- Check Vercel documentation: https://vercel.com/docs
- Check Vercel status: https://vercel-status.com

---

## Quick Commands (Alternative: Vercel CLI)

If you prefer command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_WIX_CLIENT_ID production
vercel env add NEXT_PUBLIC_WIX_ACCOUNT_ID production
vercel env add NEXT_PUBLIC_WIX_SITE_ID production
vercel env add NEXT_PUBLIC_WIX_METASITE_ID production
vercel env add NEXT_PUBLIC_WIX_API_KEY production

# Deploy to production
vercel --prod

# Add domain
vercel domains add cocohawaii.world
```

---

## ✅ You're Done!

Once deployed, your website will be live at:
- **Production**: https://cocohawaii.world
- **Vercel URL**: https://your-project.vercel.app (also works)

🎉 **Congratulations! Your Coco Hawaii website is now online!**
