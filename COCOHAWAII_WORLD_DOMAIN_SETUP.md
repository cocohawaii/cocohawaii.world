# Connect cocohawaii.world (GoDaddy) to Vercel

You own **cocohawaii.world** on GoDaddy with default GoDaddy nameservers. Follow **one** of the two options below.

---

## Option A: Use Vercel nameservers (recommended)

Vercel manages DNS. You only change nameservers at GoDaddy.

### 1. Add domain in Vercel

1. Go to **[vercel.com](https://vercel.com)** → sign in.
2. Open your project **cocohawaii-website** (or the one that uses `cocohawaii-website.vercel.app`).
3. **Settings** → **Domains**.
4. Click **Add** and enter: `cocohawaii.world`.
5. Vercel may suggest adding `www.cocohawaii.world` too — add both.
6. Vercel will show **“Configure nameservers”** and give you:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

### 2. Change nameservers at GoDaddy

1. Go to **[godaddy.com](https://godaddy.com)** → sign in.
2. **My Products** → find **cocohawaii.world** → **DNS** (or **Manage DNS**).
3. Scroll to **Nameservers** → **Change**.
4. Choose **“Enter my own nameservers (advanced)”**.
5. **Nameserver 1:** `ns1.vercel-dns.com`  
   **Nameserver 2:** `ns2.vercel-dns.com`  
   (Remove or overwrite any existing GoDaddy nameservers.)
6. **Save**.

### 3. Point domain to your project in Vercel (if needed)

- If you added the domain at **project** level (Settings → Domains of that project), it’s already assigned.
- If you added it at **account** level, assign **cocohawaii.world** (and **www**) to the **cocohawaii-website** project.

### 4. Wait for DNS

- Nameserver changes often take **15 minutes–48 hours** (usually under 1 hour).
- In Vercel → **Settings** → **Domains**, the domain will show as **Valid** once DNS has propagated.
- Vercel provisions **SSL (HTTPS)** automatically.

### 5. Optional: Use Vercel DNS for the domain

- In Vercel, open the **domain** → **Advanced** → **Use Vercel DNS**.
- Then you can add/edit DNS records (A, CNAME, MX, etc.) in Vercel if you need them.

---

## Option B: Keep GoDaddy DNS (default nameservers)

You keep GoDaddy nameservers and add **A** and **CNAME** records at GoDaddy.

### 1. Add domain in Vercel

1. **[vercel.com](https://vercel.com)** → your project **cocohawaii-website**.
2. **Settings** → **Domains** → **Add**.
3. Add:
   - `cocohawaii.world`
   - `www.cocohawaii.world`
4. Vercel will show instructions for **external DNS** (GoDaddy). Use the values below if they match.

### 2. Add DNS records at GoDaddy

1. **GoDaddy** → **My Products** → **cocohawaii.world** → **DNS** (or **Manage**).
2. Add these records (edit or remove conflicting ones):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `76.76.21.21` | 600 (or 1 hour) |
| **CNAME** | `www` | `cname.vercel-dns.com` | 600 (or 1 hour) |

- **@** = root domain (cocohawaii.world).
- **www** = www.cocohawaii.world.
- If GoDaddy uses “Host” instead of “Name”: use `@` for root, `www` for www.

3. **Save** all changes.

### 3. Remove conflicting records

- Delete any other **A** records for `@` (root).
- Delete any **CNAME** for `www` that points somewhere else (e.g. GoDaddy parking).
- **A** and **CNAME** must not both exist for the same name.

### 4. Wait and verify

- DNS can take **5 minutes–48 hours** (often 15–30 minutes).
- In Vercel → **Domains**, status should turn **Valid**.
- Visit **https://cocohawaii.world** and **https://www.cocohawaii.world**. Vercel provides HTTPS automatically.

---

## Quick reference

| Goal | Option A (Vercel NS) | Option B (GoDaddy DNS) |
|------|----------------------|-------------------------|
| **Where you change things** | GoDaddy: nameservers only | GoDaddy: A + CNAME records |
| **Root (cocohawaii.world)** | Handled by Vercel DNS | A record `@` → `76.76.21.21` |
| **www (www.cocohawaii.world)** | Handled by Vercel DNS | CNAME `www` → `cname.vercel-dns.com` |
| **SSL** | Automatic (Vercel) | Automatic (Vercel) |

---

## Troubleshooting

- **“Invalid configuration” or domain not resolving**  
  - Option A: Confirm nameservers are exactly `ns1.vercel-dns.com` and `ns2.vercel-dns.com`.  
  - Option B: Confirm A and CNAME match the table above; no duplicate A/CNAME for same name.

- **www works but root doesn’t (or vice versa)**  
  - Option B: Check both A (`@`) and CNAME (`www`) exist and have no typos.

- **SSL certificate pending**  
  - Wait for DNS to propagate. Vercel retries automatically; can take up to 24 hours.

- **Check DNS propagation**  
  - [dnschecker.org](https://dnschecker.org) → query **A** for `cocohawaii.world` and **CNAME** for `www.cocohawaii.world`.

---

## After the domain works

1. **Optional**: In your app, switch canonical URLs, sitemap, and metadata from `cocohawaii-website.vercel.app` to `https://cocohawaii.world` (e.g. in `app/layout.tsx`, `app/sitemap.ts`, `public/robots.txt`).
2. **Optional**: In **Vercel** → **Domains**, set **cocohawaii.world** as primary so redirects (e.g. www → non‑www) use it.

Once DNS is correct, **https://cocohawaii.world** will serve your COCO HAWAII site.
