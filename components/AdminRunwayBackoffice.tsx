'use client';

import { useEffect, useState } from 'react';
import WixImage from '@/components/WixImage';
import { Hat } from '@/lib/wix-types';

interface RunwayEvent {
  id: string;
  title: string;
  subtitle: string | null;
  eventDate: string;
  startTime: string | null;
  guestListLimit: number | null;
  ticketLimit: number | null;
  ticketPrice: number;
  guestListEnabled: boolean;
  ticketsEnabled: boolean;
  itemsRevealHoursAfterStart: number;
  hatIds: string[];
  status: string;
  itemsRevealed?: boolean;
  itemsRevealAt?: string;
  attendees: { guests: number; tickets: number; ticketSales?: number };
  totalAttendees: number;
  guests?: { id: string; name: string; email: string; phone: string; created_at: string }[];
  tickets?: { id: string; name: string; email: string; phone: string; quantity: number; total_paid: number; payment_status: string; created_at: string }[];
}

interface AdminRunwayBackofficeProps {
  hats: Hat[];
}

export default function AdminRunwayBackoffice({ hats }: AdminRunwayBackofficeProps) {
  const [events, setEvents] = useState<RunwayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    eventDate: '',
    startTime: '',
    guestListLimit: 50,
    ticketLimit: 50,
    ticketPrice: 0,
    guestListEnabled: true,
    ticketsEnabled: false,
    itemsRevealHoursAfterStart: 0,
    hatIds: [] as string[],
    status: 'upcoming',
  });

  const pad = (n: number) => String(n).padStart(2, '0');
  const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const fetchEvents = () => {
    setLoading(true);
    fetch('/api/admin/runway-events')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEvents(d.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => statusFilter === 'all' || e.status === statusFilter);

  // Dashboard stats
  const stats = {
    totalEvents: events.length,
    totalGuests: events.reduce((s, e) => s + (e.attendees?.guests ?? 0), 0),
    totalTickets: events.reduce((s, e) => s + (e.attendees?.tickets ?? 0), 0),
    totalRevenue: events.reduce((s, e) => s + (e.attendees?.ticketSales ?? 0), 0),
  };

  const openCreate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData({
      title: '',
      subtitle: '',
      eventDate: toDateStr(tomorrow),
      startTime: '19:00',
      guestListLimit: 50,
      ticketLimit: 50,
      ticketPrice: 0,
      guestListEnabled: true,
      ticketsEnabled: false,
      itemsRevealHoursAfterStart: 0,
      hatIds: [],
      status: 'upcoming',
    });
    setEditingId(null);
    setShowCreatePopup(true);
  };

  const openEdit = (e: RunwayEvent) => {
    setFormData({
      title: e.title,
      subtitle: e.subtitle || '',
      eventDate: e.eventDate,
      startTime: e.startTime || '19:00',
      guestListLimit: e.guestListLimit ?? 50,
      ticketLimit: e.ticketLimit ?? 50,
      ticketPrice: e.ticketPrice,
      guestListEnabled: e.guestListEnabled,
      ticketsEnabled: e.ticketsEnabled,
      itemsRevealHoursAfterStart: e.itemsRevealHoursAfterStart,
      hatIds: e.hatIds || [],
      status: e.status,
    });
    setEditingId(e.id);
    setShowCreatePopup(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.eventDate) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/runway-events/${editingId}` : '/api/admin/runway-events';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, eventDate: formData.eventDate }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreatePopup(false);
        fetchEvents();
      } else {
        alert(data.error || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this runway event? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/runway-events/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchEvents();
    } else {
      const d = await res.json();
      alert(d.error || 'Failed to delete');
    }
  };

  const copyEmails = (list: { email: string }[], label: string) => {
    const emails = list.map((x) => x.email).filter(Boolean).join('\n');
    if (!emails) {
      alert(`No ${label} to copy`);
      return;
    }
    navigator.clipboard.writeText(emails).then(() => alert(`Copied ${list.length} email(s) to clipboard`));
  };

  const escapeCsv = (v: string | number) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s ? `"${s}"` : '""';
  };

  const exportCsv = (event: RunwayEvent, type: 'guests' | 'tickets') => {
    const rows = type === 'guests' ? (event.guests || []) : (event.tickets || []);
    if (rows.length === 0) {
      alert(`No ${type} to export`);
      return;
    }
    const headers = type === 'guests' ? ['Name', 'Email', 'Phone', 'Signed up'] : ['Name', 'Email', 'Phone', 'Quantity', 'Total paid (€)', 'Status', 'Purchased'];
    const csvRows = [
      headers.join(','),
      ...rows.map((r) => {
        const date = r.created_at ? new Date(r.created_at).toLocaleString() : '';
        if (type === 'guests') {
          return [escapeCsv((r as any).name || ''), escapeCsv(r.email), escapeCsv((r as any).phone || ''), escapeCsv(date)].join(',');
        }
        return [escapeCsv((r as any).name || r.email), escapeCsv(r.email), escapeCsv((r as any).phone || ''), (r as any).quantity || 1, (r as any).total_paid ?? 0, escapeCsv((r as any).payment_status || ''), escapeCsv(date)].join(',');
      }),
    ];
    const blob = new Blob(['\ufeff' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleHat = (hatId: string) => {
    setFormData((prev) => ({
      ...prev,
      hatIds: prev.hatIds.includes(hatId)
        ? prev.hatIds.filter((h) => h !== hatId)
        : [...prev.hatIds, hatId],
    }));
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return s;
    }
  };

  const formatRevealAt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const statusColor = (s: string) => {
    if (s === 'draft') return 'bg-gray-100 text-gray-700';
    if (s === 'upcoming') return 'bg-emerald-100 text-emerald-800';
    return 'bg-amber-100 text-amber-800';
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border-2 border-fuchsia-200 shadow">
          <p className="text-sm font-semibold text-gray-600">Events</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border-2 border-fuchsia-200 shadow">
          <p className="text-sm font-semibold text-gray-600">Guest List</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalGuests}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border-2 border-fuchsia-200 shadow">
          <p className="text-sm font-semibold text-gray-600">Tickets Sold</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border-2 border-fuchsia-200 shadow">
          <p className="text-sm font-semibold text-gray-600">Revenue</p>
          <p className="text-2xl font-bold text-emerald-700">€{stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold rounded-xl hover:from-fuchsia-600 hover:to-pink-600 transition-all shadow-lg"
        >
          Create Runway Event
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 border-2 border-purple-200 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border-2 border-purple-200 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Runway Events</h3>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'all' ? 'Create your first runway event.' : `No ${statusFilter} events.`}
          </p>
          {statusFilter === 'all' && (
            <button onClick={openCreate} className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold rounded-xl">
              Create Event
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEvents.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-xl border-2 border-fuchsia-200 shadow-lg overflow-hidden"
            >
              {/* Event header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-xl text-gray-900">{e.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(e.status)}`}>
                        {e.status}
                      </span>
                    </div>
                    {e.subtitle && <p className="text-sm text-gray-600 mt-0.5">{e.subtitle}</p>}
                    <p className="text-sm text-gray-500 mt-1">{formatDate(e.eventDate)}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-base md:text-lg">
                      {e.guestListEnabled && (
                        <span className="font-semibold text-gray-800">
                          Guest list: {e.attendees.guests}/{e.guestListLimit ?? '∞'} guests
                        </span>
                      )}
                      {e.ticketsEnabled && (
                        <span className="font-semibold text-gray-800">
                          Tickets: {e.attendees.tickets}/{e.ticketLimit ?? '∞'} sold · €{(e.attendees.ticketSales ?? 0).toFixed(2)} sales
                        </span>
                      )}
                      {!e.guestListEnabled && !e.ticketsEnabled && (
                        <span className="font-semibold text-gray-800">Attendees: {e.totalAttendees}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(e)}
                      className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Items section - only when revealed */}
              {(e.hatIds?.length ?? 0) > 0 && (
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Items (hats) for this runway</h4>
                  {e.itemsRevealed ? (
                    <div className="flex flex-wrap gap-3">
                      {(e.hatIds || []).map((hid) => {
                        const hat = hats.find((h) => h._id === hid);
                        return hat ? (
                          <div
                            key={hid}
                            className="flex items-center gap-2 bg-white rounded-lg p-2 border border-fuchsia-200 shadow-sm"
                          >
                            <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                              {hat.mainHatImage ? (
                                <WixImage src={hat.mainHatImage} alt={hat.title || 'Hat'} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">🎩</div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{hat.title || 'Hat'}</span>
                          </div>
                        ) : (
                          <div key={hid} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200 text-gray-500 text-sm">
                            <span>Unknown hat ({hid})</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                      🔒 Items will be revealed {e.itemsRevealAt ? `on ${formatRevealAt(e.itemsRevealAt)}` : `${e.itemsRevealHoursAfterStart || 0} hours after event start`}
                    </p>
                  )}
                </div>
              )}

              {/* Attendance: guests + tickets */}
              <div className="p-5 grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">Guest List ({e.guests?.length ?? 0})</h4>
                    <div className="flex gap-2">
                      {e.guests && e.guests.length > 0 && (
                        <>
                          <button
                            onClick={() => copyEmails(e.guests!, 'guests')}
                            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded font-medium"
                          >
                            Copy emails
                          </button>
                          <button
                            onClick={() => exportCsv(e, 'guests')}
                            className="text-xs px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-medium"
                          >
                            Export CSV
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {(!e.guests || e.guests.length === 0) ? (
                    <p className="text-gray-500 text-sm">No guest list signups</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {e.guests.map((g) => (
                        <div key={g.id} className="p-2 bg-gray-50 rounded text-sm">
                          <p className="font-medium text-gray-900">{g.name}</p>
                          <p className="text-gray-600">{g.email}</p>
                          {g.phone && <p className="text-gray-500">{g.phone}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">Tickets ({e.tickets?.length ?? 0})</h4>
                    <div className="flex gap-2">
                      {e.tickets && e.tickets.length > 0 && (
                        <>
                          <button
                            onClick={() => copyEmails(e.tickets!, 'tickets')}
                            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded font-medium"
                          >
                            Copy emails
                          </button>
                          <button
                            onClick={() => exportCsv(e, 'tickets')}
                            className="text-xs px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-medium"
                          >
                            Export CSV
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {(!e.tickets || e.tickets.length === 0) ? (
                    <p className="text-gray-500 text-sm">No ticket purchases</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {e.tickets.map((t) => (
                        <div key={t.id} className="p-2 bg-gray-50 rounded text-sm">
                          <p className="font-medium text-gray-900">{t.name || t.email}</p>
                          <p className="text-gray-600">{t.email}</p>
                          {t.phone && <p className="text-gray-500">{t.phone}</p>}
                          <p className="text-gray-700 mt-0.5">Qty: {t.quantity} · €{Number(t.total_paid).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Popup */}
      {showCreatePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? 'Edit Runway Event' : 'Create Runway Event'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Runway Show March 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Event Date *</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.guestListEnabled}
                    onChange={(e) => setFormData({ ...formData, guestListEnabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Guest List</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ticketsEnabled}
                    onChange={(e) => setFormData({ ...formData, ticketsEnabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Paid Tickets</span>
                </label>
              </div>
              {formData.guestListEnabled && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Guest List Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.guestListLimit}
                    onChange={(e) => setFormData({ ...formData, guestListLimit: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
              {formData.ticketsEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ticket Limit</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.ticketLimit}
                      onChange={(e) => setFormData({ ...formData, ticketLimit: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ticket Price (€)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formData.ticketPrice}
                      onChange={(e) => setFormData({ ...formData, ticketPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Items Reveal (hours after start)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.itemsRevealHoursAfterStart}
                  onChange={(e) => setFormData({ ...formData, itemsRevealHoursAfterStart: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0 = immediate"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="draft">Draft</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hats (items for this event)</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {hats.slice(0, 20).map((hat) => (
                    <label
                      key={hat._id}
                      className={`flex items-center gap-2 rounded-lg p-2 border cursor-pointer ${
                        formData.hatIds.includes(hat._id) ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.hatIds.includes(hat._id)}
                        onChange={() => toggleHat(hat._id)}
                        className="sr-only"
                      />
                      <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                        {hat.mainHatImage ? (
                          <WixImage src={hat.mainHatImage} alt={hat.title || 'Hat'} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🎩</div>
                        )}
                      </div>
                      <span className="text-sm font-medium line-clamp-1 max-w-[100px]">{hat.title || 'Hat'}</span>
                    </label>
                  ))}
                  {hats.length > 20 && <p className="text-xs text-gray-500 w-full">Showing first 20 hats</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !formData.title || !formData.eventDate}
                className="px-6 py-2 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowCreatePopup(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
