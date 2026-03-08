'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Hat } from '@/lib/wix-types';

interface PaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  hat: Hat;
  onComplete: (orderData: any) => void;
}

export default function PaymentPopup({ isOpen, onClose, hat, onComplete }: PaymentPopupProps) {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<'info' | 'shipping' | 'payment'>('info');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);
  const [wantsToSignup, setWantsToSignup] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [useMemberData, setUseMemberData] = useState(true);
  const [saveShippingAddress, setSaveShippingAddress] = useState(false);
  const [memberOrderCount, setMemberOrderCount] = useState(0);
  const [applyVIPDiscount, setApplyVIPDiscount] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [shippingOption, setShippingOption] = useState<string>('');
  const [shippingPrice, setShippingPrice] = useState<number>(0);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  
  const productPrice = hat.discountedPrice && hat.discountedPrice !== 0
    ? hat.discountedPrice
    : hat.price;
  
  // Calculate VIP discount tier (defined as constant)
  const discountTiers = [
    { level: 1, purchases: 1, discount: 2, name: 'VIP Member', icon: '⭐' },
    { level: 2, purchases: 3, discount: 5, name: 'VIP Elite', icon: '✨' },
    { level: 3, purchases: 5, discount: 8, name: 'VIP Premium', icon: '💎' },
    { level: 4, purchases: 8, discount: 11, name: 'VIP Platinum', icon: '👑' },
    { level: 5, purchases: 15, discount: 14, name: 'VIP Diamond', icon: '💠' },
  ];
  
  const currentTier = discountTiers
    .slice()
    .reverse()
    .find(tier => memberOrderCount >= tier.purchases) || null;
  
  const discountPercent = applyVIPDiscount && currentTier ? currentTier.discount : 0;
  const discountAmount = (productPrice + shippingPrice) * (discountPercent / 100);
  const totalPrice = (productPrice + shippingPrice) - discountAmount;

  // Check if user is logged in and load member data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const memberName = localStorage.getItem('memberName');
      const memberEmail = localStorage.getItem('memberEmail');
      let memberPhone = localStorage.getItem('memberPhone');
      let memberPhonecode = localStorage.getItem('memberPhonecode');
      
      console.log('📱 PaymentPopup - Loading from localStorage:', {
        memberName,
        memberEmail,
        memberPhone,
        memberPhonecode,
      });
      
      if (memberName && memberEmail) {
        setIsLoggedIn(true);
        
        // If phone data is missing, fetch from API
        if ((!memberPhone || !memberPhonecode) && memberEmail) {
          console.log('📱 Phone data missing, fetching from API...');
          fetch('/api/members/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberEmail: memberEmail, password: '' }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.member) {
                const fetchedPhone = data.member.memberPhone || '';
                const fetchedPhonecode = data.member.memberPhonecode || '';
                console.log('📱 Fetched from API:', { fetchedPhone, fetchedPhonecode });
                
                // Update localStorage
                if (fetchedPhone) {
                  localStorage.setItem('memberPhone', fetchedPhone);
                  memberPhone = fetchedPhone;
                }
                if (fetchedPhonecode) {
                  localStorage.setItem('memberPhonecode', fetchedPhonecode);
                  memberPhonecode = fetchedPhonecode;
                }
                
                // Update state with shipping info if available
                const shippingAddress = data.member.shippingAddress || '';
                const shippingCity = data.member.shippingCity || '';
                const shippingPostalCode = data.member.shippingPostalCode || '';
                const shippingCountry = data.member.shippingCountry || '';
                
                // Save shipping to localStorage if available
                if (shippingAddress && typeof window !== 'undefined') {
                  localStorage.setItem('memberShippingAddress', shippingAddress);
                  localStorage.setItem('memberShippingCity', shippingCity);
                  localStorage.setItem('memberShippingPostalCode', shippingPostalCode);
                  localStorage.setItem('memberShippingCountry', shippingCountry);
                }
                
                // Update state
                setMemberData({
                  name: memberName,
                  email: memberEmail,
                  phone: memberPhone || '',
                  phonecode: memberPhonecode || '',
                  shippingAddress,
                  shippingCity,
                  shippingPostalCode,
                  shippingCountry,
                });
                
                // Fetch member's order count for VIP discount
                fetch(`/api/orders/get?memberEmail=${encodeURIComponent(memberEmail)}`)
                  .then(res => res.json())
                  .then(orderData => {
                    if (orderData.success && orderData.orders) {
                      setMemberOrderCount(orderData.orders.length);
                      // Auto-enable discount if member has unlocked a tier
                      const tier = discountTiers
                        .slice()
                        .reverse()
                        .find(t => orderData.orders.length >= t.purchases);
                      if (tier) {
                        setApplyVIPDiscount(true);
                      }
                    }
                  })
                  .catch(err => console.error('Error fetching order count:', err));
                
                // Pre-fill shipping if available
                if (shippingAddress && shippingCity) {
                  setShippingAddress(shippingAddress);
                  setCity(shippingCity);
                  setPostalCode(shippingPostalCode);
                  setCountry(shippingCountry);
                }
                
                if (useMemberData) {
                  setPhoneCode(memberPhonecode || '+1');
                  setMobile(memberPhone || '');
                }
              }
            })
            .catch(err => console.error('📱 Error fetching phone:', err));
        }
        
        // Load shipping data from localStorage if available
        const savedShippingAddress = localStorage.getItem('memberShippingAddress');
        const savedShippingCity = localStorage.getItem('memberShippingCity');
        const savedShippingPostalCode = localStorage.getItem('memberShippingPostalCode');
        const savedShippingCountry = localStorage.getItem('memberShippingCountry');
        
        // Pre-fill shipping fields if available
        if (savedShippingAddress) {
          setShippingAddress(savedShippingAddress);
        }
        if (savedShippingCity) {
          setCity(savedShippingCity);
        }
        if (savedShippingPostalCode) {
          setPostalCode(savedShippingPostalCode);
        }
        if (savedShippingCountry) {
          setCountry(savedShippingCountry);
        }
        
        // Set initial member data
        setMemberData({
          name: memberName,
          email: memberEmail,
          phone: memberPhone || '',
          phonecode: memberPhonecode || '',
          shippingAddress: savedShippingAddress || '',
          shippingCity: savedShippingCity || '',
          shippingPostalCode: savedShippingPostalCode || '',
          shippingCountry: savedShippingCountry || '',
        });
        
        // Auto-fill form if logged in
        if (useMemberData) {
          setName(memberName);
          setEmail(memberEmail);
          setPhoneCode(memberPhonecode || '+1');
          setMobile(memberPhone || '');
        }
      } else {
        setIsLoggedIn(false);
        setMemberData(null);
      }
    }
  }, [useMemberData]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      
        // Load shipping data from localStorage when popup opens (if not already set)
        if (typeof window !== 'undefined' && !shippingAddress) {
          const savedShippingAddress = localStorage.getItem('memberShippingAddress');
          const savedShippingCity = localStorage.getItem('memberShippingCity');
          const savedShippingPostalCode = localStorage.getItem('memberShippingPostalCode');
          const savedShippingCountry = localStorage.getItem('memberShippingCountry');
          
          // Pre-fill shipping fields if available
          if (savedShippingAddress) setShippingAddress(savedShippingAddress);
          if (savedShippingCity) setCity(savedShippingCity);
          if (savedShippingPostalCode) setPostalCode(savedShippingPostalCode);
          if (savedShippingCountry) setCountry(savedShippingCountry);
        }
      
      // Auto-focus first field with a slight delay for animation (only if not logged in or not using member data)
      setTimeout(() => {
        if (!isLoggedIn || !useMemberData) {
          nameInputRef.current?.focus();
          setFocusedField('name');
        }
      }, 500);
    } else {
      setIsAnimating(false);
      setCurrentStep('info');
      setFocusedField(null);
      setWantsToSignup(false);
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, isLoggedIn, useMemberData]);

  const handleShippingChange = (value: string) => {
    setShippingOption(value);
    const price = parseFloat(value.replace('€', '').replace(',', '.'));
    setShippingPrice(isNaN(price) ? 0 : price);
  };

  const handleNextStep = async () => {
    if (currentStep === 'info') {
      if (!name || !email || !mobile || !phoneCode) {
        // Highlight missing fields
        if (!name) {
          nameInputRef.current?.focus();
          setFocusedField('name');
        } else if (!email) {
          emailInputRef.current?.focus();
          setFocusedField('email');
        } else if (!phoneCode) {
          setFocusedField('phonecode');
        } else if (!mobile) {
          mobileInputRef.current?.focus();
          setFocusedField('mobile');
        }
        return;
      }

      // If user wants to signup, create account first
      if (wantsToSignup && !isLoggedIn) {
        if (!password || password.length < 6) {
          alert('Please enter a password (minimum 6 characters).');
          return;
        }
        if (password !== confirmPassword) {
          alert('Passwords do not match.');
          return;
        }

        // Create account
        try {
          const response = await fetch('/api/members/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              memberName: name,
              memberEmail: email,
              memberPhone: mobile,
              memberPhonecode: phoneCode || '+1',
              password: password,
            }),
          });

          const data = await response.json();
          if (response.ok && data.success) {
            // Store member data in localStorage
            localStorage.setItem('memberName', name);
            localStorage.setItem('memberEmail', email);
            localStorage.setItem('memberPhone', mobile);
            localStorage.setItem('memberId', data.user.memberId);
            setIsLoggedIn(true);
            alert('Account created successfully! You can now track your orders.');
          } else {
            alert(data.error || 'Failed to create account. You can continue as guest.');
          }
        } catch (error) {
          console.error('Signup error:', error);
          alert('Failed to create account. You can continue as guest.');
        }
      }

      setCurrentStep('shipping');
    } else if (currentStep === 'shipping') {
      if (!shippingAddress || !city || !postalCode || !country || !shippingOption) {
        alert('Please fill in all shipping details.');
        return;
      }
      
      // Proceed to payment step immediately (don't block on save)
      setCurrentStep('payment');
      
      // If user wants to save shipping address and is logged in, save it to CMS in background
      if (saveShippingAddress && isLoggedIn && memberData && email) {
        // Save in background - don't await, don't block the flow
        (async () => {
          try {
            console.log('💾 Saving shipping address to member profile...');
            
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('/api/members/update-shipping', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                memberEmail: email,
                shippingAddress,
                city,
                postalCode,
                country,
              }),
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            const data = await response.json();
            
            if (response.ok && data.success) {
              console.log('✅ Shipping address saved to member profile');
              // Also save to localStorage for quick access
              if (typeof window !== 'undefined') {
                localStorage.setItem('memberShippingAddress', shippingAddress);
                localStorage.setItem('memberShippingCity', city);
                localStorage.setItem('memberShippingPostalCode', postalCode);
                localStorage.setItem('memberShippingCountry', country);
              }
            } else {
              console.warn('⚠️ Failed to save shipping address to profile:', data.error);
            }
          } catch (error: any) {
            if (error.name === 'AbortError') {
              console.warn('⚠️ Save shipping address timed out - continuing anyway');
            } else {
              console.error('❌ Error saving shipping address:', error);
            }
          }
        })();
      }
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'shipping') {
      setCurrentStep('info');
    } else if (currentStep === 'payment') {
      setCurrentStep('shipping');
    }
  };

  const handleSubmit = async () => {
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      alert('Please fill in all payment details.');
      return;
    }

    // Calculate final price with VIP discount
    const finalPrice = hat.discountedPrice && hat.discountedPrice !== 0
      ? hat.discountedPrice
      : hat.price;
    const subtotal = finalPrice + shippingPrice;
    const vipDiscount = applyVIPDiscount && currentTier ? subtotal * (currentTier.discount / 100) : 0;
    const totalFinalCost = subtotal - vipDiscount;

    try {
      // Save order to 'hatOrders' CMS
      console.log('💾 Creating order in hatOrders CMS...');
      console.log('📦 Order data:', {
        action: 'create',
        hatorderName: name,
        hatorderEmail: email,
        hatorderMobile: phoneCode ? `${phoneCode} ${mobile}` : mobile,
        hatOrderPrice: finalPrice,
        hatOrderSubtitle: hat.hatSubtitle || '',
        hatOrdertitle: hat.title || '',
        shippingCost: shippingPrice,
        totalFinalCost: totalFinalCost,
        orderAddress: shippingAddress,
        shippingCity: city,
        shippingPostalCode: postalCode,
        shippingCountry: country,
        shippingOption: shippingOption,
      });
      
      // Get PR referral ID from localStorage (set when user visits via PR link)
      const prReferralId = typeof window !== 'undefined' ? localStorage.getItem('prReferralId') : null;
      console.log('🔗 Sending order with PR Referral ID:', prReferralId || 'None');
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          hatorderName: name,
          hatorderEmail: email,
          hatorderMobile: phoneCode ? `${phoneCode} ${mobile}` : mobile,
          hatorderCustomAsk: '', // Can be added later if needed
          hatOrderPrice: finalPrice,
          hatOrderSubtitle: hat.hatSubtitle || '',
          hatOrdertitle: hat.title || '',
          shippingCost: shippingPrice,
          totalFinalCost: totalFinalCost,
          orderAddress: shippingAddress,
          shippingCity: city,
          shippingPostalCode: postalCode,
          shippingCountry: country,
          shippingOption: shippingOption,
          prReferralId: prReferralId || '', // Include PR referral ID if present
        }),
      });

      console.log('📥 API Response status:', response.status);
      const data = await response.json();
      console.log('📥 API Response data:', data);
      
      if (response.ok && data.success) {
        console.log('✅ Order created successfully:', data.hatOrderID);
        
        // Call onComplete with order data
        const orderData = {
          name,
          email,
          mobile: phoneCode ? `${phoneCode} ${mobile}` : mobile,
          shippingAddress,
          city,
          postalCode,
          country,
          shippingOption,
          shippingPrice,
          hat,
          totalPrice: totalFinalCost,
          orderId: data.hatOrderID || data.orderId,
        };

        onComplete(orderData);
      } else {
        console.error('❌ Failed to create order:', data);
        console.error('❌ Response status:', response.status);
        console.error('❌ Error details:', data.error, data.details);
        alert(data.error || data.details || 'Failed to create order. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Error creating order:', error);
      console.error('❌ Error stack:', error.stack);
      alert(`An error occurred while creating your order: ${error.message || 'Unknown error'}. Please try again.`);
    }
  };

  // Don't render anything if not open
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] animate-fade-in"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.3s ease-out',
        }}
      />
      
      {/* Popup Container */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
        <div 
          className={`bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all duration-500 ${
            isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10'
          }`}
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)',
          }}
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 p-6 rounded-t-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 animate-pulse-slow" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Complete Your Order</h2>
                <p className="text-white/90 text-sm">{hat.title}</p>
              </div>
              <button
                onClick={onClose}
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
              <div className={`flex-1 ${currentStep === 'info' ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep === 'info' ? 'bg-purple-500 text-white' : 'bg-gray-200'
                  }`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-semibold">Information</span>
                </div>
              </div>
              <div className={`flex-1 mx-2 ${currentStep === 'shipping' ? 'text-purple-600' : currentStep === 'payment' ? 'text-gray-400' : 'text-gray-300'}`}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep === 'shipping' ? 'bg-purple-500 text-white' : currentStep === 'payment' ? 'bg-gray-200' : 'bg-gray-100'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-semibold">Shipping</span>
                </div>
              </div>
              <div className={`flex-1 ${currentStep === 'payment' ? 'text-purple-600' : 'text-gray-300'}`}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep === 'payment' ? 'bg-purple-500 text-white' : 'bg-gray-100'
                  }`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-semibold">Payment</span>
                </div>
              </div>
            </div>
            <div className="flex items-center mt-2">
              <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                currentStep !== 'info' ? 'bg-purple-500' : 'bg-gray-200'
              }`} />
              <div className={`h-1 flex-1 mx-1 rounded-full transition-all duration-500 ${
                currentStep === 'payment' ? 'bg-purple-500' : 'bg-gray-200'
              }`} />
              <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                currentStep === 'payment' ? 'bg-purple-500' : 'bg-gray-200'
              }`} />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {/* Step 1: Information */}
            {currentStep === 'info' && (
              <div className="space-y-4 animate-slide-in">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Information</h3>
                  <p className="text-sm text-gray-600">Please provide your contact details</p>
                </div>

                {/* Member Card - Show if logged in */}
                {isLoggedIn && memberData && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                          {memberData.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{memberData.name}</p>
                          <p className="text-sm text-gray-600">{memberData.email}</p>
                          {/* Always show phone section if phonecode or phone exists, even if empty */}
                          {(memberData.phonecode || memberData.phone) ? (
                            <p className="text-sm text-gray-600 mt-1">
                              📞 {memberData.phonecode || ''} {memberData.phone || ''}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1 italic">No phone number on file</p>
                          )}
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        ✓ Member
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUseMemberData(true);
                          setName(memberData.name);
                          setEmail(memberData.email);
                          setMobile(memberData.phone || '');
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          useMemberData
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-white border-2 border-purple-300 text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        Use My Info
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseMemberData(false);
                          // Pre-fill with member data so they can edit
                          setName(memberData.name);
                          setEmail(memberData.email);
                          setPhoneCode(memberData.phonecode || '+1');
                          setMobile(memberData.phone || '');
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          !useMemberData
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-white border-2 border-purple-300 text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                )}

                {/* Signup Option for Guests */}
                {!isLoggedIn && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Create an Account?</h4>
                        <p className="text-sm text-gray-600">Sign up now and enjoy these benefits:</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWantsToSignup(!wantsToSignup)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          wantsToSignup
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border-2 border-blue-300 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {wantsToSignup ? '✓ Signing Up' : 'Sign Up'}
                      </button>
                    </div>
                    {wantsToSignup && (
                      <div className="mt-3 space-y-3 animate-slide-in">
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Track your orders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Faster checkout</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Member discounts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Order history</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Password *</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-400 transition-all"
                            placeholder="Minimum 6 characters"
                            required={wantsToSignup}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Confirm Password *</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-400 transition-all"
                            placeholder="Re-enter your password"
                            required={wantsToSignup}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Form Fields - Show if not using member data or not logged in */}
                {(!isLoggedIn || !useMemberData) && (
                  <>
                    {/* Name Field with special animation */}
                    <div className="relative">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Full Name *
                        {focusedField === 'name' && !isLoggedIn && (
                          <span className="ml-2 text-purple-500 animate-pulse">← Start here</span>
                        )}
                      </label>
                      <div className={`relative transition-all duration-300 ${
                        focusedField === 'name' ? 'transform scale-[1.02]' : ''
                      }`}>
                        <input
                          ref={nameInputRef}
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                            focusedField === 'name' 
                              ? 'border-purple-500 ring-4 ring-purple-200 shadow-lg' 
                              : 'border-gray-300 focus:border-purple-400'
                          }`}
                          placeholder="Enter your full name"
                          required
                        />
                        {focusedField === 'name' && (
                          <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl opacity-20 blur-sm animate-pulse" />
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Email Address *</label>
                      <input
                        ref={emailInputRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                          focusedField === 'email' 
                            ? 'border-purple-500 ring-4 ring-purple-200 shadow-lg' 
                            : 'border-gray-300 focus:border-purple-400'
                        }`}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Mobile Number *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={phoneCode}
                          onChange={(e) => setPhoneCode(e.target.value)}
                          onFocus={() => setFocusedField('phonecode')}
                          onBlur={() => setFocusedField(null)}
                          className={`w-24 px-3 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                            focusedField === 'phonecode' 
                              ? 'border-purple-500 ring-4 ring-purple-200 shadow-lg' 
                              : 'border-gray-300 focus:border-purple-400'
                          }`}
                          placeholder="+1"
                          required
                        />
                        <input
                          ref={mobileInputRef}
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          onFocus={() => setFocusedField('mobile')}
                          onBlur={() => setFocusedField(null)}
                          className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                            focusedField === 'mobile' 
                              ? 'border-purple-500 ring-4 ring-purple-200 shadow-lg' 
                              : 'border-gray-300 focus:border-purple-400'
                          }`}
                          placeholder="234 567 8900"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Shipping */}
            {currentStep === 'shipping' && (
              <div className="space-y-4 animate-slide-in">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Shipping Details</h3>
                  <p className="text-sm text-gray-600">Where should we deliver your hat?</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Address *</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      focusedField === 'address' 
                        ? 'border-purple-500 ring-4 ring-purple-200 shadow-lg' 
                        : 'border-gray-300 focus:border-purple-400'
                    }`}
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Postal Code *</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Country *</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Shipping Method *</label>
                  <div className="space-y-2">
                    {[
                      { value: '€15', label: 'Standard Shipping (5-7 days)', price: 15 },
                      { value: '€30', label: 'Express Shipping (2-3 days)', price: 30 },
                      { value: '€50', label: 'Overnight Shipping', price: 50 },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleShippingChange(option.value)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                          shippingOption === option.value
                            ? 'border-purple-500 bg-purple-50 shadow-lg transform scale-[1.02]'
                            : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{option.label}</span>
                          <span className="text-purple-600 font-bold">{option.value}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Address Checkbox - Only show if logged in */}
                {isLoggedIn && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveShippingAddress}
                        onChange={(e) => setSaveShippingAddress(e.target.checked)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        <span className="font-semibold">Save address info for faster checkout on new orders</span>
                        <span className="block text-xs text-gray-500 mt-1">
                          Your shipping details will be saved to your account for future orders
                        </span>
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 'payment' && (
              <div className="space-y-4 animate-slide-in">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Information</h3>
                  <p className="text-sm text-gray-600">Secure payment processing</p>
                </div>

                {/* VIP Discount Toggle */}
                {isLoggedIn && currentTier && (
                  <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-purple-100 p-4 rounded-xl border-2 border-purple-300 mb-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyVIPDiscount}
                        onChange={(e) => setApplyVIPDiscount(e.target.checked)}
                        className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{currentTier.icon || '⭐'}</span>
                          <span className="font-bold text-purple-700">{currentTier.name} Discount</span>
                          <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                            {currentTier.discount}% OFF
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          Apply your {currentTier.discount}% VIP discount to this order
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200 mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-semibold">Product:</span>
                      <span className="text-gray-900 font-semibold">€{productPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-semibold">Shipping:</span>
                      <span className="text-gray-900 font-semibold">€{shippingPrice.toFixed(2)}</span>
                    </div>
                    {applyVIPDiscount && currentTier && discountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span className="font-semibold">
                          {currentTier.name} Discount ({currentTier.discount}%):
                        </span>
                        <span className="font-bold">-€{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-purple-300 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-bold text-lg">Total Amount:</span>
                        <span className="text-2xl font-bold text-purple-600">€{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Card Number *</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim())}
                    onFocus={() => setFocusedField('card')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      focusedField === 'card' 
                        ? 'border-purple-500 ring-4 ring-purple-200 shadow-lg' 
                        : 'border-gray-300 focus:border-purple-400'
                    }`}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Cardholder Name *</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Expiry Date *</label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.substring(0, 2) + '/' + value.substring(2, 4);
                        }
                        setExpiryDate(value);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">CVV *</label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                      placeholder="123"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              {currentStep !== 'info' && (
                <button
                  onClick={handleBackStep}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  ← Back
                </button>
              )}
              {currentStep !== 'payment' ? (
                <button
                  onClick={handleNextStep}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  Complete Order ✓
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
