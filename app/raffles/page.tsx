'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import RainbowButton from '@/components/RainbowButton';
import { useTranslations } from '@/lib/translations';
import GetStarsTooltip from '@/components/GetStarsTooltip';
import PaintDrips from '@/components/PaintDrips';
import WixImage from '@/components/WixImage';
import TicketPickerPopup from '@/components/TicketPickerPopup';
import { useAuth } from '@/components/AuthProvider';

interface Raffle {
  _id: string;
  name: string;
  subtitle?: string;
  isActive: boolean;
  visibilityDate: string;
  startDate: string;
  endDate: string;
  ticketLimit: number;
  ticketCostStars: number;
  ticketLimitPerUser?: number;
  valueOfPot?: number;
  hatIds?: string[];
}

function getCountdownParts(target: Date): { days: number; hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  return { days, hours, minutes, seconds };
}

interface Hat {
  _id: string;
  title: string;
  mainHatImage?: string;
  price?: number;
  discountedPrice?: number;
}

type RaffleState = 'launching-soon' | 'live' | 'ended';

function getRaffleState(r: Raffle): RaffleState {
  const now = new Date();
  const vis = new Date(r.visibilityDate);
  const start = new Date(r.startDate);
  const end = new Date(r.endDate);
  if (now < vis) return 'launching-soon';
  if (now < start) return 'launching-soon';
  if (now > end) return 'ended';
  return 'live';
}

const THREE_MIN_MS = 3 * 60 * 1000;

function formatCountdown(target: Date): string {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return '0m 0s';
  const d = Math.floor(diff / (24 * 60 * 60 * 1000));
  const h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((diff % (60 * 1000)) / 1000);
  if (diff <= THREE_MIN_MS) {
    return `${m}m ${s}s`;
  }
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

export default function RafflesPage() {
  const { t } = useTranslations();
  const { member, refetch } = useAuth();
  const [accountName, setAccountName] = useState<string | null>(null);
  const [starBids, setStarBids] = useState<number>(0);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [hats, setHats] = useState<Hat[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [enteringRaffleId, setEnteringRaffleId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewingRaffle, setViewingRaffle] = useState<Raffle | null>(null);
  const [countdownTick, setCountdownTick] = useState(0);
  const [layoutView, setLayoutView] = useState<'single' | 'grid'>('single');
  const [raffleStats, setRaffleStats] = useState<Record<string, { ticketsSold: number; uniqueHolders: number }>>({});
  const [myTickets, setMyTickets] = useState<Record<string, number[]>>({});
  const [rouletteTickets, setRouletteTickets] = useState<Record<string, { number: number; initials: string; displayName?: string }[]>>({});
  const [fireworksRaffleId, setFireworksRaffleId] = useState<string | null>(null);
  const [raffleWinner, setRaffleWinner] = useState<Record<string, { number: number; initials: string; displayName?: string }>>({});
  const [showWinnerRaffleId, setShowWinnerRaffleId] = useState<string | null>(null);
  const [bigViewTicketQty, setBigViewTicketQty] = useState<Record<string, number>>({});
  const [claimedRaffleIds, setClaimedRaffleIds] = useState<Set<string>>(new Set());
  const [ticketPickerRaffle, setTicketPickerRaffle] = useState<Raffle | null>(null);
  const [claimingRaffleId, setClaimingRaffleId] = useState<string | null>(null);
  const firedFireworksRef = useRef<Set<string>>(new Set());
  const winnerPickedRef = useRef<Set<string>>(new Set());

  const visibleRaffles = useMemo(() => {
    const now = new Date();
    return raffles.filter((r) => {
      if (!r.isActive) return false;
      const vis = new Date(r.visibilityDate);
      return !Number.isNaN(vis.getTime()) && now >= vis;
    });
  }, [raffles]);

  useEffect(() => {
    if (visibleRaffles.length === 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [visibleRaffles]);

  useEffect(() => {
    const now = Date.now();
    visibleRaffles.forEach((r) => {
      const state = getRaffleState(r);
      if (state !== 'live') return;
      const end = new Date(r.endDate).getTime();
      const secondsLeft = Math.floor((end - now) / 1000);
      if (secondsLeft <= 60 && secondsLeft > 0 && !firedFireworksRef.current.has(r._id)) {
        firedFireworksRef.current.add(r._id);
        setFireworksRaffleId(r._id);
        setTimeout(() => setFireworksRaffleId(null), 4000);
      }
      if (secondsLeft <= 0 && !winnerPickedRef.current.has(r._id)) {
        winnerPickedRef.current.add(r._id);
        setShowWinnerRaffleId(r._id);
        setFireworksRaffleId(r._id);
        setTimeout(() => setFireworksRaffleId(null), 3000);
        setTimeout(() => setShowWinnerRaffleId(null), 8000);
      }
    });
  }, [visibleRaffles, tick]);

  useEffect(() => {
    if (!viewingRaffle) return;
    const state = getRaffleState(viewingRaffle);
    if (state !== 'live') return;
    const interval = setInterval(() => setCountdownTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [viewingRaffle]);

  useEffect(() => {
    if (member) {
      setAccountName(member.memberName || member.memberEmail || 'Member');
      setStarBids(member.starBids ?? 0);
    } else if (typeof window !== 'undefined') {
      setAccountName(localStorage.getItem('memberName') || localStorage.getItem('memberEmail') || 'Guest');
      const sb = parseInt(localStorage.getItem('starBids') || '0', 10);
      setStarBids(isNaN(sb) ? 0 : sb);
    }
  }, [member]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onMemberLogin = () => {
      if (member) {
        setStarBids(member.starBids ?? 0);
      } else {
        const sb = parseInt(localStorage.getItem('starBids') || '0', 10);
        setStarBids(isNaN(sb) ? 0 : sb);
      }
    };
    window.addEventListener('memberLogin', onMemberLogin);
    return () => window.removeEventListener('memberLogin', onMemberLogin);
  }, [member]);

  useEffect(() => {
    if (layoutView !== 'single' || visibleRaffles.length === 0) return;
    visibleRaffles.forEach(async (r) => {
      try {
        const res = await fetch(`/api/raffles/${r._id}/stats`);
        const data = await res.json();
        if (data.success) {
          setRaffleStats((prev) => ({ ...prev, [r._id]: { ticketsSold: data.ticketsSold, uniqueHolders: data.uniqueHolders } }));
        }
      } catch {
        // ignore
      }
    });
  }, [layoutView, visibleRaffles]);

  useEffect(() => {
    const hasSupabaseAuth = !!member;
    const email = typeof window !== 'undefined' ? localStorage.getItem('memberEmail') : null;
    const memberId = typeof window !== 'undefined' ? localStorage.getItem('memberId') : null;
    const memberDocId = typeof window !== 'undefined' ? localStorage.getItem('memberDocId') : null;
    const hasWixAuth = !!(email || (memberDocId || (memberId && memberId !== 'local')));
    if ((!hasSupabaseAuth && !hasWixAuth) || visibleRaffles.length === 0) return;
    visibleRaffles.forEach(async (r) => {
      try {
        const params = new URLSearchParams();
        if (!hasSupabaseAuth && email) params.set('memberEmail', email);
        if (!hasSupabaseAuth) {
          const id = memberDocId || (memberId && memberId !== 'local' ? memberId : null);
          if (id) params.set('memberId', id);
        }
        const res = await fetch(`/api/raffles/${r._id}/my-tickets?${params}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && Array.isArray(data.ticketNumbers)) {
          setMyTickets((prev) => ({ ...prev, [r._id]: data.ticketNumbers }));
        }
      } catch {
        // ignore
      }
    });
  }, [visibleRaffles, member]);

  useEffect(() => {
    if (visibleRaffles.length === 0) return;
    const check = () => {
      const now = Date.now();
      visibleRaffles.forEach(async (r) => {
        const state = getRaffleState(r);
        if (state !== 'live') return;
        const end = new Date(r.endDate).getTime();
        const secondsLeft = Math.floor((end - now) / 1000);
        if (secondsLeft <= 65 && secondsLeft > 0) {
          try {
            const res = await fetch(`/api/raffles/${r._id}/roulette`);
            const data = await res.json();
            if (data.success && Array.isArray(data.tickets)) {
              setRouletteTickets((prev) => ({ ...prev, [r._id]: data.tickets }));
              if (secondsLeft <= 60 && data.tickets.length > 0 && !winnerPickedRef.current.has(`winner-${r._id}`)) {
                winnerPickedRef.current.add(`winner-${r._id}`);
                const wRes = await fetch(`/api/raffles/${r._id}/winner`);
                const wData = await wRes.json();
                if (wRes.ok && wData.success && wData.winner) {
                  setRaffleWinner((w) => ({ ...w, [r._id]: wData.winner }));
                } else {
                  const winner = data.tickets[Math.floor(Math.random() * data.tickets.length)]!;
                  setRaffleWinner((w) => ({ ...w, [r._id]: winner }));
                }
              }
            }
          } catch {
            // ignore
          }
        }
      });
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [visibleRaffles]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [rafflesRes, hatsRes] = await Promise.all([
          fetch('/api/raffles'),
          fetch('/api/hats'),
        ]);
        const rafflesData = await rafflesRes.json();
        const hatsData = await hatsRes.json();
        if (rafflesRes.ok && rafflesData.success && Array.isArray(rafflesData.raffles)) {
          setRaffles(rafflesData.raffles);
          const ended = rafflesData.raffles.filter((r: Raffle) => new Date(r.endDate).getTime() < Date.now());
          const winnerResults = await Promise.all(
            ended.map(async (r: Raffle) => {
              try {
                const wRes = await fetch(`/api/raffles/${r._id}/winner`);
                const wData = await wRes.json();
                return wRes.ok && wData.success && wData.winner ? { id: r._id, winner: wData.winner } : null;
              } catch {
                return null;
              }
            })
          );
          const winners: Record<string, { number: number; initials: string; displayName?: string }> = {};
          winnerResults.forEach((r) => { if (r) winners[r.id] = r.winner; });
          if (Object.keys(winners).length > 0) setRaffleWinner((prev) => ({ ...prev, ...winners }));
          const email = typeof window !== 'undefined' ? localStorage.getItem('memberEmail') : null;
          const mid = typeof window !== 'undefined' ? localStorage.getItem('memberDocId') || (localStorage.getItem('memberId') !== 'local' ? localStorage.getItem('memberId') : null) : null;
          const hasAuth = !!member || email || mid;
          if (hasAuth) {
            const qs = member ? '' : (email ? `memberEmail=${encodeURIComponent(email)}` : `memberId=${encodeURIComponent(mid || '')}`);
            const claimRes = await fetch(`/api/claimed-prizes${qs ? `?${qs}` : ''}`, { credentials: 'include' });
            const claimData = await claimRes.json();
            if (claimRes.ok && claimData.success && Array.isArray(claimData.prizes)) {
              setClaimedRaffleIds(new Set(claimData.prizes.map((p: { raffleId: string }) => p.raffleId)));
            }
          }
        }
        if (hatsRes.ok && hatsData.success && Array.isArray(hatsData.hats)) {
          setHats(hatsData.hats);
        }
      } catch (err) {
        console.error('Error fetching raffles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [member]);

  const handleEnterRaffle = async (raffle: Raffle, ticketCount = 1, ticketNumbers?: number[]): Promise<boolean> => {
    const isSupabaseRaffle = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raffle._id);
    const email = typeof window !== 'undefined' ? localStorage.getItem('memberEmail') : null;
    const memberId = typeof window !== 'undefined' ? localStorage.getItem('memberId') : null;
    const memberDocId = typeof window !== 'undefined' ? localStorage.getItem('memberDocId') : null;
    if (isSupabaseRaffle && !member) {
      alert('Please log in to enter a raffle.');
      return false;
    }
    if (!isSupabaseRaffle && !email && !memberId && !memberDocId) {
      alert('Please log in to enter a raffle.');
      return false;
    }
    const maxPerUser = raffle.ticketLimitPerUser || raffle.ticketLimit || 999;
    const qty = ticketNumbers?.length ?? Math.max(1, Math.min(ticketCount, maxPerUser));
    setEnteringRaffleId(raffle._id);
    try {
      const body: Record<string, unknown> = { ticketCount: qty };
      if (ticketNumbers && ticketNumbers.length > 0) {
        body.ticketNumbers = ticketNumbers;
      }
      if (!isSupabaseRaffle) {
        body.memberEmail = email || undefined;
        body.memberId = memberId !== 'local' ? memberId : undefined;
        body.memberDocId = memberDocId || undefined;
      }
      const res = await fetch(`/api/raffles/${raffle._id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to enter raffle');
      }
      const totalCost = raffle.ticketCostStars * qty;
      const newBalance = data.newStarBids ?? starBids - totalCost;
      if (member) {
        refetch();
        window.dispatchEvent(new Event('memberLogin'));
      } else if (typeof window !== 'undefined') {
        localStorage.setItem('starBids', String(newBalance));
        const consumed = parseInt(localStorage.getItem('starBidsConsumed') || '0', 10) + totalCost;
        localStorage.setItem('starBidsConsumed', String(consumed));
        window.dispatchEvent(new Event('memberLogin'));
      }
      setStarBids(newBalance);
      setSuccessMessage(data.message || `You entered ${raffle.name} with ${qty} ticket${qty > 1 ? 's' : ''}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      const params = new URLSearchParams();
      if (!isSupabaseRaffle) {
        const mid = memberDocId || (memberId !== 'local' ? memberId : null);
        if (email) params.set('memberEmail', email);
        if (mid) params.set('memberId', mid);
      }
      try {
        const tRes = await fetch(`/api/raffles/${raffle._id}/my-tickets?${params}`, { credentials: 'include' });
        const tData = await tRes.json();
        if (tData.success && Array.isArray(tData.ticketNumbers)) {
          setMyTickets((prev) => ({ ...prev, [raffle._id]: tData.ticketNumbers }));
        }
      } catch {
        // ignore
      }
      return true;
    } catch (err: any) {
      alert(err.message || 'Failed to enter raffle');
      return false;
    } finally {
      setEnteringRaffleId(null);
    }
    return false;
  };

  const handleClaimPrize = async (raffleId: string) => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('memberEmail') : null;
    const memberId = typeof window !== 'undefined' ? localStorage.getItem('memberDocId') || (localStorage.getItem('memberId') !== 'local' ? localStorage.getItem('memberId') : null) : null;
    const hasAuth = !!member || email || memberId;
    if (!hasAuth) {
      alert('Please log in to claim your prize.');
      return;
    }
    setClaimingRaffleId(raffleId);
    try {
      const body = member ? {} : { memberEmail: email || undefined, memberId: memberId || undefined };
      const res = await fetch(`/api/raffles/${raffleId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaimedRaffleIds((prev) => new Set([...prev, raffleId]));
        setSuccessMessage(data.alreadyClaimed ? 'Prize was already claimed.' : 'Prize claimed! View it in Claimed Prizes.');
        setTimeout(() => setSuccessMessage(null), 4000);
        if (!data.alreadyClaimed && typeof window !== 'undefined') {
          window.location.href = '/member/claimed-prizes';
        }
      } else {
        alert(data.error || 'Failed to claim prize');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to claim prize');
    } finally {
      setClaimingRaffleId(null);
    }
  };

  const hatsById = useMemo(() => {
    const map: Record<string, Hat> = {};
    hats.forEach((h) => { map[h._id] = h; });
    return map;
  }, [hats]);

  return (
    <div className="min-h-screen">
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl shadow-lg animate-fadeIn">
          {successMessage}
        </div>
      )}

      {/* Ticket Picker Popup */}
      {ticketPickerRaffle && (
        <TicketPickerPopup
          raffle={ticketPickerRaffle}
          isOpen={!!ticketPickerRaffle}
          onClose={() => setTicketPickerRaffle(null)}
          onPurchase={async (count, numbers) => {
            try {
              await handleEnterRaffle(ticketPickerRaffle, count, numbers);
              setTicketPickerRaffle(null);
            } catch {
              // handleEnterRaffle shows alert on error
            }
          }}
          starBids={starBids}
          enteringRaffleId={enteringRaffleId}
          t={t}
        />
      )}

      {/* View Live Raffle Modal */}
      {viewingRaffle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{viewingRaffle.name}</h2>
                <button
                  onClick={() => setViewingRaffle(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {viewingRaffle.subtitle && (
                <p className="text-gray-600 mb-6">{viewingRaffle.subtitle}</p>
              )}

              {/* Countdown - Days, Hours, Minutes, Seconds */}
              {(() => {
                const end = new Date(viewingRaffle.endDate);
                const parts = getCountdownParts(end);
                const countdownLabels = [t('raffle.days'), t('raffle.hours'), t('raffle.minutes'), t('raffle.seconds')];
                const values = [parts.days, parts.hours, parts.minutes, parts.seconds];
                return (
                  <div className="grid grid-cols-4 gap-3 mb-8">
                    {countdownLabels.map((label, i) => (
                      <div
                        key={label}
                        className="rounded-xl p-[2px] text-center"
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 25%, #22c55e 50%, #eab308 75%, #f97316 100%)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        }}
                      >
                        <div className="rounded-[10px] bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 py-4 px-3 border border-white/80 shadow-inner">
                          <div className="text-2xl sm:text-3xl font-bold text-gray-800 tabular-nums">{values[i]}</div>
                          <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mt-1">{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">{t('raffle.ticketCost')}</span>
                  <span className="font-semibold text-gray-900">{viewingRaffle.ticketCostStars} {t('raffle.stars')}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">{t('raffle.potValueLabel')}</span>
                  <span className="font-semibold text-gray-900">{viewingRaffle.valueOfPot != null ? `€${viewingRaffle.valueOfPot}` : '—'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">{t('raffle.ticketsPerRaffle')}</span>
                  <span className="font-semibold text-gray-900">{viewingRaffle.ticketLimit}</span>
                </div>
                {viewingRaffle.ticketLimitPerUser != null && viewingRaffle.ticketLimitPerUser > 0 && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Max tickets per user</span>
                    <span className="font-semibold text-gray-900">{viewingRaffle.ticketLimitPerUser}</span>
                  </div>
                )}
                <div className="flex justify-between py-3">
                  <span className="text-gray-600">{t('raffle.ends')}</span>
                  <span className="font-semibold text-gray-900">{new Date(viewingRaffle.endDate).toLocaleString()}</span>
                </div>
              </div>

              {(() => {
                const raffleHats = (viewingRaffle.hatIds || []).map((id) => hatsById[id]).filter(Boolean);
                return raffleHats.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('raffle.hatsInThisRaffle')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {raffleHats.map((h) => (
                        <div key={h._id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                          {h.mainHatImage ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                              <WixImage src={h.mainHatImage} alt={h.title} fill className="object-cover" />
                            </div>
                          ) : null}
                          <span className="text-sm font-medium text-gray-800">{h.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {(myTickets[viewingRaffle._id]?.length ?? 0) > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('raffle.yourTicketNumbers')}</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {myTickets[viewingRaffle._id].map((num) => (
                      <div key={num} className="ticket-card-outer">
                        <div className="ticket-card-inner">
                          <span className="ticket-num tabular-nums">{num}</span>
                          <span className="ticket-label">{t('raffle.ticket')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleEnterRaffle(viewingRaffle)}
                disabled={starBids < viewingRaffle.ticketCostStars || enteringRaffleId === viewingRaffle._id}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {enteringRaffleId === viewingRaffle._id ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    {t('raffle.entering')}
                  </>
                ) : (
                  `${t('raffle.enterRaffle')} (${viewingRaffle.ticketCostStars} ${t('raffle.stars')})`
                )}
              </button>
              <button
                onClick={() => { setViewingRaffle(null); setTicketPickerRaffle(viewingRaffle); }}
                className="w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('raffle.pickYourTickets') || 'Pick your ticket numbers'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-16 md:py-20">
        <PaintDrips variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/art-auction" className="text-gray-600 hover:text-black transition-colors inline-flex items-center">
              {t('raffle.backToArtAuction')}
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4">
              {t('raffle.raffles')}
            </h1>
            <p className="text-xl md:text-2xl font-script text-gray-700 mb-2">
              {t('raffle.enterToWin')}
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('raffle.useStarBidsToEnter')}
            </p>
          </div>
        </div>
      </section>

      {/* Account & Star Bids Bar */}
      <section className="relative py-6 bg-gray-50 border-y border-gray-200">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{t('raffle.account')}:</span>
              <span className="font-semibold text-gray-900">{accountName ?? 'Guest'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">{t('raffle.availableStarBids')}:</span>
              <span className="font-bold text-purple-600 text-xl">{starBids.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Raffle Cards */}
      <section className="relative py-20 md:py-28 bg-white overflow-hidden">
        <PaintDrips variant="featured" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold text-center flex-1">{t('raffle.activeRaffles')}</h2>
            <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
              <button
                onClick={() => setLayoutView('single')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  layoutView === 'single'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="One raffle per row"
              >
                {t('raffle.singleRow')}
              </button>
              <button
                onClick={() => setLayoutView('grid')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  layoutView === 'grid'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Multiple per row"
              >
                {t('raffle.gridView')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6 animate-pulse">
                  <div className="aspect-video bg-gray-200 rounded-xl mb-4" />
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="h-10 bg-gray-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : visibleRaffles.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200">
              <div className="text-5xl mb-4">🎟️</div>
              <p className="text-xl text-gray-700 mb-2">{t('raffle.noRafflesAvailable')}</p>
              <p className="text-gray-600">{t('raffle.checkBackSoon')}</p>
            </div>
          ) : layoutView === 'single' ? (
            <div className="space-y-8">
              {visibleRaffles.map((raffle, index) => {
                const state = getRaffleState(raffle);
                const raffleHats = (raffle.hatIds || [])
                  .map((id) => hatsById[id])
                  .filter(Boolean);
                const firstHat = raffleHats[0];
                const countdownTarget =
                  state === 'launching-soon'
                    ? new Date(raffle.startDate)
                    : state === 'live'
                    ? new Date(raffle.endDate)
                    : null;
                const isLeft = index % 2 === 0;

                const card = (
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-emerald-200 hover:border-emerald-400 transition-all">
                    <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                      {firstHat?.mainHatImage ? (
                        <WixImage src={firstHat.mainHatImage} alt={firstHat.title || raffle.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🎟️</div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${state === 'live' ? 'bg-green-500 text-white' : state === 'launching-soon' ? 'bg-amber-500 text-white' : 'bg-gray-500 text-white'}`}>
                          {state === 'live' ? t('raffle.live') : state === 'launching-soon' ? t('raffle.comingSoon') : t('raffle.ended')}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{raffle.name}</h3>
                      {raffle.subtitle && <p className="text-sm text-gray-600 mb-3">{raffle.subtitle}</p>}
                      {countdownTarget && (
                        state === 'launching-soon' ? (
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            {t('raffle.startsIn')}: <span className="text-emerald-600">{formatCountdown(countdownTarget)}</span>
                          </p>
                        ) : (
                          <div className="grid grid-cols-4 gap-1.5 mb-3">
                            {(() => {
                              const parts = getCountdownParts(countdownTarget);
                              const countdownLabels = [t('raffle.days'), t('raffle.hours'), t('raffle.minutes'), t('raffle.seconds')];
                              const values = [parts.days, parts.hours, parts.minutes, parts.seconds];
                              return countdownLabels.map((label, i) => (
                                <div
                                  key={label}
                                  className="rounded-lg p-[1.5px] text-center"
                                  style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 25%, #22c55e 50%, #eab308 75%, #f97316 100%)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  }}
                                >
                                  <div className="rounded-[6px] bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 py-2 px-1 border border-white/80">
                                    <div className="text-base font-bold text-gray-800 tabular-nums">{values[i]}</div>
                                    <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">{label}</div>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )
                      )}
                      <p className="text-sm text-gray-500 mb-3">
                        {raffle.ticketCostStars} {t('raffle.starsPerTicket')} • {raffle.ticketLimit} {t('raffle.ticketsMax')}
                        {(raffle.ticketLimitPerUser ?? 0) > 0 && <span className="block mt-0.5 text-gray-600">{t('raffle.maxPerUser')} {raffle.ticketLimitPerUser} {t('raffle.perUser')}</span>}
                        {(raffle.valueOfPot ?? 0) > 0 && <span className="block mt-1 font-semibold text-emerald-600">{t('raffle.potValuePrefix')}: €{(raffle.valueOfPot ?? 0).toLocaleString()}</span>}
                      </p>
                      {(myTickets[raffle._id]?.length ?? 0) > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Your tickets</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {myTickets[raffle._id].map((num) => (
                              <div key={num} className="ticket-card-outer ticket-card-sm">
                                <div className="ticket-card-inner">
                                  <span className="ticket-num tabular-nums">{num}</span>
                                  <span className="ticket-label">{t('raffle.ticket')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {raffleHats.length > 0 && (
                        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                          {raffleHats.slice(0, 4).map((h) => (
                            <div key={h._id} className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                              {h.mainHatImage ? <WixImage src={h.mainHatImage} alt={h.title} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🎩</div>}
                            </div>
                          ))}
                          {raffleHats.length > 4 && <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold">+{raffleHats.length - 4}</div>}
                        </div>
                      )}
                      {state === 'live' && (
                        <div className="space-y-2">
                          <button onClick={() => setViewingRaffle(raffle)} className="w-full py-2.5 bg-gray-100 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition-all border border-gray-300">{t('raffle.viewLiveRaffle')}</button>
                          <GetStarsTooltip showTooltip={starBids < raffle.ticketCostStars && enteringRaffleId !== raffle._id} requiredStars={raffle.ticketCostStars} currentStars={starBids}>
                            <button onClick={() => handleEnterRaffle(raffle)} disabled={starBids < raffle.ticketCostStars || enteringRaffleId === raffle._id} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                              {enteringRaffleId === raffle._id ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />{t('raffle.entering')}</> : `${t('raffle.enterRaffle')} (${raffle.ticketCostStars} ${t('raffle.stars')})`}
                            </button>
                          </GetStarsTooltip>
                        </div>
                      )}
                      {state === 'launching-soon' && <div className="w-full py-3 bg-gray-200 text-gray-600 font-medium rounded-xl text-center">{t('raffle.ticketsAvailableSoon')}</div>}
                      {state === 'ended' && <div className="w-full py-3 bg-gray-200 text-gray-500 font-medium rounded-xl text-center">{t('raffle.raffleEnded')}</div>}
                    </div>
                  </div>
                );

                const stats = raffleStats[raffle._id];
                const endMs = state === 'live' ? new Date(raffle.endDate).getTime() : 0;
                const secondsLeft = state === 'live' ? Math.max(0, Math.floor((endMs - Date.now()) / 1000)) : 999;
                const showRoulette = state === 'live' && secondsLeft <= 65 && secondsLeft > 0;
                const showWinner = state === 'ended' && raffleWinner[raffle._id];
                const progressWidth = secondsLeft <= 65 && secondsLeft >= 60 ? ((secondsLeft - 60) / 5) * 100 : secondsLeft < 60 ? 0 : 100;
                const tickets = rouletteTickets[raffle._id] || [];
                const winner = raffleWinner[raffle._id];
                const winnerIndex = winner ? tickets.findIndex((t) => t.number === winner.number && t.initials === winner.initials) : -1;
                const rouletteEndDeg = tickets.length > 0 && winnerIndex >= 0
                  ? 360 * 8 - (winnerIndex / tickets.length) * 360
                  : 2160;

                const bigView = (
                  <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 p-6 min-h-[280px] flex flex-col relative overflow-hidden">
                    {fireworksRaffleId === raffle._id && (
                      <div className="absolute inset-0 pointer-events-none z-10">
                        {[...Array(16)].map((_, i) => {
                          const angle = (i / 16) * Math.PI * 2;
                          const tx = Math.cos(angle) * 100;
                          const ty = Math.sin(angle) * 100;
                          const colors = ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308', '#f97316'];
                          return (
                            <div
                              key={i}
                              className="firework-particle"
                              style={{
                                background: colors[i % colors.length],
                                ['--tx' as string]: `${tx}px`,
                                ['--ty' as string]: `${ty}px`,
                                animationDelay: `${i * 0.03}s`,
                              } as React.CSSProperties}
                            />
                          );
                        })}
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{raffle.name}</h3>
                    {raffle.subtitle && <p className="text-sm text-gray-600 mb-4">{raffle.subtitle}</p>}
                    {!showRoulette && !showWinner && (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 flex-1">
                          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-emerald-200 shadow-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">🎟️</span>
                              <span className="text-xs font-semibold text-gray-500 uppercase">{t('raffle.tickets')}</span>
                            </div>
                            <div className="text-2xl font-bold text-emerald-700 tabular-nums">{stats?.ticketsSold ?? '—'}</div>
                          </div>
                          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-teal-200 shadow-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">👥</span>
                              <span className="text-xs font-semibold text-gray-500 uppercase">{t('raffle.holders')}</span>
                            </div>
                            <div className="text-2xl font-bold text-teal-700 tabular-nums">{stats?.uniqueHolders ?? '—'}</div>
                          </div>
                          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-amber-300 shadow-lg col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">📋</span>
                              <span className="text-xs font-semibold text-gray-500 uppercase">{t('raffle.maxLimit')}</span>
                            </div>
                            <div className="text-2xl font-bold text-amber-700 tabular-nums">{raffle.ticketLimit ?? 100}</div>
                            <span className="text-[10px] text-gray-500">{t('raffle.ticketsMax')}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-3 mb-4">
                          <div className="remaining-tickets-card relative">
                            <div className="remaining-tickets-blobs">
                              <div className="remaining-blob remaining-blob-1" />
                              <div className="remaining-blob remaining-blob-2" />
                              <div className="remaining-blob remaining-blob-3" />
                            </div>
                            <div className="remaining-tickets-inner">
                              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Remaining Available</p>
                              <p className="text-2xl sm:text-3xl font-bold text-gray-800 tabular-nums">
                                {Math.max(0, (raffle.ticketLimit ?? 100) - (stats?.ticketsSold ?? 0))}
                              </p>
                              <span className="text-xs text-gray-600">{t('raffle.ticketsLeft')}</span>
                            </div>
                          </div>
                          {state === 'live' && (
                            <button
                              onClick={() => setTicketPickerRaffle(raffle)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all hover:scale-105"
                              title="Pick ticket numbers"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {t('raffle.pickYourTickets') || 'Pick ticket numbers'}
                            </button>
                          )}
                        </div>
                        <div className="text-center mb-4">
                          <p className="text-base sm:text-lg font-semibold text-gray-700">
                            {raffle.ticketCostStars} {t('raffle.starsPerTicket')} • {raffle.ticketLimit} {t('raffle.ticketsMax')}
                          </p>
                          {(raffle.valueOfPot ?? 0) > 0 && (
                            <div className="relative mt-4 inline-block">
                              <div className="absolute inset-0 -m-6 overflow-visible rounded-2xl pointer-events-none">
                                <div className="pot-blob pot-blob-1" />
                                <div className="pot-blob pot-blob-2" />
                                <div className="pot-blob pot-blob-3" />
                              </div>
                              <div className="relative z-10 px-10 py-5 rounded-2xl bg-gradient-to-br from-amber-50 via-amber-100/80 to-amber-50 border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.35),0_8px_32px_rgba(0,0,0,0.1)]">
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">🏆</span>
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1 mt-1">{t('raffle.potValue')}</p>
                                <p className="text-3xl sm:text-4xl font-bold text-amber-900 tabular-nums drop-shadow-sm">
                                  €{(raffle.valueOfPot ?? 0).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        {state === 'live' && (
                          <div className="text-center mb-4 relative">
                            <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 tracking-tight">Enter Now — Win Big</h4>
                            <p className="text-sm text-gray-600 mb-4">Every ticket could be the one. Don&apos;t miss your shot at the pot.</p>
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => setBigViewTicketQty((q) => ({ ...q, [raffle._id]: Math.max(1, (q[raffle._id] ?? 1) - 1) }))}
                                className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 text-gray-700 font-bold text-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                                disabled={(bigViewTicketQty[raffle._id] ?? 1) <= 1}
                              >
                                −
                              </button>
                              <GetStarsTooltip
                                showTooltip={starBids < raffle.ticketCostStars * (bigViewTicketQty[raffle._id] ?? 1) && enteringRaffleId !== raffle._id}
                                requiredStars={raffle.ticketCostStars * (bigViewTicketQty[raffle._id] ?? 1)}
                                currentStars={starBids}
                              >
                                <button
                                  onClick={() => handleEnterRaffle(raffle, bigViewTicketQty[raffle._id] ?? 1)}
                                  disabled={starBids < raffle.ticketCostStars * (bigViewTicketQty[raffle._id] ?? 1) || enteringRaffleId === raffle._id}
                                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                  {enteringRaffleId === raffle._id ? (
                                    <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />{t('raffle.entering')}</>
                                  ) : (
                                    <>{t('raffle.getYourTickets')}</>
                                  )}
                                </button>
                              </GetStarsTooltip>
                              <button
                                onClick={() => setBigViewTicketQty((q) => ({ ...q, [raffle._id]: Math.min(raffle.ticketLimitPerUser || raffle.ticketLimit || 99, (q[raffle._id] ?? 1) + 1) }))}
                                className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 text-gray-700 font-bold text-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                                disabled={(bigViewTicketQty[raffle._id] ?? 1) >= (raffle.ticketLimitPerUser || raffle.ticketLimit || 99)}
                              >
                                +
                              </button>
                            </div>
                            {/* Stacking tickets visual - bottom right */}
                            <div className="absolute bottom-1 right-2 sm:right-6 w-24 h-24 pointer-events-none overflow-visible">
                              {[...Array(bigViewTicketQty[raffle._id] ?? 1)].map((_, i) => (
                                <div
                                  key={`${raffle._id}-ticket-${i}`}
                                  className="absolute right-0 bottom-0"
                                  style={{
                                    zIndex: i + 1,
                                    transform: `translate(${-i * 6}px, ${-i * 8}px) rotate(${-i * 4}deg)`,
                                  }}
                                >
                                  <span className="inline-block text-2xl sm:text-3xl drop-shadow-md animate-ticket-stack-in">🎟️</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {(bigViewTicketQty[raffle._id] ?? 1)} ticket{(bigViewTicketQty[raffle._id] ?? 1) > 1 ? 's' : ''} • {(raffle.ticketCostStars * (bigViewTicketQty[raffle._id] ?? 1))} stars
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                          </svg>
                          <span className="text-xs font-medium text-gray-600">{t('raffle.raffleLockedUntilDraw')}</span>
                        </div>
                        {(countdownTarget || state === 'ended') && (
                          state === 'live' ? (
                            <p className="text-sm font-semibold text-gray-700 mb-4">
                              {t('raffle.drawIn')}: <span className="text-emerald-600">{countdownTarget ? formatCountdown(countdownTarget) : '—'}</span>
                            </p>
                          ) : state === 'launching-soon' ? (
                            <p className="text-sm font-semibold text-gray-700 mb-4">
                              {t('raffle.startsIn')}: <span className="text-emerald-600">{countdownTarget ? formatCountdown(countdownTarget) : '—'}</span>
                            </p>
                          ) : state === 'ended' ? (
                            <p className="text-sm font-semibold text-gray-600 mb-4">Raffle ended</p>
                          ) : null
                        )}
                        {(myTickets[raffle._id]?.length ?? 0) > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-3 text-center">{t('raffle.yourTicketNumbers')}</p>
                            <div className="flex flex-wrap justify-center gap-3">
                              {myTickets[raffle._id].map((num) => (
                                <div key={num} className="ticket-card-outer">
                                  <div className="ticket-card-inner">
                                    <span className="ticket-num tabular-nums">{num}</span>
                                    <span className="ticket-label">{t('raffle.ticket')}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {showRoulette && (
                      <>
                        <div className="mb-3 text-center">
                          <p className="text-sm font-bold text-amber-800">
                            {secondsLeft > 60 ? `${t('raffle.drawStartingIn')} ${secondsLeft}s` : `${t('raffle.spinning')} ${secondsLeft}s`}
                          </p>
                        </div>
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 mb-3 transition-all duration-1000 ease-out shadow-lg"
                          style={{ width: `${progressWidth}%`, opacity: progressWidth > 0 ? 1 : 0 }}
                        />
                        <div className="relative flex-1 min-h-[140px] flex items-center justify-center overflow-hidden">
                          {secondsLeft <= 60 ? (
                            <>
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-amber-500 drop-shadow-lg" />
                              <div
                                className="roulette-wheel relative w-28 h-28 rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-100 to-orange-200 shadow-xl"
                                style={{ ['--roulette-end-deg' as string]: `${rouletteEndDeg}deg` }}
                              >
                                {tickets.map((t, i) => {
                                  const angle = (i / tickets.length) * 360 - 90;
                                  const x = 50 + 42 * Math.cos((angle * Math.PI) / 180);
                                  const y = 50 + 42 * Math.sin((angle * Math.PI) / 180);
                                  return (
                                    <div
                                      key={i}
                                      className="absolute w-8 h-8 flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-amber-200 to-orange-300 border-2 border-amber-500 text-[10px] font-bold shadow"
                                      style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                                      }}
                                    >
                                      <span className="text-amber-900">#{t.number}</span>
                                      <span className="text-amber-700 text-[8px]">{t.initials}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {tickets.slice(0, 16).map((t, i) => (
                                <div key={i} className="inline-flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 border-2 border-amber-400 text-center shadow">
                                  <span className="text-[10px] font-bold text-amber-900">#{t.number}</span>
                                  <span className="text-[8px] font-semibold text-amber-700">{t.initials}</span>
                                </div>
                              ))}
                              {tickets.length > 16 && <span className="text-xs text-amber-600 self-center">+{tickets.length - 16}</span>}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {countdownTarget && (() => {
                            const parts = getCountdownParts(countdownTarget);
                            const shortLabels = [t('raffle.days'), t('raffle.hours'), t('raffle.min'), t('raffle.sec')];
                            return shortLabels.map((label, i) => (
                              <div key={label} className="countdown-card-wrapper relative">
                                <div className="countdown-card-gradient-border">
                                  <div className="countdown-card countdown-card-inner rounded-lg p-2 text-center">
                                    <div className="text-base font-bold text-gray-800 tabular-nums">{[parts.days, parts.hours, parts.minutes, parts.seconds][i]}</div>
                                    <div className="text-[9px] font-bold text-gray-600 uppercase">{label}</div>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </>
                    )}
                    {showWinner && winner && (() => {
                      const isCurrentUserWinner = (myTickets[raffle._id] ?? []).includes(winner.number);
                      const hasClaimed = claimedRaffleIds.has(raffle._id);
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center py-6 animate-winner-reveal">
                          {showWinnerRaffleId === raffle._id && (
                            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                              {[...Array(48)].map((_, i) => {
                                const angle = (i / 48) * Math.PI * 2;
                                const tx = Math.cos(angle) * 220;
                                const ty = Math.sin(angle) * 220;
                                const colors = ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308', '#f97316'];
                                return (
                                  <div
                                    key={i}
                                    className="firework-particle-winner"
                                    style={{
                                      background: colors[i % colors.length],
                                      ['--tx' as string]: `${tx}px`,
                                      ['--ty' as string]: `${ty}px`,
                                      animationDelay: `${i * 0.015}s`,
                                    } as React.CSSProperties}
                                  />
                                );
                              })}
                              {[...Array(24)].map((_, i) => {
                                const angle = (i / 24) * Math.PI * 2 + 0.5;
                                const tx = Math.cos(angle) * 160;
                                const ty = Math.sin(angle) * 160;
                                const colors = ['#fbbf24', '#f472b6', '#a78bfa', '#34d399'];
                                return (
                                  <div
                                    key={`b-${i}`}
                                    className="firework-particle-winner"
                                    style={{
                                      background: colors[i % colors.length],
                                      ['--tx' as string]: `${tx}px`,
                                      ['--ty' as string]: `${ty}px`,
                                      animationDelay: `${0.3 + i * 0.02}s`,
                                    } as React.CSSProperties}
                                  />
                                );
                              })}
                            </div>
                          )}
                          <div className="text-8xl mb-3 animate-trophy-glow">🏆</div>
                          <p className="text-sm font-bold text-amber-700 uppercase mb-2 tracking-wider">Winner</p>
                          <div className="ticket-card-winner-lg mb-3">
                            <div className="ticket-card-inner">
                              <span className="ticket-num tabular-nums">{winner.number}</span>
                              <span className="ticket-label">Winning Ticket</span>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-amber-800 mb-4">
                            {winner.displayName || winner.initials}
                          </p>
                          <p className="text-2xl font-bold text-amber-700 mb-4">Congratulations!</p>
                          {isCurrentUserWinner && (
                            hasClaimed ? (
                              <Link
                                href="/member/claimed-prizes"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gray-200 text-gray-700 font-bold text-lg"
                              >
                                ✓ Claimed — View Prizes
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleClaimPrize(raffle._id)}
                                disabled={claimingRaffleId === raffle._id}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-lg shadow-lg hover:from-amber-600 hover:to-yellow-600 transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                {claimingRaffleId === raffle._id ? (
                                  <>
                                    <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                                    Claiming...
                                  </>
                                ) : (
                                  'Claim Prize'
                                )}
                              </button>
                            )
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );

                return (
                  <div key={raffle._id} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    {isLeft ? (
                      <>
                        <div>{card}</div>
                        <div className="hidden md:block">{bigView}</div>
                      </>
                    ) : (
                      <>
                        <div className="hidden md:block">{bigView}</div>
                        <div>{card}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleRaffles.map((raffle) => {
                const state = getRaffleState(raffle);
                const raffleHats = (raffle.hatIds || [])
                  .map((id) => hatsById[id])
                  .filter(Boolean);
                const firstHat = raffleHats[0];
                const countdownTarget =
                  state === 'launching-soon'
                    ? new Date(raffle.startDate)
                    : state === 'live'
                    ? new Date(raffle.endDate)
                    : null;

                return (
                  <div
                    key={raffle._id}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-emerald-200 hover:border-emerald-400 transition-all"
                  >
                    {/* Raffle image - first hat or placeholder */}
                    <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                      {firstHat?.mainHatImage ? (
                        <WixImage
                          src={firstHat.mainHatImage}
                          alt={firstHat.title || raffle.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🎟️</div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            state === 'live'
                              ? 'bg-green-500 text-white'
                              : state === 'launching-soon'
                              ? 'bg-amber-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}
                        >
                          {state === 'live' ? t('raffle.live') : state === 'launching-soon' ? t('raffle.comingSoon') : t('raffle.ended')}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{raffle.name}</h3>
                      {raffle.subtitle && (
                        <p className="text-sm text-gray-600 mb-3">{raffle.subtitle}</p>
                      )}

                      {countdownTarget && (
                        state === 'launching-soon' ? (
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            {t('raffle.startsIn')}: <span className="text-emerald-600">{formatCountdown(countdownTarget)}</span>
                          </p>
                        ) : (
                          <div className="grid grid-cols-4 gap-1.5 mb-3">
                            {(() => {
                              const parts = getCountdownParts(countdownTarget);
                              const countdownLabels = [t('raffle.days'), t('raffle.hours'), t('raffle.minutes'), t('raffle.seconds')];
                              const values = [parts.days, parts.hours, parts.minutes, parts.seconds];
                              return countdownLabels.map((label, i) => (
                                <div
                                  key={label}
                                  className="rounded-lg p-[1.5px] text-center"
                                  style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 25%, #22c55e 50%, #eab308 75%, #f97316 100%)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  }}
                                >
                                  <div className="rounded-[6px] bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 py-2 px-1 border border-white/80">
                                    <div className="text-base font-bold text-gray-800 tabular-nums">{values[i]}</div>
                                    <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">{label}</div>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )
                      )}

                      <p className="text-sm text-gray-500 mb-3">
                        {raffle.ticketCostStars} {t('raffle.starsPerTicket')} • {raffle.ticketLimit} {t('raffle.ticketsMax')}
                        {(raffle.ticketLimitPerUser ?? 0) > 0 && (
                          <span className="block mt-0.5 text-gray-600">{t('raffle.maxPerUser')} {raffle.ticketLimitPerUser} {t('raffle.perUser')}</span>
                        )}
                        {(raffle.valueOfPot ?? 0) > 0 && (
                          <span className="block mt-1 font-semibold text-emerald-600">{t('raffle.potValuePrefix')}: €{(raffle.valueOfPot ?? 0).toLocaleString()}</span>
                        )}
                      </p>

                      {(myTickets[raffle._id]?.length ?? 0) > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">{t('raffle.yourTickets')}</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {myTickets[raffle._id].map((num) => (
                              <div key={num} className="ticket-card-outer ticket-card-sm">
                                <div className="ticket-card-inner">
                                  <span className="ticket-num tabular-nums">{num}</span>
                                  <span className="ticket-label">{t('raffle.ticket')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {raffleHats.length > 0 && (
                        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                          {raffleHats.slice(0, 4).map((h) => (
                            <div
                              key={h._id}
                              className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200"
                            >
                              {h.mainHatImage ? (
                                <WixImage src={h.mainHatImage} alt={h.title} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">🎩</div>
                              )}
                            </div>
                          ))}
                          {raffleHats.length > 4 && (
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold">
                              +{raffleHats.length - 4}
                            </div>
                          )}
                        </div>
                      )}

                      {state === 'live' && (
                        <div className="space-y-2">
                          <button
                            onClick={() => setViewingRaffle(raffle)}
                            className="w-full py-2.5 bg-gray-100 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition-all border border-gray-300"
                          >
                            View Live Raffle
                          </button>
                          <GetStarsTooltip showTooltip={starBids < raffle.ticketCostStars && enteringRaffleId !== raffle._id} requiredStars={raffle.ticketCostStars} currentStars={starBids}>
                            <button
                              onClick={() => handleEnterRaffle(raffle)}
                              disabled={starBids < raffle.ticketCostStars || enteringRaffleId === raffle._id}
                              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                              {enteringRaffleId === raffle._id ? (
                                <>
                                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                  Entering...
                                </>
                              ) : (
                                `Enter Raffle (${raffle.ticketCostStars} stars)`
                              )}
                            </button>
                          </GetStarsTooltip>
                        </div>
                      )}
                      {state === 'launching-soon' && (
                        <div className="w-full py-3 bg-gray-200 text-gray-600 font-medium rounded-xl text-center">
                          Tickets available soon
                        </div>
                      )}
                      {state === 'ended' && (
                        <div className="w-full py-3 bg-gray-200 text-gray-500 font-medium rounded-xl text-center">
                          Raffle ended
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/art-auction">
              <RainbowButton variant="secondary">
                {t('auction.backToAuction')}
              </RainbowButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
