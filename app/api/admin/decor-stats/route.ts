import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    if (!member || member.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: items } = await admin.from('home_decor').select('id, is_active');
    const totalItems = items?.length ?? 0;
    const activeItems = items?.filter((i) => i.is_active !== false).length ?? 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalSales: 0,
        totalEarnings: 0,
        prCount: 0,
        prSalesCount: 0,
        prEarnings: 0,
        totalOrders: 0,
        totalItems,
        activeItems,
      },
    });
  } catch (error: any) {
    console.error('Decor stats error:', error);
    return NextResponse.json({
      success: true,
      stats: {
        totalSales: 0,
        totalEarnings: 0,
        prCount: 0,
        prSalesCount: 0,
        prEarnings: 0,
        totalOrders: 0,
        totalItems: 0,
        activeItems: 0,
      },
    });
  }
}
