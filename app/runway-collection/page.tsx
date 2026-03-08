'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WixImage from '@/components/WixImage';

type Runway = {
  id: string;
  title: string;
  subtitle?: string;
  eventDate: string;
  startTime?: string;
  itemsRevealed: boolean;
  hatIds: string[];
};

type Hat = {
  _id: string;
  title: string;
  slug?: string;
  mainHatImage?: string;
  price?: number;
  discountedPrice?: number;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export default function RunwayCollectionPage() {
  const [runways, setRunways] = useState<Runway[]>([]);
  const [hats, setHats] = useState<Hat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/runway/collection').then((r) => r.json()),
      fetch('/api/hats').then((r) => r.json()),
    ]).then(([runwayRes, hatsRes]) => {
      if (runwayRes.success && Array.isArray(runwayRes.runways)) setRunways(runwayRes.runways);
      if (hatsRes.success && Array.isArray(hatsRes.hats)) setHats(hatsRes.hats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Link href="/the-runway" className="text-purple-600 hover:text-purple-800 font-medium mb-4 inline-block">
            ← Back to The Runway
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Runway Collection</h1>
          <p className="text-lg text-gray-600">
            Hats from past runway shows — browse and purchase
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600">Loading runway collections...</p>
          </div>
        ) : runways.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">🎩</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No runway collections yet</h2>
            <p className="text-gray-600">
              Items from past runway shows will appear here once revealed.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {runways.map((runway) => {
              const runwayHats = (runway.hatIds || [])
                .map((hid) => hats.find((h) => h._id === hid))
                .filter(Boolean) as Hat[];
              if (runwayHats.length === 0) return null;
              return (
                <section key={runway.id} className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                    <h2 className="text-2xl font-bold text-gray-900">{runway.title}</h2>
                    {runway.subtitle && <p className="text-gray-600 mt-1">{runway.subtitle}</p>}
                    <p className="text-sm text-purple-600 font-medium mt-2">{formatEventDate(runway.eventDate)}</p>
                  </div>
                  <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {runwayHats.map((hat) => {
                      const slug = hat.slug || hat.title?.toLowerCase().replace(/\s+/g, '-') || hat._id;
                      return (
                        <Link
                          key={hat._id}
                          href={`/hats/${slug}`}
                          className="group block"
                        >
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-purple-100 group-hover:border-purple-300 transition-all">
                            {hat.mainHatImage ? (
                              <WixImage src={hat.mainHatImage} alt={hat.title || 'Hat'} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width: 768px) 50vw, 25vw" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-5xl">🎩</div>
                            )}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-600/90 text-white text-xs font-bold">
                              Runway Collection
                            </div>
                          </div>
                          <p className="font-semibold text-gray-900 mt-2 line-clamp-2">{hat.title || 'Hat'}</p>
                          <p className="text-purple-600 font-bold mt-1">
                            {hat.discountedPrice != null && hat.discountedPrice > 0
                              ? `€${hat.discountedPrice.toFixed(2)}`
                              : `€${(hat.price ?? 0).toFixed(2)}`}
                          </p>
                          <span className="text-sm text-purple-500 mt-1 inline-block group-hover:underline">View & buy →</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
