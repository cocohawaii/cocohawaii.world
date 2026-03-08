import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseCookieOptions } from '@/lib/supabase/cookie-options';
import { sendWelcomeEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName } = body;
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const jsonResponse = NextResponse.json({ success: true });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: supabaseCookieOptions,
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              jsonResponse.cookies.set(name, value, { ...options, ...supabaseCookieOptions })
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || email.split('@')[0] },
        emailRedirectTo: `${req.nextUrl.origin}/member/dashboard`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const name = fullName || email.split('@')[0] || 'there';
    const siteUrl = req.nextUrl.origin;
    sendWelcomeEmail(email, name, siteUrl).catch((e) =>
      console.warn('Welcome email failed (non-blocking):', e)
    );

    // Track signup for analytics (non-blocking)
    try {
      const admin = createAdminClient();
      Promise.resolve(admin.from('page_analytics_events').insert({ event_type: 'signup' })).catch(() => {});
    } catch (_) { /* env vars missing, skip */ }

    if (data.session) {
      return jsonResponse;
    }

    return NextResponse.json({
      success: true,
      needsEmailConfirmation: true,
      email: data.user?.email,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
