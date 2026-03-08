import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

function slugify(title: string): string {
  if (!title) return '';
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    if (!member || member.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, price, discountedPrice, mainImage, description, isActive } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const slug = slugify(title.trim()) || `item-${Date.now()}`;
    const { data: existing } = await admin.from('home_decor').select('id').eq('slug', slug).maybeSingle();
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const { data: inserted, error } = await admin
      .from('home_decor')
      .insert({
        title: title.trim(),
        slug: finalSlug,
        price: typeof price === 'number' ? price : parseFloat(price) || 0,
        discounted_price: discountedPrice != null && discountedPrice !== '' ? (typeof discountedPrice === 'number' ? discountedPrice : parseFloat(discountedPrice)) : null,
        main_image: mainImage || '',
        description: description || '',
        is_active: isActive !== false,
      })
      .select('id, title, slug, price, discounted_price, main_image, description, is_active')
      .single();

    if (error || !inserted) {
      console.error('Home decor create error:', error);
      return NextResponse.json({ error: error?.message || 'Failed to create item' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: {
        _id: inserted.id,
        title: inserted.title,
        slug: inserted.slug,
        price: Number(inserted.price),
        discountedPrice: inserted.discounted_price != null ? Number(inserted.discounted_price) : undefined,
        mainImage: inserted.main_image || '',
        description: inserted.description || '',
        isActive: inserted.is_active,
      },
    });
  } catch (error: any) {
    console.error('Home decor create error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create item' }, { status: 500 });
  }
}
