import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

function mapRowToHat(row: Record<string, unknown>): Record<string, unknown> {
  const hatForm = row.hat_form;
  const formArr = Array.isArray(hatForm) ? hatForm : hatForm ? [String(hatForm)] : [];
  return {
    _id: row.id ?? row.wix_id ?? '',
    hatForm: formArr.map((f: unknown) => String(f)),
    hatColorName: row.hat_color_name ?? '',
    hatColor: [],
    hatColorHex: '',
    hatProductImage: row.hat_product_image ?? '',
    rawHatPrice: Number(row.raw_hat_price) || 0,
    artStyleTag: [],
    gemstoneTag: [],
    jewelryTag: [],
    fabricTag: [],
    notes: row.notes ?? '',
    birthDate: row.birth_date ?? '',
    clientDescription: row.client_description ?? '',
    IndvRawHatNAccessoryTotalLivePrice: Number(row.indv_raw_hat_n_accessory_total_live_price) || 0,
    finalTotalPrice: Number(row.final_total_price) || 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify user is authenticated and requesting their own email
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: member } = user
      ? await supabase.from('members').select('email').eq('auth_id', user.id).single()
      : { data: null };
    const allowedEmail = (member?.email || user?.email || '').toLowerCase().trim();
    if (!allowedEmail || allowedEmail !== normalizedEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from('customized_hat_orders')
      .select('*')
      .eq('email', normalizedEmail)
      .order('order_created_on', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching custom orders:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Also fetch by partial match if we got few results (email variations)
    let items = rows || [];
    if (items.length < 5) {
      const { data: allRows } = await admin
        .from('customized_hat_orders')
        .select('*')
        .order('order_created_on', { ascending: false })
        .limit(1000);
      items = (allRows || []).filter(
        (r: any) =>
          (r.email || '').toLowerCase().trim() === normalizedEmail ||
          (r.email || '').toLowerCase().includes(normalizedEmail) ||
          normalizedEmail.includes((r.email || '').toLowerCase().trim())
      );
    }

    // Group by group_order_id
    const ordersByGroup: Record<string, any[]> = {};
    for (const row of items) {
      const r = row as Record<string, unknown>;
      const groupId = String(r.group_order_id || 'unknown');
      if (!ordersByGroup[groupId]) ordersByGroup[groupId] = [];
      ordersByGroup[groupId].push(r);
    }

    const orders = Object.entries(ordersByGroup).map(([groupId, groupHats]) => {
      const first = groupHats[0] as Record<string, unknown>;
      const totalPrice = groupHats.reduce(
        (sum, h) => sum + (Number((h as any).indv_raw_hat_n_accessory_total_live_price) || Number((h as any).final_total_price) || 0),
        0
      );
      return {
        groupOrderId: groupId,
        hats: groupHats.map((h) => mapRowToHat(h as Record<string, unknown>)),
        orderDate: first.order_created_on ?? new Date().toISOString(),
        totalPrice,
        orderPaid: groupHats.some((h) => (h as any).order_paid === true),
        paymentMethod: String(first.payment_method ?? ''),
        shippingType: String(first.shipping_type ?? ''),
      };
    });

    return NextResponse.json({ success: true, orders, count: orders.length });
  } catch (error: any) {
    console.error('Error fetching custom orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
