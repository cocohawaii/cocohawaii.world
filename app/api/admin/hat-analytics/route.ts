import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ANALYTICS_FILE = path.join(process.cwd(), 'analytics.json');

// Read analytics data for page visits
async function readAnalytics() {
  try {
    await fs.access(ANALYTICS_FILE);
    const fileContent = await fs.readFile(ANALYTICS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Convert arrays to counts
    const pageVisits: Record<string, number> = {};
    Object.entries(data.pageVisits || {}).forEach(([page, visitors]: [string, any]) => {
      pageVisits[page] = Array.isArray(visitors) ? visitors.length : (typeof visitors === 'number' ? visitors : 0);
    });
    
    return { pageVisits };
  } catch (error) {
    return { pageVisits: {} };
  }
}

// GET - Fetch analytics for all hats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hatId = searchParams.get('hatId');

    const getCommissionRate = (sales: number): number => {
      if (sales >= 50) return 20;
      if (sales >= 25) return 15;
      if (sales >= 3) return 12;
      return 10;
    };

    const supabase = await createClient();
    const analytics = await readAnalytics();

    const { data: allHats } = await supabase.from('hats').select('wix_id, title, slug');
    const { data: ordersData } = await supabase.from('hat_orders').select('*');
    const allOrders = ordersData || [];

    // Normalize orders for compatibility (hat_title, total_price, pr_referral_id)
    const normOrders = allOrders.map((o: any) => ({
      hatOrdertitle: o.hat_title,
      hatOrderPrice: o.hat_price,
      totalFinalCost: o.total_price,
      prReferralId: o.pr_referral_id || '',
    }));

    const prSalesByMember: Record<string, number> = {};
    normOrders.forEach((o: any) => {
      if (o.prReferralId?.trim()) {
        prSalesByMember[o.prReferralId] = (prSalesByMember[o.prReferralId] || 0) + 1;
      }
    });

    // If specific hatId requested, return just that hat's analytics
    if (hatId) {
      const hat = (allHats || []).find((h: any) => h.wix_id === hatId || h.slug === hatId);
      const hatTitle = hat?.title || '';
      let sales = 0, earnings = 0, prSales = 0, prEarnings = 0;
      normOrders.forEach((o: any) => {
        if (o.hatOrdertitle === hatTitle) {
          const price = Number(o.totalFinalCost) || Number(o.hatOrderPrice) || 0;
          if (price > 0) {
            sales += 1;
            earnings += price;
            if (o.prReferralId?.trim()) {
              prSales += 1;
              prEarnings += (price * getCommissionRate(prSalesByMember[o.prReferralId] || 0)) / 100;
            }
          }
        }
      });
      const hatSlug = hat?.slug || hatId;
      const possiblePaths = [`/hats/${hatSlug}`, `/hats/${hatId}`];
      let visitors = 0;
      for (const p of possiblePaths) {
        const v = analytics.pageVisits[p];
        if (typeof v === 'number' && v > 0) {
          visitors = v;
          break;
        }
      }
      return NextResponse.json({
        success: true,
        analytics: { visitors, sales, earnings, prSales, prEarnings },
      });
    }

    const hatAnalytics: Record<string, { visitors: number; sales: number; earnings: number; prSales: number; prEarnings: number }> = {};

    (allHats || []).forEach((hat: any) => {
      const hid = hat.wix_id;
      const hatTitle = hat.title || '';
      const hatSlug = hat.slug || hatTitle.toLowerCase().replace(/\s+/g, '-') || hid;
      const possiblePaths = [`/hats/${hatSlug}`, `/hats/${hid}`];
      let visitors = 0;
      for (const p of possiblePaths) {
        const v = analytics.pageVisits[p];
        if (typeof v === 'number' && v > 0) {
          visitors = v;
          break;
        }
      }
      let sales = 0, earnings = 0, prSales = 0, prEarnings = 0;
      normOrders.forEach((o: any) => {
        if (o.hatOrdertitle === hatTitle) {
          const price = Number(o.totalFinalCost) || Number(o.hatOrderPrice) || 0;
          sales += 1;
          earnings += price;
          if (o.prReferralId?.trim()) {
            prSales += 1;
            prEarnings += (price * getCommissionRate(prSalesByMember[o.prReferralId] || 0)) / 100;
          }
        }
      });
      hatAnalytics[hid] = { visitors, sales, earnings, prSales, prEarnings };
    });

    return NextResponse.json({
      success: true,
      hatAnalytics,
    });
  } catch (error: any) {
    console.error('Error fetching hat analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch hat analytics' },
      { status: 500 }
    );
  }
}
