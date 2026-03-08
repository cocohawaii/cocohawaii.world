'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RainbowButton from '@/components/RainbowButton';
import PaintDrips from '@/components/PaintDrips';
import Fireworks from '@/components/Fireworks';
import { useAuth } from '@/components/AuthProvider';
import { StarBidPack } from '@/lib/wix-types';

export default function StarBidPacksPage() {
  const { member, refetch } = useAuth();
  const [packs, setPacks] = useState<StarBidPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [lastPurchasedStars, setLastPurchasedStars] = useState(0);
  const [showError, setShowError] = useState<string | null>(null);

  useEffect(() => {
    if (member?.id && typeof window !== 'undefined') {
      localStorage.setItem('memberId', member.id);
    }
  }, [member?.id]);

  useEffect(() => {
    async function loadPacks() {
      try {
        setLoading(true);
        const url = `${window.location.origin}/api/star-bid-packs`;
        const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
        const text = await response.text();
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = JSON.parse(text);
        setPacks(data.packs || []);
        const initialQuantities: Record<string, number> = {};
        data.packs?.forEach((pack: StarBidPack) => {
          initialQuantities[pack.bidPacksId] = 1;
        });
        setQuantities(initialQuantities);
      } catch (error) {
        console.error('Error loading packs:', error);
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(loadPacks, 100);
    return () => clearTimeout(t);
  }, []);

  const memberId = member?.id;

  const handlePurchase = async (pack: StarBidPack) => {
    if (!memberId) {
      setShowError('Please log in to purchase star bid packs');
      setTimeout(() => setShowError(null), 5000);
      return;
    }

    const quantity = quantities[pack.bidPacksId] || 1;
    setProcessing(pack.bidPacksId);
    setShowError(null);
    setShowSuccess(false);

    try {
      const response = await fetch('/api/star-bid-packs/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.bidPacksId,
          quantity,
          memberId,
          paymentMethod: 'Card (SumUp)',
          totalPriceEUR: (Number(pack.bidPacksPrice) || 0) * quantity
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const starsAdded = data.starsAdded ?? (pack.bidPacksStarsAmount * quantity);
        setLastPurchasedStars(starsAdded);
        setShowSuccess(true);
        setShowFireworks(true);
        
        window.dispatchEvent(new CustomEvent('starBidsPurchased', { 
          detail: { memberId, starsAdded } 
        }));
        if (data.member?.starBids != null && typeof window !== 'undefined') {
          localStorage.setItem('starBids', String(data.member.starBids));
        }
        refetch();

        // Reset quantity
        setQuantities(prev => ({ ...prev, [pack.bidPacksId]: 1 }));
      } else {
        setShowError(data.error || 'Failed to process purchase');
        setTimeout(() => setShowError(null), 5000);
      }
    } catch (error: any) {
      console.error('Error purchasing pack:', error);
      setShowError(error.message || 'Failed to process purchase');
      setTimeout(() => setShowError(null), 5000);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⭐</div>
          <p className="text-gray-500 text-lg">Loading star bid packs...</p>
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
            <Link href="/art-creation-bidding" className="text-gray-600 hover:text-black transition-colors inline-flex items-center">
              ← Back to Auction
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4">
              Star Bid Packs
            </h1>
            <p className="text-xl md:text-2xl font-script text-gray-700 mb-2">
              Get More Star Bids
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Purchase Star Bid packs to participate in exclusive art auctions.
            </p>
          </div>
        </div>
      </section>

      {/* Packs Section */}
      <section className="relative py-20 md:py-28 bg-white overflow-hidden">
        <PaintDrips variant="featured" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 text-center">
              ⚠️ {showError}
            </div>
          )}

          {!memberId && (
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-center">
              ⚠️ Please <Link href="/login" className="underline font-semibold">log in</Link> to purchase star bid packs.
            </div>
          )}

          {packs.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">⭐</div>
              <p className="text-gray-500 text-lg mb-4">No star bid packs available at this time.</p>
              <p className="text-gray-600 mb-8">
                Check back soon for new packs!
              </p>
              <Link href="/art-creation-bidding">
                <RainbowButton variant="primary">
                  Back to Auction
                </RainbowButton>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {packs.map((pack) => {
                  const quantity = quantities[pack.bidPacksId] || 1;
                  const totalStars = pack.bidPacksStarsAmount * quantity;
                  const totalPrice = pack.bidPacksPrice * quantity;
                  const isProcessing = processing === pack.bidPacksId;

                  return (
                    <div
                      key={pack._id}
                      className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all"
                    >
                      <div className="text-center mb-6">
                        <div className="text-5xl mb-3">⭐</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {pack.bidPacksName}
                        </h3>
                        {pack.bidPackDetail && (
                          <p className="text-gray-600 text-sm mb-4">
                            {pack.bidPackDetail}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-700 font-semibold">Star Bids</span>
                            <span className="text-3xl font-bold text-purple-600">
                              ⭐{totalStars.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-semibold">Price</span>
                            <span className="text-2xl font-bold text-gray-900">
                              €{totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        {memberId && (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => {
                                if (quantity > 1) {
                                  setQuantities(prev => ({ ...prev, [pack.bidPacksId]: quantity - 1 }));
                                }
                              }}
                              disabled={quantity <= 1 || isProcessing}
                              className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                            >
                              −
                            </button>
                            <span className="text-xl font-bold w-12 text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => {
                                setQuantities(prev => ({ ...prev, [pack.bidPacksId]: quantity + 1 }));
                              }}
                              disabled={isProcessing}
                              className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Purchase Button */}
                      {memberId ? (
                        <button
                          onClick={() => handlePurchase(pack)}
                          disabled={isProcessing}
                          className={`w-full px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                            isProcessing
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:shadow-lg transform hover:scale-105'
                          }`}
                        >
                          {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                              Processing...
                            </span>
                          ) : (
                            `Purchase for €${totalPrice.toFixed(2)}`
                          )}
                        </button>
                      ) : (
                        <Link href="/login" className="block">
                          <RainbowButton variant="primary" className="w-full">
                            Log In to Purchase
                          </RainbowButton>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-center">
                <Link href="/art-creation-bidding">
                  <RainbowButton variant="secondary">
                    Back to Auction
                  </RainbowButton>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Fireworks + Congrats overlay */}
      {showSuccess && showFireworks && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => {
            setShowSuccess(false);
            setShowFireworks(false);
          }}
        >
          <div className="absolute inset-0">
            <Fireworks trigger={showFireworks} duration={5000} />
          </div>
          <div
            className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-white/30 max-w-md w-full mx-4 transform animate-scaleIn"
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
                +{lastPurchasedStars.toLocaleString()} ⭐
              </p>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setShowFireworks(false);
                }}
                className="w-full bg-white text-purple-600 font-bold py-4 px-6 rounded-xl hover:bg-purple-50 transition-all duration-300 text-lg shadow-lg transform hover:scale-105"
              >
                Awesome! ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
