import { AlertTriangle } from 'lucide-react';

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-xs text-danger">
      <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
