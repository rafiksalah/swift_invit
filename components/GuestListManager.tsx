'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  UserPlus,
  Loader2,
  Mail,
  Filter,
  X,
} from 'lucide-react';

interface InvitationItem {
  id: string;
  guestEmail: string;
  status: string;
  scannedAt: string | null;
  createdAt: string;
}

export default function GuestListManager({
  eventId,
  initialInvitations,
}: {
  eventId: string;
  initialInvitations: InvitationItem[];
}) {
  const [invitations, setInvitations] = useState<InvitationItem[]>(initialInvitations);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmailsRaw, setNewEmailsRaw] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return invitations.filter((inv) => {
      const matchSearch = inv.guestEmail.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invitations, search, statusFilter]);

  const checkedCount = invitations.filter((i) => i.status === 'checked_in').length;
  const pendingCount = invitations.filter((i) => i.status === 'pending').length;

  const handleAddGuests = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/events/${eventId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestEmailsRaw: newEmailsRaw }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add guests');
      }

      setFeedbackMsg(data.message || 'Guests added successfully!');
      setNewEmailsRaw('');
      setShowAddModal(false);

      // Refresh guest list from server
      const refreshRes = await fetch(`/api/events/${eventId}`);
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        if (refreshed?.invitations) {
          setInvitations(refreshed.invitations);
        }
      }
    } catch (err: unknown) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Error adding guests');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests by email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-[#1E293B] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent shadow-sm transition-all"
          />
        </div>

        {/* Filter Pills & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              All ({invitations.length})
            </button>
            <button
              onClick={() => setStatusFilter('checked_in')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === 'checked_in'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Checked In ({checkedCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Pending ({pendingCount})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-sm transition-all hover:scale-[1.02]"
          >
            <UserPlus className="h-3.5 w-3.5 text-[#EA580C]" />
            <span>Add Guests</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-[#1E3A8A] text-sm font-medium">
          {feedbackMsg}
        </div>
      )}

      {/* Guest Roster Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[#64748B] text-xs uppercase font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-6 py-4">Guest Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Check-in Timestamp</th>
                <th className="px-6 py-4 text-right">Pass View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#64748B]">
                    No attendees match your search filter.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#0F172A] flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <span className="truncate">{inv.guestEmail}</span>
                    </td>
                    <td className="px-6 py-4">
                      {inv.status === 'checked_in' ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Checked In</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[#64748B]">
                      {inv.scannedAt
                        ? new Date(inv.scannedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/verify/${inv.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold hover:underline"
                      >
                        <span>View Pass</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Guests Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-[#0F172A]">Add More Guests</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-[#64748B] mb-5 leading-relaxed">
              Paste email addresses separated by commas or line breaks. Existing attendees will be automatically skipped.
            </p>

            <form onSubmit={handleAddGuests} className="space-y-4">
              <textarea
                rows={5}
                required
                value={newEmailsRaw}
                onChange={(e) => setNewEmailsRaw(e.target.value)}
                placeholder="charlie@example.com&#10;dave@example.com"
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-300 rounded-xl text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-sm font-mono"
              />

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-cta hover:shadow-cta-hover transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending Passes...</span>
                    </>
                  ) : (
                    <span>Add & Send Passes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
