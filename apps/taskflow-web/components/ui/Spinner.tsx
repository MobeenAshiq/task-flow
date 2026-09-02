import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-fg-muted text-sm">
      <Loader2 className={cn('size-4 animate-spin text-accent', className)} />
      {label && <span>{label}</span>}
    </div>
  );
}
