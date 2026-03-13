'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import RainbowButton from '@/components/RainbowButton';
import Fireworks from '@/components/Fireworks';
import { useAuth } from '@/components/AuthProvider';

declare global {
  interface Window {
    SumUpCard?: {
      mount: (opts: { id: string; checkoutId: string; onResponse: (type: string, body: unknown) => void }) => void;
    };
  }
}

type RunwayEvent = {
  id: string;
  title: string;
  subtitle?: string;
  eventDate: string;
  startTime?: string;
  guestListLimit: number | null;
  ticketLimit: number | null;
  ticketPrice: number;
  guestListEnabled: boolean;
  ticketsEnabled: boolean;
  attendees: { guests: number; tickets: number };
  totalAttendees: number;
  itemsCount?: number;
  itemsRevealed?: boolean;
};

type FlowPath = 'guest' | 'ticket' | null;

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    dayLabel: DAY_NAMES[d.getDay()],
    dayNum: d.getDate(),
    month: MONTH_NAMES[d.getMonth()],
    year: d.getFullYear(),
  };
}

export default function RunwayGuestListPage() {
  const router = useRouter();
  const { member } = useAuth();
  const [events, setEvents] = useState<RunwayEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [flowPath, setFlowPath] = useState<FlowPath>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const hasPrefilledRef = useRef(false);

  // Pre-fill email/name when logged in so ticket links to account (runs once)
  useEffect(() => {
    if (member && !hasPrefilledRef.current) {
      const email = (member.email || '').trim();
      const name = (member.memberName || member.fullName || '').trim();
      if (email || name) {
        hasPrefilledRef.current = true;
        setFormData((prev) => ({
          ...prev,
          email: email || prev.email,
          name: name || prev.name,
        }));
      }
    }
  }, [member]);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [sumupCheckoutId, setSumupCheckoutId] = useState<string | null>(null);
  const [showSumupWidget, setShowSumupWidget] = useState(false);
  const [sumupScriptReady, setSumupScriptReady] = useState(false);
  const [paymentReturnChecking, setPaymentReturnChecking] = useState(false);
  const [paymentTimeout, setPaymentTimeout] = useState(false);
  const widgetMountedRef = useRef(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/runway/events?status=upcoming')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.events)) {
          setEvents(data.events.filter((e: RunwayEvent) => e.guestListEnabled || e.ticketsEnabled));
        }
        setEventsLoading(false);
      })
      .catch(() => setEventsLoading(false));
  }, []);

  // Handle return from SumUp redirect (e.g. after 3DS) – poll for payment status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_return') !== '1') return;
    const idFromUrl = params.get('checkout_id') || params.get('checkoutId') || params.get('id');
    const storedId = sessionStorage.getItem('runway_payment_checkout_id') || idFromUrl;
    if (!storedId) return;
    sessionStorage.removeItem('runway_payment_checkout_id');
    window.history.replaceState({}, '', '/runway-guest-list');
    setFlowPath('ticket');
    setShowSumupWidget(false);
    setSumupCheckoutId(null);
    setPaymentReturnChecking(true);
    startPolling(storedId);
  }, []);

  // Mount SumUp card widget when checkout is ready and script loaded
  useEffect(() => {
    if (!showSumupWidget || !sumupCheckoutId || widgetMountedRef.current || !sumupScriptReady) return;
    const SumUpCard = (window as unknown as { SumUpCard?: typeof window.SumUpCard }).SumUpCard;
    if (!SumUpCard) return;
    widgetMountedRef.current = true;
    SumUpCard.mount({
      id: 'sumup-card',
      checkoutId: sumupCheckoutId,
      onResponse: (type: string, body: unknown) => {
        const t = (type || '').toLowerCase();
        // "sent" / "success" = payment submitted; poll for PAID status
        if (t === 'success' || t === 'sent') {
          setShowSumupWidget(false);
          startPolling(sumupCheckoutId);
        } else if (t === 'auth-screen' || t === 'auth_screen') {
          // 3DS in progress – start polling; user may be redirected and return via return_url
          setShowSumupWidget(false);
          startPolling(sumupCheckoutId);
        } else if (t === 'error' || t === 'invalid') {
          setError((body as { message?: string })?.message || 'Payment could not be completed. Please try again.');
        } else {
          // Fallback: any other response – show processing and poll (covers unknown types)
          setShowSumupWidget(false);
          startPolling(sumupCheckoutId);
        }
      },
    });
  }, [showSumupWidget, sumupCheckoutId, sumupScriptReady]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const ticketLimit = selectedEvent?.ticketLimit ?? 0;
  const ticketsSold = selectedEvent?.attendees?.tickets ?? 0;
  const ticketsAvailable = ticketLimit > 0 ? Math.max(0, ticketLimit - ticketsSold) : 99;
  const guestLimit = selectedEvent?.guestListLimit ?? 0;
  const guestsCount = selectedEvent?.attendees?.guests ?? 0;
  const guestFull = guestLimit > 0 && guestsCount >= guestLimit;
  const canJoinGuestList = (selectedEvent?.guestListEnabled ?? false) && !guestFull;
  const canBuyTickets = (selectedEvent?.ticketsEnabled ?? false) && ticketsAvailable > 0;
  const ticketPrice = selectedEvent?.ticketPrice ?? 0;
  const ticketTotal = ticketPrice * ticketQuantity;

  const handleGuestList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/runway/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, runway_event_id: selectedEventId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 5000);
        setFormData({ name: '', email: '', phone: '' });
        setSelectedEventId(null);
        setFlowPath(null);
        setTimeout(() => router.push('/member/runway-events'), 5000);
      } else {
        setError(data.error || 'Failed to join guest list.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/runway/tickets/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          runway_event_id: selectedEventId,
          quantity: ticketQuantity,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          member_id: member?.id ?? undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.checkoutId) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('runway_payment_checkout_id', data.checkoutId);
        }
        setSumupCheckoutId(data.checkoutId);
        setShowSumupWidget(true);
        widgetMountedRef.current = false;
      } else {
        setError(data.error || 'Failed to set up payment. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (checkoutId: string) => {
    setPaymentReturnChecking(true);
    setPaymentTimeout(false);
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    pollTimeoutRef.current = setTimeout(() => {
      pollTimeoutRef.current = null;
      setPaymentTimeout(true);
    }, 45000);
    const poll = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/runway/tickets/check-status?checkoutId=${encodeURIComponent(checkoutId)}`);
        const data = await res.json();
        if (data.status === 'paid') {
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
          setPaymentReturnChecking(false);
          setPaymentTimeout(false);
          setSuccess(true);
          setShowFireworks(true);
          setTimeout(() => setShowFireworks(false), 5000);
          setFormData({ name: '', email: '', phone: '' });
          setSelectedEventId(null);
          setFlowPath(null);
          setSumupCheckoutId(null);
          setShowSumupWidget(false);
          setTicketQuantity(1);
          setTimeout(() => router.push('/member/runway-events'), 5000);
          return;
        }
        if (data.status === 'failed' || data.status === 'expired') {
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
          setPaymentReturnChecking(false);
          setPaymentTimeout(false);
          setError('Payment failed or expired. Please try again.');
          setShowSumupWidget(false);
          setSumupCheckoutId(null);
          return;
        }
        if (data.success === false && data.error) {
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
          setPaymentReturnChecking(false);
          setPaymentTimeout(false);
          setError(data.error || 'Could not verify payment. Please try again.');
          setShowSumupWidget(false);
          setSumupCheckoutId(null);
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        setTimeout(poll, 2000);
      }
    };
    poll();
  };

  const cancelPaymentChecking = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setPaymentReturnChecking(false);
    setPaymentTimeout(false);
    setShowSumupWidget(false);
    setSumupCheckoutId(null);
    setError('');
  };

  const resetPath = () => setFlowPath(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 py-12 md:py-20 relative overflow-hidden">
      {showSumupWidget && (
        <Script
          src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"
          strategy="afterInteractive"
          onLoad={() => setSumupScriptReady(true)}
          onError={() => setError('Payment form failed to load. Please refresh the page or try a different browser.')}
        />
      )}
      <Fireworks trigger={showFireworks} duration={5000} />
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-pink-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="text-7xl md:text-8xl mb-6 transform hover:scale-110 transition-transform duration-500 inline-block animate-bounce" style={{ animationDuration: '2s' }}>
            🎫
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Guest List & Tickets
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Join the guest list or buy tickets for the Coco Hawaii Runway & Art Experience
          </p>
        </div>

        {success && (
          <div className="mb-12 p-8 md:p-12 bg-green-50 border-4 border-green-500 rounded-3xl text-center animate-scaleIn shadow-2xl">
            <div className="text-6xl mb-6">🎉</div>
            <h3 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">You&apos;re all set!</h3>
            <p className="text-xl text-green-700">Thank you! We&apos;ll see you at the runway show.</p>
          </div>
        )}

        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-500 rounded-2xl text-center animate-scaleIn">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {paymentReturnChecking && (
          <div className="mb-8 p-8 bg-purple-50 border-2 border-purple-500 rounded-2xl text-center animate-scaleIn">
            {paymentTimeout ? (
              <>
                <p className="text-purple-800 font-semibold mb-2">Payment is taking longer than expected.</p>
                <p className="text-purple-600 text-sm mb-6">Check your email for confirmation, or try again below.</p>
                <button
                  type="button"
                  onClick={cancelPaymentChecking}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                >
                  Try again
                </button>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent mx-auto mb-4" />
                <p className="text-purple-800 font-semibold">Checking payment status...</p>
                <p className="text-purple-600 text-sm mt-1 mb-4">Please wait a moment.</p>
                <button
                  type="button"
                  onClick={cancelPaymentChecking}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium underline"
                >
                  Cancel and try again
                </button>
              </>
            )}
          </div>
        )}

        {!success && !paymentReturnChecking && (
          <div className="space-y-10">
            {/* STEP 1: Event Selection - Always first */}
            <section className="animate-fade-in">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold">1</span>
                Select your event
              </h2>
              {eventsLoading ? (
                <div className="py-16 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="py-16 text-center text-gray-500 rounded-3xl border-2 border-dashed border-gray-300 bg-white/50">
                  <p className="text-lg">No upcoming runway events at the moment.</p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {events.map((ev, i) => {
                    const { dayLabel, dayNum, month, year } = formatEventDate(ev.eventDate);
                    const guestLimitEv = ev.guestListLimit ?? 0;
                    const guestCount = ev.attendees?.guests ?? 0;
                    const ticketLimitEv = ev.ticketLimit ?? 0;
                    const ticketCount = ev.attendees?.tickets ?? 0;
                    const guestFull = guestLimitEv > 0 && guestCount >= guestLimitEv;
                    const ticketFull = ticketLimitEv > 0 && ticketCount >= ticketLimitEv;
                    const hasOption = (ev.guestListEnabled && !guestFull) || (ev.ticketsEnabled && !ticketFull);
                    const isSelected = selectedEventId === ev.id;
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => hasOption && setSelectedEventId(ev.id)}
                        disabled={!hasOption}
                        style={{ animationDelay: `${i * 50}ms` }}
                        className={`text-left p-6 md:p-8 rounded-2xl border-4 transition-all duration-300 transform hover:scale-[1.02] animate-fade-in ${
                          !hasOption
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                            : isSelected
                              ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 ring-4 ring-pink-300 shadow-xl scale-[1.02]'
                              : 'border-gray-300 bg-white hover:border-pink-300 hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center justify-center min-w-[4rem] py-3 px-4 rounded-xl bg-white/90 shadow">
                            <span className="text-xs font-bold text-purple-600 uppercase">{dayLabel}</span>
                            <span className="text-4xl font-bold text-gray-900 leading-none">{dayNum}</span>
                            <span className="text-xs text-gray-600">{month}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-600 mb-1">{year}</div>
                            <div className="font-bold text-lg text-gray-900 line-clamp-2 break-words">{ev.title}</div>
                            {ev.subtitle && <div className="text-sm text-gray-500 truncate">{ev.subtitle}</div>}
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              {ev.guestListEnabled && (
                                <span className={guestFull ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                  {guestCount}/{guestLimitEv || '∞'} guests
                                </span>
                              )}
                              {ev.ticketsEnabled && (
                                <span className={ticketFull ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                  {ticketCount}/{ticketLimitEv || '∞'} tickets
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {ev.itemsCount != null && ev.itemsCount > 0 && (
                          <div className="mt-4 pt-4 border-t border-purple-200 text-center">
                            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider">
                              {ev.itemsRevealed ? 'Revealed' : 'Revealing'}
                            </p>
                            <p className="text-4xl md:text-5xl font-black text-purple-700 leading-none my-1">
                              {ev.itemsCount}
                            </p>
                            <p className="text-base font-bold text-purple-600">
                              Items
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* STEP 2: Path choice - Only when event selected */}
            {selectedEventId && selectedEvent && (
              <section className="animate-fade-in">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold">2</span>
                  Join the Runway
                </h2>
                {!flowPath ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {selectedEvent.guestListEnabled && (
                      canJoinGuestList ? (
                        <button
                          type="button"
                          onClick={() => setFlowPath('guest')}
                          className="p-8 md:p-10 rounded-2xl border-4 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.03] text-left group"
                        >
                          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">✨</div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Guest List</h3>
                          <p className="text-gray-600">Free entry — reserve your spot</p>
                          <p className="mt-2 text-sm text-purple-600 font-medium">{guestsCount}/{guestLimit || '∞'} spots taken</p>
                          {((selectedEvent as { itemsCount?: number }).itemsCount ?? 0) > 0 && (
                            <p className="mt-1 text-sm text-purple-500 font-medium">
                              {(selectedEvent as { itemsRevealed?: boolean }).itemsRevealed
                                ? `${(selectedEvent as { itemsCount?: number }).itemsCount} items revealed`
                                : `${(selectedEvent as { itemsCount?: number }).itemsCount} items to be revealed`}
                            </p>
                          )}
                        </button>
                      ) : (
                        <div className="p-8 md:p-10 rounded-2xl border-4 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 text-left relative overflow-hidden">
                          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500/90 text-white text-sm font-bold shadow-md">
                            Guest List Full
                          </div>
                          <div className="text-5xl mb-4 opacity-60">✨</div>
                          <h3 className="text-2xl font-bold text-gray-600 mb-2">Guest List</h3>
                          <p className="text-gray-500">Free entry — reserve your spot</p>
                          <p className="mt-2 text-sm text-gray-500 font-medium">{guestsCount}/{guestLimit} spots taken · Complete</p>
                          {(selectedEvent.itemsCount ?? 0) > 0 && (
                            <p className="mt-1 text-sm text-gray-500 font-medium">
                              {selectedEvent.itemsRevealed ? `${selectedEvent.itemsCount} items revealed` : `${selectedEvent.itemsCount} items to be revealed`}
                            </p>
                          )}
                        </div>
                      )
                    )}
                    {selectedEvent.ticketsEnabled && (
                      canBuyTickets ? (
                        <button
                          type="button"
                          onClick={() => setFlowPath('ticket')}
                          className="p-8 md:p-10 rounded-2xl border-4 border-pink-300 bg-gradient-to-br from-pink-50 to-orange-50 hover:border-pink-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.03] text-left group"
                        >
                          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎟️</div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Buy Tickets</h3>
                          <p className="text-gray-600">€{ticketPrice.toFixed(2)} per ticket · Pay with SumUp</p>
                          <p className="mt-2 text-sm text-pink-600 font-medium">{ticketsAvailable} tickets available</p>
                          {(selectedEvent.itemsCount ?? 0) > 0 && (
                            <p className="mt-1 text-sm text-pink-500 font-medium">
                              {selectedEvent.itemsRevealed
                                ? `${selectedEvent.itemsCount} items revealed`
                                : `${selectedEvent.itemsCount} items to be revealed`}
                            </p>
                          )}
                        </button>
                      ) : (
                        <div className="p-8 md:p-10 rounded-2xl border-4 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 text-left relative overflow-hidden">
                          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500/90 text-white text-sm font-bold shadow-md">
                            Sold Out
                          </div>
                          <div className="text-5xl mb-4 opacity-60">🎟️</div>
                          <h3 className="text-2xl font-bold text-gray-600 mb-2">Buy Tickets</h3>
                          <p className="text-gray-500">€{ticketPrice.toFixed(2)} per ticket · Pay with SumUp</p>
                          <p className="mt-2 text-sm text-gray-500 font-medium">0 tickets available · Complete</p>
                          {(selectedEvent.itemsCount ?? 0) > 0 && (
                            <p className="mt-1 text-sm text-gray-500 font-medium">
                              {selectedEvent.itemsRevealed ? `${selectedEvent.itemsCount} items revealed` : `${selectedEvent.itemsCount} items to be revealed`}
                            </p>
                          )}
                        </div>
                      )
                    )}
                    {!selectedEvent.guestListEnabled && !selectedEvent.ticketsEnabled && (
                      <div className="col-span-2 p-8 bg-gray-100 rounded-2xl text-center text-gray-600">
                        No attendance options for this event.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-purple-200">
                    <span className="text-2xl">{flowPath === 'guest' ? '✨' : '🎟️'}</span>
                    <span className="font-bold text-gray-900">
                      {flowPath === 'guest' ? 'Guest List' : `Buy Tickets (€${ticketTotal.toFixed(2)})`}
                    </span>
                    <button
                      type="button"
                      onClick={resetPath}
                      className="ml-auto text-sm text-purple-600 hover:text-purple-800 font-medium underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* STEP 3: Data form - Only when path chosen */}
            {flowPath && selectedEvent && (
              <section className="animate-fade-in">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold">3</span>
                  Your details
                </h2>
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-purple-100">
                  <form
                    onSubmit={flowPath === 'guest' ? handleGuestList : handleTicketPurchase}
                    className="space-y-6"
                  >
                    <div>
                      <label htmlFor="name" className="block text-base font-bold text-gray-800 mb-2">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-base font-bold text-gray-800 mb-2">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-base font-bold text-gray-800 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    {flowPath === 'ticket' && !showSumupWidget && (
                      <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-2xl p-6 border-2 border-fuchsia-200 shadow-lg">
                        <label htmlFor="ticketQty" className="block text-xl font-bold text-gray-800 mb-4">Number of tickets</label>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border-2 border-fuchsia-200 shadow-inner">
                            <button
                              type="button"
                              onClick={() => setTicketQuantity((q) => Math.max(1, q - 1))}
                              disabled={ticketQuantity <= 1}
                              className="w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-2xl font-bold shadow-md hover:from-fuchsia-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                              aria-label="Decrease tickets"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              id="ticketQty"
                              min={1}
                              max={ticketsAvailable}
                              value={ticketQuantity}
                              onChange={(e) => setTicketQuantity(Math.max(1, Math.min(ticketsAvailable, parseInt(e.target.value, 10) || 1)))}
                              className="w-24 h-14 text-center text-2xl font-bold text-gray-900 border-0 bg-transparent focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => setTicketQuantity((q) => Math.min(ticketsAvailable, q + 1))}
                              disabled={ticketQuantity >= ticketsAvailable}
                              className="w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-2xl font-bold shadow-md hover:from-fuchsia-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                              aria-label="Increase tickets"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-center sm:text-left">
                            <p className="text-2xl font-bold text-gray-900">€{ticketTotal.toFixed(2)} total</p>
                            <p className="text-base text-gray-600 mt-0.5">Pay with credit card · SumUp</p>
                          </div>
                        </div>
                        <p className="text-base text-gray-600 mt-4 font-medium">{ticketsAvailable} tickets available</p>
                      </div>
                    )}

                    {flowPath === 'ticket' && showSumupWidget && (
                      <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-lg font-bold text-gray-800">Complete payment with SumUp</p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowSumupWidget(false);
                              setSumupCheckoutId(null);
                              widgetMountedRef.current = false;
                            }}
                            className="text-sm text-purple-600 hover:text-purple-800 font-medium underline"
                          >
                            Cancel
                          </button>
                        </div>
                        <div id="sumup-card" className="min-h-[200px]" />
                        {!sumupScriptReady && (
                          <div className="flex items-center gap-3 py-4 text-gray-600">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
                            <span>Loading payment form...</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-4">
                      {flowPath === 'ticket' && showSumupWidget ? null : (
                        <RainbowButton
                          type="submit"
                          variant="primary"
                          disabled={loading}
                          className="w-full py-5 text-xl font-bold rounded-xl"
                        >
                          {loading ? 'Processing...' : flowPath === 'guest' ? 'Join the Runway' : `Buy Tickets — €${ticketTotal.toFixed(2)}`}
                        </RainbowButton>
                      )}
                    </div>
                  </form>
                </div>
              </section>
            )}
          </div>
        )}

        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/the-runway')}
            className="text-gray-600 hover:text-gray-900 transition-colors underline text-lg font-medium"
          >
            ← Back to The Runway
          </button>
        </div>
      </div>
    </div>
  );
}
