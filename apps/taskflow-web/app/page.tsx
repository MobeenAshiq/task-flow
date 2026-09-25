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
  HelpCircle,
  Laptop,
  Layers,
  Play,
  Rocket,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Terminal,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { coursesApi, cmsApi } from '@/lib/api';
import type { Course, CmsContent } from '@/lib/types';
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

const DEFAULT_TOPICS = [
  { title: 'Development & Coding', count: 'Interactive Labs', icon: Code, color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30' },
  { title: 'Artificial Intelligence', count: 'Live Sandbox', icon: Cpu, color: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30' },
  { title: 'UI/UX & Product Design', count: 'Design Systems', icon: Layers, color: 'from-pink-500/20 to-rose-500/10 text-pink-400 border-pink-500/30' },
  { title: 'Cloud & Infrastructure', count: 'DevOps & APIs', icon: Globe, color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30' },
];

export default function PublicLandingPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [cmsItems, setCmsItems] = useState<CmsContent[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const [courseData, cmsData] = await Promise.all([
          coursesApi.listPublic().catch(() => []),
          cmsApi.listPublic().catch(() => []),
        ]);
        setCourses(courseData);
        setCmsItems(cmsData);
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

  // Dynamic CMS Extractions
  const topAnnouncement = cmsItems.find((i) => i.type === 'announcement') || {
    title: 'TaskFlow 2.0 Live — Interactive Live Sandbox Execution & Verified Certificates!',
    badge: 'Live Now',
    linkUrl: accessToken ? '/dashboard' : '/login',
  };

  const cmsTopics = cmsItems.filter((i) => i.type === 'topic');
  const cmsFeatures = cmsItems.filter((i) => i.type === 'feature');
  const cmsFaqs = cmsItems.filter((i) => i.type === 'faq');

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'Code':
        return Code;
      case 'Cpu':
        return Cpu;
      case 'Layers':
        return Layers;
      case 'Globe':
        return Globe;
      case 'Terminal':
        return Terminal;
      case 'Sparkles':
        return Sparkles;
      case 'Award':
        return Award;
      case 'UserCheck':
        return UserCheck;
      default:
        return Code;
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 text-fg">
      {/* Top Announcement Bar (Dynamic CMS) */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-xs">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5" />
          {topAnnouncement.title}
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
              <Code className="size-5" />
            </div>
            <div>
              <span className="font-heading text-lg font-extrabold tracking-tight text-fg">TaskFlow</span>
              <span className="ml-1.5 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                ACADEMY
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {accessToken ? (
              <>
                <Link
                  href="/cms"
                  className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-accent transition-colors"
                >
                  <SlidersHorizontal className="size-3.5" />
                  CMS Manager
                </Link>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="h-9 px-4 bg-accent text-slate-950 font-bold hover:bg-accent-hover text-xs shadow-xs"
                >
                  Dashboard ➔
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs font-semibold text-fg-muted hover:text-fg">
                  Sign In
                </Link>
                <Button
                  onClick={() => router.push('/register')}
                  className="h-9 px-4 bg-accent text-slate-950 font-bold hover:bg-accent-hover text-xs shadow-xs"
                >
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-surface-1 via-surface-0 to-surface-0 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-semibold text-accent shadow-xs">
                <Sparkles className="size-3.5" />
                <span>Interactive Learning Platform 2.0</span>
              </div>

              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-fg sm:text-5xl lg:text-6xl leading-[1.1]">
                Master Real-World Coding with{' '}
                <span className="bg-gradient-to-r from-accent via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  Live Sandbox Execution
                </span>
              </h1>

              <p className="max-w-2xl text-sm md:text-base text-fg-muted leading-relaxed">
                Join an immersive learning ecosystem with live code evaluation, Socratic AI assistance, instructor-verified assignments, and verified certificates.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  onClick={() => router.push(accessToken ? '/courses' : '/register')}
                  className="h-12 px-7 bg-accent text-slate-950 font-bold text-sm hover:bg-accent-hover shadow-lg shadow-accent/20"
                >
                  Explore Courses ➔
                </Button>
                {accessToken && (
                  <Button
                    onClick={() => router.push('/cms')}
                    variant="ghost"
                    className="h-12 px-6 border border-border text-fg hover:bg-surface-2 text-sm gap-2"
                  >
                    <SlidersHorizontal className="size-4 text-accent" />
                    Open CMS Manager
                  </Button>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-6 pt-4 text-xs text-fg-subtle border-t border-border/40">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="size-4 text-emerald-400" /> Automated Test Runners
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="size-4 text-accent" /> Verified Certification
                </span>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="relative lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface-1 p-3 shadow-2xl">
                <div className="relative aspect-4/3 overflow-hidden rounded-2xl">
                  <Image
                    src="/hero_banner.jpg"
                    alt="TaskFlow Hero Sandbox"
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/20 bg-slate-900/80 p-3 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs text-white">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Terminal className="size-3.5 text-accent" /> Live Code Execution Queue
                      </span>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        System Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="mx-auto max-w-7xl px-6 py-16 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
              <Flame className="size-4" />
              Featured Catalog
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-fg">Explore Instructor Courses</h2>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-accent text-slate-950 font-bold shadow-xs'
                    : 'bg-surface-1 text-fg-muted hover:bg-surface-2 hover:text-fg border border-border/60'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {loadingCourses ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 animate-pulse rounded-2xl bg-surface-1 border border-border" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-fg-muted">
            No courses found in catalog. Create a new course from your instructor dashboard!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses
              .filter((c) => selectedCategory === 'all' || c.category === selectedCategory)
              .map((course, index) => {
                const cover = course.coverImage || DEFAULT_COVERS[index % DEFAULT_COVERS.length];
                const isFav = wishlisted[course.id];
                return (
                  <div
                    key={course.id}
                    onClick={() => router.push(accessToken ? `/courses/${course.id}` : '/login')}
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-surface-1 shadow-sm transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-16/9 overflow-hidden bg-surface-2">
                      <Image
                        src={cover}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      {/* Wishlist Heart */}
                      <button
                        onClick={(e) => toggleWishlist(course.id, e)}
                        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-md transition-transform hover:scale-110"
                      >
                        <Heart className={`size-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                      </button>

                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="rounded-md bg-accent/90 px-2.5 py-1 text-[10px] font-bold text-slate-950 shadow-xs">
                          {course.category || 'Development'}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
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

      {/* Learn by Topic Section (Dynamic CMS Topics) */}
      <section className="border-t border-border/60 bg-surface-1/50 px-6 py-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-fg sm:text-3xl">Learn by Topic</h2>
            <p className="text-xs text-fg-muted">Browse courses by what interests you most.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(cmsTopics.length > 0 ? cmsTopics : DEFAULT_TOPICS).map((topic, i) => {
              const IconComp = 'icon' in topic && typeof topic.icon === 'string' ? getIconComponent(topic.icon) : ('icon' in topic ? (topic.icon as LucideIcon) : Code);
              const title = topic.title;
              const subtitle = 'subtitle' in topic ? topic.subtitle : ('count' in topic ? topic.count : 'Interactive Labs');
              const linkUrl = 'linkUrl' in topic && topic.linkUrl ? topic.linkUrl : '/courses';

              return (
                <div
                  key={i}
                  onClick={() => router.push(linkUrl)}
                  className="group cursor-pointer rounded-2xl border border-border bg-gradient-to-br from-surface-1 to-surface-2 p-6 shadow-xs transition-all hover:scale-105 hover:border-accent/40 hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-surface-1 border border-border text-accent">
                      <IconComp className="size-6" />
                    </div>
                    <ChevronRight className="size-4 text-fg-subtle transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="font-heading text-base font-bold text-fg">{title}</h4>
                  <span className="text-xs text-fg-muted">{subtitle}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Bar (Dynamic CMS Features) */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(cmsFeatures.length > 0
            ? cmsFeatures
            : [
                { title: 'Live Sandbox Execution', subtitle: 'Run Python, C++, Node.js code live in your browser.', icon: 'Terminal' },
                { title: 'Socratic AI Assistant', subtitle: 'Get hints and code analysis without spoiling answers.', icon: 'Sparkles' },
                { title: 'Verified Certificates', subtitle: 'Earn shareable credentials upon course completion.', icon: 'Award' },
                { title: 'Teacher Approval Roster', subtitle: 'Approved student access for verified learning.', icon: 'UserCheck' },
              ]
          ).map((feat, i) => {
            const IconComp = getIconComponent(feat.icon);
            return (
              <div key={i} className="flex items-start gap-4 rounded-2xl border border-border-strong bg-surface-1 p-5 shadow-xs">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <IconComp className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-fg">{feat.title}</h4>
                  <p className="text-xs text-fg-muted">{feat.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section (Dynamic CMS FAQs) */}
      <section className="border-t border-border/60 bg-surface-1/30 px-6 py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
              <HelpCircle className="size-4" /> Frequently Asked Questions
            </div>
            <h2 className="font-heading text-2xl font-bold text-fg sm:text-3xl">Everything You Need to Know</h2>
          </div>

          <div className="space-y-4">
            {(cmsFaqs.length > 0
              ? cmsFaqs
              : [
                  { title: 'How does code submission work on TaskFlow?', subtitle: 'Submissions are compiled and executed against test cases in real-time inside worker containers.' },
                  { title: 'Can instructors publish custom assignments?', subtitle: 'Yes! Instructors can create rich courses, lectures, define test cases, and manage student rosters.' },
                ]
            ).map((faq, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface-1 p-6 space-y-2 shadow-xs">
                <h3 className="font-heading text-base font-bold text-fg flex items-center gap-2">
                  <span className="size-2 rounded-full bg-accent" />
                  {faq.title}
                </h3>
                <p className="text-xs text-fg-muted leading-relaxed pl-4 border-l border-accent/30">{faq.subtitle}</p>
              </div>
            ))}
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
              Join TaskFlow as an Instructor
            </h2>
            <p className="text-xs md:text-sm text-white/90 leading-relaxed">
              Publish day-by-day lectures, manage assignments, approve student rosters, and grade code submissions effortlessly.
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
            <Link href="/cms" className="hover:text-accent">
              CMS Manager
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
