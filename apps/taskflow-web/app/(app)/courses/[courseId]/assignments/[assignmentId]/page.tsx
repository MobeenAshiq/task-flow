'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, CheckCircle2, PenLine } from 'lucide-react';
import { assignmentsApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { useSubmissionStream } from '@/hooks/use-submission-stream';
import { formatDate, languageMeta, submissionStatusMeta } from '@/lib/status';
import { SubmissionStatus, type Assignment, type AssignmentSubmissionSummary } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { StatusDot } from '@/components/ui/StatusDot';
import { MarkdownView } from '@/components/ui/MarkdownView';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const TERMINAL_STATUSES = new Set<SubmissionStatus>([
  SubmissionStatus.PASSED,
  SubmissionStatus.FAILED,
  SubmissionStatus.TIME_LIMIT_EXCEEDED,
  SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
  SubmissionStatus.COMPILATION_ERROR,
  SubmissionStatus.RUNTIME_ERROR,
]);

export default function StudentWorkspacePage() {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmissionSummary | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [autosaved, setAutosaved] = useState(false);
  const [editingUnlocked, setEditingUnlocked] = useState(false);

  const draftKey = `draft_assignment_${assignmentId}`;
  const liveSubmission = useSubmissionStream(submission?.id || '');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const assignments = await assignmentsApi.listByCourse(courseId);
        const match = assignments.find((a) => a.id === assignmentId);
        if (!match) throw new ApiRequestError('Assignment not found.', 404);
        if (!cancelled) {
          setAssignment(match);
          setSubmission(match.submission ?? null);
          const draft = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null;
          setCode(draft ?? match.starterCode ?? '');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : 'Failed to load assignment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, assignmentId]);

  // Autosave draft to localStorage
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, code);
      setAutosaved(true);
      const flash = setTimeout(() => setAutosaved(false), 1800);
      return () => clearTimeout(flash);
    }, 700);
    return () => clearTimeout(timer);
  }, [code, draftKey, loading]);

  // Merge any live socket updates for the active submission
  useEffect(() => {
    if (!liveSubmission || !submission) return;
    setSubmission((prev) => (prev ? { ...prev, ...(liveSubmission as Partial<AssignmentSubmissionSummary>) } : prev));
  }, [liveSubmission]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback polling in case no realtime event arrives
  const pollAttempts = useRef(0);
  useEffect(() => {
    if (!submission || TERMINAL_STATUSES.has(submission.status)) return;
    pollAttempts.current = 0;

    const interval = setInterval(async () => {
      pollAttempts.current += 1;
      try {
        const assignments = await assignmentsApi.listByCourse(courseId);
        const match = assignments.find((a) => a.id === assignmentId);
        if (match?.submission) setSubmission(match.submission);
      } catch {
        // ignore transient polling errors
      }
      if (pollAttempts.current >= 20) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [submission?.id, submission?.status, courseId, assignmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await assignmentsApi.submit(assignmentId, code);
      setSubmission({
        id: result.id,
        status: result.status as SubmissionStatus,
        submittedAt: new Date().toISOString(),
        grade: null,
        score: null,
      });
      setEditingUnlocked(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  }, [assignmentId, code]);

  if (loading) {
    return (
      <div className="p-8">
        <Spinner label="Loading workspace…" />
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <ErrorNote message={error} />
      </div>
    );
  }

  if (!assignment) return null;

  const locked = !!submission && !editingUnlocked;
  const statusMeta = submission ? submissionStatusMeta[submission.status] : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-1 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/courses/${courseId}`} className="shrink-0 text-fg-muted hover:text-accent">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="truncate text-sm font-semibold text-fg">{assignment.title}</h1>
          <span className="hidden shrink-0 text-xs text-fg-subtle sm:inline">Due {formatDate(assignment.dueDate)}</span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {autosaved && <span className="text-xs text-fg-subtle">Draft autosaved</span>}
          {statusMeta && <StatusDot tone={statusMeta.tone} label={statusMeta.label} pulse={statusMeta.pulse} />}
          {submission?.grade != null && (
            <span className="font-mono text-xs font-semibold text-success">{submission.grade}/100</span>
          )}
          {locked ? (
            <Button size="sm" variant="secondary" onClick={() => setEditingUnlocked(true)}>
              <PenLine className="size-3.5" />
              Resubmit
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} loading={submitting}>
              <CheckCircle2 className="size-3.5" />
              Submit assignment
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div className="border-b border-border px-4 py-2">
          <ErrorNote message={error} />
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 divide-y divide-border overflow-hidden lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="scrollbar-fine flex flex-col overflow-y-auto bg-surface-0 p-6">
          <MarkdownView content={assignment.description} />
        </div>

        <div className="flex flex-col overflow-hidden bg-surface-1">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2 text-xs text-fg-muted">
            <div className="flex items-center gap-2">
              <span>Language</span>
              <Select
                value={assignment.language}
                disabled
                title="The assignment sets the execution language"
                className="h-7 w-auto py-0 text-xs"
              >
                <option value={assignment.language}>{languageMeta[assignment.language].label}</option>
              </Select>
            </div>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={languageMeta[assignment.language].monacoId}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                readOnly: locked,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 14 },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
