import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberTag } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to update your tag.' },
        { status: 401 }
      );
    }

    const { data: member } = await supabase
      .from('members')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found. Please ensure you are signed up.' },
        { status: 404 }
      );
    }

    const currentRoles = (member.role || 'user').split(',').map((r: string) => r.trim());
    const tagToAdd = (memberTag || 'PR').toUpperCase() === 'PR' ? 'pr' : (memberTag || '').toLowerCase();
    if (!tagToAdd) {
      return NextResponse.json(
        { error: 'Invalid tag' },
        { status: 400 }
      );
    }

    const hasTag = currentRoles.some((r: string) => r.toLowerCase() === tagToAdd.toLowerCase());
    const updatedRoles = hasTag ? currentRoles : [...currentRoles, tagToAdd];
    const newRole = updatedRoles.join(',');

    const { data: updated, error } = await supabase
      .from('members')
      .update({ role: newRole })
      .eq('id', member.id)
      .select('id, role')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update member tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: updated,
      memberTag: updated.role,
    });
  } catch (error: unknown) {
    console.error('Update tag error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update member tag' },
      { status: 500 }
    );
  }
}
