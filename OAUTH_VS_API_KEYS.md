# OAuth vs API Keys for Wix Headless CMS

## 🎯 **Do You Actually Need OAuth?**

For **server-to-server CMS access** (fetching hats from your collection), you **DO NOT need OAuth**. You just need **API Keys**.

### ✅ **Use API Keys When:**
- Fetching data from CMS collections (like your hats)
- Server-side data access (Next.js API routes)
- No user login required
- Simple, direct access

### 🔐 **Use OAuth When:**
- Users need to log in to Wix
- You need user-specific data
- Building a multi-tenant app
- User authentication flows

## 🚨 **Your Current Problem**

You're getting 404 errors because:
1. ❌ You're using an **IST token** instead of an **API Key**
2. ❌ IST tokens are for Wix Apps, not Headless projects
3. ✅ You need to use **API Keys** from your Wix Headless project

## ✅ **The Fix (Simple)**

1. **Go to Wix Dashboard** → Your Headless Project → **API Keys**
2. **Copy one of your API Key tokens** (not IST token)
3. **Replace in Vercel**: `NEXT_PUBLIC_WIX_API_KEY` = your API Key token
4. **Redeploy**

That's it! No OAuth needed for CMS access.

## 🔧 **If You Still Want OAuth**

If you want to create an OAuth app anyway (for future user login features), I've created these endpoints:

### **Query Existing OAuth Apps**
```
POST /api/query-oauth-apps
```

### **Create New OAuth App**
```
POST /api/create-oauth-app
```

### **Get OAuth App by ID**
```
GET /api/get-oauth-app?id=YOUR_OAUTH_APP_ID
```

**But remember:** You still need an API Key (not IST token) to call these endpoints!

## 📋 **Quick Checklist**

- [ ] Replace IST token with API Key in Vercel
- [ ] Verify API Key has "Data Collections" → "Read" permission
- [ ] Test: Visit `/api/test-api-keys` after redeploy
- [ ] OAuth is optional - only needed for user login features

## 🎯 **Bottom Line**

**For your use case (fetching hats from CMS):**
- ✅ **API Keys** = What you need
- ❌ **OAuth** = Not needed (unless you add user login later)
- ❌ **IST Tokens** = Wrong type, won't work

Fix the API Key first, then everything will work!
