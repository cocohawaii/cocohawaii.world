import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

function toSnake(obj: Record<string, any>): Record<string, any> {
  const map: Record<string, string> = {
    hatSubtitle: 'hat_subtitle',
    hatDescription: 'hat_description',
    discountedPrice: 'discounted_price',
    mainHatImage: 'main_hat_image',
    topVideoEyes: 'top_video_eyes',
    makingOfProductPage: 'making_of_product_page',
    gallery: 'gallery',
    hatSize: 'hat_size',
    collection: 'collection',
    color: 'color',
    slug: 'slug',
    isActive: 'is_active',
    isSold: 'is_sold',
  };
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const key = map[k] || k;
    out[key] = v;
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hatId, updates } = body;

    if (!hatId) {
      return NextResponse.json({ error: 'hatId is required' }, { status: 400 });
    }
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'updates must be an object' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in to update hats' }, { status: 401 });
    }
    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    if (!member || !String(member.role).toLowerCase().includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: hat } = await admin.from('hats').select('*').eq('wix_id', hatId).single();
    if (!hat) {
      return NextResponse.json({ error: 'Hat not found' }, { status: 404 });
    }

    const updatePayload = toSnake(updates);
    const { error } = await admin.from('hats').update({
      ...updatePayload,
      updated_at: new Date().toISOString(),
    }).eq('wix_id', hatId);

    if (error) {
      console.error('Update hat error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: updated } = await admin.from('hats').select('*').eq('wix_id', hatId).single();
    return NextResponse.json({
      success: true,
      hat: updated ? { _id: updated.wix_id, ...updated } : null,
    });
  } catch (error: any) {
    console.error('❌ Update hat error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update hat' }, { status: 500 });
  }
}
