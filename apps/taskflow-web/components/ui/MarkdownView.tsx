import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';
import { Terminal, Copy, Check, Info, AlertTriangle, BookOpen, Sparkles } from 'lucide-react';

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-xl border border-slate-800 bg-slate-950 shadow-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Terminal className="size-3.5" /> Code Snippet
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors bg-slate-800/80 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium"
        >
          {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-emerald-300 leading-relaxed">
        <code>{codeString}</code>
      </pre>
    </div>
  );
}

/**
 * Pre-processes raw or unformatted text to automatically inject markdown syntax
 * for headers, code blocks, and note callouts when plain text was entered.
 */
function autoFormatLectureText(raw: string): string {
  if (!raw) return '';
  // If it already uses markdown headers or code blocks, return as is
  if (raw.includes('# ') || raw.includes('```') || raw.includes('> ')) {
    return raw;
  }

  let formatted = raw;

  // 1. Detect Note: or Warning: and convert to blockquotes
  formatted = formatted.replace(
    /(Note:|Warning:|Be careful:)([\s\S]*?)(?=(\n\n|\n[A-Z]|$))/gi,
    (_, prefix, text) => `\n\n> **${prefix.trim()}** ${text.trim()}\n\n`
  );

  // 2. Detect Syntax lines (e.g. DELETE Syntax DELETE FROM ...)
  formatted = formatted.replace(
    /(DELETE Syntax|SELECT Syntax|UPDATE Syntax|INSERT Syntax|Syntax:?)([\s\S]*?)(?=(\n\n|\n[A-Z]|Note:|$))/gi,
    (_, header, code) => `\n\n### ${header.trim()}\n\`\`\`sql\n${code.trim()}\n\`\`\`\n\n`
  );

  // 3. Detect SQL Statements like "SQL DELETE Statement The DELETE statement is used..."
  formatted = formatted.replace(
    /(SQL [A-Z]+ Statement)/g,
    '\n\n### $1\n'
  );

  // 4. Clean up duplicate line breaks
  return formatted.trim();
}

export function MarkdownView({ content, className }: { content: string; className?: string }) {
  const processedContent = autoFormatLectureText(content);

  return (
    <div className={cn('markdown-body space-y-3 text-fg', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-extrabold font-heading text-fg tracking-tight my-4 flex items-center gap-2 border-b border-border/60 pb-2">
              <BookOpen className="size-5 text-accent shrink-0" />
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold font-heading text-fg tracking-tight my-3.5 flex items-center gap-2 border-b border-border/40 pb-1.5">
              <Sparkles className="size-4.5 text-accent shrink-0" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold font-heading text-fg tracking-tight my-3 flex items-center gap-2">
              <span className="size-2 rounded-full bg-accent inline-block" />
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-base text-fg/90 leading-relaxed my-2 font-normal">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-extrabold text-fg text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              {children}
            </strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-xl border-l-4 border-amber-500 bg-amber-500/10 p-4 text-amber-200 text-sm font-medium shadow-xs flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">{children}</div>
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isCodeBlock = match || String(children).includes('\n');
            if (isCodeBlock) {
              return <CodeBlock>{children}</CodeBlock>;
            }
            return (
              <code
                className="font-mono text-xs font-semibold text-emerald-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md inline-block"
                {...props}
              >
                {children}
              </code>
            );
          },
          ul: ({ children }) => (
            <ul className="my-3 space-y-1.5 list-disc list-inside text-base text-fg/90 pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 space-y-1.5 list-decimal list-inside text-base text-fg/90 pl-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-base text-fg/90 leading-relaxed">{children}</li>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}


