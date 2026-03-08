'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  unreadByUser: boolean;
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

export default function HelpTicketsPage() {
  const { member, isLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ ticket: TicketDetail; messages: Message[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isLoading && !member) {
      window.location.href = '/login';
    }
  }, [member, isLoading]);

  useEffect(() => {
    if (!member) return;
    setLoading(true);
    fetch('/api/help-tickets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTickets(data.tickets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [member]);

  useEffect(() => {
    if (!selectedId || !member) return;
    setDetailLoading(true);
    setDetail(null);
    fetch(`/api/help-tickets/${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDetail({ ticket: data.ticket, messages: data.messages || [] });
        }
        setDetailLoading(false);
      })
      .catch(() => setDetailLoading(false));
  }, [selectedId, member]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/help-tickets/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
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
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedId ? { ...t, lastMessageAt: data.message.createdAt, unreadByUser: false } : t
          )
        );
      }
    } finally {
      setSending(false);
    }
  };

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      if (diff < 604800000) return d.toLocaleDateString('en-US', { weekday: 'short' });
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  if (isLoading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/member/dashboard" className="text-gray-600 hover:text-black transition-colors mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Help Tickets</h1>
          <p className="text-lg text-gray-600 mb-4">Your support conversations with us</p>
          <div className="inline-block px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-sm">
            <p><span className="font-medium text-gray-700">Name:</span> {member.memberName || member.fullName || '—'}</p>
            <p><span className="font-medium text-gray-700">Email:</span> {member.memberEmail || member.email || '—'}</p>
            <p className="text-gray-500 text-xs mt-1">We&apos;ll respond to you at this email</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Loading your tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border-2 border-purple-100 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No tickets yet</h2>
            <p className="text-gray-600 mb-6">Create a help ticket from our contact page and we&apos;ll get back to you.</p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Go to Contact
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {!selectedId ? (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className="w-full text-left bg-white rounded-xl p-5 border-2 border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 truncate">{t.subject}</span>
                        {t.unreadByUser && (
                          <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(t.lastMessageAt)}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => { setSelectedId(null); setDetail(null); }}
                      className="text-gray-600 hover:text-black"
                    >
                      ← Back
                    </button>
                    <span className="font-semibold text-gray-900 truncate flex-1">{detail?.ticket.subject || '...'}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(detail?.ticket.status || '')}`}>
                      {detail?.ticket.status?.replace('_', ' ') || ''}
                    </span>
                  </div>
                  {detail?.ticket && (
                    <div className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                      <span className="font-medium">Name:</span> {detail.ticket.name || '—'} · <span className="font-medium">Email:</span> {detail.ticket.email}
                    </div>
                  )}
                </div>

                {detailLoading ? (
                  <div className="p-12 text-center text-gray-500">Loading...</div>
                ) : detail ? (
                  <>
                    <div className="p-4 max-h-96 overflow-y-auto space-y-4">
                      {detail.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex flex-col ${m.senderType === 'admin' ? 'items-start' : 'items-end'}`}
                        >
                          <p className={`text-xs font-semibold mb-1 ${m.senderType === 'admin' ? 'text-left text-slate-600' : 'text-right text-purple-600'}`}>
                            {m.senderType === 'admin' ? 'Support' : 'You'}
                          </p>
                          <div
                            className={`max-w-[85%] rounded-xl px-4 py-2 ${
                              m.senderType === 'admin'
                                ? 'bg-slate-100 text-gray-900 border border-slate-200'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                            <p className={`text-xs mt-1 ${m.senderType === 'admin' ? 'text-slate-500' : 'text-white/80'}`}>
                              {formatDate(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendReply} className="p-4 border-t border-gray-200">
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
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
