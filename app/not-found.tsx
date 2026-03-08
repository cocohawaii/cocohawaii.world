import Link from 'next/link';
import RainbowButton from '@/components/RainbowButton';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-3xl font-serif mb-4">Page Not Found</h2>
        <p className="text-xl text-gray-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link href="/">
          <RainbowButton variant="primary">
            Back to Home
          </RainbowButton>
        </Link>
      </div>
    </div>
  );
}
