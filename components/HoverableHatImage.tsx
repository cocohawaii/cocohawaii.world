'use client';

import { useState, useRef, useCallback } from 'react';
import WixImage from '@/components/WixImage';

interface HoverableHatImageProps {
  mainSrc: string;
  gallerySrc?: string;
  alt: string;
  className?: string;
  sizes?: string;
}

export default function HoverableHatImage({ mainSrc, gallerySrc, alt, className, sizes }: HoverableHatImageProps) {
  const [showGallery, setShowGallery] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (!gallerySrc) return;
    timerRef.current = setTimeout(() => {
      setShowGallery(true);
      timerRef.current = null;
    }, 1500);
  }, [gallerySrc]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowGallery(false);
  }, []);

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${showGallery ? 'opacity-0' : 'opacity-100'}`}
      >
        <WixImage
          src={mainSrc}
          alt={alt}
          fill
          className={className}
          sizes={sizes}
        />
      </div>
      {gallerySrc && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${showGallery ? 'opacity-100' : 'opacity-0'}`}
        >
          <WixImage
            src={gallerySrc}
            alt={alt}
            fill
            className={className}
            sizes={sizes}
          />
        </div>
      )}
    </div>
  );
}
