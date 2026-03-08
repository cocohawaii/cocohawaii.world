'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WixImage from '@/components/WixImage';

interface HomeDecorItem {
  _id: string;
  title: string;
  slug: string;
  price: number;
  discountedPrice?: number;
  mainImage: string;
  description?: string;
}

export default function HomeDecorProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const [item, setItem] = useState<HomeDecorItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    fetch(`/api/home-decor/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.success && data?.item) setItem(data.item);
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">Item not found.</p>
        <Link href="/home-decor" className="text-purple-600 hover:text-purple-700 font-semibold">
          ← Back to Home Decor
        </Link>
      </div>
    );
  }

  const price = item.discountedPrice != null && item.discountedPrice > 0 ? item.discountedPrice : item.price;
  const checkoutUrl = `/contact?subject=${encodeURIComponent(`Home Decor: ${item.title}`)}&message=${encodeURIComponent(`I'd like to buy: ${item.title} (€${price})`)}`;

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/home-decor" className="inline-block text-gray-600 hover:text-black mb-8">
          ← Back to Home Decor
        </Link>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100">
            {item.mainImage ? (
              <div className="relative aspect-square w-full">
                <WixImage
                  src={item.mainImage}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="aspect-square w-full flex items-center justify-center text-gray-400">No image</div>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-serif text-gray-900 mb-4">{item.title}</h1>
            {item.description && (
              <p className="text-gray-600 mb-6 whitespace-pre-wrap">{item.description}</p>
            )}
            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900">
                €{price}
              </span>
              {item.discountedPrice != null && item.discountedPrice > 0 && (
                <span className="ml-2 text-lg text-gray-500 line-through">€{item.price}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-6">No personalization — ready to ship.</p>
            <div className="flex flex-wrap gap-4">
              <a
                href={checkoutUrl}
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity"
              >
                Buy now
              </a>
              <Link
                href="/home-decor"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-gray-800 border-2 border-gray-800 hover:bg-gray-100 transition-colors"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
