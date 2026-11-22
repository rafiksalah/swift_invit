import Link from 'next/link';
import {
  QrCode,
  Mail,
  ShieldCheck,
  ArrowRight,
  Camera,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { getSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32 bg-gradient-to-b from-white via-[#F8FAFC] to-[#F1F5F9] border-b border-slate-200/60">
        {/* Subtle Decorative Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-orange-100/50 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-soft text-slate-700 text-xs sm:text-sm font-semibold mb-8">
            <span className="flex h-2 w-2 rounded-full bg-[#EA580C]" />
            <span className="text-[#0F172A]">Zero-Friction Event Invites & Gate Check-in</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0F172A] mb-6 leading-[1.12]">
            Frictionless Invitations.{' '}
            <span className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#EA580C] bg-clip-text text-transparent">
              Lightning Gate Check-in.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-[#64748B] mb-10 leading-relaxed font-normal">
            Create an event in 30 seconds. Paste guest emails. Deliver instant digital QR passes,
            and transform any smartphone into an authoritative mobile gate validator.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-4 rounded-xl text-base font-bold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-cta hover:shadow-cta-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/events/new"
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl text-base font-semibold bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 shadow-soft transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-[#2563EB]" />
                  <span>Create New Event</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-4 rounded-xl text-base font-bold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-cta hover:shadow-cta-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Start Hosting for Free</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl text-base font-semibold bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 shadow-soft transition-colors"
                >
                  <span>Sign In as Organizer</span>
                </Link>
              </>
            )}
          </div>

          {/* Feature Highlights Pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-[#64748B]">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
              <span>No App Download Required</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
              <span>One-Click Email Batching</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
              <span>Sub-Second Camera Scan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
            Engineered For Speed
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-3">
            Everything You Need For Seamless Event Entry
          </h2>
          <p className="text-base text-[#64748B] max-w-xl mx-auto mt-2">
            No bloated ticketing software. Just lightning-fast invitations and gate checking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="h-14 w-14 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mail className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                One-Step Batch Invites
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Paste your guest list separated by commas or line breaks. SwiftInvite parses,
                deduplicates, and dispatches high-contrast email tickets with unique verification tokens.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#2563EB]">
              <span>Learn about automated dispatch</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="h-14 w-14 rounded-xl bg-orange-50 border border-orange-100 text-[#EA580C] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                Live Mobile Gate Scanner
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Open the camera validator on any smartphone. The system provides immediate full-screen
                color feedback (Green, Yellow, or Red) with audio cues and auto-cooldown reset.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#EA580C]">
              <span>Instant camera detection</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-hover transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="h-14 w-14 rounded-xl bg-slate-100 border border-slate-200 text-[#0F172A] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                Concurrency-Safe Validation
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Protected by transactional database row locks (<code className="text-xs font-mono text-[#2563EB]">FOR UPDATE</code>)
                to guarantee zero duplicate entries or replay exploits across multiple gate devices.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#0F172A]">
              <span>Zero-race condition security</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Interactive Workflow */}
      <section className="bg-white py-20 border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              How SwiftInvite Works in 3 Steps
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] mt-2">
              From event planning to gate entry in under 2 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 relative">
              <span className="inline-block px-3 py-1 rounded-lg bg-[#0F172A] text-white text-xs font-bold mb-4 font-mono">
                01
              </span>
              <h4 className="text-lg font-bold text-[#0F172A] mb-2">Create & Paste</h4>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Enter your event time and place. Paste your list of attendee emails into a single box.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 relative">
              <span className="inline-block px-3 py-1 rounded-lg bg-[#2563EB] text-white text-xs font-bold mb-4 font-mono">
                02
              </span>
              <h4 className="text-lg font-bold text-[#0F172A] mb-2">Automatic QR Pass</h4>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Guests receive high-contrast emails with embedded QR codes and direct links to digital passes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 relative">
              <span className="inline-block px-3 py-1 rounded-lg bg-[#EA580C] text-white text-xs font-bold mb-4 font-mono">
                03
              </span>
              <h4 className="text-lg font-bold text-[#0F172A] mb-2">Scan & Welcome</h4>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Point your phone camera at tickets for sub-second validation with clear visual feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full text-center">
        <div className="rounded-3xl bg-gradient-to-tr from-[#0F172A] to-[#1E3A8A] text-white p-10 sm:p-14 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Ready to host your next event?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-8">
              Join organizers who run frictionless check-ins with SwiftInvite today.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl text-base font-bold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-cta hover:shadow-cta-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started Now — Free</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-lg bg-[#EA580C] flex items-center justify-center text-white">
              <QrCode className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-sm text-[#0F172A]">SwiftInvite</span>
          </div>
          <p>© 2026 SwiftInvite &bull; Event Invitations & Gate Check-in.</p>
        </div>
      </footer>
    </div>
  );
}
