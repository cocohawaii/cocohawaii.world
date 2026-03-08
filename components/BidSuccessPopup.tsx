'use client';

import { useEffect, useState } from 'react';
import Fireworks from './Fireworks';

interface BidSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  itemName?: string;
  bidAmount?: number;
}

export default function BidSuccessPopup({ isOpen, onClose, itemName, bidAmount }: BidSuccessPopupProps) {
  const [showFireworks, setShowFireworks] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setShowFireworks(true);
      const t = setTimeout(() => setShowFireworks(false), 5000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {showFireworks && <Fireworks trigger={showFireworks} duration={6000} />}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
        <div
          className={`bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden pointer-events-auto transform transition-all duration-500 ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          style={{
            boxShadow: '0 0 60px rgba(168, 85, 247, 0.5), 0 0 120px rgba(236, 72, 153, 0.3), 0 20px 40px rgba(0,0,0,0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-pink-300/10 to-orange-200/10 rounded-3xl" />
          <div className="relative z-10 text-center">
            <div className="mb-6 flex justify-center">
              <div
                className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg scale-100"
                style={{
                  boxShadow: '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)',
                }}
              >
                <span className="text-5xl">🎉</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent mb-2">
              Congratulations! 🎉
            </h2>
            <p className="text-lg text-gray-700 mb-1">
              You’re bid has been placed successfully!
            </p>
            {itemName && (
              <p className="text-gray-600 font-medium mb-1 truncate px-2" title={itemName}>
                {itemName}
              </p>
            )}
            {bidAmount != null && bidAmount > 0 && (
              <p className="text-xl font-bold text-purple-600 mb-6">
                ⭐ {Number(bidAmount).toFixed(0)} star bids
              </p>
            )}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-bold py-4 px-8 rounded-xl text-lg hover:opacity-95 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
