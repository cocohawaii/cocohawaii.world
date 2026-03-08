import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toMemberShape } from '@/lib/member-shape';

export const dynamic = 'force-dynamic';

const MEMBER_SELECT = 'id, email, full_name, role, star_bids, star_bids_consumed, phone, shipping_address, shipping_city, shipping_postal_code, shipping_country';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const byEmail = searchParams.get('byEmail') === 'true';

    const admin = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (byEmail || id.includes('@')) {
      const { data: row } = await admin
        .from('members')
        .select(MEMBER_SELECT)
        .eq('email', id.toLowerCase().trim())
        .single();
      if (row) {
        return NextResponse.json({ success: true, member: toMemberShape(row) });
      }
    } else if (isUuid) {
      const { data: row } = await admin
        .from('members')
        .select(MEMBER_SELECT)
        .eq('id', id)
        .single();
      if (row) {
        return NextResponse.json({ success: true, member: toMemberShape(row) });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Member not found' },
      { status: 404 }
    );
  } catch (error: unknown) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch member' },
      { status: 500 }
    );
  }
}
