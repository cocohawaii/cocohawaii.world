import { getHatFromSupabase } from '@/lib/supabase-hats';
import { notFound } from 'next/navigation';
import HatProductPage from '@/components/HatProductPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HatPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  let hatSlug: string = '';
  
  try {
    // Handle both Promise and direct params (Next.js 14 vs 15)
    const resolvedParams = await Promise.resolve(params);
    hatSlug = resolvedParams.slug;

    if (!hatSlug) {
      console.error(`❌ No slug provided`);
      notFound();
    }

    // Decode URL-encoded slug
    hatSlug = decodeURIComponent(hatSlug);
    console.log(`🔍 [HatPage] Fetching hat with slug: "${hatSlug}"`);

    const hat = await getHatFromSupabase(hatSlug);

    if (!hat) {
      console.error(`❌ [HatPage] Hat not found with slug: "${hatSlug}"`);
      console.error(`   Attempted to find hat with slug: ${hatSlug}`);
      notFound();
    }

    console.log(`✅ [HatPage] Found hat: "${hat.title}" (slug: ${hat.slug || 'generated'})`);
    console.log(`📸 [HatPage] Hat _id: ${hat._id}`);

    return <HatProductPage hat={hat} />;
  } catch (error: any) {
    console.error(`❌ [HatPage] Error rendering page for slug "${hatSlug || 'unknown'}":`, error);
    console.error(`   Error message: ${error.message}`);
    console.error(`   Error stack: ${error.stack}`);
    notFound();
  }
}
