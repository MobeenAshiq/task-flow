import { ExecutionLanguage, SubmissionStatus } from '@/lib/types';
import type { Tone } from '@/components/ui/StatusDot';

export const submissionStatusMeta: Record<SubmissionStatus, { label: string; tone: Tone; pulse?: boolean }> = {
  [SubmissionStatus.PENDING]: { label: 'Queued', tone: 'warning' },
  [SubmissionStatus.PROCESSING]: { label: 'Running', tone: 'info', pulse: true },
  [SubmissionStatus.PASSED]: { label: 'Passed', tone: 'success' },
  [SubmissionStatus.FAILED]: { label: 'Failed', tone: 'danger' },
  [SubmissionStatus.TIME_LIMIT_EXCEEDED]: { label: 'Time limit exceeded', tone: 'danger' },
  [SubmissionStatus.MEMORY_LIMIT_EXCEEDED]: { label: 'Memory limit exceeded', tone: 'danger' },
  [SubmissionStatus.COMPILATION_ERROR]: { label: 'Compile error', tone: 'danger' },
  [SubmissionStatus.RUNTIME_ERROR]: { label: 'Runtime error', tone: 'danger' },
};

export const languageMeta: Record<ExecutionLanguage, { label: string; monacoId: string }> = {
  [ExecutionLanguage.JAVASCRIPT]: { label: 'JavaScript', monacoId: 'javascript' },
  [ExecutionLanguage.TYPESCRIPT]: { label: 'TypeScript', monacoId: 'typescript' },
  [ExecutionLanguage.PYTHON]: { label: 'Python', monacoId: 'python' },
  [ExecutionLanguage.CPP]: { label: 'C++', monacoId: 'cpp' },
  [ExecutionLanguage.NODEJS]: { label: 'Node.js', monacoId: 'javascript' },
};

export function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateOnly(value?: string | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
