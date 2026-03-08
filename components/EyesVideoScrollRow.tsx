'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import HomepageVideo from './HomepageVideo';

export interface EyesVideoItem {
  videoUrl: string;
  title: string;
  slug: string;
}

interface EyesVideoScrollRowProps {
  items: EyesVideoItem[];
}

function CardSet({
  items,
  onVideoError,
}: {
  items: EyesVideoItem[];
  onVideoError: (slug: string) => void;
}) {
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.slug}
          href={`/hats/${item.slug}`}
          className="flex-shrink-0 w-[240px] md:w-[280px] group"
        >
          <div className="bg-white rounded-none overflow-hidden shadow-lg ring-1 ring-gray-100 hover:shadow-xl hover:ring-purple-200 transition-all duration-300">
            <div className="relative w-full aspect-[4/3]" style={{ minHeight: 0 }}>
              <HomepageVideo
                src={item.videoUrl}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={{ minHeight: '100%', minWidth: '100%' }}
                onError={() => onVideoError(item.slug)}
              />
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}

export default function EyesVideoScrollRow({ items }: EyesVideoScrollRowProps) {
  const [failedSlugs, setFailedSlugs] = useState<string[]>([]);
  const markFailed = useCallback((slug: string) => {
    setFailedSlugs((s) => (s.includes(slug) ? s : [...s, slug]));
  }, []);
  const visibleItems = items.filter((i) => !failedSlugs.includes(i.slug));

  if (!visibleItems.length) return null;

  return (
    <div className="relative w-full overflow-hidden mt-14">
      <div className="flex animate-scroll-marquee" style={{ width: 'max-content' }}>
        <div className="flex gap-6 pr-6 flex-shrink-0">
          <CardSet items={visibleItems} onVideoError={markFailed} />
        </div>
        <div className="flex gap-6 pr-6 flex-shrink-0">
          <CardSet items={visibleItems} onVideoError={markFailed} />
        </div>
      </div>
    </div>
  );
}
