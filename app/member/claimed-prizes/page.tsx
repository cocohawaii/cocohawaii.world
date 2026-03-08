'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WixImage from '@/components/WixImage';
import { useAuth } from '@/components/AuthProvider';

interface ClaimedPrize {
  _id: string;
  raffleId: string;
  raffleName: string;
  raffleSubtitle?: string;
  winningTicketNumber: number;
  hatIds?: string[];
  status: string;
  claimedAt: string;
}

interface Hat {
  _id: string;
  title: string;
  mainHatImage?: string;
}

export default function ClaimedPrizesPage() {
  const { member, isLoading } = useAuth();
  const [prizes, setPrizes] = useState<ClaimedPrize[]>([]);
  const [hats, setHats] = useState<Hat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !member) {
      window.location.href = '/login';
    }
  }, [member, isLoading]);

  useEffect(() => {
    if (member) {
      fetchPrizes();
    }
  }, [member]);

  useEffect(() => {
    fetch('/api/hats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.hats)) setHats(d.hats);
      })
      .catch(() => {});
  }, []);

  const fetchPrizes = async () => {
    if (!member) return;
    try {
      setLoading(true);
      const res = await fetch('/api/claimed-prizes', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setPrizes(data.prizes || []);
      }
    } catch (err) {
      console.error('Error fetching claimed prizes:', err);
    } finally {
      setLoading(false);
    }
  };

  const hatsById = Object.fromEntries(hats.map((h) => [h._id, h]));

  if (isLoading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/member/dashboard" className="text-gray-600 hover:text-black transition-colors mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Claimed Prizes</h1>
          <p className="text-lg text-gray-600">Your raffle wins</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600" />
          </div>
        ) : prizes.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-amber-200 p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No claimed prizes yet</h2>
            <p className="text-gray-600 mb-6">When you win a raffle and claim your prize, it will appear here.</p>
            <Link
              href="/raffles"
              className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all"
            >
              Browse Raffles
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {prizes.map((prize) => {
              const firstHat = prize.hatIds?.[0] ? hatsById[prize.hatIds[0]] : null;
              return (
                <div
                  key={prize._id}
                  className="bg-white rounded-2xl border-2 border-amber-200 shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-48 h-48 flex-shrink-0 bg-gray-100 relative">
                      {firstHat?.mainHatImage ? (
                        <WixImage
                          src={firstHat.mainHatImage}
                          alt={firstHat.title || prize.raffleName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🎩</div>
                      )}
                    </div>
                    <div className="flex-1 p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{prize.raffleName}</h3>
                      {prize.raffleSubtitle && (
                        <p className="text-sm text-gray-600 mb-3">{prize.raffleSubtitle}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="ticket-card-outer">
                          <div className="ticket-card-inner">
                            <span className="ticket-num tabular-nums">{prize.winningTicketNumber}</span>
                            <span className="ticket-label">Winning Ticket</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 capitalize">
                          {prize.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Claimed {new Date(prize.claimedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
