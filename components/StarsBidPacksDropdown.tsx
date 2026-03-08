'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { StarBidPack } from '@/lib/wix-types';
import { useAuth } from '@/components/AuthProvider';
import Fireworks from '@/components/Fireworks';

type CheckoutStep = 'quantity' | 'payment' | 'success';

export default function StarsBidPacksDropdown() {
  const { member, refetch } = useAuth();
  const [packs, setPacks] = useState<StarBidPack[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [selectedPack, setSelectedPack] = useState<StarBidPack | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'card'>('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('quantity');
  const [showFireworks, setShowFireworks] = useState(false);

  // Fetch packs on mount (defer slightly to avoid race with hydration/navigation)
  useEffect(() => {
    let cancelled = false;
    const doFetch = () => {
      setLoading(true);
      setFetchError(null);
      const url = typeof window !== 'undefined' ? `${window.location.origin}/api/star-bid-packs` : '/api/star-bid-packs';
      fetch(url, { credentials: 'same-origin', cache: 'no-store' })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text().then((text) => {
            try {
              return JSON.parse(text);
            } catch {
              throw new Error('Invalid JSON response');
            }
          });
        })
        .then((data) => {
          if (cancelled) return;
          if (data.success && Array.isArray(data.packs)) {
            setPacks(data.packs);
          } else {
            setFetchError(data?.error || 'Could not load packs');
          }
        })
        .catch((e) => {
          if (!cancelled) setFetchError(e?.message || 'Failed to load');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    const t = setTimeout(doFetch, 100);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  const handlePackClick = (pack: StarBidPack) => {
    setSelectedPack(pack);
    setQuantity(1);
    setError(null);
    setSuccess(false);
    setCheckoutStep('quantity');
  };

  const handleCloseModal = () => {
    setSelectedPack(null);
    setError(null);
    setSuccess(false);
    setCheckoutStep('quantity');
    setShowFireworks(false);
  };

  const effectiveMemberId =
    (typeof window !== 'undefined' ? localStorage.getItem('memberId') : null) ||
    (member as { id?: string })?.id;

  const handleCheckout = async () => {
    if (!selectedPack) return;
    if (!effectiveMemberId) {
      setError('Please log in to purchase.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/star-bid-packs/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: selectedPack.bidPacksId,
          quantity,
          memberId: effectiveMemberId as string,
          paymentMethod: 'Card',
          totalPriceEUR: selectedPack.bidPacksPrice * quantity,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setCheckoutStep('success');
        setShowFireworks(true);
        window.dispatchEvent(new CustomEvent('starBidsPurchased', { detail: { starsAdded: data.starsAdded } }));
        if (data.member?.starBids != null && typeof window !== 'undefined') {
          localStorage.setItem('starBids', String(data.member.starBids));
        }
        refetch(); // Refresh member (Supabase) with new starBids
      } else {
        setError(data.error || 'Purchase failed.');
      }
    } catch (e: any) {
      setError(e?.message || 'Purchase failed.');
    } finally {
      setProcessing(false);
    }
  };

  const starsAmt = selectedPack ? (Number(selectedPack.bidPacksStarsAmount) || 0) : 0;
  const packPrice = selectedPack ? (Number(selectedPack.bidPacksPrice) || 0) : 0;
  const totalStars = starsAmt * quantity;
  const totalPrice = packPrice * quantity;

  return (
    <>
      <div
        className="relative group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          type="button"
          className="flex items-center justify-center w-11 h-11 rounded-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-all text-amber-700 hover:text-amber-800 hover:border-amber-300"
          title="Star Bids – Get packs to bid"
          aria-label="Star Bids"
        >
          <span className="text-2xl leading-none" aria-hidden>
            ⭐
          </span>
        </button>

        {hovered && (
          <div
            className="absolute right-0 top-full mt-2 py-3 px-4 w-72 rounded-xl border-2 border-amber-200 bg-white shadow-xl z-50"
            role="menu"
          >
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Star Bid Packs</p>
            {loading ? (
              <div className="py-6 text-center text-gray-500 text-sm">Loading packs…</div>
            ) : packs.length === 0 ? (
              <div className="py-6 text-center text-gray-500 text-sm space-y-2">
                {fetchError ? (
                  <p className="text-red-600 text-xs">{fetchError}</p>
                ) : (
                  <p>No packs available</p>
                )}
                <Link href="/star-bid-packs" className="text-amber-600 hover:underline text-xs block">
                  View Star Bid Packs page →
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {packs.map((pack) => (
                  <button
                    key={pack._id}
                    type="button"
                    onClick={() => handlePackClick(pack)}
                    className="w-full flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-amber-50/80 border border-amber-100 hover:bg-amber-100/80 transition-colors text-left cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {pack.bidPacksName || 'Pack'}
                      </p>
                      {pack.bidPackDetail && (
                        <p className="text-xs text-gray-600 truncate">{pack.bidPackDetail}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-amber-700">{Number(pack.bidPacksStarsAmount) || 0} ⭐</p>
                      <p className="text-xs text-gray-600">€{(Number(pack.bidPacksPrice) || 0).toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Checkout modal */}
      {selectedPack && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div
            className="w-full max-w-md rounded-2xl border-2 border-amber-200 bg-white shadow-2xl overflow-hidden transform animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-b border-amber-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPack.bidPacksName}</h3>
                  {selectedPack.bidPackDetail && (
                    <p className="text-sm text-gray-600">{selectedPack.bidPackDetail}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Animated progression steps */}
            {checkoutStep !== 'success' && (
              <div className="px-6 pt-5 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex-1 flex items-center ${checkoutStep === 'quantity' ? 'text-amber-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      checkoutStep === 'quantity' ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-200'
                    }`}>
                    {checkoutStep === 'payment' ? '✓' : '1'}
                    </div>
                    <span className="ml-2 text-sm font-semibold">Quantity</span>
                  </div>
                  <div className={`flex-1 mx-2 h-0.5 rounded-full transition-all duration-500 ${
                    checkoutStep === 'payment' ? 'bg-amber-500' : 'bg-gray-200'
                  }`} />
                  <div className={`flex-1 flex items-center ${checkoutStep === 'payment' ? 'text-amber-600' : 'text-gray-300'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      checkoutStep === 'payment' ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-100'
                    }`}>
                      2
                    </div>
                    <span className="ml-2 text-sm font-semibold">Payment</span>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-5">
              {checkoutStep === 'success' ? (
                /* Success state - will be replaced by fireworks overlay */
                <div className="py-8 text-center animate-fade-in">
                  <p className="text-5xl mb-3 animate-bounce">✓</p>
                  <p className="font-bold text-green-700 text-lg">Purchase successful!</p>
                  <p className="text-sm text-gray-600">Star bids added to your account.</p>
                </div>
              ) : checkoutStep === 'quantity' ? (
                /* Step 1: Quantity & Summary */
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 font-bold transition-all"
                      >
                        −
                      </button>
                      <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Stars</span>
                      <span className="font-bold text-amber-700">{totalStars} ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total</span>
                      <span className="font-bold text-gray-900">€{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('payment')}
                    disabled={!effectiveMemberId}
                    className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-amber-950 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    Continue to Payment →
                  </button>
                  {!effectiveMemberId && (
                    <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg text-center">
                      <Link href="/login" className="underline font-semibold">Log in</Link> to purchase.
                    </p>
                  )}
                </div>
              ) : (
                /* Step 2: Payment */
                <div className="space-y-5 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('quantity')}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                  >
                    ← Back
                  </button>
                  <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Stars</span>
                      <span className="font-bold text-amber-700">{totalStars} ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total</span>
                      <span className="font-bold text-gray-900">€{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Payment</p>
                    <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-amber-200 bg-amber-50/50 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">Credit / Debit Card</span>
                    </label>
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={processing || !effectiveMemberId}
                    className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-amber-950 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {processing ? 'Processing…' : `Pay €${totalPrice.toFixed(2)}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fireworks + Congrats overlay */}
      {selectedPack && success && showFireworks && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div className="absolute inset-0">
            <Fireworks trigger={showFireworks} duration={5000} />
          </div>
          <div
            className="relative bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-white/30 max-w-md w-full mx-4 transform animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-4 border-4 border-white/30 animate-bounce">
                <span className="text-5xl">🎉</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
                Congratulations!
              </h3>
              <p className="text-xl text-white/95 mb-2">
                Your star bids have been added!
              </p>
              <p className="text-lg font-bold text-white/90 mb-6">
                +{totalStars} ⭐
              </p>
              <button
                onClick={handleCloseModal}
                className="w-full bg-white text-amber-600 font-bold py-4 px-6 rounded-xl hover:bg-amber-50 transition-all duration-300 text-lg shadow-lg transform hover:scale-105"
              >
                Awesome! ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
