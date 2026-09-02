'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, KeySquare, Plus, Users } from 'lucide-react';
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
    // `load` is also reused as the join-modal's refresh callback, so it's kept
    // in component scope rather than declared inline.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-fg">Courses</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {isTeacher ? 'Courses you teach.' : 'Courses you are enrolled in.'}
          </p>
        </div>
        {isTeacher ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create course
          </Button>
        ) : (
          <Button onClick={() => setJoinOpen(true)}>
            <KeySquare className="size-4" />
            Join course
          </Button>
        )}
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label="Loading courses…" />
      ) : courses.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <BookOpen className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">
            {isTeacher ? 'You have not created any courses yet.' : 'You have not joined any courses yet.'}
          </p>
          <Button variant="secondary" onClick={() => (isTeacher ? setCreateOpen(true) : setJoinOpen(true))}>
            {isTeacher ? 'Create your first course' : 'Join with a code'}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="group flex h-full flex-col justify-between p-5 hover:border-border-strong">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-fg group-hover:text-accent">{course.title}</h3>
                    {isTeacher && (
                      <span className="shrink-0 rounded-md border border-border-strong bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-widest text-accent">
                        {course.joinCode}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-fg-muted">
                    {course.description || 'No description provided.'}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-fg-muted">
                  <div className="flex items-center gap-3">
                    {isTeacher ? (
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" />
                        {course.studentCount ?? 0}
                      </span>
                    ) : (
                      <span>{course.teacherName}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3.5" />
                      {course.assignmentCount ?? 0}
                    </span>
                  </div>
                  <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Card>
            </Link>
          ))}
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
