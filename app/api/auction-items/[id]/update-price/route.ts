import { NextRequest, NextResponse } from 'next/server';
import { getAuctionItemFromSupabase, updateAuctionItemInSupabase } from '@/lib/supabase-auction';
import { ArtCreationBidding } from '@/lib/wix-types';

export const dynamic = 'force-dynamic';

// Helper: Parse increase value from text (e.g., "€10" or "10%")
function parseIncreaseValue(increaseText: string): number {
  if (!increaseText) return 0;
  const cleaned = increaseText.replace(/[€$%]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

// Helper: Parse countdown text (e.g., "2 days")
function parseCountdown(countdownText: string): { value: number; unitMs: number; unitLabel: string } {
  if (typeof countdownText !== 'string') countdownText = String(countdownText);
  const parts = countdownText.split(' ');
  const value = parseInt(parts[0]) || 0;
  const unit = parts[1]?.toLowerCase() || 'days';
  
  let unitMs: number;
  let unitLabel: string;
  
  switch (unit) {
    case 'days': case 'day':
      unitMs = 86400000;
      unitLabel = 'day(s)';
      break;
    case 'hours': case 'hour':
      unitMs = 3600000;
      unitLabel = 'hour(s)';
      break;
    case 'minutes': case 'minute':
      unitMs = 60000;
      unitLabel = 'minute(s)';
      break;
    case 'seconds': case 'second':
      unitMs = 1000;
      unitLabel = 'second(s)';
      break;
    default:
      unitMs = 86400000;
      unitLabel = 'day(s)';
  }
  
  return { value, unitMs, unitLabel };
}

// Helper: Convert milliseconds to readable time
function convertMsToReadableTime(ms: number, unitMs: number, unitLabel: string): { value: number; unitLabel: string } {
  const value = Math.max(0, Math.floor(ms / unitMs));
  return { value, unitLabel };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { totalTimeElapsedMs } = body;
    
    const item = await getAuctionItemFromSupabase(params.id);
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Auction item not found' },
        { status: 404 }
      );
    }

    // Calculate price increase
    const basePrice = parseFloat(String(item.artBasePrice || 0));
    const increaseValue = parseIncreaseValue(String(item.artPriceIncrease || '0'));
    const increaseRate = parseInt(String(item.increaseRate || 10000));
    const totalCountdown = parseCountdown(String(item.totalCountdown || '2 days'));
    
    const totalTimeLeftMs = (totalCountdown.value * totalCountdown.unitMs) - (totalTimeElapsedMs || 0);
    const totalIncrease = (totalTimeElapsedMs / increaseRate) * increaseValue;
    const finalPrice = basePrice + totalIncrease;
    const artPriceIncreasedTotalCount = Math.floor(totalTimeElapsedMs / increaseRate);
    
    const elapsedTime = convertMsToReadableTime(totalTimeElapsedMs, totalCountdown.unitMs, totalCountdown.unitLabel);
    const timeLeft = convertMsToReadableTime(totalTimeLeftMs, totalCountdown.unitMs, totalCountdown.unitLabel);

    const updates: Partial<ArtCreationBidding> = {
      artPriceIncreasedTotalCount,
      artPriceIncreasedTotal: totalIncrease.toFixed(2),
      artPriceFinalTotal: finalPrice.toFixed(2),
      totalCountDone: `${elapsedTime.value} ${elapsedTime.unitLabel}`,
      totalCountdownLeft: `${timeLeft.value} ${timeLeft.unitLabel}`,
      totalTimeElapsedMs: totalTimeElapsedMs
    };

    await updateAuctionItemInSupabase(params.id, updates);

    return NextResponse.json({ 
      success: true, 
      updates,
      item: { ...item, ...updates }
    });
  } catch (error: any) {
    console.error('Error updating auction item price:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update price' },
      { status: 500 }
    );
  }
}
