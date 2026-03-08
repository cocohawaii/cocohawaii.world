'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WixImage from '@/components/WixImage';
import Fireworks from '@/components/Fireworks';
import { useAuth } from '@/components/AuthProvider';
import { Hat } from '@/lib/wix-types';

interface SalesData {
  totalSales: number;
  totalEarnings: number;
  hatSales: Array<{
    hat: Hat;
    sales: number;
    earnings: number;
    commissionRate: number;
  }>;
}

export default function PRPage() {
  const [memberName, setMemberName] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState<string | null>(null);
  const [prReferralId, setPrReferralId] = useState<string | null>(null);
  // Initialize with zeros so statistics always show
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalEarnings: 0,
    hatSales: [],
  });
  const [hats, setHats] = useState<Hat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hatsLoading, setHatsLoading] = useState(true);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [copiedHat, setCopiedHat] = useState<Hat | null>(null);
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  const { member, isLoading } = useAuth();

  const loadSalesData = async () => {
    try {
      if (!member?.memberEmail) return;
      const response = await fetch(`/api/members/pr-sales?memberEmail=${encodeURIComponent(member.memberEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSalesData(data.salesData);
        } else {
          setSalesData({
            totalSales: 0,
            totalEarnings: 0,
            hatSales: [],
          });
        }
      } else {
        setSalesData({
          totalSales: 0,
          totalEarnings: 0,
          hatSales: [],
        });
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
      setSalesData({
        totalSales: 0,
        totalEarnings: 0,
        hatSales: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHats = async () => {
    try {
      setHatsLoading(true);
      const response = await fetch('/api/hats');
      const data = await response.json();

      if (response.ok && data.success && data.hats) {
        setHats(data.hats);
      }
    } catch (error) {
      console.error('Error loading hats:', error);
    } finally {
      setHatsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !member) {
      window.location.href = '/login';
      return;
    }
    const hasPRTag = member?.isPr || (member?.memberTag && (
      member.memberTag === 'PR' || member.memberTag === 'pr' ||
      (typeof member.memberTag === 'string' && member.memberTag.toLowerCase().includes('pr')) ||
      (Array.isArray(member.memberTag) && member.memberTag.some((t: string) => String(t).toLowerCase().includes('pr')))
    ));
    if (!hasPRTag) {
      window.location.href = '/member/dashboard';
      return;
    }
    setPrReferralId(member.id);
    loadSalesData();
    loadHats();
    const loadVisitCounts = () => {
      if (member?.id) {
        try {
          const visitsKey = `prVisits_${member.id.substring(0, 6).toUpperCase()}`;
          const storedVisits = localStorage.getItem(visitsKey);
          if (storedVisits) {
            const visits = JSON.parse(storedVisits);
            const counts: Record<string, number> = {};
            Object.keys(visits).forEach(key => {
              if (!key.endsWith('_lastVisit')) counts[key] = visits[key];
            });
            setVisitCounts(counts);
          }
        } catch (error) {
          console.error('Error loading visit counts:', error);
        }
      }
    };
    setTimeout(loadVisitCounts, 200);
  }, [member, isLoading]);

  // Generate a short PR referral code (3-6 characters)
  const generateShortCode = (input: string): string => {
    if (!input) return '';
    
    // Simple hash function to convert input to a short code
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive number and base36 (0-9, a-z)
    const positiveHash = Math.abs(hash);
    const shortCode = positiveHash.toString(36).substring(0, 6).toUpperCase();
    
    // Ensure it's at least 3 characters, pad if needed
    return shortCode.length >= 3 ? shortCode : (shortCode + '0'.repeat(3 - shortCode.length));
  };

  // Get short PR referral code (3-6 characters)
  const getShortPRCode = () => {
    const id = member?.id || prReferralId;
    if (id && id.length <= 6) return id.toUpperCase();
    if (id) return generateShortCode(id).substring(0, 6);
    const source = member?.memberEmail || prReferralId || '';
    if (source) {
      return generateShortCode(source).substring(0, 6);
    }
    
    return '';
  };

  // Generate PR referral links using short code (3-6 characters)
  const getPRReferralLink = (path: string) => {
    const shortCode = getShortPRCode();
    if (!shortCode) {
      console.warn('⚠️ No PR referral code available');
      return path;
    }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}${path}?pr=${encodeURIComponent(shortCode)}`;
    console.log('🔗 Generated PR link with short code:', link);
    return link;
  };

  const copyToClipboard = (text: string, hat?: Hat) => {
    navigator.clipboard.writeText(text).then(() => {
      if (hat) {
        setCopiedHat(hat);
        setShowCopyPopup(true);
        // Auto-hide after 8 seconds
        const timeout = setTimeout(() => {
          setShowCopyPopup(false);
          setCopiedHat(null);
        }, 8000);
        // Store timeout ID to clear if user clicks
        (window as any).copyPopupTimeout = timeout;
      } else {
        // For non-hat links, show a simpler popup
        setShowCopyPopup(true);
        const timeout = setTimeout(() => {
          setShowCopyPopup(false);
        }, 8000);
        (window as any).copyPopupTimeout = timeout;
      }
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const handlePopupClose = () => {
    // Clear timeout if user clicks to close
    if ((window as any).copyPopupTimeout) {
      clearTimeout((window as any).copyPopupTimeout);
    }
    setShowCopyPopup(false);
    setCopiedHat(null);
  };

  const getCommissionRate = (totalSales: number): number => {
    if (totalSales >= 50) return 20;
    if (totalSales >= 25) return 15;
    if (totalSales >= 3) return 12;
    return 10; // 10% is the base rate for 0+ sales
  };

  const commissionTiers = [
    { sales: 0, rate: 10, label: 'Starter' },
    { sales: 3, rate: 12, label: 'Bronze' },
    { sales: 25, rate: 15, label: 'Silver' },
    { sales: 50, rate: 20, label: 'Gold' },
  ];

  const currentTier = salesData
    ? commissionTiers
        .slice()
        .reverse()
        .find((tier) => salesData.totalSales >= tier.sales) || commissionTiers[0]
    : commissionTiers[0];

  const nextTier = commissionTiers.find((tier) => tier.sales > (salesData?.totalSales || 0));

  if (!member || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/member/dashboard" className="text-gray-600 hover:text-black transition-colors mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PR Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome, {member.memberName || member.fullName}!</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PR Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome, {memberName}!</p>
        </div>

        {/* Progressive Commission Tiers */}
        <div className="mb-8 bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Progressive Commission Structure</h2>
          <div className="grid grid-cols-4 gap-4">
            {commissionTiers.map((tier, index) => {
              const isCurrentTier = currentTier.sales === tier.sales;
              const isUnlocked = salesData ? salesData.totalSales >= tier.sales : false;
              
              return (
                <div
                  key={tier.sales}
                  className={`rounded-lg p-4 border-2 ${
                    isCurrentTier
                      ? 'border-purple-500 bg-purple-50'
                      : isUnlocked
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">{tier.rate}%</div>
                    <div className="text-sm text-gray-600 mb-2">{tier.label}</div>
                    <div className="text-xs text-gray-500">{tier.sales}+ sales</div>
                    {isCurrentTier && (
                      <div className="mt-2 text-xs font-bold text-purple-600">Current</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {nextTier && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Next Tier:</strong> Reach {nextTier.sales} sales to unlock {nextTier.rate}% commission rate.
                {salesData && (
                  <span className="ml-2">
                    You need {nextTier.sales - salesData.totalSales} more sales!
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Sales Statistics - Always show, even with 0 values */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Performance Statistics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sales */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">📊</div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{salesData.totalSales}</div>
                  <div className="text-sm opacity-90">Total Sales</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-xs opacity-75">Orders completed through your links</div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">💰</div>
                <div className="text-right">
                  <div className="text-3xl font-bold">€{salesData.totalEarnings.toFixed(2)}</div>
                  <div className="text-sm opacity-90">Total Revenue</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-xs opacity-75">Total value of all sales</div>
              </div>
            </div>

            {/* Current Commission Rate */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">📈</div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{getCommissionRate(salesData.totalSales)}%</div>
                  <div className="text-sm opacity-90">Commission Rate</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-xs opacity-75">{currentTier.label} Tier</div>
              </div>
            </div>

            {/* Total Commission Earned */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">💵</div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    €{((salesData.totalEarnings * getCommissionRate(salesData.totalSales)) / 100).toFixed(2)}
                  </div>
                  <div className="text-sm opacity-90">Total Commission</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-xs opacity-75">
                  {getCommissionRate(salesData.totalSales)}% of €{salesData.totalEarnings.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Hat Sales */}
        {salesData && salesData.hatSales.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hat Sales Breakdown</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salesData.hatSales.map((item) => (
                <div
                  key={item.hat._id}
                  className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {item.hat.mainHatImage && (
                    <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden bg-gray-100">
                      <WixImage
                        src={item.hat.mainHatImage}
                        alt={item.hat.title || 'Hat'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.hat.title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sales:</span>
                      <span className="font-bold">{item.sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission Rate:</span>
                      <span className="font-bold text-purple-600">{item.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Earnings:</span>
                      <span className="font-bold text-green-600 text-lg">€{item.earnings.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PR Referral Links Section */}
        <div className="mb-8 bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Referral Links</h2>
          <p className="text-gray-600 mb-6">Share these links to track your sales. When someone makes a purchase through your link, it will be attributed to you!</p>
          
          {/* Two Column Layout for Main Links */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Main Collection Link - Left Column */}
            <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-lg">📦 Collection Page</h3>
                  <p className="text-sm text-gray-600">Main link to browse all hats</p>
                </div>
                <button
                  onClick={() => copyToClipboard(getPRReferralLink('/collections'))}
                  className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-all duration-300 text-sm whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
              
              {/* Hat Images Preview */}
              {hats.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Preview of what you're promoting:</p>
                  <div className="flex gap-2 flex-wrap">
                    {hats.slice(0, 6).map((hat) => (
                      <div key={hat._id} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-purple-300 shadow-sm">
                        {hat.mainHatImage ? (
                          <WixImage
                            src={hat.mainHatImage}
                            alt={hat.title || 'Hat'}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl">
                            🎩
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-3 p-2 bg-white rounded border border-gray-300 text-xs text-gray-700 break-all">
                {getPRReferralLink('/collections')}
              </div>
            </div>

            {/* Customize Hat Link - Right Column */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-lg">🎨 Customize Your Hat</h3>
                  <p className="text-sm text-gray-600">Link to the hat customizer</p>
                </div>
                <button
                  onClick={() => copyToClipboard(getPRReferralLink('/create-your-hat'))}
                  className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all duration-300 text-sm whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
              
              {/* Customization Icon */}
              <div className="mb-3 flex items-center justify-center">
                <div className="relative w-32 h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl border-4 border-blue-300 shadow-lg flex items-center justify-center">
                  <svg className="w-20 h-20 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3 text-center">Let customers create their perfect custom hat</p>
              
              <div className="mt-3 p-2 bg-white rounded border border-gray-300 text-xs text-gray-700 break-all">
                {getPRReferralLink('/create-your-hat')}
              </div>
            </div>
          </div>

          {/* Individual Hat Links */}
          {hatsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading hat links...</p>
            </div>
          ) : hats.length > 0 ? (
            <div>
              <h3 className="font-bold text-gray-900 mb-4">🎩 Individual Hat Product Links</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {hats.map((hat) => {
                  const hatSlug = hat.title?.toLowerCase().replace(/\s+/g, '-') || hat._id;
                  const hatLink = getPRReferralLink(`/hats/${hatSlug}`);
                  
                  // Calculate hat price (use discounted price if available)
                  const hatPrice = hat.discountedPrice && hat.discountedPrice !== 0 
                    ? hat.discountedPrice 
                    : hat.price;
                  
                  // Get current commission rate
                  const commissionRate = getCommissionRate(salesData.totalSales);
                  
                  // Calculate commission amount
                  const commissionAmount = (hatPrice * commissionRate) / 100;
                  
                  // Find sales data for this hat
                  const hatSalesData = salesData.hatSales.find(
                    (item) => item.hat.title === hat.title || item.hat._id === hat._id
                  );
                  const salesCount = hatSalesData?.sales || 0;
                  
                  // Get visit count for this hat link
                  const visitCount = visitCounts[hatLink] || 0;
                  
                  return (
                    <div key={hat._id} className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start gap-4">
                        {/* Hat Image - Bigger */}
                        {hat.mainHatImage ? (
                          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 border-2 border-gray-300">
                            <WixImage
                              src={hat.mainHatImage}
                              alt={hat.title || 'Hat'}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-3xl">
                            🎩
                          </div>
                        )}
                        
                        {/* Hat Info and Stats */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-lg mb-2">
                            {hat.title || 'Untitled Hat'}
                          </h4>
                          
                          {/* Price and Commission Info */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            {/* Hat Price */}
                            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                              <p className="text-xs text-blue-600 font-semibold mb-1">Hat Price</p>
                              <p className="text-lg font-bold text-blue-900">€{hatPrice}</p>
                            </div>
                            
                            {/* Commission Rate */}
                            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                              <p className="text-xs text-purple-600 font-semibold mb-1">Commission</p>
                              <p className="text-lg font-bold text-purple-900">{commissionRate}%</p>
                            </div>
                            
                            {/* Amount Received - Bigger Green */}
                            <div className="bg-green-50 rounded-lg p-2 border-2 border-green-300 md:col-span-2">
                              <p className="text-xs text-green-600 font-semibold mb-1">Amount Received</p>
                              <p className="text-2xl font-bold text-green-600">€{commissionAmount.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          {/* Visits and Sales Stats */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {/* Visit Count */}
                            <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                              <p className="text-xs text-orange-600 font-semibold mb-1">Link Visits</p>
                              <p className="text-lg font-bold text-orange-900">{visitCount}</p>
                            </div>
                            
                            {/* Sales Count */}
                            <div className="bg-teal-50 rounded-lg p-2 border border-teal-200">
                              <p className="text-xs text-teal-600 font-semibold mb-1">Sales</p>
                              <p className="text-lg font-bold text-teal-900">{salesCount}</p>
                            </div>
                          </div>
                          
                          {/* Referral Link */}
                          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Referral Link:</p>
                            <p className="text-xs text-gray-700 break-all font-mono">{hatLink}</p>
                          </div>
                        </div>
                        
                        {/* Copy Button */}
                        <button
                          onClick={() => copyToClipboard(hatLink, hat)}
                          className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-all duration-300 text-sm whitespace-nowrap flex-shrink-0 h-fit"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hats available</p>
          )}
        </div>

        {/* Only show "No Sales Yet" message if there are no hat sales (individual breakdown) */}
        {salesData.hatSales.length === 0 && (
          <div className="bg-white rounded-xl p-12 border-2 border-purple-200 shadow-lg text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Hat Sales Breakdown Yet</h3>
            <p className="text-gray-600 mb-4">Start referring customers using your links above to see individual hat sales here!</p>
          </div>
        )}
      </div>

      {/* Beautiful Copy Success Popup with Fireworks */}
      {showCopyPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          {/* Fireworks Background */}
          <div className="absolute inset-0">
            <Fireworks trigger={showCopyPopup} duration={5000} />
          </div>
          
          {/* Popup Content */}
          <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-white/30 max-w-md w-full mx-4 transform animate-scaleIn">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowCopyPopup(false);
                setCopiedHat(null);
              }}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>

            {/* Hat Image (if available) */}
            {copiedHat?.mainHatImage && (
              <div className="relative w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden border-4 border-white/50 shadow-xl">
                <WixImage
                  src={copiedHat.mainHatImage}
                  alt={copiedHat.title || 'Hat'}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            )}

            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 border-4 border-white/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                Link Copied! 🎉
              </h3>
              
              {copiedHat && (
                <p className="text-xl text-white/90 mb-4 font-semibold">
                  {copiedHat.title}
                </p>
              )}
            </div>

            {/* Powerful Message */}
            <div className="text-center mb-6">
              <p className="text-2xl md:text-3xl font-bold text-white mb-3 drop-shadow-lg">
                You're Ready to Rock! 🚀
              </p>
              <p className="text-lg text-white/90 leading-relaxed drop-shadow-md">
                Share your link and make magic happen! Every sale brings you closer to your goals. Go out there and shine! ✨
              </p>
            </div>

            {/* Commission Info (if hat available) */}
            {copiedHat && (
              <div className="bg-white/20 rounded-xl p-4 mb-6 backdrop-blur-sm border border-white/30">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/80 text-sm">Your Commission</p>
                    <p className="text-2xl font-bold text-white">
                      {getCommissionRate(salesData.totalSales)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm">You'll Earn</p>
                    <p className="text-2xl font-bold text-green-300">
                      €{(((copiedHat.discountedPrice && copiedHat.discountedPrice !== 0 ? copiedHat.discountedPrice : copiedHat.price) * getCommissionRate(salesData.totalSales)) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handlePopupClose}
              className="w-full bg-white text-purple-600 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transition-all duration-300 text-lg shadow-lg transform hover:scale-105"
            >
              Let's Make Magic! ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
