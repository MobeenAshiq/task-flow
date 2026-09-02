'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { assignmentsApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { ExecutionLanguage } from '@/lib/types';
import { languageMeta } from '@/lib/status';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label, Input, Textarea, Select } from '@/components/ui/Field';
import { ErrorNote } from '@/components/ui/ErrorNote';

export default function NewAssignmentPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<ExecutionLanguage>(ExecutionLanguage.PYTHON);
  const [dueDate, setDueDate] = useState('');
  const [starterCode, setStarterCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await assignmentsApi.create({
        title: title.trim(),
        description: description.trim(),
        starterCode: starterCode || undefined,
        language,
        courseId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      router.push(`/courses/${courseId}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to create assignment.');
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-1 text-xs text-fg-muted">
        <Link href={`/courses/${courseId}`} className="hover:text-accent">
          Course
        </Link>
        <span>/</span>
        <span className="text-fg">New assignment</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-fg">New assignment</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Instructions support Markdown — students will see them rendered in their workspace.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              autoFocus
              placeholder="e.g. Two Sum & Hash Maps"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select id="language" value={language} onChange={(e) => setLanguage(e.target.value as ExecutionLanguage)}>
                {Object.entries(languageMeta).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Instructions (Markdown)</Label>
            <Textarea
              id="description"
              required
              rows={7}
              className="font-mono text-xs"
              placeholder={'## Problem\nDescribe the task, constraints, and an example...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="starterCode">Starter code (optional)</Label>
            <Textarea
              id="starterCode"
              rows={6}
              className="font-mono text-xs"
              placeholder="Pre-filled template shown to students when they open the workspace…"
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
            />
          </div>

          {error && <ErrorNote message={error} />}

          <div className="flex justify-end gap-2 border-t border-border pt-5">
            <Link href={`/courses/${courseId}`} className="inline-flex items-center px-4 text-sm text-fg-muted hover:text-fg">
              Cancel
            </Link>
            <Button type="submit" loading={submitting}>
              Publish assignment
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
