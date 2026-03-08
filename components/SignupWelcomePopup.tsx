'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Fireworks from './Fireworks';

interface SignupWelcomePopupProps {
  isOpen: boolean;
  memberName: string;
}

export default function SignupWelcomePopup({ isOpen, memberName }: SignupWelcomePopupProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      router.push('/member/dashboard');
    }, 3000);
    return () => clearTimeout(t);
  }, [isOpen, router]);

  if (!isOpen) return null;

  return (
    <>
      <Fireworks trigger={true} duration={3000} />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in" />
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden pointer-events-auto transform scale-100 opacity-100"
          style={{
            boxShadow: '0 0 60px rgba(168, 85, 247, 0.5), 0 0 120px rgba(236, 72, 153, 0.3), 0 20px 40px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-pink-300/10 to-transparent rounded-3xl" />
          <div className="relative z-10 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg text-5xl">
                🎉
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Congratulations!
            </h2>
            <p className="text-lg text-gray-700 mb-2">
              Welcome to <strong className="text-purple-600">Coco Hawaii</strong>, <strong>{memberName}</strong>!
            </p>
            <p className="text-gray-600 mb-6">
              Your account is ready. Redirecting you to your dashboard...
            </p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
