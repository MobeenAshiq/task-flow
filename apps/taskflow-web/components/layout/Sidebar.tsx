'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, PanelLeftClose, PanelLeftOpen, SquareTerminal, Video } from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/courses',   label: 'Courses',   icon: BookOpen },
  { href: '/lectures',  label: 'Lectures',  icon: Video },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden md:flex h-screen shrink-0 flex-col border-r border-border bg-surface-1 transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
          <SquareTerminal className="size-4" />
        </div>
        {!collapsed && <span className="text-sm font-semibold tracking-tight text-fg">TaskFlow</span>}
      </div>

      <nav className="flex-1 space-y-1 px-2.5 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent/10 text-accent'
                  : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        className="flex items-center gap-3 border-t border-border px-4 py-3 text-xs font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
