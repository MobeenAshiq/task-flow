'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, ChevronDown, LayoutDashboard, LogOut, Menu, Video, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { RoleBadge } from '@/components/layout/RoleBadge';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/courses',   label: 'Courses',   icon: BookOpen },
  { href: '/lectures',  label: 'Lectures',  icon: Video },
];

const SECTION_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/courses':   'Courses',
  '/lectures':  'Lectures',
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const title =
    Object.entries(SECTION_TITLES).find(([prefix]) => pathname?.startsWith(prefix))?.[1] ?? 'TaskFlow';

  const initials = (user?.name || user?.email || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface-1/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileNavOpen((v) => !v)}
          className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg md:hidden"
        >
          {mobileNavOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
        <h1 className="text-sm font-semibold text-fg">{title}</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-2.5 hover:border-border-strong"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
            {initials}
          </span>
          <span className="hidden text-xs font-medium text-fg sm:inline">{user?.name || user?.email}</span>
          {user && <RoleBadge role={user.role} className="hidden sm:inline-flex" />}
          <ChevronDown className="size-3.5 text-fg-muted" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-11 z-40 w-48 rounded-lg border border-border-strong bg-surface-2 py-1 shadow-xl shadow-black/40">
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-xs font-medium text-fg">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-danger hover:bg-surface-3"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {mobileNavOpen && (
        <div className="absolute inset-x-0 top-14 z-30 border-b border-border bg-surface-1 p-2 md:hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
