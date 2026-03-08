# Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Option 1: Deploy via Vercel Dashboard

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Go to [Vercel](https://vercel.com) and sign in**

3. **Click "New Project" and import your GitHub repository**

4. **Configure Environment Variables:**
   - `NEXT_PUBLIC_WIX_CLIENT_ID`: `f70e4578-88dd-4e18-a162-f0b64f4dd734`
   - `NEXT_PUBLIC_WIX_ACCOUNT_ID`: `1510fbf9-5839-46ae-a724-04b3460c1057`
   - `NEXT_PUBLIC_WIX_SITE_ID`: Your Wix Site ID
   - `NEXT_PUBLIC_WIX_API_KEY`: Your Wix API Key
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: Your PayPal Client ID (optional)

5. **Click "Deploy"**

6. **Your site will be live in minutes!**

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_WIX_CLIENT_ID
   vercel env add NEXT_PUBLIC_WIX_ACCOUNT_ID
   vercel env add NEXT_PUBLIC_WIX_SITE_ID
   vercel env add NEXT_PUBLIC_WIX_API_KEY
   vercel env add NEXT_PUBLIC_PAYPAL_CLIENT_ID
   ```

5. **Redeploy with environment variables:**
   ```bash
   vercel --prod
   ```

## Deploy to Netlify

1. **Build command:** `npm run build`
2. **Publish directory:** `.next`
3. **Add environment variables in Netlify dashboard**

## Deploy to Other Platforms

### Railway
1. Connect your GitHub repo
2. Add environment variables
3. Deploy automatically

### Render
1. Create a new Web Service
2. Connect your GitHub repo
3. Build command: `npm run build`
4. Start command: `npm start`
5. Add environment variables

## Getting Your Wix Site ID

1. Go to your Wix dashboard
2. Navigate to Settings > Advanced > Developer Tools
3. Your Site ID is displayed there

## Getting Your Wix API Key

1. Go to your Wix dashboard
2. Navigate to Settings > Advanced > API Keys
3. Create a new API key or use an existing one
4. Make sure it has permissions for:
   - Read/Write access to your CMS collections
   - Access to Wix Data API

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test homepage loads correctly
- [ ] Test collections page
- [ ] Test individual product pages
- [ ] Test order submission flow
- [ ] Verify PayPal integration (if enabled)
- [ ] Check mobile responsiveness
- [ ] Test all navigation links

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify Node.js version (should be 18+)
- Check build logs for specific errors

### API Errors
- Verify Wix API key has correct permissions
- Check that Site ID is correct
- Ensure collections exist in Wix CMS

### Images Not Loading
- Verify image URLs are accessible
- Check Next.js image configuration
- Ensure Wix image domains are whitelisted in `next.config.js`
