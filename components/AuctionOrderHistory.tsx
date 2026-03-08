'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StarBidPackPurchase } from '@/lib/wix-types';

export default function AuctionOrderHistory() {
  const [orders, setOrders] = useState<StarBidPackPurchase[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      if (typeof window !== 'undefined') {
        setMemberId(localStorage.getItem('memberId'));
      }
    };
    sync();
    window.addEventListener('memberLogin', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('memberLogin', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!memberId) return;

    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [memberId]);

  async function loadOrders() {
    if (!memberId) return;
    const isBackgroundRefresh = orders.length > 0;
    if (isBackgroundRefresh) setRefreshing(true);

    try {
      const response = await fetch(`/api/members/${memberId}/purchases`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.purchases || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const handlePurchase = () => { if (memberId) loadOrders(); };
    window.addEventListener('starBidsPurchased', handlePurchase);
    return () => window.removeEventListener('starBidsPurchased', handlePurchase);
  }, [memberId]);

  if (!memberId) return null;

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg relative">
      {refreshing && (
        <div className="absolute top-4 right-4 w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" aria-hidden />
      )}
      <h3 className="text-xl font-bold text-gray-900 mb-4 pr-8">Order History</h3>

      {orders.length === 0 ? (
        <p className="text-gray-600 text-center py-4">
          No orders yet. <Link href="/star-bid-packs" className="text-purple-600 hover:underline">Purchase a pack</Link> to see your orders here!
        </p>
      ) : (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {orders.map((order) => (
          <div
            key={order._id}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{order.bidPackName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.orderDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-purple-600">
                  ⭐{order.totalStars.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  €{Number(order.totalPriceEUR).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>Qty: {order.quantity}</span>
              <span className={`px-2 py-1 rounded ${
                order.paymentStatus === 'Completed' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.paymentStatus}
              </span>
            </div>

            {order.transactionHash && order.userWallet && order.userWallet !== 'Paid by Card' && (
              <div className="mt-2 text-xs">
                <a
                  href={`https://sepolia.etherscan.io/tx/${order.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  View on Etherscan →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      <div className="mt-4 text-center">
        <Link href="/star-bid-packs">
          <button className="text-sm text-purple-600 hover:underline font-semibold">
            Purchase More Packs →
          </button>
        </Link>
      </div>
    </div>
  );
}
