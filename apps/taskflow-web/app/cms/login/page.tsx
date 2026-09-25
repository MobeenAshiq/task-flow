'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { authApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/Button';

export default function CmsAdminLoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('admin@taskflow.com');
  const [password, setPassword] = useState('sanam092');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
      <div className="max-w-md w-full rounded-3xl border border-border/80 bg-surface-1 p-8 shadow-2xl space-y-6">
        {/* Top Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-md border border-accent/20">
            <SlidersHorizontal className="size-7" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent uppercase tracking-wider bg-accent/10 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="size-3" /> Secure CMS Admin Access
          </span>
          <h1 className="font-heading text-2xl font-extrabold text-fg">CMS Admin Login</h1>
          <p className="text-xs text-fg-muted">
            Enter your CMS administrator credentials below to manage application content.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-1">Admin Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-fg-subtle" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@taskflow.com"
                className="w-full rounded-xl border border-border bg-surface-0 pl-9 pr-4 py-2.5 text-xs text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
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
                placeholder="sanam092"
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
            {loading ? 'Authenticating...' : 'Log In to CMS Manager'}
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <div className="border-t border-border pt-4 text-center">
          <Link href="/" className="text-xs text-fg-subtle hover:text-accent font-medium">
            ← Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
