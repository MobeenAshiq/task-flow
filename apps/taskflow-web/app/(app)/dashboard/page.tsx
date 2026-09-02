'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Users, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { assignmentsApi, coursesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { UserRole } from '@/lib/types';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { StatusDot } from '@/components/ui/StatusDot';
import { buttonVariants } from '@/components/ui/Button';
import { formatDate } from '@/lib/status';

interface ActivityRow {
  key: string;
  primary: string;
  secondary: string;
  submittedAt: string;
  graded: boolean;
  courseId: string;
  assignmentId: string;
}

interface Metrics {
  courseCount: number;
  secondaryCount: number;
  secondaryLabel: string;
  pendingCount: number;
  completionRate: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const courses = await coursesApi.list();
        const assignmentsByCourse = await Promise.all(
          courses.map((c) => assignmentsApi.listByCourse(c.id).then((a) => ({ course: c, assignments: a })))
        );

        if (user!.role === UserRole.STUDENT) {
          const rows: ActivityRow[] = [];
          let submitted = 0;
          let graded = 0;
          let gradeSum = 0;
          let assignmentTotal = 0;

          for (const { course, assignments } of assignmentsByCourse) {
            assignmentTotal += assignments.length;
            for (const a of assignments) {
              if (!a.submission) continue;
              submitted += 1;
              const hasGrade = a.submission.grade != null;
              if (hasGrade) {
                graded += 1;
                gradeSum += a.submission.grade!;
              }
              rows.push({
                key: a.submission.id,
                primary: a.title,
                secondary: course.title,
                submittedAt: a.submission.submittedAt,
                graded: hasGrade,
                courseId: course.id,
                assignmentId: a.id,
              });
            }
          }

          rows.sort((x, y) => +new Date(y.submittedAt) - +new Date(x.submittedAt));

          if (!cancelled) {
            setMetrics({
              courseCount: courses.length,
              secondaryCount: assignmentTotal,
              secondaryLabel: 'Total Assignments',
              pendingCount: submitted - graded,
              completionRate: submitted === 0 ? 0 : Math.round((graded / submitted) * 100),
            });
            setActivity(rows.slice(0, 8));
          }
        } else {
          const submissionLists = await Promise.all(
            assignmentsByCourse.flatMap(({ course, assignments }) =>
              assignments.map((a) =>
                assignmentsApi
                  .listSubmissions(a.id)
                  .then((subs) => subs.map((s) => ({ ...s, courseId: course.id, assignmentTitle: a.title, assignmentId: a.id })))
              )
            )
          );

          const flat = submissionLists.flat();
          flat.sort((x, y) => +new Date(y.submittedAt) - +new Date(x.submittedAt));

          const gradedCount = flat.filter((s) => s.grade != null).length;
          const enrolledStudents = courses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

          if (!cancelled) {
            setMetrics({
              courseCount: courses.length,
              secondaryCount: enrolledStudents,
              secondaryLabel: 'Enrolled Students',
              pendingCount: flat.length - gradedCount,
              completionRate: flat.length === 0 ? 0 : Math.round((gradedCount / flat.length) * 100),
            });
            setActivity(
              flat.slice(0, 8).map((s) => ({
                key: s.id,
                primary: s.studentName,
                secondary: s.assignmentTitle,
                submittedAt: s.submittedAt,
                graded: s.grade != null,
                courseId: s.courseId,
                assignmentId: s.assignmentId,
              }))
            );
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : 'Failed to load dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isTeacher = user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <h2 className="text-xl font-semibold text-fg">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          {isTeacher ? "Here's how your courses are doing." : 'Here is your progress across your courses.'}
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label="Loading dashboard…" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={BookOpen} label={isTeacher ? 'Active Courses' : 'Enrolled Courses'} value={metrics?.courseCount ?? 0} tone="accent" />
            <StatCard icon={Users} label={metrics?.secondaryLabel ?? ''} value={metrics?.secondaryCount ?? 0} tone="info" />
            <StatCard icon={Zap} label="Pending Submissions" value={metrics?.pendingCount ?? 0} tone="warning" />
            <StatCard icon={CheckCircle2} label="Completion Rate" value={`${metrics?.completionRate ?? 0}%`} tone="success" />
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-fg">Recent activity</h3>
            </CardHeader>
            <CardBody className="p-0">
              {activity.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-fg-muted">Nothing to show yet.</p>
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
                      {activity.map((row) => (
                        <tr key={row.key} className="hover:bg-surface-2/60">
                          <td className="px-5 py-3 font-medium text-fg">{row.primary}</td>
                          <td className="px-5 py-3 text-fg-muted">{row.secondary}</td>
                          <td className="px-5 py-3 text-fg-muted">{formatDate(row.submittedAt)}</td>
                          <td className="px-5 py-3">
                            <StatusDot tone={row.graded ? 'success' : 'warning'} label={row.graded ? 'Graded' : 'Pending'} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link
                              href={
                                isTeacher
                                  ? `/courses/${row.courseId}/assignments/${row.assignmentId}/submissions`
                                  : `/courses/${row.courseId}/assignments/${row.assignmentId}`
                              }
                              className={buttonVariants('secondary', 'sm')}
                            >
                              Review code
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
