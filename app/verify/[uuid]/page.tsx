import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Ticket,
} from 'lucide-react';

export default async function GuestTicketPage({
  params,
}: {
  params: { uuid: string };
}) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: params.uuid },
    include: {
      event: true,
    },
  });

  if (!invitation) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-card">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 items-center justify-center mb-4 border border-rose-100">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] mb-2">Invalid Invitation Pass</h1>
          <p className="text-sm text-[#64748B]">
            This ticket UUID was not found on the event guest list. Please contact the event organizer.
          </p>
        </div>
      </div>
    );
  }

  const { event } = invitation;
  const eventDate = new Date(event.dateTime);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const ticketUrl = `${appUrl}/verify/${invitation.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    ticketUrl
  )}`;

  const isCheckedIn = invitation.status === 'checked_in';

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top Header Card */}
        <div className="p-8 text-center bg-gradient-to-tr from-[#0F172A] to-[#1E3A8A] text-white">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-[#F97316] text-xs font-bold mb-3">
            <Ticket className="h-3.5 w-3.5" />
            <span>Official Event Pass</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            {event.title}
          </h1>

          {/* Status Badge */}
          <div className="mt-4 inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
            {isCheckedIn ? (
              <span className="flex items-center space-x-1.5 text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Checked In</span>
                {invitation.scannedAt && (
                  <span className="text-slate-300">
                    &bull;{' '}
                    {new Date(invitation.scannedAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-blue-200 bg-blue-950/60 border border-blue-400/30 px-3 py-1 rounded-full">
                <QrCode className="h-4 w-4 text-[#38BDF8]" />
                <span>Valid Pass &bull; Ready for Check-in</span>
              </span>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-8 flex flex-col items-center justify-center text-center bg-white border-b border-slate-100">
          <div className="p-4 rounded-2xl bg-white shadow-card border-2 border-slate-200 mb-4 transition-transform hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="Gate Check-in QR Code"
              width={240}
              height={240}
              className="rounded-lg block"
            />
          </div>

          <p className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Token: <span className="text-[#2563EB]">{invitation.id.slice(0, 8)}...</span>
          </p>
          <p className="text-xs text-[#64748B]">
            Show this QR code to the gate bouncer upon entry.
          </p>
        </div>

        {/* Event Details */}
        <div className="p-6 sm:p-8 space-y-4 bg-[#F8FAFC]">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-soft space-y-3 text-xs sm:text-sm">
            <div className="flex items-start space-x-2.5 text-[#1E293B]">
              <Clock className="h-4 w-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#0F172A]">Date & Time:</span>
                <p className="text-[#64748B] mt-0.5">
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {eventDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 text-[#1E293B] pt-2.5 border-t border-slate-100">
              <MapPin className="h-4 w-4 text-[#EA580C] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#0F172A]">Location:</span>
                <p className="text-[#64748B] mt-0.5">{event.location}</p>
              </div>
            </div>
          </div>

          {event.description && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-soft">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Event Information
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-xs text-[#64748B]">
              Issued to <span className="font-semibold text-[#0F172A]">{invitation.guestEmail}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
