import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const supabase = await createClient();

    const { data: orders } = await admin.from('hat_orders').select('*').limit(1000);
    const allOrders = orders || [];

    let totalEarnings = 0;
    allOrders.forEach((o: any) => {
      totalEarnings += Number(o.total_price) || 0;
    });

    const { data: members } = await supabase.from('members').select('id, email, full_name, role').limit(1000);
    const allMembers = members || [];
    let prCount = 0;
    allMembers.forEach((m: any) => {
      if ((m.role || '').toLowerCase().includes('pr')) prCount++;
    });

    let prSalesCount = 0;
    let prEarnings = 0;
    allOrders.forEach((o: any) => {
      if (o.pr_referral_id) {
        prSalesCount++;
        prEarnings += Number(o.total_price) || 0;
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalSales: allOrders.length,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        prCount,
        prSalesCount,
        prEarnings: Math.round(prEarnings * 100) / 100,
        totalOrders: allOrders.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch statistics',
      },
      { status: 500 }
    );
  }
}
