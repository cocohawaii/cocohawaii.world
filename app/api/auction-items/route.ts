import { NextRequest, NextResponse } from 'next/server';
import { getAuctionItemsFromSupabase } from '@/lib/supabase-auction';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // Default true
    
    const items = await getAuctionItemsFromSupabase(activeOnly);
    
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Error fetching auction items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch auction items' },
      { status: 500 }
    );
  }
}
