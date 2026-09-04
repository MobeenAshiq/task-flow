'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code,
  Compass,
  Cpu,
  Flame,
  Globe,
  Heart,
  Laptop,
  Layers,
  Play,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { coursesApi } from '@/lib/api';
import type { Course } from '@/lib/types';
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  { id: 'all', name: 'All Courses' },
  { id: 'Development', name: 'Development' },
  { id: 'Data Science & AI', name: 'Data Science & AI' },
  { id: 'UI/UX Design', name: 'UI/UX Design' },
  { id: 'Cloud & DevOps', name: 'Cloud & DevOps' },
];

const DEFAULT_COVERS = [
  '/course_webdev.jpg',
  '/course_ai.jpg',
  '/hero_banner.jpg',
];

const TOPICS = [
  { title: 'Development & Coding', count: 'Interactive Labs', icon: Code, color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30' },
  { title: 'Artificial Intelligence', count: 'Live Sandbox', icon: Cpu, color: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30' },
  { title: 'UI/UX & Product Design', count: 'Design Systems', icon: Layers, color: 'from-pink-500/20 to-rose-500/10 text-pink-400 border-pink-500/30' },
  { title: 'Cloud & Infrastructure', count: 'DevOps & APIs', icon: Globe, color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30' },
];

export default function PublicLandingPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const data = await coursesApi.listPublic();
        setCourses(data);
      } catch {
        // Fallback
      } finally {
        setLoadingCourses(false);
      }
    }
    load();
  }, []);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlisted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-surface-0 text-fg">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-xs">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5" />
          TaskFlow 2.0 Live — Interactive Live Sandbox Execution &amp; Verified Certificates!
          <Link href={accessToken ? '/dashboard' : '/login'} className="ml-2 underline hover:text-amber-200">
            {accessToken ? 'Go to Dashboard ➔' : 'Join Free ➔'}
          </Link>
        </span>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-surface-1/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-slate-950 font-bold shadow-md">
              <BookOpen className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-extrabold tracking-tight text-fg">TaskFlow</span>
              <span className="text-[10px] font-semibold text-accent -mt-1">ACADEMY</span>
            </div>
          </Link>

          {/* Links */}
          <nav className="hidden items-center gap-8 text-xs font-semibold text-fg-muted md:flex">
            <Link href="/" className="text-fg hover:text-accent">
              Home
            </Link>
            <Link href="/courses" className="hover:text-accent">
              All Courses
            </Link>
            <Link href="/lectures" className="hover:text-accent">
              Lectures Feed
            </Link>
            <Link href={accessToken ? '/profile' : '/login'} className="hover:text-accent">
              {accessToken ? 'My Profile' : 'Sign In'}
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {accessToken ? (
              <Button onClick={() => router.push('/dashboard')} size="sm">
                Dashboard
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                  Log In
                </Button>
                <Button size="sm" onClick={() => router.push('/register')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-surface-1 via-surface-0 to-surface-0 px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
          {/* Left Hero Content */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-400">
              <Flame className="size-4 text-amber-400" />
              Over 1,235 Courses Available
            </div>

            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-fg sm:text-5xl md:text-6xl leading-[1.15]">
              Learn new skills.{' '}
              <span className="bg-gradient-to-r from-accent via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Shape your future.
              </span>
            </h1>

            <p className="max-w-xl text-base text-fg-muted leading-relaxed">
              Online tech courses designed to help you build real projects, execute code live in a sandbox, and boost your engineering career with verified credentials.
            </p>

            {/* CTA Controls */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button size="lg" onClick={() => router.push('/courses')} className="h-12 px-7 text-sm font-bold shadow-lg">
                Explore Courses
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => router.push('/lectures')} className="h-12 px-6 text-sm font-semibold">
                <Play className="size-4 text-accent fill-current" />
                Watch Lecture Feed
              </Button>
            </div>

            {/* Stats Metrics Row */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border/60 max-w-lg">
              <div>
                <span className="block text-2xl md:text-3xl font-black text-fg">10K+</span>
                <span className="text-xs text-fg-subtle">Online Courses</span>
              </div>
              <div>
                <span className="block text-2xl md:text-3xl font-black text-fg">50K+</span>
                <span className="text-xs text-fg-subtle">Active Students</span>
              </div>
              <div>
                <span className="block text-2xl md:text-3xl font-black text-amber-400 flex items-center gap-1">
                  4.9 <Star className="size-4 fill-amber-400" />
                </span>
                <span className="text-xs text-fg-subtle">2.3K Reviews</span>
              </div>
            </div>
          </div>

          {/* Right Hero Graphic */}
          <div className="relative lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border-strong bg-surface-1 p-3 shadow-2xl">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl">
                <Image
                  src="/hero_banner.jpg"
                  alt="Student learning anywhere"
                  fill
                  priority
                  className="object-cover transition-transform hover:scale-105 duration-700"
                />
              </div>

              {/* Floating Badge Overlay 1 */}
              <div className="absolute -left-6 top-8 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Award className="size-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">Certificate</span>
                  <span className="block text-[10px] text-slate-400">Earn verified credentials</span>
                </div>
              </div>

              {/* Floating Badge Overlay 2 */}
              <div className="absolute -right-6 bottom-10 flex items-center gap-3 rounded-2xl border border-purple-500/30 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                  <Terminal className="size-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">Live Execution</span>
                  <span className="block text-[10px] text-slate-400">Real-time Sandbox IDE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Section */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="font-heading text-2xl font-bold text-fg sm:text-3xl">All Courses of TaskFlow</h2>
            <p className="text-xs text-fg-muted">Hand-picked interactive courses built by tech industry experts.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'border-accent bg-accent text-slate-950 shadow-md scale-105'
                    : 'border-border bg-surface-1 text-fg-muted hover:border-border-strong hover:text-fg'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Courses Grid */}
        {loadingCourses ? (
          <div className="py-12 text-center text-xs text-fg-muted">Loading live database courses…</div>
        ) : courses.length === 0 ? (
          <div className="py-12 text-center text-xs text-fg-muted">
            No public courses published yet. Log in to create or join your first course!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3">
            {courses
              .filter((c) => selectedCategory === 'all' || (c.category || 'Development') === selectedCategory)
              .map((course, idx) => {
                const cover = course.coverImage || DEFAULT_COVERS[idx % DEFAULT_COVERS.length];
                return (
                  <div
                    key={course.id}
                    onClick={() => router.push(`/courses`)}
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-border-strong bg-surface-1 shadow-md transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl"
                  >
                    {/* Card Image Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
                      <Image
                        src={cover}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-3 top-3 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300 backdrop-blur-xs">
                        {course.category || 'Development'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleWishlist(course.id, e)}
                        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-xs transition-colors hover:text-rose-400"
                      >
                        <Heart className={`size-4 ${wishlisted[course.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-fg-subtle">
                        <span className="font-semibold text-fg">{course.teacherName || 'Faculty Instructor'}</span>
                        <span className="flex items-center gap-1 font-semibold text-amber-400">
                          <Star className="size-3.5 fill-amber-400" />
                          {course.rating || 4.9} (Verified)
                        </span>
                      </div>

                      <h3 className="line-clamp-2 font-heading text-base font-bold text-fg group-hover:text-accent transition-colors">
                        {course.title}
                      </h3>

                      <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-fg-muted">
                        <span>{course.studentCount || 0} Enrolled</span>
                        <span>{course.assignmentCount || 0} Assignments</span>
                        <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-accent">
                          {course.level || 'Beginner'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Learn by Topic Section */}
      <section className="border-t border-border/60 bg-surface-1/50 px-6 py-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-fg sm:text-3xl">Learn by Topic</h2>
            <p className="text-xs text-fg-muted">Browse courses by what interests you most.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOPICS.map((topic, i) => {
              const Icon = topic.icon;
              return (
                <div
                  key={i}
                  onClick={() => router.push('/courses')}
                  className={`group cursor-pointer rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all hover:scale-105 hover:shadow-md ${topic.color}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-surface-1 border border-border">
                      <Icon className="size-6" />
                    </div>
                    <ChevronRight className="size-4 text-fg-subtle transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="font-heading text-base font-bold text-fg">{topic.title}</h4>
                  <span className="text-xs text-fg-muted">{topic.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Value Propositions / Features Bar */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-4 rounded-2xl border border-border-strong bg-surface-1 p-5 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Terminal className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-fg">Live Sandbox Execution</h4>
              <p className="text-xs text-fg-muted">Run Python, C++, Node.js code live in your browser.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-border-strong bg-surface-1 p-5 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-fg">Socratic AI Assistant</h4>
              <p className="text-xs text-fg-muted">Get hints and code analysis without spoiling answers.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-border-strong bg-surface-1 p-5 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Award className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-fg">Verified Certificates</h4>
              <p className="text-xs text-fg-muted">Earn shareable credentials upon course completion.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-border-strong bg-surface-1 p-5 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <UserCheck className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-fg">Teacher Approval Roster</h4>
              <p className="text-xs text-fg-muted">Approved student access for verified learning.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Become an Instructor CTA Banner */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-8 md:p-12 text-white shadow-xl">
          <div className="max-w-xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              Become an Instructor
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight">
              You can join with TaskFlow as an Instructor?
            </h2>
            <p className="text-xs md:text-sm text-white/90 leading-relaxed">
              Publish rich day-by-day lectures with video embeds, manage assignments, approve student rosters, and grade code submissions effortlessly.
            </p>
            <Button
              onClick={() => router.push(accessToken ? '/courses' : '/register')}
              className="h-11 px-6 bg-white text-slate-950 font-bold hover:bg-slate-100 shadow-md"
            >
              Get Started Today ➔
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-surface-1 px-6 py-8 text-xs text-fg-subtle">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-accent" />
            <span className="font-bold text-fg">TaskFlow Academy</span>
            <span>© 2026 TaskFlow Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/courses" className="hover:text-accent">
              Courses
            </Link>
            <Link href="/lectures" className="hover:text-accent">
              Lectures
            </Link>
            <Link href="/login" className="hover:text-accent">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
