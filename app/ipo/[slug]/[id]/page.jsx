import Link from 'next/link';
import { AlertTriangle, ChevronLeft, TrendingDown, TrendingUp } from 'lucide-react';
import Logo from '../../../../components/Logo.jsx';
import ThemeToggle from '../../../../components/ThemeToggle.jsx';
import StatusBadge from '../../../../components/StatusBadge.jsx';
import GmpChart from '../../../../components/GmpChart.jsx';
import { friendlyError, loadDetail } from '../../../../lib/market.js';
import { formatMoney, formatMultiplier, formatNumber, formatPercent, show } from '../../../../lib/format.js';

export const dynamic = 'force-dynamic';

async function getDetail(slug, id) {
  try {
    const data = await loadDetail(slug, id);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: { message: friendlyError(error), status: error.status || 502 } };
  }
}

export async function generateMetadata({ params }) {
  const { slug, id } = await params;
  const { data } = await getDetail(slug, id);
  if (!data) return { title: 'IPO details' };
  return {
    title: `${data.name} IPO`,
    description: `Live GMP, subscription, and issue details for ${data.name} IPO.`,
  };
}

const DEFAULT_CATEGORIES = [
  { label: 'QIB', description: 'Qualified institutions', value: null },
  { label: 'NII / HNI', description: 'Non-institutional investors', value: null },
  { label: 'bNII', description: 'HNI applications above ₹10L', value: null },
  { label: 'sNII', description: 'HNI applications below ₹10L', value: null },
  { label: 'Retail', description: 'Retail individual investors', value: null },
];

function SummaryCard({ label, value, note }) {
  return (
    <article className="rounded-xl border border-ink-700 bg-ink-900 p-4 sm:p-5">
      <span className="block text-[9px] text-ink-400">{label}</span>
      <strong className="my-3 block font-display text-xl font-semibold text-ink-100 sm:text-2xl">{value}</strong>
      {note && <small className="block text-[9px] text-ink-400">{note}</small>}
    </article>
  );
}

function Fact({ label, value }) {
  return (
    <div className="border-r border-t border-ink-800 px-3 py-3 [&:nth-child(-n+2)]:border-t-0 [&:nth-child(2n)]:border-r-0 sm:px-4 sm:py-4 lg:[&:nth-child(-n+4)]:border-t-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(4n)]:border-r-0">
      <span className="block text-[8px] font-semibold uppercase tracking-wide text-ink-400">{label}</span>
      <strong className="mt-1.5 block font-display text-xs font-semibold text-ink-100 sm:mt-2 sm:text-sm">{show(value)}</strong>
    </div>
  );
}

export default async function IpoDetailPage({ params }) {
  const { slug, id } = await params;
  const { data, error } = await getDetail(slug, id);

  if (error) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-10 sm:pt-10">
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error.message}</span>
          </div>
        </main>
      </>
    );
  }

  const breakdown = data.subscriptionBreakdown || { categories: [] };
  const categories = breakdown.categories.length
    ? breakdown.categories
    : [...DEFAULT_CATEGORIES, { label: 'Total', description: 'Overall subscription', value: data.subscription }];
  const trend = data.trend;
  const TrendIcon = trend && trend.netChange < 0 ? TrendingDown : TrendingUp;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-10 sm:pb-20 sm:pt-8">
        <Link href="/" className="focus-ring mb-5 inline-flex min-h-[44px] items-center gap-1.5 text-xs text-ink-300 hover:text-ink-100 sm:mb-8">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to all IPOs
        </Link>

        {/* Hero */}
        <section className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-ink-700 px-2 py-0.5 text-[9px] font-medium text-ink-300">{data.type}</span>
              <StatusBadge statusCode={data.statusCode} status={data.status} />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-100 sm:text-[42px]">{data.name} IPO</h1>
            <p className="mt-2 text-sm text-ink-300">{show([data.sector, data.exchange].filter(Boolean).join(' · '), data.category)}</p>
          </div>
          <div className="sm:text-right">
            <small className="block text-[9px] font-semibold tracking-widest text-ink-400">LIVE GMP</small>
            <strong className="my-1.5 block font-display text-4xl font-bold text-brand-400 sm:text-[42px]">{formatMoney(data.gmp)}</strong>
            <span className="inline-block rounded-md bg-brand-900/60 px-2.5 py-1 text-[11px] font-medium text-brand-300">
              {formatPercent(data.gmpPercent)} vs issue price
            </span>
          </div>
        </section>

        {/* Summary grid */}
        <section className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 lg:grid-cols-4">
          <SummaryCard label="Issue price" value={data.price === null ? show(null) : formatMoney(data.price)} note="upper price band" />
          <SummaryCard
            label="Est. listing"
            value={data.estimatedListingPrice === null ? show(null) : formatMoney(data.estimatedListingPrice)}
            note={`${formatPercent(data.gmpPercent)} indicative gain`}
          />
          <SummaryCard label="Subscription" value={formatMultiplier(data.subscription)} note="times subscribed" />
          <SummaryCard label="Lot size" value={data.lotSize === null ? show(null) : formatNumber(data.lotSize)} note="shares per lot" />
        </section>

                {/* Chart + trend */}
        <section className="mb-5 grid grid-cols-1 gap-4 sm:mb-6 lg:grid-cols-[1.75fr_1fr]">
          <article className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-card sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-brand-400">GMP MOVEMENT</span>
                <h2 className="mt-2 font-display text-lg font-semibold text-ink-100 sm:text-xl">Grey market trend</h2>
              </div>
              <span className="shrink-0 rounded-lg bg-brand-900/60 px-2.5 py-1.5 text-[10px] font-medium text-brand-300">
                {show(trend?.direction, 'Initial')}
              </span>
            </div>
            <GmpChart history={data.history || []} />
          </article>
          <article className="rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-card sm:p-6">
            <span className="text-[10px] font-bold tracking-[0.2em] text-brand-400">TREND READ</span>
            <h2 className="mt-2 flex items-center gap-2 font-display text-lg font-semibold text-ink-100 sm:text-xl">
              <TrendIcon className="h-4 w-4 text-brand-400" aria-hidden="true" />
              {trend ? `${trend.direction} GMP trend` : 'GMP trend not established'}
            </h2>
            <p className="mt-2 min-h-[60px] text-xs leading-relaxed text-ink-300">
              {show(trend?.description, 'There are not enough recorded GMP sessions to establish a trend yet.')}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-lg bg-ink-850 p-3">
                <span className="block text-[8px] uppercase tracking-wide text-ink-400">Starting GMP</span>
                <strong className="mt-1.5 block font-display text-sm font-semibold text-ink-100">
                  {trend ? formatMoney(trend.startingGmp) : formatMoney(data.gmp)}
                </strong>
              </div>
              <div className="rounded-lg bg-ink-850 p-3">
                <span className="block text-[8px] uppercase tracking-wide text-ink-400">Net change</span>
                <strong className="mt-1.5 block font-display text-sm font-semibold text-ink-100">
                  {trend ? `${trend.netChange >= 0 ? '+' : '−'}${formatMoney(Math.abs(trend.netChange))}` : '—'}
                </strong>
              </div>
              <div className="rounded-lg bg-ink-850 p-3">
                <span className="block text-[8px] uppercase tracking-wide text-ink-400">GMP range</span>
                <strong className="mt-1.5 block font-display text-sm font-semibold text-ink-100">{trend ? formatMoney(trend.range) : '—'}</strong>
              </div>
              <div className="rounded-lg bg-ink-850 p-3">
                <span className="block text-[8px] uppercase tracking-wide text-ink-400">Sessions</span>
                <strong className="mt-1.5 block font-display text-sm font-semibold text-ink-100">{show(trend?.sessions)}</strong>
              </div>
            </div>
          </article>
        </section>

        {/* Subscription breakdown */}
        <section className="mb-5 rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-card sm:mb-6 sm:p-6">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-brand-400">LIVE DEMAND</span>
              <h2 className="mt-2 font-display text-lg font-semibold text-ink-100 sm:text-xl">Subscription by investor category</h2>
            </div>
            <span className="text-[9px] text-ink-400">
              {breakdown.updatedText ? `As of ${breakdown.updatedText}` : data.statusCode === 'U' ? 'IPO not open yet' : 'Latest available'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {categories.map((item) => (
              <article
                key={item.label}
                className={`rounded-lg border p-3.5 ${
                  item.label === 'Total' ? 'border-brand-800/60 bg-brand-900/30' : 'border-ink-700 bg-ink-850'
                }`}
              >
                <span className="block text-[9px] font-bold text-ink-300">{item.label}</span>
                <strong className="my-2 block font-display text-lg font-semibold text-brand-300 sm:text-xl">
                  {item.value === null ? 'Not available' : `${formatNumber(item.value)}×`}
                </strong>
                <small className="block text-[8px] leading-relaxed text-ink-400">{item.description}</small>
              </article>
            ))}
          </div>
          {breakdown.totalBidAmountCrore !== null && breakdown.totalBidAmountCrore !== undefined && (
            <div className="mt-3.5 border-t border-ink-800 pt-3.5 text-[10px] text-ink-400">
              Total bid amount: &#8377;{formatNumber(breakdown.totalBidAmountCrore)} crore
            </div>
          )}
        </section>
        
        {/* Issue details */}
        <section className="mb-5 rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-card sm:mb-6 sm:p-6">
          <span className="text-[10px] font-bold tracking-[0.2em] text-brand-400">ISSUE DETAILS</span>
          <h2 className="mt-2 font-display text-lg font-semibold text-ink-100 sm:text-xl">Dates, pricing &amp; lot</h2>
          <div className="mt-4 grid grid-cols-2 border-t border-ink-800 lg:grid-cols-4">
            <Fact label="Opening date" value={data.openDate} />
            <Fact label="Closing date" value={data.closeDate} />
            <Fact label="Listing date" value={data.listingDate} />
            <Fact label="Price band" value={data.priceBand} />
            <Fact label="Issue size" value={data.issueSize} />
            <Fact label="Minimum investment" value={data.minimumInvestment === null ? null : formatMoney(data.minimumInvestment)} />
            <Fact label="Est. profit per lot" value={data.estimatedProfitPerLot === null ? null : formatMoney(data.estimatedProfitPerLot)} />
            <Fact label="Exchange" value={data.exchange} />
            <Fact label="Category" value={data.category} />
          </div>
        </section>

        {/* History table */}
        <section className="rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-card sm:p-6">
          <span className="text-[10px] font-bold tracking-[0.2em] text-brand-400">HISTORY</span>
          <h2 className="mt-2 font-display text-lg font-semibold text-ink-100 sm:text-xl">GMP updates</h2>
          {data.history?.length ? (
            <div className="mt-3.5">
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr>
                    <th className="w-[46%] border-b border-ink-800 pb-3 text-[8px] font-semibold uppercase tracking-wide text-ink-400">Date &amp; time</th>
                    <th className="w-[27%] border-b border-ink-800 pb-3 text-[8px] font-semibold uppercase tracking-wide text-ink-400">GMP</th>
                    <th className="w-[27%] border-b border-ink-800 pb-3 text-[8px] font-semibold uppercase tracking-wide text-ink-400">Movement</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.history].reverse().map((item, i) => (
                    <tr key={i}>
                      <td className="truncate border-b border-ink-800 py-3 text-xs text-ink-200">{item.time}</td>
                      <td className="truncate border-b border-ink-800 py-3 text-xs font-bold text-brand-400">{formatMoney(item.value)}</td>
                      <td className="truncate border-b border-ink-800 py-3 text-xs text-ink-200">{item.direction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3.5 rounded-xl bg-ink-850 p-8 text-center text-xs text-ink-400">No GMP updates recorded yet.</div>
          )}
        </section>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-ink-800 px-4 py-6 text-[10px] text-ink-400 sm:flex-row sm:justify-between sm:px-10">
        <span>
          IPO focus <span className="mx-2 text-ink-600">/</span> Built for clarity.
        </span>
        <span>GMP is unofficial and does not guarantee listing gains.</span>
      </footer>
    </>
  );
}

function SiteHeader() {
  return (
    <header className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-4 sm:h-[90px] sm:px-10">
      <Link href="/" className="focus-ring rounded-md">
        <Logo />
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/" className="focus-ring flex min-h-[44px] items-center gap-1.5 text-xs text-ink-300 hover:text-ink-100">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          All IPOs
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
