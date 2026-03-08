'use client';

import { useState, useEffect } from 'react';

interface Raffle {
  _id: string;
  name: string;
  ticketLimit: number;
  ticketCostStars: number;
  ticketLimitPerUser?: number;
}

interface TicketPickerPopupProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (ticketCount: number, ticketNumbers?: number[]) => Promise<void>;
  starBids: number;
  enteringRaffleId: string | null;
  t: (key: string) => string;
}

const TICKETS_PER_ROW = 12;

export default function TicketPickerPopup({
  raffle,
  isOpen,
  onClose,
  onPurchase,
  starBids,
  enteringRaffleId,
  t,
}: TicketPickerPopupProps) {
  const [soldNumbers, setSoldNumbers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [qty, setQty] = useState(1);

  const maxTickets = raffle.ticketLimit ?? 100;
  const maxPerUser = raffle.ticketLimitPerUser ?? maxTickets;

  useEffect(() => {
    if (!isOpen || !raffle._id) return;
    setLoading(true);
    setSelected(new Set());
    fetch(`/api/raffles/${raffle._id}/available-tickets`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.soldNumbers)) {
          setSoldNumbers(new Set(data.soldNumbers));
        }
      })
      .catch(() => setSoldNumbers(new Set()))
      .finally(() => setLoading(false));
  }, [isOpen, raffle._id]);

  const toggleNumber = (n: number) => {
    if (soldNumbers.has(n)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else if (next.size < maxPerUser) {
        next.add(n);
      }
      return next;
    });
  };

  const handleQuickBuy = () => {
    setSelected(new Set());
    onPurchase(qty);
  };

  const handleBuySelected = () => {
    if (selected.size === 0) {
      onPurchase(qty);
      return;
    }
    onPurchase(selected.size, [...selected].sort((a, b) => a - b));
  };

  const cost = selected.size > 0
    ? selected.size * raffle.ticketCostStars
    : qty * raffle.ticketCostStars;
  const canAfford = starBids >= cost;
  const isEntering = enteringRaffleId === raffle._id;

  if (!isOpen) return null;

  const allNumbers = Array.from({ length: maxTickets }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🎟️</span>
            {t('raffle.pickYourTickets') || 'Pick Your Tickets'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 mb-4">
            {t('raffle.pickTicketsDescription') || 'Click available numbers to select, or use Quick Buy for random tickets.'}
          </p>

          {loading ? (
            <div className="grid grid-cols-12 gap-1.5 mb-6">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div
              className="grid gap-1.5 mb-6"
              style={{ gridTemplateColumns: `repeat(${TICKETS_PER_ROW}, minmax(0, 1fr))` }}
            >
              {allNumbers.map((n) => {
                const isSold = soldNumbers.has(n);
                const isSelected = selected.has(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleNumber(n)}
                    disabled={isSold}
                    className={`
                      aspect-square rounded-lg text-sm font-semibold text-center transition-all
                      flex items-center justify-center min-w-0
                      ${isSold
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed line-through'
                        : isSelected
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg ring-2 ring-emerald-400 ring-offset-2'
                          : 'bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:ring-2 hover:ring-emerald-300'
                      }
                    `}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">{t('raffle.quickBuy') || 'Quick Buy'}:</span>
              <div className="flex items-center gap-1 border-2 border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 px-2 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700"
                >
                  −
                </button>
                <span className="w-10 text-center font-bold tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxPerUser, q + 1))}
                  className="w-9 h-9 px-2 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">tickets (random)</span>
            </div>
            {selected.size > 0 && (
              <span className="text-emerald-600 font-semibold">
                {selected.size} selected: {[...selected].sort((a, b) => a - b).join(', ')}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleQuickBuy}
              disabled={!canAfford || isEntering}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isEntering ? (
                <><span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent" />{t('raffle.entering')}</>
              ) : (
                <>{t('raffle.quickBuy') || 'Quick Buy'} {qty} {qty === 1 ? 'ticket' : 'tickets'} ({qty * raffle.ticketCostStars} stars)</>
              )}
            </button>
            <button
              onClick={handleBuySelected}
              disabled={!canAfford || isEntering || (selected.size === 0 && qty < 1)}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isEntering ? (
                <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />{t('raffle.entering')}</>
              ) : selected.size > 0 ? (
                <>{t('raffle.buySelected') || 'Buy Selected'} ({selected.size} tickets, {cost} stars)</>
              ) : (
                <>{t('raffle.getYourTickets') || 'Get Your Tickets'} ({qty * raffle.ticketCostStars} stars)</>
              )}
            </button>
          </div>

          {!canAfford && (
            <p className="mt-3 text-sm text-amber-600 font-medium">
              {t('raffle.insufficientStars') || 'Insufficient stars'} — need {cost}, you have {starBids}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
