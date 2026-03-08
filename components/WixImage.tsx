'use client';

import Image from 'next/image';
import { ComponentProps, ImgHTMLAttributes } from 'react';

// Check if URL is from Wix CDN or Supabase Storage
function isWixUrl(src: string | undefined): boolean {
  if (!src) return false;
  return src.includes('static.wixstatic.com') || 
         src.includes('media.wix.com') || 
         src.includes('wixsite.com') ||
         src.startsWith('wix:image://') ||
         (src.includes('supabase') && src.includes('storage'));
}

// Clean up Wix image URLs that might have malformed paths. Supabase URLs pass through.
function cleanWixUrl(url: string): string {
  if (url.includes('supabase') && url.includes('storage')) return url;
  if (!url.includes('static.wixstatic.com')) return url;
  
  // Fix URLs like: https://static.wixstatic.com/media/path.png/filename.png
  // Should be: https://static.wixstatic.com/media/path.png
  const match = url.match(/^https:\/\/static\.wixstatic\.com\/media\/([^/]+\.(png|jpg|jpeg|webp|gif|svg))/i);
  if (match) {
    return `https://static.wixstatic.com/media/${match[1]}`;
  }
  
  return url;
}

// Wrapper for Next.js Image that uses regular img tag for Wix images to avoid CORS issues
export default function WixImage({
  src,
  fill,
  className,
  alt,
  sizes,
  ...props
}: ComponentProps<typeof Image>) {
  // If it's a Wix or Supabase URL, use regular img tag to avoid CORS/Next.js Image issues
  const isWix = typeof src === 'string' && isWixUrl(src);
  const cleanedSrc = isWix && typeof src === 'string' ? cleanWixUrl(src) : (typeof src === 'string' ? src : String(src));

  if (isWix && fill) {
    // Use regular img tag with absolute positioning for Wix images with fill
    // Use referrerPolicy to help with CORS and allow cross-origin images
    return (
      <img
        src={cleanedSrc}
        alt={alt || ''}
        className={className}
        style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          inset: 0,
          objectFit: 'cover',
        }}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(e) => {
          console.warn('Image failed to load:', cleanedSrc);
          // Try to load with a different approach or show placeholder
          const target = e.target as HTMLImageElement;
          if (target.src !== cleanedSrc) {
            target.src = cleanedSrc;
          }
        }}
        onLoad={() => {}}
      />
    );
  }
  
  if (isWix) {
    // Use regular img tag for Wix images without fill
    // Use referrerPolicy to help with CORS
    return (
      <img
        src={cleanedSrc}
        alt={alt || ''}
        className={className}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(e) => {
          console.warn('Image failed to load:', cleanedSrc);
          const target = e.target as HTMLImageElement;
          if (target.src !== cleanedSrc) {
            target.src = cleanedSrc;
          }
        }}
        onLoad={() => {}}
        {...(props as ImgHTMLAttributes<HTMLImageElement>)}
      />
    );
  }
  
  // For non-Wix images, use Next.js Image component
  return (
    <Image
      {...props}
      src={src}
      fill={fill}
      className={className}
      alt={alt || ''}
      sizes={fill ? sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : sizes}
    />
  );
}
