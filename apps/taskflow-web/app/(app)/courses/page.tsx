'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, KeySquare, Plus, Users, Sparkles, GraduationCap, Code2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { coursesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { UserRole, type Course } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { CreateCourseModal } from '@/components/courses/CreateCourseModal';
import { JoinCourseModal } from '@/components/courses/JoinCourseModal';

const GRADIENTS = [
  'from-indigo-600/20 via-purple-600/10 to-transparent border-indigo-500/30',
  'from-cyan-600/20 via-blue-600/10 to-transparent border-cyan-500/30',
  'from-emerald-600/20 via-teal-600/10 to-transparent border-emerald-500/30',
  'from-amber-600/20 via-orange-600/10 to-transparent border-amber-500/30',
];

export default function CoursesPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN;

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCourses(await coursesApi.list());
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      {/* Header Banner Card */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-accent/30 bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 p-6 shadow-md sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-fg">Course Catalog</h1>
            <Sparkles className="size-4 text-accent" />
          </div>
          <p className="text-xs text-fg-muted">
            {isTeacher
              ? 'Manage and publish courses, assignments, and lectures for your students.'
              : 'Browse your enrolled courses, lectures, and assignments.'}
          </p>
        </div>
        {isTeacher ? (
          <Button onClick={() => setCreateOpen(true)} className="shrink-0 shadow-sm">
            <Plus className="size-4" />
            Create Course
          </Button>
        ) : (
          <Button onClick={() => setJoinOpen(true)} className="shrink-0 shadow-sm">
            <KeySquare className="size-4" />
            Join Course with Code
          </Button>
        )}
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label="Loading courses…" />
      ) : courses.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center border border-border-strong bg-surface-1">
          <BookOpen className="size-10 text-fg-subtle" />
          <p className="text-sm font-medium text-fg">
            {isTeacher ? 'You have not created any courses yet.' : 'You have not joined any courses yet.'}
          </p>
          <Button variant="secondary" onClick={() => (isTeacher ? setCreateOpen(true) : setJoinOpen(true))}>
            {isTeacher ? 'Create your first course' : 'Join with a code'}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, idx) => {
            const grad = GRADIENTS[idx % GRADIENTS.length];
            return (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className={`group flex h-full flex-col justify-between overflow-hidden border bg-gradient-to-br ${grad} p-6 shadow-sm transition-all hover:border-accent/50 hover:shadow-md`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-accent">
                        <GraduationCap className="size-5" />
                      </div>
                      {isTeacher && (
                        <span className="shrink-0 rounded-lg border border-accent/40 bg-accent/15 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-accent">
                          {course.joinCode}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-fg group-hover:text-accent transition-colors">
                        {course.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-fg-muted">
                        {course.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4 text-xs text-fg-muted">
                    <div className="flex items-center gap-3">
                      {isTeacher ? (
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users className="size-3.5 text-accent" />
                          {course.studentCount ?? 0} Students
                        </span>
                      ) : (
                        <span className="font-medium text-fg-subtle">{course.teacherName}</span>
                      )}
                      <span className="flex items-center gap-1.5 font-medium">
                        <Code2 className="size-3.5 text-info" />
                        {course.assignmentCount ?? 0} Assignments
                      </span>
                    </div>
                    <div className="flex size-7 items-center justify-center rounded-full bg-surface-2 group-hover:bg-accent group-hover:text-white transition-colors">
                      <ArrowRight className="size-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <CreateCourseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(course) => setCourses((prev) => [course, ...prev])}
      />
      <JoinCourseModal open={joinOpen} onClose={() => setJoinOpen(false)} onJoined={load} />
    </div>
  );
}
