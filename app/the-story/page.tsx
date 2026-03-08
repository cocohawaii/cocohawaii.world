'use client';

import Link from 'next/link';
import RainbowButton from '@/components/RainbowButton';
import { useEffect, useState, useRef } from 'react';
import { useTranslations } from '@/lib/translations';

export default function TheStoryPage() {
  const { t } = useTranslations();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / documentHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));

      // Check which sections are visible
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
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
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
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-serif font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent animate-gradient-shift">
              {t('story.title')}
            </h1>
            <p className="text-2xl font-script text-gray-700 max-w-3xl mx-auto animate-slide-up">
              {t('story.subtitle')}
            </p>
            {/* Floating decorative elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-purple-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '0s' }} />
            <div className="absolute top-40 right-20 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-orange-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }} />
          </div>
        </div>
      </section>

      {/* Section 1: Hand-Designed Hats by Valeria Velasquez */}
      <section 
        ref={el => { sectionRefs.current[0] = el; }}
        className={`py-20 bg-white transition-all duration-1000 ${
          visibleSections.has(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`order-2 md:order-1 transition-all duration-1000 delay-200 ${
              visibleSections.has(0) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="text-6xl mb-6">🎨</div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-gray-900">
                {t('story.section1Title')}
              </h2>
              <h3 className="text-2xl font-script text-pink-600 mb-4">
                {t('story.section1By')}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {t('story.section1P1')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {t('story.section1P2')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('story.section1P3')}
              </p>
            </div>
            <div className={`order-1 md:order-2 transition-all duration-1000 delay-300 ${
              visibleSections.has(0) ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-95'
            }`}>
              <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 flex items-center justify-center group hover:shadow-3xl transition-all duration-500 hover:scale-105">
                <div className="text-center p-8">
                  <div className="text-8xl mb-4 transform group-hover:scale-110 transition-transform duration-500">👒</div>
                  <p className="text-xl font-script text-gray-700 group-hover:text-gray-900 transition-colors">{t('story.handCraftedExcellence')}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-pink-400/0 to-orange-400/0 group-hover:from-purple-400/20 group-hover:via-pink-400/20 group-hover:to-orange-400/20 transition-all duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 100+ Years of Hat Manufacturing Legacy */}
      <section 
        ref={el => { sectionRefs.current[1] = el; }}
        className={`py-20 bg-gradient-to-br from-gray-50 to-purple-50 transition-all duration-1000 ${
          visibleSections.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 delay-200 ${
              visibleSections.has(1) ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-10 scale-95'
            }`}>
              <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-amber-200 via-orange-200 to-red-200 flex items-center justify-center group hover:shadow-3xl transition-all duration-500 hover:scale-105">
                <div className="text-center p-8">
                  <div className="text-8xl mb-4 transform group-hover:scale-110 transition-transform duration-500">🏛️</div>
                  <p className="text-xl font-script text-gray-700 group-hover:text-gray-900 transition-colors">{t('story.centuryCraftsmanship')}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 via-orange-400/0 to-red-400/0 group-hover:from-amber-400/20 group-hover:via-orange-400/20 group-hover:to-red-400/20 transition-all duration-500" />
              </div>
            </div>
            <div className={`transition-all duration-1000 delay-300 ${
              visibleSections.has(1) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}>
              <div className="text-6xl mb-6">🏛️</div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-gray-900">
                {t('story.section2Title')}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {t('story.section2P1')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {t('story.section2P2')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('story.section2P3')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Art to Make You Bloom in Bliss */}
      <section 
        ref={el => { sectionRefs.current[2] = el; }}
        className={`py-20 bg-white transition-all duration-1000 ${
          visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 delay-200 ${
            visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}>
            <div className="text-6xl mb-6 transform hover:scale-110 transition-transform duration-500 inline-block">🌸</div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-gray-900">
              {t('story.section3Title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('story.section3Subtext')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 shadow-lg transition-all duration-700 delay-300 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="text-5xl mb-4 text-center">🌈</div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">{t('story.vibrantExpression')}</h3>
              <p className="text-gray-700 leading-relaxed text-center">
                {t('story.vibrantText')}
              </p>
            </div>
            <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 shadow-lg transition-all duration-700 delay-400 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="text-5xl mb-4 text-center transform hover:scale-110 transition-transform duration-500">✨</div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">{t('story.soulfulDesign')}</h3>
              <p className="text-gray-700 leading-relaxed text-center">
                {t('story.soulfulText')}
              </p>
            </div>
            <div className={`bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-8 shadow-lg transition-all duration-700 delay-500 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="text-5xl mb-4 text-center">🌺</div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">{t('story.blissfulBloom')}</h3>
              <p className="text-gray-700 leading-relaxed text-center">
                {t('story.blissfulText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Fashion, Style & Empowerment */}
      <section 
        ref={el => { sectionRefs.current[3] = el; }}
        className={`py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 transition-all duration-1000 ${
          visibleSections.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 delay-200 ${
              visibleSections.has(3) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="text-6xl mb-6 transform hover:scale-110 transition-transform duration-500 inline-block">👑</div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-gray-900">
                {t('story.section4Title')}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {t('story.section4P1')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {t('story.section4P2')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('story.section4P3')}
              </p>
            </div>
            <div className={`transition-all duration-1000 delay-300 ${
              visibleSections.has(3) ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-95'
            }`}>
              <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 flex items-center justify-center group hover:shadow-3xl transition-all duration-500 hover:scale-105">
                <div className="text-center p-8">
                  <div className="text-8xl mb-4 transform group-hover:scale-110 transition-transform duration-500">💎</div>
                  <p className="text-xl font-script text-gray-700 group-hover:text-gray-900 transition-colors">{t('story.yourStyleYourPower')}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-pink-400/0 to-orange-400/0 group-hover:from-purple-400/20 group-hover:via-pink-400/20 group-hover:to-orange-400/20 transition-all duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Vision, Mission & Bigger Purpose */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-6xl mb-6">🌟</div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-gray-900">
              {t('story.section5Title')}
            </h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-10 shadow-xl">
              <h3 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                <span className="text-4xl">🎯</span>
                {t('story.ourVision')}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('story.visionText')}
              </p>
            </div>

            <div className={`bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-10 shadow-xl transition-all duration-700 delay-400 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(4) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <h3 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                <span className="text-4xl transform hover:scale-110 transition-transform duration-500">💫</span>
                {t('story.ourMission')}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {t('story.missionText')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('story.missionText2')}
              </p>
            </div>

            <div className={`bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-10 shadow-xl transition-all duration-700 delay-500 hover:shadow-2xl hover:scale-105 ${
              visibleSections.has(4) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <h3 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                <span className="text-4xl transform hover:scale-110 transition-transform duration-500">🌍</span>
                {t('story.biggerPurpose')}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {t('story.purposeText')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {t('story.purposeText2')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('story.purposeText3')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section 
        ref={el => { sectionRefs.current[5] = el; }}
        className={`py-20 bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 transition-all duration-1000 ${
          visibleSections.has(5) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-gray-900 animate-pulse-slow">
            {t('story.readyToWrite')}
          </h2>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            {t('story.readySubtext')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/collections">
              <RainbowButton variant="primary">
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
