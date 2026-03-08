import { NextRequest, NextResponse } from 'next/server';
import { getAuctionItemFromSupabase } from '@/lib/supabase-auction';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await getAuctionItemFromSupabase(params.id);
    
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Auction item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Error fetching auction item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch auction item' },
      { status: 500 }
    );
  }
}
