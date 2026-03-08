'use client';

import { useState } from 'react';
import Link from 'next/link';
import Fireworks from '@/components/Fireworks';
import SignupWelcomePopup from '@/components/SignupWelcomePopup';
import { resendConfirmationEmail } from '@/app/actions/auth';

export default function SignupPage() {
  const [showFireworks, setShowFireworks] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const form = e.currentTarget;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement)?.value;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim();
    const fullName = (form.elements.namedItem('fullName') as HTMLInputElement)?.value?.trim();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setIsSubmitting(true);
    setShowFireworks(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
        redirect: 'follow',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && !data.needsEmailConfirmation) {
        window.location.href = '/member/dashboard';
        return;
      }
      if (data.success && data.needsEmailConfirmation) {
        setShowFireworks(false);
        setIsSubmitting(false);
        setError('');
        setPendingConfirmEmail(data.email ?? null);
        setSuccessMessage(`🎉 Congratulations! You're almost there. Check your inbox (${data.email}) for a confirmation link. Click it to activate your account, then log in.`);
        return;
      }
      if (data.error) {
        setError(data.error);
      }
      setShowFireworks(false);
      setIsSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setShowFireworks(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 relative" style={{
      background: 'linear-gradient(to bottom, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)'
    }}>
      <Fireworks trigger={showFireworks} duration={2000} />
      <SignupWelcomePopup isOpen={showWelcomePopup} memberName={welcomeName} />
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Signup Container */}
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
                A World of <span className="text-black font-semibold">Art</span>, <span className="text-black font-semibold">Style</span> & <span className="text-purple-600 font-bold">High-End Fashion</span>
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 mb-4"></div>

            {/* Title - Pushed Higher */}
            <div className="text-center mb-5">
              <h2 className="text-4xl md:text-5xl font-bold text-purple-600 uppercase tracking-wide mb-3">SIGN UP</h2>
              <div className="border-t border-gray-300 mb-4"></div>
              <p className="text-base md:text-lg text-gray-600">Join our exclusive community of art and fashion enthusiasts.</p>
            </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSignup}>
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">NAME</label>
              <input
                type="text"
                name="fullName"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">EMAIL</label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder="Add your e-mail address."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="Enter your password."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">CONFIRM PASSWORD</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="Confirm your password."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">PHONE CODE</label>
                <input
                  type="text"
                  name="phoneCode"
                  defaultValue="+1"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="+1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">PHONE NUMBER</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="space-y-2">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm">
                  {successMessage}
                </div>
                {pendingConfirmEmail && (
                  <button
                    type="button"
                    onClick={async () => {
                      setResendMessage('');
                      setIsResending(true);
                      const res = await resendConfirmationEmail(pendingConfirmEmail);
                      setIsResending(false);
                      if (res?.error) setResendMessage(res.error);
                      else setResendMessage('Confirmation email sent! Check your inbox.');
                    }}
                    disabled={isResending}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
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
              <span className="relative z-10">{isSubmitting ? 'Signing Up...' : 'Sign Up'}</span>
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-base md:text-lg text-gray-600 mb-4">Already have an account?</p>
            <Link 
              href="/login" 
              className="text-lg md:text-xl text-purple-600 hover:text-purple-700 font-bold transition-colors"
            >
              Log In
            </Link>
          </div>
          </div>

          {/* The Possibilities Section - Right Side */}
          <div className="hidden md:block">
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200 shadow-xl">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">The Possibilities</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                    ✨
                  </div>
                  <div>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mb-2">Exclusive Collections</p>
                    <p className="text-base md:text-lg text-gray-600">Access to hand-designed hat collections</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    🎨
                  </div>
                  <div>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mb-2">Custom Hat Builder</p>
                    <p className="text-base md:text-lg text-gray-600">Create your personalized hat design</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                    🎭
                  </div>
                  <div>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mb-2">Fashion Events</p>
                    <p className="text-base md:text-lg text-gray-600">Early access to fashion runways & art shows</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    💎
                  </div>
                  <div>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mb-2">Member Perks</p>
                    <p className="text-base md:text-lg text-gray-600">Special pricing & exclusive offers</p>
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
