'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PRConfirmationPopup from '@/components/PRConfirmationPopup';
import { useAuth } from '@/components/AuthProvider';

export default function MemberDashboard() {
  const { member, isLoading, hasSession, refetch } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPRPopup, setShowPRPopup] = useState(false);

  const handleBecomePR = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'pr' }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await refetch();
        window.dispatchEvent(new CustomEvent('memberTagUpdate', { detail: { isNew: true } }));
        setShowPRPopup(true);
      } else {
        alert(data.error || 'Failed to update PR status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating PR status:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}.`);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !member && !hasSession) {
      window.location.href = '/login';
    }
  }, [member, isLoading, hasSession]);

  if (isLoading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="text-gray-600 hover:text-black transition-colors mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {member.memberName || member.fullName}!</h1>
          <p className="text-lg text-gray-600">Your member dashboard</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Link
            href="/member/custom-orders"
            className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Hat Orders</h3>
            <p className="text-gray-600">View your personalized hat orders</p>
          </Link>

          <Link
            href="/member/collection-orders"
            className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-4">🛍️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Collection Orders</h3>
            <p className="text-gray-600">Orders from our collections</p>
          </Link>

          <Link
            href="/member/claimed-prizes"
            className="bg-white rounded-xl p-6 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Claimed Prizes</h3>
            <p className="text-gray-600">Your raffle wins</p>
          </Link>

          <Link
            href="/member/help-tickets"
            className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Help Tickets</h3>
            <p className="text-gray-600">Your support conversations</p>
          </Link>

          <Link
            href="/member/account-settings"
            className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 block"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Account Settings</h3>
            <p className="text-gray-600">Manage your account preferences</p>
          </Link>
        </div>

        {/* Become a PR Section - Only show if member doesn't have PR access */}
        {!member.isPr && !(member.memberTag && member.memberTag.toLowerCase().includes('pr')) && (
          <div className="mt-8 mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-8 border-2 border-purple-300 shadow-2xl">
              <div className="text-center">
                <div className="text-5xl mb-4">💎</div>
                <h2 className="text-3xl font-bold text-white mb-3">Become a PR and Earn Progressive Commissions</h2>
                <p className="text-white text-lg mb-6 max-w-2xl mx-auto">
                  Join our PR program and earn increasing commissions as you refer more customers. 
                  Start earning today with our progressive commission structure!
                </p>
                <button
                  onClick={handleBecomePR}
                  disabled={isUpdating}
                  className="bg-white text-purple-600 font-bold py-4 px-8 rounded-lg text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isUpdating ? 'Processing...' : 'Earn Today'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PR Dashboard Link */}
        {member.memberTag && member.memberTag.includes('PR') && (
          <div className="mt-8 mb-8">
            <Link
              href="/member/pr"
              className="block bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 border-2 border-purple-300 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl mb-2">💎</div>
                  <h2 className="text-2xl font-bold text-white mb-2">PR Dashboard</h2>
                  <p className="text-white">View your sales statistics and earnings</p>
                </div>
                <div className="text-white text-2xl">→</div>
              </div>
            </Link>
          </div>
        )}

        {/* Hats Manager Access - Only for Admin */}
        {(member.role === 'admin' || (member.memberTag && (
          (typeof member.memberTag === 'string' && member.memberTag.toLowerCase().includes('admin')) ||
          (Array.isArray(member.memberTag) && member.memberTag.some((t: string) => t.toLowerCase().includes('admin')))
        ))) && (
          <div className="mt-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Tools</h2>
            <Link
              href="/member/admin"
              className="block bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🎩</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Access Your Hats Manager</h3>
                    <p className="text-gray-600">Manage all hat orders, inventory, and view analytics</p>
                  </div>
                </div>
                <div className="text-purple-600 text-2xl font-bold">→</div>
              </div>
            </Link>
          </div>
        )}

        {/* Fashion Runways & Art Shows Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Events & Shows</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/member/runway-events"
              className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 block"
            >
              <div className="text-4xl mb-4">👗</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Runway Events</h3>
              <p className="text-gray-600">Your runway event signups and tickets</p>
            </Link>

            <Link
              href="/runway-collection"
              className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 block"
            >
              <div className="text-4xl mb-4">🎩</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Runway Collection</h3>
              <p className="text-gray-600">Hats from past runway shows — browse & purchase</p>
            </Link>

            <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Art Shows</h3>
              <p className="text-gray-600">Discover upcoming art exhibitions and shows</p>
            </div>
          </div>
        </div>
      </div>

      {/* PR Confirmation Popup */}
      <PRConfirmationPopup
        isOpen={showPRPopup}
        onClose={() => setShowPRPopup(false)}
        memberName={member.memberName || member.fullName || 'Member'}
      />
    </div>
  );
}
