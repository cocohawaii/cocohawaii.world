'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { signOut } from '@/app/actions/auth';

export default function ProfileDropdown() {
  const { member, refetch } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [prLinkClicked, setPrLinkClicked] = useState(false);
  const [customOrdersCount, setCustomOrdersCount] = useState<number>(0);
  const [premadeOrdersCount, setPremadeOrdersCount] = useState<number>(0);
  const [helpTicketsCount, setHelpTicketsCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const memberName = member?.memberName ?? member?.fullName ?? null;
  const memberTag = member?.memberTag ?? member?.role ?? null;

  useEffect(() => {
    const hasAdminTag = memberTag && (
      (typeof memberTag === 'string' && memberTag.toLowerCase().includes('admin')) ||
      (Array.isArray(memberTag) && memberTag.some((t: string) => String(t).toLowerCase().includes('admin')))
    );
    if (hasAdminTag) {
      fetch('/api/admin/custom-orders').then(r => r.json()).then(d => { if (d.success && d.stats) setCustomOrdersCount(d.stats.totalOrders || 0); }).catch(() => {});
      fetch('/api/admin/premade-orders').then(r => r.json()).then(d => { if (d.success && d.stats) setPremadeOrdersCount(d.stats.totalOrders || 0); }).catch(() => {});
      fetch('/api/admin/help-tickets/count').then(r => r.json()).then(d => { if (d.success) setHelpTicketsCount(d.count || 0); }).catch(() => {});
    }
  }, [memberTag]);

  useEffect(() => {
    const interval = setInterval(() => {
      const hasAdminTag = memberTag && (
        (typeof memberTag === 'string' && memberTag.toLowerCase().includes('admin')) ||
        (Array.isArray(memberTag) && memberTag.some((t: string) => String(t).toLowerCase().includes('admin')))
      );
      if (hasAdminTag) {
        fetch('/api/admin/custom-orders').then(r => r.json()).then(d => { if (d.success && d.stats) setCustomOrdersCount(d.stats.totalOrders || 0); }).catch(() => {});
        fetch('/api/admin/premade-orders').then(r => r.json()).then(d => { if (d.success && d.stats) setPremadeOrdersCount(d.stats.totalOrders || 0); }).catch(() => {});
        fetch('/api/admin/help-tickets/count').then(r => r.json()).then(d => { if (d.success) setHelpTicketsCount(d.count || 0); }).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [memberTag]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Don't show if no member is logged in
  if (!memberName) return null;

  // Check if member has PR tag
  const hasPRTag = memberTag && (
    (typeof memberTag === 'string' && (memberTag.includes('PR') || memberTag === 'PR')) ||
    (Array.isArray(memberTag) && memberTag.includes('PR'))
  );

  // Check if member has Admin tag
  // memberTag can be stored as a comma-separated string (e.g., "Member,Admin") or as an array
  let hasAdminTag = false;
  
  if (memberTag) {
    if (typeof memberTag === 'string') {
      // Handle comma-separated string like "Member,Admin" or "Admin,Member"
      const tags = memberTag.split(',').map(t => t.trim());
      hasAdminTag = tags.some(tag => 
        tag === 'Admin' || 
        tag.toLowerCase() === 'admin' ||
        tag.includes('Admin')
      );
    } else if (Array.isArray(memberTag)) {
      hasAdminTag = (memberTag as string[]).some((tag: string) => {
        const tagStr = String(tag).trim();
        return tagStr === 'Admin' || tagStr.toLowerCase() === 'admin';
      });
    }
  }

  const menuItems: Array<{
    icon: string;
    title: string;
    description: string;
    href: string;
    badgeCount?: number;
  }> = [
    {
      icon: '🏠',
      title: 'Member Dashboard',
      description: 'View your account overview',
      href: '/member/dashboard',
    },
    {
      icon: '🎨',
      title: 'Custom Hat Orders',
      description: 'Your personalized hat orders',
      href: '/member/custom-orders',
    },
    {
      icon: '🛍️',
      title: 'Collection Orders',
      description: 'Orders from our collections',
      href: '/member/collection-orders',
    },
    {
      icon: '🏆',
      title: 'Claimed Prizes',
      description: 'Your raffle wins',
      href: '/member/claimed-prizes',
    },
    {
      icon: '🎫',
      title: 'Help Tickets',
      description: 'Your support conversations',
      href: '/member/help-tickets',
    },
    {
      icon: '🎬',
      title: 'My Runway Events',
      description: 'Your runway signups & tickets',
      href: '/member/runway-events',
    },
  ];

  // Add PR Dashboard link if member has PR tag
  if (hasPRTag) {
    menuItems.push({
      icon: '💎',
      title: 'PR Dashboard',
      description: 'View your commissions & earnings',
      href: '/member/pr',
    });
  }

  // Add Hats Manager link if member has Admin tag
  if (hasAdminTag) {
    const totalOrdersCount = customOrdersCount + premadeOrdersCount;
    menuItems.push({
      icon: '🎩',
      title: 'Hats Manager',
      description: 'Manage all hats in collections',
      href: '/member/admin',
      badgeCount: totalOrdersCount, // Single badge: custom + pre-made orders
    });
    menuItems.push({
      icon: '🎫',
      title: 'Support Tickets',
      description: 'Respond to customer tickets',
      href: '/member/admin?tab=helpTickets',
      badgeCount: helpTicketsCount > 0 ? helpTicketsCount : undefined,
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
          {memberName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block">{memberName}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-purple-200 overflow-hidden z-50 animate-fade-in max-h-[calc(100vh-5rem)] flex flex-col">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200 flex-shrink-0">
            <p className="font-bold text-gray-900 text-lg">{memberName}</p>
            <p className="text-sm text-gray-600">Member Account</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-amber-500 text-lg">⭐</span>
              <span className="font-semibold text-amber-700">
                {(member?.starBids ?? 0).toLocaleString()} Star Bids
              </span>
            </div>
          </div>
          
          <div className="py-2 overflow-y-auto flex-1 min-h-0">
            {menuItems.map((item, index) => {
              const isPRLink = item.title === 'PR Dashboard';
              const isNewPR = isPRLink && !prLinkClicked;
              const isFirstAdminItem = hasAdminTag && item.title === 'Hats Manager';
              
              return (
                <div key={index}>
                  {isFirstAdminItem && (
                    <div className="my-2 mx-4 h-0.5 rounded-full bg-gradient-to-r from-purple-200 via-purple-400 to-pink-200" aria-hidden="true" />
                  )}
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => {
                    setIsOpen(false);
                    // Mark PR link as clicked if it's the PR Dashboard
                    if (isPRLink && !prLinkClicked && typeof window !== 'undefined') {
                      localStorage.setItem('prLinkClicked', 'true');
                      setPrLinkClicked(true);
                    }
                  }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 group relative ${
                    isNewPR ? 'pr-link-new' : ''
                  }`}
                >
                  {/* Special glow effect for new PR link */}
                  {isNewPR && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400/20 via-emerald-400/30 to-green-400/20 blur-xl animate-pulse-glow" />
                  )}
                  
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform relative z-10 ${
                    isNewPR 
                      ? 'bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 shadow-lg shadow-green-400/50' 
                      : 'bg-gradient-to-r from-purple-100 to-pink-100'
                  }`}>
                    {item.icon}
                    {isNewPR && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold transition-colors ${
                        isNewPR 
                          ? 'text-green-700 group-hover:text-green-600' 
                          : 'text-gray-900 group-hover:text-purple-600'
                      }`}>
                        {item.title}
                      </p>
                      {isNewPR && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                          NEW
                        </span>
                      )}
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg animate-pulse">
                          {item.badgeCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-colors relative z-10 ${
                      isNewPR 
                        ? 'text-green-500 group-hover:text-green-600' 
                        : 'text-gray-400 group-hover:text-purple-600'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 p-2 flex-shrink-0 bg-white">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Log Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
