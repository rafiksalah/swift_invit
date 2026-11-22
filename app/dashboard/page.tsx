import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  PlusCircle,
  Camera,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const events = await prisma.event.findMany({
    where: { userId: session.id },
    include: {
      invitations: {
        select: {
          id: true,
          status: true,
          scannedAt: true,
        },
      },
    },
    orderBy: { dateTime: 'desc' },
  });

  const totalEvents = events.length;
  const totalGuests = events.reduce((acc, evt) => acc + evt.invitations.length, 0);
  const totalCheckedIn = events.reduce(
    (acc, evt) => acc + evt.invitations.filter((i) => i.status === 'checked_in').length,
    0
  );

  return (
    <div className="flex-1 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Top Header & Quick Action */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">
              <span>Overview</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Organizer Dashboard
            </h1>
            <p className="text-[#64748B] text-sm mt-1">
              Monitor attendance, manage guest rosters, and launch mobile gate check-in.
            </p>
          </div>

          <Link
            href="/events/new"
            className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-cta hover:shadow-cta-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Event</span>
          </Link>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Total Events
              </span>
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#0F172A] mt-2">{totalEvents}</p>
            <p className="text-xs text-[#64748B] mt-1">Active and upcoming events</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Total Invitations
              </span>
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-[#0F172A] flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#0F172A] mt-2">{totalGuests}</p>
            <p className="text-xs text-[#64748B] mt-1">Issued passes across all events</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Checked In Total
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2 mt-2">
              <p className="text-3xl font-extrabold text-emerald-600">{totalCheckedIn}</p>
              <span className="text-sm font-semibold text-[#64748B]">
                ({totalGuests > 0 ? Math.round((totalCheckedIn / totalGuests) * 100) : 0}% ratio)
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">Validated gate admissions</p>
          </div>
        </div>

        {/* Events Grid */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Your Events</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Click any event to inspect guest roster or launch the gate scanner.</p>
            </div>
            <span className="text-xs font-bold text-[#0F172A] bg-slate-200/80 px-3 py-1.5 rounded-full">
              {events.length} {events.length === 1 ? 'Event' : 'Events'}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-20 px-6 rounded-3xl bg-white border border-slate-200 shadow-soft">
              <div className="inline-flex h-16 w-16 rounded-2xl bg-orange-50 text-[#EA580C] items-center justify-center mb-4 border border-orange-100">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">No events created yet</h3>
              <p className="text-sm text-[#64748B] max-w-sm mx-auto mt-2 mb-6">
                Create your first event in 30 seconds. Paste guest emails and start issuing passes instantly.
              </p>
              <Link
                href="/events/new"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-cta hover:shadow-cta-hover transition-all duration-200"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create Your First Event</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => {
                const total = evt.invitations.length;
                const checked = evt.invitations.filter((i) => i.status === 'checked_in').length;
                const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
                const eventDate = new Date(evt.dateTime);

                return (
                  <div
                    key={evt.id}
                    className="rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-hover transition-all duration-300 p-6 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Title & Ratio Badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold text-lg text-[#0F172A] line-clamp-1 group-hover:text-[#2563EB] transition-colors">
                          {evt.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-100 flex-shrink-0">
                          {checked}/{total} Checked In
                        </span>
                      </div>

                      {evt.description && (
                        <p className="text-xs text-[#64748B] line-clamp-2 mb-5">
                          {evt.description}
                        </p>
                      )}

                      {/* Event Metadata */}
                      <div className="space-y-2.5 text-xs text-slate-700 mb-6 bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center space-x-2.5">
                          <Clock className="h-4 w-4 text-[#2563EB] flex-shrink-0" />
                          <span className="font-medium text-[#1E293B]">
                            {eventDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            &bull;{' '}
                            {eventDate.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <MapPin className="h-4 w-4 text-[#EA580C] flex-shrink-0" />
                          <span className="font-medium text-[#1E293B] truncate">{evt.location}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold text-[#64748B] mb-1.5">
                          <span>Gate Admission</span>
                          <span className="text-[#0F172A]">{percent}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                          <div
                            className="h-full bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#EA580C] transition-all duration-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <Link
                        href={`/events/${evt.id}`}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 shadow-sm transition-colors"
                      >
                        <Users className="h-3.5 w-3.5 text-[#2563EB]" />
                        <span>Guest List</span>
                      </Link>

                      <Link
                        href={`/events/${evt.id}/scan`}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Camera className="h-3.5 w-3.5 text-[#EA580C]" />
                        <span>Gate Scan</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
