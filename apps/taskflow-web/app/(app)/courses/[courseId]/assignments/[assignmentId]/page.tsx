'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Copy,
  Lightbulb,
  MessageCircleQuestion,
  PenLine,
  Play,
  ScanSearch,
  SendHorizontal,
  ShieldBan,
  Sparkles,
  Terminal,
  User,
} from 'lucide-react';
import { aiApi, assignmentsApi, type CodeAnalysis, type RunCodeResult, type SocraticHint } from '@/lib/api';
import { ApiRequestError } from '@/lib/fetch';
import { useSubmissionStream } from '@/hooks/use-submission-stream';
import { formatDate, languageMeta, submissionStatusMeta } from '@/lib/status';
import { ExecutionLanguage, SubmissionStatus, type Assignment, type AssignmentSubmissionSummary } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
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
  const [aiLoading, setAiLoading] = useState<'analyze' | 'hint' | 'ask' | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [codeAnalysis, setCodeAnalysis] = useState<CodeAnalysis | null>(null);
  const [hint, setHint] = useState<SocraticHint | null>(null);
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<{ question: string; answer: string }[]>([]);

  const [runningCode, setRunningCode] = useState(false);
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalTab, setTerminalTab] = useState<'console' | 'tests'>('console');

  const draftKey = `draft_assignment_${assignmentId}`;
  const liveSubmission = useSubmissionStream(submission?.id || '');

  // Never let a stale `language` value (an old draft, a since-narrowed
  // allowed-languages list, ...) show or submit a language this assignment
  // doesn't actually accept.
  const effectiveLanguage =
    assignment && !assignment.allowedLanguages.includes(language) ? assignment.allowedLanguages[0] : language;

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

          // A past submission's language only counts as the default if the
          // assignment still allows it — a teacher may narrow the allowed
          // languages after students have already submitted.
          const defaultLanguage =
            match.submission && match.allowedLanguages.includes(match.submission.language)
              ? match.submission.language
              : match.allowedLanguages[0];
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
      const payload: DraftPayload = { code, language: effectiveLanguage };
      localStorage.setItem(draftKey, JSON.stringify(payload));
      setAutosaved(true);
      const flash = setTimeout(() => setAutosaved(false), 1800);
      return () => clearTimeout(flash);
    }, 700);
    return () => clearTimeout(timer);
  }, [code, effectiveLanguage, draftKey, loading]);

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
      const result = await assignmentsApi.submit(assignmentId, code, effectiveLanguage);
      setSubmission({
        id: result.id,
        status: result.status as SubmissionStatus,
        language: effectiveLanguage,
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
  }, [assignmentId, code, effectiveLanguage]);

  const handleRunCode = useCallback(async () => {
    setRunningCode(true);
    setTerminalOpen(true);
    try {
      const result = await assignmentsApi.runCode(assignmentId, code, effectiveLanguage);
      setRunResult(result);
    } catch (err) {
      setRunResult({
        status: 'FAILED',
        score: 0,
        stdout: '',
        stderr: err instanceof ApiRequestError ? err.message : 'Failed to execute code.',
        executionTimeMs: 0,
        testResults: [],
        executionLogs: `Execution Error: ${err instanceof ApiRequestError ? err.message : 'Failed to execute code.'}`,
      });
    } finally {
      setRunningCode(false);
    }
  }, [assignmentId, code, effectiveLanguage]);

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
      setCodeAnalysis(await aiApi.analyzeCode(code, effectiveLanguage));
    } catch (err) {
      setAiError(err instanceof ApiRequestError ? err.message : 'Could not analyze your code right now.');
    } finally {
      setAiLoading(null);
    }
  }, [code, effectiveLanguage]);

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

  const handleAskQuestion = useCallback(async () => {
    const q = question.trim();
    if (!q) return;
    setAiLoading('ask');
    setAiError(null);
    try {
      const { answer } = await aiApi.ask(q, code || undefined);
      setQaHistory((prev) => [...prev, { question: q, answer }]);
      setQuestion('');
    } catch (err) {
      setAiError(err instanceof ApiRequestError ? err.message : 'Could not get an answer right now.');
    } finally {
      setAiLoading(null);
    }
  }, [question, code]);

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

  const isPastDeadline = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;
  const locked = isPastDeadline || (!!submission && !editingUnlocked);
  const statusMeta = submission ? submissionStatusMeta[submission.status] : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-1 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/courses/${courseId}`} className="shrink-0 text-fg-muted hover:text-accent">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="truncate text-sm font-semibold text-fg">{assignment.title}</h1>
          <span className="hidden shrink-0 text-xs text-fg-subtle sm:inline">
            Due {formatDate(assignment.dueDate)} {isPastDeadline && '(Passed)'}
          </span>
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

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRunCode}
            loading={runningCode}
            className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            <Play className="size-3.5 fill-current" />
            Run Code
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTerminalOpen((prev) => !prev)}
            className="gap-1 text-xs text-fg-muted hover:text-fg"
          >
            <Terminal className="size-3.5 text-emerald-400" />
            Console {runResult ? `(${runResult.status})` : ''}
          </Button>

          {isPastDeadline ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger">
              Submissions Closed (Deadline Passed)
            </span>
          ) : locked ? (
            <Button size="sm" variant="secondary" onClick={() => setEditingUnlocked(true)}>
              <PenLine className="size-3.5" />
              Update Submission
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} loading={submitting}>
              <CheckCircle2 className="size-3.5" />
              {submission ? 'Update Submission' : 'Submit Assignment'}
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
                {/* Header Banner */}
                <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-3.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <Sparkles className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-fg">AI Teaching Assistant</h3>
                      <p className="text-[11px] text-fg-muted">
                        Socratic tutor &amp; code analysis — guides your learning without spoiling answers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleCheckCode}
                    disabled={aiLoading !== null || !code.trim()}
                    className="group flex items-start gap-3 rounded-xl border border-border-strong bg-surface-1 p-3.5 text-left transition-all hover:border-accent/50 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent transition-transform group-hover:scale-110">
                      <ScanSearch className="size-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-fg">
                        {aiLoading === 'analyze' ? 'Checking code…' : 'Check My Code'}
                      </span>
                      <span className="block text-[11px] text-fg-subtle">Complexity &amp; style review</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleGetHint}
                    disabled={aiLoading !== null || !code.trim()}
                    className="group flex items-start gap-3 rounded-xl border border-border-strong bg-surface-1 p-3.5 text-left transition-all hover:border-warning/50 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning transition-transform group-hover:scale-110">
                      <Lightbulb className="size-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-fg">
                        {aiLoading === 'hint' ? 'Thinking…' : 'What Should I Do Next?'}
                      </span>
                      <span className="block text-[11px] text-fg-subtle">Get a Socratic hint</span>
                    </div>
                  </button>
                </div>

                {/* Chat History Feed */}
                {qaHistory.length > 0 && (
                  <div className="space-y-4 pt-1">
                    {qaHistory.map((qa, i) => (
                      <div key={i} className="space-y-3">
                        {/* Student Question Bubble */}
                        <div className="flex items-start justify-end gap-2.5">
                          <div className="max-w-[85%] rounded-2xl rounded-tr-xs border border-accent/30 bg-accent/10 px-4 py-2.5 text-xs font-medium text-fg shadow-xs">
                            {qa.question}
                          </div>
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-3 text-fg-subtle">
                            <User className="size-3.5" />
                          </div>
                        </div>

                        {/* AI Response Card */}
                        <div className="flex items-start gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/20 text-accent">
                            <Sparkles className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-xs border border-border-strong bg-surface-1 p-4 shadow-sm">
                            <div className="mb-2.5 flex items-center justify-between border-b border-border pb-1.5">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                                AI Assistant
                              </span>
                            </div>
                            <MarkdownView content={qa.answer} className="text-xs" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ask Question Card */}
                <Card className="space-y-3 border border-border-strong bg-surface-1 p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <MessageCircleQuestion className="size-4 text-accent" />
                    <span className="text-xs font-semibold text-fg">Ask a Coding Question</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAskQuestion();
                        }
                      }}
                      rows={2}
                      placeholder="Ask about concepts, syntax, or debugging... (e.g. What is artificial intelligence?)"
                      className="flex-1 resize-none bg-surface-0 text-xs focus:border-accent"
                    />
                    <Button
                      size="sm"
                      onClick={handleAskQuestion}
                      loading={aiLoading === 'ask'}
                      disabled={aiLoading !== null || !question.trim()}
                      className="h-10 px-3.5"
                    >
                      <SendHorizontal className="size-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-fg-subtle">Press Enter to send, Shift+Enter for new line</p>
                </Card>

                {aiError && <ErrorNote message={aiError} />}

                {/* Code Analysis Result */}
                {codeAnalysis && (
                  <Card className="space-y-3 border border-border-strong bg-surface-1 p-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <ScanSearch className="size-4 text-accent" />
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-fg">Code Review &amp; Complexity</h4>
                      </div>
                      <span className="font-mono text-xs font-semibold text-accent">
                        Readability {codeAnalysis.readabilityScore}/100
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="rounded-md border border-border-strong bg-surface-2 px-2.5 py-1 font-mono text-accent">
                        Time: {codeAnalysis.timeComplexity}
                      </span>
                      <span className="rounded-md border border-border-strong bg-surface-2 px-2.5 py-1 font-mono text-info">
                        Space: {codeAnalysis.spaceComplexity}
                      </span>
                    </div>
                    <ul className="space-y-1.5 pt-1 text-xs text-fg-muted">
                      {codeAnalysis.styleSuggestions.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-accent">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Socratic Hint Result */}
                {hint && (
                  <div className="space-y-2 rounded-xl border border-warning/30 bg-warning/5 p-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-warning/20 pb-2">
                      <div className="flex items-center gap-2 text-warning">
                        <Lightbulb className="size-4" />
                        <h4 className="text-xs font-semibold uppercase tracking-wider">Next-Step Hint</h4>
                      </div>
                      {!hint.hasCodeSnippets && (
                        <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-fg-subtle">
                          No solution code shown
                        </span>
                      )}
                    </div>
                    <MarkdownView content={hint.hint} className="text-xs text-fg" />
                  </div>
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
                value={effectiveLanguage}
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
              language={languageMeta[effectiveLanguage].monacoId}
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

          {/* Terminal Output Panel */}
          {terminalOpen && (
            <div className="flex h-56 flex-col border-t border-slate-800 bg-slate-950 text-xs shadow-2xl">
              {/* Terminal Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Live Execution Terminal</span>
                  {runResult && (
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                      {runResult.executionTimeMs}ms
                    </span>
                  )}
                  {runResult && (
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 font-mono text-[11px] font-bold',
                        runResult.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      )}
                    >
                      {runResult.status} ({runResult.score}/100)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTerminalTab('console')}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                      terminalTab === 'console' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    Console Output
                  </button>
                  <button
                    type="button"
                    onClick={() => setTerminalTab('tests')}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                      terminalTab === 'tests' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    Test Cases ({runResult?.testResults?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTerminalOpen(false)}
                    className="ml-2 p-1 text-slate-400 hover:text-white"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="scrollbar-fine flex-1 overflow-y-auto p-4 font-mono">
                {runningCode ? (
                  <div className="flex items-center gap-2 text-slate-400 py-4">
                    <Spinner label="Running code in execution sandbox…" />
                  </div>
                ) : !runResult ? (
                  <span className="text-slate-500">Click "Run Code" to execute your solution.</span>
                ) : terminalTab === 'console' ? (
                  <div className="space-y-3">
                    {runResult.stdout && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold mb-1">
                          Standard Output (stdout):
                        </span>
                        <pre className="text-emerald-300 whitespace-pre-wrap bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                          {runResult.stdout}
                        </pre>
                      </div>
                    )}
                    {runResult.stderr && (
                      <div>
                        <span className="text-rose-400 block text-[10px] uppercase font-sans font-semibold mb-1">
                          Errors / Stderr:
                        </span>
                        <pre className="text-rose-400 whitespace-pre-wrap bg-rose-950/40 p-3 rounded-lg border border-rose-900/40">
                          {runResult.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {runResult.testResults.map((tc, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">Test Case #{idx + 1}</span>
                          <span
                            className={cn(
                              'font-bold text-xs px-2 py-0.5 rounded',
                              tc.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            )}
                          >
                            {tc.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        {tc.expectedOutput && (
                          <div className="mt-2 text-slate-400 text-xs space-y-1">
                            <div>
                              Expected: <code className="text-slate-200 font-semibold">{tc.expectedOutput}</code>
                            </div>
                            <div>
                              Actual:{' '}
                              <code className={tc.passed ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                {tc.actualOutput || 'None'}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
