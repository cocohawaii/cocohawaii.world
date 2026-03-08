import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL || 'COCO HAWAII <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'cocohawaii.world@gmail.com';

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** Paint splash / art color accents for email headers - matches PaintDrips style */
const PAINT_SPLASH_ROW = `
  <div style="display: flex; justify-content: center; gap: 8px; margin: 16px 0 0; flex-wrap: wrap;">
    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #8b5cf6; opacity: 0.9;"></span>
    <span style="display: inline-block; width: 16px; height: 16px; border-radius: 40% 60% 50% 50%; background: #db2777; opacity: 0.85;"></span>
    <span style="display: inline-block; width: 14px; height: 14px; border-radius: 60% 40% 50% 50%; background: #ea580c; opacity: 0.9;"></span>
    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #0d9488; opacity: 0.8;"></span>
    <span style="display: inline-block; width: 18px; height: 18px; border-radius: 45% 55% 60% 40%; background: #f472b6; opacity: 0.75;"></span>
    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #a78bfa; opacity: 0.85;"></span>
    <span style="display: inline-block; width: 14px; height: 14px; border-radius: 55% 45% 50% 50%; background: #fb923c; opacity: 0.8;"></span>
  </div>
`;

/**
 * Build the welcome email HTML with art colors and paint splashes.
 */
function buildWelcomeEmailHtml(name: string, siteUrl: string): string {
  const safeName = (name || 'there').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to COCO HAWAII</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 30%, #fff7ed 60%, #f0fdfa 100%); font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Paint splash accent bar -->
        <div style="height: 8px; background: linear-gradient(90deg, #8b5cf6 0%, #db2777 25%, #ea580c 50%, #0d9488 75%, #a78bfa 100%); border-radius: 8px 8px 0 0;"></div>

        <!-- Header with gradient + paint splashes -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%); border-radius: 0 0 20px 20px; padding: 32px 24px 28px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 10px; left: 15%; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.3);"></div>
          <div style="position: absolute; top: 20px; right: 20%; width: 18px; height: 18px; border-radius: 45% 55%; background: rgba(255,255,255,0.25);"></div>
          <div style="position: absolute; bottom: 15px; left: 25%; width: 16px; height: 16px; border-radius: 55% 45%; background: rgba(255,255,255,0.2);"></div>
          <div style="position: absolute; bottom: 10px; right: 15%; width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.2);"></div>
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">
            COCO HAWAII
          </h1>
          <p style="margin: 8px 0 0; font-family: 'Dancing Script', cursive; font-size: 20px; color: rgba(255,255,255,0.95);">
            Art · Style · High-End Fashion
          </p>
          ${PAINT_SPLASH_ROW}
        </div>

        <!-- Main content card -->
        <div style="background: #ffffff; border: 2px solid #e9d5ff; border-top: none; border-radius: 0 0 16px 16px; padding: 40px 32px; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);">
          <h2 style="margin: 0 0 24px; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #6d28d9;">
            Welcome, ${safeName}! ✨
          </h2>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
            Thanks for joining our community of art and fashion enthusiasts. You're now part of a world where hand-designed hats meet wild art, jewelry & exotic accessories.
          </p>

          <!-- Perks with paint accent -->
          <div style="margin: 28px 0; padding: 24px; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #fff7ed 100%); border-radius: 12px; border-left: 4px solid #7c3aed; position: relative;">
            <div style="position: absolute; top: 8px; right: 12px; width: 8px; height: 8px; border-radius: 50%; background: #db2777; opacity: 0.6;"></div>
            <div style="position: absolute; bottom: 12px; right: 24px; width: 6px; height: 6px; border-radius: 50%; background: #ea580c; opacity: 0.5;"></div>
            <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #6d28d9; text-transform: uppercase; letter-spacing: 1px;">What's waiting for you</p>
            <p style="margin: 0 0 8px; font-size: 15px; color: #4b5563;">🎨 <strong>Exclusive Collections</strong> — Curated pieces for the bold</p>
            <p style="margin: 0 0 8px; font-size: 15px; color: #4b5563;">🎩 <strong>Custom Hat Builder</strong> — Create your one-of-a-kind masterpiece</p>
            <p style="margin: 0 0 8px; font-size: 15px; color: #4b5563;">⭐ <strong>Art Auctions & Raffles</strong> — Bid on unique creations</p>
            <p style="margin: 0; font-size: 15px; color: #4b5563;">💎 <strong>Member Perks</strong> — Access to events & special offers</p>
          </div>

          <p style="margin: 0 0 28px; font-size: 16px; line-height: 1.6; color: #374151;">
            We're glad to have you. Free your spirit and glow anywhere you go.
          </p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <a href="${siteUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; font-family: 'Playfair Display', Georgia, serif;">
                  Explore COCO HAWAII →
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; padding: 32px 0 0;">
          <p style="margin: 0; font-size: 14px; color: #9ca3af; font-style: italic;">Hand-Designed Hats · Valeria Velasquez</p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #9ca3af;">— The COCO HAWAII team</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Build the password reset email HTML with art colors and paint splashes.
 */
function buildPasswordResetEmailHtml(name: string, resetLink: string, siteUrl: string): string {
  const safeName = (name || 'there').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your COCO HAWAII password</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 30%, #fff7ed 60%, #f0fdfa 100%); font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Paint splash accent bar -->
        <div style="height: 8px; background: linear-gradient(90deg, #8b5cf6 0%, #db2777 25%, #ea580c 50%, #0d9488 75%, #a78bfa 100%); border-radius: 8px 8px 0 0;"></div>

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%); border-radius: 0 0 20px 20px; padding: 32px 24px 28px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 12px; right: 18%; width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.3);"></div>
          <div style="position: absolute; bottom: 18px; left: 20%; width: 14px; height: 14px; border-radius: 45% 55%; background: rgba(255,255,255,0.25);"></div>
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">
            COCO HAWAII
          </h1>
          <p style="margin: 8px 0 0; font-family: 'Dancing Script', cursive; font-size: 20px; color: rgba(255,255,255,0.95);">
            Art · Style · High-End Fashion
          </p>
          ${PAINT_SPLASH_ROW}
        </div>

        <!-- Main content -->
        <div style="background: #ffffff; border: 2px solid #e9d5ff; border-top: none; border-radius: 0 0 16px 16px; padding: 40px 32px; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);">
          <h2 style="margin: 0 0 24px; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 600; color: #6d28d9;">
            Reset your password 🔐
          </h2>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
            Hi ${safeName},
          </p>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
            We received a request to reset your password. Click the button below to choose a new password. This link expires in 1 hour.
          </p>

          <div style="margin: 28px 0; padding: 20px; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%); border-radius: 12px; border-left: 4px solid #7c3aed;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">If you didn't request this, you can safely ignore this email. Your password will stay the same.</p>
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
            <tr>
              <td align="center">
                <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; font-family: 'Playfair Display', Georgia, serif;">
                  Reset password →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin: 0; font-size: 13px; color: #9ca3af;">Or copy and paste this link into your browser:</p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #7c3aed; word-break: break-all;">${resetLink}</p>
        </div>

        <div style="text-align: center; padding: 32px 0 0;">
          <p style="margin: 0; font-size: 14px; color: #9ca3af; font-style: italic;">Hand-Designed Hats · Valeria Velasquez</p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #9ca3af;">— The COCO HAWAII team</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  siteUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend: RESEND_API_KEY not set, skipping welcome email');
    return { ok: false, error: 'Email not configured' };
  }
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii-website.vercel.app';
  const html = buildWelcomeEmailHtml(name, baseUrl);
  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: 'Welcome to COCO HAWAII ✨',
    html,
  });
  if (error) {
    console.error('Resend welcome email error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Build the raffle winner email HTML - minimal, powerful, motivating.
 */
function buildRaffleWinnerEmailHtml(name: string, raffleTitle: string, claimUrl: string): string {
  const safeName = (name || 'Winner').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeTitle = (raffleTitle || 'Raffle').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You won! — COCO HAWAII</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #fff7ed 100%); font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="height: 8px; background: linear-gradient(90deg, #8b5cf6 0%, #db2777 25%, #ea580c 50%, #0d9488 100%); border-radius: 8px 8px 0 0;"></div>
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%); border-radius: 0 0 20px 20px; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">COCO HAWAII</h1>
          <p style="margin: 6px 0 0; font-family: 'Dancing Script', cursive; font-size: 18px; color: rgba(255,255,255,0.95);">Art · Style · High-End Fashion</p>
        </div>
        <div style="background: #ffffff; border: 2px solid #e9d5ff; border-top: none; border-radius: 0 0 16px 16px; padding: 36px 28px; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 2px;">Congratulations</p>
          <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #1f2937;">
            ${safeName}, you won! 🏆
          </h2>
          <p style="margin: 0 0 24px; font-size: 17px; line-height: 1.6; color: #374151;">
            You're the winner of <strong>${safeTitle}</strong>. Your prize is waiting.
          </p>
          <p style="margin: 0 0 28px; font-size: 16px; line-height: 1.5; color: #6b7280;">
            Claim it now — you've earned this.
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <a href="${claimUrl}" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; font-family: 'Playfair Display', Georgia, serif;">
                  Claim your prize →
                </a>
              </td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; padding: 24px 0 0;">
          <p style="margin: 0; font-size: 13px; color: #9ca3af;">— The COCO HAWAII team</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendRaffleWinnerEmail(
  to: string,
  name: string,
  raffleTitle: string,
  siteUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend: RESEND_API_KEY not set, skipping raffle winner email');
    return { ok: false, error: 'Email not configured' };
  }
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii.world';
  const claimUrl = `${baseUrl}/member/claimed-prizes`;
  const html = buildRaffleWinnerEmailHtml(name, raffleTitle, claimUrl);
  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: 'You won! 🏆 Claim your COCO HAWAII prize',
    html,
  });
  if (error) {
    console.error('Resend raffle winner email error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Build the help ticket reply email (admin reply to anonymous user).
 */
function buildHelpTicketReplyEmailHtml(params: {
  name: string;
  subject: string;
  replyBody: string;
  siteUrl: string;
}): string {
  const safe = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const n = safe(params.name || 'there');
  const subj = safe(params.subject || 'Your inquiry');
  const body = safe(params.replyBody || '').replace(/\n/g, '<br>');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Re: ${subj} — COCO HAWAII</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 30%, #fff7ed 60%, #f0fdfa 100%); font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="height: 8px; background: linear-gradient(90deg, #8b5cf6 0%, #db2777 25%, #ea580c 50%, #0d9488 75%, #a78bfa 100%); border-radius: 8px 8px 0 0;"></div>
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%); border-radius: 0 0 20px 20px; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">COCO HAWAII</h1>
          <p style="margin: 6px 0 0; font-family: 'Dancing Script', cursive; font-size: 18px; color: rgba(255,255,255,0.95);">Art · Style · High-End Fashion</p>
        </div>
        <div style="background: #ffffff; border: 2px solid #e9d5ff; border-top: none; border-radius: 0 0 16px 16px; padding: 36px 28px; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 2px;">Reply to your inquiry</p>
          <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #1f2937;">
            Hi ${n},
          </h2>
          <p style="margin: 0 0 16px; font-size: 15px; color: #4b5563;">Re: <strong>${subj}</strong></p>
          <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%); border-radius: 12px; border-left: 4px solid #7c3aed;">
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">${body}</p>
          </div>
          <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280;">— The COCO HAWAII team</p>
        </div>
        <div style="text-align: center; padding: 24px 0 0;">
          <p style="margin: 0; font-size: 13px; color: #9ca3af;">Made With Passion, Art & Love. 🌺</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendHelpTicketReplyEmail(params: {
  to: string;
  name: string;
  subject: string;
  replyBody: string;
  ticketId?: string;
  siteUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend: RESEND_API_KEY not set, skipping help ticket reply email');
    return { ok: false, error: 'Email not configured' };
  }
  const baseUrl = params.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii-website.vercel.app';
  const html = buildHelpTicketReplyEmailHtml({
    name: params.name,
    subject: params.subject,
    replyBody: params.replyBody,
    siteUrl: baseUrl,
  });
  const { error } = await resend.emails.send({
    from: FROM,
    to: [params.to],
    subject: `Re: ${params.subject} — COCO HAWAII`,
    html,
  });
  if (error) {
    console.error('Resend help ticket reply email error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Build the star bid pack purchase confirmation email.
 */
function buildStarBidPackPurchaseEmailHtml(params: {
  name: string;
  packName: string;
  quantity: number;
  totalStars: number;
  totalPrice: number;
  newBalance: number;
  siteUrl: string;
}): string {
  const safe = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const n = safe(params.name || 'there');
  const pack = safe(params.packName || 'Star Bid Pack');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Star Bids Purchased — COCO HAWAII</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 30%, #fff7ed 60%, #f0fdfa 100%); font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="height: 8px; background: linear-gradient(90deg, #8b5cf6 0%, #db2777 25%, #ea580c 50%, #0d9488 75%, #a78bfa 100%); border-radius: 8px 8px 0 0;"></div>
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%); border-radius: 0 0 20px 20px; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">COCO HAWAII</h1>
          <p style="margin: 6px 0 0; font-family: 'Dancing Script', cursive; font-size: 18px; color: rgba(255,255,255,0.95);">Art · Style · High-End Fashion</p>
        </div>
        <div style="background: #ffffff; border: 2px solid #e9d5ff; border-top: none; border-radius: 0 0 16px 16px; padding: 36px 28px; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 2px;">Purchase Confirmed</p>
          <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #1f2937;">
            ${n}, your star bids are ready! ⭐
          </h2>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
            You purchased <strong>${pack}</strong> × ${params.quantity}.
          </p>
          <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%); border-radius: 12px; border-left: 4px solid #7c3aed;">
            <p style="margin: 0 0 8px; font-size: 15px; color: #4b5563;"><strong>+${params.totalStars} star bids</strong> added to your wallet</p>
            <p style="margin: 0 0 8px; font-size: 15px; color: #4b5563;">Total paid: <strong>€${params.totalPrice.toFixed(2)}</strong></p>
            <p style="margin: 0; font-size: 15px; color: #6d28d9; font-weight: 600;">New balance: ${params.newBalance} stars</p>
          </div>
          <p style="margin: 24px 0 0; font-size: 15px; color: #6b7280;">Use your stars to bid on exclusive art creations or enter raffles.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 0;">
            <tr>
              <td align="center">
                <a href="${params.siteUrl}/art-auction" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; font-family: 'Playfair Display', Georgia, serif;">
                  Start Bidding →
                </a>
              </td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; padding: 24px 0 0;">
          <p style="margin: 0; font-size: 13px; color: #9ca3af;">— The COCO HAWAII team</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendStarBidPackPurchaseEmail(params: {
  to: string;
  name: string;
  packName: string;
  quantity: number;
  totalStars: number;
  totalPrice: number;
  newBalance: number;
  siteUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend: RESEND_API_KEY not set, skipping star bid pack email');
    return { ok: false, error: 'Email not configured' };
  }
  const baseUrl = params.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii-website.vercel.app';
  const html = buildStarBidPackPurchaseEmailHtml({ ...params, siteUrl: baseUrl });
  const { error } = await resend.emails.send({
    from: FROM,
    to: [params.to],
    subject: `Star Bids Purchased — +${params.totalStars} stars added`,
    html,
  });
  if (error) {
    console.error('Resend star bid pack email error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Build the raffle ticket purchase confirmation email.
 */
function buildRaffleTicketPurchaseEmailHtml(params: {
  name: string;
  raffleTitle: string;
  ticketCount: number;
  ticketNumbers: number[];
  totalCost: number;
  siteUrl: string;
}): string {
  const safe = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const n = safe(params.name || 'there');
  const title = safe(params.raffleTitle || 'Raffle');
  const numbersStr = params.ticketNumbers.length > 0
    ? params.ticketNumbers.sort((a, b) => a - b).join(', ')
    : `Your ${params.ticketCount} ticket(s)`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Raffle Entry Confirmed — COCO HAWAII</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 30%, #fff7ed 60%, #f0fdfa 100%); font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="height: 8px; background: linear-gradient(90deg, #8b5cf6 0%, #db2777 25%, #ea580c 50%, #0d9488 75%, #a78bfa 100%); border-radius: 8px 8px 0 0;"></div>
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%); border-radius: 0 0 20px 20px; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">COCO HAWAII</h1>
          <p style="margin: 6px 0 0; font-family: 'Dancing Script', cursive; font-size: 18px; color: rgba(255,255,255,0.95);">Art · Style · High-End Fashion</p>
        </div>
        <div style="background: #ffffff; border: 2px solid #e9d5ff; border-top: none; border-radius: 0 0 16px 16px; padding: 36px 28px; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 2px;">You're In!</p>
          <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #1f2937;">
            ${n}, good luck! 🍀
          </h2>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
            You've entered <strong>${title}</strong> with ${params.ticketCount} ticket${params.ticketCount > 1 ? 's' : ''}.
          </p>
          <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%); border-radius: 12px; border-left: 4px solid #7c3aed;">
            <p style="margin: 0 0 8px; font-size: 15px; color: #4b5563;">Ticket number${params.ticketCount > 1 ? 's' : ''}: <strong>${numbersStr}</strong></p>
            <p style="margin: 0; font-size: 15px; color: #4b5563;">Cost: ${params.totalCost} star bid${params.totalCost !== 1 ? 's' : ''}</p>
          </div>
          <p style="margin: 24px 0 0; font-size: 15px; color: #6b7280;">We'll notify you if you win. Fingers crossed!</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 0;">
            <tr>
              <td align="center">
                <a href="${params.siteUrl}/raffles" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; font-family: 'Playfair Display', Georgia, serif;">
                  View Raffles →
                </a>
              </td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; padding: 24px 0 0;">
          <p style="margin: 0; font-size: 13px; color: #9ca3af;">— The COCO HAWAII team</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendRaffleTicketPurchaseEmail(params: {
  to: string;
  name: string;
  raffleTitle: string;
  ticketCount: number;
  ticketNumbers?: number[];
  totalCost: number;
  siteUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend: RESEND_API_KEY not set, skipping raffle ticket email');
    return { ok: false, error: 'Email not configured' };
  }
  const baseUrl = params.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii-website.vercel.app';
  const html = buildRaffleTicketPurchaseEmailHtml({
    ...params,
    ticketNumbers: params.ticketNumbers || [],
    siteUrl: baseUrl,
  });
  const { error } = await resend.emails.send({
    from: FROM,
    to: [params.to],
    subject: `You're in! — ${params.raffleTitle}`,
    html,
  });
  if (error) {
    console.error('Resend raffle ticket email error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Build the pre-made hat order confirmation email — elegant, powerful, clean.
 */
function buildOrderConfirmationEmailHtml(params: {
  name: string;
  hatTitle: string;
  hatSubtitle?: string;
  hatPrice: number;
  shippingCost: number;
  totalPrice: number;
  orderId: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingOption?: string;
  ordersUrl: string;
}): string {
  const safe = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const n = safe(params.name || 'there');
  const title = safe(params.hatTitle || 'Your Hat');
  const subtitle = params.hatSubtitle ? safe(params.hatSubtitle) : '';
  const addr = safe(params.shippingAddress || '');
  const city = safe(params.shippingCity || '');
  const postal = safe(params.shippingPostalCode || '');
  const country = safe(params.shippingCountry || '');
  const orderId = safe(params.orderId || '');
  const hatPrice = params.hatPrice ?? 0;
  const shipCost = params.shippingCost ?? 0;
  const total = params.totalPrice ?? hatPrice + shipCost;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed — COCO HAWAII</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 30%, #fff7ed 60%, #f0fdfa 100%); font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="height: 8px; background: linear-gradient(90deg, #8b5cf6 0%, #db2777 25%, #ea580c 50%, #0d9488 75%, #a78bfa 100%); border-radius: 8px 8px 0 0;"></div>
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%); border-radius: 0 0 20px 20px; padding: 32px 24px 28px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 10px; left: 15%; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.3);"></div>
          <div style="position: absolute; bottom: 10px; right: 15%; width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.2);"></div>
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">COCO HAWAII</h1>
          <p style="margin: 8px 0 0; font-family: 'Dancing Script', cursive; font-size: 20px; color: rgba(255,255,255,0.95);">Art · Style · High-End Fashion</p>
          ${PAINT_SPLASH_ROW}
        </div>

        <div style="background: #ffffff; border: 2px solid #e9d5ff; border-top: none; border-radius: 0 0 16px 16px; padding: 40px 32px; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 2px;">Order Confirmed</p>
          <h2 style="margin: 0 0 24px; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #1f2937;">
            Thank you, ${n}! 🎩
          </h2>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
            Your order has been confirmed. We're preparing your hand-designed masterpiece.
          </p>

          <div style="margin: 28px 0; padding: 24px; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #fff7ed 100%); border-radius: 12px; border-left: 4px solid #7c3aed;">
            <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #6d28d9; text-transform: uppercase; letter-spacing: 1px;">Order Details</p>
            <p style="margin: 0 0 8px; font-size: 16px; color: #1f2937;"><strong>${title}</strong>${subtitle ? ` <span style="color:#6b7280;">— ${subtitle}</span>` : ''}</p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Order ID: ${orderId}</p>
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px;">
            <tr><td style="padding: 4px 0; font-size: 15px; color: #4b5563;">Hat</td><td align="right" style="padding: 4px 0; font-size: 15px; font-weight: 600; color: #1f2937;">€${hatPrice.toFixed(2)}</td></tr>
            <tr><td style="padding: 4px 0; font-size: 15px; color: #4b5563;">Shipping</td><td align="right" style="padding: 4px 0; font-size: 15px; font-weight: 600; color: #1f2937;">€${shipCost.toFixed(2)}</td></tr>
            <tr><td colspan="2" style="padding: 12px 0 4px; border-top: 1px solid #e5e7eb;"></td></tr>
            <tr><td style="padding: 4px 0; font-size: 17px; font-weight: 700; color: #1f2937;">Total</td><td align="right" style="padding: 4px 0; font-size: 15px; font-weight: 700; color: #7c3aed;">€${total.toFixed(2)}</td></tr>
          </table>

          <div style="margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px;">
            <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #374151;">Shipping to</p>
            <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.5;">${addr}<br>${city} ${postal}<br>${country}</p>
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 0;">
            <tr>
              <td align="center">
                <a href="${params.ordersUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; font-family: 'Playfair Display', Georgia, serif;">
                  View Your Orders →
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; padding: 32px 0 0;">
          <p style="margin: 0; font-size: 14px; color: #9ca3af; font-style: italic;">Hand-Designed Hats · Valeria Velasquez</p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #9ca3af;">— The COCO HAWAII team</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  name: string;
  hatTitle: string;
  hatSubtitle?: string;
  hatPrice: number;
  shippingCost: number;
  totalPrice: number;
  orderId: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingOption?: string;
  siteUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend: RESEND_API_KEY not set, skipping order confirmation email');
    return { ok: false, error: 'Email not configured' };
  }
  const baseUrl = params.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii-website.vercel.app';
  const ordersUrl = `${baseUrl}/member/collection-orders`;
  const html = buildOrderConfirmationEmailHtml({
    ...params,
    ordersUrl,
  });
  const { error } = await resend.emails.send({
    from: FROM,
    to: [params.to],
    subject: `Order Confirmed — ${params.hatTitle}`,
    html,
  });
  if (error) {
    console.error('Resend order confirmation email error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Build the custom hat order confirmation email — elegant, powerful, clean.
 */
function buildCustomOrderConfirmationEmailHtml(params: {
  name: string;
  groupOrderId: string;
  hatCount: number;
  hatsSummary: string;
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
  shippingAddress: string;
  shippingType?: string;
  ordersUrl: string;
}): string {
  const safe = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const n = safe(params.name || 'there');
  const orderId = safe(params.groupOrderId || '');
  const addr = safe(params.shippingAddress || '');
  const subtotal = params.subtotal ?? 0;
  const shipCost = params.shippingCost ?? 0;
  const total = params.totalPrice ?? subtotal + shipCost;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Custom Order Confirmed — COCO HAWAII</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 30%, #fff7ed 60%, #f0fdfa 100%); font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="height: 8px; background: linear-gradient(90deg, #8b5cf6 0%, #db2777 25%, #ea580c 50%, #0d9488 75%, #a78bfa 100%); border-radius: 8px 8px 0 0;"></div>
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%); border-radius: 0 0 20px 20px; padding: 32px 24px 28px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 10px; left: 15%; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.3);"></div>
          <div style="position: absolute; bottom: 10px; right: 15%; width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.2);"></div>
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">COCO HAWAII</h1>
          <p style="margin: 8px 0 0; font-family: 'Dancing Script', cursive; font-size: 20px; color: rgba(255,255,255,0.95);">Art · Style · High-End Fashion</p>
          ${PAINT_SPLASH_ROW}
        </div>

        <div style="background: #ffffff; border: 2px solid #e9d5ff; border-top: none; border-radius: 0 0 16px 16px; padding: 40px 32px; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 2px;">Custom Order Confirmed</p>
          <h2 style="margin: 0 0 24px; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #1f2937;">
            Thank you, ${n}! ✨
          </h2>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
            Your personalized hat order has been confirmed. Our artists are ready to bring your vision to life.
          </p>

          <div style="margin: 28px 0; padding: 24px; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #fff7ed 100%); border-radius: 12px; border-left: 4px solid #7c3aed;">
            <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #6d28d9; text-transform: uppercase; letter-spacing: 1px;">Order Details</p>
            <p style="margin: 0 0 8px; font-size: 16px; color: #1f2937;"><strong>${params.hatCount} custom hat${params.hatCount > 1 ? 's' : ''}</strong></p>
            ${params.hatsSummary ? `<p style="margin: 8px 0 0; font-size: 14px; color: #6b7280; line-height: 1.5;">${params.hatsSummary}</p>` : ''}
            <p style="margin: 12px 0 0; font-size: 13px; color: #6b7280;">Order ID: ${orderId}</p>
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px;">
            <tr><td style="padding: 4px 0; font-size: 15px; color: #4b5563;">Hats & customization</td><td align="right" style="padding: 4px 0; font-size: 15px; font-weight: 600; color: #1f2937;">€${subtotal.toFixed(2)}</td></tr>
            <tr><td style="padding: 4px 0; font-size: 15px; color: #4b5563;">Shipping</td><td align="right" style="padding: 4px 0; font-size: 15px; font-weight: 600; color: #1f2937;">€${shipCost.toFixed(2)}</td></tr>
            <tr><td colspan="2" style="padding: 12px 0 4px; border-top: 1px solid #e5e7eb;"></td></tr>
            <tr><td style="padding: 4px 0; font-size: 17px; font-weight: 700; color: #1f2937;">Total</td><td align="right" style="padding: 4px 0; font-size: 15px; font-weight: 700; color: #7c3aed;">€${total.toFixed(2)}</td></tr>
          </table>

          <div style="margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px;">
            <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #374151;">Shipping to</p>
            <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.5;">${addr}</p>
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 0;">
            <tr>
              <td align="center">
                <a href="${params.ordersUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; font-family: 'Playfair Display', Georgia, serif;">
                  View Your Orders →
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; padding: 32px 0 0;">
          <p style="margin: 0; font-size: 14px; color: #9ca3af; font-style: italic;">Hand-Designed Hats · Valeria Velasquez</p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #9ca3af;">— The COCO HAWAII team</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendCustomOrderConfirmationEmail(params: {
  to: string;
  name: string;
  groupOrderId: string;
  hatCount: number;
  hatsSummary?: string;
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
  shippingAddress: string;
  shippingType?: string;
  siteUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend: RESEND_API_KEY not set, skipping custom order confirmation email');
    return { ok: false, error: 'Email not configured' };
  }
  const baseUrl = params.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii-website.vercel.app';
  const ordersUrl = `${baseUrl}/member/custom-orders`;
  const html = buildCustomOrderConfirmationEmailHtml({
    ...params,
    hatsSummary: params.hatsSummary ?? '',
    ordersUrl,
  });
  const { error } = await resend.emails.send({
    from: FROM,
    to: [params.to],
    subject: `Custom Order Confirmed — ${params.hatCount} hat${params.hatCount > 1 ? 's' : ''}`,
    html,
  });
  if (error) {
    console.error('Resend custom order confirmation email error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Send admin notification when an order is paid (premade or custom).
 */
function buildAdminOrderNotificationHtml(params: {
  orderType: 'premade' | 'custom';
  customerName: string;
  customerEmail: string;
  orderId: string;
  itemSummary: string;
  totalPrice: number;
  shippingAddress: string;
  adminUrl: string;
}): string {
  const safe = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const typeLabel = params.orderType === 'premade' ? 'Pre-made Hat' : 'Custom Hat';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order — COCO HAWAII</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">
    <tr>
      <td>
        <div style="height: 6px; background: linear-gradient(90deg, #8b5cf6 0%, #db2777 50%, #ea580c 100%); border-radius: 6px 6px 0 0;"></div>
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); border-radius: 0 0 16px 16px; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">COCO HAWAII</h1>
          <p style="margin: 6px 0 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 600;">New ${typeLabel} Order</p>
        </div>
        <div style="background: #ffffff; border: 2px solid #e9d5ff; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);">
          <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.5;">
            <strong>${safe(params.customerName)}</strong> (${safe(params.customerEmail)})<br>
            Order ID: <strong>${safe(params.orderId)}</strong>
          </p>
          <div style="margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #7c3aed;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #6d28d9;">Items</p>
            <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">${safe(params.itemSummary)}</p>
          </div>
          <p style="margin: 16px 0 8px; font-size: 16px; font-weight: 700; color: #1f2937;">Total: €${params.totalPrice.toFixed(2)}</p>
          <p style="margin: 0 0 20px; font-size: 13px; color: #6b7280;">Shipping: ${safe(params.shippingAddress)}</p>
          <a href="${params.adminUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
            View in Admin →
          </a>
        </div>
        <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">— COCO HAWAII Admin</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendAdminOrderNotification(params: {
  orderType: 'premade' | 'custom';
  customerName: string;
  customerEmail: string;
  orderId: string;
  itemSummary: string;
  totalPrice: number;
  shippingAddress: string;
  siteUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend: RESEND_API_KEY not set, skipping admin notification');
    return { ok: false, error: 'Email not configured' };
  }
  const baseUrl = params.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii-website.vercel.app';
  const adminUrl = params.orderType === 'premade'
    ? `${baseUrl}/member/admin`
    : `${baseUrl}/member/admin`;
  const html = buildAdminOrderNotificationHtml({ ...params, adminUrl });
  const typeLabel = params.orderType === 'premade' ? 'Pre-made' : 'Custom';
  const { error } = await resend.emails.send({
    from: FROM,
    to: [ADMIN_EMAIL],
    subject: `[COCO HAWAII] New ${typeLabel} Order — ${params.orderId}`,
    html,
  });
  if (error) {
    console.error('Resend admin notification error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Build the runway confirmation email (guest list or ticket purchase).
 */
function buildRunwayConfirmationEmailHtml(params: {
  name: string;
  type: 'guest' | 'ticket';
  eventTitle: string;
  eventSubtitle?: string;
  eventDate: string;
  eventTime?: string;
  quantity?: number;
  totalPaid?: number;
  siteUrl: string;
}): string {
  const safe = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const n = safe(params.name || 'there');
  const title = safe(params.eventTitle || 'Runway Event');
  const subtitle = params.eventSubtitle ? safe(params.eventSubtitle) : '';
  const dateStr = params.eventDate ? new Date(params.eventDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';
  let timeStr = params.eventTime || '';
  if (timeStr && /^\d{1,2}:\d{2}/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map(Number);
    const hour = h ?? 0;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    timeStr = `${h12}:${String(m || 0).padStart(2, '0')} ${ampm}`;
  }

  const isGuest = params.type === 'guest';
  const headline = isGuest ? "You're on the list! ✨" : "You're in! 🎟️";
  const subhead = isGuest
    ? "We've reserved your spot at the runway show."
    : `Your ${params.quantity || 1} ticket(s) are confirmed.`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Runway Confirmation — COCO HAWAII</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 30%, #fff7ed 60%, #fef3c7 100%); font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Gradient bar -->
        <div style="height: 10px; background: linear-gradient(90deg, #8b5cf6 0%, #db2777 25%, #ea580c 50%, #0d9488 75%, #a78bfa 100%); border-radius: 10px 10px 0 0;"></div>

        <!-- Header with floating orbs -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%); border-radius: 0 0 24px 24px; padding: 36px 28px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 15px; left: 20%; width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.25);"></div>
          <div style="position: absolute; top: 25px; right: 25%; width: 20px; height: 20px; border-radius: 45% 55%; background: rgba(255,255,255,0.2);"></div>
          <div style="position: absolute; bottom: 20px; left: 30%; width: 18px; height: 18px; border-radius: 55% 45%; background: rgba(255,255,255,0.2);"></div>
          <div style="position: absolute; bottom: 15px; right: 20%; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.2);"></div>
          <div style="font-size: 56px; margin-bottom: 8px;">${isGuest ? '✨' : '🎟️'}</div>
          <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 34px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">COCO HAWAII</h1>
          <p style="margin: 8px 0 0; font-family: 'Dancing Script', cursive; font-size: 20px; color: rgba(255,255,255,0.95);">Runway & Art Experience</p>
        </div>

        <!-- Main card -->
        <div style="background: #ffffff; border: 2px solid #e9d5ff; border-top: none; border-radius: 0 0 20px 20px; padding: 40px 32px; box-shadow: 0 12px 32px rgba(124, 58, 237, 0.15);">
          <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 3px;">Confirmation</p>
          <h2 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 30px; font-weight: 700; color: #1f2937;">
            ${n}, ${headline}
          </h2>
          <p style="margin: 0 0 28px; font-size: 17px; line-height: 1.6; color: #374151;">
            ${subhead}
          </p>

          <!-- Event details box -->
          <div style="margin: 0 0 28px; padding: 24px; background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #fff7ed 100%); border-radius: 16px; border-left: 5px solid #7c3aed; position: relative;">
            <div style="position: absolute; top: 12px; right: 16px; width: 10px; height: 10px; border-radius: 50%; background: #db2777; opacity: 0.6;"></div>
            <div style="position: absolute; bottom: 16px; right: 24px; width: 8px; height: 8px; border-radius: 50%; background: #ea580c; opacity: 0.5;"></div>
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #6d28d9; text-transform: uppercase; letter-spacing: 1.5px;">Your Event</p>
            <p style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #1f2937;">${title}</p>
            ${subtitle ? `<p style="margin: 0 0 12px; font-size: 15px; color: #6b7280;">${subtitle}</p>` : ''}
            <p style="margin: 0 0 4px; font-size: 16px; color: #4b5563;">📅 ${dateStr}</p>
            ${timeStr ? `<p style="margin: 0; font-size: 16px; color: #4b5563;">🕐 ${timeStr}</p>` : ''}
            ${!isGuest && params.totalPaid != null && params.totalPaid > 0 ? `
            <p style="margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #e9d5ff; font-size: 15px; color: #6d28d9; font-weight: 600;">
              ${params.quantity || 1} ticket(s) · €${params.totalPaid.toFixed(2)} paid
            </p>
            ` : ''}
          </div>

          <p style="margin: 0 0 28px; font-size: 16px; line-height: 1.6; color: #374151;">
            We can&apos;t wait to see you. Get ready for an unforgettable fusion of fashion and art.
          </p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <a href="${params.siteUrl}/the-runway" style="display: inline-block; padding: 18px 44px; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; font-size: 17px; font-weight: 600; text-decoration: none; border-radius: 14px; font-family: 'Playfair Display', Georgia, serif; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                  View The Runway →
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; padding: 32px 0 0;">
          <p style="margin: 0; font-size: 14px; color: #9ca3af; font-style: italic;">Hand-Designed Hats · Valeria Velasquez</p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #9ca3af;">— The COCO HAWAII team</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendRunwayConfirmationEmail(params: {
  to: string;
  name: string;
  type: 'guest' | 'ticket';
  eventTitle: string;
  eventSubtitle?: string;
  eventDate: string;
  eventTime?: string;
  quantity?: number;
  totalPaid?: number;
  siteUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend: RESEND_API_KEY not set, skipping runway confirmation email');
    return { ok: false, error: 'Email not configured' };
  }
  const baseUrl = params.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii-website.vercel.app';
  const html = buildRunwayConfirmationEmailHtml({ ...params, siteUrl: baseUrl });
  const subject = params.type === 'guest'
    ? `You're on the list! — ${params.eventTitle}`
    : `Your tickets are confirmed! — ${params.eventTitle}`;
  const { error } = await resend.emails.send({
    from: FROM,
    to: [params.to],
    subject,
    html,
  });
  if (error) {
    console.error('Resend runway confirmation email error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetLink: string,
  siteUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend: RESEND_API_KEY not set, skipping password reset email');
    return { ok: false, error: 'Email not configured' };
  }
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii-website.vercel.app';
  const html = buildPasswordResetEmailHtml(name, resetLink, baseUrl);
  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: 'Reset your COCO HAWAII password 🔐',
    html,
  });
  if (error) {
    console.error('Resend password reset email error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
