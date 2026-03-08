'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function AdminOnboardingPage() {
  const { isLoading, hasSession, refetch } = useAuth();
  const router = useRouter();
  const [showPad, setShowPad] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleDigit = (d: string) => {
    if (code.length >= 6) return;
    setCode((c) => c + d);
    setStatus('idle');
    setMessage('');
  };

  const handleBackspace = () => {
    setCode((c) => c.slice(0, -1));
    setStatus('idle');
    setMessage('');
  };

  const handleClear = () => {
    setCode('');
    setStatus('idle');
    setMessage('');
  };

  const handleSubmit = async () => {
    if (code.length !== 6) {
      setMessage('Enter 6 digits');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus('success');
        setMessage('Admin access granted! Redirecting...');
        await refetch();
        setTimeout(() => router.push('/member/admin'), 1500);
      } else {
        setStatus('error');
        setMessage(data.error || 'Invalid code');
        setCode('');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong');
      setCode('');
    }
  };

  useEffect(() => {
    if (!isLoading && !hasSession) {
      router.replace('/login');
    }
  }, [isLoading, hasSession, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        {!showPad ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Admin Onboarding</h1>
            <p className="text-gray-600 mb-6 text-sm">Enter the 6-digit code to add admin access.</p>
            <button
              onClick={() => setShowPad(true)}
              className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Enter Code
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Enter 6-Digit Code</h1>
            <div className="mb-6">
              <div className="flex justify-center gap-2 mb-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-12 rounded border-2 border-gray-300 flex items-center justify-center text-lg font-mono font-bold"
                  >
                    {code[i] || ''}
                  </div>
                ))}
              </div>
              {message && (
                <p className={`text-center text-sm ${status === 'error' ? 'text-red-600' : status === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
                  {message}
                </p>
              )}
            </div>

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleDigit(String(n))}
                  className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-mono text-lg font-bold transition-colors"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setShowPad(false)}
                className="py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDigit('0')}
                className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-mono text-lg font-bold transition-colors"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
              >
                ⌫
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
              >
                Clear
              </button>
              <button
                onClick={handleSubmit}
                disabled={code.length !== 6 || status === 'loading'}
                className="flex-1 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'loading' ? 'Checking...' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
