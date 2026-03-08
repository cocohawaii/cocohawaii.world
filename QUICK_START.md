# Quick Start Guide - Deploy Your Coco Hawaii Website

## ✅ Your Website is Ready!

Your website has been built and is ready to deploy. Here's what you need to do:

## Step 1: Get Your Wix Credentials

You already have:
- ✅ **Client ID**: `f70e4578-88dd-4e18-a162-f0b64f4dd734`
- ✅ **Account ID**: `1510fbf9-5839-46ae-a724-04b3460c1057`

You still need:
- **Site ID**: Get this from your Wix dashboard (Settings > Advanced > Developer Tools)
- **API Key**: Your Wix API key (Settings > Advanced > API Keys)

## Step 2: Deploy to Vercel (Easiest Option)

### Option A: Deploy via Vercel Website (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign up/login with GitHub

2. **Click "New Project"**

3. **Import your repository:**
   - If you haven't pushed to GitHub yet:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
     git push -u origin main
     ```
   - Then import from GitHub in Vercel

4. **Add Environment Variables in Vercel:**
   - Go to Project Settings > Environment Variables
   - Add these variables:
     ```
     NEXT_PUBLIC_WIX_CLIENT_ID = f70e4578-88dd-4e18-a162-f0b64f4dd734
     NEXT_PUBLIC_WIX_ACCOUNT_ID = 1510fbf9-5839-46ae-a724-04b3460c1057
     NEXT_PUBLIC_WIX_SITE_ID = [YOUR_SITE_ID]
     NEXT_PUBLIC_WIX_API_KEY = [YOUR_API_KEY]
     NEXT_PUBLIC_PAYPAL_CLIENT_ID = [YOUR_PAYPAL_ID] (optional)
     ```

5. **Click "Deploy"**

6. **Your site will be live in 2-3 minutes!** 🎉

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_WIX_CLIENT_ID
# Enter: f70e4578-88dd-4e18-a162-f0b64f4dd734

vercel env add NEXT_PUBLIC_WIX_ACCOUNT_ID
# Enter: 1510fbf9-5839-46ae-a724-04b3460c1057

vercel env add NEXT_PUBLIC_WIX_SITE_ID
# Enter your Site ID

vercel env add NEXT_PUBLIC_WIX_API_KEY
# Enter your API Key

# Deploy to production
vercel --prod
```

## Step 3: Set Up Your Wix CMS

Before your site works fully, you need to create these collections in Wix:

### Collection 1: `hats`
Fields needed:
- `title` (Text)
- `hatSubtitle` (Text, optional)
- `hatDescription` (Text, optional)
- `price` (Number)
- `discountedPrice` (Number, optional)
- `mainHatImage` (Image)
- `topVideoEyes` (Video, optional)
- `makingOfProductPage` (Video, optional)
- `gallery` (Multi-image)
- `hatSize` (Text, optional)
- `collection` (Reference to collections)

### Collection 2: `collections`
Fields needed:
- `name` (Text)
- `description` (Text, optional)
- `image` (Image, optional)

### Collection 3: `hatOrders`
Fields needed:
- `hatorderName` (Text)
- `hatorderEmail` (Text)
- `hatorderMobile` (Text)
- `hatorderCustomAsk` (Text, optional)
- `hatOrderPrice` (Number)
- `hatOrderSubtitle` (Text, optional)
- `hatOrdertitle` (Text)
- `hatOrderCreatedOn` (Date)
- `hatOrderID` (Text)
- `shippingCost` (Number, optional)
- `totalFinalCost` (Number, optional)
- `orderAddress` (Text, optional)

## Step 4: Test Your Site

Once deployed:
1. Visit your Vercel URL (e.g., `your-site.vercel.app`)
2. Test the homepage
3. Test collections page
4. Test product pages
5. Test order flow

## Troubleshooting

### Site shows "No collections available"
- Make sure you've created the collections in Wix CMS
- Verify your API key has read permissions
- Check that Site ID is correct

### API Errors
- Verify your API key is correct
- Check API key permissions in Wix dashboard
- Ensure Site ID matches your Wix site

### Build Errors
- All environment variables must be set
- Check Vercel build logs for specific errors

## Need Help?

Check the full documentation in:
- `README.md` - Full setup guide
- `DEPLOY.md` - Detailed deployment instructions
- `WIX_API_SETUP.md` - Wix API configuration

## Your Site Structure

- `/` - Homepage
- `/collections` - All collections
- `/collections/[id]` - Collection items
- `/hats/[id]` - Product page with ordering
- `/create-your-hat` - Custom hat page
- `/thank-you` - Order confirmation

Enjoy your new website! 🎩✨
