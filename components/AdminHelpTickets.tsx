'use client';

import { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  email: string;
  name: string | null;
  isMember: boolean;
  unreadByAdmin: boolean;
  lastMessageAt: string;
  createdAt: string;
}

interface Message {
  id: string;
  senderType: string;
  body: string;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  status: string;
  email: string;
  name: string | null;
  isMember: boolean;
  createdAt: string;
  lastMessageAt: string;
}

interface AdminHelpTicketsProps {
  onRefreshCount?: () => void;
}

export default function AdminHelpTickets({ onRefreshCount }: AdminHelpTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ ticket: TicketDetail; messages: Message[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string>('');

  const fetchTickets = () => {
    setLoading(true);
    fetch('/api/admin/help-tickets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTickets(data.tickets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    setDetail(null);
    fetch(`/api/admin/help-tickets/${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDetail({ ticket: data.ticket, messages: data.messages || [] });
          setStatus(data.ticket.status);
          fetchTickets(); // Refresh list to clear "New" badge after marking read
        }
        setDetailLoading(false);
      })
      .catch(() => setDetailLoading(false));
  }, [selectedId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/help-tickets/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim(), status: status || undefined }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setDetail((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, data.message],
              }
            : null
        );
        setReply('');
        fetchTickets();
        onRefreshCount?.();
      }
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/help-tickets/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      setDetail((prev) => (prev ? { ...prev, ticket: { ...prev.ticket, status: newStatus } } : null));
      fetchTickets();
    }
  };

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open':
        return 'bg-amber-100 text-amber-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const unrespondedCount = tickets.filter((t) => t.unreadByAdmin).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Help Tickets</h2>
        {unrespondedCount > 0 && (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 font-semibold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {unrespondedCount} need{unrespondedCount === 1 ? 's' : ''} your reply
          </span>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-purple-200 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Help Tickets Yet</h3>
          <p className="text-gray-600">Tickets will appear here when customers contact you from the contact page.</p>
        </div>
      ) : (
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Ticket list */}
          <div className="lg:w-80 flex-shrink-0 space-y-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedId === t.id
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : t.unreadByAdmin
                    ? 'border-red-200 bg-red-50/50 hover:border-red-300'
                    : 'border-gray-200 hover:border-purple-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-gray-900 truncate flex-1">{t.subject}</span>
                  {t.unreadByAdmin && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                      Needs Reply
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800 mt-1.5">
                  {t.name || '—'} · {t.email}
                </p>
                <p className="text-xs mt-1">
                  <span className={`inline-block px-2 py-0.5 rounded ${t.isMember ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {t.isMember ? 'Member — chat in-app' : 'Outside user — reply by email'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(t.lastMessageAt)}</p>
                <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>

          {/* Chat panel */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
            {!selectedId ? (
              <div className="p-12 text-center text-gray-500">
                <p>Select a ticket to view the conversation</p>
              </div>
            ) : detailLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : detail ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-bold text-gray-900">{detail.ticket.subject}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(detail.ticket.status)}`}>
                      {detail.ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${detail.ticket.isMember ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {detail.ticket.isMember ? 'Member — chat in-app' : 'Outside user — reply by email'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium text-gray-700">Name:</span> {detail.ticket.name || '—'}</p>
                    <p><span className="font-medium text-gray-700">Email:</span> <a href={`mailto:${detail.ticket.email}`} className="text-purple-600 hover:underline">{detail.ticket.email}</a></p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 max-h-80 overflow-y-auto space-y-4">
                  {detail.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.senderType === 'admin' ? 'items-end' : 'items-start'}`}
                    >
                      <p className={`text-xs font-semibold mb-1 ${m.senderType === 'admin' ? 'text-right text-purple-600' : 'text-left text-slate-600'}`}>
                        {m.senderType === 'admin' ? 'You' : (detail.ticket.name || (detail.ticket.isMember ? 'Customer' : 'Guest'))}
                      </p>
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-2 ${
                          m.senderType === 'admin'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-slate-100 text-gray-900 border border-slate-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                        <p className={`text-xs mt-1 ${m.senderType === 'admin' ? 'text-white/80' : 'text-slate-500'}`}>
                          {formatDate(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  {detail.ticket.isMember ? (
                    <p className="text-sm text-gray-600 mb-2">
                      Reply below — the customer will see it in their Help Tickets.
                    </p>
                  ) : (
                    <p className="text-sm text-amber-700 mb-2">
                      Guest ticket — your reply will be sent by email to {detail.ticket.email}
                    </p>
                  )}
                  <form onSubmit={handleSendReply}>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none mb-3"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !reply.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </form>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
