'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Use error.code for reliable detection (Supabase docs recommend this over message matching)
    const code = (error as { code?: string }).code || '';
    const msg = error.message?.toLowerCase() || '';
    const isEmailNotConfirmed =
      code === 'email_not_confirmed' ||
      msg.includes('email not confirmed') ||
      msg.includes('confirm your email');
    if (isEmailNotConfirmed) {
      return {
        error: 'Please confirm your email before logging in. Check your inbox for the confirmation link.',
        needsEmailConfirmation: true,
        email,
      };
    }
    if (code === 'invalid_credentials' || msg.includes('invalid login') || msg.includes('invalid credentials')) {
      return { error: 'Invalid email or password. If you just signed up, please confirm your email first.' };
    }
    return { error: error.message };
  }

  redirect('/member/dashboard');
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || email.split('@')[0] },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If session exists, user is logged in (email confirmation disabled).
  // Redirect immediately so cookies are in the same response.
  if (data.session) {
    redirect('/member/dashboard');
  }

  // No session = email confirmation required - user must check inbox.
  return {
    success: true,
    needsEmailConfirmation: true,
    email: data.user?.email,
  };
}

export async function resendConfirmationEmail(email: string) {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: {
      emailRedirectTo: `${baseUrl}/member/dashboard`,
    },
  });
  if (error) {
    return { error: error.message };
  }
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
