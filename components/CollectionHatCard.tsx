'use client';

import Link from 'next/link';
import WixImage from '@/components/WixImage';
import { getGalleryItemDisplayUrl } from '@/lib/wix-utils';
import type { Hat } from '@/lib/wix-types';

function getFirstGallerySrc(hat: Hat): string | undefined {
  const g = hat.gallery;
  if (!g || !Array.isArray(g) || g.length === 0) return undefined;
  const first = g[0];
  if (!first) return undefined;
  const url = getGalleryItemDisplayUrl(first);
  return url && url.trim() ? url.trim() : undefined;
}

function generateSlug(title: string, fallback: string): string {
  if (!title) return fallback;
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

interface CollectionHatCardProps {
  hat: Hat;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect?: (hat: Hat) => void;
  t?: (key: string) => string;
}

export default function CollectionHatCard({
  hat,
  selectMode,
  isSelected,
  onToggleSelect,
  t,
}: CollectionHatCardProps) {
  const gallerySrc = getFirstGallerySrc(hat);
  const hatSlug = hat.slug || generateSlug(hat.title || '', hat._id);
  const sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  const imageClassName = 'object-cover group-hover:scale-110 transition-transform duration-300';

  const isSold = hat.isSold === true;

  const imageArea = (
    <div className={`hat-card-image relative h-96 w-full overflow-hidden ${gallerySrc ? 'group/img' : ''}`}>
      <div className={`absolute inset-0 transition-opacity duration-500 ease-out delay-[150ms] ${gallerySrc ? 'opacity-100 group-hover/img:opacity-0 group-hover/img:delay-0' : 'opacity-100'}`}>
        <WixImage
          src={hat.mainHatImage!}
          alt={hat.title || ''}
          fill
          className={imageClassName}
          sizes={sizes}
        />
      </div>
      {gallerySrc ? (
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out delay-0 group-hover/img:opacity-100 group-hover/img:delay-[150ms]">
          <WixImage
            src={gallerySrc}
            alt={hat.title || ''}
            fill
            className={imageClassName}
            sizes={sizes}
          />
        </div>
      ) : null}
      {isSold && (
        <div
          className="absolute top-4 left-4 flex items-start justify-start pointer-events-none z-20"
          aria-hidden
        >
          <span
            className="text-4xl md:text-5xl font-black tracking-wider select-none"
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 25%, #3b82f6 50%, #a855f7 75%, #ec4899 90%, #3b82f6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              transform: 'rotate(-12deg)',
              filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.6)) drop-shadow(2px 2px 4px rgba(0,0,0,0.5))',
            }}
          >
            SOLD
          </span>
        </div>
      )}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center z-10">
          ✓
        </div>
      )}
    </div>
  );

  const cardContent = (
    <>
      {hat.mainHatImage && imageArea}
      <div className="p-6">
        <h2 className="text-xl font-script text-gray-800 mb-2">{hat.title}</h2>
        {hat.hatSubtitle && <p className="text-gray-600 text-sm mb-2">{hat.hatSubtitle}</p>}
        <p className="text-2xl font-bold text-gray-900">
          {hat.discountedPrice && hat.discountedPrice !== 0 ? `€${hat.discountedPrice}` : `€${hat.price}`}
        </p>
        {hat.discountedPrice && hat.discountedPrice !== 0 && (
          <p className="text-sm text-gray-500 line-through">€{hat.price}</p>
        )}
      </div>
    </>
  );

  const cardClasses = `bg-pink-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
    isSelected ? 'ring-4 ring-purple-500 border-4 border-purple-500' : ''
  }`;

  if (selectMode) {
    if (isSold) {
      return (
        <div className="group text-left w-full opacity-75 cursor-not-allowed" title="This item has been sold">
          <div className={cardClasses}>{cardContent}</div>
        </div>
      );
    }
    return (
      <button
        onClick={() => onToggleSelect?.(hat)}
        className="group cursor-pointer text-left w-full"
      >
        <div className={cardClasses}>{cardContent}</div>
      </button>
    );
  }

  return (
    <Link href={`/hats/${hatSlug}`} className="group block">
      <div className={cardClasses}>{cardContent}</div>
    </Link>
  );
}
