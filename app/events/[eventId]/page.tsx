import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  Calendar,
  MapPin,
  Camera,
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import GuestListManager from '@/components/GuestListManager';

export default async function EventDetailPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      invitations: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!event) {
    notFound();
  }

  if (event.userId !== session.id) {
    redirect('/dashboard');
  }

  const totalGuests = event.invitations.length;
  const checkedInCount = event.invitations.filter((i) => i.status === 'checked_in').length;
  const percent = totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0;
  const eventDate = new Date(event.dateTime);

  const serializedInvitations = event.invitations.map((inv) => ({
    id: inv.id,
    guestEmail: inv.guestEmail,
    status: inv.status,
    scannedAt: inv.scannedAt ? inv.scannedAt.toISOString() : null,
    createdAt: inv.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 bg-[#F8FAFC] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Event Header Banner Card */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-8 sm:p-10 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold">
                <Calendar className="h-3.5 w-3.5" />
                <span>Event Overview</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                {event.title}
              </h1>

              {event.description && (
                <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#64748B] pt-2">
                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 font-medium text-[#1E293B]">
                  <Clock className="h-4 w-4 text-[#2563EB]" />
                  <span>
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at{' '}
                    {eventDate.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 font-medium text-[#1E293B]">
                  <MapPin className="h-4 w-4 text-[#EA580C]" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>

            {/* Gate Scanner Action Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3">
              <Link
                href={`/events/${event.id}/scan`}
                className="inline-flex items-center justify-center space-x-2.5 px-8 py-4 rounded-xl text-base font-bold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-cta hover:shadow-cta-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera className="h-5 w-5" />
                <span>Open Gate Scanner</span>
              </Link>
            </div>
          </div>

          {/* Admission Progress */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#64748B] mb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Gate Admission Ratio:</span>
                <span className="text-[#0F172A] font-extrabold">
                  {checkedInCount} / {totalGuests} guests ({percent}%)
                </span>
              </div>
              <span className="font-mono text-[#0F172A]">{percent}% validated</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className="h-full bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#EA580C] transition-all duration-700 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Guest Roster Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2">
              <Users className="h-5 w-5 text-[#2563EB]" />
              <span>Guest Roster & Verification Passes</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Search attendees, monitor individual scan times, or dispatch invitations to more guests.
            </p>
          </div>

          <GuestListManager eventId={event.id} initialInvitations={serializedInvitations} />
        </div>
      </div>
    </div>
  );
}
