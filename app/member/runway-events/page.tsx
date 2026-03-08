'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WixImage from '@/components/WixImage';
import { useAuth } from '@/components/AuthProvider';

function LinkTicketsButton({ onLinked }: { onLinked: () => void }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const handleClick = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/runway/link-tickets', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.success && data.linked > 0) {
        setMessage(data.message || 'Tickets linked!');
        onLinked();
      } else if (data.success) {
        setMessage('No unlinked tickets found with your email.');
      } else {
        setMessage(data.error || 'Failed to link tickets.');
      }
    } catch {
      setMessage('Failed to link tickets.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-block bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
      >
        {loading ? 'Linking...' : 'Link my tickets'}
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}

type RunwayEvent = {
  id: string;
  title: string;
  subtitle?: string;
  eventDate: string;
  startTime?: string;
  status: string;
  type: 'guest' | 'ticket' | 'guest_and_ticket';
  guestSignupId?: string;
  ticketQuantity: number;
  ticketTotalPaid: number;
  itemsRevealed?: boolean;
  hatIds?: string[];
  itemsCount?: number;
};

type Hat = { _id: string; title: string; slug?: string; mainHatImage?: string; price?: number; discountedPrice?: number };

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    dayLabel: DAY_NAMES[d.getDay()],
    dayNum: d.getDate(),
    month: MONTH_NAMES[d.getMonth()],
    year: d.getFullYear(),
  };
}

function formatTime(t?: string) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  const hour = parseInt(h || '0', 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${(m || '00').padStart(2, '0')} ${ampm}`;
}

export default function RunwayEventsPage() {
  const { member, isLoading } = useAuth();
  const [events, setEvents] = useState<RunwayEvent[]>([]);
  const [hats, setHats] = useState<Hat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandedOrder, setExpandedOrder] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading && !member) {
      window.location.href = '/login';
    }
  }, [member, isLoading]);

  useEffect(() => {
    if (!member) return;
    setLoading(true);
    Promise.all([
      fetch('/api/runway/my-events').then((r) => r.json()),
      fetch('/api/hats').then((r) => r.json()),
    ]).then(([eventsRes, hatsRes]) => {
      if (eventsRes.success && Array.isArray(eventsRes.events)) setEvents(eventsRes.events);
      if (hatsRes.success && Array.isArray(hatsRes.hats)) setHats(hatsRes.hats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [member]);

  const toggleItems = (eventId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const toggleOrder = (eventId: string) => {
    setExpandedOrder((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  if (isLoading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/member/dashboard" className="text-gray-600 hover:text-black transition-colors mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Runway Events</h1>
          <p className="text-lg text-gray-600">Events you&apos;ve signed up for or purchased tickets for</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading your events...</div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No events yet</h2>
            <p className="text-gray-600 mb-6">
              Join the guest list or buy tickets for upcoming runway events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/runway-guest-list"
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
              >
                Browse Runway Events
              </Link>
              <LinkTicketsButton onLinked={() => window.location.reload()} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((ev) => {
              const { dayLabel, dayNum, month, year } = formatEventDate(ev.eventDate);
              const isPast = ev.status === 'past';
              return (
                <div
                  key={ev.id}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all ${
                    isPast ? 'border-gray-200 opacity-80' : 'border-purple-200'
                  }`}
                >
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex flex-col items-center justify-center min-w-[4rem] py-2 px-3 rounded-xl bg-purple-100">
                        <span className="text-xs font-bold text-purple-600 uppercase">{dayLabel}</span>
                        <span className="text-2xl font-bold text-purple-900 leading-none">{dayNum}</span>
                        <span className="text-xs text-purple-600">{month} {year}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{ev.title}</h3>
                        {ev.subtitle && (
                          <p className="text-sm text-gray-600 truncate">{ev.subtitle}</p>
                        )}
                        {ev.startTime && (
                          <p className="text-sm text-gray-500 mt-1">{formatTime(ev.startTime)}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(ev.type === 'guest' || ev.type === 'guest_and_ticket') && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                              Guest List
                            </span>
                          )}
                          {(ev.type === 'ticket' || ev.type === 'guest_and_ticket') && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {ev.ticketQuantity} ticket{ev.ticketQuantity !== 1 ? 's' : ''}
                              {ev.ticketTotalPaid > 0 && ` · €${ev.ticketTotalPaid.toFixed(2)}`}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleOrder(ev.id); }}
                          className="mt-3 text-sm font-semibold text-purple-600 hover:text-purple-800 underline"
                        >
                          View order
                        </button>
                      </div>
                    </div>
                    {isPast && (
                      <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                        Past
                      </span>
                    )}
                    {(ev.itemsCount ?? 0) > 0 && (
                      <div className="ml-auto flex flex-col items-end text-right shrink-0">
                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                          {ev.itemsRevealed ? 'Revealed' : 'Revealing'}
                        </p>
                        <p className="text-4xl md:text-5xl font-black text-purple-700 leading-none">
                          {ev.itemsCount}
                        </p>
                        <p className="text-sm font-bold text-purple-600">
                          Items
                        </p>
                      </div>
                    )}
                  </div>
                  {expandedOrder.has(ev.id) && (
                    <div className="px-6 pt-4 pb-4 border-t border-gray-100">
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="font-semibold text-gray-800">
                          {formatEventDate(ev.eventDate).dayLabel}, {formatEventDate(ev.eventDate).month} {formatEventDate(ev.eventDate).dayNum}, {formatEventDate(ev.eventDate).year}
                          {ev.startTime && ` at ${formatTime(ev.startTime)}`}
                        </p>
                        {(ev.type === 'guest' || ev.type === 'guest_and_ticket') && (
                          <p className="text-sm text-gray-700">✓ Guest list signup</p>
                        )}
                        {(ev.type === 'ticket' || ev.type === 'guest_and_ticket') && (
                          <p className="text-sm text-gray-700">
                            {ev.ticketQuantity} ticket{ev.ticketQuantity !== 1 ? 's' : ''} · €{ev.ticketTotalPaid.toFixed(2)} paid
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {ev.itemsRevealed && (ev.hatIds?.length ?? 0) > 0 && (
                    <div className="border-t border-gray-100 mt-4 pt-4 px-6 pb-4">
                      <button
                        type="button"
                        onClick={() => toggleItems(ev.id)}
                        className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        <span className="font-semibold text-purple-700 text-sm">
                          {expandedItems.has(ev.id) ? '▼' : '▶'} Runway items ({ev.hatIds!.length})
                        </span>
                        <span className="text-xs text-gray-500">
                          {expandedItems.has(ev.id) ? 'Collapse' : 'View & purchase'}
                        </span>
                      </button>
                      {expandedItems.has(ev.id) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                          {ev.hatIds!.map((hid) => {
                            const hat = hats.find((h) => h._id === hid);
                            if (!hat) return null;
                            const slug = hat.slug || hat.title?.toLowerCase().replace(/\s+/g, '-') || hat._id;
                            return (
                              <Link
                                key={hid}
                                href={`/hats/${slug}`}
                                className="group block bg-white rounded-xl border-2 border-purple-100 p-3 hover:border-purple-300 hover:shadow-lg transition-all"
                              >
                                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                                  {hat.mainHatImage ? (
                                    <WixImage src={hat.mainHatImage} alt={hat.title || 'Hat'} fill className="object-cover group-hover:scale-105 transition-transform" sizes="150px" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">🎩</div>
                                  )}
                                </div>
                                <p className="font-medium text-gray-900 text-sm line-clamp-2">{hat.title || 'Hat'}</p>
                                <p className="text-xs text-purple-600 font-semibold mt-1">
                                  {hat.discountedPrice != null && hat.discountedPrice > 0
                                    ? `€${hat.discountedPrice.toFixed(2)}`
                                    : `€${(hat.price ?? 0).toFixed(2)}`}
                                </p>
                                <span className="text-xs text-purple-500 mt-1 inline-block">View & buy →</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/runway-guest-list"
            className="text-purple-600 hover:text-purple-800 font-medium underline"
          >
            Sign up for more events →
          </Link>
        </div>
      </div>
    </div>
  );
}
