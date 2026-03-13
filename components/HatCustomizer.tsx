'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import WixImage from './WixImage';
import RainbowButton from './RainbowButton';
import Link from 'next/link';
import DatePicker from './DatePicker';
import Fireworks from './Fireworks';

declare global {
  interface Window {
    SumUpCard?: {
      mount: (opts: { id: string; checkoutId: string; onResponse: (type: string, body: unknown) => void }) => void;
    };
  }
}

interface RawHat {
  _id: string;
  hatForm: string | string[];
  hatProductName?: string;
  hatColorName?: string;
  hatColor?: string[]; // Tag field with hex codes like '#664B42'
  hatColorHex?: string; // Primary color hex for display
  hatProductImage?: string;
  rawHatPrice?: number;
  rawHatId?: string;
}

interface HatAccessory {
  _id: string;
  accessoryName: string;
  accessoryPrice: number;
  accessoryType: string | string[];
  accessoryTags: string | string[];
}

// IMAGINE: 20 varied combo suggestions for hat descriptions
const IMAGINE_COMBOS = [
  'Electronic neon for festival',
  'Celestial sun and moon',
  'Starry night sky with constellations',
  'Abstract expressionism with bold brushstrokes',
  'Art nouveau organic flowing lines',
  'Tropical sunset with palm trees for my Maldives wedding',
  'Nautical anchors and seashells for a beach wedding',
  'Vintage roses and lace for a romantic look',
  'Royal crown jewels aesthetic',
  'Floral spring garden with butterflies',
  'Art deco geometric patterns in gold',
  'Coastal blues and coral reef vibes',
  'Boho feather and dreamcatcher',
  'Parisian chic with Eiffel tower silhouette',
  'Tropical hibiscus and lei flowers',
  'Vintage Hollywood glamour',
  'Minimalist gold leaf accents',
  'Abstract art splashes and bold strokes',
  'Japanese ink painting style',
  'Watercolor wash and soft gradients',
];

interface SelectedHat {
  _id: string;
  hatForm: string;
  hatColorName: string;
  rawHatId: string;
  rawHatPrice: number;
  hatProductImage?: string;
  amount: number;
  containerId: string;
}

export default function HatCustomizer() {
  const searchParams = useSearchParams();

  // Store PR referral ID if present in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prParam = searchParams?.get('pr');
      if (prParam) {
        localStorage.setItem('prReferralId', prParam);
        console.log('🔗 PR Referral ID detected and stored in customizer:', prParam);
      }
    }
  }, [searchParams]);
  const router = useRouter();
  const [selectedHats, setSelectedHats] = useState<SelectedHat[]>([]); // draft before Confirm
  const [savedHats, setSavedHats] = useState<SelectedHat[]>([]); // after Confirm — each hat is one item (amount 1) with its own containerId
  const [totalHatsCount, setTotalHatsCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Base hat from product page (if customizing existing hat)
  const [baseHatId, setBaseHatId] = useState<string | null>(null);
  const [baseHatPrice, setBaseHatPrice] = useState<number>(0);
  const [baseHatName, setBaseHatName] = useState<string>('');
  const [baseHatImage, setBaseHatImage] = useState<string>('');
  const [isCustomizingExistingHat, setIsCustomizingExistingHat] = useState(false);
  
  // Step 1: Hat Shapes
  const [hatForms, setHatForms] = useState<string[]>(['Golf', 'Arrow', 'Flat', 'Heart']); // Default shapes
  const [hatShapeImages, setHatShapeImages] = useState<Record<string, string>>({}); // Store images for each shape
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [loadingShapes, setLoadingShapes] = useState(false); // Start with false since we have defaults
  
  // Step 2: Hat Colors
  const [hatColors, setHatColors] = useState<RawHat[]>([]);
  const [loadingColors, setLoadingColors] = useState(false);
  
  // Step 3: Embellishments
  const [artOptions, setArtOptions] = useState<HatAccessory[]>([]);
  const [preciousStonesOptions, setPreciousStonesOptions] = useState<HatAccessory[]>([]);
  const [jewelryOptions, setJewelryOptions] = useState<HatAccessory[]>([]);
  const [fabricOptions, setFabricOptions] = useState<HatAccessory[]>([]);
  const [selectedArt, setSelectedArt] = useState<string>('');
  const [selectedPreciousStones, setSelectedPreciousStones] = useState<string>('');
  const [selectedJewelry, setSelectedJewelry] = useState<string>('');
  const [selectedFabric, setSelectedFabric] = useState<string>('');
  const [artChecked, setArtChecked] = useState(false); // Will be set to true when art is selected, cannot be unchecked
  const [isAnimatingArtCheck, setIsAnimatingArtCheck] = useState(false); // Track if we're animating the art checkbox
  const [showArtPriceAnimation, setShowArtPriceAnimation] = useState(false); // Track if we should show price animation
  
  // 3-step Art process state (per hat container)
  const [artStepByContainer, setArtStepByContainer] = useState<Record<string, 1 | 2 | 3>>({});
  const [selectedArtColorsByContainer, setSelectedArtColorsByContainer] = useState<Record<string, string[]>>({});
  const [artDescriptionByContainer, setArtDescriptionByContainer] = useState<Record<string, string>>({});
  const [artConfirmedByContainer, setArtConfirmedByContainer] = useState<Record<string, boolean>>({});
  const [preciousStonesChecked, setPreciousStonesChecked] = useState(false);
  const [jewelryChecked, setJewelryChecked] = useState(false);
  const [fabricChecked, setFabricChecked] = useState(false);
  
  // Adjusted price for selected precious stone (can be increased via slider)
  const [preciousStoneAdjustedPrice, setPreciousStoneAdjustedPrice] = useState<number>(0);
  
  // Adjusted price for selected jewelry (can be increased via slider)
  const [jewelryAdjustedPrice, setJewelryAdjustedPrice] = useState<number>(0);
  
  // Combo selection for precious stones (stone + type/appliance)
  const [preciousStoneType, setPreciousStoneType] = useState<string>(''); // Chain, Pendant, Bracelet, etc.
  const [jewelryType, setJewelryType] = useState<string>(''); // Chain, Pendant, Bracelet, etc.
  
  // Art interval-based price increase (GLOBAL - starts immediately on mount)
  const [artBasePrice, setArtBasePrice] = useState<number>(100); // Default base price
  const [artCurrentPrice, setArtCurrentPrice] = useState<number>(100); // Current price (increases continuously)
  const [artIntervalMs, setArtIntervalMs] = useState<number>(6400); // Interval in milliseconds (from CMS)
  const [artPriceIncrement, setArtPriceIncrement] = useState<number>(0.01); // Price increment per interval (from CMS)
  const [artIntervalTimer, setArtIntervalTimer] = useState<NodeJS.Timeout | null>(null);
  const [artCountdown, setArtCountdown] = useState<number>(6400); // Countdown timer in ms
  const [artCreationId, setArtCreationId] = useState<string | null>(null); // CMS item ID for updates
  
  // Step 4: Personal Details
  const [clientNotes, setClientNotes] = useState('');
  const [birthDate, setBirthDate] = useState<string>('');
  
  // Which saved hat we're customizing in Step 3
  const [customizingHatContainerId, setCustomizingHatContainerId] = useState<string | null>(null);
  // Embellishment choices per hat (key = containerId)
  const [embellishmentsByContainer, setEmbellishmentsByContainer] = useState<Record<string, { art: string; artColors?: string; artDescription?: string; preciousStones: string; jewelry: string; fabric: string; notes: string; birthDate: string }>>({});
  
  // Per-hat notes and birth date (temporary state while customizing)
  const [currentHatNotes, setCurrentHatNotes] = useState<string>('');
  const [currentHatBirthDate, setCurrentHatBirthDate] = useState<string>('');
  
  // Current step: 0 = main customizer view, 1 = shapes, 2 = colors, 3 = embellishments (shown inline), 4 = personal details
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4>(1);
  
  // Popup modal for Add New Hat selection
  const [showAddHatModal, setShowAddHatModal] = useState(false);
  
  // Finalize success popup (firework celebration + redirect to Custom Hat Orders)
  const [showFinalizeSuccessPopup, setShowFinalizeSuccessPopup] = useState(false);
  const [finalizeSuccessFireworks, setFinalizeSuccessFireworks] = useState(false);
  const finalizeRedirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Checkout flow (3 steps: signup/login, shipping, payment)
  const [checkoutStep, setCheckoutStep] = useState<'signup' | 'shipping' | 'payment' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutMobile, setCheckoutMobile] = useState('');
  const [checkoutPassword, setCheckoutPassword] = useState('');
  const [wantsToSignup, setWantsToSignup] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingOption, setShippingOption] = useState<string>('');
  const [shippingPrice, setShippingPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [orderId, setOrderId] = useState<string | null>(null);
  // SumUp payment (Visa/Mastercard)
  const [sumupCheckoutId, setSumupCheckoutId] = useState<string | null>(null);
  const [showSumupWidget, setShowSumupWidget] = useState(false);
  const [sumupScriptReady, setSumupScriptReady] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentTimeout, setPaymentTimeout] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const sumupWidgetMountedRef = useRef(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user is logged in when checkout starts
  useEffect(() => {
    if (checkoutStep === 'signup' && typeof window !== 'undefined') {
      const memberName = localStorage.getItem('memberName');
      const memberEmail = localStorage.getItem('memberEmail');
      if (memberName && memberEmail) {
        setIsLoggedIn(true);
        setCheckoutName(memberName);
        setCheckoutEmail(memberEmail);
        // Try to get mobile from localStorage or API
        const memberMobile = localStorage.getItem('memberMobile') || '';
        setCheckoutMobile(memberMobile);
        // Skip signup step if already logged in
        setCheckoutStep('shipping');
      }
    }
  }, [checkoutStep]);

  // Auto-redirect to Custom Hat Orders after ~4.5s when success popup is shown
  useEffect(() => {
    if (!showFinalizeSuccessPopup) return;
    finalizeRedirectTimeoutRef.current = setTimeout(() => {
      setShowFinalizeSuccessPopup(false);
      setFinalizeSuccessFireworks(false);
      router.push('/member/custom-orders');
    }, 4500);
    return () => {
      if (finalizeRedirectTimeoutRef.current) {
        clearTimeout(finalizeRedirectTimeoutRef.current);
        finalizeRedirectTimeoutRef.current = null;
      }
    };
  }, [showFinalizeSuccessPopup, router]);

  // Create SumUp checkout when user selects Card and reaches payment step
  useEffect(() => {
    if (checkoutStep !== 'payment' || paymentMethod !== 'Visa/Mastercard') return;
    if (!checkoutName || !checkoutEmail || !checkoutMobile || !shippingAddress || !shippingOption) return;
    if (sumupCheckoutId || checkoutLoading) return;
    setCheckoutLoading(true);
    setPaymentError('');
    const grandTotal = calculateGrandTotal();
    const hats = buildHatsPayload();
    fetch('/api/custom/orders/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hats,
        clientNotes: clientNotes || undefined,
        name: checkoutName,
        email: checkoutEmail,
        mobile: checkoutMobile,
        address: shippingAddress,
        shippingPrice,
        shippingType: shippingOption,
        finalTotalPrice: grandTotal,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.checkoutId) {
          setSumupCheckoutId(data.checkoutId);
          setShowSumupWidget(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('custom_payment_checkout_id', data.checkoutId);
          }
        } else {
          setPaymentError(data.error || 'Failed to set up payment. Please try again.');
        }
      })
      .catch((err) => {
        setPaymentError(err?.message || 'Failed to set up payment. Please try again.');
      })
      .finally(() => setCheckoutLoading(false));
  }, [checkoutStep, paymentMethod, checkoutName, checkoutEmail, checkoutMobile, shippingAddress, shippingOption, shippingPrice, sumupCheckoutId, checkoutLoading, clientNotes]);

  const startPollingCustom = (checkoutId: string) => {
    setPaymentProcessing(true);
    setPaymentTimeout(false);
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    pollTimeoutRef.current = setTimeout(() => {
      pollTimeoutRef.current = null;
      setPaymentTimeout(true);
    }, 90000);
    const poll = async () => {
      try {
        const res = await fetch(`/api/custom/orders/check-status?checkoutId=${encodeURIComponent(checkoutId)}`);
        const data = await res.json();
        if (data.status === 'paid') {
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
          setPaymentProcessing(false);
          setPaymentTimeout(false);
          setOrderId(data.groupOrderId || null);
          setFinalizeSuccessFireworks(true);
          setShowFinalizeSuccessPopup(true);
          setCheckoutStep(null);
        } else if (data.status === 'failed' || data.status === 'expired') {
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
          setPaymentProcessing(false);
          setPaymentTimeout(false);
          setPaymentError('Payment failed or expired. Please try again.');
        } else if (data.success === false && data.error) {
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
          setPaymentProcessing(false);
          setPaymentTimeout(false);
          setPaymentError(data.error || 'Could not verify payment. Please try again.');
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        setTimeout(poll, 2000);
      }
    };
    poll();
  };

  const cancelPaymentProcessing = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setPaymentProcessing(false);
    setPaymentTimeout(false);
    setSumupCheckoutId(null);
    setShowSumupWidget(false);
    sumupWidgetMountedRef.current = false;
    setPaymentError('');
  };

  // Timeout if SumUp script never loads (e.g. blocked by browser/ad blocker)
  useEffect(() => {
    if (!showSumupWidget || !sumupCheckoutId || sumupScriptReady) return;
    const t = setTimeout(() => setPaymentError('Payment form failed to load. Please refresh or try a different browser.'), 15000);
    return () => clearTimeout(t);
  }, [showSumupWidget, sumupCheckoutId, sumupScriptReady]);

  // Mount SumUp card widget when checkout is ready and script loaded
  useEffect(() => {
    if (!showSumupWidget || !sumupCheckoutId || sumupWidgetMountedRef.current || !sumupScriptReady) return;
    const SumUpCard = (window as unknown as { SumUpCard?: typeof window.SumUpCard }).SumUpCard;
    if (!SumUpCard) return;
    sumupWidgetMountedRef.current = true;
    SumUpCard.mount({
      id: 'sumup-card-custom',
      checkoutId: sumupCheckoutId,
      onResponse: (type: string, body: unknown) => {
        const t = (type || '').toLowerCase();
        if (t === 'success' || t === 'sent' || t === 'auth-screen' || t === 'auth_screen') {
          setShowSumupWidget(false);
          startPollingCustom(sumupCheckoutId);
        } else if (t === 'error' || t === 'invalid') {
          setPaymentError((body as { message?: string })?.message || 'Payment could not be completed. Please try again.');
        } else {
          setShowSumupWidget(false);
          startPollingCustom(sumupCheckoutId);
        }
      },
    });
  }, [showSumupWidget, sumupCheckoutId, sumupScriptReady]);
  
  // Smooth scroll helper
  const scrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Build hats payload for API (create-checkout or saveCustomizedOrder)
  const buildHatsPayload = () =>
    savedHats.map((h) => {
      const e = embellishmentsByContainer[h.containerId] || {};
      const originalHat = hatColors.find((rc) => rc._id === h._id);
      const hatColor = originalHat?.hatColor || [];
      const hatColorHex = originalHat?.hatColorHex || (Array.isArray(hatColor) && hatColor.length > 0 ? hatColor[0] : '');
      const hatArtPrice = e.art && e.art !== '' ? artCurrentPrice : 0;
      const stonesBaseName = e.preciousStones ? String(e.preciousStones).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
      const stonesPrice = stonesBaseName
        ? (preciousStonesOptions.find((s) => String(s.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === stonesBaseName)?.accessoryPrice ?? 0)
        : 0;
      const jewelryBaseName = e.jewelry ? String(e.jewelry).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
      const jewelryPrice = jewelryBaseName
        ? (jewelryOptions.find((j) => String(j.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === jewelryBaseName)?.accessoryPrice ?? 0)
        : 0;
      const fabricBaseName = e.fabric ? String(e.fabric).trim().toLowerCase() : '';
      const fabricPrice = fabricBaseName
        ? (fabricOptions.find((f) => String(f.accessoryName || '').trim().toLowerCase() === fabricBaseName)?.accessoryPrice ?? 0)
        : 0;
      return {
        ...h,
        hatColor: Array.isArray(hatColor) ? hatColor : hatColorHex ? [hatColorHex] : [],
        hatColorHex,
        embellishments: {
          ...e,
          artPrice: hatArtPrice,
          preciousStonesPrice: stonesPrice,
          jewelryPrice,
          fabricPrice,
        },
      };
    });

  // Calculate grand total (order + shipping)
  const calculateGrandTotal = () => {
    const orderTotal = savedHats.reduce((sum, hat) => {
      const e = embellishmentsByContainer[hat.containerId] || {};
      const hatArtPrice = (e.art && e.art !== '') ? artCurrentPrice : 0;
      const stonesBaseName = e.preciousStones ? String(e.preciousStones).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
      const stonesPrice = stonesBaseName ? (preciousStonesOptions.find(s => String(s.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === stonesBaseName)?.accessoryPrice ?? 0) : 0;
      const jewelryBaseName = e.jewelry ? String(e.jewelry).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
      const jewelryPrice = jewelryBaseName ? (jewelryOptions.find(j => String(j.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === jewelryBaseName)?.accessoryPrice ?? 0) : 0;
      const fabricBaseName = e.fabric ? String(e.fabric).trim().toLowerCase() : '';
      const fabricPrice = fabricBaseName ? (fabricOptions.find(f => String(f.accessoryName || '').trim().toLowerCase() === fabricBaseName)?.accessoryPrice ?? 0) : 0;
      return sum + (hat.rawHatPrice || 0) + hatArtPrice + stonesPrice + jewelryPrice + fabricPrice;
    }, 0);
    return orderTotal + shippingPrice;
  };

  // Handle final order submission (after payment)
  const handleFinalizeOrder = async (onError?: (msg: string) => void) => {
    if (!checkoutName || !checkoutEmail || !checkoutMobile || !shippingAddress || !shippingOption || !paymentMethod) {
      const msg = 'Please complete all checkout steps.';
      onError ? onError(msg) : alert(msg);
      return;
    }

    try {
      const grandTotal = calculateGrandTotal();

      const response = await fetch('/api/customizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveCustomizedOrder',
          hats: buildHatsPayload(),
          clientNotes,
          memberEmail: checkoutEmail,
          // Checkout info
          name: checkoutName,
          email: checkoutEmail,
          mobile: checkoutMobile,
          address: shippingAddress,
          shippingPrice: shippingPrice,
          shippingType: shippingOption,
          paymentMethod: paymentMethod,
          finalTotalPrice: grandTotal,
          orderPaid: true, // Mark as paid after payment step
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderId(data.groupOrderId || null);
        setFinalizeSuccessFireworks(true);
        setShowFinalizeSuccessPopup(true);
        setCheckoutStep(null); // Close checkout
      } else {
        const errorData = await response.json();
        const msg = errorData.error || 'Failed to save order. Please try again.';
        onError ? onError(msg) : alert(msg);
      }
    } catch (error) {
      console.error('Error finalizing order:', error);
      const msg = 'Failed to save order. Please try again.';
      onError ? onError(msg) : alert(msg);
    }
  };

  // Check for base hat from URL params (when customizing existing hat)
  useEffect(() => {
    const baseHatIdParam = searchParams.get('baseHatId');
    const basePriceParam = searchParams.get('basePrice');
    const baseHatNameParam = searchParams.get('baseHatName');
    const baseHatImageParam = searchParams.get('baseHatImage');
    const fromCollection = searchParams.get('fromCollection') === 'true';
    
    // Handle hats selected from collection
    if (fromCollection) {
      try {
        const storedHats = localStorage.getItem('selectedCollectionHats');
        if (storedHats) {
          const collectionHats: SelectedHat[] = JSON.parse(storedHats);
          // Replace savedHats with the new selection (since user confirmed from collections)
          setSavedHats(collectionHats);
          setCurrentStep(0); // Go to main view
          localStorage.removeItem('selectedCollectionHats'); // Clean up
          console.log('✅ Loaded hats from collection:', collectionHats.length);
        }
      } catch (error) {
        console.error('Error loading collection hats:', error);
      }
      return;
    }
    
    if (baseHatIdParam && basePriceParam) {
      setBaseHatId(baseHatIdParam);
      setBaseHatPrice(parseFloat(basePriceParam));
      setBaseHatName(baseHatNameParam || '');
      setBaseHatImage(baseHatImageParam || '');
      setIsCustomizingExistingHat(true);
      
      // Create a saved hat with the base price — user must click Customize to open Step 3
      const containerId = `base-${baseHatIdParam}-${Date.now()}`;
      const baseHat: SelectedHat = {
        _id: baseHatIdParam,
        hatForm: 'Custom',
        hatColorName: baseHatNameParam || 'Custom',
        rawHatId: baseHatIdParam,
        rawHatPrice: parseFloat(basePriceParam),
        hatProductImage: baseHatImageParam || '',
        amount: 1,
        containerId: containerId,
      };
      
      setSavedHats([baseHat]);
      // Don't set customizingHatContainerId — user must click Customize button first
      setCurrentStep(0); // Go to main view (Step 0)
      
      console.log('✅ Customizing existing hat:', { baseHatIdParam, basePrice: basePriceParam, baseHatNameParam });
    }
  }, [searchParams]);

  // Fetch unique hat forms on mount
  useEffect(() => {
    fetchUniqueHatForms();
  }, []);

  // Fetch hat shape images when hatForms are loaded
  useEffect(() => {
    if (hatForms.length > 0) {
      fetchHatShapeImages();
    }
  }, [hatForms]);

  // Fetch hat colors when shape is selected
  useEffect(() => {
    if (selectedShape) {
      fetchHatColors(selectedShape);
    }
  }, [selectedShape]);

  // Fetch accessories on mount
  useEffect(() => {
    fetchAccessories('Art', 'Art', setArtOptions);
    fetchAccessories('Precious Stones', 'Precious Stones', setPreciousStonesOptions);
    fetchAccessories('Jewelry', 'Jewelry', setJewelryOptions);
    fetchAccessories('Fabric', 'Fabric', setFabricOptions);
    
    // Fetch global ArtCreation data and start price timer immediately
    fetchArtCreation();
  }, []);

  // Fetch ArtCreation data from CMS (global art price)
  const fetchArtCreation = async () => {
    try {
      const response = await fetch('/api/customizer?action=getArtCreation');
      const data = await response.json();
      
      if (data.success && data.item) {
        const item = data.item;
        const basePrice = parseFloat(item.artBasePrice) || 100;
        const increase = parseFloat(item.artPriceIncrease) || 0.01;
        const interval = parseInt(item.increaseRate) || 6400;
        const currentTotal = parseFloat(item.artPriceIncreasedTotal) || 0;
        const finalPrice = parseFloat(item.artPriceFinalTotal) || basePrice;
        
        setArtBasePrice(basePrice);
        setArtCurrentPrice(finalPrice);
        setArtPriceIncrement(increase);
        setArtIntervalMs(interval);
        setArtCountdown(interval);
        setArtCreationId(item._id || null);
        
        console.log('✅ Loaded ArtCreation from CMS:', { basePrice, finalPrice, increase, interval });
      }
    } catch (error) {
      console.error('❌ Error fetching ArtCreation:', error);
    }
  };

  // When entering Step 3 for a hat, load that hat's embellishments into the form
  useEffect(() => {
    if (currentStep === 0 && customizingHatContainerId) {
      const e = embellishmentsByContainer[customizingHatContainerId];
      setSelectedArt(e?.art ?? '');
      setSelectedPreciousStones(e?.preciousStones ?? '');
      setSelectedJewelry(e?.jewelry ?? '');
      setSelectedFabric(e?.fabric ?? '');
      setCurrentHatNotes(e?.notes ?? '');
      setCurrentHatBirthDate(e?.birthDate ?? '');
      
      // Restore art step state if art details exist
      if (e?.art && e?.artColors) {
        const colors = e.artColors.split(', ').filter(Boolean);
        setSelectedArtColorsByContainer(prev => ({
          ...prev,
          [customizingHatContainerId]: colors
        }));
        setArtDescriptionByContainer(prev => ({
          ...prev,
          [customizingHatContainerId]: e.artDescription || ''
        }));
        setArtConfirmedByContainer(prev => ({
          ...prev,
          [customizingHatContainerId]: true
        }));
      }
      // Don't auto-check Art here - let the animation handle it
      // setArtChecked(true);
    }
  }, [currentStep, customizingHatContainerId, embellishmentsByContainer]);

  // Auto-check Art when an art option is selected (Art cannot be unchecked)
  useEffect(() => {
    if (selectedArt && !artChecked) {
      setArtChecked(true);
    }
  }, [selectedArt, artChecked]);

  // Auto-check accessory categories when an option is selected
  useEffect(() => {
    if (selectedPreciousStones && !preciousStonesChecked) {
      setPreciousStonesChecked(true);
    }
  }, [selectedPreciousStones, preciousStonesChecked]);

  useEffect(() => {
    if (selectedJewelry && !jewelryChecked) {
      setJewelryChecked(true);
    }
  }, [selectedJewelry, jewelryChecked]);

  useEffect(() => {
    if (selectedFabric && !fabricChecked) {
      setFabricChecked(true);
    }
  }, [selectedFabric, fabricChecked]);

  // Global Art price timer - starts immediately on mount, runs continuously
  useEffect(() => {
    // Clear any existing timers
    if (artIntervalTimer) {
      clearInterval(artIntervalTimer);
    }

    // Start interval timer immediately (global price, not dependent on selection)
    if (artBasePrice > 0 && artIntervalMs > 0) {
      // Reset countdown when starting
      setArtCountdown(artIntervalMs);
      
      // Price increase timer (runs every artIntervalMs)
      const priceTimer = setInterval(() => {
        setArtCurrentPrice(prev => {
          const newPrice = prev + artPriceIncrement;
          
          // Update CMS periodically (every 10 increments to avoid too many API calls)
          if (artCreationId && Math.floor(newPrice * 100) % 10 === 0) {
            const increasedTotal = newPrice - artBasePrice;
            fetch('/api/customizer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'updateArtCreation',
                _id: artCreationId,
                artPriceIncreasedTotal: increasedTotal.toFixed(2),
                artPriceFinalTotal: newPrice.toFixed(2)
              })
            }).catch(err => console.warn('Failed to update ArtCreation:', err));
          }
          
          return newPrice;
        });
        setArtCountdown(artIntervalMs); // Reset countdown after price increase
      }, artIntervalMs);

      // Countdown timer (updates every 100ms for smooth visual feedback)
      const countdownTimer = setInterval(() => {
        setArtCountdown(prev => {
          if (prev <= 100) {
            return artIntervalMs; // Reset when it reaches 0
          }
          return prev - 100; // Decrement by 100ms
        });
      }, 100);

      setArtIntervalTimer(priceTimer);

      // Cleanup on unmount or when conditions change
      return () => {
        clearInterval(priceTimer);
        clearInterval(countdownTimer);
      };
    } else {
      setArtIntervalTimer(null);
    }
  }, [artBasePrice, artIntervalMs, artPriceIncrement, artCreationId]);

  const fetchUniqueHatForms = async () => {
    setLoadingShapes(true);
    try {
      // Fetch all items and extract unique hatForm tags (exactly like Wix)
      // wixData.query("rawHatCollection").find()
      const response = await fetch('/api/customizer?action=getRawHats&collection=rawHatCollection');
      const data = await response.json();
      
      console.log('📦 Fetched data for shapes:', data);
      
      if (data.success && data.items && data.items.length > 0) {
        // Extract unique hatForm tags exactly like Wix: items.flatMap(item => item.hatForm)
        const allForms = data.items.flatMap((item: any) => {
          // hatForm is a tag field (array) in Wix
          const form = item.hatForm;
          if (Array.isArray(form)) {
            return form; // Return array as-is
          } else if (form) {
            return [form]; // Convert string to array
          }
          return [];
        });
        
        // Remove duplicates: [...new Set(allTags)]
        const uniqueForms = [...new Set(allForms)].filter(Boolean) as string[];
        
        console.log('🎯 Extracted unique hat forms:', uniqueForms);
        
        if (uniqueForms.length > 0) {
          setHatForms(uniqueForms);
          console.log('✅ Set hat forms:', uniqueForms);
        } else {
          console.log('⚠️ No unique forms found, using defaults:', hatForms);
        }
      } else {
        console.log('⚠️ No items returned from API, using default shapes:', hatForms);
      }
    } catch (error) {
      console.error('❌ Error fetching hat forms:', error);
      // Keep default shapes on error
    } finally {
      setLoadingShapes(false);
    }
  };

  // Fetch one hat image for each shape to use as the shape preview
  // Exactly like Wix: find the first item where i.hatForm.includes(hatForm)
  const fetchHatShapeImages = async () => {
    const shapesToFetch = hatForms.length > 0 ? hatForms : ['Golf', 'Arrow', 'Flat', 'Heart'];
    const imageMap: Record<string, string> = {};

    // First, fetch ALL items once (like Wix does)
    try {
      console.log(`🔍 Fetching all items to find shape images...`);
      const allItemsResponse = await fetch('/api/customizer?action=getRawHats&collection=rawHatCollection');
      const allItemsData = await allItemsResponse.json();
      
      if (allItemsData.success && allItemsData.items && allItemsData.items.length > 0) {
        console.log(`📦 Fetched ${allItemsData.items.length} total items`);
        
        // For each shape, find the first item where hatForm includes that shape
        for (const shape of shapesToFetch) {
          // Find first item where i.hatForm.includes(hatForm) - exactly like Wix
          const item = allItemsData.items.find((i: any) => {
            const itemHatForm = i.hatForm;
            if (Array.isArray(itemHatForm)) {
              return itemHatForm.includes(shape);
            } else {
              return itemHatForm === shape;
            }
          });
          
          if (item && item.hatProductImage) {
            imageMap[shape] = item.hatProductImage;
            console.log(`✅ Found image for ${shape}:`, item.hatProductImage);
          } else {
            console.log(`⚠️ No item/image found for ${shape}`);
          }
        }
      } else {
        console.log(`⚠️ No items returned from API`);
      }
    } catch (error) {
      console.error(`❌ Error fetching shape images:`, error);
    }

    console.log(`🖼️ Final image map:`, imageMap);
    setHatShapeImages(imageMap);
  };

  const fetchHatColors = async (hatForm: string) => {
    setLoadingColors(true);
    try {
      console.log(`🔍 Fetching hats for shape: ${hatForm}`);
      // Use .eq() filter like Wix: wixData.query("rawHatCollection").eq("hatForm", hatForm).find()
      const response = await fetch(`/api/customizer?action=getRawHats&collection=rawHatCollection&hatForm=${encodeURIComponent(hatForm)}`);
      const data = await response.json();
      console.log(`📦 Hats response for ${hatForm}:`, data);
      
      if (data.success && data.items && data.items.length > 0) {
        // Map items exactly as they come from API (already processed)
        const mappedHats = data.items.map((hat: any) => ({
          _id: hat._id,
          hatForm: hat.hatForm || hatForm,
          hatColorName: hat.hatColorName || '', // Color name like 'Cherry', 'Wolf', 'Black'
          hatProductName: hat.hatProductName || '', // Product name like 'Heart | Black'
          hatColor: hat.hatColor || [], // Array of hex codes like ['#FEEAED']
          hatColorHex: hat.hatColorHex || '', // Primary color hex
          hatProductImage: hat.hatProductImage || '', // Hat image URL
          rawHatPrice: hat.rawHatPrice || 0,
          rawHatId: hat.rawHatId || hat._id,
        }));
        
        console.log(`✅ Found ${mappedHats.length} hats for ${hatForm}`);
        if (mappedHats.length > 0) {
          console.log(`📸 Sample hat:`, {
            _id: mappedHats[0]._id,
            hatProductName: mappedHats[0].hatProductName,
            hatColorName: mappedHats[0].hatColorName,
            hatColor: mappedHats[0].hatColor,
            hatColorHex: mappedHats[0].hatColorHex,
            hasImage: !!mappedHats[0].hatProductImage,
            rawHatPrice: mappedHats[0].rawHatPrice
          });
        }
        setHatColors(mappedHats);
      } else {
        console.log(`⚠️ No hats found for ${hatForm}. Response:`, data);
        setHatColors([]);
      }
    } catch (error) {
      console.error('❌ Error fetching hat colors:', error);
      setHatColors([]);
    } finally {
      setLoadingColors(false);
    }
  };

  const fetchAccessories = async (type: string, tag: string, setter: (items: HatAccessory[]) => void) => {
    try {
      const response = await fetch(`/api/customizer?action=getAccessories&collection=HatAccessories&accessoryType=SubAccessory&accessoryTags=${encodeURIComponent(tag)}`);
      const data = await response.json();
      if (data.success) {
        setter(data.items || []);
      }
    } catch (error) {
      console.error(`Error fetching ${tag} accessories:`, error);
    }
  };

  const handleShapeSelect = (shape: string) => {
    setSelectedShape(shape);
    setCurrentStep(2);
  };

  const handleHatSelect = (hat: RawHat) => {
    const hatFormValue = Array.isArray(hat.hatForm) ? hat.hatForm[0] : hat.hatForm;
    const containerId = `${hat._id}-${Date.now()}`;

    const newHat: SelectedHat = {
      _id: hat._id,
      hatForm: hatFormValue || '',
      hatColorName: hat.hatColorName || '',
      rawHatId: hat.rawHatId || hat._id,
      rawHatPrice: hat.rawHatPrice || 0,
      hatProductImage: hat.hatProductImage,
      amount: 1,
      containerId,
    };

    const existingIndex = selectedHats.findIndex(h => h._id === hat._id);
    if (existingIndex >= 0) {
      const updated = [...selectedHats];
      updated[existingIndex].amount += 1;
      setSelectedHats(updated);
    } else {
      setSelectedHats([...selectedHats, newHat]);
    }
  };

  const handleAmountChange = (containerId: string, delta: number, e?: { stopPropagation: () => void }) => {
    if (e) e.stopPropagation();
    const entry = selectedHats.find(h => h.containerId === containerId);
    if (!entry) return;
    const newAmount = entry.amount + delta;
    if (newAmount <= 0) {
      setSelectedHats(prev => prev.filter(h => h.containerId !== containerId));
      return;
    }
    setSelectedHats(prev =>
      prev.map(h => (h.containerId === containerId ? { ...h, amount: newAmount } : h))
    );
  };

  // Expand draft to saved: each amount becomes that many items with amount=1 and unique containerId
  const handleConfirmHats = () => {
    const expanded: SelectedHat[] = [];
    for (const s of selectedHats) {
      for (let i = 0; i < s.amount; i++) {
        expanded.push({
          ...s,
          amount: 1,
          containerId: `${s.rawHatId}-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
        });
      }
    }
    setSavedHats(prev => [...prev, ...expanded]);
    setSelectedHats([]);
    setTotalHatsCount(prev => prev + expanded.length);
    setTotalPrice(prev => prev + expanded.reduce((sum, h) => sum + h.rawHatPrice, 0));
    setCurrentStep(0); // Go to main customizer view
    setTimeout(() => scrollToElement('hat-selection-summary'), 100);
  };

  const handleCustomize = (containerId: string) => {
    setCustomizingHatContainerId(containerId);
    // Reset animation states
    setIsAnimatingArtCheck(false);
    setShowArtPriceAnimation(false);
    setArtChecked(false);
    
    // Scroll to the customization section first
    setTimeout(() => {
      scrollToElement(`customize-${containerId}`);
      
      // Then scroll to ART section after a brief delay
      setTimeout(() => {
        const artSection = document.getElementById(`art-section-${containerId}`);
        if (artSection) {
          artSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Start the animation sequence after scrolling
        setTimeout(() => {
          setIsAnimatingArtCheck(true);
          
          // After 2.5 seconds, check the box and show price animation
          setTimeout(() => {
            setArtChecked(true);
            setIsAnimatingArtCheck(false);
            
            // Show price animation after checkbox is checked
            setTimeout(() => {
              setShowArtPriceAnimation(true);
              // Remove animation after it completes
              setTimeout(() => {
                setShowArtPriceAnimation(false);
              }, 1500);
            }, 300);
          }, 2500); // 2.5 second animation
        }, 500); // Wait 500ms after scrolling
      }, 300);
    }, 100);
  };

  const saveEmbellishmentsAndBackToSaved = () => {
    if (customizingHatContainerId) {
      // Determine art value: use selectedArt if available, otherwise use 'customized' if art is checked
      const artValue = selectedArt || (artChecked ? 'customized' : '');
      
      console.log('💾 Saving embellishments:', {
        containerId: customizingHatContainerId,
        artChecked,
        selectedArt,
        artValue,
        preciousStones: selectedPreciousStones,
        jewelry: selectedJewelry,
        fabric: selectedFabric,
      });
      
      // Build precious stones display with type if selected
      const preciousStonesDisplay = selectedPreciousStones 
        ? (preciousStoneType 
            ? `${selectedPreciousStones} ${preciousStoneType}`
            : selectedPreciousStones)
        : '';
      
      // Build jewelry display (no type for jewelry)
      const jewelryDisplay = selectedJewelry || '';
      
      setEmbellishmentsByContainer(prev => {
        const existing = prev[customizingHatContainerId] || {};
        // Get current art colors and description from state (if user just confirmed them)
        const currentArtColors = selectedArtColorsByContainer[customizingHatContainerId] || [];
        const currentArtDescription = artDescriptionByContainer[customizingHatContainerId] || '';
        
        return {
          ...prev,
          [customizingHatContainerId]: {
            // Preserve artColors and artDescription - use current values if available, otherwise keep existing
            artColors: currentArtColors.length > 0 
              ? currentArtColors.join(', ') 
              : (existing.artColors || ''),
            artDescription: currentArtDescription || existing.artDescription || '',
            // If art checkbox is checked (even if no specific style selected), mark art as customized
            // Use 'customized' as a flag if no specific art style is selected but art is checked
            art: artValue,
            preciousStones: preciousStonesDisplay,
            jewelry: jewelryDisplay,
            fabric: selectedFabric,
            notes: currentHatNotes,
            birthDate: currentHatBirthDate,
          },
        };
      });
      setCustomizingHatContainerId(null);
      // Reset temporary state
      setCurrentHatNotes('');
      setCurrentHatBirthDate('');
    }
    setCurrentStep(0);
  };

  // Calculate dynamic customization price
  const calculateCustomizationPrice = () => {
    let total = 0;
    
    // Always include the global art price (it's continuously running, not dependent on selection)
    if (artCurrentPrice > 0) {
      total += artCurrentPrice;
    }
    
    if (preciousStonesChecked && selectedPreciousStones) {
      // Use adjusted price if set, otherwise use base price
      if (preciousStoneAdjustedPrice > 0) {
        total += preciousStoneAdjustedPrice;
      } else {
        const stoneOption = preciousStonesOptions.find(s => s.accessoryName === selectedPreciousStones);
        if (stoneOption) total += stoneOption.accessoryPrice;
      }
    }
    
    if (jewelryChecked && selectedJewelry) {
      // Use adjusted price if set, otherwise use base price
      if (jewelryAdjustedPrice > 0) {
        total += jewelryAdjustedPrice;
      } else {
        const jewelryOption = jewelryOptions.find(j => j.accessoryName === selectedJewelry);
        if (jewelryOption) total += jewelryOption.accessoryPrice;
      }
    }
    
    if (fabricChecked && selectedFabric) {
      const fabricOption = fabricOptions.find(f => f.accessoryName === selectedFabric);
      if (fabricOption) total += fabricOption.accessoryPrice;
    }
    
    return total;
  };

  // Get base hat price for the hat being customized
  const getBaseHatPrice = () => {
    // If customizing existing hat, use the base price from URL
    if (isCustomizingExistingHat && baseHatPrice > 0) {
      return baseHatPrice;
    }
    // Otherwise, use the saved hat's price
    if (!customizingHatContainerId) return 0;
    const hat = savedHats.find(h => h.containerId === customizingHatContainerId);
    return hat?.rawHatPrice || 0;
  };

  // Total price including base + customization
  const getTotalCustomizationPrice = () => {
    return getBaseHatPrice() + calculateCustomizationPrice();
  };

  return (
    <div className="min-h-screen bg-white py-12 relative">
      {/* Fireworks effect when art price is added */}
      <Fireworks trigger={showArtPriceAnimation} duration={2000} />
      {showSumupWidget && (
        <Script
          src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"
          strategy="afterInteractive"
          onLoad={() => setSumupScriptReady(true)}
          onError={() => setPaymentError('Payment form failed to load. Please refresh the page or try a different browser.')}
        />
      )}
      
      {/* Add New Hat Modal */}
      {showAddHatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button
              onClick={() => setShowAddHatModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
            <h2 className="text-3xl font-serif mb-6 text-center">Add New Hat</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* New Hand-Designed Hat Card */}
              <button
                onClick={() => {
                  setShowAddHatModal(false);
                  setCurrentStep(1);
                  setTimeout(() => scrollToElement('step-1'), 100);
                }}
                className="p-6 rounded-lg border-2 border-gray-300 hover:border-pink-400 hover:shadow-lg transition-all duration-300 text-left group"
              >
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                  New Hand-Designed Hat
                </h3>
                <p className="text-gray-600 text-sm">
                  Start from scratch - choose your hat shape, color, and add custom embellishments
                </p>
              </button>
              
              {/* Pre-Made Hand-Designed Hats Card */}
              <button
                onClick={() => {
                  setShowAddHatModal(false);
                  // Store current savedHats so collections page can show them as selected
                  localStorage.setItem('existingCustomizerHats', JSON.stringify(savedHats));
                  router.push('/collections?selectMode=true&returnTo=customizer');
                }}
                className="p-6 rounded-lg border-2 border-gray-300 hover:border-purple-400 hover:shadow-lg transition-all duration-300 text-left group"
              >
                <div className="text-4xl mb-4">👒</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  Pre-Made Hand-Designed Hats
                </h3>
                <p className="text-gray-600 text-sm">
                  Browse our collection and select existing hats to customize with your personal touches
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Animated Progression Bar */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-serif mb-2">5 Easy Steps</h1>
            <p className="text-3xl font-script text-gray-700">
              Build Your Hat Customizer
            </p>
          </div>
          
          {/* Step Progress Bar */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-8 left-0 right-0 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 via-blue-500 via-cyan-500 to-green-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: (() => {
                      // If in checkout flow (finalizing), show progress based on checkout step
                      if (checkoutStep === 'signup') return '80%'; // Step 4 (Personal Details) - 4/5
                      if (checkoutStep === 'shipping') return '80%'; // Step 4 (Personal Details) - 4/5
                      if (checkoutStep === 'payment') return '100%'; // Step 5 (Finalize) - 5/5
                      
                      // If on customization page (step 3), show 60% progress (3/5 steps)
                      // This happens:
                      //   1. After "Confirm Color" when savedHats.length > 0 (arrived at customization page)
                      //   2. When clicking "Customize" on a hat (customizingHatContainerId is set)
                      if (currentStep === 0 && (customizingHatContainerId || savedHats.length > 0)) return '60%';
                      // Step 0 (main view, no hats selected): 0%
                      if (currentStep === 0) return '0%';
                      // Step 1: 20% (1/5)
                      if (currentStep === 1) return '20%';
                      // Step 2: 40% (2/5)
                      if (currentStep === 2) return '40%';
                      // Step 3: 60% (3/5) - but this shouldn't happen as step 3 is shown inline
                      if (currentStep === 3) return '60%';
                      // Step 4 (Finalize): 80% (4/5) - Personal Details step
                      if (currentStep === 4) return '80%';
                      return '0%';
                    })()
                  }}
                />
              </div>

              {/* Steps */}
              {(() => {
                const steps = [
                  { icon: '🎩', title: 'Choose Shape', description: 'Select your hat shape', color: 'purple', stepNum: 1 },
                  { icon: '🎨', title: 'Choose Color', description: 'Pick your hat color', color: 'pink', stepNum: 2 },
                  { icon: '✨', title: 'Customize', description: 'Add embellishments', color: 'blue', stepNum: 3 },
                  { icon: '📝', title: 'Personal Details', description: 'Add notes & dates', color: 'cyan', stepNum: 3 }, // Same as customize since it's inline
                  { icon: '✅', title: 'Finalize', description: 'Review & place order', color: 'green', stepNum: 4 },
                ];

                const colorClasses = {
                  purple: 'from-purple-400 to-purple-600',
                  pink: 'from-pink-400 to-pink-600',
                  blue: 'from-blue-400 to-blue-600',
                  cyan: 'from-cyan-400 to-cyan-600',
                  green: 'from-green-400 to-green-600',
                };

                const textColorClasses = {
                  purple: 'text-purple-600',
                  pink: 'text-pink-600',
                  blue: 'text-blue-600',
                  cyan: 'text-cyan-600',
                  green: 'text-green-600',
                };

                return (
                  <div className="flex justify-between items-center relative">
                    {steps.map((step, index) => {
                      // Determine if step is active based on currentStep and checkoutStep
                      // currentStep: 0 = main view (or step 3 if customizingHatContainerId is set), 1 = shape, 2 = color, 3 = customize, 4 = finalize
                      // checkoutStep: null = not in checkout, 'signup' | 'shipping' | 'payment' = in checkout flow
                      // Check if we're on step 3 (customization page) - happens when:
                      //   1. currentStep === 0 and customizingHatContainerId is set (actively customizing a hat), OR
                      //   2. currentStep === 0 and savedHats.length > 0 (arrived at customization page after confirming color)
                      const isOnStep3 = currentStep === 0 && (!!customizingHatContainerId || savedHats.length > 0);
                      // Check if we're in the finalize/checkout flow
                      const isFinalizing = !!checkoutStep;
                      
                      const stepIsActive = (
                        // Step 1: active when currentStep >= 1 or on step 3 or finalizing
                        (index === 0 && (currentStep >= 1 || isOnStep3 || isFinalizing)) ||
                        // Step 2: active when currentStep >= 2 or on step 3 or finalizing
                        (index === 1 && (currentStep >= 2 || isOnStep3 || isFinalizing)) ||
                        // Step 3 (Customize): active when currentStep >= 3 or isOnStep3 or finalizing
                        (index === 2 && (currentStep >= 3 || isOnStep3 || isFinalizing)) ||
                        // Step 4 (Personal Details): ONLY active when in checkout flow (finalizing)
                        (index === 3 && isFinalizing) ||
                        // Step 5 (Finalize): active when in checkout flow (finalizing)
                        (index === 4 && isFinalizing)
                      );
                      
                      // Current step highlighting
                      const stepIsCurrent = 
                        (currentStep === 1 && index === 0) || // Step 1 current
                        (currentStep === 2 && index === 1) || // Step 2 current
                        (isOnStep3 && index === 2) || // Step 3 current when customizing (NOT step 4)
                        (currentStep === 3 && index === 2) || // Step 3 current
                        (isFinalizing && checkoutStep === 'signup' && index === 3) || // Step 4 current during signup
                        (isFinalizing && checkoutStep === 'shipping' && index === 3) || // Step 4 current during shipping
                        (isFinalizing && checkoutStep === 'payment' && index === 4); // Step 5 current during payment

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center relative z-10">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold transition-all duration-500 transform ${
                              stepIsActive
                                ? `bg-gradient-to-br ${colorClasses[step.color as keyof typeof colorClasses]} text-white shadow-2xl scale-110 ${
                                    stepIsCurrent ? 'animate-pulse-ring' : ''
                                  }`
                                : 'bg-gray-200 text-gray-400 scale-100'
                            }`}
                          >
                            {step.icon}
                          </div>
                          <div className={`mt-4 text-center transition-all duration-500 ${
                            stepIsActive ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2'
                          }`}>
                            <h3 className={`font-bold text-sm mb-1 ${
                              stepIsActive ? textColorClasses[step.color as keyof typeof textColorClasses] : 'text-gray-500'
                            }`}>
                              {step.title}
                            </h3>
                            <p className="text-xs text-gray-600">{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Step 0: Main Customizer View */}
        {currentStep === 0 && (
          <section className="mb-16">
            {/* Hat Selection Summary */}
            {savedHats.length > 0 && (
              <div id="hat-selection-summary" className="mb-12 rounded-xl p-[3px] bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 to-pink-400">
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-2xl font-serif text-gray-900 tracking-wide">Your Hat Selection</p>
                    <button
                      onClick={() => setShowAddHatModal(true)}
                      className="shrink-0 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
                      style={{
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5), 0 4px 15px rgba(168, 85, 247, 0.5), 0 4px 15px rgba(236, 72, 153, 0.5), 0 8px 25px rgba(59, 130, 246, 0.3), 0 8px 25px rgba(168, 85, 247, 0.3), 0 8px 25px rgba(236, 72, 153, 0.3)'
                      }}
                    >
                      Add New Hat
                    </button>
                  </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedHats.map((hat) => {
                    const originalHat = hatColors.find(h => h._id === hat._id);
                    const hatColorArray = originalHat?.hatColor || (originalHat?.hatColorHex ? [originalHat.hatColorHex] : []);
                    
                    // Calculate prices for this hat's customizations
                    const basePrice = hat.rawHatPrice || 0;
                    const artPrice = artCurrentPrice; // Use current global art price
                    
                    // Get accessory prices from options arrays (with defaults)
                    const allStonesOptions = preciousStonesOptions.length > 0 ? preciousStonesOptions : [
                      { _id: 'diamond', accessoryName: 'Diamond', accessoryPrice: 150 },
                      { _id: 'ruby', accessoryName: 'Ruby', accessoryPrice: 120 },
                      { _id: 'emerald', accessoryName: 'Emerald', accessoryPrice: 130 },
                      { _id: 'sapphire', accessoryName: 'Sapphire', accessoryPrice: 125 },
                      { _id: 'pearl', accessoryName: 'Pearl', accessoryPrice: 100 },
                      { _id: 'amethyst', accessoryName: 'Amethyst', accessoryPrice: 80 }
                    ];
                    const allJewelryOptions = jewelryOptions.length > 0 ? jewelryOptions : [
                      { _id: 'gold-chain', accessoryName: 'Gold Chain', accessoryPrice: 200 },
                      { _id: 'silver-beads', accessoryName: 'Silver Beads', accessoryPrice: 150 },
                      { _id: 'crystal-pendant', accessoryName: 'Crystal Pendant', accessoryPrice: 180 },
                      { _id: 'pearl-strand', accessoryName: 'Pearl Strand', accessoryPrice: 170 },
                      { _id: 'diamond-clip', accessoryName: 'Diamond Clip', accessoryPrice: 250 },
                      { _id: 'vintage-brooch', accessoryName: 'Vintage Brooch', accessoryPrice: 190 }
                    ];
                    const allFabricOptions = fabricOptions.length > 0 ? fabricOptions : [
                      { _id: 'silk', accessoryName: 'Silk', accessoryPrice: 90 },
                      { _id: 'velvet', accessoryName: 'Velvet', accessoryPrice: 85 },
                      { _id: 'satin', accessoryName: 'Satin', accessoryPrice: 75 },
                      { _id: 'leather', accessoryName: 'Leather', accessoryPrice: 110 },
                      { _id: 'suede', accessoryName: 'Suede', accessoryPrice: 95 },
                      { _id: 'cashmere', accessoryName: 'Cashmere', accessoryPrice: 120 }
                    ];
                    
                    const embellishments = embellishmentsByContainer[hat.containerId] || {};
                    
                    // Check if this hat is currently being customized
                    const isCurrentlyCustomizing = customizingHatContainerId === hat.containerId;
                    
                    // Only include art price if the hat has been customized with art
                    // Check if art exists (either a specific style like 'Subtle' or the 'customized' flag)
                    // OR if currently customizing and art checkbox is checked (even if not saved yet)
                    const hasArtCustomization = (!!embellishments.art && embellishments.art !== '') || (isCurrentlyCustomizing && artChecked);
                    const hatArtPrice = hasArtCustomization ? artPrice : 0;
                    // Check if hat has been customized (has art or accessories)
                    // OR if currently customizing and art is checked
                    const isCustomized = hasArtCustomization || !!embellishments.preciousStones || !!embellishments.jewelry || !!embellishments.fabric || (isCurrentlyCustomizing && artChecked);
                    
                    // Extract base stone/jewelry name from combo display (e.g., "Diamond Bracelet" -> "Diamond")
                    const stonesBaseName = embellishments.preciousStones 
                      ? embellishments.preciousStones.split(' ')[0] 
                      : '';
                    const jewelryBaseName = embellishments.jewelry
                      ? embellishments.jewelry.split(' ')[0]
                      : '';
                    
                    const stonesPrice = stonesBaseName
                      ? (allStonesOptions.find(s => String(s.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === stonesBaseName.toLowerCase())?.accessoryPrice ?? 0)
                      : 0;
                    const jewelryPrice = jewelryBaseName
                      ? (allJewelryOptions.find(j => String(j.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === jewelryBaseName.toLowerCase())?.accessoryPrice ?? 0)
                      : 0;
                    const fabricPrice = embellishments.fabric 
                      ? allFabricOptions.find(f => f.accessoryName.toLowerCase() === embellishments.fabric.toLowerCase())?.accessoryPrice || 0 
                      : 0;
                    const totalAccessoriesPrice = stonesPrice + jewelryPrice + fabricPrice;
                    const hatTotalPrice = basePrice + hatArtPrice + totalAccessoriesPrice;
                    
                    // Debug log for hat card (after hatTotalPrice is calculated)
                    if (hat.containerId === customizingHatContainerId || hasArtCustomization) {
                      console.log('🎩 Hat card state:', {
                        containerId: hat.containerId,
                        hasArtCustomization,
                        artValue: embellishments.art,
                        hatArtPrice,
                        isCustomized,
                        totalPrice: hatTotalPrice,
                      });
                    }
                    
                    return (
                      <div key={hat.containerId} className="flex flex-col p-6 rounded-lg bg-white border border-pink-200 h-full min-h-[400px] shadow-sm hover:shadow-lg transition-shadow duration-300">
                        {hat.hatProductImage && (
                          <div className="relative aspect-square w-full mb-6 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                            <WixImage
                              src={hat.hatProductImage}
                              alt={`${hat.hatForm} | ${hat.hatColorName}`}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                            {/* CUSTOMIZING badge - only shown when this hat is being customized - small, 1/16th size of image */}
                            {customizingHatContainerId === hat.containerId && (
                              <div className="absolute top-1 right-1 transform rotate-45 z-10 pointer-events-none" style={{ transformOrigin: 'center' }}>
                                <span
                                  className="font-bold tracking-widest block whitespace-nowrap text-[0.6rem]"
                                  style={{
                                    lineHeight: '1.2',
                                    textShadow: `
                                      0 0 3px rgba(236, 72, 153, 0.9),
                                      0 0 6px rgba(168, 85, 247, 0.9),
                                      0 0 9px rgba(59, 130, 246, 0.9),
                                      0.5px 0.5px 0px rgba(236, 72, 153, 0.6),
                                      -0.5px -0.5px 0px rgba(168, 85, 247, 0.6)
                                    `,
                                    background: 'linear-gradient(45deg, #ec4899, #a855f7, #3b82f6, #ec4899)',
                                    backgroundSize: '300% 300%',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    animation: 'gradient-text 3s ease infinite',
                                  }}
                                >
                                  CUSTOMIZING
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex-1 flex flex-col items-center text-center">
                          <p className="font-serif text-gray-900 text-xl mb-2 tracking-wide">{hat.hatForm} | {hat.hatColorName}</p>
                          {hatColorArray.length > 0 && (
                            <div className="flex gap-2 mb-4 justify-center">
                              {hatColorArray.map((colorHex: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="w-10 h-10 rounded border-2 border-gray-300 shadow-sm"
                                  style={{ backgroundColor: colorHex }}
                                  title={colorHex}
                                />
                              ))}
                            </div>
                          )}
                          {/* Display selected Art style in the hat summary card with price */}
                          {hasArtCustomization && embellishmentsByContainer[hat.containerId] && (
                            <div className="mb-3 w-full">
                              {/* 3 Separate Cards: Art Type | Colors | Notes */}
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                {/* Card 1: Art Type */}
                                <div className="px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                                  <p className="text-xs text-gray-600 mb-1 font-semibold">Art Type</p>
                                  <p className="font-bold text-pink-600 text-sm">
                                    {embellishmentsByContainer[hat.containerId]?.art === 'customized' 
                                      ? 'Customized' 
                                      : embellishmentsByContainer[hat.containerId]?.art || 'Customized'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">+€{hatArtPrice.toFixed(2)}</p>
                                </div>
                                
                                {/* Card 2: Art Colors */}
                                <div className="px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                                  <p className="text-xs text-gray-600 mb-1 font-semibold">Art Color</p>
                                  {embellishmentsByContainer[hat.containerId]?.artColors && embellishmentsByContainer[hat.containerId]?.artColors?.trim() !== '' ? (
                                    <div className="flex flex-wrap gap-1 justify-center">
                                      {embellishmentsByContainer[hat.containerId]?.artColors?.split(', ').filter(Boolean).map((color: string, idx: number) => {
                                        const trimmedColor = color.trim();
                                        const colorClasses: Record<string, string> = {
                                          'Purple': 'bg-purple-500',
                                          'Blue': 'bg-blue-500',
                                          'Red': 'bg-red-500',
                                          'Green': 'bg-green-500',
                                          'Yellow': 'bg-yellow-400',
                                          'Orange': 'bg-orange-500',
                                          'Pink': 'bg-pink-500',
                                          'Black': 'bg-black'
                                        };
                                        return (
                                          <span
                                            key={idx}
                                            className={`px-2 py-1 rounded text-xs font-medium text-white ${colorClasses[trimmedColor] || 'bg-gray-500'}`}
                                          >
                                            {trimmedColor}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </div>
                                
                                {/* Card 3: Art Notes */}
                                <div className="px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                                  <p className="text-xs text-gray-600 mb-1 font-semibold">Art Notes</p>
                                  {embellishmentsByContainer[hat.containerId]?.artDescription && embellishmentsByContainer[hat.containerId]?.artDescription?.trim() !== '' ? (
                                    <p className="text-xs text-gray-700 italic">{embellishmentsByContainer[hat.containerId]?.artDescription}</p>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Display selected Accessories in the hat summary card with prices */}
                          {(embellishmentsByContainer[hat.containerId]?.preciousStones || 
                            embellishmentsByContainer[hat.containerId]?.fabric || 
                            embellishmentsByContainer[hat.containerId]?.jewelry) && (
                            <div className="mb-4 space-y-2 w-full">
                              {embellishmentsByContainer[hat.containerId]?.preciousStones && (
                                <div className="px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                                  <p className="text-sm text-gray-600 mb-1">Accessories:</p>
                                  <p className="font-bold text-pink-600 mb-1">Gemstones | {embellishmentsByContainer[hat.containerId]?.preciousStones || ''}</p>
                                  <p className="text-xs text-gray-500">+€{stonesPrice.toFixed(2)}</p>
                                </div>
                              )}
                              {embellishmentsByContainer[hat.containerId]?.fabric && (
                                <div className="px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                                  <p className="text-sm text-gray-600 mb-1">Accessories:</p>
                                  <p className="font-bold text-pink-600 mb-1">Fabric | {embellishmentsByContainer[hat.containerId]?.fabric || ''}</p>
                                  <p className="text-xs text-gray-500">+€{fabricPrice.toFixed(2)}</p>
                                </div>
                              )}
                              {embellishmentsByContainer[hat.containerId]?.jewelry && (
                                <div className="px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                                  <p className="text-sm text-gray-600 mb-1">Accessories:</p>
                                  <p className="font-bold text-pink-600 mb-1">Jewelry | {embellishmentsByContainer[hat.containerId]?.jewelry || ''}</p>
                                  <p className="text-xs text-gray-500">+€{jewelryPrice.toFixed(2)}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Notes Display */}
                          {embellishmentsByContainer[hat.containerId]?.notes && (
                            <div className="mb-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 w-full">
                              <p className="text-xs text-gray-600 mb-1 font-semibold">📝 Notes:</p>
                              <p className="text-sm text-gray-700 italic">{embellishmentsByContainer[hat.containerId]?.notes || ''}</p>
                            </div>
                          )}
                          
                          {/* Birth Date Display */}
                          {embellishmentsByContainer[hat.containerId]?.birthDate && (
                            <div className="mb-3 px-3 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 w-full">
                              <p className="text-xs text-gray-600 mb-1 font-semibold">🎂 Birth Date:</p>
                              <p className="text-sm text-gray-700">
                                {embellishmentsByContainer[hat.containerId]?.birthDate ? new Date(embellishmentsByContainer[hat.containerId]!.birthDate).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                }) : ''}
                              </p>
                            </div>
                          )}
                          
                          {/* Price for this hat - "Initial Price" before customization, "Total Price" after */}
                          <div className="mt-4 mb-4 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300 w-full">
                            <p className="text-sm text-gray-600 mb-1">
                              {isCustomized ? 'Total Price:' : 'Initial Price:'}
                            </p>
                            <p 
                              className={`text-2xl font-bold text-purple-600 transition-all duration-500 ${
                                showArtPriceAnimation && customizingHatContainerId === hat.containerId ? 'animate-price-add' : ''
                              }`}
                              key={`hat-card-total-${hat.containerId}-${hatTotalPrice}-${showArtPriceAnimation}`}
                            >
                              €{hatTotalPrice.toFixed(2)}
                            </p>
                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                              <p>{isCustomizingExistingHat ? 'Finished Hat' : 'Base'}: €{basePrice.toFixed(2)}</p>
                              {hatArtPrice > 0 && (
                                <p 
                                  className={showArtPriceAnimation && customizingHatContainerId === hat.containerId ? 'animate-price-add text-purple-600 font-semibold' : ''}
                                >
                                  Art: +€{hatArtPrice.toFixed(2)}
                                </p>
                              )}
                              {totalAccessoriesPrice > 0 && <p>Accessories: +€{totalAccessoriesPrice.toFixed(2)}</p>}
                            </div>
                          </div>
                          
                          <div className="mt-auto w-full">
                            <RainbowButton 
                              onClick={() => handleCustomize(hat.containerId)} 
                              className="w-full"
                            >
                              Customize
                            </RainbowButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Add New Hat Card - Always shown after saved hats */}
                  <button
                    onClick={() => setShowAddHatModal(true)}
                    className="flex flex-col p-6 rounded-lg bg-white border-2 border-dashed border-gray-300 h-full min-h-[400px] shadow-sm hover:shadow-lg hover:border-pink-400 transition-all duration-300 items-center justify-center cursor-pointer group"
                  >
                    <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 group-hover:from-pink-50 group-hover:to-purple-50 transition-all duration-300">
                      {/* Hat placeholder circle */}
                      <div className="w-32 h-32 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                        <svg 
                          className="w-16 h-16 text-gray-400 group-hover:text-pink-400 transition-colors duration-300" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      {/* Plus sign overlay */}
                      <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg 
                          className="w-6 h-6 text-white" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-gray-700 group-hover:text-pink-600 transition-colors duration-300">Add New Hat</p>
                  </button>
                </div>
                  {savedHats.length > 0 && (() => {
                    // Check if at least one hat has been customized
                    const hasCustomizedHat = savedHats.some(hat => {
                      const embellishments = embellishmentsByContainer[hat.containerId] || {};
                      return !!(embellishments.art || embellishments.preciousStones || embellishments.jewelry || embellishments.fabric);
                    });
                    
                    // Only show button if at least one hat has been customized
                    if (!hasCustomizedHat) return null;
                    
                    return (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        {/* Title and Subtitle */}
                        <div className="text-center mb-6">
                          <h3 className="text-3xl md:text-4xl font-serif font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent animate-gradient-shift">
                            Finished Customization?
                          </h3>
                          <p className="text-lg md:text-xl text-gray-600 font-medium italic">
                            Ready to get your customization started?
                          </p>
                        </div>
                        
                        {/* Enhanced Finalize Button with Rainbow Effects */}
                        <div className="relative">
                          {/* Animated glow layers */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 via-orange-500 to-purple-500 rounded-lg blur-xl opacity-60 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-blue-500 rounded-lg blur-lg opacity-40 animate-gradient-shift" style={{ backgroundSize: '200% 200%', animationDelay: '0.5s' }} />
                          
                          {/* Button */}
                          <button
                            onClick={() => {
                              setCurrentStep(4);
                              setTimeout(() => scrollToElement('step-4'), 100);
                            }}
                            className="relative w-full text-lg px-8 py-4 font-bold text-white rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl overflow-hidden group"
                            style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
                              backgroundSize: '200% 200%',
                              animation: 'gradient-shift 3s ease infinite',
                            }}
                          >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            
                            {/* Text */}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              <span>Finalize Custom Order</span>
                              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </span>
                            
                            {/* Pulsing ring effect */}
                            <div className="absolute inset-0 rounded-lg border-2 border-white/50 animate-pulse-ring" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Empty state or Add New Hat button */}
            {savedHats.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg mb-4">No hats selected yet</p>
                <RainbowButton 
                  onClick={() => setShowAddHatModal(true)}
                  className="text-lg px-8 py-3"
                >
                  Add New Hat
                </RainbowButton>
              </div>
            )}

          </section>
        )}

        {/* Step 1: Choose Hat Shape */}
        {currentStep === 1 && (
          <section id="step-1" className="mb-16">
            <div className="mb-4">
              {savedHats.length > 0 && (
                <button
                  onClick={() => {
                    setCurrentStep(0);
                    setTimeout(() => scrollToElement('hat-selection-summary'), 100);
                  }}
                  className="text-gray-600 hover:text-black transition-colors mb-4"
                >
                  ← Back to Customizer
                </button>
              )}
            </div>
            <h2 className="text-4xl font-bold mb-4">STEP 1: Choose Your Hat's Shape</h2>
            <p className="text-xl text-gray-600 mb-8">Ultra-High Quality Suede Hats Hand-Crafted</p>
            
            {loadingShapes ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">Loading hat shapes...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-8">
                {hatForms.length > 0 ? (
                  hatForms.map((form) => (
                    <div
                      key={form}
                      onClick={() => handleShapeSelect(form)}
                      className="group bg-white rounded-lg p-8 border-2 border-gray-200 hover:border-pink-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[450px] flex flex-col cursor-pointer"
                    >
                      <div className="relative h-64 w-full mb-6 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        {hatShapeImages[form] ? (
                          <WixImage
                            src={hatShapeImages[form]}
                            alt={`${form} hat shape`}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 25vw"
                          />
                        ) : (
                          /* Fallback icons while images load */
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            {form === 'Golf' && '⛳'}
                            {form === 'Arrow' && '🏹'}
                            {form === 'Flat' && '🎩'}
                            {form === 'Heart' && '❤️'}
                            {!['Golf', 'Arrow', 'Flat', 'Heart'].includes(form) && '🎩'}
                          </div>
                        )}
                      </div>
                      <h3 className="text-2xl font-script mb-1 text-center text-gray-800 flex-shrink-0">{form}</h3>
                      <p className="text-sm font-semibold text-gray-500 text-center mb-4 uppercase tracking-wide">
                        {form === 'Heart' && 'Bold & romantic.'}
                        {form === 'Arrow' && 'Sharp & striking.'}
                        {form === 'Flat' && 'Classic elegance.'}
                        {form === 'Golf' && 'Refined & ready.'}
                        {!['Heart', 'Arrow', 'Flat', 'Golf'].includes(form) && 'Hand-crafted style.'}
                      </p>
                      <div className="mt-auto">
                        <RainbowButton 
                          variant="primary" 
                          className="w-full"
                          onClick={() => {
                            handleShapeSelect(form);
                          }}
                        >
                          Select
                        </RainbowButton>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-20">
                    <p className="text-gray-500 text-lg mb-4">No hat shapes available</p>
                    <p className="text-sm text-gray-400">Please check your Wix CMS connection</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Step 2: Choose Hat Color */}
        {currentStep === 2 && selectedShape && (
          <section className="mb-16">
            <div className="mb-4">
              {savedHats.length > 0 ? (
                <button
                  onClick={() => {
                    setCurrentStep(0);
                    setSelectedShape(null);
                    setHatColors([]);
                    setSelectedHats([]);
                    setTimeout(() => scrollToElement('hat-selection-summary'), 100);
                  }}
                  className="text-gray-600 hover:text-black transition-colors mb-4"
                >
                  ← Back to Customizer
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedShape(null);
                    setHatColors([]);
                    setSelectedHats([]);
                    setTimeout(() => scrollToElement('step-1'), 100);
                  }}
                  className="text-gray-600 hover:text-black transition-colors mb-4"
                >
                  ← Back to Shapes
                </button>
              )}
            </div>

            <h2 className="text-4xl font-bold mb-4">STEP 2: Choose Your Hat's Color</h2>
            <p className="text-xl text-gray-600 mb-2">Vibrant Royal Suede Colors. Soft Suede. Select one or as many as you want.</p>
            <p className="text-lg text-gray-700 mb-6">Shape: <strong>{selectedShape}</strong></p>

            {loadingColors ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">Loading hat colors...</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 grid md:grid-cols-3 gap-6">
                {hatColors.length > 0 ? (
                  hatColors.map((hat) => {
                    const sel = selectedHats.find(h => h._id === hat._id);
                    const isSelected = !!sel;
                    const containerId = sel?.containerId;
                    return (
                      <div
                        key={hat._id}
                        onClick={() => handleHatSelect(hat)}
                        className={`group bg-white rounded-lg p-6 hover:shadow-xl transition-all duration-300 border-2 cursor-pointer ${
                          isSelected ? 'border-pink-400 ring-2 ring-pink-200' : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        {hat.hatProductImage && (
                          <div className="relative h-64 w-full mb-4 rounded-lg overflow-hidden bg-white">
                            <WixImage
                              src={hat.hatProductImage}
                              alt={hat.hatProductName || hat.hatColorName || 'Hat'}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          </div>
                        )}
                        <div className="mb-4 flex items-center justify-center gap-2">
                          {hat.hatColor && hat.hatColor.length > 0 ? (
                            <div className="flex gap-3 flex-wrap justify-center">
                              {hat.hatColor.map((colorHex: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="w-12 h-12 rounded border-2 border-gray-400 shadow-sm"
                                  style={{ backgroundColor: colorHex }}
                                  title={colorHex}
                                />
                              ))}
                            </div>
                          ) : hat.hatColorHex ? (
                            <div
                              className="w-12 h-12 rounded border-2 border-gray-400 shadow-sm"
                              style={{ backgroundColor: hat.hatColorHex }}
                              title={hat.hatColorHex}
                            />
                          ) : null}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-lg mb-1">{hat.hatProductName || hat.hatColorName || 'Hat'}</p>
                          {hat.hatColorName && <p className="text-sm text-gray-600 mb-2">{hat.hatColorName}</p>}
                          {hat.hatColorHex && <p className="text-xs text-gray-500 mb-2 font-mono">{hat.hatColorHex}</p>}
                          <p className="text-gray-800 text-xl font-bold">€{hat.rawHatPrice || 0}</p>
                        </div>
                        {isSelected && containerId && (
                          <div className="mt-4 flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => handleAmountChange(containerId, -1, e)}
                              className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold text-lg"
                            >
                              −
                            </button>
                            <span className="font-semibold min-w-[1.5rem] text-center">{sel.amount}</span>
                            <button
                              type="button"
                              onClick={(e) => handleAmountChange(containerId, 1, e)}
                              className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold text-lg"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-20">
                    <p className="text-gray-500 text-lg mb-4">No hats available for {selectedShape}</p>
                    <p className="text-sm text-gray-400">Please check your Wix CMS connection and ensure hats exist in rawHatCollection with hatForm: {selectedShape}</p>
                  </div>
                )}
                </div>

                {/* Right-side Confirm Color card */}
                <div className="lg:w-64 shrink-0">
                  <div className="p-6 rounded-lg bg-white border-2 border-gray-200 shadow-sm sticky top-4">
                    {selectedHats.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-400 text-sm mb-2">No hats selected</p>
                        <p className="text-gray-300 text-xs">Select a hat to continue</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-gray-800 mb-4 text-center text-sm">
                          {selectedHats.reduce((s, h) => s + h.amount, 0)} hat(s) selected
                        </p>
                        
                        {/* Tiny elegant preview cards */}
                        <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                          {selectedHats.map((hat) => {
                            const originalHat = hatColors.find(h => h._id === hat._id);
                            return (
                              <div 
                                key={hat.containerId}
                                className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 shadow-sm"
                              >
                                {/* Tiny image preview */}
                                {hat.hatProductImage && (
                                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-white flex-shrink-0 border border-gray-200">
                                    <WixImage
                                      src={hat.hatProductImage}
                                      alt={`${hat.hatForm} | ${hat.hatColorName}`}
                                      fill
                                      className="object-contain"
                                      sizes="48px"
                                    />
                                  </div>
                                )}
                                {/* Name and quantity */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 truncate">
                                    {hat.hatForm} | {hat.hatColorName}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Qty: {hat.amount}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <RainbowButton 
                          onClick={handleConfirmHats} 
                          className="w-full"
                        >
                          Confirm Color
                        </RainbowButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Step 3: Embellishments — shown inline in main view when Customize is clicked */}
        {currentStep === 0 && customizingHatContainerId && (() => {
          const hat = savedHats.find(h => h.containerId === customizingHatContainerId);
          if (!hat) return null;
          
          const basePrice = getBaseHatPrice();
          
          // Calculate individual category prices (art price is global, always included)
          const artPrice = artCurrentPrice; // Global price, always running
          
          // Include price if an option is selected (regardless of checkbox state - selection implies inclusion)
          // Use default options if API options are empty
          const allStonesOptions = preciousStonesOptions.length > 0 ? preciousStonesOptions : [
            { _id: 'diamond', accessoryName: 'Diamond', accessoryPrice: 150 },
            { _id: 'ruby', accessoryName: 'Ruby', accessoryPrice: 120 },
            { _id: 'emerald', accessoryName: 'Emerald', accessoryPrice: 130 },
            { _id: 'sapphire', accessoryName: 'Sapphire', accessoryPrice: 125 },
            { _id: 'pearl', accessoryName: 'Pearl', accessoryPrice: 100 },
            { _id: 'amethyst', accessoryName: 'Amethyst', accessoryPrice: 80 }
          ];
          const allJewelryOptions = jewelryOptions.length > 0 ? jewelryOptions : [
            { _id: 'gold-chain', accessoryName: 'Gold Chain', accessoryPrice: 200 },
            { _id: 'silver-beads', accessoryName: 'Silver Beads', accessoryPrice: 150 },
            { _id: 'crystal-pendant', accessoryName: 'Crystal Pendant', accessoryPrice: 180 },
            { _id: 'pearl-strand', accessoryName: 'Pearl Strand', accessoryPrice: 170 },
            { _id: 'diamond-clip', accessoryName: 'Diamond Clip', accessoryPrice: 250 },
            { _id: 'vintage-brooch', accessoryName: 'Vintage Brooch', accessoryPrice: 190 }
          ];
          const allFabricOptions = fabricOptions.length > 0 ? fabricOptions : [
            { _id: 'silk', accessoryName: 'Silk', accessoryPrice: 90 },
            { _id: 'velvet', accessoryName: 'Velvet', accessoryPrice: 85 },
            { _id: 'satin', accessoryName: 'Satin', accessoryPrice: 75 },
            { _id: 'leather', accessoryName: 'Leather', accessoryPrice: 110 },
            { _id: 'suede', accessoryName: 'Suede', accessoryPrice: 95 },
            { _id: 'cashmere', accessoryName: 'Cashmere', accessoryPrice: 120 }
          ];
          
          // Case-insensitive matching for accessory prices - use adjusted price if set
          // Note: selectedPreciousStones and selectedJewelry are base names, not combo names
          const stonesPrice = selectedPreciousStones 
            ? (preciousStoneAdjustedPrice > 0 
                ? preciousStoneAdjustedPrice 
                : allStonesOptions.find(s => s.accessoryName.toLowerCase() === selectedPreciousStones.toLowerCase())?.accessoryPrice || 0)
            : 0;
          const jewelryPrice = selectedJewelry 
            ? (jewelryAdjustedPrice > 0 
                ? jewelryAdjustedPrice 
                : allJewelryOptions.find(j => j.accessoryName.toLowerCase() === selectedJewelry.toLowerCase())?.accessoryPrice || 0)
            : 0;
          const fabricPrice = selectedFabric ? allFabricOptions.find(f => f.accessoryName.toLowerCase() === selectedFabric.toLowerCase())?.accessoryPrice || 0 : 0;
          const totalAccessoriesPrice = stonesPrice + jewelryPrice + fabricPrice;
          
          // Debug logging
          console.log('💰 Accessories Price Calculation:', {
            selectedPreciousStones,
            selectedJewelry,
            selectedFabric,
            stonesPrice,
            jewelryPrice,
            fabricPrice,
            totalAccessoriesPrice
          });
          
          // Customization = Art price only (accessories are separate)
          // Only include art price if checkbox is checked (after animation completes)
          const customizationPrice = artChecked ? artPrice : 0;
          // Total = Base + Art (if checked) + Accessories
          const totalPrice = basePrice + (artChecked ? artPrice : 0) + totalAccessoriesPrice;
          
          return (
            <section id={`customize-${customizingHatContainerId}`} className="mb-16 relative">
              <div className="mb-4 relative z-10">
                <button
                  onClick={() => {
                    saveEmbellishmentsAndBackToSaved();
                    setTimeout(() => scrollToElement('hat-selection-summary'), 100);
                  }}
                  className="text-gray-600 hover:text-black transition-colors mb-4"
                >
                  ← Back to Hat Selection
                </button>
              </div>
              
              <div className="mb-6 relative z-10">
                <p className="text-lg text-pink-700 font-semibold mb-4">Customizing: {hat.hatForm} | {hat.hatColorName}</p>
                
                {/* Horizontal Price Summary */}
                <div className="bg-white border-2 border-purple-200 rounded-lg p-6 shadow-md mb-4">
                  <div className="flex items-center gap-8 justify-center flex-wrap">
                    <div className="text-center min-w-[120px]">
                      <p className="text-sm text-gray-600 mb-1">{isCustomizingExistingHat ? 'Finished Hat' : 'Base Hat'}</p>
                      <p className="text-2xl font-bold text-gray-900">€{basePrice.toFixed(2)}</p>
                    </div>
                    <div className="text-center min-w-[120px]">
                      <p className="text-sm text-gray-600 mb-1">Customization</p>
                      <p 
                        className={`text-2xl font-bold text-pink-600 transition-all duration-500 ${
                          showArtPriceAnimation ? 'animate-price-add' : ''
                        }`}
                        key={`customization-top-${customizationPrice}-${showArtPriceAnimation}`}
                      >
                        +€{customizationPrice.toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Accessories Section - Total Price Only */}
                    <div className="text-center min-w-[120px]">
                      <p className="text-sm text-gray-600 mb-1">Accessories</p>
                      <p 
                        className="text-2xl font-bold text-purple-600 transition-all duration-300"
                        key={`accessories-${totalAccessoriesPrice}`}
                      >
                        +€{totalAccessoriesPrice.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="text-center min-w-[120px]">
                      <p className="text-sm text-gray-600 mb-1">Total Price</p>
                      <p 
                        className={`text-2xl font-bold text-purple-600 transition-all duration-500 ${
                          showArtPriceAnimation ? 'animate-price-add' : ''
                        }`}
                        key={`total-top-${totalPrice}-${showArtPriceAnimation}`}
                      >
                        €{totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <RainbowButton
                        onClick={() => {
                          saveEmbellishmentsAndBackToSaved();
                          setTimeout(() => scrollToElement('hat-selection-summary'), 100);
                        }}
                        className="px-8 py-3"
                      >
                        Save & Continue
                      </RainbowButton>
                    </div>
                  </div>
                </div>
              </div>
              
              <h2 className="text-4xl font-bold mb-4 relative z-10">STEP 3: Select Your Hat Embellishments</h2>
              <p className="text-xl text-gray-600 mb-8 relative z-10">Art, Jewelry & Exotic Accessories</p>

              {/* Art Section - 3 Column Layout */}
              <div className="grid md:grid-cols-3 gap-6 mb-6 relative z-10">
                {/* Left Column: Hat Image */}
                <div className="flex flex-col items-center">
                  {hat.hatProductImage && (
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white flex items-center justify-center border-2 border-gray-200 shadow-md">
                      <WixImage
                        src={hat.hatProductImage}
                        alt={`${hat.hatForm} | ${hat.hatColorName}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                </div>

                {/* Center Column: Art Selection Card */}
                <div id={`art-section-${customizingHatContainerId}`} className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    {/* Art checkbox - automatically checked, round, bigger, with colored shadow, cannot be unchecked */}
                    <div className="relative">
                      <input
                        type="checkbox"
                        id={`artCheckbox-${customizingHatContainerId}`}
                        checked={artChecked}
                        disabled={true} // Always disabled (cannot uncheck)
                        readOnly
                        className={`w-8 h-8 rounded-full border-2 border-pink-400 text-pink-500 focus:ring-pink-500 focus:ring-2 cursor-default appearance-none checked:bg-pink-500 checked:border-pink-500 transition-all duration-300 ${
                          isAnimatingArtCheck ? 'animate-art-check' : ''
                        }`}
                        style={{
                          boxShadow: artChecked 
                            ? '0 0 0 3px rgba(236, 72, 153, 0.3), 0 0 0 6px rgba(168, 85, 247, 0.2), 0 4px 6px rgba(236, 72, 153, 0.4)' 
                            : isAnimatingArtCheck
                            ? '0 0 0 2px rgba(236, 72, 153, 0.2), 0 0 0 4px rgba(168, 85, 247, 0.1)'
                            : 'none',
                          transform: isAnimatingArtCheck ? 'scale(1.1)' : artChecked ? 'scale(1)' : 'scale(0.9)',
                          opacity: isAnimatingArtCheck ? 0.7 : 1
                        }}
                      />
                      {artChecked && (
                        <svg 
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none transition-all duration-300 animate-checkmark" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <label htmlFor={`artCheckbox-${customizingHatContainerId}`} className="text-2xl font-bold cursor-default">Art</label>
                  </div>
                  {artChecked && (() => {
                    const currentArtStep = artStepByContainer[customizingHatContainerId] || 1;
                    const currentArtColors = selectedArtColorsByContainer[customizingHatContainerId] || [];
                    const currentArtDescription = artDescriptionByContainer[customizingHatContainerId] || '';
                    const isArtConfirmed = artConfirmedByContainer[customizingHatContainerId] || false;
                    
                    // If confirmed, show summary card
                    if (isArtConfirmed) {
                      const savedArt = embellishmentsByContainer[customizingHatContainerId]?.art || selectedArt;
                      const savedColors = currentArtColors;
                      const savedDescription = currentArtDescription;
                      
                      // Art icons
                      const artIcons: Record<string, string> = {
                        'Subtle': '🎨',
                        'Vibrant': '🌈',
                        'Savage': '🔥',
                        'Explosive': '💥'
                      };
                      
                      // Color classes
                      const colorClasses: Record<string, string> = {
                        'Purple': 'bg-purple-500',
                        'Blue': 'bg-blue-500',
                        'Red': 'bg-red-500',
                        'Green': 'bg-green-500',
                        'Yellow': 'bg-yellow-400',
                        'Orange': 'bg-orange-500',
                        'Pink': 'bg-pink-500',
                        'Black': 'bg-black'
                      };
                      
                      return (
                        <div className="space-y-3 animate-fade-in">
                          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border-2 border-pink-300">
                            <h3 className="font-bold text-lg text-gray-900 mb-4">Confirmed Art Details</h3>
                            
                            {/* Art Type - Visual Card */}
                            <div className="mb-4">
                              <p className="text-xs text-gray-600 mb-2 font-semibold">Art Type</p>
                              <div className="flex items-center justify-between py-2 px-4 rounded-lg border-2 border-pink-500 bg-pink-50 shadow-md">
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">{artIcons[savedArt] || '✨'}</span>
                                  <span className="font-medium text-base">{savedArt}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Colors - Visual Swatches */}
                            <div className="mb-4">
                              <p className="text-xs text-gray-600 mb-2 font-semibold">Colors</p>
                              <div className="grid grid-cols-2 gap-2">
                                {savedColors.map((color) => (
                                  <div
                                    key={color}
                                    className={`p-3 rounded-lg border-2 border-pink-500 shadow-md ${colorClasses[color] || 'bg-gray-500'} text-white font-medium text-sm flex items-center justify-center`}
                                  >
                                    {color}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Notes - Styled Box */}
                            {savedDescription && (
                              <div className="mb-4">
                                <p className="text-xs text-gray-600 mb-2 font-semibold">Notes</p>
                                <div className="p-3 bg-white rounded-lg border-2 border-gray-200">
                                  <p className="text-sm text-gray-900">{savedDescription}</p>
                                </div>
                              </div>
                            )}
                            
                            <button
                              onClick={() => {
                                setArtConfirmedByContainer(prev => ({ ...prev, [customizingHatContainerId]: false }));
                                setArtStepByContainer(prev => ({ ...prev, [customizingHatContainerId]: 1 }));
                              }}
                              className="mt-3 text-sm text-pink-600 hover:text-pink-800 underline"
                            >
                              Edit Art Details
                            </button>
                          </div>
                        </div>
                      );
                    }
                    
                    // 3-step process
                    const artColors = ['Purple', 'Blue', 'Red', 'Green', 'Yellow', 'Orange', 'Pink', 'Black'];
                    const artIcons: Record<string, string> = {
                      'Subtle': '🎨',
                      'Vibrant': '🌈',
                      'Savage': '🔥',
                      'Explosive': '💥'
                    };
                    
                    return (
                      <div className="space-y-4 animate-fade-in">
                        {/* 3-Step Progress Bar */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1 flex items-center">
                            <div className={`flex-1 h-1 ${currentArtStep >= 1 ? 'bg-pink-500' : 'bg-gray-200'}`} />
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              currentArtStep >= 1 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              1
                            </div>
                            <div className={`flex-1 h-1 ${currentArtStep >= 2 ? 'bg-pink-500' : 'bg-gray-200'}`} />
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              currentArtStep >= 2 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              2
                            </div>
                            <div className={`flex-1 h-1 ${currentArtStep >= 3 ? 'bg-pink-500' : 'bg-gray-200'}`} />
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              currentArtStep >= 3 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              3
                            </div>
                            <div className={`flex-1 h-1 ${currentArtStep >= 3 ? 'bg-pink-500' : 'bg-gray-200'}`} />
                          </div>
                        </div>
                        
                        {/* Step 1: Art Type Selection */}
                        {currentArtStep === 1 && (
                          <div className="space-y-3">
                            <p className="text-gray-600 text-sm mb-1">Choose the art intensity you desire for your hat</p>
                            <div className="grid gap-3">
                              {['Subtle', 'Vibrant', 'Savage', 'Explosive'].map((artStyle) => (
                                <label 
                                  key={artStyle} 
                                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                                    selectedArt === artStyle 
                                      ? 'border-pink-500 bg-pink-50 shadow-md scale-105' 
                                      : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name={`art-${customizingHatContainerId}`}
                                      value={artStyle}
                                      checked={selectedArt === artStyle}
                                      onChange={(e) => {
                                        setSelectedArt(e.target.value);
                                      }}
                                      className="w-5 h-5 text-pink-500 focus:ring-pink-500"
                                    />
                                    <span className="text-2xl">{artIcons[artStyle] || '✨'}</span>
                                    <span className="font-medium text-lg">{artStyle}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                            {selectedArt && (
                              <button
                                onClick={() => {
                                  setArtStepByContainer(prev => ({ ...prev, [customizingHatContainerId]: 2 }));
                                }}
                                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                              >
                                Next
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Step 2: Color Selection */}
                        {currentArtStep === 2 && (
                          <div className="space-y-3">
                            <p className="text-gray-700 font-semibold mb-2">Select Colors (up to 3)</p>
                            <p className="text-xs text-gray-500 mb-3">Art Type: <span className="font-semibold">{selectedArt}</span></p>
                            <div className="grid grid-cols-2 gap-2">
                              {artColors.map((color) => {
                                const isSelected = currentArtColors.includes(color);
                                const colorClasses: Record<string, string> = {
                                  'Purple': 'bg-purple-500',
                                  'Blue': 'bg-blue-500',
                                  'Red': 'bg-red-500',
                                  'Green': 'bg-green-500',
                                  'Yellow': 'bg-yellow-400',
                                  'Orange': 'bg-orange-500',
                                  'Pink': 'bg-pink-500',
                                  'Black': 'bg-black'
                                };
                                
                                return (
                                  <button
                                    key={color}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedArtColorsByContainer(prev => ({
                                          ...prev,
                                          [customizingHatContainerId]: (prev[customizingHatContainerId] || []).filter(c => c !== color)
                                        }));
                                      } else if (currentArtColors.length < 3) {
                                        setSelectedArtColorsByContainer(prev => ({
                                          ...prev,
                                          [customizingHatContainerId]: [...(prev[customizingHatContainerId] || []), color]
                                        }));
                                      }
                                    }}
                                    disabled={!isSelected && currentArtColors.length >= 3}
                                    className={`p-3 rounded-lg border-2 transition-all duration-300 text-white font-medium text-sm ${
                                      isSelected
                                        ? 'border-pink-500 shadow-md scale-105'
                                        : currentArtColors.length >= 3
                                        ? 'border-gray-200 opacity-50 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-pink-300'
                                    } ${colorClasses[color] || 'bg-gray-500'}`}
                                  >
                                    {color}
                                  </button>
                                );
                              })}
                            </div>
                            {currentArtColors.length > 0 && (
                              <div className="mt-3 p-2 bg-pink-50 rounded-lg border border-pink-200">
                                <p className="text-xs text-gray-600">
                                  Selected: <span className="font-semibold text-pink-700">{currentArtColors.join(', ')}</span>
                                </p>
                              </div>
                            )}
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => {
                                  setArtStepByContainer(prev => ({ ...prev, [customizingHatContainerId]: 1 }));
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Back
                              </button>
                              {currentArtColors.length >= 2 && (
                                <button
                                  onClick={() => {
                                    setArtStepByContainer(prev => ({ ...prev, [customizingHatContainerId]: 3 }));
                                  }}
                                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                                >
                                  Next
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Step 3: Description - IMAGINE */}
                        {currentArtStep === 3 && (
                          <div className="space-y-3">
                            <p className="text-gray-600 text-sm mb-1">Share any specific details or notes about your art design vision</p>
                            <p className="text-gray-700 font-semibold mb-2">IMAGINE — Add Art Design Notes</p>
                            <p className="text-xs text-gray-500 mb-2">Click a suggestion to add it:</p>
                            <div className="flex flex-wrap gap-2 mb-2 max-h-24 overflow-y-auto">
                              {IMAGINE_COMBOS.map((combo, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setArtDescriptionByContainer(prev => ({
                                      ...prev,
                                      [customizingHatContainerId]: (prev[customizingHatContainerId] || '')
                                        ? `${prev[customizingHatContainerId]}\n${combo}`
                                        : combo
                                    }));
                                  }}
                                  className="px-2 py-1 text-[10px] font-medium rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200 transition-colors whitespace-nowrap"
                                >
                                  {combo}
                                </button>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <div className="p-2 bg-pink-50 rounded-lg border border-pink-200">
                                <p className="text-xs text-gray-600 mb-1">
                                  Art Type: <span className="font-semibold">{selectedArt}</span>
                                </p>
                                <p className="text-xs text-gray-600">
                                  Colors: <span className="font-semibold">{currentArtColors.join(', ')}</span>
                                </p>
                              </div>
                              <textarea
                                value={currentArtDescription}
                                onChange={(e) => {
                                  setArtDescriptionByContainer(prev => ({
                                    ...prev,
                                    [customizingHatContainerId]: e.target.value
                                  }));
                                }}
                                placeholder="IMAGINE... e.g. tropical sunset, disco ball, peacock feathers..."
                                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none resize-none"
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => {
                                  setArtStepByContainer(prev => ({ ...prev, [customizingHatContainerId]: 2 }));
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Back
                              </button>
                              <button
                                onClick={() => {
                                  // Save art details and confirm
                                  setArtConfirmedByContainer(prev => ({ ...prev, [customizingHatContainerId]: true }));
                                  // Also update embellishments - preserve all existing fields
                                  setEmbellishmentsByContainer(prev => {
                                    const existing = prev[customizingHatContainerId] || {
                                      art: '',
                                      preciousStones: '',
                                      jewelry: '',
                                      fabric: '',
                                      notes: '',
                                      birthDate: ''
                                    };
                                    return {
                                      ...prev,
                                      [customizingHatContainerId]: {
                                        ...existing,
                                        art: selectedArt,
                                        artColors: currentArtColors.join(', '),
                                        artDescription: currentArtDescription
                                      }
                                    };
                                  });
                                  console.log('✅ Art confirmed:', {
                                    containerId: customizingHatContainerId,
                                    art: selectedArt,
                                    colors: currentArtColors.join(', '),
                                    description: currentArtDescription
                                  });
                                }}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Right Column: Art Customization Price Display - Elegant & Dynamic */}
                <div className="flex flex-col">
                  <div 
                    className="relative p-6 rounded-2xl h-full flex flex-col justify-center overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.98) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid',
                      borderImage: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3), rgba(59, 130, 246, 0.3)) 1',
                      boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15), 0 4px 16px rgba(236, 72, 153, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    {/* Animated gradient background overlay */}
                    <div 
                      className="absolute inset-0 opacity-30 pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))',
                        backgroundSize: '200% 200%',
                        animation: 'gradient-shift 8s ease infinite'
                      }}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="text-center mb-6">
                        <div className="inline-block mb-2">
                          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.15em] mb-1">ART CUSTOMIZATION</p>
                          <div className="h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full" />
                        </div>
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.15em]">PRICE</p>
                      </div>

                      {/* Main Price Display - Dynamic & Animated */}
                      <div className="mb-6">
                        <div className="relative">
                          <div 
                            className="text-4xl font-bold mb-1 text-center transition-all duration-300"
                            style={{
                              background: 'linear-gradient(135deg, #f97316, #ec4899, #a855f7)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              filter: 'drop-shadow(0 2px 4px rgba(236, 72, 153, 0.3))',
                              animation: artCurrentPrice > artBasePrice ? 'pulse 2s ease-in-out infinite' : 'none'
                            }}
                          >
                            €{artCurrentPrice > 0 ? artCurrentPrice.toFixed(2) : '0.00'}
                          </div>
                          {artCurrentPrice > artBasePrice && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                          )}
                        </div>
                      </div>

                      {/* Elegant Breakdown Section */}
                      <div className="space-y-3 pt-4 border-t border-gray-200">
                        {/* Base Price */}
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-purple-50/30">
                          <span className="text-xs font-medium text-gray-600">Base</span>
                          <span className="text-sm font-bold text-purple-700">€{artBasePrice > 0 ? artBasePrice.toFixed(2) : '0.00'}</span>
                        </div>

                        {/* Increment - Animated */}
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-pink-50/50 to-purple-50/50 border border-pink-200/50">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">↑</span>
                            </div>
                            <span className="text-xs font-medium text-gray-600">Increment</span>
                          </div>
                          <span className="text-sm font-bold text-pink-600 animate-pulse">+€{artPriceIncrement.toFixed(2)}</span>
                        </div>

                        {/* Countdown Timer - Dynamic Progress */}
                        <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">Next Increase</span>
                            <span className="text-xs font-bold text-purple-600">{artCountdown} ms</span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full transition-all duration-100 ease-linear"
                              style={{ 
                                width: `${((artIntervalMs - artCountdown) / artIntervalMs) * 100}%`,
                                boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accessory Category Buttons */}
              <div className="grid md:grid-cols-3 gap-6 mb-8 relative z-10">
                <button
                  onClick={() => setPreciousStonesChecked(!preciousStonesChecked)}
                  className={`p-8 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    preciousStonesChecked 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg ring-2 ring-purple-200' 
                      : 'border-gray-200 hover:border-purple-300 bg-white hover:shadow-md'
                  }`}
                >
                  <div className="text-5xl mb-3">💎</div>
                  <p className="font-bold text-lg mb-2">GemStones</p>
                  {preciousStonesChecked && stonesPrice > 0 && (
                    <p className="text-sm font-semibold text-purple-600">+€{stonesPrice.toFixed(2)}</p>
                  )}
                </button>
                <button
                  onClick={() => setFabricChecked(!fabricChecked)}
                  className={`p-8 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    fabricChecked 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg ring-2 ring-purple-200' 
                      : 'border-gray-200 hover:border-purple-300 bg-white hover:shadow-md'
                  }`}
                >
                  <div className="text-5xl mb-3">🧵</div>
                  <p className="font-bold text-lg mb-2">Fabric</p>
                  {fabricChecked && fabricPrice > 0 && (
                    <p className="text-sm font-semibold text-purple-600">+€{fabricPrice.toFixed(2)}</p>
                  )}
                </button>
                <button
                  onClick={() => setJewelryChecked(!jewelryChecked)}
                  className={`p-8 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    jewelryChecked 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg ring-2 ring-purple-200' 
                      : 'border-gray-200 hover:border-purple-300 bg-white hover:shadow-md'
                  }`}
                >
                  <div className="text-5xl mb-3">💍</div>
                  <p className="font-bold text-lg mb-2">Jewelry</p>
                  {jewelryChecked && jewelryPrice > 0 && (
                    <p className="text-sm font-semibold text-purple-600">+€{jewelryPrice.toFixed(2)}</p>
                  )}
                </button>
              </div>

              {/* Precious Stones Options */}
              {preciousStonesChecked && (
                <div className="bg-white rounded-xl p-6 mb-6 border-2 border-purple-200 shadow-lg animate-fade-in relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-purple-700">Precious Stones</h3>
                    {(preciousStoneAdjustedPrice > 0 ? preciousStoneAdjustedPrice : stonesPrice) > 0 && (
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg text-white font-bold text-lg animate-pulse">
                        +€{(preciousStoneAdjustedPrice > 0 ? preciousStoneAdjustedPrice : stonesPrice).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Choose a precious stone and its type to enhance your hat</p>
                  <div className="grid md:grid-cols-2 gap-3 items-start">
                    {/* Default Precious Stones options if API doesn't return any */}
                    {(preciousStonesOptions.length > 0 ? preciousStonesOptions : [
                      { _id: 'diamond', accessoryName: 'Diamond', accessoryPrice: 150 },
                      { _id: 'ruby', accessoryName: 'Ruby', accessoryPrice: 120 },
                      { _id: 'emerald', accessoryName: 'Emerald', accessoryPrice: 130 },
                      { _id: 'sapphire', accessoryName: 'Sapphire', accessoryPrice: 125 },
                      { _id: 'pearl', accessoryName: 'Pearl', accessoryPrice: 100 },
                      { _id: 'amethyst', accessoryName: 'Amethyst', accessoryPrice: 80 }
                    ]).map((option) => {
                      const isSelected = selectedPreciousStones === option.accessoryName;
                      
                      // Calculate type-based minimum price as multiplier of base price
                      // This ensures each stone has different minimums based on its base price
                      const getTypeMinimumPrice = (type: string, basePrice: number): number => {
                        if (!type) return basePrice;
                        switch (type) {
                          case 'Chain': return basePrice * 6.67; // Highest multiplier (Diamond €150 → €1000, Emerald €130 → €867)
                          case 'Pendant': return basePrice * 5.33; // High multiplier (Diamond €150 → €800, Emerald €130 → €693)
                          case 'Bracelet': return basePrice * 4; // Medium multiplier (Diamond €150 → €600, Emerald €130 → €520)
                          case 'Clip': return basePrice * 2.67; // Lowest multiplier (Diamond €150 → €400, Emerald €130 → €347)
                          default: return basePrice;
                        }
                      };
                      
                      // Only apply type minimum and adjusted price if THIS stone is selected
                      let currentPrice = option.accessoryPrice; // Default: show base price for each stone
                      
                      if (isSelected) {
                        // This is the selected stone - apply type minimum and adjusted price
                        if (preciousStoneAdjustedPrice > 0) {
                          currentPrice = preciousStoneAdjustedPrice;
                        } else if (preciousStoneType) {
                          currentPrice = getTypeMinimumPrice(preciousStoneType, option.accessoryPrice);
                        } else {
                          currentPrice = option.accessoryPrice;
                        }
                      }
                      // If not selected, just show the base price (already set above)
                      
                      return (
                        <div key={option._id} className="flex flex-col">
                          <label 
                            onClick={(e) => {
                              // Handle click on label - allow unselecting if already selected
                              if (isSelected) {
                                e.preventDefault();
                                setSelectedPreciousStones('');
                                setPreciousStoneAdjustedPrice(0);
                                setPreciousStoneType('');
                                setPreciousStonesChecked(false);
                              }
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 shadow-md scale-105' 
                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="preciousStones"
                                value={option.accessoryName}
                                checked={isSelected}
                                onChange={(e) => {
                                  const selectedValue = e.target.value;
                                  // Only handle selection (not deselection) in onChange
                                  setSelectedPreciousStones(selectedValue);
                                  // Reset adjusted price and set to base price when stone is selected
                                  setPreciousStoneAdjustedPrice(option.accessoryPrice);
                                  // Reset type when changing stone
                                  setPreciousStoneType('');
                                  // Auto-check the category when an option is selected
                                  if (!preciousStonesChecked) {
                                    setPreciousStonesChecked(true);
                                  }
                                  // Force immediate update by triggering a state change
                                  console.log('Selected Precious Stone:', selectedValue);
                                }}
                                onClick={(e) => {
                                  // Prevent default radio behavior if already selected
                                  if (isSelected) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                                className="w-5 h-5 text-purple-500 focus:ring-purple-500"
                              />
                              <span className="font-medium text-lg">{option.accessoryName}</span>
                            </div>
                            <span className="font-bold text-purple-600">
                              €{currentPrice.toFixed(2)}
                            </span>
                          </label>
                          {/* Type selection and price adjustment slider - appears under selected stone */}
                          {isSelected && (
                            <div className="mt-2 pt-3 border-t border-purple-200 space-y-3">
                              {/* Type/Appliance Selection */}
                              <div>
                                <p className="text-xs text-gray-600 font-medium mb-2">Select Type (For Hat)</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {['Chain', 'Pendant', 'Bracelet', 'Clip'].map((type) => {
                                    // Calculate type minimum as a multiplier of base price
                                    // This ensures each stone has different minimums based on its base price
                                    const getTypeMinimumPrice = (type: string, basePrice: number): number => {
                                      switch (type) {
                                        case 'Chain': return basePrice * 6.67; // Highest multiplier (Diamond €150 → €1000, Emerald €130 → €867)
                                        case 'Pendant': return basePrice * 5.33; // High multiplier (Diamond €150 → €800, Emerald €130 → €693)
                                        case 'Bracelet': return basePrice * 4; // Medium multiplier (Diamond €150 → €600, Emerald €130 → €520)
                                        case 'Clip': return basePrice * 2.67; // Lowest multiplier (Diamond €150 → €400, Emerald €130 → €347)
                                        default: return basePrice;
                                      }
                                    };
                                    
                                    const isTypeSelected = preciousStoneType === type;
                                    
                                    return (
                                      <button
                                        key={type}
                                        onClick={() => {
                                          if (isTypeSelected) {
                                            // Deselect: clear type and reset to base price
                                            setPreciousStoneType('');
                                            setPreciousStoneAdjustedPrice(option.accessoryPrice);
                                          } else {
                                            // Select: set type and adjust to type minimum
                                            setPreciousStoneType(type);
                                            const typeMin = getTypeMinimumPrice(type, option.accessoryPrice);
                                            setPreciousStoneAdjustedPrice(typeMin);
                                          }
                                        }}
                                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-300 ${
                                          isTypeSelected
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                                        }`}
                                      >
                                        {type}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              {/* Price adjustment slider */}
                              <div className="space-y-2">
                                <p className="text-xs text-gray-600 font-medium">
                                  Adjust for larger/higher quality stone
                                </p>
                                {(() => {
                                  // Calculate type-based minimum and maximum
                                  // Uses multipliers so each stone has different minimums based on its base price
                                  const getTypeMinimumPrice = (type: string, basePrice: number): number => {
                                    if (!type) return basePrice;
                                    switch (type) {
                                      case 'Chain': return basePrice * 6.67; // Highest multiplier
                                      case 'Pendant': return basePrice * 5.33; // High multiplier
                                      case 'Bracelet': return basePrice * 4; // Medium multiplier
                                      case 'Clip': return basePrice * 2.67; // Lowest multiplier
                                      default: return basePrice;
                                    }
                                  };
                                  
                                  const basePrice = option.accessoryPrice;
                                  const typeMin = preciousStoneType 
                                    ? getTypeMinimumPrice(preciousStoneType, basePrice)
                                    : basePrice;
                                  const sliderMin = typeMin; // Slider can only go from type minimum
                                  const sliderMax = sliderMin * 100; // 10000% increase from minimum
                                  const sliderRange = sliderMax - sliderMin;
                                  
                                  // Calculate visual percentages for the gradient
                                  // Show base price to type min as a different color (gray), then type min to current as purple
                                  const baseToTypeMinPercent = preciousStoneType && typeMin > basePrice
                                    ? ((typeMin - basePrice) / (sliderMax - basePrice)) * 100
                                    : 0;
                                  const currentPositionPercent = ((currentPrice - sliderMin) / sliderRange) * 100;
                                  
                                  return (
                                    <div className="relative h-1.5">
                                      {/* Visual background track showing full range */}
                                      <div 
                                        className="absolute inset-0 h-1.5 bg-gray-200 rounded-lg pointer-events-none"
                                        style={{
                                          background: preciousStoneType && typeMin > basePrice
                                            ? `linear-gradient(to right, 
                                                #d1d5db 0%, 
                                                #d1d5db ${baseToTypeMinPercent}%, 
                                                #e5e7eb ${baseToTypeMinPercent}%, 
                                                #a855f7 ${baseToTypeMinPercent}%, 
                                                #a855f7 ${baseToTypeMinPercent + currentPositionPercent}%, 
                                                #e5e7eb ${baseToTypeMinPercent + currentPositionPercent}%, 
                                                #e5e7eb 100%)`
                                            : `linear-gradient(to right, #a855f7 0%, #a855f7 ${currentPositionPercent}%, #e5e7eb ${currentPositionPercent}%, #e5e7eb 100%)`
                                        }}
                                      />
                                      <input
                                        type="range"
                                        min={sliderMin}
                                        max={sliderMax}
                                        step={10}
                                        value={currentPrice}
                                        onChange={(e) => {
                                          setPreciousStoneAdjustedPrice(parseFloat(e.target.value));
                                        }}
                                        className="absolute inset-0 w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                          background: 'transparent',
                                          zIndex: 10
                                        }}
                                      />
                                    </div>
                                  );
                                })()}
                                <p className="text-xs text-gray-500 italic">
                                  Drag right to increase size and quality of your {option.accessoryName.toLowerCase()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fabric Options */}
              {fabricChecked && (
                <div className="bg-white rounded-xl p-6 mb-6 border-2 border-purple-200 shadow-lg animate-fade-in relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-purple-700">Fabric</h3>
                    {fabricPrice > 0 && (
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg text-white font-bold text-lg animate-pulse">
                        +€{fabricPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 font-semibold mb-3">Pick Your Desires</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Default Fabric options if API doesn't return any */}
                    {(fabricOptions.length > 0 ? fabricOptions : [
                      { _id: 'silk', accessoryName: 'Silk', accessoryPrice: 90 },
                      { _id: 'velvet', accessoryName: 'Velvet', accessoryPrice: 85 },
                      { _id: 'satin', accessoryName: 'Satin', accessoryPrice: 75 },
                      { _id: 'leather', accessoryName: 'Leather', accessoryPrice: 110 },
                      { _id: 'suede', accessoryName: 'Suede', accessoryPrice: 95 },
                      { _id: 'cashmere', accessoryName: 'Cashmere', accessoryPrice: 120 }
                    ]).map((option) => (
                      <label 
                        key={option._id} 
                        className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                          selectedFabric === option.accessoryName 
                            ? 'border-purple-500 bg-purple-50 shadow-md scale-105' 
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="fabric"
                            value={option.accessoryName}
                            checked={selectedFabric === option.accessoryName}
                            onChange={(e) => {
                              setSelectedFabric(e.target.value);
                              // Auto-check the category when an option is selected
                              if (!fabricChecked) {
                                setFabricChecked(true);
                              }
                            }}
                            className="w-5 h-5 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="font-medium text-lg">{option.accessoryName}</span>
                        </div>
                        <span className="font-bold text-purple-600">€{option.accessoryPrice.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Jewelry Options */}
              {jewelryChecked && (
                <div className="bg-white rounded-xl p-6 mb-6 border-2 border-purple-200 shadow-lg animate-fade-in relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-purple-700">Jewelry</h3>
                    {(jewelryAdjustedPrice > 0 ? jewelryAdjustedPrice : jewelryPrice) > 0 && (
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg text-white font-bold text-lg animate-pulse">
                        +€{(jewelryAdjustedPrice > 0 ? jewelryAdjustedPrice : jewelryPrice).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Choose jewelry and its type to add elegance and sparkle to your hat</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Default Jewelry options if API doesn't return any */}
                    {(jewelryOptions.length > 0 ? jewelryOptions : [
                      { _id: 'gold-chain', accessoryName: 'Gold Chain', accessoryPrice: 200 },
                      { _id: 'silver-beads', accessoryName: 'Silver Beads', accessoryPrice: 150 },
                      { _id: 'crystal-pendant', accessoryName: 'Crystal Pendant', accessoryPrice: 180 },
                      { _id: 'pearl-strand', accessoryName: 'Pearl Strand', accessoryPrice: 170 },
                      { _id: 'diamond-clip', accessoryName: 'Diamond Clip', accessoryPrice: 250 },
                      { _id: 'vintage-brooch', accessoryName: 'Vintage Brooch', accessoryPrice: 190 }
                    ]).map((option) => {
                      const isSelected = selectedJewelry === option.accessoryName;
                      
                      // Calculate type-based minimum price (only for selected jewelry)
                      const getTypeMinimumPrice = (type: string, basePrice: number): number => {
                        if (!type) return basePrice;
                        switch (type) {
                          case 'Chain': return Math.max(basePrice, 1000); // Highest minimum
                          case 'Pendant': return Math.max(basePrice, 700);
                          case 'Bracelet': return Math.max(basePrice, 600);
                          case 'Clip': return Math.max(basePrice, 400); // Lowest minimum
                          default: return basePrice;
                        }
                      };
                      
                      // Only apply adjusted price if THIS jewelry is selected
                      let currentPrice = option.accessoryPrice; // Default: show base price for each jewelry
                      
                      if (isSelected) {
                        // This is the selected jewelry - apply adjusted price if set
                        if (jewelryAdjustedPrice > 0) {
                          currentPrice = jewelryAdjustedPrice;
                        } else {
                          currentPrice = option.accessoryPrice;
                        }
                      }
                      // If not selected, just show the base price (already set above)
                      
                      return (
                        <div key={option._id} className="flex flex-col">
                          <label 
                            onClick={(e) => {
                              // Handle click on label - allow unselecting if already selected
                              if (isSelected) {
                                e.preventDefault();
                                setSelectedJewelry('');
                                setJewelryAdjustedPrice(0);
                                setJewelryChecked(false);
                              }
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 shadow-md scale-105' 
                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="jewelry"
                                value={option.accessoryName}
                                checked={isSelected}
                                onChange={(e) => {
                                  const selectedValue = e.target.value;
                                  // Only handle selection (not deselection) in onChange
                                  setSelectedJewelry(selectedValue);
                                  // Reset adjusted price and set to base price when jewelry is selected
                                  setJewelryAdjustedPrice(option.accessoryPrice);
                                  // Auto-check the category when an option is selected
                                  if (!jewelryChecked) {
                                    setJewelryChecked(true);
                                  }
                                }}
                                onClick={(e) => {
                                  // Prevent default radio behavior if already selected
                                  if (isSelected) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                                className="w-5 h-5 text-purple-500 focus:ring-purple-500"
                              />
                              <span className="font-medium text-lg">{option.accessoryName}</span>
                            </div>
                            <span className="font-bold text-purple-600">
                              €{currentPrice.toFixed(2)}
                            </span>
                          </label>
                          {/* Price adjustment slider - appears under selected jewelry */}
                          {isSelected && (
                            <div className="mt-2 pt-3 border-t border-purple-200">
                              <div className="space-y-2">
                                <p className="text-xs text-gray-600 font-medium">
                                  Adjust for larger/higher quality jewelry
                                </p>
                                {(() => {
                                  const sliderMin = option.accessoryPrice;
                                  const sliderMax = sliderMin * 100; // 10000% increase from base
                                  const sliderRange = sliderMax - sliderMin;
                                  const currentPositionPercent = ((currentPrice - sliderMin) / sliderRange) * 100;
                                  
                                  return (
                                    <div className="relative h-1.5">
                                      {/* Visual background track */}
                                      <div 
                                        className="absolute inset-0 h-1.5 bg-gray-200 rounded-lg pointer-events-none"
                                        style={{
                                          background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${currentPositionPercent}%, #e5e7eb ${currentPositionPercent}%, #e5e7eb 100%)`
                                        }}
                                      />
                                      <input
                                        type="range"
                                        min={sliderMin}
                                        max={sliderMax}
                                        step={10}
                                        value={currentPrice}
                                        onChange={(e) => {
                                          setJewelryAdjustedPrice(parseFloat(e.target.value));
                                        }}
                                        className="absolute inset-0 w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                          background: 'transparent',
                                          zIndex: 10
                                        }}
                                      />
                                    </div>
                                  );
                                })()}
                                <p className="text-xs text-gray-500 italic">
                                  Drag right to increase size and quality of your {option.accessoryName.toLowerCase()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes and Birth Date Section */}
              <div className="bg-white rounded-xl p-6 mb-6 border-2 border-purple-200 shadow-lg animate-fade-in relative z-10">
                <h3 className="text-2xl font-bold text-purple-700 mb-6">Additional Information</h3>
                
                <div className="space-y-6">
                  {/* Notes/Description Container - IMAGINE */}
                  <div>
                    <label htmlFor="hat-notes" className="block text-lg font-semibold text-gray-700 mb-2">
                      IMAGINE — Personal Message / Notes
                    </label>
                    <p className="text-sm text-gray-500 mb-3">Tell us anything special about this hat or any requests you have. Click a suggestion to add it:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {IMAGINE_COMBOS.map((combo, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentHatNotes(prev => prev ? `${prev}\n${combo}` : combo)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 transition-colors"
                        >
                          {combo}
                        </button>
                      ))}
                    </div>
                    <textarea
                      id="hat-notes"
                      value={currentHatNotes}
                      onChange={(e) => setCurrentHatNotes(e.target.value)}
                      placeholder="IMAGINE... e.g. tropical sunset for my wedding, disco ball for my 50th, peacock feathers..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 resize-none"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label htmlFor="hat-birthdate" className="block text-lg font-semibold text-gray-700 mb-2">
                      Date of Birth (of the person who will wear this hat)
                    </label>
                    <p className="text-sm text-gray-500 mb-3">For zodiac signs and personalized touches ✨</p>
                    <DatePicker
                      value={currentHatBirthDate}
                      onChange={(date) => setCurrentHatBirthDate(date)}
                      placeholder="mm / dd / yyyy"
                    />
                    {currentHatBirthDate && (
                      <p className="text-sm text-purple-600 mt-2 font-medium">
                        📅 Selected: {new Date(currentHatBirthDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Total Price Bar */}
              <div className="sticky bottom-0 bg-white border-t-2 border-purple-200 shadow-2xl p-6 mt-8 rounded-t-xl relative z-50">
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center gap-8 justify-center flex-wrap">
                    <div className="text-center min-w-[120px]">
                      <p className="text-sm text-gray-600 mb-1">{isCustomizingExistingHat ? 'Finished Hat' : 'Base Hat'}</p>
                      <p className="text-2xl font-bold text-gray-900">€{basePrice.toFixed(2)}</p>
                    </div>
                    <div className="text-center min-w-[120px]">
                      <p className="text-sm text-gray-600 mb-1">Customization</p>
                      <p 
                        className={`text-2xl font-bold text-pink-600 transition-all duration-500 ${
                          showArtPriceAnimation ? 'animate-price-add' : ''
                        }`}
                        key={`sticky-customization-${customizationPrice}-${showArtPriceAnimation}`}
                      >
                        +€{customizationPrice.toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Accessories Section - Total Price Only */}
                    <div className="text-center min-w-[120px]">
                      <p className="text-sm text-gray-600 mb-1">Accessories</p>
                      <p 
                        className="text-2xl font-bold text-purple-600 transition-all duration-300"
                        key={`sticky-accessories-${totalAccessoriesPrice}`}
                      >
                        +€{totalAccessoriesPrice.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="text-center min-w-[120px]">
                      <p className="text-sm text-gray-600 mb-1">Total Price</p>
                      <p 
                        className={`text-2xl font-bold text-purple-600 transition-all duration-500 ${
                          showArtPriceAnimation ? 'animate-price-add' : ''
                        }`}
                        key={`sticky-total-${totalPrice}-${showArtPriceAnimation}`}
                      >
                        €{totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <RainbowButton
                        onClick={() => {
                          saveEmbellishmentsAndBackToSaved();
                          setTimeout(() => scrollToElement('hat-selection-summary'), 100);
                        }}
                        className="text-lg px-8 py-3"
                      >
                        Save & Continue
                      </RainbowButton>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Step 4: Finalize Custom Order - Detailed Summary */}
        {currentStep === 4 && (
          <section id="step-4" className="mb-16">
            <div className="mb-4">
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setTimeout(() => scrollToElement('hat-selection-summary'), 100);
                }}
                className="text-gray-600 hover:text-black transition-colors mb-4"
              >
                ← Back to Hat Selection
              </button>
            </div>
            <h2 className="text-4xl font-bold mb-4">Finalize Your Custom Order</h2>
            <p className="text-xl text-gray-600 mb-2">Review your personalized hat order.</p>
            <p className="text-lg text-gray-700 mb-8">All your customizations and selections are displayed below.</p>

            {/* Detailed Hat Summaries */}
            <div className="space-y-8 mb-12">
              {savedHats.map((hat) => {
                const originalHat = hatColors.find(h => h._id === hat._id);
                const hatColorArray = originalHat?.hatColor || (originalHat?.hatColorHex ? [originalHat.hatColorHex] : []);
                const embellishments = embellishmentsByContainer[hat.containerId] || {};
                
                // Calculate prices
                const basePrice = hat.rawHatPrice || 0;
                const hasArtCustomization = !!embellishments.art && embellishments.art !== '';
                const hatArtPrice = hasArtCustomization ? artCurrentPrice : 0;
                
                // Accessory prices
                const allStonesOptions = preciousStonesOptions.length > 0 ? preciousStonesOptions : [
                  { _id: 'diamond', accessoryName: 'Diamond', accessoryPrice: 150 },
                  { _id: 'ruby', accessoryName: 'Ruby', accessoryPrice: 120 },
                  { _id: 'emerald', accessoryName: 'Emerald', accessoryPrice: 130 },
                  { _id: 'sapphire', accessoryName: 'Sapphire', accessoryPrice: 125 },
                  { _id: 'pearl', accessoryName: 'Pearl', accessoryPrice: 100 },
                  { _id: 'amethyst', accessoryName: 'Amethyst', accessoryPrice: 80 }
                ];
                const allJewelryOptions = jewelryOptions.length > 0 ? jewelryOptions : [
                  { _id: 'gold-chain', accessoryName: 'Gold Chain', accessoryPrice: 200 },
                  { _id: 'silver-beads', accessoryName: 'Silver Beads', accessoryPrice: 150 },
                  { _id: 'crystal-pendant', accessoryName: 'Crystal Pendant', accessoryPrice: 180 },
                  { _id: 'pearl-strand', accessoryName: 'Pearl Strand', accessoryPrice: 170 },
                  { _id: 'diamond-clip', accessoryName: 'Diamond Clip', accessoryPrice: 250 },
                  { _id: 'vintage-brooch', accessoryName: 'Vintage Brooch', accessoryPrice: 190 }
                ];
                const allFabricOptions = fabricOptions.length > 0 ? fabricOptions : [
                  { _id: 'silk', accessoryName: 'Silk', accessoryPrice: 90 },
                  { _id: 'velvet', accessoryName: 'Velvet', accessoryPrice: 85 },
                  { _id: 'satin', accessoryName: 'Satin', accessoryPrice: 75 },
                  { _id: 'leather', accessoryName: 'Leather', accessoryPrice: 110 },
                  { _id: 'suede', accessoryName: 'Suede', accessoryPrice: 95 },
                  { _id: 'cashmere', accessoryName: 'Cashmere', accessoryPrice: 120 }
                ];
                
                // Extract base stone/jewelry name from combo display (e.g., "Diamond Bracelet for the hat" -> "Diamond")
                const stonesBaseName = embellishments.preciousStones 
                  ? embellishments.preciousStones.split(' ')[0] 
                  : '';
                const jewelryBaseName = embellishments.jewelry
                  ? embellishments.jewelry.split(' ')[0]
                  : '';
                
                const stonesPrice = stonesBaseName
                  ? (allStonesOptions.find(s => String(s.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === stonesBaseName.toLowerCase())?.accessoryPrice ?? 0)
                  : 0;
                const jewelryPrice = jewelryBaseName
                  ? (allJewelryOptions.find(j => String(j.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === jewelryBaseName.toLowerCase())?.accessoryPrice ?? 0)
                  : 0;
                const fabricPrice = embellishments.fabric 
                  ? allFabricOptions.find(f => f.accessoryName.toLowerCase() === embellishments.fabric.toLowerCase())?.accessoryPrice || 0 
                  : 0;
                const totalAccessoriesPrice = stonesPrice + jewelryPrice + fabricPrice;
                const hatTotalPrice = basePrice + hatArtPrice + totalAccessoriesPrice;
                const isCustomized = hasArtCustomization || !!embellishments.preciousStones || !!embellishments.jewelry || !!embellishments.fabric;
                
                return (
                  <div key={hat.containerId} className="bg-white rounded-2xl border-2 border-purple-200 shadow-xl overflow-hidden animate-fade-in">
                    {/* Hat Header */}
                    <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 p-6 border-b-2 border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{hat.hatForm} | {hat.hatColorName}</h3>
                          {hatColorArray.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {hatColorArray.map((colorHex: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="w-6 h-6 rounded border border-gray-300 shadow-sm"
                                  style={{ backgroundColor: colorHex }}
                                  title={colorHex}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {hat.hatProductImage && (
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-white border-2 border-purple-200 shadow-md">
                            <WixImage
                              src={hat.hatProductImage}
                              alt={`${hat.hatForm} | ${hat.hatColorName}`}
                              fill
                              className="object-contain"
                              sizes="128px"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customization Details */}
                    <div className="p-6">
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Left Column: Customizations */}
                        <div className="space-y-4">
                          {/* Art Customization */}
                          {hasArtCustomization && (
                            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border-2 border-pink-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Art Style</p>
                                <span className="text-lg font-bold text-pink-600">+€{hatArtPrice.toFixed(2)}</span>
                              </div>
                              <p className="text-lg font-bold text-pink-700 mb-2">
                                {embellishments.art === 'customized' ? 'Customized' : embellishments.art}
                              </p>
                              {/* Display Art Style Colors */}
                              {embellishments.artColors && embellishments.artColors.trim() !== '' && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-600 mb-1">Colors:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {embellishments.artColors.split(', ').filter(Boolean).map((color: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-white rounded-md text-xs font-semibold text-gray-700 border border-gray-300"
                                      >
                                        {color}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Display Art Style Notes/Description */}
                              {embellishments.artDescription && embellishments.artDescription.trim() !== '' && (
                                <div className="mt-2 pt-2 border-t border-pink-200">
                                  <p className="text-xs text-gray-600 mb-1">Notes:</p>
                                  <p className="text-sm text-gray-700 italic">{embellishments.artDescription}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Accessories */}
                          {(embellishments.preciousStones || embellishments.jewelry || embellishments.fabric) && (
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Accessories</p>
                              
                              {embellishments.preciousStones && (
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Gemstones</p>
                                      <p className="text-lg font-bold text-purple-700">{embellishments.preciousStones}</p>
                                    </div>
                                    <span className="text-lg font-bold text-purple-600">+€{stonesPrice.toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                              
                              {embellishments.jewelry && (
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Jewelry</p>
                                      <p className="text-lg font-bold text-orange-700">{embellishments.jewelry}</p>
                                    </div>
                                    <span className="text-lg font-bold text-orange-600">+€{jewelryPrice.toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                              
                              {embellishments.fabric && (
                                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border-2 border-green-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Fabric</p>
                                      <p className="text-lg font-bold text-teal-700">{embellishments.fabric}</p>
                                    </div>
                                    <span className="text-lg font-bold text-teal-600">+€{fabricPrice.toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Personal Details from Step 3 */}
                          {(embellishments.notes || embellishments.birthDate) && (
                            <div className="space-y-3 pt-4 border-t border-gray-200">
                              {embellishments.notes && (
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-2">📝 Personal Notes</p>
                                  <p className="text-sm text-gray-700 italic">{embellishments.notes}</p>
                                </div>
                              )}
                              {embellishments.birthDate && (
                                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-1">🎂 Birth Date</p>
                                  <p className="text-sm text-gray-700">
                                    {new Date(embellishments.birthDate).toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right Column: Price Breakdown */}
                        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-xl p-6 border-2 border-purple-300">
                          <h4 className="text-xl font-bold text-gray-900 mb-4">Price Breakdown</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">{isCustomizingExistingHat ? 'Finished Hat' : 'Base Hat'}</span>
                              <span className="font-semibold text-gray-900">€{basePrice.toFixed(2)}</span>
                            </div>
                            {hatArtPrice > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">Art Customization</span>
                                <span className="font-semibold text-pink-600">+€{hatArtPrice.toFixed(2)}</span>
                              </div>
                            )}
                            {totalAccessoriesPrice > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">Accessories</span>
                                <span className="font-semibold text-purple-600">+€{totalAccessoriesPrice.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="pt-3 border-t-2 border-purple-300 mt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-purple-600">€{hatTotalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Global Notes Section */}
            <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-xl p-6 mb-8">
              <label className="block text-lg font-semibold mb-3 text-gray-900">Additional Order Notes (Optional)</label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-32 transition-all"
                placeholder="Any additional notes or special requests for your order..."
              />
            </div>

            {/* Final Summary */}
            <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 rounded-2xl border-2 border-purple-300 shadow-xl p-8 mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Order Summary</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Hats Customized</p>
                  <p className="text-3xl font-bold text-purple-600">{savedHats.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Total Customizations</p>
                  <p className="text-3xl font-bold text-pink-600">
                    {savedHats.filter(h => {
                      const e = embellishmentsByContainer[h.containerId] || {};
                      return !!(e.art || e.preciousStones || e.jewelry || e.fabric);
                    }).length}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Grand Total</p>
                  <p className="text-3xl font-bold text-purple-600">
                    €{savedHats.reduce((sum, hat) => {
                      const e = embellishmentsByContainer[hat.containerId] || {};
                      const hatArtPrice = (e.art && e.art !== '') ? artCurrentPrice : 0;
                      const stonesPrice = e.preciousStones ? (preciousStonesOptions.find(s => s.accessoryName.toLowerCase() === e.preciousStones.toLowerCase())?.accessoryPrice || 0) : 0;
                      const jewelryPrice = e.jewelry ? (jewelryOptions.find(j => j.accessoryName.toLowerCase() === e.jewelry.toLowerCase())?.accessoryPrice || 0) : 0;
                      const fabricPrice = e.fabric ? (fabricOptions.find(f => f.accessoryName.toLowerCase() === e.fabric.toLowerCase())?.accessoryPrice || 0) : 0;
                      return sum + (hat.rawHatPrice || 0) + hatArtPrice + stonesPrice + jewelryPrice + fabricPrice;
                    }, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              {!checkoutStep && (
                <RainbowButton
                  onClick={() => {
                    // Start checkout flow - check if logged in first
                    if (typeof window !== 'undefined') {
                      const memberName = localStorage.getItem('memberName');
                      const memberEmail = localStorage.getItem('memberEmail');
                      if (memberName && memberEmail) {
                        setIsLoggedIn(true);
                        setCheckoutName(memberName);
                        setCheckoutEmail(memberEmail);
                        const memberMobile = localStorage.getItem('memberMobile') || '';
                        setCheckoutMobile(memberMobile);
                        setCheckoutStep('shipping'); // Skip signup if already logged in
                      } else {
                        setCheckoutStep('signup'); // Start with signup/login
                      }
                    }
                  }}
                  className="text-lg px-12 py-4"
                >
                  Finalize & Place Order
                </RainbowButton>
              )}
            </div>

            {/* Checkout Steps Popup */}
            {checkoutStep && (
              <>
                {/* Backdrop with blur */}
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] animate-fade-in"
                  onClick={() => setCheckoutStep(null)}
                  style={{
                    animation: 'fadeIn 0.3s ease-out',
                  }}
                />
                
                {/* Popup Container */}
                <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
                  <div 
                    className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all duration-500 scale-100 opacity-100 translate-y-0"
                    style={{
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 p-6 rounded-t-3xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 animate-pulse-slow" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1">Complete Your Custom Hat Order</h2>
                          <p className="text-white/90 text-sm">{savedHats.length} Custom Hat{savedHats.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                          onClick={() => setCheckoutStep(null)}
                          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="px-6 pt-6 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`flex-1 ${checkoutStep === 'signup' ? 'text-purple-600' : 'text-gray-400'}`}>
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              checkoutStep === 'signup' ? 'bg-purple-500 text-white' : 'bg-gray-200'
                            }`}>
                              1
                            </div>
                            <span className="ml-2 text-sm font-semibold">Account</span>
                          </div>
                        </div>
                        <div className={`flex-1 mx-2 ${checkoutStep === 'shipping' ? 'text-purple-600' : checkoutStep === 'payment' ? 'text-gray-400' : 'text-gray-300'}`}>
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              checkoutStep === 'shipping' ? 'bg-purple-500 text-white' : checkoutStep === 'payment' ? 'bg-gray-200' : 'bg-gray-100'
                            }`}>
                              2
                            </div>
                            <span className="ml-2 text-sm font-semibold">Shipping</span>
                          </div>
                        </div>
                        <div className={`flex-1 ${checkoutStep === 'payment' ? 'text-purple-600' : 'text-gray-300'}`}>
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              checkoutStep === 'payment' ? 'bg-purple-500 text-white' : 'bg-gray-100'
                            }`}>
                              3
                            </div>
                            <span className="ml-2 text-sm font-semibold">Payment</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                          checkoutStep !== 'signup' ? 'bg-purple-500' : 'bg-gray-200'
                        }`} />
                        <div className={`h-1 flex-1 mx-1 rounded-full transition-all duration-500 ${
                          checkoutStep === 'payment' ? 'bg-purple-500' : 'bg-gray-200'
                        }`} />
                        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                          checkoutStep === 'payment' ? 'bg-purple-500' : 'bg-gray-200'
                        }`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-6">
                      {/* Step 1: Sign Up / Login */}
                      {checkoutStep === 'signup' && (
                        <div className="space-y-4 animate-slide-in">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Information</h3>
                            <p className="text-sm text-gray-600">Please provide your contact details</p>
                          </div>
                          
                          <div className="flex gap-4 mb-6">
                            <button
                              onClick={() => setWantsToSignup(false)}
                              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                                !wantsToSignup
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Login
                            </button>
                            <button
                              onClick={() => setWantsToSignup(true)}
                              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                                wantsToSignup
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Sign Up
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name *</label>
                              <input
                                type="text"
                                value={checkoutName}
                                onChange={(e) => setCheckoutName(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                                placeholder="Enter your full name"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-700">Email Address *</label>
                              <input
                                type="email"
                                value={checkoutEmail}
                                onChange={(e) => setCheckoutEmail(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                                placeholder="your.email@example.com"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-700">Mobile Number *</label>
                              <input
                                type="tel"
                                value={checkoutMobile}
                                onChange={(e) => setCheckoutMobile(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                                placeholder="234 567 8900"
                                required
                              />
                            </div>
                            {wantsToSignup && (
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Password *</label>
                                <input
                                  type="password"
                                  value={checkoutPassword}
                                  onChange={(e) => setCheckoutPassword(e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                                  placeholder="Minimum 6 characters"
                                  required
                                />
                              </div>
                            )}
                          </div>

                          <RainbowButton
                            onClick={async () => {
                              if (!checkoutName || !checkoutEmail || !checkoutMobile) {
                                alert('Please fill in all required fields.');
                                return;
                              }

                              try {
                                if (wantsToSignup) {
                                  // Sign up
                                  if (!checkoutPassword) {
                                    alert('Please enter a password.');
                                    return;
                                  }
                                  const signupResponse = await fetch('/api/members/signup', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      memberName: checkoutName,
                                      memberEmail: checkoutEmail,
                                      memberPassword: checkoutPassword,
                                      memberMobile: checkoutMobile,
                                    }),
                                  });
                                  const signupData = await signupResponse.json();
                                  if (!signupData.success) {
                                    alert(signupData.error || 'Sign up failed. Please try again.');
                                    return;
                                  }
                                  // Save to localStorage
                                  localStorage.setItem('memberName', checkoutName);
                                  localStorage.setItem('memberEmail', checkoutEmail);
                                  localStorage.setItem('memberMobile', checkoutMobile);
                                  setIsLoggedIn(true);
                                } else {
                                  // Login
                                  const loginResponse = await fetch('/api/members/login', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      memberEmail: checkoutEmail,
                                      password: checkoutPassword || '',
                                    }),
                                  });
                                  const loginData = await loginResponse.json();
                                  if (!loginData.success) {
                                    alert(loginData.error || 'Login failed. Please check your credentials.');
                                    return;
                                  }
                                  // Save to localStorage
                                  localStorage.setItem('memberName', loginData.member.memberName || checkoutName);
                                  localStorage.setItem('memberEmail', checkoutEmail);
                                  localStorage.setItem('memberMobile', loginData.member.memberMobile || checkoutMobile);
                                  setIsLoggedIn(true);
                                }
                                // Move to shipping step
                                setCheckoutStep('shipping');
                              } catch (error) {
                                console.error('Error in signup/login:', error);
                                alert('An error occurred. Please try again.');
                              }
                            }}
                            className="w-full text-lg py-4 mt-6"
                          >
                            {wantsToSignup ? 'Sign Up & Continue' : 'Login & Continue'}
                          </RainbowButton>
                        </div>
                      )}

                      {/* Step 2: Shipping */}
                      {checkoutStep === 'shipping' && (
                        <div className="space-y-4 animate-slide-in">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Shipping Details</h3>
                            <p className="text-sm text-gray-600">Where should we deliver your custom hat?</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-700">Address *</label>
                              <input
                                type="text"
                                value={shippingAddress}
                                onChange={(e) => setShippingAddress(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                                placeholder="Street address"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-700">Shipping Method *</label>
                              <div className="space-y-2">
                                {[
                                  { value: 'Standard Shipping', label: 'Standard Shipping (5-7 days)', price: 15 },
                                  { value: 'Express Shipping', label: 'Express Shipping (2-3 days)', price: 35 },
                                ].map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      setShippingOption(option.value);
                                      setShippingPrice(option.price);
                                    }}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                                      shippingOption === option.value
                                        ? 'border-purple-500 bg-purple-50 shadow-lg transform scale-[1.02]'
                                        : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold">{option.label}</span>
                                      <span className="text-purple-600 font-bold">€{option.price}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Price Summary */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200 mb-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-700 font-semibold">Product:</span>
                                  <span className="text-gray-900 font-semibold">
                                    €{savedHats.reduce((sum, hat) => {
                                      const e = embellishmentsByContainer[hat.containerId] || {};
                                      const hatArtPrice = (e.art && e.art !== '') ? artCurrentPrice : 0;
                                      const stonesBaseName = e.preciousStones ? String(e.preciousStones).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
                                      const stonesPrice = stonesBaseName ? (preciousStonesOptions.find(s => String(s.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === stonesBaseName)?.accessoryPrice ?? 0) : 0;
                                      const jewelryBaseName = e.jewelry ? String(e.jewelry).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
                                      const jewelryPrice = jewelryBaseName ? (jewelryOptions.find(j => String(j.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === jewelryBaseName)?.accessoryPrice ?? 0) : 0;
                                      const fabricBaseName = e.fabric ? String(e.fabric).trim().toLowerCase() : '';
                                      const fabricPrice = fabricBaseName ? (fabricOptions.find(f => String(f.accessoryName || '').trim().toLowerCase() === fabricBaseName)?.accessoryPrice ?? 0) : 0;
                                      return sum + (hat.rawHatPrice || 0) + hatArtPrice + stonesPrice + jewelryPrice + fabricPrice;
                                    }, 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-700 font-semibold">Shipping:</span>
                                  <span className="text-gray-900 font-semibold">€{shippingPrice.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-purple-300 pt-2 mt-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-900 font-bold text-lg">Total Amount:</span>
                                    <span className="text-2xl font-bold text-purple-600">
                                      €{(savedHats.reduce((sum, hat) => {
                                        const e = embellishmentsByContainer[hat.containerId] || {};
                                        const hatArtPrice = (e.art && e.art !== '') ? artCurrentPrice : 0;
                                        const stonesBaseName = e.preciousStones ? String(e.preciousStones).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
                                        const stonesPrice = stonesBaseName ? (preciousStonesOptions.find(s => String(s.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === stonesBaseName)?.accessoryPrice ?? 0) : 0;
                                        const jewelryBaseName = e.jewelry ? String(e.jewelry).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
                                        const jewelryPrice = jewelryBaseName ? (jewelryOptions.find(j => String(j.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === jewelryBaseName)?.accessoryPrice ?? 0) : 0;
                                        const fabricBaseName = e.fabric ? String(e.fabric).trim().toLowerCase() : '';
                                        const fabricPrice = fabricBaseName ? (fabricOptions.find(f => String(f.accessoryName || '').trim().toLowerCase() === fabricBaseName)?.accessoryPrice ?? 0) : 0;
                                        return sum + (hat.rawHatPrice || 0) + hatArtPrice + stonesPrice + jewelryPrice + fabricPrice;
                                      }, 0) + shippingPrice).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <RainbowButton
                              onClick={() => {
                                if (!shippingAddress || !shippingOption) {
                                  alert('Please fill in shipping address and select a shipping option.');
                                  return;
                                }
                                setCheckoutStep('payment');
                              }}
                              className="w-full text-lg py-4"
                              disabled={!shippingAddress || !shippingOption}
                            >
                              Continue →
                            </RainbowButton>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Payment */}
                      {checkoutStep === 'payment' && (
                        <div className="space-y-4 animate-slide-in">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Method</h3>
                            <p className="text-sm text-gray-600">Choose your preferred payment method</p>
                          </div>

                          <div className="space-y-2">
                            {[
                              { value: 'PayPal', label: 'PayPal' },
                              { value: 'Visa/Mastercard', label: 'Visa/Mastercard' },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setPaymentMethod(option.value)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                                  paymentMethod === option.value
                                    ? 'border-purple-500 bg-purple-50 shadow-lg transform scale-[1.02]'
                                    : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/50'
                                }`}
                              >
                                <span className="font-semibold">{option.label}</span>
                              </button>
                            ))}
                          </div>

                          {/* Price Summary */}
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200 mb-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-semibold">Product:</span>
                                <span className="text-gray-900 font-semibold">
                                  €{savedHats.reduce((sum, hat) => {
                                    const e = embellishmentsByContainer[hat.containerId] || {};
                                    const hatArtPrice = (e.art && e.art !== '') ? artCurrentPrice : 0;
                                    const stonesBaseName = e.preciousStones ? String(e.preciousStones).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
                                    const stonesPrice = stonesBaseName ? (preciousStonesOptions.find(s => String(s.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === stonesBaseName)?.accessoryPrice ?? 0) : 0;
                                    const jewelryBaseName = e.jewelry ? String(e.jewelry).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
                                    const jewelryPrice = jewelryBaseName ? (jewelryOptions.find(j => String(j.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === jewelryBaseName)?.accessoryPrice ?? 0) : 0;
                                    const fabricBaseName = e.fabric ? String(e.fabric).trim().toLowerCase() : '';
                                    const fabricPrice = fabricBaseName ? (fabricOptions.find(f => String(f.accessoryName || '').trim().toLowerCase() === fabricBaseName)?.accessoryPrice ?? 0) : 0;
                                    return sum + (hat.rawHatPrice || 0) + hatArtPrice + stonesPrice + jewelryPrice + fabricPrice;
                                  }, 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-semibold">Shipping:</span>
                                <span className="text-gray-900 font-semibold">€{shippingPrice.toFixed(2)}</span>
                              </div>
                              <div className="border-t border-purple-300 pt-2 mt-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-900 font-bold text-lg">Total Amount:</span>
                                  <span className="text-2xl font-bold text-purple-600">
                                    €{(savedHats.reduce((sum, hat) => {
                                      const e = embellishmentsByContainer[hat.containerId] || {};
                                      const hatArtPrice = (e.art && e.art !== '') ? artCurrentPrice : 0;
                                      const stonesBaseName = e.preciousStones ? String(e.preciousStones).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
                                      const stonesPrice = stonesBaseName ? (preciousStonesOptions.find(s => String(s.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === stonesBaseName)?.accessoryPrice ?? 0) : 0;
                                      const jewelryBaseName = e.jewelry ? String(e.jewelry).trim().split(/\s+/)[0]?.toLowerCase() || '' : '';
                                      const jewelryPrice = jewelryBaseName ? (jewelryOptions.find(j => String(j.accessoryName || '').trim().toLowerCase().split(/\s+/)[0] === jewelryBaseName)?.accessoryPrice ?? 0) : 0;
                                      const fabricBaseName = e.fabric ? String(e.fabric).trim().toLowerCase() : '';
                                      const fabricPrice = fabricBaseName ? (fabricOptions.find(f => String(f.accessoryName || '').trim().toLowerCase() === fabricBaseName)?.accessoryPrice ?? 0) : 0;
                                      return sum + (hat.rawHatPrice || 0) + hatArtPrice + stonesPrice + jewelryPrice + fabricPrice;
                                    }, 0) + shippingPrice).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {paymentMethod && (
                            <div className="pt-4">
                              {paymentMethod === 'PayPal' ? (
                                <div className="space-y-4">
                                  {paymentError && (
                                    <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 font-semibold">
                                      {paymentError}
                                    </div>
                                  )}
                                  {paypalProcessing ? (
                                    <div className="p-6 bg-purple-50 border-2 border-purple-500 rounded-xl text-center">
                                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent mx-auto mb-3" />
                                      <p className="text-purple-800 font-semibold">Completing your order...</p>
                                    </div>
                                  ) : (
                                    <PayPalScriptProvider
                                      options={{
                                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
                                        currency: 'EUR',
                                      }}
                                    >
                                      <PayPalButtons
                                        createOrder={(_data, actions) => {
                                          const total = calculateGrandTotal();
                                          return actions.order.create({
                                            intent: 'CAPTURE',
                                            purchase_units: [
                                              {
                                                amount: {
                                                  value: total.toFixed(2),
                                                  currency_code: 'EUR',
                                                },
                                              },
                                            ],
                                          });
                                        }}
                                        onApprove={async (_data, actions) => {
                                          if (!actions.order) return;
                                          setPaypalProcessing(true);
                                          setPaymentError('');
                                          try {
                                            await actions.order.capture();
                                            await handleFinalizeOrder((msg) => setPaymentError(msg));
                                          } catch (err) {
                                            console.error('PayPal capture error:', err);
                                            setPaymentError('Payment could not be completed. Please try again.');
                                          } finally {
                                            setPaypalProcessing(false);
                                          }
                                        }}
                                        onError={(err) => {
                                          console.error('PayPal error:', err);
                                          setPaymentError(String(err?.message || 'PayPal payment failed. Please try again.'));
                                        }}
                                      />
                                    </PayPalScriptProvider>
                                  )}
                                </div>
                              ) : paymentMethod === 'Visa/Mastercard' ? (
                                <>
                                  {paymentError && (
                                    <div className="mb-4 p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 font-semibold">
                                      {paymentError}
                                    </div>
                                  )}
                                  {paymentProcessing && (
                                    <div className="mb-4 p-6 bg-purple-50 border-2 border-purple-500 rounded-xl text-center">
                                      {paymentTimeout ? (
                                        <>
                                          <p className="text-purple-800 font-semibold mb-2">Payment is taking longer than expected.</p>
                                          <p className="text-purple-600 text-sm mb-4">Check your email for confirmation, or try again below.</p>
                                          <button
                                            type="button"
                                            onClick={cancelPaymentProcessing}
                                            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                                          >
                                            Try again
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent mx-auto mb-3" />
                                          <p className="text-purple-800 font-semibold">Checking payment status...</p>
                                          <p className="text-purple-600 text-sm mt-1 mb-4">Please wait a moment.</p>
                                          <button
                                            type="button"
                                            onClick={cancelPaymentProcessing}
                                            className="text-sm text-purple-600 hover:text-purple-800 font-medium underline"
                                          >
                                            Cancel and try again
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {!paymentProcessing && checkoutLoading && (
                                    <div className="mb-4 p-6 bg-purple-50 border-2 border-purple-200 rounded-xl text-center">
                                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent mx-auto mb-3" />
                                      <p className="text-purple-800 font-semibold">Setting up secure payment...</p>
                                    </div>
                                  )}
                                  {!paymentProcessing && !checkoutLoading && sumupCheckoutId && showSumupWidget && (
                                    <div className="mb-4">
                                      <p className="text-sm font-semibold text-gray-700 mb-2">Pay with card (SumUp)</p>
                                      <div id="sumup-card-custom" className="min-h-[200px]" />
                                      {!sumupScriptReady && (
                                        <div className="flex gap-3 py-4 text-gray-600">
                                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
                                          <span>Loading payment form...</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        {checkoutStep !== 'signup' && (
                          <button
                            onClick={() => {
                              if (checkoutStep === 'shipping') {
                                setCheckoutStep('signup');
                              } else if (checkoutStep === 'payment') {
                                setSumupCheckoutId(null);
                                setShowSumupWidget(false);
                                sumupWidgetMountedRef.current = false;
                                setPaymentError('');
                                setPaypalProcessing(false);
                                setCheckoutStep('shipping');
                              }
                            }}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                          >
                            ← Back
                          </button>
                        )}
                        {checkoutStep === 'signup' && (
                          <div className="flex-1" />
                        )}
                        {checkoutStep === 'shipping' && (
                          <div className="flex-1" />
                        )}
                        {checkoutStep === 'payment' && (
                          <div className="flex-1" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {/* Finalize success firework popup — replaces browser alert, redirects to Custom Hat Orders */}
      {showFinalizeSuccessPopup && (
        <>
          {finalizeSuccessFireworks && <Fireworks trigger={true} duration={4500} />}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in cursor-pointer"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
            onClick={() => {
              if (finalizeRedirectTimeoutRef.current) {
                clearTimeout(finalizeRedirectTimeoutRef.current);
                finalizeRedirectTimeoutRef.current = null;
              }
              setShowFinalizeSuccessPopup(false);
              setFinalizeSuccessFireworks(false);
              router.push('/member/custom-orders');
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden pointer-events-auto transform animate-scaleIn"
              style={{
                boxShadow: '0 0 60px rgba(168, 85, 247, 0.5), 0 0 120px rgba(236, 72, 153, 0.4), 0 0 180px rgba(168, 85, 247, 0.2), 0 20px 40px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-pink-300/10 to-transparent rounded-3xl" />
              <div className="relative z-10 text-center">
                <div className="mb-6 flex justify-center">
                  <div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                    style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)' }}
                  >
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">🎉 Customization saved!</h2>
                <p className="text-lg text-gray-700 mb-2">Your custom order has been placed.</p>
                <p className="text-gray-600 mb-6">Redirecting to Custom Hat Orders…</p>
                <button
                  onClick={() => {
                    if (finalizeRedirectTimeoutRef.current) {
                      clearTimeout(finalizeRedirectTimeoutRef.current);
                      finalizeRedirectTimeoutRef.current = null;
                    }
                    setShowFinalizeSuccessPopup(false);
                    setFinalizeSuccessFireworks(false);
                    router.push('/member/custom-orders');
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-xl text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
                >
                  View My Custom Orders →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
