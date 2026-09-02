'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, NotebookPen, Plus } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { lecturesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { UserRole, type Lecture } from '@/lib/types';
import { formatDateOnly } from '@/lib/status';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { MarkdownView } from '@/components/ui/MarkdownView';
import { AddLectureModal } from '@/components/lectures/AddLectureModal';

export default function LecturesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const isTeacher = user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN;

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await lecturesApi.listByCourse(courseId);
        if (!cancelled) setLectures(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : 'Failed to load lectures.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-1 text-xs text-fg-muted">
        <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-1 hover:text-accent">
          <ArrowLeft className="size-3.5" />
          Course
        </Link>
        <span>/</span>
        <span className="text-fg">Lectures</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Lectures</h1>
          <p className="mt-1 text-sm text-fg-muted">A day-by-day log of what was covered in class.</p>
        </div>
        {isTeacher && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Post lecture
          </Button>
        )}
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label="Loading lectures…" />
      ) : lectures.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <NotebookPen className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">
            {isTeacher ? 'No lectures posted yet.' : 'Your teacher hasn’t posted any lectures yet.'}
          </p>
          {isTeacher && (
            <Button variant="secondary" onClick={() => setAddOpen(true)}>
              Post the first lecture
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {lectures.map((lecture) => (
            <Card key={lecture.id}>
              <CardHeader>
                <h3 className="text-sm font-semibold text-fg">{lecture.title}</h3>
                <span className="shrink-0 text-xs text-fg-subtle">{formatDateOnly(lecture.date)}</span>
              </CardHeader>
              <CardBody>
                <MarkdownView content={lecture.content} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {isTeacher && (
        <AddLectureModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          courseId={courseId}
          onCreated={(lecture) => setLectures((prev) => [lecture, ...prev])}
        />
      )}
    </div>
  );
}
