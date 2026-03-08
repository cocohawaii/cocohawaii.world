import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hatId } = body;

    if (!hatId) {
      return NextResponse.json({ error: 'hatId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in to delete hats' }, { status: 401 });
    }
    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    if (!member || !String(member.role).toLowerCase().includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { error } = await admin.from('hats').delete().eq('wix_id', hatId);

    if (error) {
      console.error('Delete hat error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Delete hat error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete hat' }, { status: 500 });
  }
}
