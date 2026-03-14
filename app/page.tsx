import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import WixImage from '@/components/WixImage';
import { getCollectionsFromSupabase, getHatsFromSupabase } from '@/lib/supabase-hats';
import { convertWixVideoUrl } from '@/lib/wix-utils';
import { getPageVideoUrlByTag } from '@/lib/page-videos';
import RainbowButton from '@/components/RainbowButton';
import PaintDrips from '@/components/PaintDrips';
import HomepageVideo from '@/components/HomepageVideo';
import { getTranslationsForLocale } from '@/lib/translations/server';

const EyesVideoScrollRow = dynamic(
  () => import('@/components/EyesVideoScrollRow'),
  { ssr: false }
);

export default async function HomePage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('locale')?.value ?? 'en';
  const t = getTranslationsForLocale(locale);

  const collections = await getCollectionsFromSupabase();
  const allHats = await getHatsFromSupabase(undefined, { activeOnly: true, sortBy: 'display_order' });
  const featuredHats = allHats.filter((h) => h.isActive === true);
  const featuredHatsSlice = featuredHats.slice(0, 6);
  const eyesRowItems = featuredHats
    .filter((h) => h.topVideoEyes)
    .slice(0, 7)
    .map((h) => ({
      videoUrl: convertWixVideoUrl(h.topVideoEyes) || h.topVideoEyes!,
      title: h.title || '',
      slug: h.slug || h._id,
    }));
  
  // Fetch homepage videos from Supabase page_videos
  let homepageVideoUrl: string | null = null;
  let makingOfVideoUrl: string | null = null;
  try {
    [homepageVideoUrl, makingOfVideoUrl] = await Promise.all([
      getPageVideoUrlByTag('Homepage'),
      getPageVideoUrlByTag('Homepage MakingOf'),
    ]);
  } catch (error: any) {
    console.error('❌ Homepage: Error fetching videos:', error?.message);
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-8 md:pt-12 pb-20 md:pb-28">
        <PaintDrips variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-[1.35fr_0.65fr] gap-12 md:gap-16 items-center">
            <div className="relative order-2 md:order-1 flex justify-center z-0">
              {/* White blurred area around video — strong full-white blurred outer shadow */}
              <div className="w-full max-w-[calc(100%+5rem)] md:max-w-[calc(100%+6rem)] -m-4 md:-m-6 rounded-3xl p-3 md:p-6 bg-white/95 backdrop-blur-2xl shadow-[0_0_60px_30px_rgba(255,255,255,0.95),0_0_120px_60px_rgba(255,255,255,0.8),0_0_180px_90px_rgba(255,255,255,0.5)]">
                <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                {homepageVideoUrl ? (
                  <HomepageVideo
                    src={homepageVideoUrl}
                    className="w-full h-full object-cover"
                    style={{ minHeight: '100%', minWidth: '100%' }}
                  />
                ) : featuredHatsSlice[0]?.topVideoEyes ? (
                  <video
                    src={featuredHatsSlice[0].topVideoEyes}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ minHeight: '100%', minWidth: '100%' }}
                  />
                ) : featuredHatsSlice[0]?.mainHatImage ? (
                  <div className="relative w-full h-full">
                    <WixImage
                      src={featuredHatsSlice[0].mainHatImage}
                      alt={featuredHatsSlice[0].title || t('common.featuredHat')}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                    <p className="text-gray-500">{t('common.videoComingSoon')}</p>
                  </div>
                )}
                </div>
              </div>
            </div>

            <div className="relative z-10 text-center order-1 md:order-2">
              <div className="mb-6">
                <div className="flex justify-center mt-0 -mb-20 md:-mb-18">
                  <Image
                    src="/CH Web Content/CH Logo/CH-PalmTree-Logo-Black.png"
                    alt=""
                    width={200}
                    height={200}
                    className="w-20 md:w-28 lg:w-32 h-auto object-contain"
                    priority
                  />
                </div>
                <div className="flex justify-center -mb-5 -mt-20 md:-mt-22">
                  <Image
                    src="/CH Web Content/CH Logo/CH-header-logo.png"
                    alt="COCO HAWAII"
                    width={560}
                    height={140}
                    className="w-full max-w-[440px] md:max-w-[500px] lg:max-w-[560px] h-auto object-contain"
                    priority
                  />
                </div>
                <div className="-mt-16 md:-mt-20">
                  <p className="text-3xl md:text-4xl font-script text-gray-700 mt-0">
                    {t('home.heroTagline')}
                  </p>
                </div>
              </div>

              <p className="text-lg md:text-xl font-semibold text-gray-800 mb-3 -mt-2 md:-mt-3">
                {t('home.madeWith')}
                {t('home.gradientPart1') ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600">{t('home.gradientPart1')}</span> : null}
                {t('home.madeWithMiddle')}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600">{t('home.passionArtLove')}</span>
              </p>

              <p className="mx-auto max-w-lg text-center text-gray-700 mb-6 leading-relaxed">
                {t('home.heroSubtext')}
              </p>

              <p className="text-xl md:text-2xl font-script text-gray-800 mb-8">
                {t('common.finesseSavage')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/collections">
                  <RainbowButton variant="primary">{t('common.discoverCollections')}</RainbowButton>
                </Link>
                <Link href="/create-your-hat">
                  <RainbowButton variant="secondary">{t('common.createYourHat')}</RainbowButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Pillars — short, punchy */}
      <section className="relative py-16 md:py-24 bg-white border-y border-gray-100 overflow-hidden">
        <PaintDrips variant="pillars" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            <div className="text-center">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-bold text-gray-900 mb-2">{t('home.pillar1Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t('home.pillar1Text')}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">👑</div>
              <h3 className="font-bold text-gray-900 mb-2">{t('home.pillar2Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t('home.pillar2Text')}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎩</div>
              <h3 className="font-bold text-gray-900 mb-2">{t('home.pillar3Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t('home.pillar3Text')}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="font-bold text-gray-900 mb-2">{t('home.pillar4Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t('home.pillar4Text')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      {collections.length > 0 && (
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          <PaintDrips variant="collections" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-3">{t('home.collectionsTitle')}</h2>
              <p className="text-xl font-script text-gray-600 max-w-2xl mx-auto">
                {t('home.collectionsSubtext')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {collections.map((collection) => (
                <Link
                  key={collection._id}
                  href={`/collections/${collection._id}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ring-1 ring-gray-100 hover:ring-purple-200">
                    {collection.image && (
                      <div className="relative h-80 md:h-96 w-full overflow-hidden">
                        <WixImage
                          src={collection.image}
                          alt={collection.name}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-2xl font-script text-gray-800 mb-2 group-hover:text-purple-700 transition-colors">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-gray-600 text-sm">{collection.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/collections">
                <RainbowButton variant="primary">{t('common.viewAllCollections')}</RainbowButton>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Hats */}
      {featuredHatsSlice.length > 0 && (
        <section className="relative py-20 md:py-28 bg-white overflow-hidden">
          <PaintDrips variant="featured" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-3">{t('home.featuredTitle')}</h2>
              <p className="text-xl font-script text-gray-600 max-w-2xl mx-auto">
                {t('home.featuredSubtext')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featuredHatsSlice.map((hat) => (
                <Link
                  key={hat._id}
                  href={`/hats/${hat.slug || hat._id}`}
                  className="group"
                >
                  <div className="bg-gray-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ring-1 ring-gray-100 hover:ring-purple-200">
                    {hat.mainHatImage && (
                      <div className="relative h-80 md:h-96 w-full overflow-hidden">
                        <WixImage
                          src={hat.mainHatImage}
                          alt={hat.title}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-script text-gray-800 mb-2 group-hover:text-purple-700 transition-colors">
                        {hat.title}
                      </h3>
                      {hat.hatSubtitle && (
                        <p className="text-gray-600 text-sm mb-2">{hat.hatSubtitle}</p>
                      )}
                      <p className="text-2xl font-bold text-gray-900">
                        {hat.discountedPrice && hat.discountedPrice !== 0
                          ? `€${hat.discountedPrice}`
                          : `€${hat.price}`}
                      </p>
                      {hat.discountedPrice && hat.discountedPrice !== 0 && (
                        <p className="text-sm text-gray-500 line-through">€{hat.price}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/collections">
                <RainbowButton variant="primary">{t('common.viewAllHats')}</RainbowButton>
              </Link>
            </div>
            {eyesRowItems.length > 0 && (
              <EyesVideoScrollRow items={eyesRowItems} />
            )}
          </div>
        </section>
      )}

      {/* MakingOf — inverted hero: text left, video right (iPhone-style) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16 md:py-24">
        <PaintDrips variant="cta" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
            {/* Text block — left column: center-aligned, pushed right via padding */}
            <div className="relative z-10 order-1 text-center md:pl-8 md:pr-4">
              <div className="mb-6">
                <div className="flex justify-center mt-0 -mb-20 md:-mb-18">
                  <Image
                    src="/CH Web Content/CH Logo/CH-PalmTree-Logo-Black.png"
                    alt=""
                    width={200}
                    height={200}
                    className="w-20 md:w-28 lg:w-32 h-auto object-contain"
                  />
                </div>
                <div className="flex justify-center -mb-5 -mt-20 md:-mt-22">
                  <Image
                    src="/CH Web Content/CH Logo/CH-header-logo.png"
                    alt="COCO HAWAII"
                    width={600}
                    height={150}
                    className="w-full max-w-[460px] md:max-w-[520px] lg:max-w-[600px] h-auto object-contain mx-auto"
                  />
                </div>
                <div className="-mt-20 md:-mt-24">
                  <p className="text-3xl md:text-4xl font-script text-gray-700 mt-0">
                    {t('home.makingOfTitleBefore')}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600">{t('home.makingOfTitleRainbow')}</span>
                  </p>
                </div>
              </div>
              <p className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                {t('home.makingOfSubtitleBefore')}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600">{t('home.makingOfSubtitleRainbow')}</span>
                {t('home.makingOfSubtitleAfter')}
              </p>
              <p className="text-gray-700 mb-8 max-w-lg mx-auto leading-relaxed">
                {t('home.makingOfDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/collections">
                  <RainbowButton variant="primary">{t('common.discoverCollections')}</RainbowButton>
                </Link>
                <Link href="/create-your-hat">
                  <RainbowButton variant="secondary">{t('common.createYourHat')}</RainbowButton>
                </Link>
              </div>
            </div>

            {/* Video — right, iPhone-style; full white borders/edges, no black or corner borders */}
            <div className="relative order-2 flex justify-center md:justify-start md:ml-3">
              <div
                className="w-full max-w-[272px] sm:max-w-[296px] md:max-w-[320px] rounded-[2rem] overflow-hidden p-4 md:p-6 bg-white"
                style={{
                  boxShadow: '0 0 60px 30px rgba(255,255,255,0.98), 0 0 120px 60px rgba(255,255,255,0.9), 0 0 180px 90px rgba(255,255,255,0.7)',
                }}
              >
                <div className="relative w-full overflow-hidden bg-white rounded-xl" style={{ aspectRatio: '9/16' }}>
                  {makingOfVideoUrl ? (
                    <HomepageVideo
                      src={makingOfVideoUrl}
                      className="w-full h-full object-cover"
                      style={{ minHeight: '100%', minWidth: '100%' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex flex-col items-center justify-center p-4">
                      <p className="text-gray-600 font-semibold mb-1">Making Of</p>
                      <p className="text-gray-500 text-sm text-center">
                        Add a PageVideo with tag &quot;Homepage MakingOf&quot; in your CMS.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual CTA — Custom Hat + Browse */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-hidden">
        <PaintDrips variant="cta" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3">{t('home.yourNextMove')}</h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              {t('home.yourNextMoveSubtext')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Link
              href="/create-your-hat"
              className="group block bg-white rounded-2xl p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-300 ring-2 ring-purple-100 hover:ring-purple-300"
            >
              <div className="text-5xl mb-4">🎩</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('home.customHatCardTitle')}</h3>
              <p className="text-gray-600 mb-6">
                {t('home.customHatCardText')}
              </p>
              <span className="inline-flex items-center font-semibold text-purple-600 group-hover:text-purple-700">
                {t('home.customHatCardLink')}
              </span>
            </Link>

            <Link
              href="/collections"
              className="group block bg-white rounded-2xl p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-300 ring-2 ring-pink-100 hover:ring-pink-300"
            >
              <div className="text-5xl mb-4">🛍️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('home.browseCardTitle')}</h3>
              <p className="text-gray-600 mb-6">
                {t('home.browseCardText')}
              </p>
              <span className="inline-flex items-center font-semibold text-pink-600 group-hover:text-pink-700">
                {t('home.browseCardLink')}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Runway Teaser */}
      <section className="relative py-16 md:py-20 bg-black text-white overflow-hidden">
        <PaintDrips variant="runway" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t('home.runwayTeaserTitle')}</h2>
          <p className="text-xl text-gray-300 mb-8">
            {t('home.runwayTeaserText')}
          </p>
          <Link href="/the-runway">
            <RainbowButton variant="primary">{t('common.experienceRunway')}</RainbowButton>
          </Link>
        </div>
      </section>

      {/* Closing Statement */}
      <section className="relative py-16 md:py-20 bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 overflow-hidden">
        <PaintDrips variant="closing" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-2xl md:text-3xl font-script text-gray-800 mb-4">
            {t('home.closingStatement')}
          </p>
          <p className="text-gray-700 font-medium">
            {t('home.closingMadeWith')}
          </p>
        </div>
      </section>
    </div>
  );
}
