# Resend setup for welcome & password recovery emails

## What you need from your Resend developer account

### 1. **API Key**
- Go to [Resend Dashboard → API Keys](https://resend.com/api-keys)
- Click **Create API Key**, name it (e.g. "Coco Hawaii Dev")
- Copy the key (starts with `re_`) — you only see it once
- Add to your `.env.local` as:
  ```env
  RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
  ```

### 2. **From address (sender)**

**Option A – Testing (no domain verification)**  
- Use Resend’s test domain: `onboarding@resend.dev`  
- Add to `.env.local`:
  ```env
  RESEND_FROM_EMAIL=COCO HAWAII <onboarding@resend.dev>
  ```
- You can only send **to your own Resend account email** when using this.

**Option B – Production (your domain)**  
- In Resend: [Domains](https://resend.com/domains) → Add your domain (e.g. `cocohawaii.com`)
- Add the DNS records Resend shows (SPF, DKIM, etc.)
- After verification, use an address on that domain, e.g.:
  ```env
  RESEND_FROM_EMAIL=COCO HAWAII <noreply@cocohawaii.com>
  ```

### 3. **Summary: add to `.env.local`**

```env
# Resend (welcome + forgot password emails)
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=COCO HAWAII <onboarding@resend.dev>
```

Replace with your verified domain sender when you’re ready for production.

---

## Wix: fields needed for password reset

For “Forgot password” to work, the **members** collection in Wix needs three extra fields (add in Wix CMS):

| Field name             | Type   | Description                                                |
|------------------------|--------|------------------------------------------------------------|
| `resetToken`           | Text   | One-time token for the reset link (cleared after use)      |
| `resetTokenExpiresAt`  | Date   | When the token expires (1 hour from request)               |
| `memberPasswordHash`   | Text   | Hashed password (set on signup/reset; used for login)     |

Add these in your Wix collection schema so the API can read/write them.

---

## What’s implemented

- **Welcome email**: Sent automatically after signup (if `RESEND_API_KEY` is set).
- **Forgot password**: User enters email on `/forgot-password` → receives reset link → clicks link → `/reset-password?token=...` → sets new password. Login page has a “Forgot password?” link.
- **Reset password**: `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`; pages at `/forgot-password` and `/reset-password`.
