'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Fireworks from './Fireworks';

interface PRConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
}

export default function PRConfirmationPopup({ isOpen, onClose, memberName }: PRConfirmationPopupProps) {
  const router = useRouter();
  const [showFireworks, setShowFireworks] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setShowFireworks(true);
      // Keep fireworks going for 4 seconds
      setTimeout(() => {
        setShowFireworks(false);
      }, 4000);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Fireworks effect */}
      {showFireworks && <Fireworks trigger={showFireworks} duration={4000} />}
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.3s ease-out',
        }}
      />
      
      {/* Popup */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
        <div 
          className={`bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden pointer-events-auto transform transition-all duration-500 ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          style={{
            boxShadow: '0 0 60px rgba(34, 197, 94, 0.6), 0 0 120px rgba(34, 197, 94, 0.4), 0 0 180px rgba(34, 197, 94, 0.2), 0 20px 40px rgba(0, 0, 0, 0.3)',
            animation: 'pulseGreen 2s ease-in-out infinite',
          }}
        >
          {/* Green glow background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-green-300/10 to-transparent rounded-3xl" />
          
          {/* Animated border ring */}
          <div 
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.8), rgba(16, 185, 129, 0.8), rgba(34, 197, 94, 0.8))',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 3s ease infinite',
              padding: '3px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
          
          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
              <div 
                className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg"
                style={{
                  animation: 'scaleBounce 0.6s ease-out',
                  boxShadow: '0 0 30px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.4)',
                }}
              >
                <svg 
                  className="w-12 h-12 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{
                    strokeDasharray: '50',
                    strokeDashoffset: '50',
                    animation: 'checkmarkDraw 0.6s ease-out 0.2s forwards',
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              🎉 Congratulations!
            </h2>
            
            {/* Message */}
            <p className="text-lg text-gray-700 mb-2">
              <strong className="text-green-600">{memberName}</strong>, you are now a
            </p>
            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent mb-4">
              PR Member!
            </p>
            
            <p className="text-gray-600 mb-6">
              You now have access to earn progressive commissions. Start referring customers and watch your earnings grow!
            </p>
            
            {/* Action Button */}
            <button
              onClick={() => {
                setIsAnimating(false);
                onClose();
                // Use Next.js router for navigation
                router.push('/member/pr');
              }}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-8 rounded-xl text-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              style={{
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
              }}
            >
              Go to PR Dashboard →
            </button>
          </div>
          
          {/* Global CSS Animations */}
          <style jsx global>{`
            @keyframes pulseGreen {
              0%, 100% {
                box-shadow: 0 0 60px rgba(34, 197, 94, 0.6), 0 0 120px rgba(34, 197, 94, 0.4), 0 0 180px rgba(34, 197, 94, 0.2), 0 20px 40px rgba(0, 0, 0, 0.3);
              }
              50% {
                box-shadow: 0 0 80px rgba(34, 197, 94, 0.8), 0 0 160px rgba(34, 197, 94, 0.6), 0 0 240px rgba(34, 197, 94, 0.4), 0 20px 40px rgba(0, 0, 0, 0.3);
              }
            }
            
            @keyframes gradientShift {
              0%, 100% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
            }
            
            @keyframes scaleBounce {
              0% {
                transform: scale(0);
              }
              50% {
                transform: scale(1.1);
              }
              100% {
                transform: scale(1);
              }
            }
            
            @keyframes checkmarkDraw {
              to {
                stroke-dashoffset: 0;
              }
            }
            
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            
            .animate-fade-in {
              animation: fadeIn 0.3s ease-out;
            }
          `}</style>
        </div>
      </div>
    </>
  );
}
