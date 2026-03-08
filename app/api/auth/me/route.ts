import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Helper: role string contains a tag (e.g. "admin,pr" contains "pr")
function roleHas(memberRole: string | null | undefined, tag: string): boolean {
  if (!memberRole) return false;
  const parts = memberRole.toLowerCase().split(',').map((s) => s.trim());
  return parts.includes(tag.toLowerCase());
}

export async function PATCH(req: NextRequest) {
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
    const { role } = body;
    if (!role || !['user', 'pr', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    let { data: member, error: memberError } = await supabase
      .from('members')
      .select('role')
      .eq('auth_id', user.id)
      .single();
    // Auto-create member if missing (e.g. trigger didn't run, or user signed up before trigger)
    if (memberError?.code === 'PGRST116' || !member) {
      const fullName = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Member';
      const admin = createAdminClient();
      const { data: inserted, error: insertError } = await admin
        .from('members')
        .upsert(
          {
            auth_id: user.id,
            email: user.email ?? '',
            full_name: fullName,
          },
          { onConflict: 'auth_id' }
        )
        .select('role')
        .single();
      if (!insertError && inserted) {
        member = inserted;
        memberError = null;
      }
    }
    if (memberError || !member) {
      console.error('Auth me PATCH: member fetch failed', memberError?.message, memberError?.code);
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    if (role === 'admin' && !roleHas(member.role, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // When becoming PR: append "pr" to existing role (never overwrite)
    // e.g. user -> user,pr | user,admin -> user,admin,pr | admin -> admin,pr
    let newRole: string;
    if (role === 'pr') {
      if (roleHas(member.role, 'pr')) {
        newRole = member.role;
      } else {
        newRole = member.role ? member.role + ',pr' : 'user,pr';
      }
    } else {
      newRole = role;
    }

    const { data: updated, error: updateError } = await supabase
      .from('members')
      .update({ role: newRole })
      .eq('auth_id', user.id)
      .select()
      .single();
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    const m = updated as { role: string };
    return NextResponse.json({
      success: true,
      member: {
        id: updated.id,
        role: m.role,
        memberTag: m.role,
        isPr: roleHas(m.role, 'pr'),
      },
    });
  } catch (err) {
    console.error('Auth me PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const MEMBER_SELECT = 'id, auth_id, email, full_name, role, star_bids, star_bids_consumed, phone, shipping_address, shipping_city, shipping_postal_code, shipping_country, created_at';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ member: null }, { status: 401 });
    }

    let { data: member, error: memberError } = await supabase
      .from('members')
      .select(MEMBER_SELECT)
      .eq('auth_id', user.id)
      .single();

    // No member row (e.g. deleted by admin) - sign out and deny access.
    // Do NOT return a fallback member; deleted users must lose access.
    if (memberError?.code === 'PGRST116' || !member) {
      await supabase.auth.signOut();
      return NextResponse.json({ member: null }, { status: 401 });
    }
    if (memberError) {
      console.error('Auth me: member fetch error:', memberError);
      // Fallback: return minimal member from auth user so dashboard loads
      const fullName = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Member';
      return NextResponse.json({
        success: true,
        member: {
          id: user.id,
          authId: user.id,
          email: user.email ?? '',
          fullName,
          role: 'user',
          memberName: fullName,
          memberEmail: user.email ?? '',
          memberTag: 'user',
          starBids: 0,
          starBidsConsumed: 0,
        },
      });
    }

    const m = member as {
      id: string; auth_id: string; email: string; full_name: string; role: string;
      star_bids?: number; star_bids_consumed?: number;
      phone?: string; shipping_address?: string; shipping_city?: string; shipping_postal_code?: string; shipping_country?: string;
    };
    return NextResponse.json({
      success: true,
      member: {
        id: m.id,
        authId: m.auth_id,
        email: m.email,
        fullName: m.full_name,
        role: m.role,
        memberName: m.full_name,
        memberEmail: m.email,
        memberTag: m.role,
        isPr: roleHas(m.role, 'pr'),
        starBids: m.star_bids ?? 0,
        starBidsConsumed: m.star_bids_consumed ?? 0,
        phone: m.phone ?? null,
        shippingAddress: m.shipping_address ?? null,
        shippingCity: m.shipping_city ?? null,
        shippingPostalCode: m.shipping_postal_code ?? null,
        shippingCountry: m.shipping_country ?? null,
      },
    });
  } catch (err) {
    console.error('Auth me error:', err);
    return NextResponse.json(
      {
        member: null,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
