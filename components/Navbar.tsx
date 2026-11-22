'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, LogOut, PlusCircle, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UserInfo {
  id: string;
  email: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/auth/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A] text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center shadow-lg shadow-orange-600/30 group-hover:scale-105 transition-transform duration-200">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-white leading-none">
              Swift<span className="text-[#F97316]">Invite</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5">
              Event Gate Pass
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center space-x-2 sm:space-x-3">
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#2563EB]" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/events/new"
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-cta hover:shadow-cta-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Event</span>
                  </Link>

                  <div className="h-5 w-[1px] bg-slate-700 mx-1 hidden sm:block" />

                  <div className="hidden md:flex items-center space-x-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="max-w-[130px] truncate font-medium">{user.email}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#EA580C] hover:bg-[#F97316] text-white shadow-cta hover:shadow-cta-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Get Started</span>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
