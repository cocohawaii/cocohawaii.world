import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeEmail } from '@/lib/email';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const memberName = body.memberName || body.name;
    const memberEmail = body.memberEmail || body.email;
    const memberPhone = body.memberPhone || body.memberMobile || body.mobile || '';
    const memberPhonecode = body.memberPhonecode || body.phoneCode || '+1';
    const password = body.password || body.memberPassword;

    if (!memberName || !memberEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const emailLower = memberEmail.toLowerCase().trim();
    const localPart = emailLower.split('@')[0] || '';
    if (localPart.split('.').length > 3) {
      return NextResponse.json(
        { error: 'Please use a valid email address.' },
        { status: 400 }
      );
    }
    if (/^[a-z0-9.]+\d+\.\d+\.\d+$/i.test(localPart)) {
      return NextResponse.json(
        { error: 'Please use a valid email address.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('members')
      .select('id')
      .eq('email', emailLower)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email is already registered. Please login.' },
        { status: 409 }
      );
    }

    const supabase = await createClient();
    const phoneFull = ((memberPhonecode || '').trim() || '+1') + (memberPhone || '').trim();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: emailLower,
      password,
      options: {
        data: {
          full_name: memberName.trim(),
          phone: phoneFull.trim() || undefined,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message?.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { error: 'Email is already registered. Please login.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: signUpError.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Trigger creates members row; update with phone
    const { data: memberRow } = await admin
      .from('members')
      .select('id')
      .eq('auth_id', authData.user.id)
      .single();

    if (memberRow && phoneFull.trim()) {
      await admin
        .from('members')
        .update({ phone: phoneFull.trim() })
        .eq('id', memberRow.id);
    }

    // Track signup in analytics (fire and forget)
    try {
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      fetch(`${baseUrl}/api/admin/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'signup' }),
      }).catch(() => {});
    } catch {
      // Ignore
    }

    sendWelcomeEmail(emailLower, memberName.trim()).catch((err) =>
      console.error('Welcome email failed:', err)
    );

    // Trigger creates members row; fetch it (may need brief wait)
    let memberId = memberRow?.id;
    if (!memberId) {
      const { data: m } = await admin.from('members').select('id').eq('auth_id', authData.user.id).single();
      memberId = m?.id;
    }

    return NextResponse.json({
      success: true,
      user: {
        name: memberName,
        email: emailLower,
        phone: memberPhone,
        phoneCode: memberPhonecode,
        memberId: memberId || authData.user.id,
      },
    });
  } catch (error: unknown) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create account' },
      { status: 500 }
    );
  }
}
