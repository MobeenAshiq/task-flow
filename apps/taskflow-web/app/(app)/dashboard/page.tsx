'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, CheckCircle2, Users, Zap,
  ChevronLeft, ChevronRight, Plus,
  ArrowRight, Clock, AlertCircle, TrendingUp,
  FileCode2, GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { assignmentsApi, coursesApi, lecturesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { UserRole, SubmissionStatus, type Course, type Assignment, type SubmissionRow, type Lecture } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { StatusDot } from '@/components/ui/StatusDot';
import { buttonVariants } from '@/components/ui/Button';
import { formatDate, formatDateOnly, submissionStatusMeta } from '@/lib/status';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrichedAssignment extends Assignment {
  courseTitle: string;
  courseId: string;
}

interface EnrichedSubmission extends SubmissionRow {
  courseId: string;
  courseTitle: string;
  assignmentTitle: string;
  assignmentId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOverdue(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function getDueSoon(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  const diff = new Date(dueDate).getTime() - Date.now();
  return diff > 0 && diff < 1000 * 60 * 60 * 48; // within 48h
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#db2777', '#0891b2', '#dc2626'];
function avatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MiniCalendar({ dueDates }: { dueDates: string[] }) {
  const today = new Date();
  const [cur, setCur] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const yr = cur.getFullYear(), mo = cur.getMonth();
  const daysInMo = new Date(yr, mo + 1, 0).getDate();
  const firstDay = new Date(yr, mo, 1).getDay();
  const prevEnd  = new Date(yr, mo, 0).getDate();

  // Collect due-date days for current month
  const dueDays = useMemo(() => {
    const set = new Set<number>();
    for (const d of dueDates) {
      const dt = new Date(d);
      if (dt.getFullYear() === yr && dt.getMonth() === mo) set.add(dt.getDate());
    }
    return set;
  }, [dueDates, yr, mo]);

  type CT = 'prev' | 'curr' | 'next';
  const cells: { d: number; t: CT }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevEnd - i, t: 'prev' });
  for (let d = 1; d <= daysInMo; d++)     cells.push({ d, t: 'curr' });
  for (let d = 1; cells.length < 42; d++) cells.push({ d, t: 'next' });

  const isTd = (d: number, t: CT) =>
    t === 'curr' && d === today.getDate() && mo === today.getMonth() && yr === today.getFullYear();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button id="cal-prev" onClick={() => setCur(new Date(yr, mo - 1, 1))}
          className="p-1 rounded hover:bg-surface-2 text-fg-muted hover:text-fg transition-colors">
          <ChevronLeft className="size-3.5" />
        </button>
        <span className="text-xs font-semibold text-fg">
          {cur.toLocaleString('default', { month: 'long' })} {yr}
        </span>
        <button id="cal-next" onClick={() => setCur(new Date(yr, mo + 1, 1))}
          className="p-1 rounded hover:bg-surface-2 text-fg-muted hover:text-fg transition-colors">
          <ChevronRight className="size-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] text-fg-subtle font-medium py-1">{d}</div>
        ))}
        {cells.map((cell, i) => (
          <div key={i} className="relative flex items-center justify-center">
            <div className={cn(
              'flex items-center justify-center h-7 w-7 rounded-full text-[11px] font-medium cursor-default select-none transition-colors',
              cell.t !== 'curr'                      && 'text-fg-subtle/30',
              cell.t === 'curr' && !isTd(cell.d, cell.t) && 'text-fg-muted hover:bg-surface-2',
              isTd(cell.d, cell.t)                   && 'bg-blue-600 text-white font-bold',
            )}>
              {cell.d}
            </div>
            {cell.t === 'curr' && dueDays.has(cell.d) && !isTd(cell.d, cell.t) && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-warning" />
            )}
          </div>
        ))}
      </div>
      {dueDays.size > 0 && (
        <p className="mt-3 text-[10px] text-fg-muted flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-warning inline-block" />
          {dueDays.size} assignment{dueDays.size !== 1 ? 's' : ''} due this month
        </p>
      )}
    </div>
  );
}

// ─── Sparkline Chart ──────────────────────────────────────────────────────────

function SubmissionSparkline({ data }: { data: number[] }) {
  const CW = 400, CH = 110;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * CW,
    y: CH - (v / max) * CH * 0.85 - CH * 0.05,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${CH} L0,${CH} Z`;

  const labels = data.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (data.length - 1 - i));
    return d.toLocaleString('default', { weekday: 'short' });
  });

  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" className="w-full" style={{ height: CH }}>
        <defs>
          <linearGradient id="sgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2dd4bf" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0"    />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <line key={v} x1="0" y1={v * CH} x2={CW} y2={v * CH}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#sgrad)" />
        <path d={line} fill="none" stroke="#2dd4bf" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0c1015" stroke="#2dd4bf" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between">
        {labels.map((l, i) => (
          <span key={i} className="text-[10px] text-fg-subtle">{l}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN;

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Data
  const [courses,     setCourses]     = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
  const [submissions, setSubmissions] = useState<EnrichedSubmission[]>([]);
  const [lectures,    setLectures]    = useState<Lecture[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1. Load courses
        const courseList = await coursesApi.list();

        // 2. Load assignments + lectures in parallel for all courses
        const [assignmentResults, lectureResults] = await Promise.all([
          Promise.all(
            courseList.map((c) =>
              assignmentsApi.listByCourse(c.id)
                .then((a) => a.map((x) => ({ ...x, courseTitle: c.title, courseId: c.id })))
                .catch(() => [] as EnrichedAssignment[])
            )
          ),
          Promise.all(
            courseList.map((c) =>
              lecturesApi.listByCourse(c.id).catch(() => [] as Lecture[])
            )
          ),
        ]);

        const allAssignments = assignmentResults.flat();
        const allLectures    = lectureResults.flat();

        // 3. Load submissions (for teachers: per-assignment, for students: from assignment.submission)
        let allSubmissions: EnrichedSubmission[] = [];

        if (isTeacher) {
          const subResults = await Promise.all(
            allAssignments.map((a) =>
              assignmentsApi.listSubmissions(a.id)
                .then((subs) =>
                  subs.map((s) => ({
                    ...s,
                    courseId:        a.courseId,
                    courseTitle:     a.courseTitle,
                    assignmentTitle: a.title,
                    assignmentId:    a.id,
                  }))
                )
                .catch(() => [] as EnrichedSubmission[])
            )
          );
          allSubmissions = subResults.flat();
        } else {
          // Students: each assignment has .submission embedded
          allSubmissions = allAssignments
            .filter((a) => a.submission != null)
            .map((a) => ({
              id:              a.submission!.id,
              studentId:       user!.id,
              studentName:     user?.name ?? user?.email ?? 'You',
              studentEmail:    user?.email ?? '',
              code:            '',
              language:        a.submission!.language,
              status:          a.submission!.status,
              score:           a.submission!.score ?? 0,
              maxScore:        100,
              grade:           a.submission!.grade,
              feedback:        null,
              gradedAt:        null,
              gradedByName:    null,
              submittedAt:     a.submission!.submittedAt,
              isLate:          false,
              courseId:        a.courseId,
              courseTitle:     a.courseTitle,
              assignmentTitle: a.title,
              assignmentId:    a.id,
            }));
        }

        allSubmissions.sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));

        if (!cancelled) {
          setCourses(courseList);
          setAssignments(allAssignments);
          setSubmissions(allSubmissions);
          setLectures(allLectures);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : 'Failed to load dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, isTeacher]);

  // ── Derived metrics ──────────────────────────────────────────────────────────
  const pendingSubmissions  = submissions.filter((s) => s.grade == null);
  const gradedSubmissions   = submissions.filter((s) => s.grade != null);
  const completionRate      = submissions.length === 0 ? 0
    : Math.round((gradedSubmissions.length / submissions.length) * 100);

  const overdueAssignments  = assignments.filter(
    (a) => isOverdue(a.dueDate) && (isTeacher ? true : !a.submission)
  );
  const dueSoonAssignments  = assignments.filter(
    (a) => getDueSoon(a.dueDate) && (isTeacher ? true : !a.submission)
  );

  // 7-day submission trend
  const submissionTrend = useMemo(() => {
    const counts = Array(7).fill(0);
    const now = Date.now();
    for (const s of submissions) {
      const diff = Math.floor((now - new Date(s.submittedAt).getTime()) / 86_400_000);
      if (diff >= 0 && diff < 7) counts[6 - diff]++;
    }
    return counts;
  }, [submissions]);

  // Due dates for calendar
  const dueDates = assignments.map((a) => a.dueDate).filter(Boolean) as string[];

  // Upcoming assignments (not overdue, sorted by due date)
  const upcomingAssignments = assignments
    .filter((a) => a.dueDate && !isOverdue(a.dueDate))
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  // Recent course activity (latest submissions, deduplicated by course)
  const recentActivity = submissions.slice(0, 6);

  // Stat card data
  const stats = [
    {
      id: 'stat-courses',
      icon: BookOpen,
      label: isTeacher ? 'Active Courses' : 'Enrolled Courses',
      value: String(courses.length),
      sub: `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''} total`,
      tone: 'accent' as const,
    },
    {
      id: 'stat-secondary',
      icon: isTeacher ? Users : FileCode2,
      label: isTeacher ? 'Enrolled Students' : 'Submissions Made',
      value: isTeacher
        ? String(courses.reduce((s, c) => s + (c.studentCount ?? 0), 0))
        : String(submissions.length),
      sub: isTeacher
        ? `across ${courses.length} course${courses.length !== 1 ? 's' : ''}`
        : `${gradedSubmissions.length} graded`,
      tone: 'info' as const,
    },
    {
      id: 'stat-pending',
      icon: Zap,
      label: isTeacher ? 'Pending Grading' : 'Pending Review',
      value: String(pendingSubmissions.length),
      sub: overdueAssignments.length > 0
        ? `${overdueAssignments.length} overdue`
        : 'All caught up',
      tone: 'warning' as const,
    },
    {
      id: 'stat-completion',
      icon: CheckCircle2,
      label: isTeacher ? 'Graded Rate' : 'Completion Rate',
      value: `${completionRate}%`,
      sub: `${gradedSubmissions.length} of ${submissions.length} graded`,
      tone: 'success' as const,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Loading dashboard…" />
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* Hero Banner Card */}
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent backdrop-blur-xs">
              <Zap className="size-3.5" />
              <span>Computer Science Learning Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-info">{user?.name || 'Developer'}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-fg-muted">
              Manage your interactive courses, submit assignments, analyze code complexity, and track your learning progress.
            </p>
          </div>
          <div className="relative shrink-0 overflow-hidden rounded-xl border border-accent/30 shadow-lg max-w-xs w-full h-32 md:h-36">
            <img src="/banner.jpg" alt="TaskFlow Banner" className="size-full object-cover opacity-90 transition-transform duration-500 hover:scale-105" />
          </div>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ id, icon: Icon, label, value, sub, tone }) => (
          <div
            id={id}
            key={id}
            className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5 flex items-start gap-4 hover:border-border-strong transition-colors"
          >
            <div className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg mt-0.5',
              tone === 'info'    && 'bg-info/10 text-info',
              tone === 'success' && 'bg-success/10 text-success',
              tone === 'warning' && 'bg-warning/10 text-warning',
              tone === 'accent'  && 'bg-accent/10 text-accent',
            )}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-fg tracking-tight">{value}</p>
              <p className="text-xs text-fg-muted mt-0.5 truncate">{label}</p>
              <p className="text-[10px] text-fg-subtle mt-1 flex items-center gap-1">
                <TrendingUp className="size-3 shrink-0 text-success" />
                <span>{sub}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">

        {/* ── Left ── */}
        <div className="space-y-5">

          {/* Courses */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg">
                {isTeacher ? 'Your Courses' : 'Enrolled Courses'}
              </h3>
              <Link href="/courses" className="flex items-center gap-1 text-xs text-accent hover:text-accent-strong transition-colors">
                View All <ArrowRight className="size-3" />
              </Link>
            </div>

            {courses.length === 0 ? (
              <p className="text-xs text-fg-subtle text-center py-6">
                {isTeacher ? 'No courses created yet.' : 'You have not joined any courses yet.'}
              </p>
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 4).map((course) => {
                  const courseAssignments = assignments.filter((a) => a.courseId === course.id);
                  const submitted = isTeacher
                    ? submissions.filter((s) => s.courseId === course.id).length
                    : courseAssignments.filter((a) => a.submission).length;
                  const pct = courseAssignments.length === 0 ? 0
                    : Math.round((submitted / courseAssignments.length) * 100);

                  return (
                    <Link key={course.id} href={`/courses/${course.id}`} className="block group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex size-6 shrink-0 items-center justify-center rounded bg-accent/10 text-accent">
                            <GraduationCap className="size-3.5" />
                          </div>
                          <span className="text-xs font-medium text-fg-muted group-hover:text-fg truncate transition-colors">
                            {course.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isTeacher && (
                            <span className="text-[10px] text-fg-subtle">
                              {course.studentCount ?? 0} students
                            </span>
                          )}
                          <span className="text-xs font-bold text-fg">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-accent transition-[width] duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Upcoming Assignments */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg">Upcoming Assignments</h3>
              {dueSoonAssignments.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-warning bg-warning/10 rounded-full px-2 py-0.5">
                  <AlertCircle className="size-3" />
                  {dueSoonAssignments.length} due soon
                </span>
              )}
            </div>

            {upcomingAssignments.length === 0 ? (
              <p className="text-xs text-fg-subtle text-center py-6">No upcoming assignments.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingAssignments.map((a) => {
                  const soon    = getDueSoon(a.dueDate);
                  const hasSubmission = !isTeacher && !!a.submission;
                  return (
                    <Link
                      key={a.id}
                      href={`/courses/${a.courseId}/assignments/${a.id}${isTeacher ? '/submissions' : ''}`}
                      className="flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded border transition-colors',
                          hasSubmission
                            ? 'border-success/40 bg-success/10 text-success'
                            : soon
                              ? 'border-warning/40 bg-warning/10 text-warning'
                              : 'border-border bg-surface-2 text-fg-subtle',
                        )}>
                          {hasSubmission
                            ? <CheckCircle2 className="size-3.5" />
                            : <FileCode2 className="size-3.5" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-fg-muted group-hover:text-fg truncate transition-colors">
                            {a.title}
                          </p>
                          <p className="text-[10px] text-fg-subtle truncate">{a.courseTitle}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn(
                          'text-[10px] font-semibold',
                          soon ? 'text-warning' : 'text-fg-subtle',
                        )}>
                          {a.dueDate ? formatDateOnly(a.dueDate) : '—'}
                        </p>
                        {hasSubmission && (
                          <p className="text-[9px] text-success">Submitted</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Submissions */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-fg">Recent Submissions</h3>
              <span className="text-[10px] text-fg-subtle">{submissions.length} total</span>
            </div>

            {recentActivity.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-fg-muted">No submissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-subtle">
                      <th className="px-5 py-3 font-medium">{isTeacher ? 'Student' : 'Assignment'}</th>
                      <th className="px-5 py-3 font-medium">{isTeacher ? 'Assignment' : 'Course'}</th>
                      <th className="px-5 py-3 font-medium">Submitted</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentActivity.map((row) => {
                      const meta = submissionStatusMeta[row.status];
                      const isGraded = row.grade != null;
                      return (
                        <tr key={row.id} className="hover:bg-surface-2/60 transition-colors">
                          <td className="px-5 py-3 font-medium text-fg">
                            {isTeacher ? row.studentName : row.assignmentTitle}
                          </td>
                          <td className="px-5 py-3 text-fg-muted text-xs">
                            {isTeacher ? row.assignmentTitle : row.courseTitle}
                          </td>
                          <td className="px-5 py-3 text-fg-muted text-xs whitespace-nowrap">
                            {formatDate(row.submittedAt)}
                          </td>
                          <td className="px-5 py-3">
                            {isGraded
                              ? <StatusDot tone="success" label={`Graded · ${row.grade}/100`} />
                              : <StatusDot tone={meta.tone} label={meta.label} pulse={meta.pulse} />
                            }
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link
                              href={isTeacher
                                ? `/courses/${row.courseId}/assignments/${row.assignmentId}/submissions`
                                : `/courses/${row.courseId}/assignments/${row.assignmentId}`}
                              className={buttonVariants('secondary', 'sm')}
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* ── Right ── */}
        <div className="space-y-5">

          {/* Submission Trend Chart */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg">Submission Activity</h3>
              <span className="text-[10px] font-medium text-fg-muted border border-border rounded-md px-2 py-1">
                Last 7 Days
              </span>
            </div>
            {submissions.length === 0 ? (
              <div className="flex h-28 items-center justify-center text-xs text-fg-subtle">
                No submissions yet
              </div>
            ) : (
              <SubmissionSparkline data={submissionTrend} />
            )}
          </section>

          {/* Calendar with due dates */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold text-fg mb-3">Assignment Calendar</h3>
            <MiniCalendar dueDates={dueDates} />
          </section>

          {/* Overdue / Due Soon Alert */}
          {(overdueAssignments.length > 0 || dueSoonAssignments.length > 0) && (
            <section className="rounded-xl border border-danger/20 bg-danger/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="size-4 text-danger shrink-0" />
                <h3 className="text-sm font-semibold text-fg">Needs Attention</h3>
              </div>
              <div className="space-y-2">
                {[...overdueAssignments.slice(0, 3), ...dueSoonAssignments.slice(0, 2)].map((a) => {
                  const overdue = isOverdue(a.dueDate);
                  return (
                    <Link
                      key={a.id}
                      href={`/courses/${a.courseId}/assignments/${a.id}${isTeacher ? '/submissions' : ''}`}
                      className="flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          'size-1.5 rounded-full shrink-0',
                          overdue ? 'bg-danger' : 'bg-warning',
                        )} />
                        <span className="text-xs text-fg-muted group-hover:text-fg truncate transition-colors">
                          {a.title}
                        </span>
                      </div>
                      <span className={cn(
                        'shrink-0 text-[10px] font-semibold',
                        overdue ? 'text-danger' : 'text-warning',
                      )}>
                        {overdue ? 'Overdue' : 'Due soon'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent Lectures */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg">Recent Lectures</h3>
              <button
                id="btn-add-lecture"
                className="flex size-6 items-center justify-center rounded-md border border-border hover:border-border-strong hover:bg-surface-2 transition-colors text-fg-muted hover:text-fg"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            {lectures.length === 0 ? (
              <p className="text-xs text-fg-subtle text-center py-4">No lectures yet.</p>
            ) : (
              <div className="space-y-2.5">
                {lectures
                  .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                  .slice(0, 4)
                  .map((lec) => {
                    const course = courses.find((c) => c.id === lec.courseId);
                    const color  = avatarColor(lec.courseId);
                    return (
                      <div
                        key={lec.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 border border-border/50 hover:border-border-strong hover:bg-surface-2/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="size-1.5 rounded-full shrink-0"
                            style={{ background: color }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-fg truncate">{lec.title}</p>
                            {course && (
                              <p className="text-[10px] text-fg-subtle truncate">{course.title}</p>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] text-fg-subtle ml-2 whitespace-nowrap">
                          {formatDateOnly(lec.date)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          {/* Team / Student Activity */}
          {isTeacher && submissions.length > 0 && (
            <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
              <h3 className="text-sm font-semibold text-fg mb-4">Student Activity</h3>
              <div className="space-y-3">
                {submissions.slice(0, 5).map((s, i) => {
                  const color = avatarColor(s.studentId);
                  return (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: color }}
                        >
                          {getInitials(s.studentName)}
                        </div>
                        <span className="text-xs text-fg-muted truncate">
                          <span className="text-fg font-medium">{s.studentName}</span>
                          {' '}submitted <span className="italic">{s.assignmentTitle}</span>
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] text-fg-subtle whitespace-nowrap">
                        {formatDate(s.submittedAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Personal stats for students */}
          {!isTeacher && (
            <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
              <h3 className="text-sm font-semibold text-fg mb-4">My Progress</h3>
              <div className="space-y-3">
                {[
                  { label: 'Assignments Submitted', value: submissions.length, total: assignments.length, color: '#2dd4bf' },
                  { label: 'Graded',                value: gradedSubmissions.length, total: submissions.length, color: '#34d399' },
                  { label: 'Pending Review',         value: pendingSubmissions.length, total: submissions.length, color: '#f5a524' },
                ].map(({ label, value, total, color }) => {
                  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-fg-muted">{label}</span>
                        <span className="text-xs font-bold text-fg">{value}<span className="text-fg-subtle font-normal">/{total}</span></span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-[width] duration-700"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Language breakdown */}
                {submissions.length > 0 && (() => {
                  const langs: Record<string, number> = {};
                  for (const s of submissions) langs[s.language] = (langs[s.language] ?? 0) + 1;
                  return (
                    <div className="pt-2 mt-1 border-t border-border">
                      <p className="text-[10px] text-fg-subtle mb-2">Languages used</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(langs).map(([lang, count]) => (
                          <span key={lang}
                            className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] font-medium text-fg-muted">
                            {lang} · {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
