'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WixImage from '@/components/WixImage';
import CollectionHatCard from '@/components/CollectionHatCard';
import { Hat } from '@/lib/wix-types';
import RainbowButton from '@/components/RainbowButton';
import { useTranslations } from '@/lib/translations';

interface SelectedHatForCustomizer {
  _id: string;
  hatForm: string;
  hatColorName: string;
  rawHatId: string;
  rawHatPrice: number;
  hatProductImage?: string;
  amount: number;
  containerId: string;
}

function CollectionsPageContent() {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hats, setHats] = useState<Hat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHats, setSelectedHats] = useState<Hat[]>([]);
  const selectMode = searchParams.get('selectMode') === 'true';
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    // Check for PR referral ID in URL and store it, also track visit
    if (typeof window !== 'undefined') {
      const prParam = searchParams?.get('pr');
      if (prParam) {
        localStorage.setItem('prReferralId', prParam);
        console.log('🔗 PR Referral ID detected and stored:', prParam);
        
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
            const visitsKey = `prVisits_${prParam.toUpperCase()}`;
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

  useEffect(() => {
    async function fetchHats() {
      try {
        // Fetch only active hats for the collections page
        const response = await fetch('/api/hats?activeOnly=true&sortBy=created_at_desc', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (response.ok) {
          const data = await response.json();
          setHats(data.hats || []);
          
          // If in select mode, load existing hats from customizer and mark them as selected
          if (selectMode) {
            try {
              const existingHatsStr = localStorage.getItem('existingCustomizerHats');
              if (existingHatsStr) {
                const existingHats: any[] = JSON.parse(existingHatsStr);
                // Convert SelectedHat format to Hat format for selection
                // Match by rawHatId or _id
                const hatsToSelect: Hat[] = [];
                data.hats.forEach((hat: Hat) => {
                  const isExisting = existingHats.some(eh => eh.rawHatId === hat._id || eh._id === hat._id);
                  if (isExisting) {
                    hatsToSelect.push(hat);
                  }
                });
                if (hatsToSelect.length > 0) {
                  setSelectedHats(hatsToSelect);
                  console.log('✅ Loaded existing hats from customizer:', hatsToSelect.length);
                }
              }
            } catch (error) {
              console.error('Error loading existing hats:', error);
            }
          }
        } else {
          console.error('Error fetching hats:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching hats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHats();
  }, [selectMode]);

  const toggleHatSelection = (hat: Hat) => {
    if (!selectMode) return;
    
    setSelectedHats(prev => {
      const isSelected = prev.some(h => h._id === hat._id);
      if (isSelected) {
        return prev.filter(h => h._id !== hat._id);
      } else {
        return [...prev, hat];
      }
    });
  };

  const handleConfirmSelection = () => {
    if (selectedHats.length === 0) {
      alert(t('collections.pleaseSelectOne'));
      return;
    }

    // Convert selected hats to SelectedHatForCustomizer format
    const hatsForCustomizer: SelectedHatForCustomizer[] = selectedHats.map(hat => ({
      _id: hat._id,
      hatForm: 'Custom',
      hatColorName: hat.title || 'Custom',
      rawHatId: hat._id,
      rawHatPrice: hat.discountedPrice && hat.discountedPrice !== 0 ? hat.discountedPrice : hat.price,
      hatProductImage: hat.mainHatImage || '',
      amount: 1,
      containerId: `collection-${hat._id}-${Date.now()}`,
    }));

    // Store in localStorage to pass to customizer
    localStorage.setItem('selectedCollectionHats', JSON.stringify(hatsForCustomizer));
    
    // Clean up the existing hats storage since we're replacing them
    localStorage.removeItem('existingCustomizerHats');
    
    // Redirect back to customizer
    router.push('/create-your-hat?fromCollection=true');
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <p className="text-gray-500 text-lg">{t('collections.loadingHats')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${selectMode ? 'flex gap-8' : ''}`}>
        {/* Main Content */}
        <div className={selectMode ? 'flex-1' : 'w-full'}>
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif mb-4">{t('collections.listTitle')}</h1>
            <p className="text-3xl font-script text-gray-700 mb-2">
              {selectMode ? t('collections.selectToCustomize') : t('collections.findYourPerfect')}
            </p>
            <p className="text-lg text-gray-600">
              {selectMode ? t('collections.selectSubtext') : t('collections.findSubtext')}
            </p>
          </div>

          {hats.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-4">{t('collections.connectingCms')}</p>
              <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                <p className="text-yellow-800 font-semibold mb-2">{t('collections.apiIssueTitle')}</p>
                <p className="text-yellow-700 text-sm mb-4">
                  {t('collections.apiIssueText')}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hats.map((hat) => (
                <CollectionHatCard
                  key={hat._id}
                  hat={hat}
                  selectMode={selectMode}
                  isSelected={selectMode && selectedHats.some(h => h._id === hat._id)}
                  onToggleSelect={toggleHatSelection}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* Selection Box (Right Side) - Only shown in select mode */}
        {selectMode && (
          <div className="w-80 bg-white border-2 border-purple-200 rounded-xl p-6 shadow-lg sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-2xl font-serif mb-4 text-gray-900">{t('collections.selectedHats')}</h3>
            {selectedHats.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('collections.noHatsSelected')}</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {selectedHats.map((hat) => (
                    <div key={hat._id} className="flex gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      {hat.mainHatImage && (
                        <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                          <WixImage
                            src={hat.mainHatImage}
                            alt={hat.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{hat.title}</p>
                        <p className="text-xs text-gray-600">
                          €{hat.discountedPrice && hat.discountedPrice !== 0 ? hat.discountedPrice : hat.price}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHatSelection(hat);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {t('collections.total')} <span className="font-bold text-gray-900">
                      €{selectedHats.reduce((sum, hat) => sum + (hat.discountedPrice && hat.discountedPrice !== 0 ? hat.discountedPrice : hat.price), 0).toFixed(2)}
                    </span>
                  </p>
                  <RainbowButton
                    onClick={handleConfirmSelection}
                    className="w-full text-center py-3"
                  >
                    {t('collections.confirmSelection')} ({selectedHats.length})
                  </RainbowButton>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-20 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    }>
      <CollectionsPageContent />
    </Suspense>
  );
}
