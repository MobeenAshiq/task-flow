'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, NotebookPen, Plus, Video, Calendar, Sparkles, Play, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { lecturesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { UserRole, type Lecture } from '@/lib/types';
import { formatDateOnly } from '@/lib/status';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { MarkdownView } from '@/components/ui/MarkdownView';
import { AddLectureModal } from '@/components/lectures/AddLectureModal';

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

export default function CourseLecturesPage() {
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
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-1 text-xs text-fg-muted">
        <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-1 hover:text-accent">
          <ArrowLeft className="size-3.5" />
          Course
        </Link>
        <span>/</span>
        <span className="text-fg">Lectures</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border-strong bg-surface-1 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-fg">Course Lectures &amp; Notes</h1>
            <Sparkles className="size-4 text-accent" />
          </div>
          <p className="text-xs text-fg-muted">Interactive day-by-day lecture logs, video recordings, and topic notes.</p>
        </div>
        {isTeacher && (
          <Button size="sm" onClick={() => setAddOpen(true)} className="shrink-0">
            <Plus className="size-4" />
            Post Lecture
          </Button>
        )}
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label="Loading lectures…" />
      ) : lectures.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <NotebookPen className="size-10 text-fg-subtle" />
          <p className="text-sm font-medium text-fg">
            {isTeacher ? 'No lectures posted yet.' : 'Your teacher hasn’t posted any lectures yet.'}
          </p>
          {isTeacher && (
            <Button variant="secondary" onClick={() => setAddOpen(true)}>
              Post the first lecture
            </Button>
          )}
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
                <div className="flex flex-col gap-3 border-b border-border/60 bg-surface-1/90 px-6 py-5 backdrop-blur-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${colorTheme.badge}`}>
                      Lecture
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-fg font-heading tracking-tight flex items-center gap-2">
                      <BookOpen className={`size-5.5 ${colorTheme.text}`} />
                      {lecture.title}
                    </h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-fg-subtle bg-surface-2/80 border border-border/60 px-3 py-1.5 rounded-lg shrink-0">
                    <Calendar className="size-3.5 text-accent" />
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
