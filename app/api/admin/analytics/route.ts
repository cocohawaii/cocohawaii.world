import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Generate a unique visitor ID (simple approach)
function getVisitorId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const combined = `${ip}-${userAgent}`;
  return Buffer.from(combined).toString('base64').substring(0, 32);
}

// GET - Fetch analytics from Supabase
export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();

    // Fetch all visits to compute unique visitors per page and globally
    // Use RPC or raw SQL. Simpler: count rows and get distinct in app, or use a view.
    // Actually: each row is (page, visitor_id) unique. So total rows ≠ unique visitors.
    // Unique visitors = count distinct visitor_id. We need raw SQL or aggregate.
    const { data: visits } = await admin.from('page_analytics_visits').select('visitor_id, page');
    const uniqueVisitors = new Set((visits || []).map((v) => v.visitor_id));
    const pageVisitsMap: Record<string, Set<string>> = {};
    for (const v of visits || []) {
      if (!pageVisitsMap[v.page]) pageVisitsMap[v.page] = new Set();
      pageVisitsMap[v.page].add(v.visitor_id);
    }
    const pageVisits = Object.fromEntries(
      Object.entries(pageVisitsMap).map(([page, set]) => [page, set.size])
    );

    // Member signups and logins
    const { data: signupRows } = await admin
      .from('page_analytics_events')
      .select('id')
      .eq('event_type', 'signup');
    const { data: loginRows } = await admin
      .from('page_analytics_events')
      .select('id')
      .eq('event_type', 'login');

    return NextResponse.json({
      success: true,
      analytics: {
        globalUniqueVisitors: uniqueVisitors.size,
        pageVisits,
        memberSignups: signupRows?.length ?? 0,
        memberLogins: loginRows?.length ?? 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// POST - Track a page visit, signup, or login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, visitorId, event } = body;

    const admin = createAdminClient();

    if (event === 'signup') {
      await admin.from('page_analytics_events').insert({ event_type: 'signup' });
      return NextResponse.json({ success: true, message: 'Signup tracked' });
    }

    if (event === 'login') {
      await admin.from('page_analytics_events').insert({ event_type: 'login' });
      return NextResponse.json({ success: true, message: 'Login tracked' });
    }

    // Page visit
    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page path is required for page visits' },
        { status: 400 }
      );
    }

    const id = visitorId || getVisitorId(request);

    await admin
      .from('page_analytics_visits')
      .upsert(
        { page, visitor_id: id },
        { onConflict: 'page,visitor_id', ignoreDuplicates: true }
      );

    return NextResponse.json({ success: true, message: 'Visit tracked' });
  } catch (error: any) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to track event' },
      { status: 500 }
    );
  }
}
