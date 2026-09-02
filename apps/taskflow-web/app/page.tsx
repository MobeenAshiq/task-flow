'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Spinner } from '@/components/ui/Spinner';

export default function Home() {
  const router = useRouter();
  const { accessToken, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    router.replace(accessToken ? '/dashboard' : '/login');
  }, [hasHydrated, accessToken, router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-surface-0">
      <Spinner />
    </div>
  );
}
