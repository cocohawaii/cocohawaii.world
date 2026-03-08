# Coco Hawaii – Supabase vs Wix Summary

## ✅ On Supabase (fully migrated)

| Data / Feature | Supabase Table(s) | Notes |
|----------------|-------------------|-------|
| **Auth & members** | `auth.users`, `members` | Login, signup, roles (user/admin/pr), profile, shipping |
| **Hats (finished products)** | `hats` | Replaces Wix CocoHawaiiExoticHats |
| **Hat orders (pre-made)** | `hat_orders` | Replaces Wix hatOrders |
| **Custom hat orders** | `customized_hat_orders` | Replaces Wix CustomizedHatOrders |
| **Raw hats (customizer shapes)** | `raw_hats` | Replaces Wix rawHatCollection |
| **Hat accessories** | `hat_accessories` | Replaces Wix HatAccessories |
| **Raffles** | `raffles`, `raffle_entries`, `raffle_claimed_prizes` | Raffle management, tickets, winners |
| **Star bid packs** | `star_bid_packs`, `star_bid_pack_purchases` | Packs and purchases |
| **Auction items** | `auction_items` | Replaces Wix ArtCreationBidding |
| **Auction bids** | `auction_bids`, `legacy_auction_bids` | New bids + migrated legacy bids |
| **Art pricing (customizer)** | `auction_config` | Replaces Wix ArtCreation |
| **Page videos** | `page_videos` | Hero, MakingOf |
| **Home decor** | `home_decor` | Images in Supabase Storage `home-decor` bucket |
| **Page analytics** | `page_analytics_visits`, `page_analytics_events` | Visits, signups, logins |
| **Runway guest list** | `runway_orders` | Replaces Wix RunwayOrders |
| **Media storage** | Supabase Storage `media`, `videos` buckets | Hat images, gallery, videos; auction items; page videos |

---

## ⚠️ Still on Wix

_None – all user-facing features use Supabase. Media migrated to Supabase Storage. Wix only used by admin migration tools (one-time data import)._

---

## Migration phases (SQL files)

- **PHASE1** – `hats` (CocoHawaiiExoticHats)
- **PHASE2** – `hat_orders` (hatOrders)
- **PHASE3** – `raw_hats`, `hat_accessories`
- **PHASE4** – `customized_hat_orders`
- **PHASE5** – `auction_items` (ArtCreationBidding)
- **PHASE6** – `auction_config` (ArtCreation)
- **PHASE7** – `legacy_auction_bids` (ArtAllBids)
- **PHASE8** – `runway_orders` (RunwayOrders)
- **PHASE9** – Storage buckets `media`, `videos` for media migration
- **RUN_IN_SQL_EDITOR.sql** – Core schema

---

## Migration API endpoints (admin only)

- `POST /api/admin/migrate-hats` – Phase 1
- `POST /api/admin/migrate-auction-items` – Phase 5
- `POST /api/admin/migrate-art-config` – Phase 6
- `POST /api/admin/migrate-legacy-bids` – Phase 7
- `POST /api/admin/migrate-media` – Migrate Wix media to Supabase Storage
