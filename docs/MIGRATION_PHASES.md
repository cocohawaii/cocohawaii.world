# Wix → Supabase Migration Phases

Run each phase in order. **Run the SQL in Supabase SQL Editor first**, then click the button in Admin.

---

## All migration buttons

**Admin → My World → Hats Manager** – migration panel at top with Phase 1–4 buttons.

---

## Phase 1: CocoHawaiiExoticHats (hats catalog)

**SQL:** `supabase/PHASE1_HATS_SQL_EDITOR.sql` → paste in Supabase SQL Editor → Run

**Export:** Click "Phase 1: Hats" in migration panel

---

## Phase 2: hatOrders (pre-made hat orders)

**SQL:** `supabase/PHASE2_HAT_ORDERS_SQL_EDITOR.sql` → paste in Supabase SQL Editor → Run

**Export:** Click "Phase 2: Hat Orders" in migration panel (or in Pre-Made Hat Orders tab)

---

## Phase 3: rawHatCollection + HatAccessories (customizer data)

**SQL:** `supabase/PHASE3_RAW_HATS_ACCESSORIES_SQL_EDITOR.sql` → paste in Supabase SQL Editor → Run

**Export:** Click "Phase 3a: Raw Hats" and "Phase 3b: Accessories" in migration panel

---

## Phase 4: CustomizedHatOrders (custom hat orders)

**SQL:** `supabase/PHASE4_CUSTOMIZED_HAT_ORDERS_SQL_EDITOR.sql` → paste in Supabase SQL Editor → Run

**Export:** Click "Phase 4: Customized Orders" in migration panel

---

## Phase 5: Switch APIs to Supabase ✅ DONE

- `/api/hats` → read from `hats`
- `/api/hats/create`, `/api/hats/update`, `/api/hats/update-active` → write to `hats`
- `lib/wix.ts` `getHats`, `getHat`, `getHatsByCollection` → use Supabase
- `/api/admin/premade-orders` → read from `hat_orders`
- `/api/admin/custom-orders` → read from `customized_hat_orders`
- `/api/admin/hat-analytics` → read from `hats` + `hat_orders`
- `/api/admin/stats` → read from `hat_orders` + `members`
- `/api/orders` (create, update, getNextId) → write/read `hat_orders`
- `/api/orders/get` → read from `hat_orders`
- `/api/members/pr-sales` → read from `hat_orders` + `members`
- Customizer `getRawHats`, `getUniqueHatForms`, `getAccessories` → read from `raw_hats`, `hat_accessories`
- Customizer `saveCustomizedOrder` → write to `customized_hat_orders`
