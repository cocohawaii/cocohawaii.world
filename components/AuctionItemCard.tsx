'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WixImage from './WixImage';
import AuctionCountdown, { NextIncreaseCountdown } from './AuctionCountdown';
import BidSuccessPopup from './BidSuccessPopup';
import { ArtCreationBidding } from '@/lib/wix-types';

interface AuctionItemCardProps {
  item: ArtCreationBidding;
  onBidClick?: (item: ArtCreationBidding) => void;
}

// If launch/end are in the previous calendar year but end month-day is still ahead this year,
// treat them as current year (CMS often has last year's dates by mistake).
function getEffectiveLaunchEnd(launch: Date, end: Date): { launch: Date; end: Date } {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  if (Number.isNaN(launch.getTime()) || Number.isNaN(end.getTime())) return { launch, end };
  const launchYear = launch.getUTCFullYear();
  const endYear = end.getUTCFullYear();
  if (launchYear !== currentYear - 1 || endYear !== currentYear - 1) return { launch, end };
  const endMonthDay = end.toISOString().slice(5, 10); // MM-DD
  const todayMonthDay = now.toISOString().slice(5, 10);
  if (endMonthDay < todayMonthDay) return { launch, end }; // end already passed this year
  // Reinterpret as current year (keep UTC hour/minute/second)
  const launchCorrected = new Date(Date.UTC(
    currentYear,
    launch.getUTCMonth(),
    launch.getUTCDate(),
    launch.getUTCHours(),
    launch.getUTCMinutes(),
    launch.getUTCSeconds(),
    launch.getUTCMilliseconds()
  ));
  const endCorrected = new Date(Date.UTC(
    currentYear,
    end.getUTCMonth(),
    end.getUTCDate(),
    end.getUTCHours(),
    end.getUTCMinutes(),
    end.getUTCSeconds(),
    end.getUTCMilliseconds()
  ));
  return { launch: launchCorrected, end: endCorrected };
}

// Compare using UTC date strings (YYYY-MM-DD) so "live" = today is on or between launch and end day
function getItemState(item: ArtCreationBidding): 'launching-soon' | 'live' | 'ended' {
  const now = new Date();
  const visible = item.auctionItemVisibleDate ? parseWixDate(item.auctionItemVisibleDate) : null;
  const launch = parseWixDate(item.launchBidItemDate);
  const end = parseWixDate(item.auctionItemEndDate);

  if (visible && !Number.isNaN(visible.getTime()) && now < visible) return 'launching-soon';
  if (Number.isNaN(launch.getTime()) || Number.isNaN(end.getTime())) return 'ended';

  const { launch: effLaunch, end: effEnd } = getEffectiveLaunchEnd(launch, end);
  const todayUtc = now.toISOString().slice(0, 10);
  const launchUtc = effLaunch.toISOString().slice(0, 10);
  const endUtc = effEnd.toISOString().slice(0, 10);

  if (todayUtc < launchUtc) return 'launching-soon';
  if (todayUtc > endUtc) return 'ended';
  return 'live';
}

// Wix can return date fields as { $date: "ISO string" }. Extract to a Date.
function parseWixDate(value: unknown): Date {
  if (value == null) return new Date(NaN);
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  if (typeof value === 'object' && value !== null && '$date' in value) {
    const d = (value as { $date?: string }).$date;
    return new Date(typeof d === 'string' ? d : NaN);
  }
  return new Date(NaN);
}

// Helper: Format launch date
function formatLaunchDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return '—';
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  };
  let str = date.toLocaleString('en-US', options);
  const day = date.getDate();
  const suffix = day > 3 && day < 21 ? 'th' : ['th', 'st', 'nd', 'rd'][day % 10] || 'th';
  return str.replace(String(day), `${day}${suffix}`);
}

export default function AuctionItemCard({ item, onBidClick }: AuctionItemCardProps) {
  const [currentItem, setCurrentItem] = useState(item);
  const [state, setState] = useState<'launching-soon' | 'live' | 'ended'>(getItemState(item));
  const [isBidding, setIsBidding] = useState(false);
  const [userBidStats, setUserBidStats] = useState<{
    count: number;
    amount: number;
    priceTotal: number;
  } | null>(null);
  const [lastBids, setLastBids] = useState<Array<{
    memberUsername: string;
    bidAmount: number;
    bidDate: string | Date;
  }>>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBidSuccessPopup, setShowBidSuccessPopup] = useState(false);
  const [lastBidSuccessInfo, setLastBidSuccessInfo] = useState<{ itemName: string; bidAmount: number } | null>(null);
  const [showError, setShowError] = useState<string | null>(null);

  // Get member ID and email from localStorage (and refresh on login/logout)
  useEffect(() => {
    const sync = () => {
      if (typeof window !== 'undefined') {
        setMemberId(localStorage.getItem('memberId'));
        setMemberEmail(localStorage.getItem('memberEmail'));
      }
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('memberLogin', sync);
    window.addEventListener('memberLogout', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('memberLogin', sync);
      window.removeEventListener('memberLogout', sync);
    };
  }, []);

  // Load user bid stats and last bids
  useEffect(() => {
    async function loadBidData() {
      try {
        const emailParam = memberEmail ? `&memberEmail=${encodeURIComponent(memberEmail)}` : '';
        const response = await fetch(`/api/auction-items/${item._id}/bids?memberId=${memberId || ''}${emailParam}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          if (data.userBidStats) {
            setUserBidStats(data.userBidStats);
          }
          if (data.lastBids) {
            setLastBids(data.lastBids.map((b: any) => ({
              memberUsername: b.memberUsername,
              bidAmount: b.bidAmount,
              bidDate: b.bidDate
            })));
          }
        }
      } catch (error) {
        console.error('Error loading bid data:', error);
      }
    }
    
    if (item._id) {
      loadBidData();
      // Refresh every 10 seconds
      const interval = setInterval(loadBidData, 10000);
      return () => clearInterval(interval);
    }
  }, [item._id, memberId, memberEmail]);

  // Listen for bid updates from other components
  useEffect(() => {
    const handleBidUpdate = () => {
      // Reload bid data when a bid is placed
      if (item._id && memberId) {
        fetch(`/api/auction-items/${item._id}/bids?memberId=${memberId}&limit=5`)
          .then(res => res.json())
          .then(data => {
            if (data.userBidStats) {
              setUserBidStats(data.userBidStats);
            }
            if (data.lastBids) {
              setLastBids(data.lastBids.map((b: any) => ({
                memberUsername: b.memberUsername,
                bidAmount: b.bidAmount,
                bidDate: b.bidDate
              })));
            }
          })
          .catch(console.error);
      }
    };

    window.addEventListener('bidPlaced', handleBidUpdate);
    return () => window.removeEventListener('bidPlaced', handleBidUpdate);
  }, [item._id, memberId, memberEmail]);

  // Live polling: update bid/price/counts from API but keep list dates so they don't flip
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/auction-items/${item._id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.item) {
            setCurrentItem((prev) => {
              const merged = {
                ...data.item,
                launchBidItemDate: prev.launchBidItemDate ?? data.item.launchBidItemDate,
                auctionItemEndDate: prev.auctionItemEndDate ?? data.item.auctionItemEndDate,
                auctionItemVisibleDate: prev.auctionItemVisibleDate ?? data.item.auctionItemVisibleDate,
              };
              setState(getItemState(merged));
              return merged;
            });
          }
        }
      } catch (error) {
        console.error('Error polling auction item:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [item._id]);

  // Auto-update price for live auctions (based on increaseRate)
  useEffect(() => {
    if (state !== 'live' || !currentItem.increaseRate) return;

    const launchDate = parseWixDate(currentItem.launchBidItemDate);
    const now = new Date();
    const elapsedMs = now.getTime() - launchDate.getTime();
    
    // Only update if we have elapsed time
    if (elapsedMs <= 0) return;

    const increaseRate = currentItem.increaseRate || 10000;
    
    // Update price every increaseRate interval
    const priceUpdateInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/auction-items/${item._id}/update-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalTimeElapsedMs: Date.now() - launchDate.getTime()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.item) {
            setCurrentItem((prev) => ({
              ...data.item,
              launchBidItemDate: prev.launchBidItemDate ?? data.item.launchBidItemDate,
              auctionItemEndDate: prev.auctionItemEndDate ?? data.item.auctionItemEndDate,
              auctionItemVisibleDate: prev.auctionItemVisibleDate ?? data.item.auctionItemVisibleDate,
            }));
          }
        }
      } catch (error) {
        console.error('Error updating price:', error);
      }
    }, increaseRate);

    return () => clearInterval(priceUpdateInterval);
  }, [state, currentItem.increaseRate, currentItem.launchBidItemDate, item._id]);

  // Check for critical date changes (every 10 seconds)
  useEffect(() => {
    const criticalPollInterval = setInterval(() => {
      const newState = getItemState(currentItem);
      if (newState !== state) {
        setState(newState);
      }
    }, 10000);

    return () => clearInterval(criticalPollInterval);
  }, [currentItem, state]);

  const launchDate = parseWixDate(currentItem.launchBidItemDate);
  const endDate = parseWixDate(currentItem.auctionItemEndDate);
  const { launch: displayLaunch, end: displayEnd } = getEffectiveLaunchEnd(launchDate, endDate);
  const visibleDate = currentItem.auctionItemVisibleDate ? parseWixDate(currentItem.auctionItemVisibleDate) : null;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ring-1 ring-gray-100 hover:ring-purple-200">
      {currentItem.imageBidItem && (
        <div className="relative h-80 md:h-96 w-full overflow-hidden">
          <WixImage
            src={currentItem.imageBidItem}
            alt={currentItem.bidItemName}
            fill
            className="object-contain transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-script text-gray-800 mb-2">
          {currentItem.bidItemName}
        </h3>
        {currentItem.bidItemType && (
          <p className="text-gray-600 text-sm mb-4">{currentItem.bidItemType}</p>
        )}
        
        {/* State Badge */}
        <div className="mb-4">
          {state === 'live' && (
            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
              🔴 LIVE
            </span>
          )}
          {state === 'launching-soon' && (
            <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-semibold">
              ⏰ Coming Soon
            </span>
          )}
          {state === 'ended' && (
            <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm font-semibold">
              ⏸️ Ended
            </span>
          )}
        </div>

        {/* Countdown Timer - Only show for live auctions */}
        {state === 'live' && (
          <div className="mb-4 p-4 bg-white rounded-lg border-2 border-purple-200">
            <AuctionCountdown 
              endDate={displayEnd}
              increaseRate={currentItem.increaseRate || 10000}
            />
          </div>
        )}

        {/* Launch Date Info */}
        {state === 'launching-soon' && (
          <div className="mb-4 p-4 bg-white rounded-lg border-2 border-yellow-200">
            <p className="text-sm text-gray-600 mb-1">Launching:</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatLaunchDate(launchDate)}
            </p>
          </div>
        )}

        {/* Current Bid */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Current Bid</p>
          <p className="text-2xl font-bold text-gray-900">
            ⭐{Number(currentItem.bidAmount || 0).toFixed(0)}
          </p>
          <p className="text-sm text-gray-600">
            €{Number(currentItem.bidPrice || 0).toFixed(2)}
          </p>
          {state === 'live' && Number(currentItem.bidIncreaseRate ?? 0) > 0 && (
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                <span>Next bid:</span>
                <span className="font-semibold">+⭐{Number(currentItem.bidIncreaseRate).toFixed(0)}</span>
                {currentItem.bidPriceDivision && Number(currentItem.bidPriceDivision) > 0 && (
                  <span className="text-amber-700">
                    (€{(Number(currentItem.bidIncreaseRate) / Number(currentItem.bidPriceDivision)).toFixed(2)})
                  </span>
                )}
              </span>
            </p>
          )}
        </div>

        {/* Price Info (for live auctions) */}
        {state === 'live' && currentItem.artBasePrice && (
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Base Price:</span>
              <span className="font-semibold">€{Number(currentItem.artBasePrice).toFixed(2)}</span>
            </div>
            {currentItem.artPriceFinalTotal && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Final Price:</span>
                <span className="font-bold text-purple-600">€{Number(currentItem.artPriceFinalTotal).toFixed(2)}</span>
              </div>
            )}
            {(currentItem.artPriceIncrease || currentItem.artPriceIncreasedTotalCount !== undefined) && (
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                {currentItem.artPriceIncrease && (
                  <div className="flex justify-between items-center text-sm text-gray-700">
                    <span>Increase amount:</span>
                    <span className="font-semibold text-gray-900">
                      {(() => {
                        const v = String(currentItem.artPriceIncrease || '').trim();
                        if (!v) return '—';
                        if (v.startsWith('€') || v.startsWith('%')) return v;
                        return `€${v}`;
                      })()}
                    </span>
                  </div>
                )}
                {currentItem.artPriceIncreasedTotalCount !== undefined && (
                  <div className="flex justify-between">
                    <span>Increases:</span>
                    <span>{currentItem.artPriceIncreasedTotalCount}</span>
                  </div>
                )}
              </div>
            )}
            {(currentItem.increaseRate && currentItem.increaseRate > 0) && (
              <NextIncreaseCountdown
                endDate={displayEnd}
                increaseRate={currentItem.increaseRate || 10000}
              />
            )}
          </div>
        )}
        
        {/* Stats */}
        <div className="mb-4 space-y-1 text-sm text-gray-600">
          {currentItem.allUsersBidCount !== undefined && (
            <p>📊 {currentItem.allUsersBidCount} bids placed</p>
          )}
          {currentItem.allUsersBidAmount !== undefined && (
            <p>⭐ {currentItem.allUsersBidAmount} total stars bid</p>
          )}
          {currentItem.allUsersBidPriceAmount !== undefined && (
            <p>💰 €{Number(currentItem.allUsersBidPriceAmount).toFixed(2)} total value</p>
          )}
        </div>
        
        {/* Launch & End Date */}
        <div className="text-xs text-gray-500 mb-4 space-y-1">
          <div>Launch: {formatLaunchDate(displayLaunch)}</div>
          <div>End: {formatLaunchDate(displayEnd)}</div>
        </div>

        {/* User Bid Stats */}
        {userBidStats && userBidStats.count > 0 && (
          <div className="mb-4 p-3 bg-purple-100 rounded-lg border border-purple-300">
            <p className="text-sm font-semibold text-purple-900 mb-2">Your Bids</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">Bids:</span>
                <span className="font-bold text-purple-900">{userBidStats.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Stars:</span>
                <span className="font-bold text-purple-900">⭐{userBidStats.amount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Value:</span>
                <span className="font-bold text-purple-900">€{userBidStats.priceTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Last 5 Bidders */}
        {lastBids.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">Recent Bids</p>
            <div className="space-y-1">
              {lastBids.slice(0, 5).map((bid, idx) => (
                <div key={idx} className="flex justify-between text-xs text-gray-600">
                  <span className="truncate">{bid.memberUsername}</span>
                  <span className="font-semibold">⭐{Number(bid.bidAmount).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
            ✅ Bid placed successfully!
          </div>
        )}

        {/* Error Message */}
        {showError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
            ⚠️ {showError}
          </div>
        )}

        {/* Bid Button */}
        {state === 'live' && (
          <button
            onClick={async () => {
              if (!memberId && !memberEmail) {
                setShowError('Please log in to place a bid');
                setTimeout(() => setShowError(null), 5000);
                if (onBidClick) onBidClick(currentItem);
                return;
              }

              if (isBidding) return;

              setIsBidding(true);
              setShowError(null);
              setShowSuccess(false);

              try {
                const memberDocId = typeof window !== 'undefined' ? localStorage.getItem('memberDocId') : null;
                const memberEmailFromStorage = typeof window !== 'undefined' ? localStorage.getItem('memberEmail') : null;
                const memberIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('memberId') : null;
                const emailToSend = (memberEmail || memberEmailFromStorage || '').trim() || undefined;
                const validMemberId = memberId && memberId !== 'local' ? memberId : (memberIdFromStorage && memberIdFromStorage !== 'local' ? memberIdFromStorage : undefined);
                const response = await fetch(`/api/auction-items/${item._id}/bid`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    memberId: validMemberId,
                    memberDocId: memberDocId || undefined,
                    memberEmail: emailToSend || (validMemberId && validMemberId.includes('@') ? validMemberId : undefined),
                    launchBidItemDate: currentItem.launchBidItemDate,
                    auctionItemEndDate: currentItem.auctionItemEndDate
                  })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                  if (data.member && typeof window !== 'undefined') {
                    if (data.member.starBids != null) localStorage.setItem('starBids', String(data.member.starBids));
                    if (data.member.starBidsConsumed != null) localStorage.setItem('starBidsConsumed', String(data.member.starBidsConsumed));
                  }
                  setCurrentItem((prev) => ({
                    ...data.item,
                    launchBidItemDate: prev.launchBidItemDate ?? data.item.launchBidItemDate,
                    auctionItemEndDate: prev.auctionItemEndDate ?? data.item.auctionItemEndDate,
                    auctionItemVisibleDate: prev.auctionItemVisibleDate ?? data.item.auctionItemVisibleDate,
                  }));
                  if (data.userBidStats) setUserBidStats(data.userBidStats);
                  if (data.lastBids) {
                    setLastBids(data.lastBids.map((b: any) => ({
                      memberUsername: b.memberUsername,
                      bidAmount: b.bidAmount,
                      bidDate: b.bidDate
                    })));
                  }
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 5000);
                  setLastBidSuccessInfo({
                    itemName: data.item?.bidItemName || currentItem.bidItemName || 'Item',
                    bidAmount: Number(data.item?.bidAmount ?? currentItem.bidAmount ?? 0)
                  });
                  setShowBidSuccessPopup(true);
                  window.dispatchEvent(new CustomEvent('bidPlaced', { detail: { memberId, itemId: item._id } }));
                  if (onBidClick) onBidClick(data.item);
                } else {
                  setShowError(data.error || 'Failed to place bid');
                  setTimeout(() => setShowError(null), 5000);
                }
              } catch (error: any) {
                console.error('Error placing bid:', error);
                setShowError(error.message || 'Failed to place bid');
                setTimeout(() => setShowError(null), 5000);
              } finally {
                setIsBidding(false);
              }
            }}
            disabled={isBidding}
            className={`w-full px-6 py-3 rounded-lg font-bold text-lg transition-all transform ${
              isBidding
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:shadow-lg hover:scale-105'
            }`}
          >
            {isBidding ? '⏳ Processing...' : `BID NOW (⭐${Number(currentItem.bidAmount || 0).toFixed(0)})`}
          </button>
        )}

        {/* Login Prompt */}
        {state === 'live' && !memberId && !memberEmail && (
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              <Link href="/login" className="text-purple-600 hover:underline">
                Log in
              </Link> to place bids
            </p>
          </div>
        )}

        {state === 'ended' && (
          <div className="w-full px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold text-center">
            Auction Ended
          </div>
        )}
      </div>

      <BidSuccessPopup
        isOpen={showBidSuccessPopup}
        onClose={() => { setShowBidSuccessPopup(false); setLastBidSuccessInfo(null); }}
        itemName={lastBidSuccessInfo?.itemName}
        bidAmount={lastBidSuccessInfo?.bidAmount}
      />
    </div>
  );
}
