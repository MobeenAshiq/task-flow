'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { authApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Card } from '@/components/ui/Card';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { Spinner } from '@/components/ui/Spinner';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Clock,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const freshUser = await authApi.me();
        setUser(freshUser);
        setName(freshUser.name || '');
        setEmail(freshUser.email || '');
        setPhone(freshUser.phone || '');
      } catch (err) {
        if (user) {
          setName(user.name || '');
          setEmail(user.email || '');
          setPhone(user.phone || '');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await authApi.updateProfile({
        name,
        email,
        phone,
      });
      setUser(updated);
      setSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="p-8">
        <Spinner label="Loading profile..." />
      </div>
    );
  }

  const roleColor =
    user?.role === 'TEACHER'
      ? 'bg-accent/15 text-accent border-accent/30'
      : user?.role === 'ADMIN'
      ? 'bg-danger/15 text-danger border-danger/30'
      : 'bg-info/15 text-info border-info/30';

  const isApproved = user?.isApproved ?? true;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border-strong bg-surface-1 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/40 text-accent font-bold text-xl uppercase shadow-sm">
            {user?.name?.[0] || user?.email?.[0] || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-fg">{user?.name || 'User Profile'}</h1>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${roleColor}`}
              >
                {user?.role}
              </span>
            </div>
            <p className="mt-1 text-xs text-fg-muted">{user?.email}</p>
          </div>
        </div>

        {/* Approval Badge */}
        <div className="flex items-center gap-2">
          {isApproved ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
              <ShieldCheck className="size-4" />
              Approved Member
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning">
              <Clock className="size-4" />
              Pending Teacher Approval
            </span>
          )}
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-medium text-success">
          <CheckCircle2 className="size-4" />
          {successMsg}
        </div>
      )}

      {/* Edit Form */}
      <Card className="border border-border-strong bg-surface-1 p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-sm font-semibold text-fg">Personal Information</h2>
            <p className="text-xs text-fg-subtle">
              Update your account credentials, username, and contact phone number.
            </p>
          </div>
          <Sparkles className="size-4 text-accent" />
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
              <User className="size-3.5 text-accent" />
              Full Name / Username
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobeen Ashiq"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
              <Mail className="size-3.5 text-accent" />
              Gmail Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mobeen@gmail.com"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
              <Phone className="size-3.5 text-accent" />
              Phone Number
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +92 300 1234567"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" loading={saving}>
              <Save className="size-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
