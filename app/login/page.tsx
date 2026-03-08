'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/translations';
import { resendConfirmationEmail } from '@/app/actions/auth';

export default function LoginPage() {
  const { t } = useTranslations();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setResendMessage('');
    setPendingEmail(null);
    setIsSubmitting(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
    if (!email || !password) {
      setError('Email and password are required');
      setIsSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        redirect: 'follow',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        window.location.href = '/member/dashboard';
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Login failed');
        if (data.needsEmailConfirmation && data.email) setPendingEmail(data.email);
      } else if (data.error) {
        setError(data.error);
        if (data.needsEmailConfirmation && data.email) setPendingEmail(data.email);
      }
      setIsSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const handleResend = async (email?: string | null) => {
    const emailToUse = email ?? pendingEmail ?? emailInputRef.current?.value?.trim();
    if (!emailToUse) {
      setResendMessage('Please enter your email above first.');
      return;
    }
    setResendMessage('');
    setIsResending(true);
    const result = await resendConfirmationEmail(emailToUse);
    setIsResending(false);
    if (result?.error) {
      setResendMessage(result.error);
    } else {
      setResendMessage('Confirmation email sent! Check your inbox.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20" style={{
      background: 'linear-gradient(to bottom, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)'
    }}>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Login Container */}
          <div 
            className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-100"
            style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 3px rgba(59, 130, 246, 0.3), 0 0 0 4px rgba(59, 130, 246, 0.1)'
            }}
          >
            {/* Brand Header */}
            <div className="text-center mb-6">
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-black tracking-wide mb-3">COCO HAWAII</h1>
              <p className="text-lg md:text-xl text-gray-600">
                {t('login.worldOf')} <span className="text-black font-semibold">{t('login.art')}</span>, <span className="text-black font-semibold">{t('login.style')}</span> & <span className="text-purple-600 font-bold">{t('login.highEndFashion')}</span>
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 mb-4"></div>

            {/* Title - Pushed Higher */}
            <div className="text-center mb-5">
              <h2 className="text-4xl md:text-5xl font-bold text-purple-600 uppercase tracking-wide mb-3">{t('login.loginTitle')}</h2>
              <div className="border-t border-gray-300 mb-4"></div>
              <p className="text-base md:text-lg text-gray-600">{t('login.exploreBlend')}</p>
            </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">{t('login.emailLabel')}</label>
              <input
                ref={emailInputRef}
                type="email"
                name="email"
                autoComplete="email"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder={t('login.emailPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">{t('login.passwordLabel')}</label>
              <input
                type="password"
                name="password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder={t('login.passwordPlaceholder')}
                required
                autoComplete="current-password"
              />
              <div className="mt-2 text-right">
                <Link href="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="space-y-2">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
                {pendingEmail && (
                  <button
                    type="button"
                    onClick={() => handleResend(pendingEmail)}
                    disabled={isResending}
                    className="w-full py-2 text-sm font-medium text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                  >
                    {isResending ? 'Sending...' : 'Resend confirmation email'}
                  </button>
                )}
                {resendMessage && (
                  <p className={`text-sm ${resendMessage.includes('sent') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            )}

            {!error && resendMessage && (
              <div className={`rounded-lg p-3 text-sm ${resendMessage.includes('sent') ? 'bg-emerald-50 border-2 border-emerald-200 text-emerald-700' : 'bg-red-50 border-2 border-red-200 text-red-600'}`}>
                {resendMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 text-lg font-semibold text-white rounded-lg relative overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-fluid-gradient disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #3b82f6 25%, #ec4899 50%, #a855f7 75%, #ffffff 100%)',
                backgroundSize: '300% 300%',
                animation: 'fluid-gradient 4s ease infinite',
              }}
            >
              <span className="relative z-10">{isSubmitting ? t('login.loggingIn') : t('login.loginButton')}</span>
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-base md:text-lg text-gray-600 mb-4">{t('login.noAccount')}</p>
            <Link 
              href="/signup" 
              className="text-lg md:text-xl text-purple-600 hover:text-purple-700 font-bold transition-colors"
            >
              {t('login.signUp')}
            </Link>
          </div>
          </div>

          {/* The Possibilities Section - Right Side */}
          <div className="hidden md:block">
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200 shadow-xl">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">{t('login.thePossibilities')}</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                    ✨
                  </div>
                  <div>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mb-2">{t('login.exclusiveCollections')}</p>
                    <p className="text-base md:text-lg text-gray-600">{t('login.exclusiveCollectionsText')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    🎨
                  </div>
                  <div>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mb-2">{t('login.customHatBuilder')}</p>
                    <p className="text-base md:text-lg text-gray-600">{t('login.customHatBuilderText')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                    🎭
                  </div>
                  <div>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mb-2">{t('login.fashionEvents')}</p>
                    <p className="text-base md:text-lg text-gray-600">{t('login.fashionEventsText')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    💎
                  </div>
                  <div>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mb-2">{t('login.memberPerks')}</p>
                    <p className="text-base md:text-lg text-gray-600">{t('login.memberPerksText')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
