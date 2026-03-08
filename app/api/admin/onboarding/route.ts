import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function addAdminToRole(currentRole: string | null | undefined): string {
  if (!currentRole || currentRole.trim() === '') return 'user,admin';
  const tags = currentRole
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (tags.includes('admin')) return currentRole;
  tags.push('admin');
  return tags.join(',');
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const code = String(body?.code ?? '').trim();
    const expected = process.env.ADMIN_ONBOARDING_CODE ?? '';

    if (!expected) {
      console.error('ADMIN_ONBOARDING_CODE env var not set');
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    if (code.length !== 6 || code !== expected) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: member, error: fetchError } = await admin
      .from('members')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (fetchError || !member) {
      const fullName = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Member';
      const { data: inserted, error: insertError } = await admin
        .from('members')
        .upsert(
          {
            auth_id: user.id,
            email: user.email ?? '',
            full_name: fullName,
            role: 'user,admin',
          },
          { onConflict: 'auth_id' }
        )
        .select('role')
        .single();
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        role: (inserted as { role: string }).role,
      });
    }

    const newRole = addAdminToRole((member as { role: string }).role);
    const { data: updated, error: updateError } = await admin
      .from('members')
      .update({ role: newRole })
      .eq('auth_id', user.id)
      .select('role')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      role: (updated as { role: string }).role,
    });
  } catch (err) {
    console.error('Admin onboarding error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
