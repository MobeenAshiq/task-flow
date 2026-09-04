'use client';

import { useState } from 'react';
import {
  FolderOpen,
  CheckSquare,
  Clock,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';

// ─── Types ──────────────────────────────────────────────────────────────────
type TaskTag = 'Design' | 'Meeting' | 'Review' | 'Finance' | 'Done';

interface Project {
  name: string;
  icon: string;
  progress: number;
}

interface Task {
  id: string;
  label: string;
  tag: TaskTag;
  done: boolean;
}

interface Activity {
  name: string;
  initials: string;
  color: string;
  text: string;
  time: string;
}

interface Note {
  text: string;
  date: string;
  color: string;
  accent: string;
}

// ─── Data ───────────────────────────────────────────────────────────────────
const PROJECTS: Project[] = [
  { name: 'Website Redesign',  icon: '🌐', progress: 85 },
  { name: 'CRM Dashboard',     icon: '📊', progress: 62 },
  { name: 'Marketing Website', icon: '📣', progress: 40 },
  { name: 'Mobile App',        icon: '📱', progress: 75 },
  { name: 'Admin Panel',       icon: '🛡️', progress: 95 },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', label: 'Design Homepage',   tag: 'Design',  done: true  },
  { id: 't2', label: 'Client Meeting',    tag: 'Meeting', done: false },
  { id: 't3', label: 'Review Prototype',  tag: 'Review',  done: false },
  { id: 't4', label: 'Send Invoice',      tag: 'Finance', done: false },
  { id: 't5', label: 'Publish Update',    tag: 'Done',    done: true  },
];

const ACTIVITIES: Activity[] = [
  { name: 'Alex',  initials: 'AJ', color: '#2563eb', text: 'uploaded dashboard.fig', time: '2h ago' },
  { name: 'Sarah', initials: 'SR', color: '#7c3aed', text: 'completed task',          time: '4h ago' },
  { name: 'Mike',  initials: 'MK', color: '#059669', text: 'commented',               time: '6h ago' },
  { name: 'Emma',  initials: 'EM', color: '#d97706', text: 'created project',         time: '1d ago' },
  { name: 'John',  initials: 'JH', color: '#db2777', text: 'updated timeline',        time: '3h ago' },
];

const NOTES: Note[] = [
  { text: 'Finish UI Kit',     date: 'Aug 14', color: 'rgba(37,99,235,0.10)',  accent: '#3b82f6' },
  { text: 'Meeting 2 PM',      date: 'Aug 14', color: 'rgba(5,150,105,0.10)', accent: '#10b981' },
  { text: 'Update Components', date: 'Aug 15', color: 'rgba(217,119,6,0.10)', accent: '#f59e0b' },
];

const TAG_STYLES: Record<TaskTag, string> = {
  Design:  'bg-blue-500/15 text-blue-400',
  Meeting: 'bg-amber-500/15 text-amber-400',
  Review:  'bg-violet-500/15 text-violet-400',
  Finance: 'bg-pink-500/15 text-pink-400',
  Done:    'bg-surface-2 text-fg-subtle',
};

// ─── Analytics Chart ─────────────────────────────────────────────────────────
const CHART_DATA = [18, 35, 30, 65, 50, 72, 40, 60, 55, 75];
const X_LABELS  = ['Aug 1', 'Aug 6', 'Aug 11', 'Aug 16', 'Aug 21', 'Aug 26', 'Aug 31'];
const Y_TICKS   = [100, 75, 50, 25, 0];
const CW = 400, CH = 130;

function buildPath(pts: number[]) {
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * CW);
  const ys = pts.map((v) => ((100 - v) / 100) * CH);
  const line  = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const area  = `${line} L${xs[xs.length - 1]},${CH} L0,${CH} Z`;
  return { xs, ys, line, area };
}

function AnalyticsChart() {
  const { xs, ys, line, area } = buildPath(CHART_DATA);
  return (
    <div className="space-y-1">
      <div className="flex gap-3">
        {/* Y labels */}
        <div className="flex flex-col justify-between text-right shrink-0" style={{ height: CH }}>
          {Y_TICKS.map((v) => (
            <span key={v} className="text-[10px] leading-none text-fg-subtle">{v}%</span>
          ))}
        </div>
        {/* SVG */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" className="w-full" style={{ height: CH }}>
            <defs>
              <linearGradient id="cgr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"   />
              </linearGradient>
            </defs>
            {Y_TICKS.map((v) => {
              const y = ((100 - v) / 100) * CH;
              return <line key={v} x1="0" y1={y} x2={CW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
            })}
            <path d={area} fill="url(#cgr)" />
            <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {xs.map((x, i) => (
              <circle key={i} cx={x} cy={ys[i]} r="3.5" fill="#0c1015" stroke="#3b82f6" strokeWidth="2" />
            ))}
          </svg>
        </div>
      </div>
      {/* X labels */}
      <div className="flex justify-between pl-9">
        {X_LABELS.map((l) => (
          <span key={l} className="text-[10px] text-fg-subtle">{l}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Mini Calendar ───────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MiniCalendar() {
  const today = new Date();
  const [current, setCurrent] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = current.getFullYear();
  const month = current.getMonth();
  const monthLabel = current.toLocaleString('default', { month: 'long' });
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMon  = new Date(year, month + 1, 0).getDate();
  const prevEnd    = new Date(year, month, 0).getDate();

  type CellType = 'prev' | 'curr' | 'next';
  const cells: { day: number; type: CellType }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevEnd - i, type: 'prev' });
  for (let d = 1; d <= daysInMon; d++) cells.push({ day: d, type: 'curr' });
  for (let d = 1; cells.length < 42; d++) cells.push({ day: d, type: 'next' });

  const isToday = (d: number, t: CellType) =>
    t === 'curr' && d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          id="cal-prev"
          onClick={() => setCurrent(new Date(year, month - 1, 1))}
          className="p-1 rounded hover:bg-surface-2 text-fg-muted hover:text-fg transition-colors"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <span className="text-xs font-semibold text-fg">{monthLabel} {year}</span>
        <button
          id="cal-next"
          onClick={() => setCurrent(new Date(year, month + 1, 1))}
          className="p-1 rounded hover:bg-surface-2 text-fg-muted hover:text-fg transition-colors"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-fg-subtle font-medium py-1">{d}</div>
        ))}
        {cells.map((cell, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-center h-7 w-7 mx-auto rounded-full text-[11px] font-medium cursor-default select-none transition-colors',
              cell.type !== 'curr'                         && 'text-fg-subtle/30',
              cell.type === 'curr' && !isToday(cell.day, cell.type) && 'text-fg-muted hover:bg-surface-2',
              isToday(cell.day, cell.type)                 && 'bg-blue-600 text-white font-bold',
            )}
          >
            {cell.day}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function DashboardOverview() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="p-5 lg:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-fg tracking-tight">Overview</h2>
        <p className="text-xs text-fg-muted mt-0.5">Welcome back. Here's today's productivity overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {([
          { id: 'stat-projects', icon: FolderOpen,   label: 'Active Projects', value: '24',   sub: '+12% vs last month', tone: 'info'    },
          { id: 'stat-tasks',    icon: CheckSquare,   label: 'Tasks Completed', value: '156',  sub: '+8% vs last month',  tone: 'success' },
          { id: 'stat-hours',    icon: Clock,         label: 'Hours Tracked',   value: '132h', sub: '+5% vs last month',  tone: 'warning' },
          { id: 'stat-members',  icon: Users,         label: 'Team Members',    value: '18',   sub: '+2 vs last month',   tone: 'accent'  },
        ] as const).map(({ id, icon: Icon, label, value, sub, tone }) => (
          <div
            id={id}
            key={id}
            className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5 flex items-start gap-4 hover:border-border-strong transition-colors group"
          >
            <div className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg mt-0.5',
              tone === 'info'    && 'bg-info/10 text-info',
              tone === 'success' && 'bg-success/10 text-success',
              tone === 'warning' && 'bg-warning/10 text-warning',
              tone === 'accent'  && 'bg-accent/10 text-accent',
            )}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-fg tracking-tight">{value}</p>
              <p className="text-xs text-fg-muted mt-0.5">{label}</p>
              <p className="text-[10px] text-success mt-1 flex items-center gap-1">
                <TrendingUp className="size-3 shrink-0" />
                <span>{sub}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">

        {/* Left column */}
        <div className="space-y-5">

          {/* Project Progress */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg">Project Progress</h3>
              <button id="btn-view-projects" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                View All <ExternalLink className="size-3" />
              </button>
            </div>
            <div className="space-y-4">
              {PROJECTS.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{p.icon}</span>
                      <span className="text-xs font-medium text-fg-muted">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-fg">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-blue-500 transition-[width] duration-700"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Today's Tasks */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg">Today's Tasks</h3>
              <button id="btn-view-tasks" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                View All <ExternalLink className="size-3" />
              </button>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      id={`task-${task.id}`}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        'flex size-4.5 shrink-0 items-center justify-center rounded border transition-all',
                        task.done
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-border-strong bg-transparent hover:border-blue-500',
                      )}
                    >
                      {task.done && (
                        <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className={cn('text-xs truncate', task.done ? 'line-through text-fg-subtle' : 'text-fg-muted')}>
                      {task.label}
                    </span>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold', TAG_STYLES[task.tag])}>
                    {task.tag}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold text-fg mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {ACTIVITIES.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: a.color }}
                    >
                      {a.initials}
                    </div>
                    <span className="text-xs text-fg-muted truncate">
                      <span className="text-fg font-medium">{a.name}</span> {a.text}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10px] text-fg-subtle whitespace-nowrap">{a.time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Analytics */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg">Productivity Analytics</h3>
              <span className="text-[10px] font-medium text-fg-muted border border-border rounded-md px-2 py-1">This Month</span>
            </div>
            <AnalyticsChart />
          </section>

          {/* Calendar */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold text-fg mb-3">Calendar</h3>
            <MiniCalendar />
          </section>

          {/* Workspace Notes */}
          <section className="rounded-xl border border-border bg-surface-1/80 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg">Workspace Notes</h3>
              <button
                id="btn-add-note"
                className="flex size-6 items-center justify-center rounded-md border border-border hover:border-border-strong hover:bg-surface-2 transition-colors text-fg-muted hover:text-fg"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {NOTES.map((note, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-opacity hover:opacity-90"
                  style={{ background: note.color, border: `1px solid ${note.accent}30` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-1.5 rounded-full shrink-0" style={{ background: note.accent }} />
                    <span className="text-xs font-medium text-fg truncate">{note.text}</span>
                  </div>
                  <span className="shrink-0 text-[10px] text-fg-subtle ml-2">{note.date}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
