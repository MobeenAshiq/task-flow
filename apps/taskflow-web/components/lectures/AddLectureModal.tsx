'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Label, Input, Textarea } from '@/components/ui/Field';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { lecturesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import type { Lecture } from '@/lib/types';

function todayLocalDate(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function AddLectureModal({
  open,
  onClose,
  courseId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  onCreated: (lecture: Lecture) => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayLocalDate());
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDate(todayLocalDate());
    setContent('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const lecture = await lecturesApi.create({
        title: title.trim(),
        content: content.trim(),
        date: new Date(date).toISOString(),
        courseId,
      });
      onCreated(lecture);
      handleClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to post lecture.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Post a lecture" widthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="lecture-title">Title</Label>
          <Input
            id="lecture-title"
            required
            autoFocus
            placeholder="e.g. Lecture 4: Binary Search Trees"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="lecture-date">Date</Label>
          <Input id="lecture-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="lecture-content">Notes (Markdown)</Label>
          <Textarea
            id="lecture-content"
            required
            rows={8}
            className="font-mono text-xs"
            placeholder={"## What we covered\n- Key point one\n- Key point two"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        {error && <ErrorNote message={error} />}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Post lecture
          </Button>
        </div>
      </form>
    </Modal>
  );
}
