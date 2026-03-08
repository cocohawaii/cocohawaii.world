import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

// GET - Fetch all custom hat orders from Supabase customized_hat_orders
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: orders, error } = await supabase
      .from('customized_hat_orders')
      .select('*')
      .order('order_created_on', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching custom orders:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const allOrders = orders || [];

    // Group orders by group_order_id
    const ordersByGroup: Record<string, any[]> = {};
    allOrders.forEach((o: any) => {
      const groupId = o.group_order_id || 'ungrouped';
      if (!ordersByGroup[groupId]) ordersByGroup[groupId] = [];
      ordersByGroup[groupId].push(o);
    });

    // Calculate statistics
    const totalOrders = Object.keys(ordersByGroup).length;
    let totalEarnings = 0;
    let totalHats = 0;

    Object.values(ordersByGroup).forEach((groupOrders: any[]) => {
      groupOrders.forEach((o: any) => {
        totalHats += 1;
        totalEarnings += Number(o.final_total_price) || Number(o.indv_raw_hat_n_accessory_total_live_price) || 0;
      });
    });

    // Format orders for display (group by groupOrderId)
    const formattedOrders = Object.keys(ordersByGroup).map(groupId => {
      const groupOrders = ordersByGroup[groupId];
      const firstOrder = groupOrders[0];
      
      const groupTotal = groupOrders.reduce((s, o) => s + (Number(o.final_total_price) || Number(o.indv_raw_hat_n_accessory_total_live_price) || 0), 0);
      const findVal = (f: string) => {
        for (const o of groupOrders) {
          const v = String(o[f] || '').trim();
          if (v && v !== 'N/A') return v;
        }
        return '';
      };
      const first = firstOrder;

      return {
        groupOrderId: groupId,
        orderCount: groupOrders.length,
        hats: groupOrders.map((o: any) => ({
          _id: String(o.wix_id || o.id || ''),
          hatForm: Array.isArray(o.hat_form) ? o.hat_form.map(String) : (o.hat_form ? [String(o.hat_form)] : []),
          hatColorName: String(o.hat_color_name || ''),
          hatProductImage: String(o.hat_product_image || ''),
          artStyleTag: '',
          gemstoneTag: '',
          jewelryTag: '',
          notes: String(o.notes || ''),
          birthDate: String(o.birth_date || ''),
          clientDescription: String(o.client_description || ''),
          price: Number(o.final_total_price) || Number(o.indv_raw_hat_n_accessory_total_live_price) || 0,
          email: String(o.email || ''),
          name: String(o.name || ''),
          mobile: String(o.mobile || ''),
          phoneCode: String(o.phone_code || ''),
          address: String(o.address || ''),
          shippingPrice: Number(o.shipping_price) || 0,
          shippingType: String(o.shipping_type || ''),
          paymentMethod: String(o.payment_method || ''),
          orderPaid: Boolean(o.order_paid),
          orderCreatedOn: o.order_created_on || '',
        })),
        totalPrice: groupTotal,
        customerName: findVal('name') || String(first.name || ''),
        customerEmail: findVal('email') || String(first.email || ''),
        customerMobile: findVal('mobile') || String(first.mobile || ''),
        customerPhoneCode: findVal('phone_code') || String(first.phone_code || ''),
        customerAddress: findVal('address') || String(first.address || ''),
        orderCreatedOn: first.order_created_on || '',
        orderPaid: groupOrders.some((o: any) => o.order_paid === true),
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      stats: {
        totalOrders,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalHats,
      },
    });
  } catch (error: any) {
    console.error('Error fetching custom orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch custom orders' },
      { status: 500 }
    );
  }
}
