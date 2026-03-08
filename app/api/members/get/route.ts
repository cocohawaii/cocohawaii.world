import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toMemberShape } from '@/lib/member-shape';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberEmail = searchParams.get('email');

    if (!memberEmail) {
      return NextResponse.json(
        { error: 'Member email is required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from('members')
      .select('id, email, full_name, role, star_bids, star_bids_consumed, phone, shipping_address, shipping_city, shipping_postal_code, shipping_country')
      .eq('email', memberEmail.toLowerCase().trim())
      .single();

    if (error || !row) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      member: toMemberShape(row),
    });
  } catch (error: unknown) {
    console.error('Error in get member route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
