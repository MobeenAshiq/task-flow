'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SquareTerminal, KeyRound, Mail, ShieldCheck } from 'lucide-react';
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

  const [mode, setMode] = useState<'password' | 'gmail_pin'>('gmail_pin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [pinSent, setPinSent] = useState(false);
  const [devPin, setDevPin] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await authApi.login(email.trim(), password);
      setSession(res.accessToken, { ...res.user, role: res.user.role || UserRole.STUDENT });
      const profile = await authApi.me();
      setSession(res.accessToken, profile);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfoMsg(null);
    try {
      const res = await authApi.sendPin(email.trim());
      setPinSent(true);
      if (res.devPin) {
        setDevPin(res.devPin);
        setPin(res.devPin);
      }
      setInfoMsg(`Verification PIN sent to ${email.trim()}. Enter code below.`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to send verification PIN.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await authApi.verifyPin(email.trim(), pin.trim());
      setSession(res.accessToken, res.user);
      const profile = await authApi.me();
      setSession(res.accessToken, profile);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Invalid or expired PIN code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent shadow-sm">
            <SquareTerminal className="size-5" />
          </div>
          <h1 className="text-lg font-semibold text-fg">Sign in to TaskFlow</h1>
          <p className="text-xs text-fg-muted">Classroom, assignments, and code review.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-border bg-surface-1 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('gmail_pin');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
              mode === 'gmail_pin' ? 'bg-surface-2 text-accent shadow-xs' : 'text-fg-muted hover:text-fg'
            }`}
          >
            <Mail className="size-3.5" />
            Gmail PIN Code
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
              mode === 'password' ? 'bg-surface-2 text-fg shadow-xs' : 'text-fg-muted hover:text-fg'
            }`}
          >
            <KeyRound className="size-3.5" />
            Password Login
          </button>
        </div>

        <Card className="p-6 border border-border-strong bg-surface-1 shadow-sm">
          {mode === 'gmail_pin' ? (
            !pinSent ? (
              <form onSubmit={handleSendPin} className="space-y-4">
                <div>
                  <Label htmlFor="gmail">Gmail Address</Label>
                  <Input
                    id="gmail"
                    type="email"
                    required
                    autoFocus
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    We will send a 6-digit verification PIN to your Gmail address.
                  </p>
                </div>
                {error && <ErrorNote message={error} />}
                <Button type="submit" className="w-full" loading={submitting}>
                  <Mail className="size-4" />
                  Send PIN Code to Gmail
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPinSubmit} className="space-y-4">
                {infoMsg && (
                  <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-xs text-accent">
                    {infoMsg}
                  </div>
                )}
                {devPin && (
                  <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-mono text-success">
                    <span>Generated PIN Code:</span>
                    <span className="font-bold text-sm tracking-wider">{devPin}</span>
                  </div>
                )}
                <div>
                  <Label htmlFor="pin">Enter 6-Digit PIN</Label>
                  <Input
                    id="pin"
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    placeholder="123456"
                    className="font-mono tracking-widest text-center text-base"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>
                {error && <ErrorNote message={error} />}
                <Button type="submit" className="w-full" loading={submitting}>
                  <ShieldCheck className="size-4" />
                  Verify PIN &amp; Sign In
                </Button>
                <button
                  type="button"
                  onClick={() => setPinSent(false)}
                  className="w-full text-center text-xs text-fg-subtle hover:text-fg underline"
                >
                  Use a different Gmail address
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
          )}
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
