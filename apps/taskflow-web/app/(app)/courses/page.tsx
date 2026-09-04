'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Award,
  BookOpen,
  Code2,
  Filter,
  GraduationCap,
  Heart,
  KeySquare,
  Plus,
  Search,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
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
import { CertificateModal } from '@/components/courses/CertificateModal';

const CATEGORIES = [
  'All Courses',
  'Development',
  'Data Science & AI',
  'UI/UX Design',
  'Cloud & DevOps',
  'Cybersecurity',
];

const DEFAULT_COVERS = [
  '/course_webdev.jpg',
  '/course_ai.jpg',
  '/hero_banner.jpg',
];

export default function CoursesPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN;

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('All Courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});

  // Certificate Modal State
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certCourse, setCertCourse] = useState<Course | null>(null);

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

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCert = (course: Course, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCertCourse(course);
    setCertModalOpen(true);
  };

  const filteredCourses = courses.filter((c) => {
    const matchCategory =
      selectedCategory === 'All Courses' ||
      c.category === selectedCategory ||
      (!c.category && selectedCategory === 'Development');
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.joinCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      {/* Header Banner Card */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-accent/30 bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 p-6 shadow-md sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-fg">Course Catalog &amp; Academy</h1>
            <Sparkles className="size-4 text-accent" />
          </div>
          <p className="text-xs text-fg-muted">
            {isTeacher
              ? 'Manage and publish courses, assignments, and lectures for your students.'
              : 'Browse your enrolled courses, live sandbox assignments, and earn verified certificates.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isTeacher ? (
            <Button onClick={() => setCreateOpen(true)} className="shadow-sm">
              <Plus className="size-4" />
              Create Course
            </Button>
          ) : (
            <Button onClick={() => setJoinOpen(true)} className="shadow-sm">
              <KeySquare className="size-4" />
              Join Course with Code
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border-strong bg-surface-1 p-4 shadow-xs">
        {/* Category Pills */}
        <div className="scrollbar-fine flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'border-accent bg-accent text-slate-950 shadow-xs'
                  : 'border-border bg-surface-2 text-fg-muted hover:border-border-strong hover:text-fg'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 size-4 text-fg-subtle" />
          <input
            type="text"
            placeholder="Search courses or codes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-0 py-2 pl-9 pr-4 text-xs text-fg focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label="Loading courses…" />
      ) : filteredCourses.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center border border-border-strong bg-surface-1">
          <BookOpen className="size-10 text-fg-subtle" />
          <p className="text-sm font-medium text-fg">
            {courses.length === 0
              ? isTeacher
                ? 'You have not created any courses yet.'
                : 'You have not joined any courses yet.'
              : 'No courses match your filter criteria.'}
          </p>
          {courses.length === 0 && (
            <Button variant="secondary" onClick={() => (isTeacher ? setCreateOpen(true) : setJoinOpen(true))}>
              {isTeacher ? 'Create your first course' : 'Join with a code'}
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, idx) => {
            const cover = course.coverImage || DEFAULT_COVERS[idx % DEFAULT_COVERS.length];
            const category = course.category || 'Development';
            const level = course.level || 'Beginner';
            const rating = course.rating || 4.9;

            return (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className="group flex h-full flex-col justify-between overflow-hidden border border-border-strong bg-surface-1 shadow-sm transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl">
                  {/* Cover Thumbnail Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
                    <Image
                      src={cover}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300 backdrop-blur-xs">
                      {category}
                    </span>

                    {/* Join Code Badge for Teacher */}
                    {isTeacher && (
                      <span className="absolute right-3 top-3 rounded-lg border border-accent/40 bg-slate-950/80 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-accent backdrop-blur-xs">
                        {course.joinCode}
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(course.id, e)}
                      className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-xs transition-colors hover:text-rose-400"
                    >
                      <Heart className={`size-4 ${wishlisted[course.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-fg-subtle">
                        <span className="flex items-center gap-1 font-semibold text-amber-400">
                          <Star className="size-3.5 fill-amber-400" />
                          {rating} (Verified)
                        </span>
                        <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-accent">
                          {level}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-fg group-hover:text-accent transition-colors">
                        {course.title}
                      </h3>
                      <p className="line-clamp-2 text-xs text-fg-muted">
                        {course.description || 'Interactive course with live sandbox assignments and video lectures.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/60 space-y-3">
                      <div className="flex items-center justify-between text-xs text-fg-muted">
                        <span className="flex items-center gap-1.5">
                          <Users className="size-3.5 text-accent" />
                          {course.studentCount ?? 0} Students
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Code2 className="size-3.5 text-info" />
                          {course.assignmentCount ?? 0} Assignments
                        </span>
                      </div>

                      {/* Certificate Download Button for Students */}
                      {!isTeacher && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handleOpenCert(course, e)}
                          className="w-full gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        >
                          <Award className="size-3.5 text-amber-400" />
                          View Certificate
                        </Button>
                      )}
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

      {/* Certificate Modal */}
      {certCourse && (
        <CertificateModal
          open={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          studentName={user?.name || user?.email || 'Student'}
          courseTitle={certCourse.title}
          teacherName={certCourse.teacherName}
        />
      )}
    </div>
  );
}
