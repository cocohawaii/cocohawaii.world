'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import WixImage from '@/components/WixImage';
import { useAuth } from '@/components/AuthProvider';

interface CustomHatOrder {
  groupOrderId: string;
  hats: Array<{
    _id: string;
    hatForm: string | string[];
    hatColorName: string;
    hatColor?: string[];
    hatColorHex?: string;
    hatProductImage: string;
    rawHatPrice?: number;
    artStyleTag?: string[];
    gemstoneTag?: string[];
    jewelryTag?: string[];
    fabricTag?: string[];
    notes?: string;
    birthDate?: string;
    clientDescription?: string;
    IndvRawHatNAccessoryTotalLivePrice?: number;
    finalTotalPrice?: number;
  }>;
  orderDate: string;
  totalPrice: number;
  orderPaid: boolean;
  paymentMethod: string;
  shippingType: string;
}

function CustomHatOrdersContent() {
  const { member, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<CustomHatOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentReturnChecking, setPaymentReturnChecking] = useState(false);
  const [paymentReturnError, setPaymentReturnError] = useState('');
  const [paymentReturnSuccess, setPaymentReturnSuccess] = useState(false);
  const paymentReturn = searchParams?.get('payment_return') === '1';

  useEffect(() => {
    if (paymentReturn) return;
    if (!isLoading && !member) {
      window.location.href = '/login';
    }
  }, [member, isLoading, paymentReturn]);

  const fetchOrders = async () => {
    if (!member?.memberEmail) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/custom-orders/get?email=${encodeURIComponent(member.memberEmail)}`);
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!member?.memberEmail) return;
    fetchOrders();
  }, [member?.memberEmail]);

  // Handle return from SumUp 3DS redirect
  useEffect(() => {
    if (!paymentReturn || typeof window === 'undefined') return;
    const storedId = sessionStorage.getItem('custom_payment_checkout_id');
    if (!storedId) {
      setPaymentReturnError('Could not find payment session. Please check your email for confirmation or contact support.');
      return;
    }
    sessionStorage.removeItem('custom_payment_checkout_id');
    setPaymentReturnChecking(true);
    setPaymentReturnError('');

    const timeout = setTimeout(() => {
      setPaymentReturnChecking(false);
      setPaymentReturnError('Payment is taking longer than expected. Check your email for confirmation or try again.');
    }, 45000);

    const poll = async () => {
      try {
        const res = await fetch(`/api/custom/orders/check-status?checkoutId=${encodeURIComponent(storedId)}`);
        const data = await res.json();
        if (data.status === 'paid') {
          clearTimeout(timeout);
          setPaymentReturnChecking(false);
          setPaymentReturnSuccess(true);
          fetchOrders();
          window.history.replaceState({}, '', '/member/custom-orders');
          return;
        }
        if (data.status === 'failed' || data.status === 'expired') {
          clearTimeout(timeout);
          setPaymentReturnChecking(false);
          setPaymentReturnError('Payment failed or expired. Please try again.');
          return;
        }
        if (data.success === false && data.error) {
          clearTimeout(timeout);
          setPaymentReturnChecking(false);
          setPaymentReturnError(data.error || 'Could not verify payment. Please try again.');
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        setTimeout(poll, 2000);
      }
    };
    poll();
    return () => clearTimeout(timeout);
  }, [paymentReturn, member?.memberEmail]);

  if (isLoading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (paymentReturn && (paymentReturnChecking || paymentReturnError || paymentReturnSuccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-purple-50/30 to-blue-50">
        <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-xl border-2 border-purple-200 text-center">
          {paymentReturnChecking ? (
            <>
              <div className="animate-spin rounded-full h-14 w-14 border-2 border-purple-500 border-t-transparent mx-auto mb-6" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Checking payment status...</h2>
              <p className="text-gray-600">Please wait a moment.</p>
            </>
          ) : paymentReturnSuccess ? (
            <>
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payment successful!</h2>
              <p className="text-gray-600 mb-6">Your custom order is confirmed. Check your email for details.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/member/custom-orders"
                  className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                >
                  View Orders
                </Link>
                <Link
                  href="/create-your-hat"
                  className="inline-block px-6 py-3 border-2 border-purple-600 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-colors"
                >
                  Create Another Hat
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-5xl mb-6">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payment issue</h2>
              <p className="text-gray-600 mb-6">{paymentReturnError}</p>
              <Link
                href="/create-your-hat"
                className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
              >
                Back to Customizer
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Unknown date';
    }
  };

  const formatHatForm = (hatForm: string | string[]) => {
    if (Array.isArray(hatForm)) {
      return hatForm.join(', ');
    }
    return hatForm || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/member/dashboard" className="text-gray-600 hover:text-black transition-colors mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Custom Hat Orders</h1>
          <p className="text-lg text-gray-600">Your personalized hat orders</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
            <div className="text-6xl mb-6">🎨</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Custom Orders Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't created any custom hat orders yet. Start designing your perfect hat!
            </p>
            <Link
              href="/create-your-hat"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Create Your Custom Hat
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.groupOrderId}
                className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">Order {order.groupOrderId}</h3>
                      <p className="text-purple-100">Placed on {formatDate(order.orderDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">€{order.totalPrice.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            order.orderPaid
                              ? 'bg-green-500 text-white'
                              : 'bg-yellow-500 text-white'
                          }`}
                        >
                          {order.orderPaid ? 'Paid' : 'Pending'}
                        </span>
                        {order.paymentMethod && (
                          <span className="px-3 py-1 rounded-full text-sm bg-white/20 text-white">
                            {order.paymentMethod}
                          </span>
                        )}
                        {order.shippingType && (
                          <span className="px-3 py-1 rounded-full text-sm bg-white/20 text-white">
                            {order.shippingType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hats in Order */}
                <div className="p-6">
                  <div className="grid md:grid-cols-1 gap-6">
                    {order.hats.map((hat) => {
                      // Parse tags to extract details
                      const parseArtStyleTag = (tag: string) => {
                        const parts = tag.split(' | ');
                        return {
                          style: parts[0] || '',
                          colors: parts[1] && parts[1] !== '—' ? parts[1].split(', ') : [],
                          notes: parts[2] && parts[2] !== '—' ? parts[2] : '',
                          price: parts[3] || '',
                        };
                      };

                      const parseAccessoryTag = (tag: string) => {
                        const parts = tag.split(' | ');
                        return {
                          name: parts[0] || '',
                          price: parts[1] || '',
                        };
                      };

                      const artStyle = hat.artStyleTag && hat.artStyleTag.length > 0 
                        ? parseArtStyleTag(hat.artStyleTag[0]) 
                        : null;
                      const gemstone = hat.gemstoneTag && hat.gemstoneTag.length > 0 
                        ? parseAccessoryTag(String(hat.gemstoneTag[0])) 
                        : null;
                      const jewelry = hat.jewelryTag && hat.jewelryTag.length > 0 
                        ? parseAccessoryTag(String(hat.jewelryTag[0])) 
                        : null;
                      const fabric = hat.fabricTag && hat.fabricTag.length > 0 
                        ? parseAccessoryTag(String(hat.fabricTag[0])) 
                        : null;

                      return (
                        <div
                          key={hat._id}
                          className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg"
                        >
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Left Column: Customization Details */}
                            <div className="space-y-4">
                              {/* Hat Info */}
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-xl text-gray-900">
                                    {formatHatForm(hat.hatForm)} | {hat.hatColorName}
                                  </h4>
                                  {/* Hat color and color code(s) */}
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-gray-600 font-semibold">Color:</span>
                                    <span className="text-sm text-gray-700">{hat.hatColorName || '—'}</span>
                                    {(hat.hatColor && hat.hatColor.length > 0) || hat.hatColorHex ? (
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {((hat.hatColor && hat.hatColor.length > 0) ? hat.hatColor : (hat.hatColorHex ? [hat.hatColorHex] : [])).map((hex: string, idx: number) => {
                                          const code = hex.startsWith('#') ? hex : `#${hex}`;
                                          return (
                                            <div key={idx} className="flex items-center gap-1.5" title={code}>
                                              <div
                                                className="w-6 h-6 rounded border border-gray-300 shadow-sm flex-shrink-0"
                                                style={{ backgroundColor: code }}
                                              />
                                              <span className="text-xs font-mono text-gray-600">{code}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                                {hat.hatProductImage && (
                                  <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-lg overflow-hidden bg-gray-100 border-2 border-purple-200 flex-shrink-0">
                                    <WixImage
                                      src={hat.hatProductImage}
                                      alt={`${formatHatForm(hat.hatForm)} - ${hat.hatColorName}`}
                                      fill
                                      className="object-contain"
                                      sizes="(max-width: 768px) 224px, 288px"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Art Style */}
                              {artStyle && (
                                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border-2 border-pink-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Art Style</p>
                                    {artStyle.price && (
                                      <span className="text-lg font-bold text-pink-600">{artStyle.price}</span>
                                    )}
                                  </div>
                                  <p className="text-lg font-bold text-pink-700 mb-2">{artStyle.style}</p>
                                  {artStyle.colors.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-600 mb-1">Colors:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {artStyle.colors.filter(Boolean).map((color: string, idx: number) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-1 bg-white rounded-md text-xs font-semibold text-gray-700 border border-gray-300"
                                          >
                                            {color.trim()}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {artStyle.notes && (
                                    <div className="mt-2 pt-2 border-t border-pink-200">
                                      <p className="text-xs text-gray-600 mb-1">Notes:</p>
                                      <p className="text-sm text-gray-700 italic">{artStyle.notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Accessories — each from its tag (name | price) */}
                              {(gemstone || jewelry || fabric) && (
                                <div className="space-y-3">
                                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Accessories</p>
                                  
                                  {gemstone && gemstone.name && (
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Gemstone</p>
                                          <p className="text-lg font-bold text-purple-700">{gemstone.name}</p>
                                        </div>
                                        <span className="text-lg font-bold text-purple-600">{gemstone.price || '€0.00'}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {jewelry && jewelry.name && (
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Jewelry</p>
                                          <p className="text-lg font-bold text-orange-700">{jewelry.name}</p>
                                        </div>
                                        <span className="text-lg font-bold text-orange-600">{jewelry.price || '€0.00'}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {fabric && fabric.name && (
                                    <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border-2 border-green-200">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Fabric</p>
                                          <p className="text-lg font-bold text-teal-700">{fabric.name}</p>
                                        </div>
                                        <span className="text-lg font-bold text-teal-600">{fabric.price || '€0.00'}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Personal Details */}
                              {(hat.notes || hat.birthDate) && (
                                <div className="space-y-3 pt-4 border-t border-gray-200">
                                  {hat.notes && (
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                      <div className="flex items-start gap-2">
                                        <span className="text-lg">📝</span>
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Personal Notes</p>
                                          <p className="text-sm text-gray-700 italic">{hat.notes}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {hat.birthDate && (
                                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                      <div className="flex items-start gap-2">
                                        <span className="text-lg">📅</span>
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Birth Date</p>
                                          <p className="text-sm text-gray-700 font-semibold">
                                            {(() => {
                                              try {
                                                const date = new Date(hat.birthDate);
                                                return date.toLocaleDateString('en-US', { 
                                                  weekday: 'long',
                                                  year: 'numeric', 
                                                  month: 'long', 
                                                  day: 'numeric' 
                                                });
                                              } catch {
                                                return hat.birthDate;
                                              }
                                            })()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Additional Order Notes */}
                              {hat.clientDescription && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1 font-semibold">Additional Order Notes</p>
                                  <p className="text-sm text-gray-700">{hat.clientDescription}</p>
                                </div>
                              )}
                            </div>

                            {/* Right Column: Price Breakdown */}
                            <div>
                              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                                <h5 className="text-lg font-bold text-gray-900 mb-4">Price Breakdown</h5>
                                <div className="space-y-2 mb-4">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Base Hat</span>
                                    <span className="font-semibold">€{(hat.rawHatPrice || 0).toFixed(2)}</span>
                                  </div>
                                  {artStyle && artStyle.price && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Art Customization</span>
                                      <span className="font-semibold text-pink-600">{artStyle.price}</span>
                                    </div>
                                  )}
                                  {(gemstone || jewelry || fabric) && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Accessories</span>
                                      <span className="font-semibold text-purple-600">
                                        +€{(() => {
                                          const parsePrice = (p: string) => parseFloat(String(p).replace(/[€,]/g, '')) || 0;
                                          let total = 0;
                                          if (gemstone?.price) total += parsePrice(gemstone.price);
                                          if (jewelry?.price) total += parsePrice(jewelry.price);
                                          if (fabric?.price) total += parsePrice(fabric.price);
                                          return total.toFixed(2);
                                        })()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="pt-3 border-t-2 border-purple-300">
                                  <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-purple-600">
                                      €{(hat.finalTotalPrice || hat.IndvRawHatNAccessoryTotalLivePrice || 0).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomHatOrders() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <CustomHatOrdersContent />
    </Suspense>
  );
}
