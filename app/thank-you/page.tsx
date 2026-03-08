import Link from 'next/link';
import RainbowButton from '@/components/RainbowButton';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-12">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            Thank You for Your Order!
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Your order has been received and is being processed. You will receive a confirmation email shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <RainbowButton variant="primary">
                Back to Home
              </RainbowButton>
            </Link>
            <Link href="/collections">
              <RainbowButton variant="secondary">
                Continue Shopping
              </RainbowButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
