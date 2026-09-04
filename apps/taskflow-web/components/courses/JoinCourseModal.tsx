'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Field';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { coursesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';

export function JoinCourseModal({
  open,
  onClose,
  onJoined,
}: {
  open: boolean;
  onClose: () => void;
  onJoined: () => void;
}) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setCode('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6) return;
    setSubmitting(true);
    setError(null);
    try {
      await coursesApi.join(code.trim());
      onJoined();
      handleClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to join course.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Join a course">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="join-code">6-character join code</Label>
          <input
            id="join-code"
            required
            autoFocus
            maxLength={6}
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            className="w-full rounded-md border border-border-strong bg-surface-0 px-3 py-3 text-center font-mono text-2xl font-bold uppercase tracking-[0.4em] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
          />
        </div>
        {error && <ErrorNote message={error} />}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={code.length < 6}>
            Join course
          </Button>
        </div>
      </form>
    </Modal>
  );
}
