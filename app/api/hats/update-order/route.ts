import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

/**
 * POST body: { hatIds: string[] } - ordered list of wix_ids
 * Sets display_order to index for each hat.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hatIds } = body;

    if (!Array.isArray(hatIds) || hatIds.length === 0) {
      return NextResponse.json({ error: 'hatIds must be a non-empty array' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    }
    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    if (!member || !String(member.role).toLowerCase().includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    for (let i = 0; i < hatIds.length; i++) {
      await admin.from('hats').update({ display_order: i, updated_at: new Date().toISOString() }).eq('wix_id', hatIds[i]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Update order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
