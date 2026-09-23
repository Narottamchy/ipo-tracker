'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, RefreshCw, Search } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import { detailPathFor, formatDateTime, formatMultiplier, formatNumber, formatPercent } from '../lib/format.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'O', label: 'Open' },
  { key: 'CT', label: 'Closing today' },
  { key: 'U', label: 'Upcoming' },
  { key: 'C', label: 'Closed' },
];

const MARKET_FILTERS = [
  { key: 'all', label: 'All issues' },
  { key: 'mainboard', label: 'Mainboard' },
  { key: 'sme', label: 'SME' },
];

const GMP_FILTERS = [
  { key: 'all', label: 'Any GMP%', test: () => true },
  { key: '0-10', label: '0% – 10%', test: (p) => p >= 0 && p < 10 },
  { key: '10-20', label: '10% – 20%', test: (p) => p >= 10 && p < 20 },
  { key: '20-30', label: '20% – 30%', test: (p) => p >= 20 && p < 30 },
  { key: '30-50', label: '30% – 50%', test: (p) => p >= 30 && p < 50 },
  { key: '50plus', label: '50% & above', test: (p) => p >= 50 },
];

function counts(ipos) {
  return {
    all: ipos.filter((ipo) => ipo.statusCode !== 'C').length,
    O: ipos.filter((ipo) => ipo.statusCode === 'O').length,
    CT: ipos.filter((ipo) => ipo.statusCode === 'CT').length,
    U: ipos.filter((ipo) => ipo.statusCode === 'U').length,
    C: ipos.filter((ipo) => ipo.statusCode === 'C').length,
    mainboard: ipos.filter((ipo) => !ipo.type.includes('SME')).length,
    sme: ipos.filter((ipo) => ipo.type.includes('SME')).length,
  };
}

export default function IpoListClient({ initialData, initialError }) {
  const [ipos, setIpos] = useState(initialData?.ipos || []);
  const [fetchedAt, setFetchedAt] = useState(initialData?.fetchedAt || null);
  const [error, setError] = useState(initialError || null);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');
  const [gmpFilter, setGmpFilter] = useState('all');
  const [query, setQuery] = useState('');
  const busyRef = useRef(false);

  async function load(force = false) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(force ? '/api/ipos?force=1' : '/api/ipos', { signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setIpos(data.ipos);
      setFetchedAt(data.fetchedAt);
    } catch (err) {
      setError(err.name === 'TimeoutError' ? 'Request timed out. Please try again.' : err.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) load();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const countValues = useMemo(() => counts(ipos), [ipos]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const gmpTest = GMP_FILTERS.find((filter) => filter.key === gmpFilter)?.test || (() => true);
    return ipos.filter(
      (ipo) =>
        (statusFilter === 'all' ? ipo.statusCode !== 'C' : ipo.statusCode === statusFilter) &&
        (marketFilter === 'all' || (marketFilter === 'sme' ? ipo.type.includes('SME') : !ipo.type.includes('SME'))) &&
        gmpTest(ipo.gmpPercent || 0) &&
        ipo.name.toLowerCase().includes(q)
    );
  }, [ipos, statusFilter, marketFilter, gmpFilter, query]);

  return (
    <>
      {/* Hero */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-brand-400">THE IPO MARKET, SIMPLIFIED</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-100 sm:text-5xl">
            Latest &amp; upcoming
            <br />
            <em className="text-brand-400 not-italic">IPOs at a glance.</em>
          </h1>
          <p className="mt-3 text-sm text-ink-300">Only the numbers you need: GMP, closing date, and subscription.</p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={busy}
          className="focus-ring flex min-h-[44px] shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm font-medium text-ink-200 transition hover:bg-ink-700 disabled:cursor-wait disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Refresh data</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:hidden">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by IPO status"
            className="focus-ring min-h-[44px] rounded-lg border border-ink-600 bg-ink-800 px-3 text-xs font-medium text-ink-200"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.key} value={filter.key}>
                {filter.label} ({countValues[filter.key]})
              </option>
            ))}
          </select>
          <select
            value={marketFilter}
            onChange={(event) => setMarketFilter(event.target.value)}
            aria-label="Filter by market type"
            className="focus-ring min-h-[44px] rounded-lg border border-ink-600 bg-ink-800 px-3 text-xs font-medium text-ink-200"
          >
            {MARKET_FILTERS.map((filter) => (
              <option key={filter.key} value={filter.key}>
                {filter.label}
                {filter.key !== 'all' ? ` (${countValues[filter.key]})` : ''}
              </option>
            ))}
          </select>
          <select
            value={gmpFilter}
            onChange={(event) => setGmpFilter(event.target.value)}
            aria-label="Filter by GMP percentage"
            className="focus-ring col-span-2 min-h-[44px] rounded-lg border border-ink-600 bg-ink-800 px-3 text-xs font-medium text-ink-200"
          >
            {GMP_FILTERS.map((filter) => (
              <option key={filter.key} value={filter.key}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden flex-col gap-2 sm:flex">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by IPO status">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`focus-ring flex min-h-[38px] shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
                  statusFilter === filter.key
                    ? 'border-brand-600 bg-brand-700 text-white'
                    : 'border-ink-600 bg-ink-800 text-ink-300 hover:border-ink-500'
                }`}
              >
                {filter.label}
                <b
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    statusFilter === filter.key ? 'bg-white/20' : 'bg-ink-700 text-ink-300'
                  }`}
                >
                  {countValues[filter.key]}
                </b>
              </button>
            ))}
          </div>
          <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by market type">
            <span className="hidden shrink-0 text-[9px] font-semibold tracking-widest text-ink-400 sm:inline">MARKET</span>
            {MARKET_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setMarketFilter(filter.key)}
                className={`focus-ring flex min-h-[38px] shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
                  marketFilter === filter.key
                    ? 'border-brand-600 bg-brand-700 text-white'
                    : 'border-ink-600 bg-ink-800 text-ink-300 hover:border-ink-500'
                }`}
              >
                {filter.label}
                {filter.key !== 'all' && (
                  <b
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                      marketFilter === filter.key ? 'bg-white/20' : 'bg-ink-700 text-ink-300'
                    }`}
                  >
                    {countValues[filter.key]}
                  </b>
                )}
              </button>
            ))}
            <select
              value={gmpFilter}
              onChange={(event) => setGmpFilter(event.target.value)}
              aria-label="Filter by GMP percentage"
              className="focus-ring ml-1 min-h-[38px] shrink-0 rounded-lg border border-ink-600 bg-ink-800 px-3 text-xs font-medium text-ink-300"
            >
              {GMP_FILTERS.map((filter) => (
                <option key={filter.key} value={filter.key}>
                  GMP: {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="focus-within:border-brand-500 flex min-h-[44px] items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2 text-ink-400">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search IPO"
            aria-label="Search IPO"
            className="w-full min-w-0 bg-transparent text-sm text-ink-100 placeholder:text-ink-400 focus:outline-none sm:w-40"
          />
        </label>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3.5 text-sm text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* List */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-card" aria-busy={busy}>
        <div className="hidden grid-cols-[minmax(280px,2.1fr)_repeat(3,minmax(130px,1fr))_28px] items-center gap-4 border-b border-ink-700 bg-ink-850 px-6 py-3.5 text-[9px] font-semibold uppercase tracking-widest text-ink-400 sm:grid">
          <span>IPO</span>
          <span>GMP</span>
          <span>Closing date</span>
          <span>Subscription</span>
          <span />
        </div>
        <div className="flex flex-col gap-2.5 p-2.5 sm:gap-0 sm:p-0">
          {visible.length ? (
            visible.map((ipo) => (
              <Link
                key={ipo.sourceUrl}
                href={detailPathFor(ipo.sourceUrl)}
                className="focus-ring group flex items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-850/60 px-4 py-3.5 transition hover:bg-ink-850 sm:grid sm:grid-cols-[minmax(280px,2.1fr)_repeat(3,minmax(130px,1fr))_28px] sm:items-center sm:gap-4 sm:rounded-none sm:border-x-0 sm:border-b sm:border-t-0 sm:border-ink-800 sm:bg-transparent sm:px-6 sm:py-4 sm:last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-900 font-display text-base font-bold text-brand-300">
                    {ipo.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-sm font-semibold text-ink-100">{ipo.name}</h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-ink-700 px-2 py-0.5 text-[9px] font-medium text-ink-300">{ipo.type}</span>
                      <StatusBadge statusCode={ipo.statusCode} status={ipo.status} />
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:hidden">
                  <strong className="flex items-center gap-1.5 font-display text-sm font-semibold text-brand-400">
                    &#8377;{formatNumber(ipo.gmp)}
                    <span className="rounded bg-brand-900/70 px-1.5 py-0.5 text-[8px] font-semibold text-brand-300">{formatPercent(ipo.gmpPercent)}</span>
                  </strong>
                  <span className="text-[10px] text-ink-400">
                    {ipo.closeDate || 'Unavailable'} &middot; {formatMultiplier(ipo.subscription)}
                  </span>
                </div>
                <div className="hidden sm:flex sm:flex-col sm:items-start sm:gap-1">
                  <strong className="flex items-center gap-1.5 font-display text-sm font-semibold text-brand-400">
                    &#8377;{formatNumber(ipo.gmp)}
                    <span className="rounded bg-brand-900/70 px-1.5 py-0.5 text-[9px] font-semibold text-brand-300">{formatPercent(ipo.gmpPercent)}</span>
                  </strong>
                </div>
                <div className="hidden sm:flex sm:flex-col sm:items-start sm:gap-1">
                  <strong className="font-display text-sm font-semibold text-ink-100">{ipo.closeDate || 'Unavailable'}</strong>
                </div>
                <div className="hidden sm:flex sm:flex-col sm:items-start sm:gap-1">
                  <strong className="font-display text-sm font-semibold text-ink-100">{formatMultiplier(ipo.subscription)}</strong>
                </div>
                <div className="hidden h-8 w-8 items-center justify-center rounded-lg border border-ink-700 text-ink-400 transition group-hover:border-brand-600 group-hover:text-brand-400 sm:flex">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </div>
              </Link>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-ink-400">No IPOs match this filter.</div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 border-t border-ink-800 bg-ink-900 px-5 py-4 text-[10px] text-ink-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span role="status">
            {fetchedAt
              ? `${ipos.length} active IPOs · Updated ${formatDateTime(fetchedAt)}`
              : error
                ? 'Data unavailable'
                : 'Fetching live market data…'}
          </span>
          <span>Refreshes every minute</span>
        </div>
      </section>
    </>
  );
}
