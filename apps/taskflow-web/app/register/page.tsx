'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, SquareTerminal, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Label, Input } from '@/components/ui/Field';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { useAuthStore } from '@/lib/auth-store';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/cn';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await authApi.register(email.trim(), password, name.trim(), role);
      setSession(res.accessToken, { ...res.user, name: name.trim(), role });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-0 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <SquareTerminal className="size-5" />
          </div>
          <h1 className="text-lg font-semibold text-fg">Create your account</h1>
          <p className="text-xs text-fg-muted">Join TaskFlow as a teacher or a student.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole(UserRole.STUDENT)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-xs font-medium transition-colors',
                  role === UserRole.STUDENT
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-border-strong text-fg-muted hover:text-fg'
                )}
              >
                <User className="size-3.5" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.TEACHER)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-xs font-medium transition-colors',
                  role === UserRole.TEACHER
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-border-strong text-fg-muted hover:text-fg'
                )}
              >
                <GraduationCap className="size-3.5" />
                Teacher
              </button>
            </div>

            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                autoFocus
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <ErrorNote message={error} />}
            <Button type="submit" className="w-full" loading={submitting}>
              Create account
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-fg-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
