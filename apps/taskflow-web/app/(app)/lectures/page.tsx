'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NotebookPen } from 'lucide-react';
import { coursesApi, lecturesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import type { Course, Lecture } from '@/lib/types';
import { formatDateOnly } from '@/lib/status';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { MarkdownView } from '@/components/ui/MarkdownView';

interface LectureWithCourse extends Lecture {
  courseTitle: string;
}

export default function LecturesPage() {
  const [lectures, setLectures] = useState<LectureWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const courses = await coursesApi.list();
        const perCourse = await Promise.all(
          courses.map(async (course: Course) => {
            const courseLectures = await lecturesApi.listByCourse(course.id);
            return courseLectures.map((lecture) => ({ ...lecture, courseTitle: course.title }));
          })
        );
        const merged = perCourse
          .flat()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (!cancelled) setLectures(merged);
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
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-xl font-semibold text-fg">Lectures</h1>
        <p className="mt-1 text-sm text-fg-muted">Lectures across all your courses.</p>
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label="Loading lectures…" />
      ) : lectures.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <NotebookPen className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">No lectures posted yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {lectures.map((lecture) => (
            <Link key={lecture.id} href={`/courses/${lecture.courseId}/lectures`}>
              <Card className="hover:border-border-strong">
                <CardHeader>
                  <div>
                    <h3 className="text-sm font-semibold text-fg">{lecture.title}</h3>
                    <span className="text-xs text-fg-subtle">{lecture.courseTitle}</span>
                  </div>
                  <span className="shrink-0 text-xs text-fg-subtle">{formatDateOnly(lecture.date)}</span>
                </CardHeader>
                <CardBody>
                  <MarkdownView content={lecture.content} />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
