import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberEmail = searchParams.get('memberEmail');

    if (!memberEmail) {
      return NextResponse.json({ error: 'Member email is required' }, { status: 400 });
    }

    const normalizedEmail = memberEmail.toLowerCase().trim();
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from('hat_orders')
      .select('*')
      .eq('customer_email', normalizedEmail)
      .order('order_created_on', { ascending: false })
      .limit(1000);

    // Filter to completed orders only (payment_status may not exist on older schema)
    const completed = (rows || []).filter((o: { payment_status?: string }) => o.payment_status !== 'pending');

    const orders = completed.map((o: any) => ({
      _id: o.wix_id,
      hatOrderID: o.order_id,
      hatorderEmail: o.customer_email,
      hatOrderEmail: o.customer_email,
      hatOrdertitle: o.hat_title,
      hatOrderSubtitle: o.hat_subtitle,
      hatOrderPrice: o.hat_price,
      totalFinalCost: o.total_price,
      orderAddress: o.customer_address,
      shippingCity: o.shipping_city,
      shippingPostalCode: o.shipping_postal_code,
      shippingCountry: o.shipping_country,
      shippingOption: o.shipping_option,
      hatorderCustomAsk: o.custom_ask,
      prReferralId: o.pr_referral_id,
      hatOrderCreatedOn: o.order_created_on,
    }));

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Error in get orders route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
