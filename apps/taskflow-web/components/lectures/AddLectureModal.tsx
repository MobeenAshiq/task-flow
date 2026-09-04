'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Label, Input, Textarea } from '@/components/ui/Field';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { lecturesApi } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import type { Lecture } from '@/lib/types';
import { Video, Palette } from 'lucide-react';

function todayLocalDate(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

const COLOR_TAGS = [
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
];

export function AddLectureModal({
  open,
  onClose,
  courseId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  onCreated: (lecture: Lecture) => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayLocalDate());
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [colorTag, setColorTag] = useState('emerald');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDate(todayLocalDate());
    setContent('');
    setVideoUrl('');
    setColorTag('emerald');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const lecture = await lecturesApi.create({
        title: title.trim(),
        content: content.trim(),
        date: new Date(date).toISOString(),
        courseId,
        videoUrl: videoUrl.trim() || undefined,
        colorTag,
      });
      onCreated(lecture);
      handleClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to post lecture.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Post a New Lecture" widthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="lecture-title">Lecture Title</Label>
          <Input
            id="lecture-title"
            required
            autoFocus
            placeholder="e.g. Lecture 4: Advanced Hash Maps & Algorithms"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="lecture-date">Date</Label>
            <Input id="lecture-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="flex items-center gap-1">
              <Palette className="size-3.5 text-accent" />
              Theme Tag
            </Label>
            <div className="flex items-center gap-1.5 pt-1.5">
              {COLOR_TAGS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setColorTag(t.id)}
                  className={`size-6 rounded-full border transition-all ${t.bg} ${
                    colorTag === t.id ? 'ring-2 ring-accent scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={t.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="lecture-video" className="flex items-center gap-1.5">
            <Video className="size-3.5 text-accent" />
            Video Embed URL (Optional)
          </Label>
          <Input
            id="lecture-video"
            type="url"
            placeholder="https://www.youtube.com/embed/..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="lecture-content">Lecture Notes (Markdown Supported)</Label>
          <Textarea
            id="lecture-content"
            required
            rows={7}
            className="font-mono text-xs"
            placeholder={"## What we covered today\n- Hash tables & key lookups\n- Time complexity O(1)"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {error && <ErrorNote message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Publish Lecture
          </Button>
        </div>
      </form>
    </Modal>
  );
}
