import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendStarBidPackPurchaseEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to purchase.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      packId,
      quantity = 1,
      paymentMethod = 'Card',
      totalPriceEUR,
    } = body;

    if (!packId) {
      return NextResponse.json(
        { success: false, error: 'Pack ID is required' },
        { status: 400 }
      );
    }

    const qty = Math.max(1, Math.min(100, Math.floor(Number(quantity)) || 1));

    const admin = createAdminClient();

    // Get member by auth
    const { data: member, error: memberError } = await admin
      .from('members')
      .select('id, email, full_name, star_bids')
      .eq('auth_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'Member not found. Please sign up first.' },
        { status: 404 }
      );
    }

    // Get pack
    const { data: pack, error: packError } = await admin
      .from('star_bid_packs')
      .select('id, pack_id, name, stars_amount, price')
      .eq('pack_id', packId)
      .eq('active', true)
      .single();

    if (packError || !pack) {
      return NextResponse.json(
        { success: false, error: 'Star bid pack not found' },
        { status: 404 }
      );
    }

    const starsAmount = Number(pack.stars_amount) || 0;
    const packPrice = Number(pack.price) || 0;
    const totalStars = starsAmount * qty;
    const totalPrice = packPrice * qty;
    const priceToUse = totalPriceEUR ?? totalPrice;

    const currentStarBids = Number(member.star_bids) || 0;
    const newStarBids = currentStarBids + totalStars;

    // Update member star_bids
    const { error: updateError } = await admin
      .from('members')
      .update({ star_bids: newStarBids })
      .eq('id', member.id);

    if (updateError) {
      console.error('Error updating member star_bids:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update account.' },
        { status: 500 }
      );
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await admin
      .from('star_bid_pack_purchases')
      .insert({
        member_id: member.id,
        pack_id: pack.pack_id,
        pack_name: pack.name,
        quantity: qty,
        total_stars: totalStars,
        total_price_eur: priceToUse,
        payment_status: 'Completed',
        payment_method: paymentMethod,
      })
      .select('id')
      .single();

    if (purchaseError) {
      console.error('Error creating purchase:', purchaseError);
      // Rollback member update (best-effort)
      await admin
        .from('members')
        .update({ star_bids: currentStarBids })
        .eq('id', member.id);
      return NextResponse.json(
        { success: false, error: 'Failed to record purchase.' },
        { status: 500 }
      );
    }

    const emailTo = (member.email || '').trim();
    if (emailTo) {
      sendStarBidPackPurchaseEmail({
        to: emailTo,
        name: member.full_name || 'there',
        packName: pack.name || 'Star Bid Pack',
        quantity: qty,
        totalStars,
        totalPrice: priceToUse,
        newBalance: newStarBids,
      }).catch((err) => console.error('Star bid pack email error:', err));
    }

    return NextResponse.json({
      success: true,
      purchase: {
        _id: purchase.id,
        packId: pack.pack_id,
        packName: pack.name,
        quantity: qty,
        totalStars,
        totalPriceEUR: priceToUse,
        paymentStatus: 'Completed',
        paymentMethod,
      },
      member: {
        id: member.id,
        starBids: newStarBids,
      },
      starsAdded: totalStars,
    });
  } catch (error: any) {
    console.error('Error processing purchase:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process purchase' },
      { status: 500 }
    );
  }
}
