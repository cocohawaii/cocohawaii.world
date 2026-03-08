'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip tracking for admin pages and API routes
    if (pathname?.startsWith('/api') || pathname?.startsWith('/member/admin')) {
      return;
    }

    // Generate or get visitor ID
    const getVisitorId = () => {
      if (typeof window === 'undefined') return null;
      
      let visitorId = localStorage.getItem('visitorId');
      if (!visitorId) {
        // Generate a unique ID
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('visitorId', visitorId);
      }
      return visitorId;
    };

    const trackPageView = async () => {
      const visitorId = getVisitorId();
      if (!visitorId || !pathname) return;

      try {
        await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: pathname,
            visitorId,
          }),
        });
      } catch (error) {
        // Silently fail - analytics shouldn't break the site
        console.error('Failed to track page view:', error);
      }
    };

    // Track page view after a short delay to ensure page is loaded
    const timeoutId = setTimeout(trackPageView, 1000);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null; // This component doesn't render anything
}
