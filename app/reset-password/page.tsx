'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const checkSession = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setHasValidSession(!!session);
      });
    };
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setHasValidSession(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage({ type: 'error', text: error.message || 'Could not update password. The link may have expired.' });
        setIsSubmitting(false);
        return;
      }
      setMessage({ type: 'success', text: 'Password updated! Redirecting to login...' });
      await supabase.auth.signOut();
      setTimeout(() => router.push('/login'), 1500);
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20" style={{
        background: 'linear-gradient(to bottom, #ffffff 0%, #faf5ff 50%, #fdf2f8 100%)',
      }}>
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-purple-100 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20" style={{
        background: 'linear-gradient(to bottom, #ffffff 0%, #faf5ff 50%, #fdf2f8 100%)',
      }}>
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-purple-100">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-serif font-bold text-black tracking-wide mb-2">COCO HAWAII</h1>
              <h2 className="text-xl font-bold text-purple-600 uppercase tracking-wide">Reset password</h2>
            </div>
            <p className="text-gray-600 mb-4">Use the link from your password reset email to set a new password. Links expire after 1 hour.</p>
            <Link href="/forgot-password" className="block w-full py-3 text-center font-semibold text-purple-600 hover:text-purple-700 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
              Request a new link
            </Link>
            <div className="mt-6 text-center">
              <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Back to log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-20" style={{
      background: 'linear-gradient(to bottom, #ffffff 0%, #faf5ff 50%, #fdf2f8 100%)',
    }}>
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-purple-100">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-serif font-bold text-black tracking-wide mb-2">COCO HAWAII</h1>
            <h2 className="text-2xl font-bold text-purple-600 uppercase tracking-wide">Set new password</h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                placeholder="Confirm new password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-lg font-semibold text-white rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              Back to log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #faf5ff 50%, #fdf2f8 100%)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
