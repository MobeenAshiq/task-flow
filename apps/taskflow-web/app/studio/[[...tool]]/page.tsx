'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, Database, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { useAuthStore } from '@/lib/auth-store';

export default function StudioPage() {
  const router = useRouter();
  const { setSession } = useAuthStore();

  const [email, setEmail] = useState('admin@taskflow.com');
  const [password, setPassword] = useState('sanam092');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login(email, password);
      setSession(res.accessToken, res.user);
      router.push('/cms');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Invalid CMS Admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 p-6 text-fg">
      <div className="max-w-md w-full rounded-3xl border border-border/80 bg-surface-1 p-8 text-center space-y-6 shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/20 shadow-md">
            <SlidersHorizontal className="size-7" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent uppercase tracking-wider bg-accent/10 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="size-3" /> TaskFlow CMS Hub
          </span>
          <h1 className="font-heading text-2xl font-extrabold text-fg">TaskFlow CMS Studio</h1>
          <p className="text-xs text-fg-muted leading-relaxed">
            Manage announcements, FAQs, learning topics, and feature cards dynamically in your native CMS Manager.
          </p>
        </div>

        {/* Built-in Status Box */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left text-xs space-y-1.5">
          <div className="font-bold text-emerald-400 flex items-center gap-1.5">
            <Database className="size-4" /> Native Database CMS Active
          </div>
          <p className="text-emerald-300/90 text-[11px]">
            Your CMS database is seeded and ready! Log in below with password <code className="font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded">sanam092</code>.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400 text-left">
            {error}
          </div>
        )}

        {/* Quick Login Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-fg-subtle" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-0 pl-9 pr-4 py-2.5 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-1">Admin Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-fg-subtle" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-0 pl-9 pr-4 py-2.5 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-fg-subtle mt-1">Default Password: <code className="text-accent font-bold">sanam092</code></p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-accent text-slate-950 font-bold hover:bg-accent-hover text-xs shadow-md gap-2"
          >
            {loading ? 'Logging in...' : 'Open CMS Manager Dashboard'}
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <div className="pt-2 flex items-center justify-between border-t border-border/80 text-xs">
          <Link href="/cms" className="text-accent font-semibold hover:underline">
            Direct Link: /cms ➔
          </Link>
          <Link href="/" className="text-fg-subtle hover:text-fg font-medium">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
