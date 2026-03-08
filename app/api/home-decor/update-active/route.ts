import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    if (!member || member.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { itemIds, isActive } = body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds must be a non-empty array' }, { status: 400 });
    }
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    const uuidIds = itemIds.filter((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id)));
    const { error } = await admin
      .from('home_decor')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .in('id', uuidIds);

    const successful = error ? 0 : uuidIds.length;
    return NextResponse.json({
      success: successful > 0,
      results: itemIds.map((id: string) => ({
        itemId: id,
        success: uuidIds.includes(id) && !error,
        error: uuidIds.includes(id) ? undefined : 'Invalid ID or not found',
      })),
      summary: { total: itemIds.length, successful, failed: itemIds.length - successful },
    });
  } catch (error: any) {
    console.error('Home decor update-active error:', error);
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}
