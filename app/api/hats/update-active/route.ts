import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hatIds, isActive } = body;

    if (!Array.isArray(hatIds) || hatIds.length === 0) {
      return NextResponse.json({ error: 'hatIds must be a non-empty array' }, { status: 400 });
    }
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
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

    const results: { hatId: string; success: boolean; error?: string; isActive?: boolean }[] = [];

    for (const hatId of hatIds) {
      const { error } = await admin
        .from('hats')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('wix_id', hatId);

      if (error) {
        results.push({ hatId, success: false, error: error.message });
      } else {
        results.push({ hatId, success: true, isActive });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return NextResponse.json({
      success: successCount > 0,
      results,
      summary: {
        total: hatIds.length,
        successful: successCount,
        failed: hatIds.length - successCount,
      },
    });
  } catch (error: any) {
    console.error('❌ Update active error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update hats' }, { status: 500 });
  }
}
