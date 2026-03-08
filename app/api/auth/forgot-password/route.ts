import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPasswordResetEmail } from '@/lib/email';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || body.memberEmail || '').toString().trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const redirectTo = `${baseUrl}/reset-password`;

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    if (error) {
      if (error.message?.toLowerCase().includes('user not found')) {
        return NextResponse.json({ success: true, message: 'If that email is registered, you will receive a reset link.' });
      }
      console.error('Supabase generateLink error:', error);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      console.error('No action_link in generateLink response');
      return NextResponse.json(
        { error: 'Could not generate reset link. Please try again.' },
        { status: 500 }
      );
    }

    const name = data.user?.user_metadata?.full_name || email.split('@')[0] || 'there';
    const sent = await sendPasswordResetEmail(email, name, actionLink, baseUrl);

    if (!sent.ok) {
      console.error('Resend forgot-password email failed:', sent.error);
      return NextResponse.json(
        { error: 'Could not send reset email. Please try again later or contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'If that email is registered, you will receive a reset link.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
