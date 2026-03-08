import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ success: false, item: null }, { status: 400 });

    const decodedSlug = decodeURIComponent(slug);
    const admin = createAdminClient();
    let row: { id: string; title: string; slug: string; price: number; discounted_price: number | null; main_image: string; description: string | null } | null = null;
    const { data: bySlug } = await admin
      .from('home_decor')
      .select('id, title, slug, price, discounted_price, main_image, description, is_active')
      .eq('slug', decodedSlug)
      .eq('is_active', true)
      .maybeSingle();
    row = bySlug;
    if (!row && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug)) {
      const { data: byId } = await admin
        .from('home_decor')
        .select('id, title, slug, price, discounted_price, main_image, description, is_active')
        .eq('id', decodedSlug)
        .eq('is_active', true)
        .maybeSingle();
      row = byId;
    }

    if (!row) {
      return NextResponse.json({ success: false, item: null }, { status: 404 });
    }

    const item = {
      _id: row.id,
      title: row.title,
      slug: row.slug,
      price: Number(row.price) || 0,
      discountedPrice: row.discounted_price != null ? Number(row.discounted_price) : undefined,
      mainImage: row.main_image || '',
      description: row.description || '',
    };
    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    console.error('Home decor item fetch error:', err?.message);
    return NextResponse.json({ success: false, item: null }, { status: 500 });
  }
}
