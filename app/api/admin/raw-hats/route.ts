/**
 * GET /api/admin/raw-hats - List raw hats from Supabase (admin only)
 * POST /api/admin/raw-hats - Create new raw hat (admin only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { convertWixImageUrl } from '@/lib/wix-utils';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

async function ensureAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Unauthorized', admin: null };
  const { data: member } = await supabase.from('members').select('role').eq('auth_id', user.id).single();
  const role = (member?.role as string) || '';
  if (!role.toLowerCase().includes('admin')) return { error: 'Admin only', admin: null };
  return { admin: createAdminClient() };
}

export async function POST(request: NextRequest) {
  try {
    const { admin, error } = await ensureAdmin();
    if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });

    const body = await request.json();
    const { hatForm, hatColorName, hatProductName, hatProductImage, hatColorHex, rawHatPrice } = body;
    if (!hatForm?.trim() || !hatProductName?.trim()) {
      return NextResponse.json({ error: 'hatForm and hatProductName required' }, { status: 400 });
    }

    const wixId = randomUUID();
    const hatColor = hatColorHex ? [hatColorHex.startsWith('#') ? hatColorHex : `#${hatColorHex}`] : [];
    const row = {
      wix_id: wixId,
      hat_form: String(hatForm).trim(),
      hat_color_name: String(hatColorName || '').trim(),
      hat_product_name: String(hatProductName).trim(),
      hat_product_image: hatProductImage?.trim() || null,
      hat_color: hatColor,
      hat_color_hex: hatColor[0] || null,
      raw_hat_price: typeof rawHatPrice === 'number' ? rawHatPrice : parseFloat(String(rawHatPrice || 0)) || 0,
      raw_hat_id: wixId,
    };

    const { error: insertErr } = await admin!.from('raw_hats').insert(row);
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ success: true, hat: { ...row, id: wixId } });
  } catch (err: any) {
    console.error('raw-hats POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: member } = await supabase.from('members').select('role').eq('auth_id', user.id).single();
    const role = (member?.role as string) || '';
    if (!role.toLowerCase().includes('admin')) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const { data: rows, error: dbError } = await supabase
      .from('raw_hats')
      .select('*')
      .order('hat_form')
      .order('hat_product_name');

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    const hats = (rows || []).map((r: any) => ({
      id: r.id,
      wixId: r.wix_id,
      hatForm: r.hat_form,
      hatColorName: r.hat_color_name,
      hatProductName: r.hat_product_name,
      hatProductImage: convertWixImageUrl(r.hat_product_image) || r.hat_product_image || '',
      rawHatPrice: Number(r.raw_hat_price) || 0,
      rawHatId: r.raw_hat_id || r.wix_id,
    }));

    return NextResponse.json({ success: true, hats });
  } catch (err: any) {
    console.error('raw-hats error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
