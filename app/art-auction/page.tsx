import Link from 'next/link';
import { cookies } from 'next/headers';
import RainbowButton from '@/components/RainbowButton';
import PaintDrips from '@/components/PaintDrips';
import { getTranslationsForLocale } from '@/lib/translations/server';

export default function ArtAuctionPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('locale')?.value ?? 'en';
  const t = getTranslationsForLocale(locale);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-24 md:py-32">
        <PaintDrips variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold mb-6">
              {t('auction.artAuctionTitle')}
            </h1>
            <p className="text-xl md:text-2xl font-script text-gray-700 mb-8">
              {t('auction.exclusiveArtworks')}
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              {t('auction.discoverPieces')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/art-creation-bidding">
                <RainbowButton variant="primary">
                  {t('auction.discoverItems')}
                </RainbowButton>
              </Link>
              <Link href="/collections">
                <RainbowButton variant="secondary">
                  {t('auction.browseCollections')}
                </RainbowButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live auction & How it works */}
      <section className="relative py-20 md:py-28 bg-white overflow-hidden">
        <PaintDrips variant="featured" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🎨</div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            {t('auction.biddingIsLive')}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('auction.bidWithStarBids')}
          </p>
          <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-bold mb-4">{t('auction.howItWorks')}</h3>
            <ul className="text-left space-y-3 text-gray-700 max-w-md mx-auto">
              <li className="flex items-start">
                <span className="text-2xl mr-3">⭐</span>
                <span>{t('auction.getStarBidsBefore')}<Link href="/star-bid-packs" className="text-purple-600 hover:underline font-semibold">Star Bids</Link>{t('auction.getStarBidsAfter')}</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">🔴</span>
                <span>{t('auction.placeBidOneClick')}</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">💎</span>
                <span>{t('auction.uniqueHandDesigned')}</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">🏆</span>
                <span>{t('auction.highestBidderWins')}</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/art-creation-bidding">
              <RainbowButton variant="primary">
                {t('auction.viewLiveAuctions')}
              </RainbowButton>
            </Link>
            <Link href="/">
              <RainbowButton variant="secondary">
                {t('auction.backToHome')}
              </RainbowButton>
            </Link>
          </div>
        </div>
      </section>

      {/* View Raffles section */}
      <section className="relative py-20 md:py-28 bg-white overflow-hidden">
        <PaintDrips variant="featured" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🎟️</div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            {t('auction.viewRaffles')}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('auction.enterRaffles')}
          </p>
          <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-bold mb-4">{t('auction.howItWorks')}</h3>
            <ul className="text-left space-y-3 text-gray-700 max-w-md mx-auto">
              <li className="flex items-start">
                <span className="text-2xl mr-3">⭐</span>
                <span>{t('auction.getStarBidsRaffle')}</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">🎟️</span>
                <span>{t('auction.useStarBidsRaffle')}</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">🎁</span>
                <span>{t('auction.excitingPrizes')}</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">🍀</span>
                <span>{t('auction.winnersDrawn')}</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/raffles">
              <RainbowButton variant="primary">
                {t('auction.viewRaffles')}
              </RainbowButton>
            </Link>
            <Link href="/">
              <RainbowButton variant="secondary">
                {t('auction.backToHome')}
              </RainbowButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
