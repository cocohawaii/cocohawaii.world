'use client';

import { useState } from 'react';

interface HomepageVideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}

export default function HomepageVideo({ src, className, style, onError }: HomepageVideoProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    console.error('❌ Video load error:', {
      error: video.error,
      code: video.error?.code,
      message: video.error?.message,
      src: src
    });
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return null;
  }

  return (
    <video
      key={src}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className={className}
      style={style}
      onError={handleError}
      onLoadStart={() => {
        console.log('📹 Video loading:', src);
      }}
      onCanPlay={() => {
        console.log('✅ Video can play:', src);
        setHasError(false);
      }}
    />
  );
}
