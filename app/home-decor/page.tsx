'use client';

import { useState, useEffect } from 'react';
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

export default function HomeDecorPage() {
  const [items, setItems] = useState<HomeDecorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/home-decor')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) setItems(data.items);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-serif mb-4">Home Decor</h1>
          <p className="text-xl text-gray-700 mb-2">Statues, decor & art for your space.</p>
          <p className="text-lg text-gray-600">No personalization — just choose and buy.</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">No items yet.</p>
            <p className="text-sm text-gray-400">Add items from the admin dashboard to see them here.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <Link key={item._id} href={`/home-decor/${item.slug}`} className="group">
                <div className="bg-pink-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  {item.mainImage ? (
                    <div className="relative h-80 w-full">
                      <WixImage
                        src={item.mainImage}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="h-80 w-full bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h2>
                    <p className="text-2xl font-bold text-gray-900">
                      {item.discountedPrice != null && item.discountedPrice > 0
                        ? `€${item.discountedPrice}`
                        : `€${item.price}`}
                    </p>
                    {item.discountedPrice != null && item.discountedPrice > 0 && (
                      <p className="text-sm text-gray-500 line-through">€{item.price}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
