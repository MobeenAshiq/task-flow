import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'accent',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: 'accent' | 'warning' | 'success' | 'info';
}) {
  const toneClasses = {
    accent: 'bg-accent/10 text-accent',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
  }[tone];

  return (
    <Card className="p-5">
      <div className={cn('flex size-9 items-center justify-center rounded-lg', toneClasses)}>
        <Icon className="size-4.5" />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-fg">{value}</p>
      <p className="mt-1 text-xs text-fg-muted">{label}</p>
    </Card>
  );
}
