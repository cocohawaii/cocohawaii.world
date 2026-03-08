import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberEmail = searchParams.get('memberEmail');
    if (!memberEmail) {
      return NextResponse.json({ error: 'Member email is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('email', memberEmail.toLowerCase().trim())
      .maybeSingle();

    if (!member) {
      return NextResponse.json({
        success: true,
        salesData: { totalSales: 0, totalEarnings: 0, hatSales: [] },
      });
    }

    const { data: prOrders } = await admin
      .from('hat_orders')
      .select('*')
      .eq('pr_referral_id', member.id)
      .limit(1000);

    const orders = prOrders || [];
    let totalEarnings = 0;
    const hatSalesMap = new Map<string, { hat: any; sales: number; earnings: number }>();

    orders.forEach((o: any) => {
      const orderValue = Number(o.total_price) || 0;
      totalEarnings += orderValue;
      const hatTitle = o.hat_title || 'Unknown Hat';
      if (hatSalesMap.has(hatTitle)) {
        const ex = hatSalesMap.get(hatTitle)!;
        ex.sales += 1;
        ex.earnings += orderValue;
      } else {
        hatSalesMap.set(hatTitle, {
          hat: { _id: o.wix_id, title: hatTitle, price: o.hat_price || 0 },
          sales: 1,
          earnings: orderValue,
        });
      }
    });

    // Get commission rate based on total sales
    const getCommissionRate = (sales: number): number => {
      if (sales >= 50) return 20;
      if (sales >= 25) return 15;
      if (sales >= 3) return 12;
      return 10; // 10% is the base rate for 0+ sales
    };

    const totalSales = orders.length;
    const commissionRate = getCommissionRate(totalSales);
    const hatSales = Array.from(hatSalesMap.values()).map((item) => ({
      ...item,
      commissionRate,
    }));

    return NextResponse.json({
      success: true,
      salesData: {
        totalSales,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        hatSales,
      },
    });
  } catch (error: any) {
    console.error('Error fetching PR sales:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch PR sales',
      },
      { status: 500 }
    );
  }
}
