import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toMemberShape } from '@/lib/member-shape';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberEmail, password } = body;

    if (!memberEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password is required (minimum 6 characters)' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: memberEmail.toLowerCase().trim(),
      password,
    });

    if (authError || !authData.user) {
      const msg = authError?.message?.toLowerCase() || '';
      if (msg.includes('invalid') || msg.includes('credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: authError?.message || 'Login failed' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { data: row, error: memberError } = await admin
      .from('members')
      .select('id, email, full_name, role, star_bids, star_bids_consumed, phone, shipping_address, shipping_city, shipping_postal_code, shipping_country')
      .eq('auth_id', authData.user.id)
      .single();

    if (memberError || !row) {
      return NextResponse.json(
        { error: 'Member not found. Please sign up first.' },
        { status: 404 }
      );
    }

    // Track login in analytics (fire and forget)
    try {
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      fetch(`${baseUrl}/api/admin/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'login' }),
      }).catch(() => {});
    } catch {
      // Ignore analytics errors
    }

    return NextResponse.json({
      success: true,
      member: toMemberShape(row),
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
