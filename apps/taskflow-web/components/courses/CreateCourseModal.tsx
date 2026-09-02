'use client';

import { useState } from 'react';
import { Check, Copy, Info } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Label, Input, Textarea } from '@/components/ui/Field';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { coursesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import type { Course } from '@/lib/types';

export function CreateCourseModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (course: Course) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Course | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setError(null);
    setCreated(null);
    setCopied(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const course = await coursesApi.create(title.trim(), description.trim());
      setCreated(course);
      onCreated(course);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to create course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!created) return;
    navigator.clipboard.writeText(created.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal open={open} onClose={handleClose} title={created ? 'Course created' : 'Create a course'}>
      {created ? (
        <div className="space-y-5">
          <p className="text-sm text-fg-muted">
            Share this join code with your students so they can enroll in <strong className="text-fg">{created.title}</strong>.
          </p>
          <button
            onClick={handleCopy}
            className="flex w-full items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 font-mono text-2xl font-bold tracking-[0.3em] text-accent hover:bg-accent/15"
          >
            <span>{created.joinCode}</span>
            {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
          </button>
          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="course-title">Course title</Label>
            <Input
              id="course-title"
              required
              autoFocus
              placeholder="e.g. Data Structures & Algorithms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="course-description">Description</Label>
            <Textarea
              id="course-description"
              rows={3}
              placeholder="What will students learn in this course?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-xs text-fg-muted">
            <Info className="size-3.5 mt-0.5 shrink-0 text-accent" />
            A unique 6-character join code is generated automatically once you create the course.
          </div>
          {error && <ErrorNote message={error} />}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create course
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
