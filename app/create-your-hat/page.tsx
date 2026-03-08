import { Suspense } from 'react';
import HatCustomizer from '@/components/HatCustomizer';

export default function CreateYourHatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    }>
      <HatCustomizer />
    </Suspense>
  );
}
