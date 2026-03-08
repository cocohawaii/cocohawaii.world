'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function AccountSettingsPage() {
  const { member, isLoading, refetch } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: '',
  });

  useEffect(() => {
    if (!isLoading && !member) {
      window.location.href = '/login';
    }
  }, [member, isLoading]);

  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.memberName || member.fullName || '',
        phone: member.phone || '',
        shippingAddress: member.shippingAddress || '',
        shippingCity: member.shippingCity || '',
        shippingPostalCode: member.shippingPostalCode || '',
        shippingCountry: member.shippingCountry || '',
      });
    }
  }, [member]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/members/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName || undefined,
          phone: formData.phone || undefined,
          shippingAddress: formData.shippingAddress || undefined,
          shippingCity: formData.shippingCity || undefined,
          shippingPostalCode: formData.shippingPostalCode || undefined,
          shippingCountry: formData.shippingCountry || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      await refetch();
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50">
        <p className="text-gray-500">Loading your account...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/member/dashboard" className="text-gray-600 hover:text-black transition-colors mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="bg-white rounded-xl p-6 border-2 border-red-200">
            <p className="text-red-600">Account not found.</p>
            <Link href="/member/dashboard" className="mt-4 inline-block text-purple-600 font-semibold hover:underline">
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/member/dashboard" className="text-gray-600 hover:text-black transition-colors mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600 mb-8">Your account details (stored in Supabase)</p>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-xl text-green-800">
            ✓ Profile updated successfully!
          </div>
        )}

        <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile</h2>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Shipping Address</label>
                    <input
                      type="text"
                      value={formData.shippingAddress}
                      onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="Street address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.shippingCity}
                        onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={formData.shippingPostalCode}
                        onChange={(e) => setFormData({ ...formData, shippingPostalCode: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        placeholder="Postal code"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.shippingCountry}
                      onChange={(e) => setFormData({ ...formData, shippingCountry: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="Country"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      disabled={saving}
                      className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500">Name</dt>
                      <dd className="text-lg font-medium text-gray-900">{member.memberName || member.fullName || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Email</dt>
                      <dd className="text-lg font-medium text-gray-900">{member.memberEmail || '—'}</dd>
                    </div>
                    {(member.phone || formData.phone) && (
                      <div>
                        <dt className="text-xs text-gray-500">Phone</dt>
                        <dd className="text-lg font-medium text-gray-900">{member.phone || formData.phone}</dd>
                      </div>
                    )}
                    {member.memberTag && (
                      <div>
                        <dt className="text-xs text-gray-500">Member type</dt>
                        <dd className="text-lg font-medium text-gray-900 capitalize">{member.memberTag}</dd>
                      </div>
                    )}
                    {(member.shippingAddress || formData.shippingAddress) && (
                      <div>
                        <dt className="text-xs text-gray-500">Shipping Address</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {[member.shippingAddress || formData.shippingAddress, member.shippingCity || formData.shippingCity, member.shippingPostalCode || formData.shippingPostalCode, member.shippingCountry || formData.shippingCountry].filter(Boolean).join(', ')}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
                  >
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
