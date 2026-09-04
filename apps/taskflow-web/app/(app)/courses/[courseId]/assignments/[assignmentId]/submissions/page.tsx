'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Clock, Save } from 'lucide-react';
import { assignmentsApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { formatDate, languageMeta, submissionStatusMeta } from '@/lib/status';
import type { Assignment, SubmissionRow } from '@/lib/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Label, Input, Textarea } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { StatusDot } from '@/components/ui/StatusDot';
import { MarkdownView } from '@/components/ui/MarkdownView';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function GradingDeskPage() {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<SubmissionRow | null>(null);
  const [gradeInput, setGradeInput] = useState(0);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [a, subs] = await Promise.all([
          assignmentsApi.get(assignmentId),
          assignmentsApi.listSubmissions(assignmentId),
        ]);
        if (!cancelled) {
          setAssignment(a);
          setSubmissions(subs);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : 'Failed to load submissions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  const openReview = (row: SubmissionRow) => {
    setSelected(row);
    setGradeInput(row.grade ?? 85);
    setFeedbackInput(row.feedback ?? '');
    setSaveError(null);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await assignmentsApi.grade(selected.id, gradeInput, feedbackInput);
      setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setSelected(null);
    } catch (err) {
      setSaveError(err instanceof ApiRequestError ? err.message : 'Failed to save grade.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Spinner label="Loading submissions…" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <ErrorNote message={error || 'Assignment not found.'} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-1 text-xs text-fg-muted">
        <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-1 hover:text-accent">
          <ArrowLeft className="size-3.5" />
          Course
        </Link>
        <span>/</span>
        <span className="text-fg">Submissions</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-fg">{assignment.title}</h1>
        <p className="mt-1 text-xs text-fg-subtle">
          {assignment.allowedLanguages.map((lang) => languageMeta[lang].label).join(' / ')} · {submissions.length} submission
          {submissions.length === 1 ? '' : 's'}
        </p>
      </div>

      <Card>
        {submissions.length === 0 ? (
          <CardBody className="py-12 text-center text-sm text-fg-muted">No submissions yet.</CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-subtle">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Timing</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                  <th className="px-5 py-3 font-medium">Grade</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((s) => {
                  const statusMeta = submissionStatusMeta[s.status];
                  return (
                    <tr key={s.id} className="hover:bg-surface-2/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-fg">{s.studentName}</p>
                        <p className="text-xs text-fg-subtle">{s.studentEmail}</p>
                      </td>
                      <td className="px-5 py-3 text-fg-muted">{formatDate(s.submittedAt)}</td>
                      <td className="px-5 py-3">
                        {s.isLate ? (
                          <StatusDot tone="danger" label="Late" />
                        ) : (
                          <StatusDot tone="success" label="On time" />
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusDot tone={statusMeta.tone} label={statusMeta.label} pulse={statusMeta.pulse} />
                      </td>
                      <td className="px-5 py-3 font-mono">
                        {s.grade != null ? (
                          <span className="font-semibold text-success">{s.grade}/100</span>
                        ) : (
                          <span className="text-xs text-fg-subtle">Not graded</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="secondary" onClick={() => openReview(s)}>
                          {s.grade != null ? 'Edit grade' : 'Review & grade'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Reviewing ${selected.studentName}` : ''}
        widthClassName="max-w-5xl"
      >
        {selected && (
          <div className="grid gap-5 lg:grid-cols-5">
            <div className="flex flex-col lg:col-span-3">
              <div className="mb-2 flex items-center justify-between text-xs text-fg-subtle">
                <span>Submitted code</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {formatDate(selected.submittedAt)}
                  {selected.isLate && <span className="text-danger">(late)</span>}
                </span>
              </div>
              <div className="h-80 overflow-hidden rounded-lg border border-border lg:h-[28rem]">
                <Editor
                  height="100%"
                  language={languageMeta[selected.language].monacoId}
                  theme="vs-dark"
                  value={selected.code}
                  options={{ readOnly: true, fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-2">
              <div>
                <p className="mb-2 text-xs text-fg-subtle">Assignment requirements</p>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-surface-0 p-3 scrollbar-fine">
                  <MarkdownView content={assignment.description} />
                </div>
              </div>

              <form onSubmit={handleSaveGrade} className="flex flex-1 flex-col gap-4">
                <div>
                  <Label htmlFor="grade">Grade (0–100)</Label>
                  <Input
                    id="grade"
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={gradeInput}
                    onChange={(e) => setGradeInput(Number(e.target.value))}
                    className="font-mono text-lg font-bold text-success"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    rows={5}
                    placeholder="Comment on correctness, complexity, and style…"
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                  />
                </div>
                {saveError && <ErrorNote message={saveError} />}
                <Button type="submit" loading={saving} className="w-full">
                  <Save className="size-3.5" />
                  Save grade
                </Button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
