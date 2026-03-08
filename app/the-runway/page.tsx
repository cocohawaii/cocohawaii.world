'use client';

import Link from 'next/link';
import RainbowButton from '@/components/RainbowButton';
import WixImage from '@/components/WixImage';
import { useEffect, useState, useRef } from 'react';
import { useTranslations } from '@/lib/translations';

type PastRunwayEvent = {
  id: string;
  title: string;
  subtitle?: string;
  eventDate: string;
  startTime?: string;
  itemsRevealed: boolean;
  hatIds: string[];
  status: string;
};

export default function TheRunwayPage() {
  const { t } = useTranslations();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const [pastEvents, setPastEvents] = useState<PastRunwayEvent[]>([]);
  const [hatsById, setHatsById] = useState<Record<string, { _id: string; title: string; slug?: string; mainHatImage?: string }>>({});
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / documentHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));

      sectionRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const isVisible = rect.top < windowHeight * 0.75 && rect.bottom > 0;
          if (isVisible) {
            setVisibleSections(prev => new Set(prev).add(index));
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/runway/events?status=past').then((r) => r.json()),
      fetch('/api/hats').then((r) => r.json()),
    ]).then(([eventsRes, hatsRes]) => {
      const events = eventsRes.success ? (eventsRes.events || []).filter((e: PastRunwayEvent) => e.itemsRevealed && (e.hatIds?.length ?? 0) > 0) : [];
      setPastEvents(events);
      const hats = hatsRes.success ? hatsRes.hats || [] : [];
      const byId: Record<string, { _id: string; title: string; slug?: string; mainHatImage?: string }> = {};
      hats.forEach((h: { _id: string; title: string; slug?: string; mainHatImage?: string }) => {
        byId[h._id] = h;
      });
      setHatsById(byId);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white relative">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transition-all duration-300 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-purple-900 to-pink-900 py-32 text-white">
        <div className="absolute inset-0 bg-black/40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="text-8xl mb-6 transform hover:scale-110 transition-transform duration-500 inline-block">✨</div>
            <h1 className="text-7xl md:text-8xl font-serif font-bold mb-6 bg-gradient-to-r from-white via-pink-200 to-orange-200 bg-clip-text text-transparent animate-gradient-shift">
              {t('runway.title')}
            </h1>
            <p className="text-3xl font-script text-pink-200 max-w-3xl mx-auto mb-8 animate-slide-up">
              {t('runway.subtitle')}
            </p>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
              {t('runway.heroSubtext')}
            </p>
            <Link href="/runway-guest-list">
              <RainbowButton variant="primary">
                {t('runway.joinGuestList')}
              </RainbowButton>
            </Link>
            {/* Floating decorative elements */}
            <div className="absolute top-20 left-10 w-24 h-24 bg-purple-500/20 rounded-full opacity-30 animate-float" style={{ animationDelay: '0s' }} />
            <div className="absolute top-40 right-20 w-20 h-20 bg-pink-500/20 rounded-full opacity-30 animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-orange-500/20 rounded-full opacity-30 animate-float" style={{ animationDelay: '2s' }} />
          </div>
        </div>
      </section>

      {/* Section 1: Art Meets Fashion */}
      <section 
        ref={el => { sectionRefs.current[0] = el; }}
        className={`py-20 bg-white transition-all duration-1000 ${
          visibleSections.has(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 delay-200 ${
              visibleSections.has(0) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="text-6xl mb-6 transform hover:scale-110 transition-transform duration-500 inline-block">🎨</div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-gray-900">
                {t('runway.artMeetsFashion')}
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed mb-4 font-semibold">
                {t('runway.twoWorlds')}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                {t('runway.section1P1')}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t('runway.section1P2')}
              </p>
            </div>
            <div className={`transition-all duration-1000 delay-300 ${
              visibleSections.has(0) ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-95'
            }`}>
              <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 flex items-center justify-center group hover:shadow-3xl transition-all duration-500 hover:scale-105">
                <div className="text-center p-8">
                  <div className="text-8xl mb-4 transform group-hover:scale-110 transition-transform duration-500">👗</div>
                  <p className="text-xl font-script text-gray-700 group-hover:text-gray-900 transition-colors">{t('runway.artInMotion')}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-pink-400/0 to-orange-400/0 group-hover:from-purple-400/20 group-hover:via-pink-400/20 group-hover:to-orange-400/20 transition-all duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: The Models */}
      <section 
        ref={el => { sectionRefs.current[1] = el; }}
        className={`py-20 bg-gradient-to-br from-gray-50 to-purple-50 transition-all duration-1000 ${
          visibleSections.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-6xl mb-6 transform hover:scale-110 transition-transform duration-500 inline-block">👠</div>
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-gray-900">
              {t('runway.theModels')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('runway.modelsSubtext')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 shadow-lg transition-all duration-700 delay-300 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="text-5xl mb-4 text-center transform hover:scale-110 transition-transform duration-500">💃</div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">{t('runway.confidence')}</h3>
              <p className="text-gray-700 leading-relaxed text-center">
                {t('runway.confidenceText')}
              </p>
            </div>
            <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 shadow-lg transition-all duration-700 delay-400 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="text-5xl mb-4 text-center transform hover:scale-110 transition-transform duration-500">🌟</div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">{t('runway.elegance')}</h3>
              <p className="text-gray-700 leading-relaxed text-center">
                {t('runway.eleganceText')}
              </p>
            </div>
            <div className={`bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-8 shadow-lg transition-all duration-700 delay-500 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="text-5xl mb-4 text-center transform hover:scale-110 transition-transform duration-500">🔥</div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">{t('runway.presence')}</h3>
              <p className="text-gray-700 leading-relaxed text-center">
                {t('runway.presenceText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: The Runway Show */}
      <section 
        ref={el => { sectionRefs.current[2] = el; }}
        className={`py-20 bg-white transition-all duration-1000 ${
          visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 delay-200 ${
              visibleSections.has(2) ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-10 scale-95'
            }`}>
              <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-amber-200 via-orange-200 to-red-200 flex items-center justify-center group hover:shadow-3xl transition-all duration-500 hover:scale-105">
                <div className="text-center p-8">
                  <div className="text-8xl mb-4 transform group-hover:scale-110 transition-transform duration-500">🎭</div>
                  <p className="text-xl font-script text-gray-700 group-hover:text-gray-900 transition-colors">{t('runway.thePerformance')}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 via-orange-400/0 to-red-400/0 group-hover:from-amber-400/20 group-hover:via-orange-400/20 group-hover:to-red-400/20 transition-all duration-500" />
              </div>
            </div>
            <div className={`transition-all duration-1000 delay-300 ${
              visibleSections.has(2) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}>
              <div className="text-6xl mb-6 transform hover:scale-110 transition-transform duration-500 inline-block">🎪</div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-gray-900">
                {t('runway.theRunwayShow')}
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed mb-4 font-semibold">
                {t('runway.moreThanShow')}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                {t('runway.runwayShowP1')}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                {t('runway.runwayShowP2')}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t('runway.runwayShowP3')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: The Experience */}
      <section 
        ref={el => { sectionRefs.current[3] = el; }}
        className={`py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 transition-all duration-1000 ${
          visibleSections.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-6xl mb-6 transform hover:scale-110 transition-transform duration-500 inline-block">🎬</div>
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-gray-900">
              {t('runway.experienceTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              {t('runway.experienceSubtext')}
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-8">
            <div className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-10 shadow-xl transition-all duration-700 delay-300 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <h3 className="text-3xl font-bold mb-4 text-gray-900 flex items-center gap-3">
                <span className="text-4xl transform hover:scale-110 transition-transform duration-500">🎯</span>
                {t('runway.witnessFusion')}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('runway.witnessFusionText')}
              </p>
            </div>

            <div className={`bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-10 shadow-xl transition-all duration-700 delay-400 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <h3 className="text-3xl font-bold mb-4 text-gray-900 flex items-center gap-3">
                <span className="text-4xl transform hover:scale-110 transition-transform duration-500">💫</span>
                {t('runway.feelTheEnergy')}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('runway.feelTheEnergyText')}
              </p>
            </div>

            <div className={`bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-10 shadow-xl transition-all duration-700 delay-500 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <h3 className="text-3xl font-bold mb-4 text-gray-900 flex items-center gap-3">
                <span className="text-4xl transform hover:scale-110 transition-transform duration-500">🌍</span>
                {t('runway.bePartOfStory')}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('runway.bePartOfStoryText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Previous Runways - Items revealed after event */}
      {pastEvents.length > 0 && (
        <section
          ref={el => { sectionRefs.current[4] = el; }}
          className="py-20 bg-white border-t border-gray-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="text-6xl mb-6 transform hover:scale-110 transition-transform duration-500 inline-block">📸</div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-gray-900">
                Previous Runways
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
                Hats from past runway events
              </p>
              <Link
                href="/runway-collection"
                className="inline-block text-purple-600 hover:text-purple-800 font-semibold underline"
              >
                Browse Runway Collection →
              </Link>
            </div>
            <div className="space-y-12">
              {pastEvents.map((ev) => {
                const dateStr = new Date(ev.eventDate + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                const revealedHats = (ev.hatIds || [])
                  .map((id) => hatsById[id])
                  .filter(Boolean);
                return (
                  <div
                    key={ev.id}
                    className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl p-8 border-2 border-purple-100"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{ev.title}</h3>
                    {ev.subtitle && <p className="text-gray-600 mb-2">{ev.subtitle}</p>}
                    <p className="text-sm text-gray-500 mb-6">{dateStr}</p>
                    <div className="flex flex-wrap gap-4">
                      {revealedHats.map((hat) => (
                        <Link
                          key={hat._id}
                          href={`/hats/${hat.slug || hat._id}`}
                          className="group flex flex-col items-center w-28 sm:w-36"
                        >
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white border-2 border-gray-200 group-hover:border-purple-400 transition-colors">
                            {hat.mainHatImage ? (
                              <WixImage
                                src={hat.mainHatImage}
                                alt={hat.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">🎩</div>
                            )}
                          </div>
                          <span className="mt-2 text-sm font-medium text-gray-700 text-center line-clamp-2 group-hover:text-purple-600">
                            {hat.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section 
        ref={el => { sectionRefs.current[pastEvents.length > 0 ? 5 : 4] = el; }}
        className={`py-20 bg-gradient-to-br from-black via-purple-900 to-pink-900 text-white transition-all duration-1000 ${
          visibleSections.has(4) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 animate-pulse-slow">
            {t('runway.ctaTitle')}
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            {t('runway.ctaSubtext')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link href="/runway-guest-list">
              <RainbowButton variant="primary">
                {t('runway.joinGuestList')}
              </RainbowButton>
            </Link>
            <Link href="/runway-collection">
              <RainbowButton variant="secondary">
                Runway Collection
              </RainbowButton>
            </Link>
            <Link href="/collections">
              <RainbowButton variant="secondary">
                {t('common.exploreCollection')}
              </RainbowButton>
            </Link>
            <Link href="/create-your-hat">
              <RainbowButton variant="secondary">
                {t('common.createYourHat')}
              </RainbowButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
