import Link from 'next/link';
import { cookies } from 'next/headers';
import RainbowButton from '@/components/RainbowButton';
import HelpTicketSection from '@/components/HelpTicketSection';
import { getTranslationsForLocale } from '@/lib/translations/server';

export const metadata = {
  title: 'Contact Us | COCO HAWAII',
  description: 'Get in touch with COCO HAWAII. Questions about our hand-designed hats? We\'d love to hear from you.',
};

export default function ContactPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('locale')?.value ?? 'en';
  const t = getTranslationsForLocale(locale);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-6xl mb-6">💌</div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              {t('contact.title')}
            </h1>
            <p className="text-xl font-script text-gray-700 max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-2 border-purple-100">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📧</span> {t('contact.emailUs')}
                </h2>
                <p className="text-gray-700 mb-2">
                  {t('contact.emailText')}
                </p>
                <a
                  href="mailto:hello@cocohawaii.com"
                  className="text-purple-600 hover:text-purple-700 font-semibold text-lg"
                >
                  hello@cocohawaii.com
                </a>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🎩</span> {t('contact.customHatOrders')}
                </h2>
                <p className="text-gray-700 mb-4">
                  {t('contact.customHatText')}
                </p>
                <Link href="/create-your-hat">
                  <RainbowButton variant="primary">{t('common.createYourHat')}</RainbowButton>
                </Link>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🛍️</span> {t('contact.browseCollections')}
                </h2>
                <p className="text-gray-700 mb-4">
                  {t('contact.browseText')}
                </p>
                <Link href="/collections">
                  <RainbowButton variant="secondary">{t('common.viewCollections')}</RainbowButton>
                </Link>
              </div>

              <HelpTicketSection
                title={t('contact.helpTicket')}
                text={t('contact.helpTicketText')}
                loginPrompt={t('contact.helpTicketLoginPrompt')}
                loginSubtext={t('contact.helpTicketLoginSubtext')}
                orAnonymous={t('contact.helpTicketOrAnonymous')}
                emailLabel={t('contact.helpTicketEmail')}
                nameLabel={t('contact.helpTicketName')}
                subjectLabel={t('contact.helpTicketSubject')}
                messageLabel={t('contact.helpTicketMessage')}
                submitLabel={t('contact.helpTicketSubmit')}
                successMessage={t('contact.helpTicketSuccess')}
                successLoggedInMessage={t('contact.helpTicketSuccessLoggedIn')}
              />
            </div>
          </div>

          <p className="text-center text-gray-500 mt-8">
            {t('contact.responseTime')}
          </p>
        </div>
      </section>
    </div>
  );
}
