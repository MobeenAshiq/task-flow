'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Check, ClipboardCopy, FileCode2, NotebookPen, Plus, Users } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { assignmentsApi, coursesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { UserRole, type Assignment, type CourseDetail } from '@/lib/types';
import { buttonVariants } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { StatusDot } from '@/components/ui/StatusDot';
import { formatDate, languageMeta, submissionStatusMeta } from '@/lib/status';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const isTeacher = user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [c, a] = await Promise.all([coursesApi.get(courseId), assignmentsApi.listByCourse(courseId)]);
        if (!cancelled) {
          setCourse(c);
          setAssignments(a);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : 'Failed to load course.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const handleCopy = () => {
    if (!course) return;
    navigator.clipboard.writeText(course.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="p-8">
        <Spinner label="Loading course…" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <ErrorNote message={error || 'Course not found.'} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-1 text-xs text-fg-muted">
        <Link href="/courses" className="hover:text-accent">
          Courses
        </Link>
        <span>/</span>
        <span className="text-fg">{course.title}</span>
      </div>

      <Card className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-fg">{course.title}</h1>
          <p className="max-w-2xl text-sm text-fg-muted">{course.description || 'No description provided.'}</p>
          <p className="text-xs text-fg-subtle">
            {isTeacher ? (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                {course.roster?.length ?? 0} enrolled students
              </span>
            ) : (
              <span>Instructor: {course.teacherName}</span>
            )}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={handleCopy}
            className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-border-strong bg-surface-2 px-5 py-3 hover:border-accent/40"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-fg-subtle">Join code</span>
            <span className="flex items-center gap-2 font-mono text-xl font-bold tracking-[0.3em] text-accent">
              {course.joinCode}
              {copied ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />}
            </span>
          </button>
        )}
      </Card>

      <Link
        href={`/courses/${courseId}/lectures`}
        className="flex items-center gap-3 rounded-md border border-border-strong bg-surface-1 px-3.5 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-fg"
      >
        <NotebookPen className="size-4.5 shrink-0" />
        Lectures
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">
          Assignments <span className="ml-1 text-fg-subtle">({assignments.length})</span>
        </h2>
        {isTeacher && (
          <Link href={`/courses/${courseId}/assignments/new`} className={buttonVariants('primary', 'sm')}>
            <Plus className="size-4" />
            New assignment
          </Link>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <FileCode2 className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">No assignments have been published yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const href = isTeacher
              ? `/courses/${courseId}/assignments/${a.id}/submissions`
              : `/courses/${courseId}/assignments/${a.id}`;
            const statusMeta = a.submission ? submissionStatusMeta[a.submission.status] : null;
            return (
              <Link key={a.id} href={href}>
                <Card className="flex flex-col gap-3 p-5 hover:border-border-strong sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-fg">{a.title}</h3>
                      {a.allowedLanguages.map((lang) => (
                        <span
                          key={lang}
                          className="rounded border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-fg-muted"
                        >
                          {languageMeta[lang].label}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-fg-subtle">Due {formatDate(a.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {statusMeta && (
                      <StatusDot tone={statusMeta.tone} label={statusMeta.label} pulse={statusMeta.pulse} />
                    )}
                    {a.submission?.grade != null && (
                      <span className="font-mono font-semibold text-success">{a.submission.grade}/100</span>
                    )}
                    <span className={buttonVariants('secondary', 'sm')}>
                      {isTeacher ? 'Review submissions' : a.submission ? 'Open workspace' : 'Start assignment'}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
