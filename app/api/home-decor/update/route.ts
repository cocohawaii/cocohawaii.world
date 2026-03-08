import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

function slugify(title: string): string {
  if (!title) return '';
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    if (!member || member.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { _id, title, price, discountedPrice, mainImage, description, isActive } = body;

    if (!_id) return NextResponse.json({ error: '_id is required' }, { status: 400 });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(_id));
    if (!isUuid) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) {
      updates.title = typeof title === 'string' ? title.trim() : '';
      updates.slug = slugify(String(updates.title)) || undefined;
    }
    if (price !== undefined) updates.price = typeof price === 'number' ? price : parseFloat(price) || 0;
    if (discountedPrice !== undefined) updates.discounted_price = discountedPrice === '' || discountedPrice == null ? null : (typeof discountedPrice === 'number' ? discountedPrice : parseFloat(discountedPrice));
    if (mainImage !== undefined) updates.main_image = mainImage || '';
    if (description !== undefined) updates.description = description || '';
    if (typeof isActive === 'boolean') updates.is_active = isActive;

    const { data: updated, error } = await admin
      .from('home_decor')
      .update(updates)
      .eq('id', _id)
      .select('id, title, slug, price, discounted_price, main_image, description, is_active')
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: {
        _id: updated.id,
        title: updated.title,
        slug: updated.slug,
        price: Number(updated.price),
        discountedPrice: updated.discounted_price != null ? Number(updated.discounted_price) : undefined,
        mainImage: updated.main_image || '',
        description: updated.description || '',
        isActive: updated.is_active,
      },
    });
  } catch (error: any) {
    console.error('Home decor update error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update' }, { status: 500 });
  }
}
