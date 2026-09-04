import { cn } from '@/lib/cn';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-xs font-medium text-fg-muted', className)}
      {...props}
    />
  );
}

const controlClasses =
  'w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40 transition-colors';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClasses, 'resize-none', className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClasses, className)} {...props} />;
}
