# Media Migration: Wix → Supabase Storage

This guide covers migrating all media (images, videos) from Wix to Supabase Storage.

## Step 1: Create Storage Buckets

Run **`supabase/PHASE9_STORAGE_MEDIA.sql`** in the Supabase SQL Editor. This creates:

- **`media`** bucket – for images (hats, raw_hats, auction_items, hat_accessories)
- **`videos`** bucket – for videos (hat videos, page videos)

If the SQL fails on bucket creation, create them manually in **Supabase Dashboard → Storage → New bucket**:
- `media` (public)
- `videos` (public)

Then run the policy section of the SQL (the `CREATE POLICY` statements).

## Step 2: Run the Migration

**Recommended:** Use the **Migrate Hat Images** button on the admin page (`/member/admin` → Finished Hats tab). This runs the migration in your browser, which often bypasses Wix's 403 blocking of server requests.

**Alternative (server-side):** If you prefer the API or the button uses server-side migration:

```bash
# Migrate hats only (dry run first)
curl -X POST https://www.cocohawaii.world/api/admin/migrate-media \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{"table":"hats","dryRun":true}'

# Migrate hats for real
curl -X POST https://www.cocohawaii.world/api/admin/migrate-media \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{"table":"hats"}'

# Migrate everything
curl -X POST https://www.cocohawaii.world/api/admin/migrate-media \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{"table":"all"}'
```

Or from the admin page, open Console and run:

```javascript
const res = await fetch('/api/admin/migrate-media', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ table: 'hats' }),
  credentials: 'include',
});
const data = await res.json();
console.log(data);
```

**Tables:**
- `hats` – main image, top video, making-of video, gallery
- `raw_hats` – product images
- `auction_items` – bid item images
- `page_videos` – homepage hero, MakingOf
- `hat_accessories` – accessory images
- `all` – migrate all tables

## Step 3: New Uploads

New uploads from the admin panel (hat images, videos, gallery) now go to **Supabase Storage** automatically. No Wix API keys needed for media.

## What Changed

| Before | After |
|--------|-------|
| `/api/upload/image` → Wix | `/api/upload/image` → Supabase `media` bucket |
| `/api/upload/video` → Wix | `/api/upload/video` → Supabase `videos` bucket |
| `WixImage` component | Handles both Wix and Supabase URLs |
| `convertWixImageUrl` / `convertWixVideoUrl` | Pass through Supabase URLs as-is |

Existing Wix URLs in the database continue to work until you run the migration. After migration, all media is served from Supabase.

## Troubleshooting: 403 Forbidden

Wix blocks direct downloads from their CDN. The migration now uses browser-like headers (User-Agent, Referer) to bypass this. If you still get 403 errors:

1. Add `WIX_REFERER_URL` to your `.env.local` with your **original Wix site URL** (e.g. `https://yoursite.wixsite.com/yoursite` or your custom domain).
2. Restart the dev server and run the migration again.

If 403 persists, Wix may have tightened restrictions. You can manually download images from your Wix Media Manager and upload them via the admin hat editor.

## Videos: Wix Blocks Direct Downloads

**Wix blocks direct downloads from `video.wixstatic.com`** – images work (proxy + referer), but videos return 403. This is a Wix platform restriction.

**Workaround for videos:**
1. Use **Migrate one hat (images only)** to migrate main image + gallery without videos.
2. For top video and making-of: download from **Wix Media Manager** (or use original files if you have them), then **upload via the hat editor** (edit hat → Top Eyes Video / Making Of → "Or upload video").
3. The upload goes to Supabase Storage; the hat will save the new URL.

**Where to see making-of:** The making-of video appears on the **hat product page** (`/hats/[hat-slug]`), not in the admin grid. If migration succeeded for making_of, open the hat's product page to verify.
