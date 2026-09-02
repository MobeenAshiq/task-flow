'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, CheckCircle2, Copy, Lightbulb, PenLine, ScanSearch, ShieldBan, Sparkles } from 'lucide-react';
import { aiApi, assignmentsApi, type CodeAnalysis, type SocraticHint } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { useSubmissionStream } from '@/hooks/use-submission-stream';
import { formatDate, languageMeta, submissionStatusMeta } from '@/lib/status';
import { ExecutionLanguage, SubmissionStatus, type Assignment, type AssignmentSubmissionSummary } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorNote } from '@/components/ui/ErrorNote';
import { StatusDot } from '@/components/ui/StatusDot';
import { MarkdownView } from '@/components/ui/MarkdownView';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// Minimal shapes we rely on from the Monaco editor/API instances — avoids
// pulling in the full `monaco-editor` types just for this.
interface MonacoEditorLike {
  getDomNode: () => HTMLElement | null;
  addCommand: (keybinding: number, handler: () => void) => void;
}
interface MonacoApiLike {
  KeyMod: { CtrlCmd: number; Shift: number };
  KeyCode: { KeyV: number; Insert: number };
}

const TERMINAL_STATUSES = new Set<SubmissionStatus>([
  SubmissionStatus.PASSED,
  SubmissionStatus.FAILED,
  SubmissionStatus.TIME_LIMIT_EXCEEDED,
  SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
  SubmissionStatus.COMPILATION_ERROR,
  SubmissionStatus.RUNTIME_ERROR,
]);

interface DraftPayload {
  code: string;
  language: ExecutionLanguage;
}

export default function StudentWorkspacePage() {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmissionSummary | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<ExecutionLanguage>(ExecutionLanguage.PYTHON);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [autosaved, setAutosaved] = useState(false);
  const [editingUnlocked, setEditingUnlocked] = useState(false);
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);

  const [leftTab, setLeftTab] = useState<'instructions' | 'ai'>('instructions');
  const [aiLoading, setAiLoading] = useState<'analyze' | 'hint' | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [codeAnalysis, setCodeAnalysis] = useState<CodeAnalysis | null>(null);
  const [hint, setHint] = useState<SocraticHint | null>(null);

  const draftKey = `draft_assignment_${assignmentId}`;
  const liveSubmission = useSubmissionStream(submission?.id || '');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const assignments = await assignmentsApi.listByCourse(courseId);
        const match = assignments.find((a) => a.id === assignmentId);
        if (!match) throw new ApiRequestError('Assignment not found.', 404);
        if (!cancelled) {
          setAssignment(match);
          setSubmission(match.submission ?? null);

          const defaultLanguage = match.submission?.language ?? match.allowedLanguages[0];
          const raw = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null;
          const draft = parseDraft(raw, match.allowedLanguages, defaultLanguage);
          setCode(draft?.code ?? match.starterCode ?? '');
          setLanguage(draft?.language ?? defaultLanguage);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : 'Failed to load assignment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, assignmentId]);

  // Autosave draft (code + chosen language) to localStorage
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      const payload: DraftPayload = { code, language };
      localStorage.setItem(draftKey, JSON.stringify(payload));
      setAutosaved(true);
      const flash = setTimeout(() => setAutosaved(false), 1800);
      return () => clearTimeout(flash);
    }, 700);
    return () => clearTimeout(timer);
  }, [code, language, draftKey, loading]);

  // Merge any live socket updates for the active submission
  useEffect(() => {
    if (!liveSubmission || !submission) return;
    // Syncing in a locally-held submission's status from the socket stream.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubmission((prev) => (prev ? { ...prev, ...(liveSubmission as Partial<AssignmentSubmissionSummary>) } : prev));
  }, [liveSubmission]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback polling in case no realtime event arrives
  const pollAttempts = useRef(0);
  useEffect(() => {
    if (!submission || TERMINAL_STATUSES.has(submission.status)) return;
    pollAttempts.current = 0;

    const interval = setInterval(async () => {
      pollAttempts.current += 1;
      try {
        const assignments = await assignmentsApi.listByCourse(courseId);
        const match = assignments.find((a) => a.id === assignmentId);
        if (match?.submission) setSubmission(match.submission);
      } catch {
        // ignore transient polling errors
      }
      if (pollAttempts.current >= 20) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [submission?.id, submission?.status, courseId, assignmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await assignmentsApi.submit(assignmentId, code, language);
      setSubmission({
        id: result.id,
        status: result.status as SubmissionStatus,
        language,
        submittedAt: new Date().toISOString(),
        grade: null,
        score: null,
      });
      setEditingUnlocked(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  }, [assignmentId, code, language]);

  const flashClipboardNotice = (text: string) => {
    setClipboardNotice(text);
    setTimeout(() => setClipboardNotice(null), 1800);
  };

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      flashClipboardNotice('Copied');
    } catch {
      flashClipboardNotice('Could not copy — select the code and press Ctrl/Cmd+C');
    }
  }, [code]);

  const blockPaste = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    flashClipboardNotice('Pasting is disabled — type your own solution');
  }, []);

  // No-paste policy: students must type their own solution. This blocks every
  // paste vector — the Ctrl/Cmd+V and Shift+Insert shortcuts (via Monaco's own
  // command layer), and the native browser paste/drop events (which also
  // covers middle-click paste and dragging text in), since Monaco's built-in
  // context-menu "Paste" action reads the clipboard directly and bypasses the
  // native `paste` DOM event entirely.
  const handleEditorMount = useCallback(
    (editorInstance: MonacoEditorLike, monacoInstance: MonacoApiLike) => {
      editorInstance.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyV, () =>
        flashClipboardNotice('Pasting is disabled — type your own solution')
      );
      editorInstance.addCommand(monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.Insert, () =>
        flashClipboardNotice('Pasting is disabled — type your own solution')
      );
      const node = editorInstance.getDomNode();
      node?.addEventListener('paste', blockPaste, true);
      node?.addEventListener('drop', blockPaste, true);
    },
    [blockPaste]
  );

  const handleCheckCode = useCallback(async () => {
    setAiLoading('analyze');
    setAiError(null);
    try {
      setCodeAnalysis(await aiApi.analyzeCode(code, language));
    } catch (err) {
      setAiError(err instanceof ApiRequestError ? err.message : 'Could not analyze your code right now.');
    } finally {
      setAiLoading(null);
    }
  }, [code, language]);

  const handleGetHint = useCallback(async () => {
    if (!assignment) return;
    setAiLoading('hint');
    setAiError(null);
    try {
      setHint(await aiApi.socraticHint(assignment.description, code));
    } catch (err) {
      setAiError(err instanceof ApiRequestError ? err.message : 'Could not get a hint right now.');
    } finally {
      setAiLoading(null);
    }
  }, [assignment, code]);

  if (loading) {
    return (
      <div className="p-8">
        <Spinner label="Loading workspace…" />
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <ErrorNote message={error} />
      </div>
    );
  }

  if (!assignment) return null;

  const locked = !!submission && !editingUnlocked;
  const statusMeta = submission ? submissionStatusMeta[submission.status] : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-1 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/courses/${courseId}`} className="shrink-0 text-fg-muted hover:text-accent">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="truncate text-sm font-semibold text-fg">{assignment.title}</h1>
          <span className="hidden shrink-0 text-xs text-fg-subtle sm:inline">Due {formatDate(assignment.dueDate)}</span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {clipboardNotice ? (
            <span className="text-xs text-fg-subtle">{clipboardNotice}</span>
          ) : (
            autosaved && <span className="text-xs text-fg-subtle">Draft autosaved</span>
          )}
          {statusMeta && <StatusDot tone={statusMeta.tone} label={statusMeta.label} pulse={statusMeta.pulse} />}
          {submission?.grade != null && (
            <span className="font-mono text-xs font-semibold text-success">{submission.grade}/100</span>
          )}
          {locked ? (
            <Button size="sm" variant="secondary" onClick={() => setEditingUnlocked(true)}>
              <PenLine className="size-3.5" />
              Resubmit
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} loading={submitting}>
              <CheckCircle2 className="size-3.5" />
              Submit assignment
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div className="border-b border-border px-4 py-2">
          <ErrorNote message={error} />
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border overflow-hidden lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="flex min-h-0 flex-col overflow-hidden bg-surface-0">
          <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-2">
            <button
              onClick={() => setLeftTab('instructions')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                leftTab === 'instructions' ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg'
              )}
            >
              Instructions
            </button>
            <button
              onClick={() => setLeftTab('ai')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                leftTab === 'ai' ? 'bg-accent/10 text-accent' : 'text-fg-muted hover:text-fg'
              )}
            >
              <Sparkles className="size-3.5" />
              AI Assistant
            </button>
          </div>

          <div className="scrollbar-fine min-h-0 flex-1 overflow-y-auto p-6">
            {leftTab === 'instructions' ? (
              <MarkdownView content={assignment.description} />
            ) : (
              <div className="space-y-5">
                <p className="text-xs text-fg-muted">
                  Get feedback on your own code — this never writes or completes it for you.
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleCheckCode}
                    disabled={aiLoading !== null || !code.trim()}
                    className="flex items-start gap-2.5 rounded-lg border border-border-strong bg-surface-1 p-3 text-left transition-colors hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ScanSearch className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>
                      <span className="block text-xs font-semibold text-fg">
                        {aiLoading === 'analyze' ? 'Checking your code…' : 'Check my code'}
                      </span>
                      <span className="block text-[11px] text-fg-subtle">Complexity &amp; style review</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGetHint}
                    disabled={aiLoading !== null || !code.trim()}
                    className="flex items-start gap-2.5 rounded-lg border border-border-strong bg-surface-1 p-3 text-left transition-colors hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
                    <span>
                      <span className="block text-xs font-semibold text-fg">
                        {aiLoading === 'hint' ? 'Thinking…' : 'What should I do next?'}
                      </span>
                      <span className="block text-[11px] text-fg-subtle">A hint, never the solution</span>
                    </span>
                  </button>
                </div>

                {aiError && <ErrorNote message={aiError} />}

                {codeAnalysis && (
                  <Card className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Code check</h4>
                      <span className="text-xs font-mono text-fg-subtle">Readability {codeAnalysis.readabilityScore}/100</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="rounded border border-border-strong bg-surface-2 px-2 py-0.5 font-mono text-accent">
                        Time {codeAnalysis.timeComplexity}
                      </span>
                      <span className="rounded border border-border-strong bg-surface-2 px-2 py-0.5 font-mono text-info">
                        Space {codeAnalysis.spaceComplexity}
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-fg-muted">
                      {codeAnalysis.styleSuggestions.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-fg-subtle">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {hint && (
                  <Card className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Next-step hint</h4>
                      {!hint.hasCodeSnippets && (
                        <span className="text-[10px] text-fg-subtle">No solution code shown</span>
                      )}
                    </div>
                    <p className="text-sm text-fg">{hint.hint}</p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-surface-1">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2 text-xs text-fg-muted">
            <div className="flex items-center gap-2">
              <span>Language</span>
              <Select
                value={language}
                disabled={locked || assignment.allowedLanguages.length < 2}
                onChange={(e) => setLanguage(e.target.value as ExecutionLanguage)}
                title={
                  assignment.allowedLanguages.length < 2
                    ? 'The assignment sets the execution language'
                    : 'Choose the language you are submitting in'
                }
                className="h-7 w-auto py-0 text-xs"
              >
                {assignment.allowedLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {languageMeta[lang].label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1 text-fg-subtle sm:flex" title="Paste is disabled for this assignment — write your own solution">
                <ShieldBan className="size-3.5" />
                No-paste policy
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy code"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                <Copy className="size-3.5" />
                Copy
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <Editor
              height="100%"
              language={languageMeta[language].monacoId}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorMount}
              options={{
                readOnly: locked,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 14 },
                contextmenu: false,
                copyWithSyntaxHighlighting: false,
                dropIntoEditor: { enabled: false },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function parseDraft(
  raw: string | null,
  allowedLanguages: ExecutionLanguage[],
  fallbackLanguage: ExecutionLanguage
): DraftPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.code === 'string') {
      const lang = allowedLanguages.includes(parsed.language) ? parsed.language : fallbackLanguage;
      return { code: parsed.code, language: lang };
    }
  } catch {
    // Legacy drafts were a bare code string, not JSON.
    return { code: raw, language: fallbackLanguage };
  }
  return null;
}
