'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NotebookPen, Calendar, Sparkles, Video } from 'lucide-react';
import { coursesApi, lecturesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import type { Course, Lecture } from '@/lib/types';
import { formatDateOnly } from '@/lib/status';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { MarkdownView } from '@/components/ui/MarkdownView';

interface LectureWithCourse extends Lecture {
  courseTitle: string;
}

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  cyan: {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/5',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  },
  purple: {
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/5',
    text: 'text-purple-400',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    text: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  rose: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/5',
    text: 'text-rose-400',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
};

function getEmbedVideoUrl(url?: string): string | null {
  if (!url) return null;
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1]?.split('&')[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  return url;
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
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-2 rounded-2xl border border-border-strong bg-surface-1 p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-fg">Global Lectures Feed</h1>
          <Sparkles className="size-4 text-accent" />
        </div>
        <p className="text-xs text-fg-muted">All published lectures and topic logs across your enrolled courses.</p>
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label="Loading lectures…" />
      ) : lectures.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <NotebookPen className="size-10 text-fg-subtle" />
          <p className="text-sm font-medium text-fg">No lectures posted yet across your courses.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {lectures.map((lecture) => {
            const colorTheme = COLOR_MAP[lecture.colorTag || 'emerald'] || COLOR_MAP.emerald;
            const embedUrl = getEmbedVideoUrl(lecture.videoUrl);

            return (
              <Card
                key={lecture.id}
                className={`overflow-hidden border ${colorTheme.border} ${colorTheme.bg} shadow-md transition-all hover:shadow-lg`}
              >
                {/* Header */}
                <div className="flex flex-col gap-2 border-b border-border/60 bg-surface-1/80 px-6 py-4 backdrop-blur-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${colorTheme.badge}`}>
                      {lecture.courseTitle}
                    </span>
                    <Link
                      href={`/courses/${lecture.courseId}/lectures`}
                      className="text-base font-semibold text-fg hover:text-accent"
                    >
                      {lecture.title}
                    </Link>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
                    <Calendar className="size-3.5" />
                    {formatDateOnly(lecture.date)}
                  </span>
                </div>

                {/* Video Embed */}
                {embedUrl && (
                  <div className="relative aspect-video w-full bg-black/60 border-b border-border">
                    <iframe
                      src={embedUrl}
                      title={lecture.title}
                      className="size-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <MarkdownView content={lecture.content} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
