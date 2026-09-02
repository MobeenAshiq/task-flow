import { UserRole } from '@/lib/types';
import { cn } from '@/lib/cn';

const roleClasses: Record<UserRole, string> = {
  [UserRole.TEACHER]: 'bg-accent/10 text-accent border-accent/30',
  [UserRole.STUDENT]: 'bg-info/10 text-info border-info/30',
  [UserRole.ADMIN]: 'bg-warning/10 text-warning border-warning/30',
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        roleClasses[role],
        className
      )}
    >
      {role}
    </span>
  );
}
