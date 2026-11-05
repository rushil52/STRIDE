'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart2, Calendar, Compass, LogOut, Flame, ShieldCheck } from 'lucide-react';
import { clearStoredToken } from '@/lib/api';

export function Navigation({ user }: { user?: any }) {
  const pathname = usePathname();

  const handleLogout = () => {
    clearStoredToken();
    window.location.href = '/login';
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: BarChart2 },
    { label: 'Activities', href: '/dashboard/activities', icon: Activity },
    { label: 'Adaptive Plan', href: '/dashboard/plan', icon: Calendar },
    { label: 'Research & ML', href: '/dashboard/research', icon: Compass },
  ];

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-white group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-xl tracking-wider font-mono font-black">STRIDE</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-3 pr-2">
                <div className="text-right">
                  <div className="text-xs font-semibold text-zinc-200">{user.full_name || user.email}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">VDOT Target: {user.target_race_distance}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-mono text-xs">
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
