'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WixImage from '@/components/WixImage';
import Fireworks from '@/components/Fireworks';
import { useAuth } from '@/components/AuthProvider';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { Hat } from '@/lib/wix-types';
import { toWixVideoRef, extractVideoUrl } from '@/lib/wix-video-utils';
import { getGalleryItemDisplayUrl, parseWixImageToGalleryItem, toWixGalleryItem, convertWixImageUrl, type WixGalleryItem } from '@/lib/wix-utils';
import AdminHelpTickets from '@/components/AdminHelpTickets';
import AdminRunwayBackoffice from '@/components/AdminRunwayBackoffice';

interface AdminStats {
  totalSales: number;
  totalEarnings: number;
  prCount: number;
  prSalesCount: number;
  prEarnings: number;
  totalOrders: number;
}

// IMAGINE: Punchy marketing messages for personalized luxury hats blended with art
const HAT_IMAGINE_MESSAGES = [
  'Where luxury meets artistry. Wear your story.',
  'One-of-a-kind hats that blend exotic craft with personal expression.',
  'Art you can wear. Luxury you can feel.',
  'Every hat tells a story. Yours is waiting to be told.',
  'Personalized luxury, handcrafted with art.',
  'More than a hat—a wearable masterpiece.',
  'Blend your vision with exotic artistry.',
  'Luxury hats that speak to your soul.',
  'Art and craftsmanship. Wear it proudly.',
  'Your unique style, elevated by art.',
  'Where exotic meets personal. Where luxury meets you.',
  'Handcrafted luxury. Personalized art. Unforgettable.',
  'Wear art. Live luxury.',
  'One hat. One story. Infinite possibility.',
  'Luxury hats that don\'t just sit—they resonate.',
  'Blend your vision with the world\'s finest.',
  'Personalized luxury. Artful expression.',
  'Each hat: a canvas. Your story: the masterpiece.',
  'Exotic meets personal. Luxury meets art.',
  'Wear your story. Own your style.',
];

const DECOR_IMAGINE_MESSAGES = [
  'Transform your space with art that speaks to your soul.',
  'Where every piece tells a story worth living.',
  'Elevate your home. Elevate your life.',
  'Art that transforms walls into windows of possibility.',
  'Bring beauty home. Let it inspire you daily.',
  'Curated pieces for the life you\'re building.',
  'Your home deserves art that moves you.',
  'Bold. Beautiful. Uniquely yours.',
  'Make your space a reflection of your dreams.',
  'Living well starts with surrounding yourself well.',
  'Art that doesn\'t just hang—it resonates.',
  'Design your space. Design your life.',
  'Where craftsmanship meets everyday magic.',
  'Every detail matters. Every piece inspires.',
  'Create a home that feels like you.',
];

export default function AdminPage() {
  const router = useRouter();
  const { member, isLoading } = useAuth();
  const [hats, setHats] = useState<Hat[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHats, setSelectedHats] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showFireworks, setShowFireworks] = useState(false);
  const [editingHat, setEditingHat] = useState<Hat | null>(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [updatedHats, setUpdatedHats] = useState<Set<string>>(new Set());
  const [editFormData, setEditFormData] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [hatsSortBy, setHatsSortBy] = useState<'title' | 'created_at_desc' | 'created_at_asc' | 'display_order'>('created_at_desc');
  const [showReorderPopup, setShowReorderPopup] = useState(false);
  const [reorderHats, setReorderHats] = useState<Hat[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [migrateMediaLoading, setMigrateMediaLoading] = useState(false);
  const [migrateMediaResult, setMigrateMediaResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'finished' | 'custom' | 'premade' | 'rawHats' | 'auctionRaffles' | 'starBidPacks' | 'helpTickets' | 'runway'>('finished');
  const [analyticsTab, setAnalyticsTab] = useState<'hats' | 'decor' | 'rawHats' | 'analytics'>('hats');
  const [rafflesSubTab, setRafflesSubTab] = useState<'hats'>('hats');
  const [analytics, setAnalytics] = useState<{
    globalUniqueVisitors: number;
    pageVisits: Record<string, number>;
    memberSignups: number;
    memberLogins: number;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [hatAnalytics, setHatAnalytics] = useState<Record<string, {
    visitors: number;
    sales: number;
    earnings: number;
    prSales: number;
    prEarnings: number;
  }>>({});
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [customOrdersLoading, setCustomOrdersLoading] = useState(false);
  const [customOrdersStats, setCustomOrdersStats] = useState<{
    totalOrders: number;
    totalEarnings: number;
    totalHats: number;
  } | null>(null);
  const [premadeOrders, setPremadeOrders] = useState<any[]>([]);
  const [premadeOrdersLoading, setPremadeOrdersLoading] = useState(false);
  const [premadeOrdersStats, setPremadeOrdersStats] = useState<{
    totalOrders: number;
    totalEarnings: number;
    totalHats: number;
  } | null>(null);
  const [rawHats, setRawHats] = useState<any[]>([]);
  const [rawHatsLoading, setRawHatsLoading] = useState(false);
  const [showAddRawHat, setShowAddRawHat] = useState(false);
  const [addRawHatFormData, setAddRawHatFormData] = useState<{
    hatForm: string;
    newHatForm: string;
    hatColorName: string;
    hatProductName: string;
    hatProductImage: string;
    hatColorHex: string;
    rawHatPrice: string;
  }>({ hatForm: '', newHatForm: '', hatColorName: '', hatProductName: '', hatProductImage: '', hatColorHex: '', rawHatPrice: '150' });
  const [savingAddRawHat, setSavingAddRawHat] = useState(false);
  const [draggedGalleryIdx, setDraggedGalleryIdx] = useState<number | null>(null);
  const [decorItems, setDecorItems] = useState<any[]>([]);
  const [decorLoading, setDecorLoading] = useState(false);
  const [decorStats, setDecorStats] = useState<AdminStats | null>(null);
  const [decorStatsLoading, setDecorStatsLoading] = useState(false);
  const [selectedDecor, setSelectedDecor] = useState<Set<string>>(new Set());
  const [savingDecor, setSavingDecor] = useState(false);
  const [editingDecor, setEditingDecor] = useState<any | null>(null);
  const [editDecorFormData, setEditDecorFormData] = useState<any>({});
  const [showDecorEditPopup, setShowDecorEditPopup] = useState(false);
  const imagineMsgIdx = useRef(0);
  const hatImagineMsgIdx = useRef(0);
  const [savingEditDecor, setSavingEditDecor] = useState(false);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [rafflesLoading, setRafflesLoading] = useState(false);
  const [showCreateRafflePopup, setShowCreateRafflePopup] = useState(false);
  const [createRaffleFormData, setCreateRaffleFormData] = useState<{
    name: string;
    subtitle: string;
    isActive: boolean;
    visibilityDate: string;
    startDate: string;
    endDate: string;
    ticketLimit: number;
    ticketCostStars: number;
    ticketLimitPerUser?: number;
    valueOfPot?: number;
    hatIds?: string[];
  }>({
    name: '',
    subtitle: '',
    isActive: true,
    visibilityDate: '',
    startDate: '',
    endDate: '',
    ticketLimit: 100,
    ticketCostStars: 5,
    valueOfPot: 0,
  });
  const [savingRaffle, setSavingRaffle] = useState(false);
  const [selectedRaffleHats, setSelectedRaffleHats] = useState<Set<string>>(new Set());
  const [showSaveToRafflePopup, setShowSaveToRafflePopup] = useState(false);
  const [editingRaffleId, setEditingRaffleId] = useState<string | null>(null);
  const [viewingRaffle, setViewingRaffle] = useState<any | null>(null);
  const [viewingRaffleStats, setViewingRaffleStats] = useState<{ ticketsSold: number; uniqueHolders: number } | null>(null);
  const [starBidPacksStats, setStarBidPacksStats] = useState<{
    packs: { packId: string; packName: string; packDetail?: string; starsAmount: number; price: number; salesCount: number; quantitySold: number; totalStarsSold: number; totalRevenue: number }[];
    totals: { totalSales: number; totalQuantitySold: number; totalStarsSold: number; totalRevenue: number };
    orders: { id: string; packName: string; quantity: number; totalPriceEUR: number; createdAt: string; memberName: string; memberEmail: string }[];
  } | null>(null);
  const [starBidPacksLoading, setStarBidPacksLoading] = useState(false);
  const [helpTicketsCount, setHelpTicketsCount] = useState<number>(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'helpTickets') setActiveTab('helpTickets');
  }, [searchParams]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/admin/help-tickets/count').then(r => r.json()).then(d => { if (d.success) setHelpTicketsCount(d.count || 0); }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading && !member) {
      router.push('/login');
      return;
    }
    const hasAdminTag = member?.memberTag && (
      (typeof member.memberTag === 'string' && member.memberTag.toLowerCase().includes('admin')) ||
      (Array.isArray(member.memberTag) && member.memberTag.some((t: string) => t.toLowerCase().includes('admin')))
    );
    if (!hasAdminTag) {
      router.push('/member/dashboard');
      return;
    }
    fetchHats();
    fetchStats();
    fetchAnalytics();
    fetchHatAnalytics();
    fetchCustomOrders();
    fetchPremadeOrders();
    fetch('/api/admin/help-tickets/count').then(r => r.json()).then(d => { if (d.success) setHelpTicketsCount(d.count || 0); }).catch(() => {});
  }, [router, member, isLoading]);

  useEffect(() => {
    if (analyticsTab === 'decor') {
      fetchDecor();
      fetchDecorStats();
    }
  }, [analyticsTab]);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch('/api/admin/analytics');
      const data = await response.json();

      if (response.ok && data.success) {
        setAnalytics(data.analytics);
      } else {
        console.error('Failed to fetch analytics:', data.error);
        // Set default empty analytics
        setAnalytics({
          globalUniqueVisitors: 0,
          pageVisits: {},
          memberSignups: 0,
          memberLogins: 0,
        });
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setAnalytics({
        globalUniqueVisitors: 0,
        pageVisits: {},
        memberSignups: 0,
        memberLogins: 0,
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchHatAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/hat-analytics');
      const data = await response.json();

      if (response.ok && data.success && data.hatAnalytics) {
        setHatAnalytics(data.hatAnalytics);
      } else {
        console.error('Failed to fetch hat analytics:', data.error);
        setHatAnalytics({});
      }
    } catch (err: any) {
      console.error('Error fetching hat analytics:', err);
      setHatAnalytics({});
    }
  };

  const fetchCustomOrders = async () => {
    try {
      setCustomOrdersLoading(true);
      const response = await fetch('/api/admin/custom-orders');
      const data = await response.json();

      if (response.ok && data.success) {
        setCustomOrders(data.orders || []);
        setCustomOrdersStats(data.stats || {
          totalOrders: 0,
          totalEarnings: 0,
          totalHats: 0,
        });
      } else {
        console.error('Failed to fetch custom orders:', data.error);
        setCustomOrders([]);
        setCustomOrdersStats({
          totalOrders: 0,
          totalEarnings: 0,
          totalHats: 0,
        });
      }
    } catch (err: any) {
      console.error('Error fetching custom orders:', err);
      setCustomOrders([]);
      setCustomOrdersStats({
        totalOrders: 0,
        totalEarnings: 0,
        totalHats: 0,
      });
    } finally {
      setCustomOrdersLoading(false);
    }
  };

  const fetchRawHats = async () => {
    try {
      setRawHatsLoading(true);
      const response = await fetch('/api/admin/raw-hats', { cache: 'no-store' });
      const data = await response.json();
      if (response.ok && data.success) {
        setRawHats(data.hats || []);
      } else {
        setRawHats([]);
      }
    } catch (err) {
      setRawHats([]);
    } finally {
      setRawHatsLoading(false);
    }
  };

  const fetchPremadeOrders = async () => {
    try {
      setPremadeOrdersLoading(true);
      const response = await fetch('/api/admin/premade-orders');
      const data = await response.json();

      if (response.ok && data.success) {
        setPremadeOrders(data.orders || []);
        setPremadeOrdersStats(data.stats || {
          totalOrders: 0,
          totalEarnings: 0,
          totalHats: 0,
        });
      } else {
        console.error('Failed to fetch pre-made orders:', data.error);
        setPremadeOrders([]);
        setPremadeOrdersStats({
          totalOrders: 0,
          totalEarnings: 0,
          totalHats: 0,
        });
      }
    } catch (err: any) {
      console.error('Error fetching pre-made orders:', err);
      setPremadeOrders([]);
      setPremadeOrdersStats({
        totalOrders: 0,
        totalEarnings: 0,
        totalHats: 0,
      });
    } finally {
      setPremadeOrdersLoading(false);
    }
  };

  const fetchDecor = async () => {
    try {
      setDecorLoading(true);
      const response = await fetch('/api/home-decor?all=true', { cache: 'no-store' });
      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.items)) {
        setDecorItems(data.items);
        const activeIds = new Set<string>(
          data.items.filter((i: any) => i.isActive === true).map((i: any) => i._id)
        );
        setSelectedDecor(activeIds);
      } else if (!response.ok) {
        console.error('Home decor fetch failed:', response.status, data);
      }
    } catch (err) {
      console.error('Error fetching home decor:', err);
    } finally {
      setDecorLoading(false);
    }
  };

  const fetchDecorStats = async () => {
    try {
      setDecorStatsLoading(true);
      const response = await fetch('/api/admin/decor-stats');
      const data = await response.json();
      if (response.ok && data.success && data.stats) {
        setDecorStats(data.stats);
      } else {
        setDecorStats(null);
      }
    } catch (err) {
      console.error('Error fetching decor stats:', err);
      setDecorStats(null);
    } finally {
      setDecorStatsLoading(false);
    }
  };

  const toggleDecorSelection = (itemId: string) => {
    setSelectedDecor((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleSaveActiveDecor = async () => {
    if (selectedDecor.size === 0) {
      alert('Please select at least one item to save.');
      return;
    }
    setSavingDecor(true);
    try {
      const allIds = decorItems.map((i) => i._id);
      await fetch('/api/home-decor/update-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: allIds, isActive: false }),
      });
      const res = await fetch('/api/home-decor/update-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: Array.from(selectedDecor), isActive: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Successfully saved ${data.summary?.successful ?? selectedDecor.size} item(s) as active!`);
        await fetchDecor();
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      setSuccessMessage(`Error: ${err.message || 'Failed to save'}`);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 4000);
    } finally {
      setSavingDecor(false);
    }
  };

  const handleEditDecor = (item: any | null) => {
    if (item) {
      setEditingDecor(item);
      setEditDecorFormData({
        title: item.title || '',
        price: item.price ?? 0,
        discountedPrice: item.discountedPrice != null && item.discountedPrice !== 0 ? String(item.discountedPrice) : '',
        mainImage: item.mainImage || '',
        description: item.description || '',
        isActive: item.isActive !== false,
      });
    } else {
      setEditingDecor(null);
      setEditDecorFormData({
        title: '',
        price: 0,
        discountedPrice: '',
        mainImage: '',
        description: '',
        isActive: false,
      });
    }
    setShowDecorEditPopup(true);
  };

  const handleSaveDecor = async () => {
    setSavingEditDecor(true);
    try {
      if (!editingDecor) {
        const res = await fetch('/api/home-decor/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editDecorFormData.title?.trim(),
            price: parseFloat(editDecorFormData.price) || 0,
            discountedPrice: editDecorFormData.discountedPrice !== '' && editDecorFormData.discountedPrice != null ? parseFloat(editDecorFormData.discountedPrice) : undefined,
            mainImage: editDecorFormData.mainImage || '',
            description: editDecorFormData.description || '',
            isActive: editDecorFormData.isActive || false,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Create failed');
        setSuccessMessage(`Item "${editDecorFormData.title}" created successfully!`);
        setShowSuccessPopup(true);
        setShowFireworks(true);
        setShowDecorEditPopup(false);
        setEditingDecor(null);
        if (data?.item) {
          setDecorItems((prev) => [...prev, data.item].sort((a, b) => (a.title || '').localeCompare(b.title || '')));
          setSelectedDecor((prev) => new Set(data.item.isActive ? [...prev, data.item._id] : prev));
        }
        await fetchDecor();
        return;
      }
      const res = await fetch('/api/home-decor/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: editingDecor._id,
          title: editDecorFormData.title?.trim(),
          price: parseFloat(editDecorFormData.price) || 0,
          discountedPrice: editDecorFormData.discountedPrice === '' || editDecorFormData.discountedPrice == null ? undefined : parseFloat(editDecorFormData.discountedPrice),
          mainImage: editDecorFormData.mainImage || '',
          description: editDecorFormData.description || '',
          isActive: editDecorFormData.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setSuccessMessage(`Item "${editDecorFormData.title || editingDecor.title}" updated successfully!`);
      setShowSuccessPopup(true);
      setShowFireworks(true);
      setShowDecorEditPopup(false);
      setEditingDecor(null);
      await fetchDecor();
    } catch (err: any) {
      setSuccessMessage(`Error: ${err.message || 'Failed to save'}`);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 4000);
    } finally {
      setSavingEditDecor(false);
    }
  };

  const fetchHats = async (sortOverride?: typeof hatsSortBy) => {
    try {
      setLoading(true);
      setError(null);
      const sort = sortOverride ?? hatsSortBy;
      // Fetch hats with raw video URLs (wix:video://) so we save correct format, not https://
      const response = await fetch(`/api/hats?rawVideoUrls=true&sortBy=${sort}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await response.json();

      if (response.ok && data.success && data.hats) {
        setHats(data.hats);
        // Initialize selected hats with those that have isActive: true
        const activeHats = new Set<string>(
          data.hats
            .filter((hat: any) => hat.isActive === true)
            .map((hat: any) => hat._id as string)
        );
        setSelectedHats(activeHats);
        console.log(`✅ Loaded ${data.hats.length} hats from CocoHawaiiExoticHats`);
        console.log(`✅ Found ${activeHats.size} active hats`);
        
        // Fetch hat analytics after hats are loaded
        fetchHatAnalytics();
      } else {
        setError(data.error || 'Failed to fetch hats');
      }
    } catch (err: any) {
      console.error('Error fetching hats:', err);
      setError(err.message || 'An error occurred while fetching hats');
    } finally {
      setLoading(false);
    }
  };

  const fetchRaffles = async () => {
    try {
      setRafflesLoading(true);
      const res = await fetch('/api/raffles?admin=true');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.raffles)) {
        setRaffles(data.raffles);
      } else {
        setRaffles([]);
      }
    } catch {
      setRaffles([]);
    } finally {
      setRafflesLoading(false);
    }
  };

  const fetchStarBidPacksStats = async () => {
    try {
      setStarBidPacksLoading(true);
      const res = await fetch('/api/admin/star-bid-packs-stats');
      const data = await res.json();
      if (res.ok && data.success) {
        setStarBidPacksStats({
          packs: data.packs || [],
          totals: data.totals || { totalSales: 0, totalQuantitySold: 0, totalStarsSold: 0, totalRevenue: 0 },
          orders: data.orders || [],
        });
      } else {
        setStarBidPacksStats(null);
      }
    } catch {
      setStarBidPacksStats(null);
    } finally {
      setStarBidPacksLoading(false);
    }
  };

  const toggleRaffleHat = (hatId: string) => {
    setSelectedRaffleHats((prev) => {
      const next = new Set(prev);
      if (next.has(hatId)) next.delete(hatId);
      else next.add(hatId);
      return next;
    });
  };

  const handleAddHatsToRaffle = async (raffleId: string) => {
    if (selectedRaffleHats.size === 0) return;
    setSavingRaffle(true);
    try {
      const res = await fetch(`/api/raffles/${raffleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hatIdsToAdd: Array.from(selectedRaffleHats) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add hats');
      setSuccessMessage(`Added ${selectedRaffleHats.size} hat(s) to raffle!`);
      setShowSuccessPopup(true);
      setShowSaveToRafflePopup(false);
      setSelectedRaffleHats(new Set());
      await fetchRaffles();
    } catch (err: any) {
      alert(err.message || 'Failed to add hats to raffle');
    } finally {
      setSavingRaffle(false);
    }
  };

  const toDatetimeLocal = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleViewRaffle = async (r: any) => {
    setViewingRaffle(r);
    setViewingRaffleStats(null);
    const isSupabaseRaffle = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r._id);
    if (isSupabaseRaffle) {
      try {
        const res = await fetch(`/api/raffles/${r._id}/stats`);
        const data = await res.json();
        if (res.ok && data.success) {
          setViewingRaffleStats({ ticketsSold: data.ticketsSold ?? 0, uniqueHolders: data.uniqueHolders ?? 0 });
        }
      } catch {
        // ignore
      }
    }
  };

  const handleEditRaffle = (r: any) => {
    setEditingRaffleId(r._id);
    setCreateRaffleFormData({
      name: r.name || '',
      subtitle: r.subtitle || '',
      isActive: r.isActive ?? true,
      visibilityDate: toDatetimeLocal(r.visibilityDate),
      startDate: toDatetimeLocal(r.startDate),
      endDate: toDatetimeLocal(r.endDate),
      ticketLimit: r.ticketLimit ?? 100,
      ticketCostStars: r.ticketCostStars ?? 5,
      ticketLimitPerUser: r.ticketLimitPerUser ?? 0,
      valueOfPot: r.valueOfPot ?? 0,
      hatIds: r.hatIds || [],
    });
    setShowCreateRafflePopup(true);
  };

  const handleCreateRaffle = async () => {
    if (!createRaffleFormData.name.trim()) {
      alert('Please enter a raffle name');
      return;
    }
    setSavingRaffle(true);
    try {
      const payload = { ...createRaffleFormData, hatIds: (createRaffleFormData as any).hatIds || [] };
      const isEdit = !!editingRaffleId;
      if (isEdit) {
        const res = await fetch(`/api/raffles/${editingRaffleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: payload.name,
            subtitle: payload.subtitle,
            isActive: payload.isActive,
            visibilityDate: payload.visibilityDate ? new Date(payload.visibilityDate).toISOString() : undefined,
            startDate: payload.startDate ? new Date(payload.startDate).toISOString() : undefined,
            endDate: payload.endDate ? new Date(payload.endDate).toISOString() : undefined,
            ticketLimit: payload.ticketLimit,
            ticketCostStars: payload.ticketCostStars,
            valueOfPot: payload.valueOfPot ?? 0,
            hatIds: payload.hatIds,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update raffle');
        setSuccessMessage(`Raffle "${payload.name}" updated successfully!`);
      } else {
        const res = await fetch('/api/raffles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create raffle');
        setSuccessMessage(`Raffle "${payload.name}" created successfully!`);
      }
      setShowSuccessPopup(true);
      setShowCreateRafflePopup(false);
      setEditingRaffleId(null);
      setCreateRaffleFormData({ name: '', subtitle: '', isActive: true, visibilityDate: '', startDate: '', endDate: '', ticketLimit: 100, ticketCostStars: 5, ticketLimitPerUser: 0, valueOfPot: 0, hatIds: [] });
      await fetchRaffles();
    } catch (err: any) {
      alert(err.message || 'Failed to save raffle');
    } finally {
      setSavingRaffle(false);
    }
  };

  const toggleHatSelection = (hatId: string) => {
    setSelectedHats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hatId)) {
        newSet.delete(hatId);
      } else {
        newSet.add(hatId);
      }
      return newSet;
    });
  };

  const handleEditHat = (hat: Hat | null) => {
    if (hat) {
      // Editing existing hat
      setEditingHat(hat);
      // Initialize form data with current hat values
      setEditFormData({
        title: hat.title || '',
        hatSubtitle: hat.hatSubtitle || '',
        hatDescription: hat.hatDescription || '',
        price: hat.price || 0,
        discountedPrice: (hat.discountedPrice != null && hat.discountedPrice !== 0) ? String(hat.discountedPrice) : '',
        mainHatImage: hat.mainHatImage || '',
        topVideoEyes: extractVideoUrl(hat.topVideoEyes) || '',
        makingOfProductPage: extractVideoUrl(hat.makingOfProductPage) || '',
        hatSize: hat.hatSize || '',
        color: (hat as any).color || '',
        gallery: hat.gallery || [],
        isActive: hat.isActive || false,
        isSold: (hat as any).isSold || false,
      });
    } else {
      // Adding new hat
      setEditingHat(null);
      // Initialize form data with empty values
      setEditFormData({
        title: '',
        hatSubtitle: '',
        hatDescription: '',
        price: 0,
        discountedPrice: 0,
        mainHatImage: '',
        topVideoEyes: '',
        makingOfProductPage: '',
        hatSize: '',
        color: '',
        gallery: [],
        isActive: false,
      });
    }
    setShowEditPopup(true);
  };

  const handleSaveHat = async () => {
    setSavingEdit(true);
    try {
      if (!editingHat) {
        // Creating a new hat
        const newHatData: any = {
          title: editFormData.title.trim(),
          price: parseFloat(editFormData.price) || 0,
          discountedPrice: (editFormData.discountedPrice !== '' && editFormData.discountedPrice != null) ? parseFloat(editFormData.discountedPrice) : undefined,
          mainHatImage: editFormData.mainHatImage || '',
          topVideoEyes: toWixVideoRef(editFormData.topVideoEyes || ''),
          makingOfProductPage: toWixVideoRef(editFormData.makingOfProductPage || ''),
          hatSize: editFormData.hatSize || '',
          color: editFormData.color || '',
          gallery: (editFormData.gallery || []).map((img: unknown) => toWixGalleryItem(img)).filter(Boolean) as WixGalleryItem[],
          isActive: editFormData.isActive || false,
          isSold: editFormData.isSold || false,
        };

        // Add optional fields if provided
        if (editFormData.hatSubtitle !== undefined) newHatData.hatSubtitle = editFormData.hatSubtitle;
        if (editFormData.hatDescription !== undefined) newHatData.hatDescription = editFormData.hatDescription;

        const response = await fetch('/api/hats/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newHatData),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Show success popup
          setSuccessMessage(`Hat "${editFormData.title}" created successfully!`);
          setShowSuccessPopup(true);
          setShowFireworks(true);
          
          // Close edit popup
          setShowEditPopup(false);
          setEditingHat(null);
          
          // Refresh hats to get the new hat
          await fetchHats();
          
          // Hide success popup after 5 seconds
          setTimeout(() => {
            setShowSuccessPopup(false);
            setShowFireworks(false);
          }, 5000);
        } else {
          throw new Error(data.error || 'Failed to create hat');
        }
      } else {
        // Updating an existing hat
        // Prepare updates (only include fields that have values)
        const updates: any = {};
        
        if (editFormData.title) updates.title = editFormData.title;
        if (editFormData.hatSubtitle !== undefined) updates.hatSubtitle = editFormData.hatSubtitle;
        if (editFormData.hatDescription !== undefined) updates.hatDescription = editFormData.hatDescription;
        if (editFormData.price !== undefined) updates.price = parseFloat(editFormData.price) || 0;
        if (editFormData.discountedPrice !== undefined) {
          updates.discountedPrice = (editFormData.discountedPrice === '' || editFormData.discountedPrice == null) ? null : parseFloat(editFormData.discountedPrice);
        }
        if (editFormData.mainHatImage) updates.mainHatImage = editFormData.mainHatImage;
        // Only save video fields when we have a valid value (wix:video://, https, or Supabase URL). Skip data URLs.
        if (editFormData.topVideoEyes !== undefined) {
          const v = toWixVideoRef(editFormData.topVideoEyes || '');
          if (v || editFormData.topVideoEyes === '') updates.topVideoEyes = v;
        }
        if (editFormData.makingOfProductPage !== undefined) {
          const v = toWixVideoRef(editFormData.makingOfProductPage || '');
          if (v || editFormData.makingOfProductPage === '') updates.makingOfProductPage = v;
        }
        if (editFormData.hatSize !== undefined) updates.hatSize = editFormData.hatSize;
        if (editFormData.color !== undefined) updates.color = editFormData.color;
        if (editFormData.gallery !== undefined) {
          updates.gallery = (editFormData.gallery || []).map((img: unknown) => toWixGalleryItem(img)).filter(Boolean);
        }
        if (editFormData.isActive !== undefined) updates.isActive = editFormData.isActive;
        if (editFormData.isSold !== undefined) updates.isSold = editFormData.isSold;

        const response = await fetch('/api/hats/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hatId: editingHat._id,
            updates,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Show success popup
          setSuccessMessage(`Hat "${editFormData.title || editingHat.title}" updated successfully!`);
          setShowSuccessPopup(true);
          setShowFireworks(true);
          
          // Close edit popup
          setShowEditPopup(false);
          setEditingHat(null);
          
          // Show "Updated!" indicator on the hat card
          setUpdatedHats(prev => new Set(prev).add(editingHat._id));
          
          // Remove indicator after 8-10 seconds
          setTimeout(() => {
            setUpdatedHats(prev => {
              const newSet = new Set(prev);
              newSet.delete(editingHat._id);
              return newSet;
            });
          }, 9000);
          
          // Refresh hats to get updated data
          await fetchHats();
          
          // Hide success popup after 5 seconds
          setTimeout(() => {
            setShowSuccessPopup(false);
            setShowFireworks(false);
          }, 5000);
        } else {
          throw new Error(data.error || 'Failed to update hat');
        }
      }
    } catch (err: any) {
      console.error('Error saving hat:', err);
      setSuccessMessage(`Error: ${err.message || 'Failed to save hat'}`);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 4000);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteHat = async () => {
    if (!editingHat) return;
    if (!confirm(`Are you sure you want to delete "${editingHat.title}"? This cannot be undone.`)) return;

    setSavingEdit(true);
    try {
      const response = await fetch('/api/hats/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hatId: editingHat._id }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(`Hat "${editingHat.title}" deleted successfully.`);
        setShowSuccessPopup(true);
        setShowEditPopup(false);
        setEditingHat(null);
        await fetchHats();
        setTimeout(() => setShowSuccessPopup(false), 4000);
      } else {
        throw new Error(data.error || 'Failed to delete hat');
      }
    } catch (err: any) {
      console.error('Error deleting hat:', err);
      setSuccessMessage(`Error: ${err.message || 'Failed to delete hat'}`);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 4000);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveActiveHats = async () => {
    if (selectedHats.size === 0) {
      alert('Please select at least one hat to save.');
      return;
    }

    setSaving(true);
    try {
      // First, set all hats to isActive: false
      const allHatIds = hats.map(hat => hat._id);
      const responseDeactivate = await fetch('/api/hats/update-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hatIds: allHatIds,
          isActive: false,
        }),
      });

      if (!responseDeactivate.ok) {
        throw new Error('Failed to deactivate hats');
      }

      // Then, set selected hats to isActive: true
      const responseActivate = await fetch('/api/hats/update-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hatIds: Array.from(selectedHats),
          isActive: true,
        }),
      });

      const data = await responseActivate.json();

      if (responseActivate.ok && data.success) {
        alert(`✅ Successfully saved ${data.summary.successful} hat(s) as active!`);
        // Refresh hats to get updated isActive values
        await fetchHats();
      } else {
        throw new Error(data.error || 'Failed to save active hats');
      }
    } catch (err: any) {
      console.error('Error saving active hats:', err);
      setSuccessMessage(`Error: ${err.message || 'Failed to save active hats'}`);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (response.ok && data.success && data.stats) {
        setStats(data.stats);
        console.log('✅ Loaded admin statistics:', data.stats);
      } else {
        console.error('Failed to fetch stats:', data.error);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Upload video to Supabase Storage - direct client upload bypasses Vercel 4.5MB limit
  const uploadVideoToWix = async (file: File): Promise<string> => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Please log in to upload videos');

    const ext = file.name.split('.').pop() || 'mp4';
    const path = `hats/uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('videos').upload(path, file, {
      contentType: file.type || 'video/mp4',
      upsert: true,
    });

    if (error) {
      console.error('Supabase video upload error:', error);
      throw new Error(error.message || 'Upload failed');
    }

    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(path);
    return publicUrl;
  };

  // Upload image to Supabase Storage (for home decor)
  const uploadDecorImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/decor-image', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Upload failed');
    if (!data?.url) throw new Error('No URL returned');
    return data.url;
  };

  // Upload image for raw hats (media bucket)
  const uploadRawHatImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || 'Upload failed');
    if (!data?.url) throw new Error('No URL returned');
    return data.url;
  };

  // Upload image to Supabase Storage (for hats) - direct client upload bypasses Vercel 4.5MB limit
  const uploadImageToWix = async (file: File): Promise<string> => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Please log in to upload images');

    const ext = file.name.split('.').pop() || 'png';
    const path = `hats/uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('media').upload(path, file, {
      contentType: file.type || 'image/png',
      upsert: true,
    });

    if (error) {
      console.error('Supabase direct upload error:', error);
      throw new Error(error.message || 'Upload failed');
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
    return publicUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading hats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-red-200 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Hats</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => fetchHats()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                {activeTab === 'finished' 
                  ? 'Manage hats, home decor, and view analytics'
                  : activeTab === 'custom'
                  ? 'View and manage custom hat orders'
                  : activeTab === 'premade'
                  ? 'View and manage pre-made hat orders from collections'
                  : activeTab === 'helpTickets'
                  ? 'View and respond to customer support tickets'
                  : activeTab === 'runway'
                  ? 'Create and manage runway events'
                  : 'Manage raffles'}
              </p>
            </div>
            <Link
              href="/member/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Main Tabs Bar */}
          <div className="flex gap-4 border-b-2 border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('finished')}
              className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 ${
                activeTab === 'finished'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My World
            </button>
            <button
              onClick={() => {
                setActiveTab('custom');
                fetchCustomOrders();
              }}
              className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 relative ${
                activeTab === 'custom'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Custom Hat Orders
              {customOrdersStats && customOrdersStats.totalOrders > 0 && (
                <span className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] inline-flex items-center justify-center shadow-lg animate-pulse">
                  {customOrdersStats.totalOrders}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('premade');
                fetchPremadeOrders();
              }}
              className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 relative ${
                activeTab === 'premade'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pre-Made Hat Orders
              {premadeOrdersStats && premadeOrdersStats.totalOrders > 0 && (
                <span className="ml-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] inline-flex items-center justify-center shadow-lg animate-pulse">
                  {premadeOrdersStats.totalOrders}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('runway')}
              className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 ${
                activeTab === 'runway'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Runway
            </button>
            <button
              onClick={() => {
                setActiveTab('auctionRaffles');
                fetchHats();
                fetchRaffles();
              }}
              className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 ${
                activeTab === 'auctionRaffles'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Raffles
            </button>
            <button
              onClick={() => {
                setActiveTab('starBidPacks');
                fetchStarBidPacksStats();
              }}
              className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 ${
                activeTab === 'starBidPacks'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Star Bid Packs
            </button>
            <button
              onClick={() => setActiveTab('helpTickets')}
              className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 relative ${
                activeTab === 'helpTickets'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Help Tickets
              {helpTicketsCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] inline-flex items-center justify-center shadow-lg animate-pulse" title={`${helpTicketsCount} unresponded`}>
                  {helpTicketsCount}
                </span>
              )}
            </button>
          </div>

          {/* Sub-tabs under Raffles: List of Hats */}
          {activeTab === 'auctionRaffles' && (
            <div className="flex gap-4 border-b-2 border-gray-200 mb-6">
              <button
                onClick={() => setRafflesSubTab('hats')}
                className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 ${
                  rafflesSubTab === 'hats'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                List of Hats
              </button>
            </div>
          )}

          {/* Sub-tabs under My World: Hats Manager | Home Decor Manager | Page Analytics */}
          {activeTab === 'finished' && (
            <div className="flex gap-4 border-b-2 border-gray-200 mb-6">
              <button
                onClick={() => setAnalyticsTab('hats')}
                className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 relative ${
                  analyticsTab === 'hats'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Hats Manager
                {hats.length > 0 && (
                  <span className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] inline-flex items-center justify-center shadow-lg">
                    {hats.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setAnalyticsTab('decor');
                  fetchDecor();
                  fetchDecorStats();
                }}
                className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 relative ${
                  analyticsTab === 'decor'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Home Decor Manager
                {decorItems.length > 0 && (
                  <span className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] inline-flex items-center justify-center shadow-lg">
                    {decorItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setAnalyticsTab('rawHats');
                  fetchRawHats();
                }}
                className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 ${
                  analyticsTab === 'rawHats'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Raw Hats
                {rawHats.length > 0 && (
                  <span className="ml-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] inline-flex items-center justify-center shadow-lg">
                    {rawHats.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setAnalyticsTab('analytics');
                  fetchAnalytics();
                }}
                className={`px-6 py-3 font-semibold text-lg transition-all duration-300 border-b-4 ${
                  analyticsTab === 'analytics'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Page Analytics
              </button>
            </div>
          )}
        </div>

        {/* Page Analytics Tab (inside Finished Hats) */}
        {activeTab === 'finished' && analyticsTab === 'analytics' && (
          <div className="mb-8">
            {analyticsLoading ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ) : analytics ? (
              <>
                {/* Global Statistics */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Global Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Unique Visitors */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">👥</div>
                        <div className="text-right">
                          <p className="text-sm text-blue-600 font-semibold">Unique Visitors</p>
                          <p className="text-3xl font-bold text-blue-900">{(analytics.globalUniqueVisitors || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">Total unique visitors across all pages</p>
                    </div>

                    {/* Member Signups */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">✨</div>
                        <div className="text-right">
                          <p className="text-sm text-green-600 font-semibold">Member Signups</p>
                          <p className="text-3xl font-bold text-green-900">{(analytics.memberSignups || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-xs text-green-700 mt-2">Total unique member registrations</p>
                    </div>

                    {/* Member Logins */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300 shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">🔐</div>
                        <div className="text-right">
                          <p className="text-sm text-purple-600 font-semibold">Member Logins</p>
                          <p className="text-3xl font-bold text-purple-900">{(analytics.memberLogins || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-xs text-purple-700 mt-2">Total successful logins</p>
                    </div>
                  </div>
                </div>

                {/* Per Page Analytics */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Page-Specific Analytics</h2>
                  
                  {(() => {
                    // Define important pages organized by sections
                    const mainPages: Record<string, string> = {
                      '/': 'Homepage',
                      '/collections': 'Hand-Designed Collections',
                      '/create-your-hat': 'Create Your Hat',
                      '/the-runway': 'The Runway',
                      '/the-story': 'The Story',
                    };

                    const supportPages: Record<string, string> = {
                      '/faq': 'FAQ',
                      '/contact': 'Contact Us',
                      '/login': 'Login',
                      '/signup': 'Sign Up',
                    };

                    const memberPages: Record<string, string> = {
                      '/member/dashboard': 'Member Dashboard',
                      '/member/pr': 'PR Page',
                      '/member/collection-orders': 'My Orders Collection',
                      '/member/custom-orders': 'My Orders Custom Hat',
                    };

                    // Helper function to get visit count for a page
                    const getVisitCount = (page: string): number => {
                      return analytics.pageVisits[page] || 0;
                    };

                    // Helper function to render a page card
                    const renderPageCard = (page: string, displayName: string) => {
                      const visits = getVisitCount(page);
                      return (
                        <div
                          key={page}
                          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-2xl">📊</div>
                            <div className="text-right">
                              <p className="text-sm text-purple-600 font-semibold">Unique Visitors</p>
                              <p className="text-3xl font-bold text-purple-900">{visits.toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mt-3 font-medium truncate" title={page}>
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 truncate" title={page}>
                            {page}
                          </p>
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* Main Pages Section */}
                        <div className="mb-8">
                          <h3 className="text-xl font-semibold text-gray-800 mb-4">Main Pages</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(mainPages).map(([page, displayName]) => renderPageCard(page, displayName))}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t-2 border-gray-300 my-8"></div>

                        {/* Support & Auth Pages Section */}
                        <div className="mb-8">
                          <h3 className="text-xl font-semibold text-gray-800 mb-4">Support & Authentication</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(supportPages).map(([page, displayName]) => renderPageCard(page, displayName))}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t-2 border-gray-300 my-8"></div>

                        {/* Member Pages Section */}
                        <div className="mb-8">
                          <h3 className="text-xl font-semibold text-gray-800 mb-4">Member Dashboard Pages</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(memberPages).map(([page, displayName]) => renderPageCard(page, displayName))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Hats Manager Tab (inside Finished Hats) */}
        {activeTab === 'finished' && analyticsTab === 'hats' && (
          <>
        {/* Statistics Section */}
        {statsLoading ? (
          <div className="mb-8 bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        ) : stats ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Statistics Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Sales */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">💰</div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600 font-semibold">Total Sales</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalSales}</p>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">All orders placed</p>
              </div>

              {/* Total Earnings */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">💵</div>
                  <div className="text-right">
                    <p className="text-sm text-green-600 font-semibold">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-900">€{stats.totalEarnings.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-2">Revenue from all sales</p>
              </div>

              {/* Number of PRs */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">👥</div>
                  <div className="text-right">
                    <p className="text-sm text-purple-600 font-semibold">PR Members</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.prCount}</p>
                  </div>
                </div>
                <p className="text-xs text-purple-700 mt-2">Active PR representatives</p>
              </div>

              {/* PR Sales Count */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-300 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">🛍️</div>
                  <div className="text-right">
                    <p className="text-sm text-orange-600 font-semibold">PR Sales</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.prSalesCount}</p>
                  </div>
                </div>
                <p className="text-xs text-orange-700 mt-2">Sales from PR members</p>
              </div>

              {/* PR Earnings */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border-2 border-pink-300 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">💎</div>
                  <div className="text-right">
                    <p className="text-sm text-pink-600 font-semibold">PR Earnings</p>
                    <p className="text-2xl font-bold text-pink-900">€{stats.prEarnings.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-pink-700 mt-2">Revenue from PR sales</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Hats Count, Sort, Reorder and Save Button */}
        <div className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
          <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Total Hats: {hats.length}</p>
              <p className="text-sm opacity-90 mt-1">
                Selected: {selectedHats.size} hat{selectedHats.size !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm">
                <span className="opacity-90">Sort:</span>
                <select
                  value={hatsSortBy}
                  onChange={(e) => {
                    const v = e.target.value as typeof hatsSortBy;
                    setHatsSortBy(v);
                    fetchHats(v);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/20 border border-white/40 text-white font-medium focus:ring-2 focus:ring-white/50"
                >
                  <option value="created_at_desc">Newest first</option>
                  <option value="created_at_asc">Oldest first</option>
                  <option value="title">By name (A–Z)</option>
                  <option value="display_order">Custom order</option>
                </select>
              </label>
              <button
                onClick={() => {
                  setReorderHats([...hats]);
                  setShowReorderPopup(true);
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold border border-white/40 transition-colors"
              >
                Reorder
              </button>
            </div>
            <button
              onClick={handleSaveActiveHats}
              disabled={saving || selectedHats.size === 0}
              className="px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
          {migrateMediaResult && (
            <p className="text-sm opacity-90">{migrateMediaResult}</p>
          )}
          </div>
        </div>

        {/* Hats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Add New Hat Card */}
          <div
            onClick={() => handleEditHat(null)}
            className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl shadow-xl overflow-hidden border-2 border-dashed border-purple-300 hover:border-purple-500 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center min-h-[400px]"
          >
            <div className="text-center p-8">
              <div className="text-6xl mb-4">➕</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Add New Hat</h3>
              <p className="text-gray-600">Click to create a new hat</p>
            </div>
          </div>

          {/* Existing Hats */}
          {hats.map((hat) => {
            const productPrice = hat.discountedPrice && hat.discountedPrice !== 0
              ? hat.discountedPrice
              : hat.price;

            return (
              <div
                key={hat._id}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-[1.02] relative ${
                  selectedHats.has(hat._id)
                    ? 'border-green-500 ring-4 ring-green-200'
                    : 'border-purple-200 hover:border-purple-400'
                }`}
              >
                {/* Updated Indicator */}
                {updatedHats.has(hat._id) && (
                  <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse z-30 shadow-lg">
                    Updated!
                  </div>
                )}
                
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedHats.has(hat._id)}
                    onChange={() => toggleHatSelection(hat._id)}
                    className="w-6 h-6 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer"
                  />
                </div>
                
                {/* Active Badge */}
                {selectedHats.has(hat._id) && (
                  <div className="absolute top-2 right-2 z-10 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    ACTIVE
                  </div>
                )}
                
                {/* Hat Image */}
                <div className="relative w-full h-64 bg-gray-100">
                  {hat.mainHatImage ? (
                    <WixImage
                      src={hat.mainHatImage}
                      alt={hat.title || 'Hat'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                      🎩
                    </div>
                  )}
                  {hat.discountedPrice && hat.discountedPrice !== 0 && !(hat as any).isSold && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                      SALE
                    </div>
                  )}
                  {(hat as any).isSold && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,107,107,0.3) 0%, rgba(254,202,87,0.3) 25%, rgba(72,219,251,0.3) 50%, rgba(255,159,243,0.3) 75%, rgba(84,160,255,0.3) 100%)',
                      }}
                    >
                      <span
                        className="text-2xl font-black tracking-wider"
                        style={{
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        SOLD
                      </span>
                    </div>
                  )}
                </div>

                {/* Hat Info */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                    {hat.title || 'Untitled Hat'}
                  </h3>
                  {hat.hatSubtitle && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                      {hat.hatSubtitle}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      {hat.discountedPrice && hat.discountedPrice !== 0 ? (
                        <div>
                          <span className="text-lg font-bold text-green-600">
                            €{hat.discountedPrice}
                          </span>
                          <span className="text-sm text-gray-400 line-through ml-2">
                            €{hat.price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          €{hat.price}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditHat(hat)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 text-sm"
                      >
                        Edit
                      </button>
                      <Link
                        href={`/hats/${hat.title?.toLowerCase().replace(/\s+/g, '-') || hat._id}`}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                  
                  {hat.hatSize && (
                    <div className="mt-2 text-xs text-gray-500">
                      Size: {hat.hatSize}
                    </div>
                  )}

                  {/* Hat Analytics - Small section at bottom */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div className="text-center">
                        <p className="text-gray-500 mb-1">Visitors</p>
                        <p className="font-semibold text-gray-700">
                          {hatAnalytics[hat._id]?.visitors || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 mb-1">Sales</p>
                        <p className="font-semibold text-gray-700">
                          {hatAnalytics[hat._id]?.sales || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 mb-1">Earnings</p>
                        <p className="font-semibold text-gray-700">
                          €{(hatAnalytics[hat._id]?.earnings || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                      <div className="text-center">
                        <p className="text-gray-500 mb-1">PR Sales</p>
                        <p className="font-semibold text-purple-700">
                          {hatAnalytics[hat._id]?.prSales || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 mb-1">PR Earnings</p>
                        <p className="font-semibold text-purple-700">
                          €{(hatAnalytics[hat._id]?.prEarnings || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {hat.createdAt && (
                      <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100 text-center">
                        Created: {new Date(hat.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hats.length === 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center col-span-full">
              <div className="text-6xl mb-4">🎩</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Hats Found</h2>
              <p className="text-gray-600">
                No hats found in the CocoHawaiiExoticHats collection.
              </p>
            </div>
          )}
        </div>
          </>
        )}

        {/* Raffles Tab */}
        {activeTab === 'auctionRaffles' && rafflesSubTab === 'hats' && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">List of Hats</h2>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const pad = (n: number) => String(n).padStart(2, '0');
                      const toLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                      const tomorrow = new Date(now);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const weekLater = new Date(now);
                      weekLater.setDate(weekLater.getDate() + 7);
                      setCreateRaffleFormData({
                        name: '',
                        subtitle: '',
                        isActive: true,
                        visibilityDate: toLocal(now),
                        startDate: toLocal(tomorrow),
                        endDate: toLocal(weekLater),
                        ticketLimit: 100,
                        ticketCostStars: 5,
                        ticketLimitPerUser: 0,
                        valueOfPot: 0,
                      });
                      setShowCreateRafflePopup(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg"
                  >
                    Create Raffle
                  </button>
                </div>

                {/* Raffles Summary */}
                {rafflesLoading ? (
                  <div className="mb-8 p-6 bg-gray-100 rounded-xl animate-pulse">Loading raffles...</div>
                ) : raffles.length > 0 ? (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Raffles</h3>
                    <div className="space-y-3">
                      {raffles.map((r) => (
                        <div key={r._id} className="bg-white rounded-xl p-4 border-2 border-emerald-200 shadow">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900">{r.name}</p>
                              {r.subtitle && <p className="text-sm text-gray-600">{r.subtitle}</p>}
                              <p className="text-xs text-gray-500 mt-1">
                                Visibility: {r.visibilityDate ? new Date(r.visibilityDate).toLocaleString() : '-'} → Start: {r.startDate ? new Date(r.startDate).toLocaleString() : '-'} → End: {r.endDate ? new Date(r.endDate).toLocaleString() : '-'}
                              </p>
                              <p className="text-xs text-gray-500">Tickets: {r.ticketLimit} max • {r.ticketCostStars} stars each • {r.isActive ? 'Active' : 'Inactive'}{(r.ticketLimitPerUser ?? 0) > 0 && ` • ${r.ticketLimitPerUser} per user`}{(r.valueOfPot ?? 0) > 0 && ` • Pot: €${(r.valueOfPot ?? 0).toLocaleString()}`}</p>
                              {(r.hatIds?.length ?? 0) > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {(r.hatIds || []).map((hid: string) => {
                                    const hat = hats.find((h) => h._id === hid);
                                    return hat ? (
                                      <div key={hid} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-emerald-200">
                                        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-200 flex-shrink-0 shrink-0">
                                          {hat.mainHatImage ? (
                                            <WixImage src={hat.mainHatImage} alt={hat.title || 'Hat'} fill className="object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-lg">🎩</div>
                                          )}
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 line-clamp-1 max-w-[120px]">{hat.title || 'Untitled'}</span>
                                      </div>
                                    ) : (
                                      <div key={hid} className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1 text-xs text-gray-500">
                                        {hid.slice(0, 8)}…
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 flex-shrink-0">
                              <Link
                                href="/raffles"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 text-sm"
                              >
                                View Live
                              </Link>
                              <button
                                onClick={() => handleViewRaffle(r)}
                                className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleEditRaffle(r)}
                                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 text-sm"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-600">Total: {hats.length} hats</p>
                  {selectedRaffleHats.size > 0 && (
                    <button
                      onClick={() => setShowSaveToRafflePopup(true)}
                      className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-600 shadow"
                    >
                      Save {selectedRaffleHats.size} hat(s) to Raffle
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {hats.map((hat) => {
                    const productPrice = hat.discountedPrice && hat.discountedPrice !== 0 ? hat.discountedPrice : hat.price;
                    return (
                      <div key={hat._id} className={`relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all ${selectedRaffleHats.has(hat._id) ? 'border-teal-500 ring-2 ring-teal-200' : 'border-purple-200'}`}>
                        <div className="absolute top-2 left-2 z-10">
                          <input
                            type="checkbox"
                            checked={selectedRaffleHats.has(hat._id)}
                            onChange={() => toggleRaffleHat(hat._id)}
                            className="w-6 h-6 rounded border-2 border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-2 cursor-pointer"
                            title="Add to raffle"
                          />
                        </div>
                        <div className="relative w-full h-64 bg-gray-100">
                          {hat.mainHatImage ? (
                            <WixImage src={hat.mainHatImage} alt={hat.title || 'Hat'} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">🎩</div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{hat.title || 'Untitled Hat'}</h3>
                          <p className="text-lg font-bold text-gray-900">€{productPrice}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleEditHat(hat)}
                              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 text-sm"
                            >
                              Edit
                            </button>
                            <Link
                              href={`/hats/${hat.title?.toLowerCase().replace(/\s+/g, '-') || hat._id}`}
                              className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 text-sm"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {hats.length === 0 && (
                    <div className="col-span-full bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
                      <div className="text-6xl mb-4">🎩</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">No Hats Found</h2>
                      <p className="text-gray-600">No hats in the collection.</p>
                    </div>
                  )}
                </div>
              </div>
        )}

        {/* Star Bid Packs Tab */}
        {activeTab === 'starBidPacks' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Star Bid Packs – Sales Overview</h2>
            {starBidPacksLoading ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-amber-200">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : starBidPacksStats ? (
              <>
                {/* Totals */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-6 border-2 border-amber-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">🛒</div>
                      <div className="text-right">
                        <p className="text-sm text-amber-600 font-semibold">Total Sales</p>
                        <p className="text-2xl font-bold text-amber-900">{starBidPacksStats.totals.totalSales}</p>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700 mt-2">Number of purchases</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl p-6 border-2 border-yellow-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">📦</div>
                      <div className="text-right">
                        <p className="text-sm text-yellow-600 font-semibold">Packs Sold</p>
                        <p className="text-2xl font-bold text-yellow-900">{starBidPacksStats.totals.totalQuantitySold}</p>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2">Total pack units sold</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-6 border-2 border-orange-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">⭐</div>
                      <div className="text-right">
                        <p className="text-sm text-orange-600 font-semibold">Stars Sold</p>
                        <p className="text-2xl font-bold text-orange-900">{starBidPacksStats.totals.totalStarsSold.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-orange-700 mt-2">Total stars distributed</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">€</div>
                      <div className="text-right">
                        <p className="text-sm text-green-600 font-semibold">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-900">€{starBidPacksStats.totals.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 mt-2">Revenue from pack sales</p>
                  </div>
                </div>

                {/* Per-pack stats */}
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales by Pack</h3>
                <div className="space-y-4">
                  {starBidPacksStats.packs.map((pack) => (
                    <div key={pack.packId} className="bg-white rounded-xl p-5 border-2 border-amber-200 shadow-lg">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{pack.packName}</h4>
                          {pack.packDetail && <p className="text-sm text-gray-600">{pack.packDetail}</p>}
                          <p className="text-xs text-gray-500 mt-1">
                            {pack.starsAmount} ⭐ per pack • €{pack.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-amber-600">{pack.salesCount}</p>
                            <p className="text-xs text-gray-500">Purchases</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{pack.quantitySold}</p>
                            <p className="text-xs text-gray-500">Packs sold</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">{pack.totalStarsSold.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Stars sold</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">€{pack.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-500">Revenue</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {starBidPacksStats.packs.length === 0 && (
                    <div className="bg-white rounded-xl p-8 border-2 border-amber-200 text-center">
                      <p className="text-gray-500">No star bid packs or no sales yet.</p>
                    </div>
                  )}
                </div>

                {/* Sales by Order */}
                <h3 className="text-lg font-semibold text-gray-800 mt-10 mb-4">Sales by Order</h3>
                {(starBidPacksStats.orders ?? []).length === 0 ? (
                  <div className="bg-white rounded-xl p-8 border-2 border-amber-200 text-center">
                    <p className="text-gray-500">No star bid packs orders yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border-2 border-amber-200 shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-amber-50 border-b border-amber-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Pack</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Qty</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(starBidPacksStats.orders ?? []).map((order) => (
                            <tr key={order.id} className="border-b border-amber-100 last:border-0 hover:bg-amber-50/50">
                              <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3 px-4 font-medium text-gray-900">{order.memberName}</td>
                              <td className="py-3 px-4 text-gray-600">
                                <a href={`mailto:${order.memberEmail}`} className="text-amber-600 hover:underline truncate block max-w-[180px]" title={order.memberEmail}>
                                  {order.memberEmail}
                                </a>
                              </td>
                              <td className="py-3 px-4 text-gray-700">{order.packName}</td>
                              <td className="py-3 px-4 text-right text-gray-700">{order.quantity}</td>
                              <td className="py-3 px-4 text-right font-semibold text-green-700">€{order.totalPriceEUR.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-amber-200 text-center">
                <p className="text-gray-500">Failed to load star bid pack stats.</p>
                <button
                  onClick={fetchStarBidPacksStats}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Help Tickets Tab */}
        {activeTab === 'helpTickets' && (
          <div className="mb-8">
            <AdminHelpTickets onRefreshCount={() => fetch('/api/admin/help-tickets/count').then(r => r.json()).then(d => { if (d.success) setHelpTicketsCount(d.count || 0); }).catch(() => {})} />
          </div>
        )}

        {/* Runway Tab */}
        {activeTab === 'runway' && (
          <div className="mb-8">
            <div className="mb-4 flex justify-end">
              <Link
                href="/member/admin/runway"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-purple-600 hover:text-purple-800"
              >
                Open full Runway Backoffice ↗
              </Link>
            </div>
            <AdminRunwayBackoffice hats={hats} />
          </div>
        )}

        {/* Custom Hat Orders Tab */}
        {activeTab === 'custom' && (
          <>
            {/* Statistics Section */}
            {customOrdersLoading ? (
              <div className="mb-8 bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : customOrdersStats ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Custom Hat Orders Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Orders */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">📦</div>
                      <div className="text-right">
                        <p className="text-sm text-blue-600 font-semibold">Total Orders</p>
                        <p className="text-3xl font-bold text-blue-900">{customOrdersStats.totalOrders}</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">Total custom hat order groups</p>
                  </div>

                  {/* Total Hats */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">🎩</div>
                      <div className="text-right">
                        <p className="text-sm text-purple-600 font-semibold">Total Hats</p>
                        <p className="text-3xl font-bold text-purple-900">{customOrdersStats.totalHats}</p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-700 mt-2">Total individual custom hats</p>
                  </div>

                  {/* Total Earnings */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">💰</div>
                      <div className="text-right">
                        <p className="text-sm text-green-600 font-semibold">Total Earnings</p>
                        <p className="text-3xl font-bold text-green-900">€{customOrdersStats.totalEarnings.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 mt-2">Total revenue from custom orders</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Custom Orders List */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Custom Hat Orders</h2>
              {customOrdersLoading ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading custom orders...</p>
                </div>
              ) : customOrders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Custom Orders Yet</h3>
                  <p className="text-gray-600">Custom hat orders will appear here once customers place orders.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {customOrders.map((orderGroup) => {
                    // Helper function to parse art style tag
                    const parseArtStyleTag = (tag: string | string[] | undefined) => {
                      if (!tag) return null;
                      const tagStr = Array.isArray(tag) ? tag[0] : String(tag);
                      if (!tagStr || tagStr === 'N/A' || tagStr.trim() === '') return null;
                      
                      const parts = tagStr.split(' | ');
                      return {
                        style: parts[0]?.trim() || '',
                        colors: parts[1] && parts[1] !== '—' && parts[1].trim() !== '' 
                          ? parts[1].split(',').map(c => c.trim()).filter(Boolean)
                          : [],
                        notes: parts[2] && parts[2] !== '—' && parts[2].trim() !== '' ? parts[2].trim() : '',
                        price: parts[3]?.trim() || '',
                      };
                    };

                    // Helper function to parse accessory tag
                    const parseAccessoryTag = (tag: string | string[] | undefined) => {
                      if (!tag) return null;
                      const tagStr = Array.isArray(tag) ? tag[0] : String(tag);
                      if (!tagStr || tagStr === 'N/A' || tagStr.trim() === '') return null;
                      
                      const parts = tagStr.split(' | ');
                      return {
                        name: parts[0]?.trim() || '',
                        price: parts[1]?.trim() || '€0.00',
                      };
                    };

                    // Extract customer info from first hat if not available at group level
                    const firstHat = orderGroup.hats?.[0];
                    const customerName = orderGroup.customerName || firstHat?.name || 'N/A';
                    const customerEmail = orderGroup.customerEmail || firstHat?.email || 'N/A';
                    const customerMobile = orderGroup.customerMobile || firstHat?.mobile || 'N/A';
                    const customerPhoneCode = (orderGroup as any).customerPhoneCode || firstHat?.phoneCode || '';
                    const customerAddress = orderGroup.customerAddress || firstHat?.address || '';
                    
                    // Format mobile with country code
                    const formattedMobile = customerPhoneCode && customerMobile !== 'N/A' && customerMobile.trim() !== ''
                      ? `${customerPhoneCode} ${customerMobile}`
                      : customerMobile;

                    return (
                      <div
                        key={orderGroup.groupOrderId}
                        className="bg-white rounded-3xl shadow-2xl border-2 border-purple-200 overflow-hidden transition-all hover:shadow-3xl hover:scale-[1.01]"
                      >
                        {/* Order Header */}
                        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-6 text-white relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div>
                                <h3 className="text-3xl font-bold mb-2">Order: {orderGroup.groupOrderId}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-semibold">
                                    {orderGroup.orderCount} hat{orderGroup.orderCount !== 1 ? 's' : ''}
                                  </span>
                                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                    Created: {(() => {
                                      if (!orderGroup.orderCreatedOn) return 'N/A';
                                      try {
                                        if (typeof orderGroup.orderCreatedOn === 'string') {
                                          return new Date(orderGroup.orderCreatedOn).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                          });
                                        }
                                        if (typeof orderGroup.orderCreatedOn === 'object' && orderGroup.orderCreatedOn.formatted) {
                                          return orderGroup.orderCreatedOn.formatted;
                                        }
                                        if (orderGroup.orderCreatedOn instanceof Date) {
                                          return orderGroup.orderCreatedOn.toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                          });
                                        }
                                        return new Date(String(orderGroup.orderCreatedOn)).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        });
                                      } catch (e) {
                                        return 'N/A';
                                      }
                                    })()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-4xl font-bold mb-2">€{(() => {
                                  const price = orderGroup.totalPrice;
                                  if (typeof price === 'number') return price.toFixed(2);
                                  if (typeof price === 'object' && price !== null) {
                                    const numValue = (price as any).value || (price as any).amount || 0;
                                    return parseFloat(String(numValue)).toFixed(2);
                                  }
                                  return parseFloat(String(price || 0)).toFixed(2);
                                })()}</p>
                                <div className="flex items-center justify-end gap-2">
                                  {orderGroup.orderPaid ? (
                                    <span className="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
                                      <span>✓</span> Paid
                                    </span>
                                  ) : (
                                    <span className="bg-yellow-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
                                      <span>⏳</span> Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Customer Info Section - Enhanced */}
                        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 border-b-2 border-purple-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-2xl">👤</span>
                            Client Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Customer Name</p>
                              <p className="text-base font-bold text-gray-900 break-words">
                                {customerName !== 'N/A' && customerName.trim() !== '' ? customerName : (
                                  <span className="text-gray-400 italic">Not provided</span>
                                )}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-sm">
                              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Email</p>
                              <p className="text-base font-bold text-gray-900 break-words">
                                {customerEmail !== 'N/A' && customerEmail.trim() !== '' ? (
                                  <a href={`mailto:${customerEmail}`} className="text-purple-600 hover:text-purple-800 underline">
                                    {customerEmail}
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic">Not provided</span>
                                )}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border-2 border-pink-200 shadow-sm">
                              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Mobile</p>
                              <p className="text-base font-bold text-gray-900 break-words">
                                {formattedMobile !== 'N/A' && formattedMobile.trim() !== '' ? (
                                  <a href={`tel:${formattedMobile.replace(/\s+/g, '')}`} className="text-pink-600 hover:text-pink-800">
                                    {formattedMobile}
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic">Not provided</span>
                                )}
                              </p>
                            </div>
                            {customerAddress && customerAddress.trim() !== '' && (
                              <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm md:col-span-2 lg:col-span-1">
                                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Shipping Address</p>
                                <p className="text-sm font-semibold text-gray-900 break-words">{customerAddress}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hats in Order - Enhanced */}
                        <div className="p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <span className="text-2xl">🎩</span>
                            Hats in this Order
                          </h4>
                          <div className="space-y-6">
                            {orderGroup.hats.map((hat: any, index: number) => {
                              const artStyle = parseArtStyleTag(hat.artStyleTag);
                              const gemstone = parseAccessoryTag(hat.gemstoneTag);
                              const jewelry = parseAccessoryTag(hat.jewelryTag);
                              const fabric = parseAccessoryTag(hat.fabricTag);

                              return (
                                <div
                                  key={hat._id || index}
                                  className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all"
                                >
                                  <div className="grid md:grid-cols-[600px_1fr] gap-6">
                                    {/* Hat Image */}
                                    {hat.hatProductImage ? (
                                      <div className="relative w-full h-28 md:h-auto md:min-h-[140px] rounded-xl overflow-hidden bg-gray-100 border-2 border-purple-200 shadow-md">
                                        <WixImage
                                          src={hat.hatProductImage}
                                          alt={`${Array.isArray(hat.hatForm) ? hat.hatForm.join(', ') : hat.hatForm || 'Custom'} Hat - ${hat.hatColorName || ''}`}
                                          fill
                                          className="object-cover"
                                          sizes="600px"
                                        />
                                      </div>
                                    ) : (
                                      <div className="relative w-full h-28 md:h-auto md:min-h-[140px] rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 flex items-center justify-center">
                                        <span className="text-6xl">🎩</span>
                                      </div>
                                    )}

                                    {/* Hat Details */}
                                    <div className="space-y-4">
                                      {/* Basic Info */}
                                      <div className="flex flex-wrap items-center gap-3 pb-3 border-b-2 border-gray-200">
                                        <div className="bg-purple-100 rounded-lg px-4 py-2 border-2 border-purple-300">
                                          <p className="text-xs text-purple-600 font-semibold uppercase mb-1">Form</p>
                                          <p className="text-lg font-bold text-purple-900">
                                            {(() => {
                                              const form = hat.hatForm;
                                              if (!form) return 'N/A';
                                              if (Array.isArray(form)) return form.join(', ');
                                              return String(form);
                                            })()}
                                          </p>
                                        </div>
                                        <div className="bg-pink-100 rounded-lg px-4 py-2 border-2 border-pink-300">
                                          <p className="text-xs text-pink-600 font-semibold uppercase mb-1">Color</p>
                                          <p className="text-lg font-bold text-pink-900">{String(hat.hatColorName || 'N/A')}</p>
                                        </div>
                                      </div>

                                      {/* Art Style */}
                                      {artStyle && (
                                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border-2 border-pink-300 shadow-sm">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Art Style</p>
                                              <p className="text-lg font-bold text-pink-700 mb-2">{artStyle.style}</p>
                                              {artStyle.colors.length > 0 && (
                                                <div className="mt-2">
                                                  <p className="text-xs text-gray-600 mb-1.5 font-medium">Colors:</p>
                                                  <div className="flex flex-wrap gap-1.5">
                                                    {artStyle.colors.map((color: string, idx: number) => (
                                                      <span
                                                        key={idx}
                                                        className="px-2.5 py-1 bg-white rounded-md text-xs font-semibold text-gray-700 border border-gray-300 shadow-sm"
                                                      >
                                                        {color}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {artStyle.notes && (
                                                <div className="mt-2 pt-2 border-t border-pink-200">
                                                  <p className="text-xs text-gray-600 mb-1 font-medium">Art Notes:</p>
                                                  <p className="text-sm text-gray-700 italic">{artStyle.notes}</p>
                                                </div>
                                              )}
                                            </div>
                                            {artStyle.price && (
                                              <div className="text-right ml-4">
                                                <p className="text-xs text-gray-500 mb-1">Price</p>
                                                <p className="text-xl font-bold text-pink-600">{artStyle.price}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Accessories */}
                                      {(gemstone || jewelry || fabric) && (
                                        <div className="space-y-2">
                                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Accessories</p>
                                          
                                          {gemstone && (
                                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border-2 border-blue-200 flex items-center justify-between">
                                              <div>
                                                <p className="text-xs text-blue-600 font-semibold mb-0.5">Gemstone</p>
                                                <p className="text-base font-bold text-blue-900">{gemstone.name}</p>
                                              </div>
                                              <span className="text-lg font-bold text-blue-600">{gemstone.price}</span>
                                            </div>
                                          )}
                                          
                                          {jewelry && (
                                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border-2 border-yellow-200 flex items-center justify-between">
                                              <div>
                                                <p className="text-xs text-orange-600 font-semibold mb-0.5">Jewelry</p>
                                                <p className="text-base font-bold text-orange-900">{jewelry.name}</p>
                                              </div>
                                              <span className="text-lg font-bold text-orange-600">{jewelry.price}</span>
                                            </div>
                                          )}
                                          
                                          {fabric && (
                                            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-3 border-2 border-green-200 flex items-center justify-between">
                                              <div>
                                                <p className="text-xs text-teal-600 font-semibold mb-0.5">Fabric</p>
                                                <p className="text-base font-bold text-teal-900">{fabric.name}</p>
                                              </div>
                                              <span className="text-lg font-bold text-teal-600">{fabric.price}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Personal Details */}
                                      {(hat.notes || hat.birthDate || hat.clientDescription) && (
                                        <div className="pt-3 border-t-2 border-gray-200 space-y-2">
                                          {hat.notes && (
                                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                              <div className="flex items-start gap-2">
                                                <span className="text-lg">📝</span>
                                                <div className="flex-1">
                                                  <p className="text-xs text-gray-500 mb-1 font-semibold">Personal Notes</p>
                                                  <p className="text-sm text-gray-700 italic">{String(hat.notes)}</p>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {hat.birthDate && (
                                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                              <div className="flex items-start gap-2">
                                                <span className="text-lg">📅</span>
                                                <div className="flex-1">
                                                  <p className="text-xs text-gray-500 mb-1 font-semibold">Birth Date</p>
                                                  <p className="text-sm text-gray-700 font-semibold">
                                                    {(() => {
                                                      try {
                                                        const date = new Date(hat.birthDate);
                                                        return date.toLocaleDateString('en-US', { 
                                                          weekday: 'long',
                                                          year: 'numeric', 
                                                          month: 'long', 
                                                          day: 'numeric' 
                                                        });
                                                      } catch {
                                                        return String(hat.birthDate);
                                                      }
                                                    })()}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {hat.clientDescription && (
                                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                              <div className="flex items-start gap-2">
                                                <span className="text-lg">💬</span>
                                                <div className="flex-1">
                                                  <p className="text-xs text-gray-500 mb-1 font-semibold">Client Description</p>
                                                  <p className="text-sm text-gray-700">{String(hat.clientDescription)}</p>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Price */}
                                      <div className="pt-3 border-t-2 border-gray-300">
                                        <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                                          <span className="text-lg font-bold text-gray-900">Hat Price</span>
                                          <span className="text-2xl font-bold text-green-600">
                                            €{(() => {
                                              const price = hat.price;
                                              if (typeof price === 'number') return price.toFixed(2);
                                              if (typeof price === 'object' && price !== null) {
                                                const numValue = (price as any).value || (price as any).amount || 0;
                                                return parseFloat(String(numValue)).toFixed(2);
                                              }
                                              return parseFloat(String(price || 0)).toFixed(2);
                                            })()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Pre-Made Hat Orders Tab */}
        {activeTab === 'premade' && (
          <>
            {/* Statistics Section */}
            {premadeOrdersLoading ? (
              <div className="mb-8 bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : premadeOrdersStats ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Pre-Made Hat Orders Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Orders */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">📦</div>
                      <div className="text-right">
                        <p className="text-sm text-blue-600 font-semibold">Total Orders</p>
                        <p className="text-3xl font-bold text-blue-900">{premadeOrdersStats.totalOrders}</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">Total pre-made hat orders</p>
                  </div>

                  {/* Total Hats */}
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-6 border-2 border-cyan-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">🎩</div>
                      <div className="text-right">
                        <p className="text-sm text-cyan-600 font-semibold">Total Hats</p>
                        <p className="text-3xl font-bold text-cyan-900">{premadeOrdersStats.totalHats}</p>
                      </div>
                    </div>
                    <p className="text-xs text-cyan-700 mt-2">Total individual pre-made hats</p>
                  </div>

                  {/* Total Earnings */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">💰</div>
                      <div className="text-right">
                        <p className="text-sm text-green-600 font-semibold">Total Earnings</p>
                        <p className="text-3xl font-bold text-green-900">€{premadeOrdersStats.totalEarnings.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 mt-2">Total revenue from pre-made orders</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Pre-Made Orders List */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pre-Made Hat Orders</h2>
              {premadeOrdersLoading ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading pre-made orders...</p>
                </div>
              ) : premadeOrders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
                  <div className="text-6xl mb-4">🛍️</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Pre-Made Orders Yet</h3>
                  <p className="text-gray-600">Pre-made hat orders will appear here once customers place orders from collections.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {premadeOrders.map((order) => {
                    // Format mobile with country code if available
                    const formattedMobile = order.customerMobile || 'N/A';
                    
                    // Format full address
                    const fullAddress = [
                      order.customerAddress,
                      order.shippingCity,
                      order.shippingPostalCode,
                      order.shippingCountry,
                    ].filter(Boolean).join(', ');

                    return (
                      <div
                        key={order._id}
                        className="bg-white rounded-3xl shadow-2xl border-2 border-blue-200 overflow-hidden transition-all hover:shadow-3xl hover:scale-[1.01]"
                      >
                        {/* Order Header */}
                        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 p-6 text-white relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div>
                                <h3 className="text-3xl font-bold mb-2">Order: {order.orderId}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-semibold">
                                    1 hat
                                  </span>
                                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                    Created: {(() => {
                                      if (!order.orderCreatedOn) return 'N/A';
                                      try {
                                        if (typeof order.orderCreatedOn === 'string') {
                                          return new Date(order.orderCreatedOn).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                          });
                                        }
                                        if (typeof order.orderCreatedOn === 'object' && order.orderCreatedOn.formatted) {
                                          return order.orderCreatedOn.formatted;
                                        }
                                        if (order.orderCreatedOn instanceof Date) {
                                          return order.orderCreatedOn.toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                          });
                                        }
                                        return new Date(String(order.orderCreatedOn)).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        });
                                      } catch (e) {
                                        return 'N/A';
                                      }
                                    })()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-4xl font-bold mb-2">€{order.totalPrice.toFixed(2)}</p>
                                <div className="flex items-center justify-end gap-2">
                                  <span className="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
                                    <span>✓</span> Paid
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Customer Info Section */}
                        <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 p-6 border-b-2 border-blue-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-2xl">👤</span>
                            Client Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Customer Name</p>
                              <p className="text-base font-bold text-gray-900 break-words">
                                {order.customerName && order.customerName.trim() !== '' ? order.customerName : (
                                  <span className="text-gray-400 italic">Not provided</span>
                                )}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-sm">
                              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Email</p>
                              <p className="text-base font-bold text-gray-900 break-words">
                                {order.customerEmail && order.customerEmail.trim() !== '' ? (
                                  <a href={`mailto:${order.customerEmail}`} className="text-purple-600 hover:text-purple-800 underline">
                                    {order.customerEmail}
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic">Not provided</span>
                                )}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border-2 border-pink-200 shadow-sm">
                              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Mobile</p>
                              <p className="text-base font-bold text-gray-900 break-words">
                                {formattedMobile !== 'N/A' && formattedMobile.trim() !== '' ? (
                                  <a href={`tel:${formattedMobile.replace(/\s+/g, '')}`} className="text-pink-600 hover:text-pink-800">
                                    {formattedMobile}
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic">Not provided</span>
                                )}
                              </p>
                            </div>
                            {fullAddress && fullAddress.trim() !== '' && (
                              <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm md:col-span-2 lg:col-span-1">
                                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Shipping Address</p>
                                <p className="text-sm font-semibold text-gray-900 break-words">{fullAddress}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hat Details */}
                        <div className="p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <span className="text-2xl">🎩</span>
                            Hat Details
                          </h4>
                          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                            <div className="grid md:grid-cols-[600px_1fr] gap-6">
                              {/* Hat Image */}
                              {order.hatImage ? (
                                <div className="relative w-full h-28 md:h-auto md:min-h-[140px] rounded-xl overflow-hidden bg-gray-100 border-2 border-blue-200 shadow-md">
                                  <WixImage
                                    src={order.hatImage}
                                    alt={order.hatTitle || 'Hat'}
                                    fill
                                    className="object-cover"
                                    sizes="600px"
                                  />
                                </div>
                              ) : (
                                <div className="relative w-full h-28 md:h-auto md:min-h-[140px] rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 flex items-center justify-center">
                                  <span className="text-6xl">🎩</span>
                                </div>
                              )}

                              {/* Hat Info */}
                              <div className="space-y-4">
                                <div className="space-y-3">
                                  <div className="bg-blue-100 rounded-lg px-4 py-2 border-2 border-blue-300">
                                    <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Hat Title</p>
                                    <p className="text-lg font-bold text-blue-900">{order.hatTitle || 'N/A'}</p>
                                  </div>
                                  {order.hatSubtitle && (
                                    <div className="bg-purple-100 rounded-lg px-4 py-2 border-2 border-purple-300">
                                      <p className="text-xs text-purple-600 font-semibold uppercase mb-1">Subtitle</p>
                                      <p className="text-base font-semibold text-purple-900">{order.hatSubtitle}</p>
                                    </div>
                                  )}
                                  {order.customAsk && order.customAsk.trim() !== '' && (
                                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                      <div className="flex items-start gap-2">
                                        <span className="text-lg">💬</span>
                                        <div className="flex-1">
                                          <p className="text-xs text-gray-500 mb-1 font-semibold">Special Request</p>
                                          <p className="text-sm text-gray-700">{order.customAsk}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-3 pt-3 border-t-2 border-gray-300">
                                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm text-gray-600 font-semibold">Hat Price</span>
                                      <span className="text-xl font-bold text-green-600">€{order.hatPrice.toFixed(2)}</span>
                                    </div>
                                  </div>
                                  {order.shippingCost > 0 && (
                                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-300">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600 font-semibold">Shipping</span>
                                        <span className="text-lg font-bold text-blue-600">€{order.shippingCost.toFixed(2)}</span>
                                      </div>
                                      {order.shippingOption && (
                                        <p className="text-xs text-gray-500 mt-1">{order.shippingOption}</p>
                                      )}
                                    </div>
                                  )}
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-300">
                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-bold text-gray-900">Total</span>
                                      <span className="text-2xl font-bold text-purple-600">€{order.totalPrice.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Raw Hats (sub-tab under My World) */}
        {activeTab === 'finished' && analyticsTab === 'rawHats' && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Raw Hats</h2>
              <button
                onClick={() => {
                  setShowAddRawHat(!showAddRawHat);
                  if (!showAddRawHat) {
                    const forms = [...new Set(rawHats.map((h) => h.hatForm).filter(Boolean))].sort();
                    setAddRawHatFormData({
                      hatForm: forms[0] || '',
                      newHatForm: '',
                      hatColorName: '',
                      hatProductName: '',
                      hatProductImage: '',
                      hatColorHex: '',
                      rawHatPrice: '150',
                    });
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                {showAddRawHat ? 'Cancel' : 'Add more raw hats'}
              </button>
            </div>

            {/* Add Raw Hat form */}
            {showAddRawHat && (
              <div className="mb-8 bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add Raw Hat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type (hat form)</label>
                    <select
                      value={addRawHatFormData.hatForm === '__new__' ? '__new__' : addRawHatFormData.hatForm}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAddRawHatFormData({ ...addRawHatFormData, hatForm: v, newHatForm: v === '__new__' ? addRawHatFormData.newHatForm : '' });
                      }}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">— Select type —</option>
                      {[...new Set(rawHats.map((h) => h.hatForm).filter(Boolean))].sort().map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                      <option value="__new__">+ Add new type</option>
                    </select>
                    {addRawHatFormData.hatForm === '__new__' && (
                      <input
                        type="text"
                        value={addRawHatFormData.newHatForm}
                        onChange={(e) => setAddRawHatFormData({ ...addRawHatFormData, newHatForm: e.target.value })}
                        placeholder="e.g. Arrow, Flat, Golf"
                        className="mt-2 w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Color name</label>
                    <input
                      type="text"
                      value={addRawHatFormData.hatColorName}
                      onChange={(e) => setAddRawHatFormData({ ...addRawHatFormData, hatColorName: e.target.value })}
                      placeholder="e.g. Beige, Navy Blue"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Product name</label>
                    <input
                      type="text"
                      value={addRawHatFormData.hatProductName}
                      onChange={(e) => setAddRawHatFormData({ ...addRawHatFormData, hatProductName: e.target.value })}
                      placeholder="e.g. Arrow | Beige"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price (€)</label>
                    <input
                      type="number"
                      value={addRawHatFormData.rawHatPrice}
                      onChange={(e) => setAddRawHatFormData({ ...addRawHatFormData, rawHatPrice: e.target.value })}
                      placeholder="150"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL or upload</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={addRawHatFormData.hatProductImage}
                        onChange={(e) => setAddRawHatFormData({ ...addRawHatFormData, hatProductImage: e.target.value })}
                        placeholder="https://... or upload below"
                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setAddRawHatFormData({ ...addRawHatFormData, hatProductImage: 'uploading...' });
                              const url = await uploadRawHatImage(file);
                              setAddRawHatFormData((prev) => ({ ...prev, hatProductImage: url }));
                              alert('✅ Image uploaded');
                            } catch (err: any) {
                              alert(`Upload failed: ${err?.message}`);
                              setAddRawHatFormData((prev) => ({ ...prev, hatProductImage: '' }));
                            }
                          }
                          e.target.value = '';
                        }}
                        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 cursor-pointer text-sm"
                      />
                    </div>
                    {addRawHatFormData.hatProductImage && addRawHatFormData.hatProductImage !== 'uploading...' && addRawHatFormData.hatProductImage.startsWith('http') && (
                      <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-300">
                        <img src={addRawHatFormData.hatProductImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Color hex (optional)</label>
                    <input
                      type="text"
                      value={addRawHatFormData.hatColorHex}
                      onChange={(e) => setAddRawHatFormData({ ...addRawHatFormData, hatColorHex: e.target.value })}
                      placeholder="#f5f5dc"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddRawHat(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const form = addRawHatFormData.hatForm === '__new__' ? addRawHatFormData.newHatForm.trim() : addRawHatFormData.hatForm;
                      if (!form) {
                        alert('Please select or enter a hat type');
                        return;
                      }
                      if (!addRawHatFormData.hatProductName.trim()) {
                        alert('Please enter a product name');
                        return;
                      }
                      setSavingAddRawHat(true);
                      try {
                        const res = await fetch('/api/admin/raw-hats', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            hatForm: form,
                            hatColorName: addRawHatFormData.hatColorName.trim(),
                            hatProductName: addRawHatFormData.hatProductName.trim(),
                            hatProductImage: addRawHatFormData.hatProductImage && addRawHatFormData.hatProductImage !== 'uploading...' ? addRawHatFormData.hatProductImage.trim() : undefined,
                            hatColorHex: addRawHatFormData.hatColorHex.trim() || undefined,
                            rawHatPrice: parseFloat(addRawHatFormData.rawHatPrice) || 150,
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed to add raw hat');
                        setSuccessMessage(`Raw hat "${addRawHatFormData.hatProductName}" added!`);
                        setShowSuccessPopup(true);
                        setShowAddRawHat(false);
                        setAddRawHatFormData({ hatForm: '', newHatForm: '', hatColorName: '', hatProductName: '', hatProductImage: '', hatColorHex: '', rawHatPrice: '150' });
                        await fetchRawHats();
                      } catch (err: any) {
                        alert(err.message || 'Failed to add raw hat');
                      } finally {
                        setSavingAddRawHat(false);
                      }
                    }}
                    disabled={savingAddRawHat}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                  >
                    {savingAddRawHat ? 'Adding...' : 'Add Raw Hat'}
                  </button>
                </div>
              </div>
            )}

            {rawHatsLoading ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading raw hats...</p>
              </div>
            ) : rawHats.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
                <div className="text-6xl mb-4">🎩</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Raw Hats Yet</h3>
                <p className="text-gray-600">Click &quot;Add more raw hats&quot; to add your first raw hat.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {rawHats.map((hat) => (
                  <div
                    key={hat.wixId}
                    className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden hover:shadow-2xl transition-all"
                  >
                    <div className="aspect-square relative bg-gray-100">
                      {hat.hatProductImage ? (
                        <WixImage src={hat.hatProductImage} alt={hat.hatProductName || 'Raw hat'} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">🎩</div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-gray-900 truncate">{hat.hatProductName || hat.hatForm || 'Untitled'}</p>
                      <p className="text-sm text-gray-600">{hat.hatForm} · {hat.hatColorName || '—'}</p>
                      <p className="text-sm font-semibold text-purple-600 mt-1">€{hat.rawHatPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Home Decor Manager (sub-tab under My World) — same layout as Hats Manager */}
        {activeTab === 'finished' && analyticsTab === 'decor' && (
          <>
            {/* Statistics Section — always show 5 cards (same as Hats Manager) */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Statistics Overview</h2>
              {decorStatsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">💰</div>
                      <div className="text-right">
                        <p className="text-sm text-blue-600 font-semibold">Total Sales</p>
                        <p className="text-2xl font-bold text-blue-900">{decorStats?.totalSales ?? 0}</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">All orders placed</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">💵</div>
                      <div className="text-right">
                        <p className="text-sm text-green-600 font-semibold">Total Earnings</p>
                        <p className="text-2xl font-bold text-green-900">€{(decorStats?.totalEarnings ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 mt-2">Revenue from all sales</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">👥</div>
                      <div className="text-right">
                        <p className="text-sm text-purple-600 font-semibold">PR Members</p>
                        <p className="text-2xl font-bold text-purple-900">{decorStats?.prCount ?? 0}</p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-700 mt-2">Active PR representatives</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">🛍️</div>
                      <div className="text-right">
                        <p className="text-sm text-orange-600 font-semibold">PR Sales</p>
                        <p className="text-2xl font-bold text-orange-900">{decorStats?.prSalesCount ?? 0}</p>
                      </div>
                    </div>
                    <p className="text-xs text-orange-700 mt-2">Sales from PR members</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border-2 border-pink-300 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">💎</div>
                      <div className="text-right">
                        <p className="text-sm text-pink-600 font-semibold">PR Earnings</p>
                        <p className="text-2xl font-bold text-pink-900">€{(decorStats?.prEarnings ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-pink-700 mt-2">Revenue from PR sales</p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary bar: Total Items / Selected / Save */}
            <div className="mb-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">Total Items: {decorItems.length}</p>
                  <p className="text-sm opacity-90 mt-1">
                    Selected: {selectedDecor.size} item{selectedDecor.size !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => fetchDecor()}
                    disabled={decorLoading}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {decorLoading ? 'Loading...' : '↻ Refresh'}
                  </button>
                  <button
                    onClick={handleSaveActiveDecor}
                    disabled={savingDecor || selectedDecor.size === 0}
                    className="px-8 py-3 bg-white text-amber-600 font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg flex items-center gap-2"
                  >
                    {savingDecor ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Empty state CTA when no items — opens popup to add first item */}
            {!decorLoading && decorItems.length === 0 && (
              <div className="mb-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 text-center">
                <p className="text-gray-700 mb-4">No home decor items yet. Add your first item to start selling.</p>
                <button
                  type="button"
                  onClick={() => handleEditDecor(null)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
                >
                  + Add home decor item
                </button>
              </div>
            )}

            {/* Decor Grid: Add New + item cards */}
            {decorLoading ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading home decor...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Add New Decor Card — opens popup to add item */}
                <div
                  onClick={() => handleEditDecor(null)}
                  className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl shadow-xl overflow-hidden border-2 border-dashed border-amber-300 hover:border-amber-500 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center min-h-[400px]"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditDecor(null)}
                  aria-label="Add new home decor item"
                >
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">➕</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Add New Item</h3>
                    <p className="text-gray-600">Click to create a new home decor item</p>
                  </div>
                </div>

                {decorItems.map((item) => (
                    <div
                      key={item._id}
                      className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-[1.02] relative ${
                        selectedDecor.has(item._id) ? 'border-green-500 ring-4 ring-green-200' : 'border-amber-200 hover:border-amber-400'
                      }`}
                    >
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedDecor.has(item._id)}
                          onChange={() => toggleDecorSelection(item._id)}
                          className="w-6 h-6 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer"
                        />
                      </div>
                      {selectedDecor.has(item._id) && (
                        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                          ACTIVE
                        </div>
                      )}
                      <div className="relative w-full h-64 bg-gray-100">
                        {item.mainImage ? (
                          <WixImage src={item.mainImage} alt={item.title || 'Item'} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">🛋️</div>
                        )}
                        {item.discountedPrice && item.discountedPrice !== 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">SALE</div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{item.title || 'Untitled'}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            {item.discountedPrice && item.discountedPrice !== 0 ? (
                              <div>
                                <span className="text-lg font-bold text-green-600">€{item.discountedPrice}</span>
                                <span className="text-sm text-gray-400 line-through ml-2">€{item.price}</span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">€{item.price}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditDecor(item)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 text-sm"
                            >
                              Edit
                            </button>
                            <Link
                              href={`/home-decor/${item.slug || item._id}`}
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 text-sm"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                            <div className="text-center">
                              <p className="text-gray-500 mb-1">Visitors</p>
                              <p className="font-semibold text-gray-700">0</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1">Sales</p>
                              <p className="font-semibold text-gray-700">0</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1">Earnings</p>
                              <p className="font-semibold text-gray-700">€0</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                            <div className="text-center">
                              <p className="text-gray-500 mb-1">PR Sales</p>
                              <p className="font-semibold text-amber-700">0</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1">PR Earnings</p>
                              <p className="font-semibold text-amber-700">€0.00</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                ))}

                {decorItems.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-amber-200 text-center col-span-full">
                    <div className="text-6xl mb-4">🛋️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">No Items Yet</h2>
                    <p className="text-gray-600">Click &quot;Add New Item&quot; to create your first home decor item.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      {/* Beautiful Success Popup with Fireworks - z-[100] so it appears above other popups */}
      {showSuccessPopup && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => {
            setShowSuccessPopup(false);
            setShowFireworks(false);
          }}
        >
          {/* Fireworks Background */}
          {showFireworks && (
            <div className="absolute inset-0">
              <Fireworks trigger={showFireworks} duration={5000} />
            </div>
          )}
          
          {/* Popup Content */}
          <div 
            className={`relative rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-white/30 max-w-md w-full mx-4 transform animate-scaleIn ${
              successMessage.includes('Error') 
                ? 'bg-gradient-to-br from-red-500 via-rose-600 to-red-700' 
                : 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowSuccessPopup(false);
                setShowFireworks(false);
              }}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>

            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-4 border-4 border-white/30 animate-bounce">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
                {successMessage.includes('Error') ? 'Oops!' : 'Success!'} 🎉
              </h3>
            </div>

            {/* Message */}
            <div className="text-center mb-6">
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed drop-shadow-md">
                {successMessage}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setShowSuccessPopup(false);
                setShowFireworks(false);
              }}
              className={`w-full bg-white font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transition-all duration-300 text-lg shadow-lg transform hover:scale-105 ${
                successMessage.includes('Error') ? 'text-red-600' : 'text-green-600'
              }`}
            >
              Got it! ✨
            </button>
          </div>
        </div>
      )}

      {/* Reorder Hats Popup */}
      {showReorderPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
          <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-purple-200 max-w-lg w-full mx-4 max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">Reorder Hats</h2>
              <p className="text-sm opacity-90 mt-1">Choose the order hats appear on the collection page. Drag or use arrows.</p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                {reorderHats.map((hat, idx) => (
                  <div
                    key={hat._id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(idx));
                      e.dataTransfer.effectAllowed = 'move';
                      (e.target as HTMLElement).classList.add('opacity-50');
                    }}
                    onDragEnd={(e) => {
                      (e.target as HTMLElement).classList.remove('opacity-50');
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      (e.currentTarget as HTMLElement).classList.add('ring-2', 'ring-purple-400', 'ring-inset');
                    }}
                    onDragLeave={(e) => {
                      (e.currentTarget as HTMLElement).classList.remove('ring-2', 'ring-purple-400', 'ring-inset');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).classList.remove('ring-2', 'ring-purple-400', 'ring-inset');
                      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                      if (fromIdx === idx || isNaN(fromIdx)) return;
                      const next = [...reorderHats];
                      const [moved] = next.splice(fromIdx, 1);
                      next.splice(idx, 0, moved);
                      setReorderHats(next);
                    }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-purple-100 cursor-grab active:cursor-grabbing transition-all"
                  >
                    <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      {hat.mainHatImage ? (
                        <WixImage src={hat.mainHatImage} alt={hat.title || 'Hat'} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">🎩</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === 0) return;
                          const next = [...reorderHats];
                          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                          setReorderHats(next);
                        }}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === reorderHats.length - 1) return;
                          const next = [...reorderHats];
                          [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                          setReorderHats(next);
                        }}
                        disabled={idx === reorderHats.length - 1}
                        className="p-1 rounded hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ▼
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{hat.title || 'Untitled'}</p>
                      {hat.hatSubtitle && <p className="text-xs text-gray-500 truncate">{hat.hatSubtitle}</p>}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowReorderPopup(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSavingOrder(true);
                  try {
                    const res = await fetch('/api/hats/update-order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ hatIds: reorderHats.map((h) => h._id) }),
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      setSuccessMessage('Hat order saved! Collection page will show this order.');
                      setShowSuccessPopup(true);
                      setShowReorderPopup(false);
                      setHatsSortBy('display_order');
                      await fetchHats('display_order');
                    } else {
                      throw new Error(data.error || 'Failed to save order');
                    }
                  } catch (err: any) {
                    setSuccessMessage(`Error: ${err.message}`);
                    setShowSuccessPopup(true);
                  } finally {
                    setSavingOrder(false);
                  }
                }}
                disabled={savingOrder}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {savingOrder ? 'Saving...' : 'Save order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hat Popup */}
      {showEditPopup && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn overflow-y-auto py-8"
          onClick={() => {
            if (!savingEdit) {
              setShowEditPopup(false);
              setEditingHat(null);
            }
          }}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl border-4 border-purple-200 max-w-4xl w-full mx-4 my-8 transform animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                if (!savingEdit) {
                  setShowEditPopup(false);
                  setEditingHat(null);
                }
              }}
              disabled={savingEdit}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors text-2xl z-10 disabled:opacity-50"
            >
              ×
            </button>

            {/* Popup Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">
                {editingHat ? `Edit Hat: ${editingHat.title}` : 'Add New Hat'}
              </h2>
              <p className="text-sm opacity-90 mt-1">
                {editingHat ? 'Update hat details below' : 'Fill in the details to create a new hat'}
              </p>
            </div>

            {/* Form Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name (Title)</label>
                  <input
                    type="text"
                    value={editFormData.title || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Hat name"
                  />
                </div>

                {/* Subtitle */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={editFormData.hatSubtitle || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, hatSubtitle: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Hat subtitle"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (€)</label>
                  <input
                    type="number"
                    value={editFormData.price || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Discounted Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Discounted Price (€)</label>
                  <input
                    type="number"
                    value={editFormData.discountedPrice ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, discountedPrice: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Leave empty for no discount"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Size</label>
                  <input
                    type="text"
                    value={editFormData.hatSize || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, hatSize: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="e.g., M, L, One Size"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <input
                    type="text"
                    value={editFormData.color || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Hat color"
                  />
                </div>

                {/* Is Active Checkbox */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isActive || false}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Mark as Active (visible on collections page)
                    </span>
                  </label>
                </div>

                {/* Is Sold Checkbox */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isSold || false}
                      onChange={(e) => setEditFormData({ ...editFormData, isSold: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-gray-300 text-amber-600 focus:ring-amber-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Mark as SOLD (not available to buy)
                    </span>
                  </label>
                </div>

                {/* Description - IMAGINE */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = HAT_IMAGINE_MESSAGES[hatImagineMsgIdx.current % HAT_IMAGINE_MESSAGES.length];
                        hatImagineMsgIdx.current += 1;
                        const current = editFormData.hatDescription || '';
                        const sep = current ? (current.endsWith(' ') || current.endsWith('\n') ? '' : ' ') : '';
                        setEditFormData({ ...editFormData, hatDescription: current + sep + msg });
                      }}
                      className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Imagine
                    </button>
                  </div>
                  <textarea
                    value={editFormData.hatDescription || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, hatDescription: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Hat description"
                    rows={4}
                  />
                </div>

                {/* Main Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Main Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editFormData.mainHatImage || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, mainHatImage: e.target.value })}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="https://... or upload image below"
                    />
                    {editFormData.mainHatImage && (
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, mainHatImage: '' })}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  {/* File Upload */}
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">Or upload image (uploads to Supabase):</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            // Show loading state
                            setEditFormData({ ...editFormData, mainHatImage: 'uploading...' });
                            
                            // Upload to Wix and get wix:image:// URL
                            const wixImageUrl = await uploadImageToWix(file);
                            
                            // Update form with the wix:image:// URL
                            setEditFormData({ ...editFormData, mainHatImage: wixImageUrl });
                            
                            alert('✅ Image uploaded successfully!');
                          } catch (error: any) {
                            console.error('Upload error:', error);
                            alert(`❌ Upload failed: ${error.message}`);
                            setEditFormData({ ...editFormData, mainHatImage: '' });
                          }
                        }
                        // Clear the input so the same file can be uploaded again if needed
                        e.target.value = '';
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors cursor-pointer text-sm"
                    />
                  </div>
                  {editFormData.mainHatImage === 'uploading...' ? (
                    <div className="mt-2 relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-500 text-xs">Uploading...</div>
                    </div>
                  ) : editFormData.mainHatImage && (
                    editFormData.mainHatImage.startsWith('http://') || 
                    editFormData.mainHatImage.startsWith('https://') || 
                    editFormData.mainHatImage.startsWith('wix:') ||
                    editFormData.mainHatImage.startsWith('data:') ? (
                      <div className="mt-2 relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300">
                        <img 
                          src={
                            editFormData.mainHatImage.startsWith('wix:') 
                              ? (convertWixImageUrl(editFormData.mainHatImage) || editFormData.mainHatImage)
                              : editFormData.mainHatImage
                          } 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : null
                  )}
                </div>

                {/* Top Eyes Video URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Top Eyes Video URL</label>
                  <p className="text-xs text-gray-500 mb-1">Paste wix:video:// from Wix Media Manager. Existing value prepopulates—save without changes to keep it.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editFormData.topVideoEyes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, topVideoEyes: e.target.value })}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="wix:video://v1/... or upload video below"
                    />
                    {editFormData.topVideoEyes && (
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, topVideoEyes: '' })}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  {/* File Upload */}
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">Or upload video (uploads to Supabase):</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            // Show loading state
                            setEditFormData({ ...editFormData, topVideoEyes: 'uploading...' });
                            
                            // Upload to Wix and get wix:video:// URL
                            const wixVideoUrl = await uploadVideoToWix(file);
                            
                            // Update form with the wix:video:// URL
                            setEditFormData({ ...editFormData, topVideoEyes: wixVideoUrl });
                            
                            alert('✅ Video uploaded successfully!');
                          } catch (error: any) {
                            console.error('Upload error:', error);
                            alert(`❌ Upload failed: ${error.message}`);
                            setEditFormData({ ...editFormData, topVideoEyes: '' });
                          }
                        }
                        // Clear the input so the same file can be uploaded again if needed
                        e.target.value = '';
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors cursor-pointer text-sm"
                    />
                  </div>
                </div>

                {/* Making Of Video URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Promo/Making Of Video URL</label>
                  <p className="text-xs text-gray-500 mb-1">Paste wix:video:// from Wix Media Manager. Existing value prepopulates—save without changes to keep it.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editFormData.makingOfProductPage || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, makingOfProductPage: e.target.value })}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="wix:video://v1/... or upload video below"
                    />
                    {editFormData.makingOfProductPage && (
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, makingOfProductPage: '' })}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  {/* File Upload */}
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">Or upload video (uploads to Supabase):</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            // Show loading state
                            setEditFormData({ ...editFormData, makingOfProductPage: 'uploading...' });
                            
                            // Upload to Wix and get wix:video:// URL
                            const wixVideoUrl = await uploadVideoToWix(file);
                            
                            // Update form with the wix:video:// URL
                            setEditFormData({ ...editFormData, makingOfProductPage: wixVideoUrl });
                            
                            alert('✅ Video uploaded successfully!');
                          } catch (error: any) {
                            console.error('Upload error:', error);
                            alert(`❌ Upload failed: ${error.message}`);
                            setEditFormData({ ...editFormData, makingOfProductPage: '' });
                          }
                        }
                        // Clear the input so the same file can be uploaded again if needed
                        e.target.value = '';
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors cursor-pointer text-sm"
                    />
                  </div>
                </div>

                {/* Gallery Images */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gallery Images</label>
                  <p className="text-xs text-gray-500 mb-1">Paste wix:image:// URLs (one per line). Existing from CMS prepopulate. Drag to reorder.</p>
                  <div className="flex gap-2 mb-2">
                    <textarea
                      value={Array.isArray(editFormData.gallery) 
                        ? editFormData.gallery.map((img: any) => typeof img === 'string' ? img : (img?.src || '')).filter(Boolean).join('\n')
                        : ''}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
                        const gallery = lines.map((line: string) => {
                          const parsed = parseWixImageToGalleryItem(line);
                          if (parsed) return parsed;
                          const existing = (editFormData.gallery || []).find((g: any) => (typeof g === 'object' ? g?.src : g) === line);
                          if (existing) return existing;
                          return { src: line, alt: '', description: '', fileName: line.split('/').pop() || 'image', slug: '', title: '', type: 'image' as const, settings: { width: 3024, height: 3024, focalPoint: [0.5, 0.5] as [number, number] } };
                        });
                        setEditFormData({ ...editFormData, gallery });
                      }}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="wix:image://v1/...&#10;wix:image://v1/..."
                      rows={3}
                    />
                    {Array.isArray(editFormData.gallery) && editFormData.gallery.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, gallery: [] })}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold h-fit"
                      >
                        ✕ Clear All
                      </button>
                    )}
                  </div>
                  {/* File Upload for Gallery */}
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">Or upload gallery images (uploads to Supabase):</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          try {
                            const existingGallery = Array.isArray(editFormData.gallery) ? editFormData.gallery : [];
                            
                            // Show uploading state
                            alert(`⏳ Uploading ${files.length} image(s) to Supabase...`);
                            
                            // Upload all files to Supabase
                            const uploadPromises = files.map(file => uploadImageToWix(file));
                            const imageUrls = await Promise.all(uploadPromises);
                            
                            // Parse URLs into gallery items
                            const newItems = imageUrls.map((url: string) => parseWixImageToGalleryItem(url)).filter(Boolean);
                            
                            // Add to gallery
                            setEditFormData({ ...editFormData, gallery: [...existingGallery, ...newItems] });
                            
                            alert(`✅ Successfully uploaded ${files.length} image(s)!`);
                          } catch (error: any) {
                            console.error('Gallery upload error:', error);
                            alert(`❌ Upload failed: ${error.message}`);
                          }
                        }
                        // Clear the input so the same files can be uploaded again if needed
                        e.target.value = '';
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors cursor-pointer text-sm"
                    />
                  </div>
                  {Array.isArray(editFormData.gallery) && editFormData.gallery.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Drag images to reorder (order matches product page)</p>
                      <div className="flex gap-2 flex-wrap">
                        {editFormData.gallery.map((img: any, idx: number) => {
                          const imgUrl = getGalleryItemDisplayUrl(img) || (typeof img === 'string' ? img : img?.src);
                          return imgUrl ? (
                            <div
                              key={`${idx}-${imgUrl}`}
                              draggable
                              onDragStart={() => setDraggedGalleryIdx(idx)}
                              onDragEnd={() => setDraggedGalleryIdx(null)}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const dropIdx = idx;
                                const dragIdx = draggedGalleryIdx;
                                setDraggedGalleryIdx(null);
                                if (dragIdx == null || dragIdx === dropIdx) return;
                                const gallery = [...editFormData.gallery];
                                const [removed] = gallery.splice(dragIdx, 1);
                                gallery.splice(dropIdx, 0, removed);
                                setEditFormData({ ...editFormData, gallery });
                              }}
                              className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing group transition-all ${draggedGalleryIdx === idx ? 'opacity-50 border-purple-500 scale-95' : 'border-gray-300'}`}
                            >
                              <span className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded z-10">{idx + 1}</span>
                              <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newGallery = editFormData.gallery.filter((_: any, i: number) => i !== idx);
                                  setEditFormData({ ...editFormData, gallery: newGallery });
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer with Save Button */}
            <div className="bg-gray-50 p-6 rounded-b-2xl flex justify-between items-center gap-4">
              <div>
                {editingHat && (
                  <button
                    onClick={handleDeleteHat}
                    disabled={savingEdit}
                    className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
                  >
                    Delete Item
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (!savingEdit) {
                      setShowEditPopup(false);
                      setEditingHat(null);
                    }
                  }}
                  disabled={savingEdit}
                  className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-all duration-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHat}
                  disabled={savingEdit}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingEdit ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Home Decor Popup */}
      {showDecorEditPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn overflow-y-auto py-8"
          onClick={() => {
            if (!savingEditDecor) {
              setShowDecorEditPopup(false);
              setEditingDecor(null);
            }
          }}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl border-4 border-amber-200 max-w-2xl w-full mx-4 my-8 transform animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (!savingEditDecor) {
                  setShowDecorEditPopup(false);
                  setEditingDecor(null);
                }
              }}
              disabled={savingEditDecor}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors text-2xl z-10 disabled:opacity-50"
            >
              ×
            </button>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">
                {editingDecor ? `Edit: ${editingDecor.title}` : 'Add New Item'}
              </h2>
              <p className="text-sm opacity-90 mt-1">
                {editingDecor ? 'Update item details below' : 'Fill in the details to create a new home decor item'}
              </p>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={editDecorFormData.title || ''}
                    onChange={(e) => setEditDecorFormData({ ...editDecorFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    placeholder="Item name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (€)</label>
                    <input
                      type="number"
                      value={editDecorFormData.price ?? 0}
                      onChange={(e) => setEditDecorFormData({ ...editDecorFormData, price: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discounted Price (€)</label>
                    <input
                      type="number"
                      value={editDecorFormData.discountedPrice ?? ''}
                      onChange={(e) => setEditDecorFormData({ ...editDecorFormData, discountedPrice: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      placeholder="Leave empty for no discount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editDecorFormData.isActive || false}
                      onChange={(e) => setEditDecorFormData({ ...editDecorFormData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-gray-300 text-green-600 focus:ring-amber-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-700">Mark as Active (visible on home decor page)</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = DECOR_IMAGINE_MESSAGES[imagineMsgIdx.current % DECOR_IMAGINE_MESSAGES.length];
                        imagineMsgIdx.current += 1;
                        const current = editDecorFormData.description || '';
                        const sep = current ? (current.endsWith(' ') || current.endsWith('\n') ? '' : ' ') : '';
                        setEditDecorFormData({ ...editDecorFormData, description: current + sep + msg });
                      }}
                      className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Imagine
                    </button>
                  </div>
                  <textarea
                    value={editDecorFormData.description || ''}
                    onChange={(e) => setEditDecorFormData({ ...editDecorFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    placeholder="Item description"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Main Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editDecorFormData.mainImage || ''}
                      onChange={(e) => setEditDecorFormData({ ...editDecorFormData, mainImage: e.target.value })}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      placeholder="https://... or wix:image:// or upload below"
                    />
                    {editDecorFormData.mainImage && (
                      <button
                        type="button"
                        onClick={() => setEditDecorFormData({ ...editDecorFormData, mainImage: '' })}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">Or upload image:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setEditDecorFormData({ ...editDecorFormData, mainImage: 'uploading...' });
                            const url = await uploadDecorImage(file);
                            setEditDecorFormData({ ...editDecorFormData, mainImage: url });
                            alert('✅ Image uploaded successfully!');
                          } catch (err: any) {
                            alert(`❌ Upload failed: ${err?.message || 'Unknown error'}`);
                            setEditDecorFormData({ ...editDecorFormData, mainImage: '' });
                          }
                        }
                        e.target.value = '';
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 transition-colors cursor-pointer text-sm"
                    />
                  </div>
                  {editDecorFormData.mainImage && editDecorFormData.mainImage !== 'uploading...' &&
                    (editDecorFormData.mainImage.startsWith('http') || editDecorFormData.mainImage.startsWith('data:')) && (
                      <div className="mt-2 relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300">
                        <img
                          src={editDecorFormData.mainImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (!savingEditDecor) {
                    setShowDecorEditPopup(false);
                    setEditingDecor(null);
                  }
                }}
                disabled={savingEditDecor}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-all duration-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDecor}
                disabled={savingEditDecor}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
              >
                {savingEditDecor ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Raffle Popup */}
      {viewingRaffle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setViewingRaffle(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-900">View Raffle</h2>
              <button
                onClick={() => setViewingRaffle(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Title</p>
                <p className="text-xl font-bold text-gray-900">{viewingRaffle.name}</p>
              </div>
              {viewingRaffle.subtitle && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Subtitle</p>
                  <p className="text-gray-700">{viewingRaffle.subtitle}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                  <p className={`font-semibold ${viewingRaffle.isActive ? 'text-emerald-600' : 'text-gray-600'}`}>
                    {viewingRaffle.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Tickets Max</p>
                  <p className="font-semibold text-gray-900">{viewingRaffle.ticketLimit}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Stars per Ticket</p>
                  <p className="font-semibold text-gray-900">{viewingRaffle.ticketCostStars}</p>
                </div>
                {(viewingRaffle.ticketLimitPerUser ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Max per User</p>
                    <p className="font-semibold text-gray-900">{viewingRaffle.ticketLimitPerUser}</p>
                  </div>
                )}
                {(viewingRaffle.valueOfPot ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Pot Value</p>
                    <p className="font-semibold text-emerald-600">€{(viewingRaffle.valueOfPot ?? 0).toLocaleString()}</p>
                  </div>
                )}
              </div>
              {viewingRaffleStats && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-700 uppercase mb-2">Live Stats</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-2xl font-bold text-emerald-800">{viewingRaffleStats.ticketsSold}</p>
                      <p className="text-sm text-emerald-600">Tickets Sold</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-800">{viewingRaffleStats.uniqueHolders}</p>
                      <p className="text-sm text-emerald-600">Unique Holders</p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Schedule</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium">Visibility:</span> {viewingRaffle.visibilityDate ? new Date(viewingRaffle.visibilityDate).toLocaleString() : '-'}</p>
                  <p><span className="font-medium">Start:</span> {viewingRaffle.startDate ? new Date(viewingRaffle.startDate).toLocaleString() : '-'}</p>
                  <p><span className="font-medium">End:</span> {viewingRaffle.endDate ? new Date(viewingRaffle.endDate).toLocaleString() : '-'}</p>
                </div>
              </div>
              {(viewingRaffle.hatIds?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Hats in Raffle</p>
                  <div className="flex flex-wrap gap-2">
                    {(viewingRaffle.hatIds || []).map((hid: string) => {
                      const hat = hats.find((h) => h._id === hid);
                      return hat ? (
                        <div key={hid} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-emerald-200">
                          <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                            {hat.mainHatImage ? (
                              <WixImage src={hat.mainHatImage} alt={hat.title || 'Hat'} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">🎩</div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{hat.title || 'Untitled'}</span>
                        </div>
                      ) : (
                        <div key={hid} className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1 text-xs text-gray-500">
                          {hid.slice(0, 8)}…
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-wrap gap-3">
              <Link
                href="/raffles"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[120px] px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 text-center"
              >
                View Live
              </Link>
              <button
                onClick={() => {
                  handleEditRaffle(viewingRaffle);
                  setViewingRaffle(null);
                  setShowCreateRafflePopup(true);
                }}
                className="flex-1 min-w-[120px] px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
              >
                Edit Raffle
              </button>
              <button
                onClick={() => setViewingRaffle(null)}
                className="flex-1 min-w-[120px] px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save to Raffle Popup */}
      {showSaveToRafflePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && !savingRaffle && setShowSaveToRafflePopup(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Save {selectedRaffleHats.size} hat(s) to Raffle</h2>
              <p className="text-sm text-gray-600 mt-1">Create a new raffle or add to an existing one.</p>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowSaveToRafflePopup(false);
                  const now = new Date();
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const toLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                  const tomorrow = new Date(now);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const weekLater = new Date(now);
                  weekLater.setDate(weekLater.getDate() + 7);
                  setCreateRaffleFormData({
                    name: '',
                    subtitle: '',
                    isActive: true,
                    visibilityDate: toLocal(now),
                    startDate: toLocal(tomorrow),
                    endDate: toLocal(weekLater),
                    ticketLimit: 100,
                    ticketCostStars: 5,
                    ticketLimitPerUser: 0,
                    valueOfPot: 0,
                    hatIds: Array.from(selectedRaffleHats),
                  });
                  setShowCreateRafflePopup(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600"
              >
                Create New Raffle
              </button>
              {raffles.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-gray-700 mt-2">Or add to existing:</p>
                  {raffles.map((r) => (
                    <button
                      key={r._id}
                      onClick={() => handleAddHatsToRaffle(r._id)}
                      disabled={savingRaffle}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl text-left flex justify-between items-center disabled:opacity-50"
                    >
                      <span>{r.name}</span>
                      {savingRaffle ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <span className="text-teal-600 font-semibold">Add</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => !savingRaffle && setShowSaveToRafflePopup(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Raffle Popup */}
      {showCreateRafflePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingRaffle) {
              setShowCreateRafflePopup(false);
              setEditingRaffleId(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{editingRaffleId ? 'Edit Raffle' : 'Create Raffle'}</h2>
              <p className="text-sm text-gray-600 mt-1">Visibility date = when it appears. Start = when tickets go live. End = when winner is chosen.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={createRaffleFormData.name}
                  onChange={(e) => setCreateRaffleFormData({ ...createRaffleFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  placeholder="Raffle name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={createRaffleFormData.subtitle}
                  onChange={(e) => setCreateRaffleFormData({ ...createRaffleFormData, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  placeholder="Optional subtitle"
                />
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createRaffleFormData.isActive}
                    onChange={(e) => setCreateRaffleFormData({ ...createRaffleFormData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-700">Is Active</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility Date</label>
                <input
                  type="datetime-local"
                  value={createRaffleFormData.visibilityDate}
                  onChange={(e) => setCreateRaffleFormData({ ...createRaffleFormData, visibilityDate: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">When raffle appears to users (countdown to start)</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  type="datetime-local"
                  value={createRaffleFormData.startDate}
                  onChange={(e) => setCreateRaffleFormData({ ...createRaffleFormData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">When users can buy raffle tickets</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="datetime-local"
                  value={createRaffleFormData.endDate}
                  onChange={(e) => setCreateRaffleFormData({ ...createRaffleFormData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">When winner is chosen at random</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Raffle Ticket Limit</label>
                <input
                  type="number"
                  value={createRaffleFormData.ticketLimit}
                  onChange={(e) => setCreateRaffleFormData({ ...createRaffleFormData, ticketLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Total tickets available</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Limit Per User</label>
                <input
                  type="number"
                  value={createRaffleFormData.ticketLimitPerUser ?? 0}
                  onChange={(e) => setCreateRaffleFormData({ ...createRaffleFormData, ticketLimitPerUser: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Max tickets per user (0 = no limit)</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Value of Pot (€)</label>
                <input
                  type="number"
                  value={createRaffleFormData.valueOfPot ?? 0}
                  onChange={(e) => setCreateRaffleFormData({ ...createRaffleFormData, valueOfPot: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Total value of the prize pot in euros</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cost in Stars (per ticket)</label>
                <select
                  value={createRaffleFormData.ticketCostStars}
                  onChange={(e) => setCreateRaffleFormData({ ...createRaffleFormData, ticketCostStars: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                >
                  <option value={5}>5 stars</option>
                  <option value={10}>10 stars</option>
                  <option value={15}>15 stars</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (!savingRaffle) {
                    setShowCreateRafflePopup(false);
                    setEditingRaffleId(null);
                  }
                }}
                disabled={savingRaffle}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRaffle}
                disabled={savingRaffle}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 flex items-center gap-2"
              >
                {savingRaffle ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingRaffleId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingRaffleId ? 'Update' : 'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
