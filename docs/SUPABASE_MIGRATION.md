# Supabase Migration Guide

## Setup ✓

### Installed
- `@supabase/supabase-js`
- `@supabase/ssr`

### Created
- `lib/supabase/client.ts` – Browser client (Client Components)
- `lib/supabase/server.ts` – Server client (Server Components, Route Handlers)
- `lib/supabase/admin.ts` – Service role client (server-only, bypasses RLS)

### Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wcnalqnkvspthewjyhqt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Get keys from:** Supabase Dashboard → Project Settings → API → Project API keys

### Usage

```ts
// Client Component
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Server Component / Route Handler
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();

// Admin (bypasses RLS)
import { createAdminClient } from '@/lib/supabase/admin';
const admin = createAdminClient();
```

---

## Migrated to Supabase ✓

| Area | Tables | Notes |
|------|--------|-------|
| **Members** | `members` | Auth, profile, star_bids |
| **Raffles** | `raffles`, `raffle_entries`, `raffle_claimed_prizes` | UUID raffles only; Wix fallback for legacy IDs |
| **Star Bid Packs** | `star_bid_packs`, `star_bid_pack_purchases` | Full CRUD |
| **Auction Bids** | `auction_bids` | Bids from Supabase users; items stay in Wix |
| **Page Videos** | `page_videos` | Homepage hero + MakingOf; Wix fallback |
| **Page Analytics** | `page_analytics_visits`, `page_analytics_events` | Visits, signups, logins; was JSON file |

### API Routes Using Supabase First
- `GET /api/members/[id]` – Supabase members, Wix fallback
- `GET /api/members/[id]/purchases` – Supabase star_bid_pack_purchases
- `GET /api/members/[id]/bid-stats` – Supabase auction_bids for UUID members
- `GET /api/claimed-prizes` – Supabase only (auth required)
- `POST /api/auction-items/[id]/bid` – Supabase for authenticated users
- `GET /api/auction-items/[id]/bids` – Merges Supabase + Wix bids
- Raffle routes (winner, claim, enter, my-tickets, roulette, stats) – Supabase for UUID raffles

---

## Still on Wix

| Area | Reason |
|------|--------|
| **Hats** | CMS + Wix media (wix:image, wix:video), admin uploads |
| **Auction Items** | CMS content; bids migrated |
| **Home Decor** | Migrated to Supabase (home_decor table + Storage) |
| **Customizer** | fetchWixData for hat collections |
| **Wix Raffles** | Non-UUID raffle IDs use Wix |
| **Wix Members** | Fallback for auction/bids (memberId, byWallet) |

---

## SQL Migrations

Run `supabase/RUN_IN_SQL_EDITOR.sql` in Supabase Dashboard → SQL Editor (or run individual migration files).

**Migrations:**
- `20250301000000_initial_schema.sql` – members, raffles, entries, claimed_prizes
- `20250301000003_star_bids_and_enter_rpc.sql` – star_bids, enter_raffle_secure
- `20250301100000_star_bid_packs.sql` – star_bid_packs, star_bid_pack_purchases
- `20250301110000_auction_bids.sql` – auction_bids
- `20250301120000_page_videos.sql` – page_videos
