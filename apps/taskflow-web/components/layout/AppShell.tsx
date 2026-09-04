'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Spinner } from '@/components/ui/Spinner';

const COLLAPSE_KEY = 'taskflow-sidebar-collapsed';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, hasHydrated } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // localStorage isn't available during SSR, so this can only be read post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
  }, []);

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace('/login');
    }
  }, [hasHydrated, accessToken, router]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  };

  if (!hasHydrated || !accessToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <Spinner label="Loading TaskFlow…" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="scrollbar-fine min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
