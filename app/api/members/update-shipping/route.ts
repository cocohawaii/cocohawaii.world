import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberEmail, shippingAddress, city, postalCode, country } = body;

    if (!shippingAddress || !city || !postalCode || !country) {
      return NextResponse.json(
        { error: 'Missing required shipping fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to save your shipping address.' },
        { status: 401 }
      );
    }

    const { data: updated, error } = await supabase
      .from('members')
      .update({
        shipping_address: shippingAddress.trim(),
        shipping_city: city.trim(),
        shipping_postal_code: postalCode.trim(),
        shipping_country: country.trim(),
      })
      .eq('auth_id', user.id)
      .select('id, email, full_name, role, shipping_address, shipping_city, shipping_postal_code, shipping_country')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update shipping' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: {
        _id: updated.id,
        memberEmail: updated.email,
        shippingAddress: updated.shipping_address,
        shippingCity: updated.shipping_city,
        shippingPostalCode: updated.shipping_postal_code,
        shippingCountry: updated.shipping_country,
      },
    });
  } catch (error: unknown) {
    console.error('Update shipping error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update member shipping info' },
      { status: 500 }
    );
  }
}
