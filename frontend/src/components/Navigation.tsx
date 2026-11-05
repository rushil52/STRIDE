'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Activity, CalendarDays, Compass, LogOut, ArrowUpRight } from 'lucide-react';
import { clearStoredToken } from '@/lib/api';

export function Navigation({ user }: { user?: any }) {
  const pathname = usePathname();

  const handleLogout = () => {
    clearStoredToken();
    window.location.href = '/login';
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: BarChart3 },
    { label: 'Activities', href: '/dashboard/activities', icon: Activity },
    { label: 'Adaptive Plan', href: '/dashboard/plan', icon: CalendarDays },
    { label: 'Methodology', href: '/dashboard/research', icon: Compass },
  ];

  return (
    <nav className="border-b border-[#eae8e4] bg-[#ffffff] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-bold tracking-tight text-[#1c1c1a] font-serif">
                STRIDE
              </span>
              <span className="text-[11px] font-mono text-[#c84b31] uppercase tracking-wider font-semibold">
                Running
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#f4f3ef] text-[#1c1c1a] font-semibold'
                        : 'text-[#73726d] hover:text-[#1c1c1a] hover:bg-[#faf9f6]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#73726d]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-3 pr-2 border-r border-[#eae8e4]">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#1c1c1a]">{user.full_name || user.email}</div>
                  <div className="text-[11px] text-[#73726d]">Goal: {user.target_race_distance || '5K'}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#f4f3ef] border border-[#eae8e4] flex items-center justify-center text-[#1c1c1a] font-semibold text-xs">
                  {(user.full_name || user.email || 'A')[0].toUpperCase()}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded text-[#73726d] hover:text-[#c84b31] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
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
