i # Coco Hawaii – Vercel Deployment Guide

## Phase 1: Build verification ✅

The project builds successfully. All TypeScript errors have been fixed.

## Phase 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (recommended)

1. **Push your code to GitHub** (if not already)
   - Ensure your repo is on GitHub (e.g. `github.com/yourusername/coco-hawaii-website`)

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **Add New Project**
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure environment variables**
   Add these in Vercel → Project → Settings → Environment Variables:

   | Variable | Required | Notes |
   |----------|----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (secret) |
   | `RESEND_API_KEY` | Yes | For email (welcome, forgot-password) |
   | `RESEND_FROM_EMAIL` | Yes | e.g. `COCO HAWAII <onboarding@resend.dev>` |
   | `ADMIN_ONBOARDING_CODE` | Optional | 6-digit code for /admin-onboarding |
   | `NEXT_PUBLIC_SITE_URL` | Optional | e.g. `https://your-site.vercel.app` |

4. **Deploy**
   - Click **Deploy**
   - Vercel will build and deploy. Wait for the build to finish.

5. **Run Phase 8 migration (runway_orders)**
   - In Supabase SQL Editor, run the contents of `supabase/PHASE8_RUNWAY_ORDERS.sql`.

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy (from project root)
cd "c:\Users\Stan\Cursor Websites\CocoHawaii Website 2026"
vercel

# Follow prompts: link to existing project or create new one
# Add environment variables when prompted or in dashboard
```

## Post-deploy checklist

- [ ] Set `NEXT_PUBLIC_SITE_URL` to your live URL (e.g. `https://coco-hawaii.vercel.app`)
- [ ] Supabase: Add your Vercel domain to Auth → URL Configuration → Redirect URLs
- [ ] Resend: Use your verified domain for production emails (not onboarding@resend.dev)
- [ ] Test: Login, signup, raffles, customizer, runway guest list

## Notes

- The `vercel.json` is already configured for Next.js
- `.env` and `.env.local` are gitignored – never commit secrets
- Build command: `npm run build`
- Output directory: `.next` (Next.js default)
