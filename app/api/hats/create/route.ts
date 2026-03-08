import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const hatData = await request.json();

    if (!hatData.title || !hatData.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!hatData.price || parseFloat(hatData.price) <= 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    const title = hatData.title.trim();
    const row: Record<string, any> = {
      wix_id: randomUUID(),
      title,
      slug: generateSlug(title),
      price: parseFloat(hatData.price) || 0,
      is_active: hatData.isActive !== undefined ? hatData.isActive : false,
    };
    if (hatData.hatSubtitle !== undefined) row.hat_subtitle = hatData.hatSubtitle;
    if (hatData.hatDescription !== undefined) row.hat_description = hatData.hatDescription;
    if (hatData.discountedPrice !== undefined && hatData.discountedPrice !== '' && hatData.discountedPrice != null) {
      const p = parseFloat(hatData.discountedPrice);
      if (!isNaN(p) && p > 0) row.discounted_price = p;
    }
    if (hatData.mainHatImage) row.main_hat_image = hatData.mainHatImage;
    if (hatData.topVideoEyes) row.top_video_eyes = hatData.topVideoEyes;
    if (hatData.makingOfProductPage) row.making_of_product_page = hatData.makingOfProductPage;
    if (hatData.hatSize) row.hat_size = hatData.hatSize;
    if (hatData.collection) row.collection = hatData.collection;
    if (hatData.color) row.color = hatData.color;
    if (hatData.gallery && Array.isArray(hatData.gallery)) row.gallery = hatData.gallery;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in to create hats' }, { status: 401 });
    }
    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    if (!member || !String(member.role).toLowerCase().includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: inserted, error } = await admin.from('hats').insert(row).select().single();

    if (error) {
      console.error('Create hat error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      hat: {
        _id: inserted.wix_id,
        title: inserted.title,
        hatSubtitle: inserted.hat_subtitle,
        hatDescription: inserted.hat_description,
        price: inserted.price,
        discountedPrice: inserted.discounted_price,
        mainHatImage: inserted.main_hat_image,
        topVideoEyes: inserted.top_video_eyes,
        makingOfProductPage: inserted.making_of_product_page,
        gallery: inserted.gallery,
        hatSize: inserted.hat_size,
        collection: inserted.collection,
        slug: inserted.slug,
        isActive: inserted.is_active,
        isSold: inserted.is_sold,
      },
    });
  } catch (error: any) {
    console.error('❌ Create hat error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create hat' }, { status: 500 });
  }
}
