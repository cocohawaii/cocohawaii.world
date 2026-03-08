import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseCookieOptions } from '@/lib/supabase/cookie-options';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const code = error.code || '';
      const msg = error.message?.toLowerCase() || '';
      const isEmailNotConfirmed =
        code === 'email_not_confirmed' ||
        msg.includes('email not confirmed') ||
        msg.includes('confirm your email');
      if (isEmailNotConfirmed) {
        return NextResponse.json(
          {
            error: 'Please confirm your email before logging in. Check your inbox for the confirmation link.',
            needsEmailConfirmation: true,
            email,
          },
          { status: 400 }
        );
      }
      if (code === 'invalid_credentials' || msg.includes('invalid login') || msg.includes('invalid credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password. Please check your details and try again.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.session) {
      return NextResponse.json({ error: 'Login failed' }, { status: 400 });
    }

    // Track login for analytics (non-blocking)
    try {
      const admin = createAdminClient();
      Promise.resolve(admin.from('page_analytics_events').insert({ event_type: 'login' })).catch(() => {});
    } catch (_) { /* env vars missing, skip */ }

    return jsonResponse;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
