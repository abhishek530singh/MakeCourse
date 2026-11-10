"use client";

import { Check, Copy, BookOpen, Lightbulb } from "lucide-react";
import { useState } from "react";

interface LessonNotesProps {
  notes: string;
  keyTakeaways: string[];
  lessonTitle: string;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Split inline code (`...`) and bold (**...**) safely without dangerouslySetInnerHTML
  const parts: React.ReactNode[] = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={`c-${keyIdx++}`}
          className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-brand-700 dark:bg-zinc-800 dark:text-brand-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold text-zinc-900 dark:text-zinc-100">
          {token.slice(2, -2)}
        </strong>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
        <span>{lang || "code"}</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{copiedCode ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[11px] leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderMarkdownBlocks(markdown: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split fenced code blocks first
  const segments = markdown.split(/(```[\s\S]*?```)/g);

  segments.forEach((segment, segIdx) => {
    if (segment.startsWith("```") && segment.endsWith("```")) {
      const inner = segment.slice(3, -3);
      const firstNewline = inner.indexOf("\n");
      const lang = firstNewline !== -1 ? inner.slice(0, firstNewline).trim() : "";
      const code = firstNewline !== -1 ? inner.slice(firstNewline + 1).trimEnd() : inner.trim();
      nodes.push(<CodeBlock key={`code-${segIdx}`} code={code} lang={lang} />);
      return;
    }

    const lines = segment.split(/\r?\n/);
    let bulletBuffer: string[] = [];
    let orderedBuffer: string[] = [];

    const flushLists = (keyPrefix: string) => {
      if (bulletBuffer.length > 0) {
        nodes.push(
          <ul key={`${keyPrefix}-ul-${nodes.length}`} className="my-2 space-y-1.5 pl-1">
            {bulletBuffer.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>{renderInlineMarkdown(item)}</span>
              </li>
            ))}
          </ul>
        );
        bulletBuffer = [];
      }
      if (orderedBuffer.length > 0) {
        nodes.push(
          <ol key={`${keyPrefix}-ol-${nodes.length}`} className="my-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
            {orderedBuffer.map((item, idx) => (
              <li key={idx}>{renderInlineMarkdown(item)}</li>
            ))}
          </ol>
        );
        orderedBuffer = [];
      }
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushLists(`s${segIdx}-${lineIdx}`);
        return;
      }

      if (trimmed.startsWith("#### ")) {
        flushLists(`s${segIdx}-${lineIdx}`);
        nodes.push(
          <h4 key={`h4-${segIdx}-${lineIdx}`} className="mt-4 mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            {renderInlineMarkdown(trimmed.slice(5))}
          </h4>
        );
        return;
      }

      if (trimmed.startsWith("### ")) {
        flushLists(`s${segIdx}-${lineIdx}`);
        nodes.push(
          <h3 key={`h3-${segIdx}-${lineIdx}`} className="mt-3 mb-2 text-sm font-bold text-zinc-900 dark:text-white">
            {renderInlineMarkdown(trimmed.slice(4))}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (orderedBuffer.length > 0) flushLists(`s${segIdx}-${lineIdx}`);
        bulletBuffer.push(trimmed.slice(2));
        return;
      }

      const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
      if (orderedMatch) {
        if (bulletBuffer.length > 0) flushLists(`s${segIdx}-${lineIdx}`);
        orderedBuffer.push(orderedMatch[1]);
        return;
      }

      flushLists(`s${segIdx}-${lineIdx}`);
      nodes.push(
        <p key={`p-${segIdx}-${lineIdx}`} className="my-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    });

    flushLists(`s${segIdx}-end`);
  });

  return nodes;
}

export function LessonNotes({ notes, keyTakeaways, lessonTitle }: LessonNotesProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${lessonTitle}\n\nKey Takeaways:\n${keyTakeaways.join("\n")}\n\n${notes}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            AI Study Notes & Summary
          </h3>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Notes</span>
            </>
          )}
        </button>
      </div>

      {/* Key Takeaways Card */}
      {keyTakeaways && keyTakeaways.length > 0 && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Core Takeaways
            </h4>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-xs text-amber-950 dark:text-amber-200">
            {keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formatted Markdown Notes */}
      <div className="space-y-1">
        {renderMarkdownBlocks(notes)}
      </div>
    </div>
  );
}
