'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  FileText,
  Mail,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function NewEventPage() {
  const router = useRouter();

  // Tomorrow 7:00 PM formatted for datetime-local
  const defaultDateTime = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState(defaultDateTime);
  const [guestEmailsRaw, setGuestEmailsRaw] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live parsed email counter
  const parsedEmails = useMemo(() => {
    const tokens = guestEmailsRaw.split(/[\r\n,; \t]+/);
    const validSet = new Set<string>();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const token of tokens) {
      const cleaned = token.trim().toLowerCase();
      if (cleaned && emailRegex.test(cleaned)) {
        validSet.add(cleaned);
      }
    }
    return Array.from(validSet);
  }, [guestEmailsRaw]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parsedEmails.length === 0) {
      setError('Please enter at least one valid guest email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          dateTime,
          guestEmailsRaw,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      router.push(`/events/${data.eventId}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Card Container */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 shadow-card">
          <div className="border-b border-slate-100 pb-6 mb-8">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              One-Step Event Setup
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-3">
              Create New Event
            </h1>
            <p className="text-sm text-[#64748B] mt-1 leading-relaxed">
              Fill in the details below and paste your attendee list. Each guest receives a personalized digital pass with a unique QR code.
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium mb-6">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                Event Title <span className="text-[#EA580C]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Tech Founders Mixer 2026"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition-all"
              />
            </div>

            {/* Date & Time and Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                  Date & Time <span className="text-[#EA580C]">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                  Location <span className="text-[#EA580C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Skylight Loft, 450 Broadway, NYC"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                Event Description <span className="text-[#64748B] font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add special instructions, entry dress code, parking guidance, or schedule notes for attendees..."
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm transition-all resize-y"
              />
            </div>

            {/* Guest Emails Textarea */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Enter Guest Emails <span className="text-[#EA580C]">*</span>
                </label>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#EA580C] border border-orange-200 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    {parsedEmails.length} valid {parsedEmails.length === 1 ? 'recipient' : 'recipients'}
                  </span>
                </span>
              </div>

              <p className="text-xs text-[#64748B] mb-2.5">
                Paste one email per line or separate by commas. Duplicate emails are automatically deduplicated.
              </p>

              <textarea
                required
                rows={6}
                value={guestEmailsRaw}
                onChange={(e) => setGuestEmailsRaw(e.target.value)}
                placeholder={`alex@startup.io\nsarah.miller@company.com\njohn.doe@acme.org, emily@domain.com`}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-300 rounded-xl text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-sm font-mono transition-all resize-y"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-[#64748B] hover:text-[#0F172A] text-center transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading || parsedEmails.length === 0}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-cta hover:shadow-cta-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Dispatching Passes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Launch Event & Send Passes ({parsedEmails.length})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
