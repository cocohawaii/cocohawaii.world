'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface Order {
  _id: string;
  hatOrderID?: string;
  hatOrdertitle?: string;
  hatOrderSubtitle?: string;
  hatOrderPrice?: number;
  totalFinalCost?: number;
  shippingCost?: number;
  hatOrderCreatedOn?: string | Date;
  orderAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  hatorderName?: string;
  hatorderEmail?: string;
  hatorderMobile?: string;
}

function CollectionOrdersContent() {
  const { member, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderProcessing, setShowOrderProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const searchParams = useSearchParams();
  const orderComplete = searchParams.get('orderComplete') === 'true';
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!isLoading && !member) {
      window.location.href = '/login';
    }
  }, [member, isLoading]);

  const fetchOrders = async () => {
    if (!member?.memberEmail) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/get?memberEmail=${encodeURIComponent(member.memberEmail)}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ Successfully fetched ${data.orders?.length || 0} orders`);
        setOrders(data.orders || []);
      } else {
        console.error('❌ Failed to fetch orders:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderComplete) {
      setShowOrderProcessing(true);
      // Animate through steps: 0 = Confirmed, 1 = Processing (stop at step 2)
      const stepTimings = [0, 1500]; // Only go to step 1 (Processing)
      stepTimings.forEach((delay, index) => {
        setTimeout(() => {
          setCurrentStep(index);
        }, delay);
      });
      
      // Hide processing animation after step 2 (Processing) and redirect
      setTimeout(() => {
        setShowOrderProcessing(false);
        // Refresh orders list multiple times to ensure new order appears
        fetchOrders();
        // Also refresh after a short delay to account for any CMS sync delay
        setTimeout(() => {
          console.log('🔄 Refreshing orders list again...');
          fetchOrders();
        }, 2000);
        // Remove query params for clean URL
        window.history.replaceState({}, '', '/member/collection-orders');
      }, 3000); // Reduced from 6000 to 3000 since we only go to step 2
    }
  }, [orderComplete, member?.memberEmail]);

  // Helper functions (moved outside map for reuse)
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      if ('formatted' in value && typeof value.formatted === 'string') return value.formatted;
      if ('value' in value) return safeString(value.value);
      return JSON.stringify(value);
    }
    return String(value);
  };

  const safeNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === 'object' && value !== null) {
      if ('value' in value) return safeNumber(value.value);
      if ('formatted' in value) return safeNumber(value.formatted);
    }
    return 0;
  };

  if (isLoading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const steps = [
    { icon: '✓', title: 'Order Confirmed', description: 'Your order has been received', color: 'green' },
    { icon: '⚙️', title: 'Processing', description: 'Preparing your hat for production', color: 'blue' },
    { icon: '📦', title: 'Shipping', description: 'Your hat is being packaged', color: 'purple' },
    { icon: '🚚', title: 'Out for Delivery', description: 'On its way to you!', color: 'pink' },
  ];

  // Helper function to get order status (default to "Processing" for new orders)
  // Later, admin can mark orders as "Shipped" which will show "Shipping" status
  const getOrderStatus = (order: Order): number => {
    // Check if order has a status field (will be added by admin later)
    // For now, default to step 1 (Processing) for new orders
    const orderStatus = (order as any).orderStatus || 'processing';
    
    if (orderStatus === 'shipped') return 2; // Shipping
    if (orderStatus === 'delivered') return 3; // Out for Delivery
    if (orderStatus === 'processing') return 1; // Processing
    if (orderStatus === 'confirmed') return 0; // Confirmed
    return 1; // Processing (default for new orders)
  };

  // Small order status animation component
  const OrderStatusAnimation = ({ order }: { order: Order }) => {
    const statusStep = getOrderStatus(order);
    const colorClasses = {
      green: 'from-green-400 to-emerald-500',
      blue: 'from-blue-400 to-cyan-500',
      purple: 'from-purple-400 to-violet-500',
      pink: 'from-pink-400 to-rose-500',
    };
    const textColorClasses = {
      green: 'text-green-600',
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      pink: 'text-pink-600',
    };

    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Order Status</p>
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 via-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(statusStep / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="flex justify-between items-center relative">
            {steps.map((step, index) => {
              const isActive = index <= statusStep;
              const isCurrent = index === statusStep;

              return (
                <div key={index} className="flex-1 flex flex-col items-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 transform ${
                      isActive
                        ? `bg-gradient-to-br ${colorClasses[step.color as keyof typeof colorClasses]} text-white shadow-lg scale-110 ${
                            isCurrent ? 'animate-pulse' : ''
                          }`
                        : 'bg-gray-200 text-gray-400 scale-100'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div className={`mt-2 text-center transition-all duration-500 ${
                    isActive ? 'opacity-100' : 'opacity-40'
                  }`}>
                    <h4 className={`font-bold text-xs mb-0.5 ${
                      isActive ? textColorClasses[step.color as keyof typeof textColorClasses] : 'text-gray-400'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-tight">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Calculate discount tiers based on order count
  const orderCount = orders.length;
  const discountTiers = [
    { level: 1, purchases: 1, discount: 2, name: 'VIP Member', icon: '⭐', color: 'purple', bgClass: 'from-purple-50 to-purple-100', borderClass: 'border-purple-300', textClass: 'text-purple-700', textLightClass: 'text-purple-600' },
    { level: 2, purchases: 3, discount: 5, name: 'VIP Elite', icon: '✨', color: 'blue', bgClass: 'from-blue-50 to-blue-100', borderClass: 'border-blue-300', textClass: 'text-blue-700', textLightClass: 'text-blue-600' },
    { level: 3, purchases: 5, discount: 8, name: 'VIP Premium', icon: '💎', color: 'pink', bgClass: 'from-pink-50 to-pink-100', borderClass: 'border-pink-300', textClass: 'text-pink-700', textLightClass: 'text-pink-600' },
    { level: 4, purchases: 8, discount: 11, name: 'VIP Platinum', icon: '👑', color: 'gold', bgClass: 'from-yellow-50 to-yellow-100', borderClass: 'border-yellow-300', textClass: 'text-yellow-700', textLightClass: 'text-yellow-600' },
    { level: 5, purchases: 15, discount: 14, name: 'VIP Diamond', icon: '💠', color: 'emerald', bgClass: 'from-emerald-50 to-emerald-100', borderClass: 'border-emerald-300', textClass: 'text-emerald-700', textLightClass: 'text-emerald-600' },
  ];

  // Find current tier and next tier
  const currentTier = discountTiers
    .slice()
    .reverse()
    .find(tier => orderCount >= tier.purchases) || null;
  
  const nextTier = discountTiers.find(tier => orderCount < tier.purchases);
  const progressToNext = nextTier 
    ? Math.min((orderCount / nextTier.purchases) * 100, 100)
    : 100;

  // Calculate total spent
  const totalSpent = orders.reduce((sum, order) => {
    const total = safeNumber(order.totalFinalCost) || safeNumber(order.hatOrderPrice) || 0;
    return sum + total;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/member/dashboard" className="text-gray-600 hover:text-black transition-colors mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Collection Orders</h1>
          <p className="text-lg text-gray-600">Orders from our hat collections</p>
        </div>

        {/* Order Stats */}
        {!showOrderProcessing && !loading && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Total Orders</p>
                  <p className="text-4xl font-bold">{orderCount}</p>
                </div>
                <div className="text-5xl opacity-80">🛍️</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Spent</p>
                  <p className="text-4xl font-bold">€{totalSpent.toLocaleString()}</p>
                </div>
                <div className="text-5xl opacity-80">💰</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Current Tier</p>
                  <p className="text-2xl font-bold">
                    {currentTier ? `${currentTier.name} (${currentTier.discount}% OFF)` : 'Member'}
                  </p>
                </div>
                <div className="text-5xl opacity-80">{currentTier?.icon || '👤'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Discount Tiers Section */}
        {!showOrderProcessing && !loading && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your VIP Discount Tiers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discountTiers.map((tier) => {
                const isUnlocked = orderCount >= tier.purchases;
                const isCurrent = currentTier?.level === tier.level;
                const purchasesNeeded = tier.purchases - orderCount;
                
                return (
                  <div
                    key={tier.level}
                    className={`rounded-2xl p-6 border-2 transition-all duration-300 transform ${
                      isUnlocked
                        ? `bg-gradient-to-br ${tier.bgClass} ${tier.borderClass} shadow-lg ${
                            isCurrent ? 'ring-4 ring-purple-300 scale-105' : 'hover:scale-105'
                          }`
                        : 'bg-gray-100 border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`text-4xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                        {tier.icon}
                      </div>
                      {isUnlocked ? (
                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-400 text-white rounded-full text-xs font-bold">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isUnlocked ? tier.textClass : 'text-gray-500'}`}>
                      {tier.name}
                    </h3>
                    <p className={`text-3xl font-bold mb-2 ${isUnlocked ? tier.textLightClass : 'text-gray-400'}`}>
                      {tier.discount}% OFF
                    </p>
                    {isUnlocked ? (
                      <p className="text-sm text-gray-600">
                        ✓ Unlocked at {tier.purchases} {tier.purchases === 1 ? 'purchase' : 'purchases'}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {purchasesNeeded} more {purchasesNeeded === 1 ? 'purchase' : 'purchases'} needed
                      </p>
                    )}
                    {isCurrent && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <p className="text-xs font-semibold text-purple-600">✓ ACTIVE DISCOUNT</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress to Next Tier */}
            {nextTier && (
              <div className="mt-6 bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    Progress to {nextTier.name} ({nextTier.discount}% OFF)
                  </h3>
                  <span className="text-sm font-semibold text-purple-600">
                    {orderCount} / {nextTier.purchases} purchases
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {nextTier.purchases - orderCount} more {nextTier.purchases - orderCount === 1 ? 'purchase' : 'purchases'} to unlock {nextTier.discount}% discount!
                </p>
              </div>
            )}

            {/* Current Active Discount Info */}
            {currentTier && (
              <div className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">Your Active Discount</p>
                    <p className="text-3xl font-bold">{currentTier.name} - {currentTier.discount}% OFF</p>
                    <p className="text-purple-100 text-sm mt-2">
                      This discount will be available at checkout for all new purchases
                    </p>
                  </div>
                  <div className="text-6xl opacity-80">{currentTier.icon}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Processing Animation */}
        {showOrderProcessing && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-3xl shadow-2xl p-12 border-4 border-purple-300 relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-blue-400/10 animate-gradient-shift" />
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    Your Order is Being Processed!
                  </h2>
                  {orderId && (
                    <p className="text-gray-600 text-lg">Order ID: <span className="font-bold text-purple-600">{orderId}</span></p>
                  )}
                </div>

                {/* Step Progress */}
                <div className="flex justify-between items-center mb-12 relative">
                  {/* Progress Line */}
                  <div className="absolute top-8 left-0 right-0 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 via-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    />
                  </div>

                  {steps.map((step, index) => {
                    const isActive = index <= currentStep;
                    const isCurrent = index === currentStep;
                    const colorClasses = {
                      green: 'from-green-400 to-emerald-500',
                      blue: 'from-blue-400 to-cyan-500',
                      purple: 'from-purple-400 to-violet-500',
                      pink: 'from-pink-400 to-rose-500',
                    };
                    const textColorClasses = {
                      green: 'text-green-600',
                      blue: 'text-blue-600',
                      purple: 'text-purple-600',
                      pink: 'text-pink-600',
                    };

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center relative z-10">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold transition-all duration-500 transform ${
                            isActive
                              ? `bg-gradient-to-br ${colorClasses[step.color as keyof typeof colorClasses]} text-white shadow-2xl scale-110 ${
                                  isCurrent ? 'animate-pulse-ring' : ''
                                }`
                              : 'bg-gray-200 text-gray-400 scale-100'
                          }`}
                        >
                          {step.icon}
                        </div>
                        <div className={`mt-4 text-center transition-all duration-500 ${
                          isActive ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2'
                        }`}>
                          <h3 className={`font-bold text-lg mb-1 ${
                            isActive ? textColorClasses[step.color as keyof typeof textColorClasses] : 'text-gray-500'
                          }`}>
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Current Step Highlight */}
                {currentStep < steps.length && (
                  <div className="text-center animate-fade-in">
                    <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border-2 border-purple-200">
                      <p className="text-xl font-semibold text-gray-800">
                        {steps[currentStep].title}...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        {!showOrderProcessing && !loading && (
          <>
            {orders.length > 0 ? (
              <div className="space-y-6">
                {orders.map((order) => {
                  // Handle date - Wix might return it as an object with formatted property or as a Date/string
                  let orderDate = 'Unknown date';
                  try {
                    if (order.hatOrderCreatedOn) {
                      if (typeof order.hatOrderCreatedOn === 'object' && order.hatOrderCreatedOn !== null && !(order.hatOrderCreatedOn instanceof Date)) {
                        // If it's an object (but not Date), check for formatted property
                        if ('formatted' in order.hatOrderCreatedOn) {
                          const formatted = (order.hatOrderCreatedOn as any).formatted;
                          // Ensure formatted is a string, not an object
                          if (typeof formatted === 'string') {
                            orderDate = formatted;
                          } else {
                            // If formatted is an object or anything else, convert to string or use fallback
                            orderDate = new Date(order.hatOrderCreatedOn as any).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            });
                          }
                        } else {
                          // Try to convert object to date string
                          orderDate = new Date(order.hatOrderCreatedOn as any).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          });
                        }
                      } else if (order.hatOrderCreatedOn instanceof Date) {
                        // If it's a Date object
                        orderDate = order.hatOrderCreatedOn.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        });
                      } else if (typeof order.hatOrderCreatedOn === 'string') {
                        // If it's a string, parse it
                        orderDate = new Date(order.hatOrderCreatedOn).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        });
                      }
                    }
                  } catch (error) {
                    console.error('Error formatting date:', error);
                    orderDate = 'Unknown date';
                  }
                  
                  
                  // Ensure all values are safe to render
                  const safeOrder = {
                    hatOrdertitle: safeString(order.hatOrdertitle) || 'Hat Order',
                    hatOrderSubtitle: order.hatOrderSubtitle ? safeString(order.hatOrderSubtitle) : undefined,
                    hatOrderID: safeString(order.hatOrderID) || 'N/A',
                    totalFinalCost: safeNumber(order.totalFinalCost) || safeNumber(order.hatOrderPrice) || 0,
                    hatOrderPrice: safeNumber(order.hatOrderPrice) || 0,
                    orderAddress: order.orderAddress ? safeString(order.orderAddress) : undefined,
                    shippingCity: order.shippingCity ? safeString(order.shippingCity) : undefined,
                    shippingCountry: order.shippingCountry ? safeString(order.shippingCountry) : undefined,
                  };
                  
                  return (
                    <div
                      key={order._id}
                      className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                              🎩
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                {safeOrder.hatOrdertitle}
                              </h3>
                              {safeOrder.hatOrderSubtitle && (
                                <p className="text-gray-600">{safeOrder.hatOrderSubtitle}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Order ID</p>
                              <p className="font-semibold text-purple-600">{safeOrder.hatOrderID}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Date</p>
                              <p className="font-semibold text-gray-900">{orderDate}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Total</p>
                              <p className="font-bold text-green-600 text-lg">
                                €{safeOrder.totalFinalCost || safeOrder.hatOrderPrice || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Status</p>
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                Confirmed
                              </span>
                            </div>
                          </div>

                          {safeOrder.orderAddress && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm text-gray-500 mb-1">Shipping Address</p>
                              <p className="text-gray-900">
                                {safeOrder.orderAddress}
                                {safeOrder.shippingCity && `, ${safeOrder.shippingCity}`}
                                {safeOrder.shippingCountry && `, ${safeOrder.shippingCountry}`}
                              </p>
                            </div>
                          )}

                          {/* Order Status Animation */}
                          <OrderStatusAnimation order={order} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
                <div className="text-6xl mb-6">🛍️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No Collection Orders Yet</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You haven't placed any orders from our collections yet. Browse our exclusive hand-designed hats!
                </p>
                <Link
                  href="/collections"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Browse Collections
                </Link>
              </div>
            )}
          </>
        )}

        {/* Loading State */}
        {loading && !showOrderProcessing && (
          <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollectionOrders() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <CollectionOrdersContent />
    </Suspense>
  );
}
