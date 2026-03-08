'use client';

import { useState } from 'react';
import Link from 'next/link';

interface GetStarsTooltipProps {
  children: React.ReactNode;
  showTooltip: boolean;
  requiredStars: number;
  currentStars: number;
  className?: string;
}

export default function GetStarsTooltip({
  children,
  showTooltip,
  requiredStars,
  currentStars,
  className = '',
}: GetStarsTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const visible = showTooltip && isHovered;

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {visible && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50 w-[min(320px,90vw)] pointer-events-auto animate-stars-tooltip-in">
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-xl shadow-amber-200/50">
            {/* Sunshine rays / shine effect */}
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-amber-200/40 via-transparent to-transparent rotate-[-15deg] animate-stars-shine pointer-events-none" />
            {/* Decorative sun icon */}
            <div className="absolute top-3 right-3 text-2xl opacity-80 animate-stars-pulse">☀️</div>
            <div className="relative p-5">
              <p className="text-amber-900 font-bold text-base mb-1">Need more stars to play!</p>
              <p className="text-amber-800/90 text-sm mb-3">
                You have <span className="font-bold text-amber-700">{currentStars}</span> stars — this ticket needs{' '}
                <span className="font-bold text-amber-700">{requiredStars}</span>. Grab your sunshine and get back in the game.
              </p>
              <Link
                href="/star-bid-packs"
                className="pointer-events-auto inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-amber-950 font-bold text-sm shadow-lg shadow-amber-300/50 hover:from-amber-500 hover:via-yellow-500 hover:to-orange-500 hover:shadow-amber-400/60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Stars to Bid →
              </Link>
            </div>
            {/* Arrow pointing down */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 rotate-45 border-r-2 border-b-2 border-amber-300/80 bg-gradient-to-br from-amber-50 to-yellow-50" />
          </div>
        </div>
      )}
    </div>
  );
}
