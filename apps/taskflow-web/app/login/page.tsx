'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SquareTerminal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Label, Input } from '@/components/ui/Field';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { useAuthStore } from '@/lib/auth-store';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await authApi.login(email.trim(), password);
      setSession(res.accessToken, { ...res.user, role: UserRole.STUDENT });
      const profile = await authApi.me();
      setSession(res.accessToken, profile);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <SquareTerminal className="size-5" />
          </div>
          <h1 className="text-lg font-semibold text-fg">Sign in to TaskFlow</h1>
          <p className="text-xs text-fg-muted">Classroom, assignments, and code review.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <ErrorNote message={error} />}
            <Button type="submit" className="w-full" loading={submitting}>
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-fg-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
