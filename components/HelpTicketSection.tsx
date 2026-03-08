'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import RainbowButton from '@/components/RainbowButton';

interface HelpTicketSectionProps {
  title: string;
  text: string;
  loginPrompt: string;
  loginSubtext: string;
  orAnonymous: string;
  emailLabel: string;
  nameLabel: string;
  subjectLabel: string;
  messageLabel: string;
  submitLabel: string;
  successMessage: string;
  successLoggedInMessage: string;
}

export default function HelpTicketSection({
  title,
  text,
  loginPrompt,
  loginSubtext,
  orAnonymous,
  emailLabel,
  nameLabel,
  subjectLabel,
  messageLabel,
  submitLabel,
  successMessage,
  successLoggedInMessage,
}: HelpTicketSectionProps) {
  const { member, isLoading } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showAnonymousForm, setShowAnonymousForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!member?.memberName || !!member?.fullName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in subject and message.');
      return;
    }
    if (!isLoggedIn && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/help-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          ...(!isLoggedIn && { email: email.trim().toLowerCase(), name: name.trim() }),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to send message.');
        return;
      }
      setSuccess(true);
      setSubject('');
      setMessage('');
      setEmail('');
      setName('');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="border-t border-gray-200 pt-8">
        <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>🎫</span> {title}
      </h2>
      <p className="text-gray-700 mb-4">
        {text}
      </p>

      {!isLoggedIn && (
        <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <p className="font-semibold text-purple-800 mb-1">{loginPrompt}</p>
          <p className="text-sm text-gray-600 mb-4">{loginSubtext}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/member/login">
              <RainbowButton variant="primary">Log In</RainbowButton>
            </Link>
            <Link href="/member/signup">
              <RainbowButton variant="secondary">Sign Up</RainbowButton>
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setShowAnonymousForm(!showAnonymousForm)}
            className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium underline"
          >
            {showAnonymousForm ? '− Hide form' : `+ ${orAnonymous}`}
          </button>
        </div>
      )}

      {(isLoggedIn || showAnonymousForm) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoggedIn && (
            <>
              <div>
                <label htmlFor="ht-email" className="block text-sm font-medium text-gray-700 mb-1">
                  {emailLabel} *
                </label>
                <input
                  id="ht-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="ht-name" className="block text-sm font-medium text-gray-700 mb-1">
                  {nameLabel}
                </label>
                <input
                  id="ht-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Your name"
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="ht-subject" className="block text-sm font-medium text-gray-700 mb-1">
              {subjectLabel} *
            </label>
            <input
              id="ht-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g. Order question, custom hat inquiry"
              required
            />
          </div>
          <div>
            <label htmlFor="ht-message" className="block text-sm font-medium text-gray-700 mb-1">
              {messageLabel} *
            </label>
            <textarea
              id="ht-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              placeholder="How can we help?"
              required
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          {success && (
            <p className="text-green-600 font-medium">
              {isLoggedIn ? successLoggedInMessage : successMessage}
            </p>
          )}
          <RainbowButton
            type="submit"
            variant="primary"
            disabled={submitting}
          >
            {submitting ? 'Sending...' : submitLabel}
          </RainbowButton>
        </form>
      )}
    </div>
  );
}
