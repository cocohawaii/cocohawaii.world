import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

// GET - Fetch all pre-made hat orders from Supabase hat_orders
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: orders, error: ordersErr } = await supabase
      .from('hat_orders')
      .select('*')
      .order('order_created_on', { ascending: false })
      .limit(1000);

    if (ordersErr) {
      console.error('Error fetching hat orders:', ordersErr);
      return NextResponse.json({ success: false, error: ordersErr.message }, { status: 500 });
    }

    const allOrders = orders || [];

    // Fetch hats for image lookup
    const { data: hats } = await supabase.from('hats').select('title, main_hat_image');
    const hatsMap: Record<string, string> = {};
    (hats || []).forEach((h: any) => {
      const t = String(h.title || '').trim();
      if (t) hatsMap[t.toLowerCase()] = h.main_hat_image || '';
    });

    const totalOrders = allOrders.length;
    let totalEarnings = 0;
    const formattedOrders = allOrders.map((o: any) => {
      totalEarnings += Number(o.total_price) || 0;
      const hatTitle = String(o.hat_title || '').trim();
      return {
        _id: String(o.wix_id || o.id || ''),
        orderId: String(o.order_id || ''),
        customerName: String(o.customer_name || ''),
        customerEmail: String(o.customer_email || ''),
        customerMobile: String(o.customer_mobile || ''),
        customerAddress: String(o.customer_address || ''),
        shippingCity: String(o.shipping_city || ''),
        shippingPostalCode: String(o.shipping_postal_code || ''),
        shippingCountry: String(o.shipping_country || ''),
        hatTitle,
        hatSubtitle: String(o.hat_subtitle || ''),
        hatImage: hatTitle ? (hatsMap[hatTitle.toLowerCase()] || '') : '',
        hatPrice: Number(o.hat_price) || 0,
        shippingCost: Number(o.shipping_cost) || 0,
        totalPrice: Number(o.total_price) || 0,
        shippingOption: String(o.shipping_option || ''),
        customAsk: String(o.custom_ask || ''),
        orderCreatedOn: o.order_created_on || '',
        prReferralId: String(o.pr_referral_id || ''),
        paymentStatus: String(o.payment_status || 'completed'),
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      stats: {
        totalOrders,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalHats: totalOrders,
      },
    });
  } catch (error: any) {
    console.error('Error fetching pre-made orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch pre-made orders' },
      { status: 500 }
    );
  }
}
