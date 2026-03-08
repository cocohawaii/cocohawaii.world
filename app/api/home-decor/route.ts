import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function toItemShape(row: { id: string; title: string; slug: string; price: number; discounted_price: number | null; main_image: string; description: string | null; is_active: boolean }) {
  return {
    _id: row.id,
    title: row.title,
    slug: row.slug,
    price: Number(row.price) || 0,
    discountedPrice: row.discounted_price != null ? Number(row.discounted_price) : undefined,
    mainImage: row.main_image || '',
    description: row.description || '',
    isActive: row.is_active !== false,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const admin = createAdminClient();
    let query = admin
      .from('home_decor')
      .select('id, title, slug, price, discounted_price, main_image, description, is_active')
      .order('title');
    if (!all) {
      query = query.eq('is_active', true);
    }
    const { data: rows, error } = await query;

    if (error) {
      console.error('Home decor fetch error:', error);
      return NextResponse.json({ success: false, error: error.message, items: [] }, { status: 500 });
    }

    const items = (rows || []).map(toItemShape);
    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error('Home decor fetch error:', err?.message);
    return NextResponse.json({ success: false, error: err?.message, items: [] }, { status: 500 });
  }
}
