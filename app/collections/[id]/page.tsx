import Link from 'next/link';
import CollectionHatCard from '@/components/CollectionHatCard';
import { getCollectionFromSupabase, getHatsFromSupabase } from '@/lib/supabase-hats';
import { notFound } from 'next/navigation';

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(params);
  const collection = await getCollectionFromSupabase(id);
  if (!collection) {
    notFound();
  }
  const hats = await getHatsFromSupabase(collection._id, { sortBy: 'display_order' });

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/collections" className="text-gray-600 hover:text-black transition-colors">
            ← Back
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-serif mb-4">{collection.name}</h1>
          {collection.description && (
            <p className="text-xl text-gray-600">{collection.description}</p>
          )}
        </div>

        {hats.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No hats available in this collection yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hats.map((hat) => (
              <CollectionHatCard
                key={hat._id}
                hat={hat}
                selectMode={false}
                isSelected={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
