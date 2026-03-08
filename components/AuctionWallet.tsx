'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RainbowButton from './RainbowButton';

interface MemberData {
  memberId: string;
  memberName: string;
  memberUsername: string;
  memberEmail: string;
  memberPhone?: string;
  memberPhonecode?: string;
  memberTag?: string;
  starBids: number;
  starBidsConsumed?: number;
  itemsWon?: number;
}

export default function AuctionWallet() {
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [displayTag, setDisplayTag] = useState<string | null>(null);

  function buildMemberFromLocalStorage(): MemberData | null {
    if (typeof window === 'undefined') return null;
    const memberName = localStorage.getItem('memberName');
    const memberEmail = localStorage.getItem('memberEmail');
    if (!memberName && !memberEmail) return null;
    const memberId = localStorage.getItem('memberId') || memberEmail || 'local';
    const memberTag = localStorage.getItem('memberTag') || undefined;
    const memberPhone = localStorage.getItem('memberPhone') || undefined;
    const memberPhonecode = localStorage.getItem('memberPhonecode') || undefined;
    const starBids = parseInt(localStorage.getItem('starBids') || '0', 10);
    const starBidsConsumed = parseInt(localStorage.getItem('starBidsConsumed') || '0', 10);
    const itemsWon = parseInt(localStorage.getItem('itemsWon') || '0', 10);
    return {
      memberId,
      memberName: memberName || memberEmail || '',
      memberUsername: 'Guest',
      memberEmail: memberEmail || '',
      memberPhone: memberPhone || undefined,
      memberPhonecode: memberPhonecode || undefined,
      memberTag: memberTag || undefined,
      starBids: isNaN(starBids) ? 0 : starBids,
      starBidsConsumed: isNaN(starBidsConsumed) ? 0 : starBidsConsumed,
      itemsWon: isNaN(itemsWon) ? 0 : itemsWon,
    };
  }

  function applyMember(m: any) {
    const docId = m._id;
    const id = docId || m.memberId;
    if (id) {
      localStorage.setItem('memberId', id);
      if (docId) localStorage.setItem('memberDocId', docId);
      if (m.memberName) localStorage.setItem('memberName', m.memberName);
      const tagStr = Array.isArray(m.memberTag) ? m.memberTag.join(', ') : String(m.memberTag || '');
      if (tagStr) localStorage.setItem('memberTag', tagStr);
      const sb = parseInt(String(m.starBids ?? m.StarBids ?? m.starbids ?? 0), 10);
      const sbc = parseInt(String(m.starBidsConsumed ?? m.StarBidsConsumed ?? 0), 10);
      const iw = parseInt(String(m.itemsWon ?? m.ItemsWon ?? 0), 10);
      localStorage.setItem('starBids', String(sb));
      localStorage.setItem('starBidsConsumed', String(sbc));
      localStorage.setItem('itemsWon', String(iw));
      window.dispatchEvent(new Event('memberLogin'));
    }
    const tagStr = Array.isArray(m.memberTag) ? m.memberTag.join(', ') : String(m.memberTag || '');
    setMember({
      memberId: m.memberId || m._id,
      memberName: String(m.memberName ?? ''),
      memberUsername: m.memberUsername || 'Guest',
      memberEmail: m.memberemail || m.memberEmail || '',
      memberPhone: m.memberPhone != null ? String(m.memberPhone) : undefined,
      memberPhonecode: m.memberPhonecode != null ? String(m.memberPhonecode) : undefined,
      memberTag: tagStr || undefined,
      starBids: parseInt(String(m.starBids ?? m.StarBids ?? m.starbids ?? 0)),
      starBidsConsumed: parseInt(String(m.starBidsConsumed ?? m.StarBidsConsumed ?? 0)),
      itemsWon: parseInt(String(m.itemsWon ?? m.ItemsWon ?? 0))
    });
    setLoading(false);
  }

  function checkSessionAndLoadWallet() {
    if (typeof window === 'undefined') return;
    const memberId = localStorage.getItem('memberId');
    const memberName = localStorage.getItem('memberName');
    const memberEmail = localStorage.getItem('memberEmail');
    const hasSession = !!(memberId || memberName || memberEmail);
    setIsLoggedIn(hasSession);
    setDisplayName(memberName || memberEmail || null);
    setDisplayTag(localStorage.getItem('memberTag'));

    if (memberId) {
      loadMemberData(memberId);
      return;
    }
    if ((memberEmail || memberName) && !memberId) {
      const email = memberEmail || '';
      if (!email) {
        setLoading(false);
        return;
      }
      // Show wallet immediately from localStorage (profile data we already have)
      const fromStorage = buildMemberFromLocalStorage();
      if (fromStorage) {
        setMember(fromStorage);
        setLoading(false);
      }
      // Try API in background to get fresh star counts; update if successful
      fetch(`/api/members/${encodeURIComponent(email)}?byEmail=true`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.member) {
            applyMember(data.member);
            return;
          }
          return fetch('/api/members/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberEmail: email, password: '' }),
          }).then((r) => r.json());
        })
        .then((loginData) => {
          if (loginData?.success && loginData?.member) {
            applyMember(loginData.member);
          }
        })
        .catch(() => {});
      return;
    }
    setLoading(false);
  }

  useEffect(() => {
    checkSessionAndLoadWallet();
    const t1 = setTimeout(checkSessionAndLoadWallet, 300);
    const t2 = setTimeout(checkSessionAndLoadWallet, 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Listen for login/logout events so wallet updates when user logs in elsewhere
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window === 'undefined') return;
      const memberId = localStorage.getItem('memberId');
      const memberName = localStorage.getItem('memberName');
      const memberEmail = localStorage.getItem('memberEmail');
      const hasSession = !!(memberId || memberName || memberEmail);
      setIsLoggedIn(hasSession);
      if (!hasSession) {
        setMember(null);
        return;
      }
      checkSessionAndLoadWallet();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('memberLogin', handleStorageChange);
    window.addEventListener('memberLogout', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('memberLogin', handleStorageChange);
      window.removeEventListener('memberLogout', handleStorageChange);
    };
  }, []);

  async function loadMemberData(memberId: string) {
    const isBackgroundRefresh = member !== null;
    if (isBackgroundRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    const isEmail = memberId.includes('@');
    const url = isEmail ? `/api/members/${encodeURIComponent(memberId)}?byEmail=true` : `/api/members/${memberId}`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.member) {
          applyMember(data.member);
          return;
        }
      }
      // API failed or no member — use localStorage if we have profile data
      const fromStorage = buildMemberFromLocalStorage();
      if (fromStorage) {
        setMember(fromStorage);
      }
    } catch (error) {
      const fromStorage = buildMemberFromLocalStorage();
      if (fromStorage) {
        setMember(fromStorage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Refresh member data every 10 seconds
  useEffect(() => {
    if (!isLoggedIn || !member) return;

    const interval = setInterval(() => {
      loadMemberData(member.memberId);
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoggedIn, member?.memberId]);

  // Listen for bid placement events to refresh wallet
  useEffect(() => {
    const handleBidPlaced = () => {
      if (member?.memberId) {
        loadMemberData(member.memberId);
      }
    };

    const handleStarBidsPurchased = () => {
      if (member?.memberId) {
        loadMemberData(member.memberId);
      }
    };

    window.addEventListener('bidPlaced', handleBidPlaced);
    window.addEventListener('starBidsPurchased', handleStarBidsPurchased);
    
    return () => {
      window.removeEventListener('bidPlaced', handleBidPlaced);
      window.removeEventListener('starBidsPurchased', handleStarBidsPurchased);
    };
  }, [member?.memberId]);

  if (!isLoggedIn) {
    return (
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 border border-purple-200/80 animate-fade-in bg-gradient-to-br from-violet-50 via-pink-50 to-orange-50">
        <div className="text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mb-4 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200/60 relative">
            <span className="text-2xl sm:text-3xl">👤</span>
            <span className="absolute -top-0.5 -right-0.5 text-lg">⭐</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold mb-2 font-serif bg-gradient-to-r from-purple-500 via-pink-400 to-orange-500 bg-clip-text text-transparent">
            Join the Auction
          </h3>
          <p className="text-gray-600 text-sm sm:text-base mb-6 max-w-[260px] mx-auto">
            Log in to start bidding on exclusive art creations
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/login" className="block w-full">
              <RainbowButton variant="primary" className="w-full py-3 text-base font-semibold">
                Log In
              </RainbowButton>
            </Link>
            <Link href="/signup" className="block w-full">
              <RainbowButton variant="secondary" className="w-full py-3 text-base font-semibold">
                Sign Up
              </RainbowButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !member) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (isLoggedIn && !member) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="text-center">
          {displayName && (
            <p className="text-sm font-semibold text-purple-700 mb-2">Logged in as {displayName}</p>
          )}
          <p className="text-gray-700 font-medium mb-3">Loading your wallet…</p>
          <button
            type="button"
            onClick={() => checkSessionAndLoadWallet()}
            className="text-purple-600 hover:text-purple-800 font-semibold text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  const fullPhone = [member.memberPhonecode, member.memberPhone].filter(Boolean).join(' ').trim() || undefined;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 shadow-lg relative">
      {refreshing && (
        <div className="absolute top-4 right-4 w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" aria-hidden />
      )}
      {/* Profile - same as Account Settings */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 pr-8">Profile</h3>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs text-gray-500">Name</dt>
            <dd className="font-medium text-gray-900">{member.memberName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900 truncate" title={member.memberEmail}>{member.memberEmail || '—'}</dd>
          </div>
          {(fullPhone || member.memberPhone) && (
            <div>
              <dt className="text-xs text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{fullPhone || member.memberPhone || '—'}</dd>
            </div>
          )}
          {member.memberTag && (
            <div>
              <dt className="text-xs text-gray-500">Member type</dt>
              <dd className="font-medium text-gray-900">{member.memberTag.replace(/,/g, ' - ')}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Star Bids - same as Account Settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Star Bids</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-lg p-3 border border-purple-200 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Available</p>
            <p className="text-xl font-bold text-purple-600">⭐ {member.starBids.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Bids placed</p>
            <p className="text-lg font-bold text-gray-900">{(member.starBidsConsumed ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Items won</p>
            <p className="text-lg font-bold text-gray-900">{(member.itemsWon ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <Link href="/star-bid-packs">
          <RainbowButton variant="primary" className="w-full">
            Get More Star Bids
          </RainbowButton>
        </Link>
      </div>
    </div>
  );
}
