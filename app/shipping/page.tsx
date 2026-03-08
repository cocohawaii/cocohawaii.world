import Link from 'next/link';
import RainbowButton from '@/components/RainbowButton';

export const metadata = {
  title: 'Shipping & Returns | COCO HAWAII',
  description: 'Shipping, delivery, and returns information for COCO HAWAII hand-designed hats.',
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-6xl mb-6">📦</div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Shipping & Returns
            </h1>
            <p className="text-xl font-script text-gray-700 max-w-2xl mx-auto">
              How we get your hand-designed hats to you—safely and with care.
            </p>
          </div>

          <div className="space-y-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border-2 border-purple-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🚚</span> Shipping
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                We ship worldwide. Each hat is packaged with care to arrive in perfect condition.
                Standard shipping typically takes 5–10 business days (EU) and 10–15 business days (international).
                Express options may be available at checkout.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You&apos;ll receive tracking information once your order ships. Log in to your member dashboard
                to view order status and tracking details.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border-2 border-purple-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>↩️</span> Returns & Exchanges
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Due to the custom, hand-designed nature of our hats, we handle returns on a case-by-case basis.
                If you receive a hat that doesn&apos;t match your order or arrives damaged, please contact us
                within 14 days of delivery.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Email us at <a href="mailto:hello@cocohawaii.com" className="text-purple-600 hover:underline font-semibold">hello@cocohawaii.com</a> with
                your order ID and a brief description. We&apos;ll work with you to make it right.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border-2 border-purple-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🎩</span> Custom Orders
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Custom-designed hats are made to your specifications. Production time varies; we&apos;ll
                keep you updated on your order progress. Custom orders may have different return policies—
                we&apos;ll confirm before you complete your purchase.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <RainbowButton variant="primary">Contact Us</RainbowButton>
            </Link>
            <Link href="/collections">
              <RainbowButton variant="secondary">Shop Hats</RainbowButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
