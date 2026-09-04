'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Check,
  ClipboardCopy,
  FileCode2,
  NotebookPen,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  User,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { assignmentsApi, coursesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { UserRole, type Assignment, type CourseDetail, type CourseStudent } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/Button';
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
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [activeTab, setActiveTab] = useState<'assignments' | 'students'>('assignments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

        if (isTeacher && !cancelled) {
          try {
            const s = await coursesApi.listStudents(courseId);
            setStudents(s);
          } catch {
            // Ignore roster error if student
          }
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
  }, [courseId, isTeacher]);

  const handleCopy = () => {
    if (!course) return;
    navigator.clipboard.writeText(course.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApprove = async (studentId: string) => {
    setActionLoadingId(studentId);
    try {
      await coursesApi.approveStudent(courseId, studentId);
      setStudents((prev) =>
        prev.map((s) => (s.studentId === studentId ? { ...s, status: 'APPROVED', isApproved: true } : s))
      );
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : 'Failed to approve student');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (studentId: string) => {
    setActionLoadingId(studentId);
    try {
      await coursesApi.rejectStudent(courseId, studentId);
      setStudents((prev) =>
        prev.map((s) => (s.studentId === studentId ? { ...s, status: 'REJECTED' } : s))
      );
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : 'Failed to reject student');
    } finally {
      setActionLoadingId(null);
    }
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
                {students.length || course.roster?.length || 0} enrolled students
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

      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'assignments'
                ? 'border-accent text-accent'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            Assignments ({assignments.length})
          </button>
          {isTeacher && (
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
                activeTab === 'students'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              <Users className="size-3.5" />
              Student Approvals ({students.length})
            </button>
          )}
        </div>

        <Link
          href={`/courses/${courseId}/lectures`}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10"
        >
          <NotebookPen className="size-3.5" />
          Lectures
        </Link>
      </div>

      {activeTab === 'assignments' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Course Assignments</h2>
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
      ) : (
        /* Students & Approvals Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-fg">Enrolled Students &amp; Approval Requests</h2>
              <p className="text-xs text-fg-subtle">Review student details (Username, Email, Phone) and grant access.</p>
            </div>
          </div>

          {students.length === 0 ? (
            <Card className="p-8 text-center text-xs text-fg-muted">
              No students have joined this course yet.
            </Card>
          ) : (
            <Card className="overflow-hidden border border-border-strong bg-surface-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface-2 text-fg-muted">
                    <tr>
                      <th className="p-3.5 font-semibold">Student Name</th>
                      <th className="p-3.5 font-semibold">Email</th>
                      <th className="p-3.5 font-semibold">Phone Number</th>
                      <th className="p-3.5 font-semibold">Approval Status</th>
                      <th className="p-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-fg">
                    {students.map((s) => (
                      <tr key={s.studentId} className="hover:bg-surface-2/50 transition-colors">
                        <td className="p-3.5 font-medium flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">
                            {s.name?.[0] || s.email?.[0] || 'S'}
                          </div>
                          <span>{s.name || 'Student'}</span>
                        </td>
                        <td className="p-3.5 text-fg-muted font-mono">
                          <span className="flex items-center gap-1.5">
                            <Mail className="size-3.5 text-fg-subtle" />
                            {s.email}
                          </span>
                        </td>
                        <td className="p-3.5 text-fg-muted font-mono">
                          <span className="flex items-center gap-1.5">
                            <Phone className="size-3.5 text-fg-subtle" />
                            {s.phone || 'Not provided'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {s.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                              <ShieldCheck className="size-3" /> Approved
                            </span>
                          ) : s.status === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-danger/30 bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                              <XCircle className="size-3" /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
                              <ShieldAlert className="size-3" /> Pending Approval
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {s.status !== 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-success/10 text-success border-success/30 hover:bg-success/20"
                              loading={actionLoadingId === s.studentId}
                              onClick={() => handleApprove(s.studentId)}
                            >
                              <CheckCircle2 className="size-3.5" /> Approve
                            </Button>
                          )}
                          {s.status !== 'REJECTED' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-danger hover:bg-danger/10"
                              loading={actionLoadingId === s.studentId}
                              onClick={() => handleReject(s.studentId)}
                            >
                              Reject
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
