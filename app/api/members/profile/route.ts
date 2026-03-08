import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, shippingAddress, shippingCity, shippingPostalCode, shippingCountry } = body;

    const updates: Record<string, string | null> = {};
    if (fullName !== undefined) updates.full_name = fullName?.trim() || null;
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (shippingAddress !== undefined) updates.shipping_address = shippingAddress?.trim() || null;
    if (shippingCity !== undefined) updates.shipping_city = shippingCity?.trim() || null;
    if (shippingPostalCode !== undefined) updates.shipping_postal_code = shippingPostalCode?.trim() || null;
    if (shippingCountry !== undefined) updates.shipping_country = shippingCountry?.trim() || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('members')
      .update(updates)
      .eq('auth_id', user.id)
      .select('id, auth_id, email, full_name, role, phone, shipping_address, shipping_city, shipping_postal_code, shipping_country, star_bids, star_bids_consumed')
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      member: {
        id: updated.id,
        authId: updated.auth_id,
        email: updated.email,
        fullName: updated.full_name,
        role: updated.role,
        memberName: updated.full_name,
        memberEmail: updated.email,
        memberTag: updated.role,
        phone: updated.phone,
        shippingAddress: updated.shipping_address,
        shippingCity: updated.shipping_city,
        shippingPostalCode: updated.shipping_postal_code,
        shippingCountry: updated.shipping_country,
        starBids: updated.star_bids ?? 0,
        starBidsConsumed: updated.star_bids_consumed ?? 0,
      },
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update profile' }, { status: 500 });
  }
}
