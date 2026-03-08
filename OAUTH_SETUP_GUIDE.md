# 🔐 Wix OAuth Setup Guide

## The Problem
IST tokens from Wix Dashboard are **NOT** for REST API calls. They're for internal Wix flows only.

## The Solution: OAuth

You need to use OAuth to access Wix Headless CMS from external apps.

## Step 1: Create a Wix App

1. Go to [Wix Developers Center](https://dev.wix.com/)
2. Click "Create App"
3. Choose "Headless" or "Custom App"
4. Fill in app details
5. **Important:** Enable these OAuth scopes:
   - `wix-data.read` - To read data collections
   - `wix-sites.read` - To read site information

## Step 2: Get Your App Credentials

After creating the app, you'll get:
- **App ID** (Client ID) - You already have this: `f70e4578-88dd-4e18-a162-f0b64f4dd734`
- **App Secret** (Client Secret) - You need to get this from the app settings

## Step 3: Install App on Your Site

1. In Wix Developers Center, go to your app
2. Click "Install App"
3. Select your site: `e2051e40-d8bd-4f0b-b7e4-f04012108b4e`
4. Grant permissions

## Step 4: Get OAuth Access Token

There are two ways:

### Option A: Authorization Code Flow (User-based)
- Requires user to authorize your app
- Good for user-specific data
- More complex to implement

### Option B: Client Credentials Flow (Server-to-server)
- No user interaction needed
- Good for server-side access
- Simpler for headless CMS

## Step 5: Use Access Token

Once you have an access token, use it with the Wix SDK:

```typescript
import { createClient, OAuthStrategy } from '@wix/sdk';
import { data } from '@wix/data';

const client = createClient({
  modules: { data },
  auth: OAuthStrategy({
    clientId: 'your-client-id',
    tokens: {
      accessToken: {
        value: 'your-access-token',
        expiresAt: 'expiration-time',
      },
    },
  }),
});

const collection = client.data.getCollection('CocoHawaiiExoticHats');
const result = await collection.find();
```

## Quick Start

1. **Get your App Secret** from Wix Developers Center
2. **Add it to `.env.local`**:
   ```
   NEXT_PUBLIC_WIX_CLIENT_SECRET=your-secret-here
   ```
3. **I'll implement the OAuth flow** to get access tokens
4. **Test the connection**

## Alternative: Check if REST API Tokens Exist

Some Wix account types might have REST API tokens available:
- Go to Wix Dashboard → Settings → Advanced → API Keys
- Look for "REST API Token" or "External API Token"
- If you see one, that's what we need (not IST tokens)

## Need Help?

Once you:
1. Create the Wix App
2. Get the App Secret
3. Install it on your site

I can implement the OAuth flow and get your hats displaying!

