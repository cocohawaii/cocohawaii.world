'use client';

import Image from 'next/image';
import { ComponentProps, ImgHTMLAttributes } from 'react';

// Check if URL is from Supabase Storage (use Next.js Image for optimization)
function isSupabaseUrl(src: string | undefined): boolean {
  if (!src) return false;
  return src.includes('supabase') && src.includes('storage');
}

// Check if URL is from Wix CDN (use img tag - Next.js Image can have CORS issues with Wix)
function isWixUrl(src: string | undefined): boolean {
  if (!src) return false;
  return src.includes('static.wixstatic.com') || 
         src.includes('media.wix.com') || 
         src.includes('wixsite.com') ||
         src.startsWith('wix:image://');
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

// Wrapper for Next.js Image: Supabase uses Image (optimized), Wix uses img (CORS)
export default function WixImage({
  src,
  fill,
  className,
  alt,
  sizes,
  priority,
  quality = 80,
  ...props
}: ComponentProps<typeof Image>) {
  const srcStr = typeof src === 'string' ? src : String(src ?? '');
  const fromSupabase = isSupabaseUrl(srcStr);
  const fromWix = isWixUrl(srcStr);
  const cleanedSrc = fromWix ? cleanWixUrl(srcStr) : srcStr;

  // Supabase: use Next.js Image for automatic optimization (resize, WebP, lazy load)
  if (fromSupabase) {
    return (
      <Image
        {...props}
        src={srcStr}
        fill={fill}
        className={className}
        alt={alt || ''}
        sizes={fill ? sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : sizes}
        priority={priority}
        quality={quality}
      />
    );
  }

  if (fromWix && fill) {
    // Use regular img tag with absolute positioning for Wix images with fill
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
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        fetchPriority={priority ? 'high' : undefined}
        onError={(e) => {
          console.warn('Image failed to load:', cleanedSrc);
          const target = e.target as HTMLImageElement;
          if (target.src !== cleanedSrc) {
            target.src = cleanedSrc;
          }
        }}
      />
    );
  }
  
  if (fromWix) {
    // Use regular img tag for Wix images without fill
    // Use referrerPolicy to help with CORS
    return (
      <img
        src={cleanedSrc}
        alt={alt || ''}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        fetchPriority={priority ? 'high' : undefined}
        onError={(e) => {
          console.warn('Image failed to load:', cleanedSrc);
          const target = e.target as HTMLImageElement;
          if (target.src !== cleanedSrc) {
            target.src = cleanedSrc;
          }
        }}
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
