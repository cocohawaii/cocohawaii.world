'use client';

import { useState, useEffect, useRef } from 'react';
import WixImage from './WixImage';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Hat } from '@/lib/wix-types';
import { convertWixVideoUrl } from '@/lib/wix-utils';
import RainbowButton from './RainbowButton';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import SizeChartModal from './SizeChartModal';
import dynamic from 'next/dynamic';
import Fireworks from './Fireworks';

// Dynamically import PaymentPopup with SSR disabled to prevent context errors
const PaymentPopup = dynamic(() => import('./PaymentPopup'), {
  ssr: false,
});

interface HatProductPageProps {
  hat: Hat;
}

export default function HatProductPage({ hat }: HatProductPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Store PR referral ID if present in URL and track visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prParam = searchParams?.get('pr');
      if (prParam) {
        localStorage.setItem('prReferralId', prParam);
        console.log('🔗 PR Referral ID detected and stored in product page:', prParam);
        
        // Track visit for this PR link
        const currentUrl = window.location.href;
        const visitKey = `prVisit_${prParam}_${currentUrl}`;
        const visitTimestamp = Date.now();
        
        // Check if we've already tracked this visit in this session (to avoid double counting)
        const sessionKey = `prVisitSession_${visitKey}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, 'true');
          
          // Store visit in localStorage (for PR dashboard to read)
          try {
            const visitsKey = `prVisits_${prParam}`;
            const existingVisits = localStorage.getItem(visitsKey);
            const visits = existingVisits ? JSON.parse(existingVisits) : {};
            
            // Increment visit count for this specific URL
            visits[currentUrl] = (visits[currentUrl] || 0) + 1;
            visits[`${currentUrl}_lastVisit`] = visitTimestamp;
            
            localStorage.setItem(visitsKey, JSON.stringify(visits));
            console.log('📊 PR visit tracked:', { prParam, url: currentUrl, count: visits[currentUrl] });
          } catch (error) {
            console.error('Error tracking PR visit:', error);
          }
        }
      }
    }
  }, [searchParams]);
  const [selectedSize] = useState<string>(hat.hatSize || '');
  const [shippingOption, setShippingOption] = useState<string>('');
  const [shippingPrice, setShippingPrice] = useState<number>(0);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'materials'>('details');
  const [showCompletePayment, setShowCompletePayment] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [runwayInfo, setRunwayInfo] = useState<{ isRunwayCollection: boolean; runwayTitle?: string } | null>(null);

  useEffect(() => {
    if (hat._id) {
      fetch(`/api/hats/runway-check?wixId=${encodeURIComponent(hat._id)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.isRunwayCollection) {
            setRunwayInfo({ isRunwayCollection: true, runwayTitle: d.runwayTitle });
          } else {
            setRunwayInfo({ isRunwayCollection: false });
          }
        })
        .catch(() => setRunwayInfo({ isRunwayCollection: false }));
    }
  }, [hat._id]);

  // Debug: Log image URLs and full hat object
  useEffect(() => {
    console.log('🔍 FULL HAT OBJECT:', hat);
    console.log('📸 Hat main image URL:', hat.mainHatImage);
    console.log('📸 Hat top video URL:', hat.topVideoEyes);
    console.log('📸 mainHatImage type:', typeof hat.mainHatImage);
    console.log('📸 mainHatImage truthy?', !!hat.mainHatImage);
    console.log('📸 topVideoEyes truthy?', !!hat.topVideoEyes);
  }, [hat]);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  const productPrice = hat.discountedPrice && hat.discountedPrice !== 0
    ? hat.discountedPrice
    : hat.price;

  const isSold = hat.isSold === true;
  const totalPrice = productPrice + shippingPrice;

  const handleShippingChange = (value: string) => {
    setShippingOption(value);
    const price = parseFloat(value.replace('€', ''));
    setShippingPrice(price);
  };

  const handleOrderNow = () => {
    setShowPaymentPopup(true);
  };

  const handlePaymentComplete = async (orderData: any) => {
    // Order is already created in PaymentPopup, so we just handle UI updates here
    try {
      // Use the orderId from orderData (already created in PaymentPopup)
      const orderId = orderData.orderId || orderData.hatOrderID;
      
      setOrderId(orderId);
      setShowPaymentPopup(false);
      setOrderComplete(true);
      setShowFireworks(true);
      
      // Redirect to Collection Orders page after animation completes (3 seconds - goes to step 2)
      setTimeout(() => {
        router.push('/member/collection-orders?orderComplete=true&orderId=' + orderId);
      }, 3000);
      
      // Reset form fields
      setName('');
      setEmail('');
      setMobile('');
      setShippingAddress('');
    } catch (error) {
      console.error('Error handling payment complete:', error);
      // Still show success UI even if there's an error
      setShowPaymentPopup(false);
      setOrderComplete(true);
      setShowFireworks(true);
    }
  };

  const handleCustomizeHat = () => {
    // Redirect to customizer with base hat info
    const params = new URLSearchParams({
      baseHatId: hat._id,
      basePrice: productPrice.toString(),
      baseHatName: hat.title || '',
      baseHatImage: hat.mainHatImage || '',
    });
    router.push(`/create-your-hat?${params.toString()}`);
  };

  const handleFinalOrder = async () => {
    if (!name || !email || !mobile) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          hatorderName: name,
          hatorderEmail: email,
          hatorderMobile: mobile,
          hatorderCustomAsk: additionalDescription,
          hatOrderPrice: hat.price,
          hatOrderSubtitle: hat.hatSubtitle || '',
          hatOrdertitle: hat.title,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setOrderId(result.orderId);
        setShowShippingForm(true);
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const handleShippingSubmit = async () => {
    if (!shippingAddress) {
      alert('Please enter your shipping address.');
      return;
    }

    if (!orderId) {
      alert('Order not found. Please try again.');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          orderId: orderId,
          shippingCost: shippingPrice,
          totalFinalCost: totalPrice,
          orderAddress: shippingAddress,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowPayment(true);
      } else {
        throw new Error(result.error || 'Failed to update shipping information');
      }
    } catch (error: any) {
      console.error('Error updating order:', error);
      alert('Failed to update shipping information. Please try again.');
    }
  };

  const handlePaymentSuccess = async () => {
    setOrderComplete(true);
    setTimeout(() => {
      window.location.href = '/thank-you';
    }, 2000);
  };

  const handlePayNow = () => {
    setShowCompletePayment(true);
    setTimeout(() => {
      setShowCompletePayment(false);
    }, 5000);
  };

  const galleryImages = hat.gallery || [];

  // Video refs and state
  const topVideoRef = useRef<HTMLVideoElement>(null);
  const makingOfVideoRef = useRef<HTMLVideoElement>(null);
  const [isTopVideoMuted, setIsTopVideoMuted] = useState(true);
  const [isMakingOfMuted, setIsMakingOfMuted] = useState(true);
  const [topVideoUrl, setTopVideoUrl] = useState<string>('');
  const [makingOfVideoUrl, setMakingOfVideoUrl] = useState<string>('');

  // Convert Wix video URLs - try direct URL first, fallback to proxy if needed
  useEffect(() => {
    if (hat.topVideoEyes) {
      // First convert the URL (fixes double encoding)
      let converted = convertWixVideoUrl(hat.topVideoEyes);
      // Ensure we decode any remaining double-encoding
      try {
        converted = converted.replace(/%25([0-9A-F]{2})/gi, (match, hex) => {
          return '%' + hex;
        });
      } catch (e) {
        console.warn('Error fixing encoding:', e);
      }
      // Try direct URL first (might work if video is public)
      // If it fails, we'll fallback to proxy in the error handler
      setTopVideoUrl(converted);
      console.log('🎥 Top video URL (direct):', hat.topVideoEyes, '->', converted);
    }
    if (hat.makingOfProductPage) {
      let converted = convertWixVideoUrl(hat.makingOfProductPage);
      try {
        converted = converted.replace(/%25([0-9A-F]{2})/gi, (match, hex) => {
          return '%' + hex;
        });
      } catch (e) {
        console.warn('Error fixing encoding:', e);
      }
      setMakingOfVideoUrl(converted);
      console.log('🎥 Making of video URL (direct):', hat.makingOfProductPage, '->', converted);
    }
  }, [hat.topVideoEyes, hat.makingOfProductPage]);

  // Auto-play videos when component mounts (matching the working guide)
  useEffect(() => {
    if (topVideoRef.current && topVideoUrl) {
      topVideoRef.current.play().catch(() => {});
    }
    if (makingOfVideoRef.current && makingOfVideoUrl) {
      makingOfVideoRef.current.play().catch(() => {});
    }
  }, [topVideoUrl, makingOfVideoUrl]);

  return (
    <>
      <Fireworks trigger={showFireworks} duration={3000} />
    <div className="min-h-screen bg-white">
      {/* Elegant Top Header Section */}
      <section className="relative w-full bg-white overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex flex-col md:flex-row gap-8 items-center">
            
            {/* Left Section - Video (Smaller) */}
            <div className="relative w-full md:max-w-4xl">
              {topVideoUrl ? (
                <div 
                  className="relative overflow-hidden bg-black cursor-pointer group"
                  onClick={() => {
                    if (topVideoRef.current) {
                      setIsTopVideoMuted(!isTopVideoMuted);
                      topVideoRef.current.muted = !isTopVideoMuted;
                      if (topVideoRef.current.paused) {
                        topVideoRef.current.play().catch(() => {});
                      }
                    }
                  }}
                >
                  {/* Video Container - Smaller dimensions */}
                  <div style={{ aspectRatio: '16/9', minHeight: '400px' }} className="relative w-full">
                    <video
                      ref={topVideoRef}
                      src={topVideoUrl}
                      className="w-full h-full object-cover pointer-events-none"
                      preload="auto"
                      playsInline
                      autoPlay
                      loop
                      muted={isTopVideoMuted}
                      controls={false}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('❌ Top video error:', e);
                        console.error('   Video URL:', topVideoUrl);
                        const video = e.currentTarget;
                        console.error('   Video error code:', video.error?.code);
                        console.error('   Video error message:', video.error?.message);
                        
                        // Try proxy as fallback if direct URL fails
                        if (!topVideoUrl.startsWith('/api/wix-video-proxy')) {
                          const converted = convertWixVideoUrl(hat.topVideoEyes);
                          let decodedForEncoding: string;
                          try {
                            decodedForEncoding = decodeURIComponent(converted);
                          } catch {
                            decodedForEncoding = converted;
                          }
                          const proxyUrl = `/api/wix-video-proxy?url=${encodeURIComponent(decodedForEncoding)}`;
                          console.log('🔄 Trying proxy fallback:', proxyUrl);
                          setTopVideoUrl(proxyUrl);
                        }
                      }}
                      onLoadStart={() => {
                        console.log('📹 Top video loading:', topVideoUrl);
                      }}
                      onCanPlay={() => {
                        console.log('✅ Top video can play');
                      }}
                      onLoadedData={() => {
                        console.log('✅ Top video data loaded');
                      }}
                    />
                    
                    {/* Mute/Unmute Indicator */}
                    <div className="absolute top-4 right-4 bg-black/60 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      {isTopVideoMuted ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden bg-black" style={{ aspectRatio: '16/9', minHeight: '400px' }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Video coming soon</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Section - Text and Hat (Overlapping Video, Moved More Right) */}
            <div className="relative flex-shrink-0 md:absolute md:-right-16 lg:-right-32 xl:-right-48 md:top-1/2 md:-translate-y-1/2 z-10 w-full md:w-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                
                {/* Text Section - Left Aligned, Overlapping Video */}
                <div className="relative bg-white/95 backdrop-blur-sm px-6 py-8 md:-ml-32 md:pl-8">
                  <div className="space-y-6">
                    {/* Brand Logo */}
                    <div className="mb-6">
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-left">
                        <span className="text-black">COCO</span>
                        <br />
                        <span className="text-black">HAWAII</span>
                      </h1>
                      
                      {/* Beautiful Rainbow/Gold Underline */}
                      <div className="relative w-32 md:w-44 h-1 my-6 text-left">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-500 via-purple-500 to-teal-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Elegant Script Text - Left Aligned */}
                    <div className="space-y-4 font-serif text-left">
                      <p className="text-xl md:text-2xl lg:text-3xl text-black font-medium italic leading-relaxed">
                        Hand-Designed Hats
                      </p>
                      <p className="text-base md:text-lg lg:text-xl text-black/90 font-light italic leading-relaxed">
                        Made With Passion, Art & Love.
                      </p>
                      <p className="text-base md:text-lg lg:text-xl text-black/90 font-light italic leading-relaxed">
                        Finesse & Savage Elegance
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hat Image - Right Side */}
                <div className="relative flex-shrink-0">
                  {hat.mainHatImage ? (
                    <div className="relative w-48 md:w-64 aspect-square">
                      <WixImage
                        src={hat.mainHatImage}
                        alt={hat.title || 'Coco Hawaii Hat'}
                        fill
                        className="object-contain drop-shadow-lg"
                        sizes="(max-width: 768px) 192px, 256px"
                      />
                      {isSold && (
                        <span
                          className="absolute top-2 right-2 text-xl font-black tracking-wider px-2 py-1 rounded"
                          style={{
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                          }}
                        >
                          SOLD
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-48 md:w-64 aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-gray-400 text-sm">Hat Image</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Product Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: Main Product Image/Video */}
            <div className="space-y-6">
              {/* Always try to show mainHatImage first - same as collections page */}
              {hat.mainHatImage && hat.mainHatImage.trim() ? (
                <div className="relative h-[600px] w-full rounded-lg overflow-hidden shadow-2xl bg-gray-100">
                  <WixImage
                    src={hat.mainHatImage}
                    alt={hat.title || 'Hat image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : topVideoUrl ? (
                <div className="relative h-[600px] w-full rounded-lg overflow-hidden shadow-2xl bg-gray-100">
                  {isSold && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <span
                        className="text-5xl md:text-6xl font-black tracking-wider"
                        style={{
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          transform: 'rotate(-12deg)',
                          textShadow: '2px 2px 0 rgba(0,0,0,0.6), -1px -1px 0 rgba(0,0,0,0.6), 0 0 12px rgba(0,0,0,0.4)',
                        }}
                      >
                        SOLD
                      </span>
                    </div>
                  )}
                  <video
                    src={topVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    preload="auto"
                    controls={false}
                  />
                </div>
              ) : (
                <div className="relative h-[600px] w-full rounded-lg overflow-hidden shadow-2xl bg-gray-100 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">Image coming soon</p>
                    <p className="text-xs text-gray-400">mainHatImage: {hat.mainHatImage ? `"${String(hat.mainHatImage).substring(0, 50)}"` : 'MISSING'}</p>
                    <p className="text-xs text-gray-400">topVideoEyes: {hat.topVideoEyes ? 'EXISTS' : 'MISSING'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Brand Icon & Title */}
              <div>
                <div className="text-3xl mb-2">🌴</div>
                <div className="text-sm text-gray-600 mb-2">COCO HAWAII</div>
                {runwayInfo?.isRunwayCollection && (
                  <Link
                    href="/runway-collection"
                    className="inline-block px-3 py-1 rounded-full bg-purple-600 text-white text-sm font-bold mb-3 hover:bg-purple-700 transition-colors"
                  >
                    Runway Collection{runwayInfo.runwayTitle ? ` · ${runwayInfo.runwayTitle}` : ''}
                  </Link>
                )}
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">{hat.title}</h1>
                <p className="text-lg text-gray-700 mb-2">
                  Hand-Designed Hats Made With Passion, Art & Love.
                </p>
                <p className="text-lg text-gray-700 font-script italic">
                  Finesse & Savage Elegance
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-gray-900">
                  €{productPrice}
                </span>
                {hat.discountedPrice && hat.discountedPrice !== 0 && (
                  <span className="text-2xl text-gray-500 line-through">
                    €{hat.price}
                  </span>
                )}
              </div>

              {/* Subtitle */}
              {hat.hatSubtitle && (
                <p className="text-xl text-gray-700 font-script">{hat.hatSubtitle}</p>
              )}

              {/* Size Selection */}
              {hat.hatSize && (
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="bg-black text-white px-6 py-3 rounded-lg font-semibold">
                      SIZE {selectedSize}
                    </div>
                    <button
                      onClick={() => setShowSizeChart(true)}
                      className="text-gray-600 hover:text-black underline text-sm cursor-pointer"
                    >
                      View Size Chart →
                    </button>
                  </div>
                </div>
              )}

              {/* Order Now Button */}
              {!showOrderForm && !showShippingForm && !showPayment && (
                <div className="pt-4 space-y-3">
                  {isSold ? (
                    <div className="space-y-3">
                      <div className="relative group/sold">
                        <div
                          className="w-full text-lg py-4 px-6 rounded-lg font-semibold cursor-not-allowed opacity-70 bg-gray-200 text-gray-600 border-2 border-gray-300"
                        >
                          Order Now
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-6 py-4 rounded-xl shadow-2xl opacity-0 invisible group-hover/sold:opacity-100 group-hover/sold:visible transition-all duration-200 z-50 min-w-[220px]">
                          <div
                            className="bg-gradient-to-br from-pink-400 via-purple-500 to-cyan-400 p-[2px] rounded-xl"
                          >
                            <div className="bg-white px-6 py-4 rounded-[10px] text-center">
                              <p className="text-lg font-bold text-gray-900">This unique item has been sold</p>
                              <p className="text-sm text-gray-600 mt-1">Thank you for your interest!</p>
                              <button
                                onClick={handleCustomizeHat}
                                className="mt-3 w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                              >
                                Create Custom Hat
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleCustomizeHat}
                        className="w-full text-lg py-4 px-6 bg-white border-2 border-purple-500 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Create One Similar
                      </button>
                    </div>
                  ) : (
                    <>
                      <RainbowButton
                        onClick={handleOrderNow}
                        className="w-full text-lg py-4"
                      >
                        Order Now
                      </RainbowButton>
                      <button
                        onClick={handleCustomizeHat}
                        className="w-full text-lg py-4 px-6 bg-white border-2 border-purple-500 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Customize This Hat
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Order Form - Input Fields */}
              {showOrderForm && !showShippingForm && !showPayment && (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Mobile *</label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Additional Description</label>
                    <textarea
                      value={additionalDescription}
                      onChange={(e) => setAdditionalDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={4}
                      placeholder="Tell us more about your custom preferences..."
                    />
                  </div>

                  {/* Shipping Options */}
                  <div className="pt-4">
                    <label className="block text-sm font-semibold mb-3">Shipping Options</label>
                    <div className="space-y-3">
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        shippingOption === '€15' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="shipping"
                          value="€15"
                          checked={shippingOption === '€15'}
                          onChange={(e) => handleShippingChange(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-semibold">Standard Shipping - €15</div>
                          <div className="text-sm text-gray-600">5-7 business days</div>
                        </div>
                      </label>
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        shippingOption === '€35' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="shipping"
                          value="€35"
                          checked={shippingOption === '€35'}
                          onChange={(e) => handleShippingChange(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-semibold">Express Shipping - €35</div>
                          <div className="text-sm text-gray-600">2-3 business days</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Price:</span>
                      <span className="font-semibold">€{productPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-semibold">€{shippingPrice || 0}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>€{totalPrice || productPrice}</span>
                    </div>
                  </div>

                  <RainbowButton
                    onClick={handleFinalOrder}
                    className="w-full text-lg py-4"
                    disabled={!shippingOption}
                  >
                    Continue to Shipping Address
                  </RainbowButton>
                </div>
              )}

              {/* Shipping Address Form */}
              {showShippingForm && !showPayment && (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <h2 className="text-2xl font-semibold mb-4">Shipping Address</h2>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2">Shipping Address *</label>
                    <textarea
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={5}
                      placeholder="Enter your complete shipping address..."
                      required
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="pt-4 border-t border-gray-200 space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Price:</span>
                      <span className="font-semibold">€{productPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-semibold">€{shippingPrice}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>€{totalPrice}</span>
                    </div>
                  </div>

                  <RainbowButton
                    onClick={handleShippingSubmit}
                    className="w-full text-lg py-4"
                    disabled={!shippingAddress}
                  >
                    Continue to Payment
                  </RainbowButton>
                </div>
              )}

              {/* Payment Options */}
              {showPayment && (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <h2 className="text-2xl font-semibold mb-4">Payment Options</h2>
                  
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'Visa/Mastercard' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="Visa/Mastercard"
                        checked={paymentMethod === 'Visa/Mastercard'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <span className="font-semibold">Visa/Mastercard</span>
                    </label>
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'PayPal' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="PayPal"
                        checked={paymentMethod === 'PayPal'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <span className="font-semibold">PayPal</span>
                    </label>
                  </div>

                  {/* Price Summary */}
                  <div className="pt-4 border-t border-gray-200 space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Price:</span>
                      <span className="font-semibold">€{productPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-semibold">€{shippingPrice}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>€{totalPrice}</span>
                    </div>
                  </div>

                  {paymentMethod === 'PayPal' && (
                    <div className="pt-4">
                      <PayPalScriptProvider
                        options={{
                          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
                          currency: 'EUR',
                        }}
                      >
                        <PayPalButtons
                          createOrder={(data, actions) => {
                            return actions.order.create({
                              intent: 'CAPTURE',
                              purchase_units: [
                                {
                                  amount: {
                                    value: totalPrice.toFixed(2),
                                    currency_code: 'EUR',
                                  },
                                },
                              ],
                            });
                          }}
                          onApprove={(data, actions) => {
                            return actions.order!.capture().then((details) => {
                              handlePayNow();
                              setTimeout(() => {
                                handlePaymentSuccess();
                              }, 2000);
                            });
                          }}
                          onError={(err) => {
                            console.error('PayPal error:', err);
                            alert('Payment failed. Please try again.');
                          }}
                        />
                      </PayPalScriptProvider>
                    </div>
                  )}

                  {paymentMethod === 'Visa/Mastercard' && (
                    <div className="pt-4">
                      <RainbowButton
                        onClick={handlePayNow}
                        className="w-full text-lg py-4"
                      >
                        Pay Now
                      </RainbowButton>
                    </div>
                  )}

                  {showCompletePayment && (
                    <div className="mt-4 bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center animate-fade-in">
                      <div className="text-4xl mb-2">✓</div>
                      <h3 className="text-xl font-semibold text-green-800 mb-2">
                        Processing Payment...
                      </h3>
                      <p className="text-gray-600">
                        Your payment is being processed. Please wait.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Order Complete */}
              {orderComplete && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-2 border-green-500 rounded-lg p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-transparent to-green-400/10 animate-pulse" />
                    <div className="relative z-10">
                      <div className="text-6xl mb-4 animate-bounce">✓</div>
                      <h3 className="text-3xl font-semibold text-green-800 mb-2 animate-fade-in">
                        Order Complete!
                      </h3>
                      <p className="text-gray-600 text-lg animate-fade-in">
                        Thank you for your order. Redirecting to your orders...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Details/Materials/Size Chart Tabs */}
              <div className="pt-8 border-t border-gray-200">
                <div className="flex gap-2 mb-6 flex-wrap">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      activeTab === 'details'
                        ? 'bg-orange-500 text-white border-2 border-orange-500'
                        : 'bg-white text-gray-700 border-2 border-purple-500'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      activeTab === 'materials'
                        ? 'bg-orange-500 text-white border-2 border-orange-500'
                        : 'bg-white text-gray-700 border-2 border-purple-500'
                    }`}
                  >
                    Materials
                  </button>
                  <button
                    onClick={() => setShowSizeChart(true)}
                    className="px-6 py-3 rounded-lg font-semibold transition-all bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400"
                  >
                    Size Chart
                  </button>
                </div>

                {activeTab === 'details' && (
                  <div className="border-2 border-orange-500 rounded-lg p-6 bg-orange-50">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">🎩</div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">A Unique Hat | Luxury</h3>
                        <p className="text-gray-700 leading-relaxed">
                          {hat.hatDescription || 'Made with premium quality suede, passionate craftsmanship & divine intervention. Each piece is hand-designed with meticulous attention to detail, ensuring you receive a one-of-a-kind masterpiece that reflects your unique style and personality.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'materials' && (
                  <div className="border-2 border-purple-500 rounded-lg p-6 bg-purple-50">
                    <h3 className="text-xl font-semibold mb-2">Premium Materials</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Our hats are crafted using only the finest materials, including premium suede, 
                      exotic accessories, and hand-selected embellishments. Each component is carefully 
                      chosen to ensure durability, comfort, and unmatched elegance.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-5 gap-6">
              {galleryImages.slice(0, 5).map((image, index) => (
                <div key={index} className="relative h-64 w-full rounded-lg overflow-hidden shadow-lg">
                  <WixImage
                    src={image.src}
                    alt={image.alt || `${hat.title} - Image ${index + 1}`}
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 20vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Making Of Video - This section is now handled in the KEY FEATURES section below */}

      {/* Key Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-black mb-4">KEY FEATURES</h2>
            <p className="text-2xl text-gray-700 mb-2">What's Unique About CocoHawaii Hats?</p>
            <p className="text-xl font-script text-gray-800 mb-4">Style & Savage Elegance</p>
            <p className="text-3xl font-script text-gray-800">Love. Art. Passion.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column - Pushed more to the left */}
            <div className="space-y-8 md:col-span-1">
              <div>
                <div className="text-4xl mb-3">🎩</div>
                <h3 className="text-2xl font-bold mb-3">Premium Quality Hats</h3>
                <p className="text-gray-700 leading-relaxed">
                  Choose your preferred shape and color from a wide collection of the finest suede hats on the market. 
                  Each piece uses top-of-the-line materials and are precisely molded by skilled & dedicated craftsmen.
                </p>
              </div>

              <div>
                <div className="text-4xl mb-3">💝</div>
                <h3 className="text-2xl font-bold mb-3">A Personal Touch</h3>
                <p className="text-gray-700 leading-relaxed">
                  Imagine anything you love. Anything you represent. Tell us more about you and our renowned artists 
                  will make magic happen on your COCOHAWAII hat.
                </p>
              </div>
            </div>

            {/* Middle Column - Pushed more to the left */}
            <div className="space-y-8 md:col-span-1">
              <div>
                <div className="text-4xl mb-3">✨</div>
                <h3 className="text-2xl font-bold mb-3">Hand-Designed Pieces</h3>
                <p className="text-gray-700 leading-relaxed">
                  Inspired by life, our artists beautify and embellish every hat with art, jewels and exotic accessories 
                  for a one-of-a-kind style & savage elegance. Choose from already-made COCOHAWAII hats or get a custom 
                  piece that is unique to you!
                </p>
              </div>

              <div>
                <div className="text-4xl mb-3">🚚</div>
                <h3 className="text-2xl font-bold mb-3">Production Time, Shipping & Delivery</h3>
                <p className="text-gray-700 leading-relaxed">
                  CocoHawaii provides global shipping options that are fast and easy. Ready-made Hats from CocoHawaii are 
                  shipped instantly and delivered in under 1-5 days worldwide. New custom hats can take up to 14 days to 
                  be crafted, embellished and delivered.
                </p>
              </div>
            </div>

            {/* Right Column - Video */}
            <div className="md:col-span-1">
              {makingOfVideoUrl ? (
                <div className="sticky top-8">
                  <div 
                    className="rounded-2xl overflow-hidden bg-black w-full max-w-sm mx-auto relative cursor-pointer group"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (makingOfVideoRef.current) {
                        setIsMakingOfMuted(!isMakingOfMuted);
                        makingOfVideoRef.current.muted = !isMakingOfMuted;
                        if (makingOfVideoRef.current.paused) {
                          makingOfVideoRef.current.play().catch(() => {});
                        }
                      }
                    }}
                  >
                    <div style={{ aspectRatio: '9/16' }} className="relative">
                      <video
                        ref={makingOfVideoRef}
                        src={makingOfVideoUrl}
                        className="w-full h-full rounded-2xl object-cover pointer-events-none"
                        preload="auto"
                        playsInline
                        autoPlay
                        loop
                        muted={isMakingOfMuted}
                        controls={false}
                      />
                      
                      {/* Sound indicator overlay */}
                      <div className="absolute top-4 right-4 bg-black/60 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isMakingOfMuted ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full max-w-sm mx-auto rounded-lg overflow-hidden shadow-2xl bg-gray-100" style={{ aspectRatio: '9/16' }}>
                  <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                    <p className="text-gray-500">Video coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="mt-20 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold text-black mb-4">PASSION. ART. LOVE.</h2>
              <p className="text-4xl font-script text-gray-800 mb-2">Hand-Designed Hats</p>
              <p className="text-3xl font-script text-gray-700 mb-4">Made Just For You</p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Deeply Inspired by life, art and harmony. Wear the finest suede hats embellished by Coco Hawaii Founder & Artist, Valeria Velasquez.
              </p>
              <Link href="/create-your-hat">
                <RainbowButton variant="primary" className="text-lg py-4 px-8">
                  Order Now
                </RainbowButton>
              </Link>
            </div>
            <div className="relative h-96 w-full rounded-full overflow-hidden shadow-2xl">
              {hat.mainHatImage ? (
                <WixImage
                  src={hat.mainHatImage}
                  alt={hat.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={showSizeChart}
        onClose={() => setShowSizeChart(false)}
      />

      {/* Payment Popup */}
      <PaymentPopup
        isOpen={showPaymentPopup}
        onClose={() => setShowPaymentPopup(false)}
        hat={hat}
        onComplete={handlePaymentComplete}
      />
    </div>
    </>
  );
}
