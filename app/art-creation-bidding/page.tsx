'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/translations';
import { ArtCreationBidding } from '@/lib/wix-types';
import RainbowButton from '@/components/RainbowButton';
import PaintDrips from '@/components/PaintDrips';
import AuctionItemCard from '@/components/AuctionItemCard';
import AuctionWallet from '@/components/AuctionWallet';
import AuctionUserStats from '@/components/AuctionUserStats';
import AuctionOrderHistory from '@/components/AuctionOrderHistory';

interface DateGroup {
  key: string;
  formattedDate: string;
  activeCount: number;
  comingSoonCount: number;
}

interface TagGroup {
  tag: string;
  activeCount: number;
  comingSoonCount: number;
}

// Helper: Format date with suffix (e.g., "28th Jan 2026")
function formatDateWithSuffix(date: Date): string {
  const day = date.getDate();
  const suffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}${suffix(day)} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Helper: Get date key for grouping (YYYY-M-D)
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// Helper: Get item state
function getItemState(item: ArtCreationBidding): 'launching-soon' | 'live' | 'ended' {
  const now = new Date();
  const visible = item.auctionItemVisibleDate ? new Date(item.auctionItemVisibleDate) : null;
  const launch = new Date(item.launchBidItemDate);
  const end = new Date(item.auctionItemEndDate);
  
  if (visible && now < visible) return 'launching-soon';
  if (visible && now >= visible && now < launch) return 'launching-soon';
  if (now >= launch && now < end) return 'live';
  return 'ended';
}

export default function ArtCreationBiddingPage() {
  const { t } = useTranslations();
  const [allItems, setAllItems] = useState<ArtCreationBidding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [auctionType, setAuctionType] = useState<'art' | 'vip' | 'raffles'>('art');

  useEffect(() => {
    let isFirstLoad = true;
    async function fetchAuctionItems() {
      try {
        if (isFirstLoad) setLoading(true);
        const response = await fetch('/api/auction-items?activeOnly=true');
        
        if (response.ok) {
          const data = await response.json();
          const items = data.items || [];
          // Don't replace a non-empty list with empty on refetch (avoids "0 of 0" from transient empty API)
          setAllItems((prev) => (items.length > 0 ? items : prev.length > 0 ? prev : items));
          setError(null);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || 'Failed to load auction items');
        }
      } catch (err: any) {
        console.error('Error fetching auction items:', err);
        setError(err.message || 'Failed to load auction items');
      } finally {
        if (isFirstLoad) setLoading(false);
        isFirstLoad = false;
      }
    }
    
    fetchAuctionItems();
    
    // Refresh every 15 seconds for live updates
    const interval = setInterval(fetchAuctionItems, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filter visible items (where visibleDate has passed)
  const visibleItems = useMemo(() => {
    const now = new Date();
    return allItems.filter(item => {
      const visible = item.auctionItemVisibleDate ? new Date(item.auctionItemVisibleDate) : null;
      return !visible || now >= visible;
    });
  }, [allItems]);

  // Group by date
  const dateGroups = useMemo(() => {
    const groups: Record<string, ArtCreationBidding[]> = {};
    const now = new Date();
    
    visibleItems.forEach(item => {
      const launch = new Date(item.launchBidItemDate);
      const key = getDateKey(launch);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    
    const dateGroupArray: DateGroup[] = Object.keys(groups).map(key => {
      const items = groups[key];
      let activeCount = 0;
      let comingSoonCount = 0;
      
      items.forEach(item => {
        const state = getItemState(item);
        if (state === 'live') activeCount++;
        else if (state === 'launching-soon') comingSoonCount++;
      });
      
      const date = new Date(key.replace(/-/g, '/'));
      return {
        key,
        formattedDate: formatDateWithSuffix(date),
        activeCount,
        comingSoonCount
      };
    });
    
    // Sort by date
    return dateGroupArray.sort((a, b) => a.key.localeCompare(b.key));
  }, [visibleItems]);

  // Group by tag
  const tagGroups = useMemo(() => {
    const groups: Record<string, ArtCreationBidding[]> = {};
    
    // Filter items by selected date first
    const itemsToScan = selectedDate 
      ? visibleItems.filter(item => getDateKey(new Date(item.launchBidItemDate)) === selectedDate)
      : visibleItems;
    
    itemsToScan.forEach(item => {
      const rawTag = item.tagItemType;
      let tag = '';
      
      if (Array.isArray(rawTag) && rawTag.length > 0) {
        tag = String(rawTag[0]).trim();
      } else if (typeof rawTag === 'string') {
        tag = rawTag.trim();
      }
      
      if (tag) {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(item);
      }
    });
    
    const tagGroupArray: TagGroup[] = Object.keys(groups).map(tag => {
      const items = groups[tag];
      let activeCount = 0;
      let comingSoonCount = 0;
      
      items.forEach(item => {
        const state = getItemState(item);
        if (state === 'live') activeCount++;
        else if (state === 'launching-soon') comingSoonCount++;
      });
      
      return {
        tag,
        activeCount,
        comingSoonCount
      };
    });
    
    return tagGroupArray.sort((a, b) => a.tag.localeCompare(b.tag));
  }, [visibleItems, selectedDate]);

  // Auto-select today's date if available; clear stale selection if it no longer matches any group
  useEffect(() => {
    if (dateGroups.length === 0) return;
    const currentKeyExists = selectedDate && dateGroups.some(d => d.key === selectedDate);
    if (selectedDate && !currentKeyExists) {
      // Stale: selectedDate no longer in dateGroups (e.g. after refetch with different date keys) → show all or first group
      setSelectedDate(dateGroups[0]?.key ?? null);
      return;
    }
    if (!selectedDate) {
      const todayKey = getDateKey(new Date());
      const todayExists = dateGroups.find(d => d.key === todayKey);
      if (todayExists) {
        setSelectedDate(todayKey);
      } else {
        const future = dateGroups.find(d => d.key >= todayKey);
        setSelectedDate(future?.key || dateGroups[0]?.key || null);
      }
    }
  }, [dateGroups, selectedDate]);

  // Filter items based on selected date and tag
  const filteredItems = useMemo(() => {
    let filtered = visibleItems;
    
    if (selectedDate) {
      filtered = filtered.filter(item => 
        getDateKey(new Date(item.launchBidItemDate)) === selectedDate
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(item => {
        const rawTag = item.tagItemType;
        let tag = '';
        if (Array.isArray(rawTag) && rawTag.length > 0) {
          tag = String(rawTag[0]).trim();
        } else if (typeof rawTag === 'string') {
          tag = rawTag.trim();
        }
        return tag === selectedTag;
      });
    }
    
    return filtered;
  }, [visibleItems, selectedDate, selectedTag]);

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎨</div>
          <p className="text-gray-500 text-lg">{t('auction.loadingItems')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link href="/art-auction">
            <RainbowButton variant="primary">Back to Art Auction</RainbowButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-16 md:py-20">
        <PaintDrips variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/art-auction" className="text-gray-600 hover:text-black transition-colors inline-flex items-center">
              ← {t('auction.backToAuction')}
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4">
              {t('auction.title')}
            </h1>
            <p className="text-xl md:text-2xl font-script text-gray-700 mb-2">
              {t('auction.subtitle')}
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('auction.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="relative py-8 bg-gray-50 border-y border-gray-200">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Date Filters */}
          {dateGroups.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Date</h3>
              <div className="flex flex-wrap gap-2">
                {dateGroups.map((dateGroup) => (
                  <button
                    key={dateGroup.key}
                    onClick={() => {
                      setSelectedDate(selectedDate === dateGroup.key ? null : dateGroup.key);
                      setSelectedTag(null); // Reset tag when date changes
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedDate === dateGroup.key
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {dateGroup.formattedDate}
                    {(dateGroup.activeCount > 0 || dateGroup.comingSoonCount > 0) && (
                      <span className="ml-2 text-xs opacity-90">
                        ({dateGroup.activeCount > 0 && `🔴 ${dateGroup.activeCount}`}
                        {dateGroup.activeCount > 0 && dateGroup.comingSoonCount > 0 && ' / '}
                        {dateGroup.comingSoonCount > 0 && `⏰ ${dateGroup.comingSoonCount}`})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tag Filters */}
          {tagGroups.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('auction.filterByType')}</h3>
              <div className="flex flex-wrap gap-2">
                {tagGroups.map((tagGroup) => (
                  <button
                    key={tagGroup.tag}
                    onClick={() => setSelectedTag(selectedTag === tagGroup.tag ? null : tagGroup.tag)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedTag === tagGroup.tag
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {tagGroup.tag}
                    {(tagGroup.activeCount > 0 || tagGroup.comingSoonCount > 0) && (
                      <span className="ml-2 text-xs opacity-90">
                        ({tagGroup.activeCount > 0 && `🔴 ${tagGroup.activeCount}`}
                        {tagGroup.activeCount > 0 && tagGroup.comingSoonCount > 0 && ' / '}
                        {tagGroup.comingSoonCount > 0 && `⏰ ${tagGroup.comingSoonCount}`})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Auction Items Grid */}
      <section className="relative py-20 md:py-28 bg-white overflow-hidden">
        <PaintDrips variant="featured" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sidebar with Wallet and Stats */}
          <div className="lg:grid lg:grid-cols-4 lg:gap-8 mb-8">
            <div className="lg:col-span-1 space-y-6 mb-8 lg:mb-0">
              <AuctionWallet />
              <AuctionUserStats />
              <AuctionOrderHistory />
            </div>
            
            <div className="lg:col-span-3">
          {/* Auction type tabs */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setAuctionType('art')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                auctionType === 'art'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Art Auction
            </button>
            <button
              type="button"
              onClick={() => setAuctionType('vip')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                auctionType === 'vip'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              VIP Auction
            </button>
            <button
              type="button"
              onClick={() => setAuctionType('raffles')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                auctionType === 'raffles'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Raffles
            </button>
          </div>

          {/* Stats - only show for Art Auction */}
          {auctionType === 'art' && (
          <div className="mb-8 text-center">
            <p className="text-gray-600">
              {t('auction.showingItems')} <span className="font-bold text-gray-900">{filteredItems.length}</span> {t('auction.of')}{' '}
              <span className="font-bold text-gray-900">{visibleItems.length}</span> {t('auction.items')}
              {selectedDate && ` • ${dateGroups.find(d => d.key === selectedDate)?.formattedDate ?? selectedDate}`}
              {selectedTag && ` • ${selectedTag}`}
            </p>
          </div>
          )}

          {auctionType === 'vip' && (
            <div className="text-center py-16 mb-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200">
              <div className="text-5xl mb-4">👑</div>
              <p className="text-xl font-semibold text-gray-800 mb-2">VIP Auction</p>
              <p className="text-gray-600">Coming soon. Exclusive items for VIP members.</p>
            </div>
          )}

          {auctionType === 'raffles' && (
            <div className="text-center py-16 mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200">
              <div className="text-5xl mb-4">🎟️</div>
              <p className="text-xl font-semibold text-gray-800 mb-2">Raffles</p>
              <p className="text-gray-600">Coming soon. Enter raffles for a chance to win.</p>
            </div>
          )}

          {auctionType === 'art' && filteredItems.length === 0 && visibleItems.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-gray-700">{t('auction.noMatchFilter')}</p>
              <button
                type="button"
                onClick={() => { setSelectedDate(null); setSelectedTag(null); }}
                className="mt-2 px-4 py-2 bg-amber-200 text-amber-900 rounded-lg hover:bg-amber-300 font-medium"
              >
                {t('auction.showAll')}
              </button>
            </div>
          )}

          {auctionType === 'art' && (filteredItems.length === 0 ? (
            visibleItems.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">🎨</div>
                <p className="text-gray-500 text-lg mb-4">No auction items available at this time.</p>
                <p className="text-gray-600 mb-8">
                  Check back soon for new art creations!
                </p>
                <Link href="/art-auction">
                  <RainbowButton variant="primary">
                    Back to Art Auction
                  </RainbowButton>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {visibleItems.map((item) => (
                    <AuctionItemCard
                      key={item._id}
                      item={item}
                    />
                  ))}
                </div>
                <div className="text-center mt-12">
                  <Link href="/art-auction">
                    <RainbowButton variant="secondary">
                      {t('auction.backToAuction')}
                    </RainbowButton>
                  </Link>
                </div>
              </>
            )
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map((item) => (
                  <AuctionItemCard
                    key={item._id}
                    item={item}
                  />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link href="/art-auction">
                  <RainbowButton variant="secondary">
                    {t('auction.backToAuction')}
                  </RainbowButton>
                </Link>
              </div>
            </>
          )) }
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
