'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRunwayBackoffice from '@/components/AdminRunwayBackoffice';
import { useAuth } from '@/components/AuthProvider';

export default function RunwayAdminPage() {
  const { member, isLoading } = useAuth();
  const router = useRouter();
  const [hats, setHats] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !member) {
      router.push('/login');
      return;
    }
    const roleStr = (member?.role ?? '').toLowerCase();
    if (!isLoading && member && !roleStr.includes('admin')) {
      router.push('/member/dashboard');
    }
  }, [member, isLoading, router]);

  useEffect(() => {
    fetch('/api/hats?rawVideoUrls=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.hats)) setHats(d.hats);
      });
  }, []);

  if (isLoading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const roleStr = (member?.role ?? '').toLowerCase();
  if (!roleStr.includes('admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/member/admin" className="text-purple-600 hover:text-purple-800 font-medium mb-4 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Runway Backoffice</h1>
          <p className="text-gray-600 mt-1">Manage events, tickets, attendance & revealed items</p>
        </div>
        <AdminRunwayBackoffice hats={hats} />
      </div>
    </div>
  );
}
