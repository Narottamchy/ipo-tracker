'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { formatDateTime } from '../lib/format.js';

function renderInline(text) {
  const lines = text.split(/<br\s*\/?>/gi);
  return lines.flatMap((lineText, lineIndex) => {
    const parts = lineText.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter((p) => p !== '');
    const rendered = parts.map((part, i) => {
      const key = `${lineIndex}-${i}`;
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`'))
        return (
          <code key={key} className="rounded bg-ink-800 px-1 py-0.5 text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) return <em key={key}>{part.slice(1, -1)}</em>;
      return <span key={key}>{part}</span>;
    });
    return lineIndex < lines.length - 1 ? [...rendered, <br key={`br-${lineIndex}`} />] : rendered;
  });
}

function renderAnalysis(text) {
  const lines = text.split('\n');
  const blocks = [];
  let tableRows = [];
  let listItems = [];

  function flushTable() {
    if (!tableRows.length) return;
    const rows = tableRows.filter((row) => !/^\s*\|?\s*:?-{2,}/.test(row));
    blocks.push(
      <div key={`table-${blocks.length}`} className="my-3 overflow-x-auto rounded-lg border border-ink-800">
        <table className="w-full min-w-[420px] border-collapse text-left text-xs">
          <tbody>
            {rows.map((row, i) => {
              const cells = row
                .split('|')
                .map((c) => c.trim())
                .filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));
              return (
                <tr key={i} className={i === 0 ? 'bg-ink-850' : 'border-t border-ink-800'}>
                  {cells.map((cell, j) => (
                    <td key={j} className={`break-words px-3 py-2 align-top ${i === 0 ? 'font-semibold text-ink-200' : 'text-ink-300'}`}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  }

  let listType = 'ul';

  function flushList() {
    if (!listItems.length) return;
    const Tag = listType;
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={`my-2 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} space-y-1.5 pl-5 text-xs leading-relaxed text-ink-300`}
      >
        {listItems.map((item, i) => (
          <li key={i} className="break-words">
            {renderInline(item)}
          </li>
        ))}
      </Tag>
    );
    listItems = [];
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushTable();
      flushList();
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushTable();
      flushList();
      blocks.push(<hr key={blocks.length} className="my-4 border-ink-800" />);
      continue;
    }
    if (line.startsWith('|')) {
      flushList();
      tableRows.push(line);
      continue;
    }
    flushTable();
    if (/^[-*]\s+/.test(line)) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(line.replace(/^[-*]\s+/, ''));
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(line.replace(/^\d+\.\s+/, ''));
      continue;
    }
    flushList();
    if (/^#{1,3}\s+/.test(line)) {
      blocks.push(
        <h3 key={blocks.length} className="mt-5 break-words font-display text-sm font-semibold text-ink-100 first:mt-0">
          {renderInline(line.replace(/^#{1,3}\s+/, ''))}
        </h3>
      );
      continue;
    }
    blocks.push(
      <p key={blocks.length} className="my-1.5 break-words text-xs leading-relaxed text-ink-300">
        {renderInline(line)}
      </p>
    );
  }
  flushTable();
  flushList();
  return blocks;
}

export default function AiAnalysis({ slug, id, initialResult = null }) {
  const [state, setState] = useState(initialResult ? 'done' : 'idle');
  const [result, setResult] = useState(initialResult);
  const [error, setError] = useState(null);

  async function run() {
    setState('loading');
    setError(null);
    try {
      const response = await fetch(`/api/ipo/${slug}/${id}/analysis`, { signal: AbortSignal.timeout(60000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI analysis failed.');
      setResult(data);
      setState('done');
    } catch (err) {
      setError(err.name === 'TimeoutError' ? 'AI analysis is taking too long. Please try again.' : err.message);
      setState('error');
    }
  }

  return (
    <section className="rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-400" aria-hidden="true" />
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-brand-400">AI ANALYST</span>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink-100 sm:text-xl">Scorecard &amp; verdict</h2>
        </div>
      </div>

      {state === 'idle' && (
        <div className="mt-4">
          <p className="text-xs leading-relaxed text-ink-400">
            Runs a scoring rubric against this IPO&apos;s live GMP, subscription, and web research data. Shared across all
            visitors — computed once, then cached for everyone.
          </p>
          <button
            type="button"
            onClick={run}
            className="focus-ring mt-3 flex min-h-[40px] items-center gap-2 rounded-lg border border-brand-600 bg-brand-700 px-4 text-xs font-semibold text-white transition hover:bg-brand-600"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Get AI analysis
          </button>
        </div>
      )}

      {state === 'loading' && (
        <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Analyzing live data…
        </div>
      )}

      {state === 'error' && (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-400">{error}</div>
      )}

      {state === 'done' && result && (
        <div className="mt-4">
          <p className="text-[10px] text-ink-400">Generated {formatDateTime(result.generatedAt)} · shared across all visitors</p>
          <div className="mt-2 min-w-0 overflow-x-hidden">{renderAnalysis(result.analysis)}</div>
        </div>
      )}
    </section>
  );
}
