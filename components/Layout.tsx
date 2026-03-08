'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import RainbowButton from './RainbowButton';
import Fireworks from './Fireworks';
import ProfileDropdown from './ProfileDropdown';
import LanguageSelector from './LanguageSelector';
import StarsBidPacksDropdown from './StarsBidPacksDropdown';
import { useTranslations } from '@/lib/translations';
import { useAuth } from '@/components/AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
}

// Mega menu video: replace with your own video path or URL
const MEGA_MENU_VIDEO_SRC = 'https://cdn.coverr.co/videos/coverr-artisan-crafting-a-hat-5053718/1080p/preview.mp4';

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslations();
  const [showSignupFireworks, setShowSignupFireworks] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [megaMenuVideoError, setMegaMenuVideoError] = useState(false);
  const megaMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  const { member, isLoading } = useAuth();
  const isMember = !!member;

  const handleSignupClick = () => {
    setShowSignupFireworks(true);
    setTimeout(() => setShowSignupFireworks(false), 2000);
    // Navigate to signup page
    window.location.href = '/signup';
  };

  const openMegaMenu = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
    setMegaMenuOpen(true);
  };

  const closeMegaMenu = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
    megaMenuTimeoutRef.current = setTimeout(() => setMegaMenuOpen(false), 200);
  };

  const cancelCloseMegaMenu = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Fireworks effect for signup button */}
      <Fireworks trigger={showSignupFireworks} duration={2000} />
      
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50 overflow-visible" style={{ backgroundColor: '#ffffff' }}>
        <nav className="max-w-7xl mx-auto pl-2 sm:pl-4 pr-4 sm:pr-6 lg:px-8 overflow-visible">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4 lg:gap-6 -ml-1">
              <Link href="/" className="flex items-center flex-shrink-0 -ml-2 mt-2.5">
                <Image
                  src="/CH Web Content/CH Logo/CH-header-logo.png"
                  alt="COCO HAWAII"
                  width={680}
                  height={120}
                  className="h-[5.5rem] md:h-[6rem] w-auto object-contain"
                  priority
                />
              </Link>
              <div className="hidden md:flex items-center gap-4 lg:gap-5 whitespace-nowrap overflow-visible">
                <Link href="/" className="text-gray-700 hover:text-black transition-colors">
                  {t('nav.home')}
                </Link>
                <Link
                  href="/home-decor"
                  className="text-gray-700 hover:text-black transition-colors inline-block py-1 leading-none"
                >
                  <span className="block text-center font-medium">Home</span>
                  <span className="block text-center text-sm font-normal -mt-0.5">Decor</span>
                </Link>
                <div
                  className="relative group"
                  ref={megaMenuRef}
                >
                  <Link
                    href="/collections"
                    className="text-gray-700 hover:text-black transition-colors inline-block py-2"
                  >
                    {t('nav.collections')}
                  </Link>
                  {/* Mega menu dropdown - CSS hover based */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto"
                  >
                    <div className="w-[min(90vw,720px)] rounded-xl overflow-hidden shadow-2xl border-2 border-purple-300 bg-white flex" style={{ minHeight: '200px' }}>
                        {/* Left: copy + buttons */}
                        <div className="flex-1 p-8 flex flex-col justify-center">
                          <p className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                            Made With Passion, Art & Love.
                          </p>
                          <p className="text-gray-600 text-sm md:text-base mb-6 max-w-md">
                            One-of-a-kind custom pieces. Wild art. Jewelry & exotic accessories. Free your spirit and glow wherever you go.
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <Link
                              href="/collections"
                              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity"
                            >
                              {t('nav.collections')}
                            </Link>
                            <Link
                              href="/create-your-hat"
                              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold text-gray-800 border-2 border-gray-800 hover:bg-gray-100 transition-colors"
                            >
                              {t('nav.createHat')}
                            </Link>
                          </div>
                        </div>
                        {/* Right: video */}
                        <div className="w-[280px] md:w-[320px] flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center min-h-[160px]">
                          {!megaMenuVideoError ? (
                            <video
                              src={MEGA_MENU_VIDEO_SRC}
                              className="w-full h-full object-cover aspect-video"
                              muted
                              loop
                              playsInline
                              autoPlay
                              preload="metadata"
                              onError={() => setMegaMenuVideoError(true)}
                            />
                          ) : (
                            <span className="text-gray-500 text-sm">Video</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                <Link
                  href="/create-your-hat"
                  className="inline-block transition-all duration-300 hover:opacity-90"
                >
                  <span
                    className="font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.4))' }}
                  >
                    {t('nav.createHat')}
                  </span>
                </Link>
                <Link href="/the-story" className="text-gray-700 hover:text-black transition-colors">
                  {t('nav.story')}
                </Link>
                <Link href="/the-runway" className="text-gray-700 hover:text-black transition-colors">
                  {t('nav.runway')}
                </Link>
                <Link href="/art-auction" className="text-gray-700 hover:text-black transition-colors">
                  {t('nav.auction')}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
              <StarsBidPacksDropdown />
              <LanguageSelector />
              {isMember ? (
                <ProfileDropdown />
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-black transition-colors">
                    {t('nav.login')}
                  </Link>
                  <button
                    onClick={handleSignupClick}
                    className="px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-size-200 bg-pos-0 hover:bg-pos-100"
                    style={{
                      backgroundSize: '200% 200%',
                      backgroundPosition: '0% 50%',
                    }}
                  >
                    {t('nav.signup')}
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-3">COCO HAWAII</h3>
              <p className="text-gray-600 mb-2">{t('footer.tagline')}</p>
              <p className="text-sm text-gray-500">{t('footer.madeWith')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">{t('footer.shop')}</h4>
              <ul className="space-y-2">
                <li><Link href="/collections" className="text-gray-600 hover:text-black transition-colors">{t('nav.collections')}</Link></li>
                <li><Link href="/home-decor" className="text-gray-600 hover:text-black transition-colors">{t('nav.homeDecor')}</Link></li>
                <li><Link href="/create-your-hat" className="text-gray-600 hover:text-black transition-colors">{t('nav.createHat')}</Link></li>
                <li><Link href="/the-story" className="text-gray-600 hover:text-black transition-colors">{t('nav.story')}</Link></li>
                <li><Link href="/the-runway" className="text-gray-600 hover:text-black transition-colors">{t('nav.runway')}</Link></li>
                <li><Link href="/art-auction" className="text-gray-600 hover:text-black transition-colors">{t('nav.auction')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">{t('footer.support')}</h4>
              <ul className="space-y-2">
                <li><Link href="/faq" className="text-gray-600 hover:text-black transition-colors">{t('footer.faq')}</Link></li>
                <li><Link href="/shipping" className="text-gray-600 hover:text-black transition-colors">{t('footer.shippingReturns')}</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-black transition-colors">{t('footer.contact')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 pt-8 border-t border-gray-200">
            <LanguageSelector />
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} COCO HAWAII. {t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
