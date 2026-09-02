import { cn } from '@/lib/cn';

export type Tone = 'accent' | 'warning' | 'danger' | 'success' | 'info' | 'neutral';

const toneClasses: Record<Tone, string> = {
  accent: 'bg-accent',
  warning: 'bg-warning',
  danger: 'bg-danger',
  success: 'bg-success',
  info: 'bg-info',
  neutral: 'bg-fg-subtle',
};

const toneTextClasses: Record<Tone, string> = {
  accent: 'text-accent',
  warning: 'text-warning',
  danger: 'text-danger',
  success: 'text-success',
  info: 'text-info',
  neutral: 'text-fg-muted',
};

export function StatusDot({
  tone,
  label,
  pulse = false,
  className,
}: {
  tone: Tone;
  label: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', toneTextClasses[tone], className)}>
      <span className={cn('size-1.5 rounded-full', toneClasses[tone], pulse && 'animate-pulse-dot')} />
      {label}
    </span>
  );
}
