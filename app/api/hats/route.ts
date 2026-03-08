import { NextRequest, NextResponse } from 'next/server';
import { getHatsFromSupabase, type HatsSortBy } from '@/lib/supabase-hats';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const rawVideoUrls = searchParams.get('rawVideoUrls') === 'true';
    const sortBy = (searchParams.get('sortBy') || 'created_at_desc') as HatsSortBy;

    const hats = await getHatsFromSupabase(collection || undefined, {
      rawVideoUrls,
      activeOnly,
      sortBy,
    });

    return NextResponse.json({ success: true, hats });
  } catch (error: any) {
    console.error('Error fetching hats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch hats' },
      { status: 500 }
    );
  }
}
