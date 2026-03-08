import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRaffleTicketPurchaseEmail } from '@/lib/email';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raffleId } = await params;
    const body = await request.json();
    const ticketCount = Math.max(1, parseInt(String(body.ticketCount || 1), 10) || 1);
    const ticketNumbers = Array.isArray(body.ticketNumbers) ? body.ticketNumbers : undefined;

    if (!UUID_REGEX.test(raffleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid raffle. Please log in to enter.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to enter this raffle.' },
        { status: 401 }
      );
    }

    const rpcParams: { p_raffle_id: string; p_quantity: number; p_ticket_numbers?: number[] } = {
      p_raffle_id: raffleId,
      p_quantity: ticketCount,
    };
    if (ticketNumbers && ticketNumbers.length === ticketCount) {
      rpcParams.p_ticket_numbers = ticketNumbers;
    }
    const { data, error } = await supabase.rpc('enter_raffle_secure', rpcParams);

    if (error) {
      console.error('Supabase enter error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to enter raffle' },
        { status: 500 }
      );
    }

    const result = data as { success: boolean; error?: string; message?: string; newStarBids?: number; totalCost?: number };
    if (result.success) {
      const totalCost = result.totalCost ?? ticketCount * 5;
      const admin = createAdminClient();
      const [{ data: raffle }, { data: member }] = await Promise.all([
        admin.from('raffles').select('title').eq('id', raffleId).single(),
        admin.from('members').select('email, full_name').eq('auth_id', user.id).single(),
      ]);
      const emailTo = (member?.email || '').trim();
      if (emailTo) {
        sendRaffleTicketPurchaseEmail({
          to: emailTo,
          name: member?.full_name || 'there',
          raffleTitle: raffle?.title || 'Raffle',
          ticketCount,
          ticketNumbers: ticketNumbers,
          totalCost,
        }).catch((err) => console.error('Raffle ticket email error:', err));
      }
      return NextResponse.json({
        success: true,
        message: result.message,
        ticketCount,
        totalCost: result.totalCost,
        newStarBids: result.newStarBids,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error || 'Failed to enter raffle' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error entering raffle:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to enter raffle' },
      { status: 500 }
    );
  }
}
