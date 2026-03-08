'use client';

import { useState, useEffect } from 'react';
import { ArtAllBidsMade } from '@/lib/wix-types';

interface UserBidStats {
  totalBids: number;
  totalStars: number;
  totalValue: number;
  itemsBidOn: number;
  recentBids: ArtAllBidsMade[];
}

export default function AuctionUserStats() {
  const [stats, setStats] = useState<UserBidStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      if (typeof window !== 'undefined') {
        setMemberId(localStorage.getItem('memberId'));
      }
    };
    sync();
    window.addEventListener('memberLogin', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('memberLogin', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!memberId) return;

    loadUserStats();
    const interval = setInterval(loadUserStats, 10000);
    const handleBidPlaced = () => loadUserStats();
    window.addEventListener('bidPlaced', handleBidPlaced);
    return () => {
      clearInterval(interval);
      window.removeEventListener('bidPlaced', handleBidPlaced);
    };
  }, [memberId]);

  async function loadUserStats() {
    if (!memberId) return;
    const isBackgroundRefresh = stats !== null;
    if (isBackgroundRefresh) {
      setRefreshing(true);
    }

    try {
      const response = await fetch(`/api/members/${memberId}/bid-stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setRefreshing(false);
    }
  }

  if (!memberId) {
    return null;
  }

  const totalBids = stats?.totalBids ?? 0;
  const itemsBidOn = stats?.itemsBidOn ?? 0;
  const totalStars = stats?.totalStars ?? 0;
  const totalValue = stats?.totalValue ?? 0;
  const recentBids = stats?.recentBids ?? [];

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg relative">
      {/* Tiny loading spinner on the right - only when refreshing in background */}
      {refreshing && (
        <div className="absolute top-4 right-4 w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" aria-hidden />
      )}

      <h3 className="text-xl font-bold text-gray-900 mb-4 pr-8">Your Bidding Stats</h3>

      {/* Summary Cards - always visible, values update in place */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-gray-600 mb-1">Total Bids</p>
          <p className="text-2xl font-bold text-purple-600">
            {totalBids.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-gray-600 mb-1">Items Bid On</p>
          <p className="text-2xl font-bold text-purple-600">
            {itemsBidOn.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-gray-600 mb-1">Total Stars</p>
          <p className="text-2xl font-bold text-purple-600">
            ⭐{totalStars.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-gray-600 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-purple-600">
            €{Number(totalValue).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Recent Bids - section always visible, content updates in place */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Bids</h4>
        {recentBids.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentBids.slice(0, 5).map((bid) => (
              <div
                key={bid._id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {bid.itemName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(bid.bidDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm font-bold text-purple-600">
                    ⭐{Number(bid.bidAmount).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    €{Number(bid.bidPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-2">
            You haven&apos;t placed any bids yet. Start bidding to see your stats here!
          </p>
        )}
      </div>
    </div>
  );
}
