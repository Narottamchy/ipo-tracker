import { CalendarDays, FileText } from 'lucide-react';

const cardClass = 'rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-card sm:p-6';

function Card({ eyebrow, title, children, className = '' }) {
  return (
    <section className={`${cardClass} ${className}`}>
      <span className="text-[10px] font-bold tracking-[0.2em] text-brand-400">{eyebrow}</span>
      <h2 className="mt-2 font-display text-lg font-semibold text-ink-100 sm:text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Blurb({ children }) {
  return children ? <p className="mt-2.5 break-words text-xs leading-relaxed text-ink-300">{children}</p> : null;
}

function DataTable({ header = [], rows = [], compact = false }) {
  if (!rows.length) return null;
  const width = Math.max(header.length, ...rows.map((r) => r.length));
  const isTextCol = (c) => c === 0 || rows.some((r) => r.length > 1 && (r[c] || '').length > 24 && /[A-Za-z]{3}/.test(r[c]));
  return (
    <div className="mt-3.5 overflow-x-auto rounded-xl border border-ink-800">
      <table className="w-full border-collapse text-left text-xs">
        {header.length > 0 && (
          <thead>
            <tr className="bg-ink-850">
              {header.map((cell, i) => (
                <th
                  key={i}
                  className={`px-3 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-ink-400 ${isTextCol(i) ? 'text-left' : 'text-right'}`}
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, r) =>
            row.length === 1 ? (
              <tr key={r} className="border-t border-ink-800 bg-ink-850/60">
                <td colSpan={width} className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                  {row[0]}
                </td>
              </tr>
            ) : (
              <tr key={r} className="border-t border-ink-800">
                {row.map((cell, c) => {
                  const isLongText = cell.length > 24 && /[A-Za-z]{3}/.test(cell);
                  const tone =
                    c === 0 || isLongText
                      ? `text-left text-ink-200 ${isLongText ? 'min-w-[150px] whitespace-normal' : cell.length > 3 ? 'min-w-[140px]' : ''}`
                      : 'whitespace-nowrap text-right font-medium text-ink-100';
                  return (
                    <td key={c} className={`break-words px-3 ${compact ? 'py-2' : 'py-2.5'} ${tone}`}>
                      {cell || '—'}
                    </td>
                  );
                })}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

function Pairs({ items = [] }) {
  if (!items.length) return null;
  return (
    <dl className="mt-3.5 grid grid-cols-1 border-t border-ink-800 sm:grid-cols-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start justify-between gap-4 border-b border-ink-800 py-3 sm:px-0 sm:odd:pr-6 sm:even:pl-6 sm:even:border-l"
        >
          <dt className="text-[11px] text-ink-400">{item.label}</dt>
          <dd className="break-words text-right text-xs font-semibold text-ink-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function IpoExtraDetails({ data }) {
  if (!data) return null;
  const { details, timetable, reservation, lotSize, anchor, about, financials, objectives, kpi, valuation, shareholding, promoter } = data;

  return (
    <div className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
      {details?.length > 0 && (
        <Card eyebrow="ISSUE STRUCTURE" title="IPO details">
          <Pairs items={details} />
        </Card>
      )}

      {timetable?.length > 0 && (
        <Card eyebrow="SCHEDULE" title="IPO timetable (tentative)">
          <ol className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {timetable.map((step, i) => (
              <li key={i} className="rounded-xl border border-ink-800 bg-ink-850 p-3">
                <CalendarDays className="mb-2 h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
                <span className="block text-[9px] font-semibold uppercase tracking-wide text-ink-400">{step.label}</span>
                <strong className="mt-1 block font-display text-xs font-semibold text-ink-100">{step.value}</strong>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {(reservation?.rows?.length > 0 || lotSize?.rows?.length > 0) && (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          {reservation?.rows?.length > 0 && (
            <Card eyebrow="ALLOCATION" title="Issue reservation">
              <Blurb>{reservation.summary}</Blurb>
              <DataTable header={reservation.header} rows={reservation.rows} compact />
            </Card>
          )}
          {lotSize?.rows?.length > 0 && (
            <Card eyebrow="APPLICATION" title="IPO lot size">
              <Blurb>{lotSize.summary}</Blurb>
              <DataTable header={lotSize.header} rows={lotSize.rows} compact />
            </Card>
          )}
        </div>
      )}

      {(anchor?.pairs?.length > 0 || anchor?.summary) && (
        <Card eyebrow="INSTITUTIONS" title="Anchor investors">
          <Blurb>{anchor.summary}</Blurb>
          <Pairs items={anchor.pairs} />
          {anchor.pdfUrl && (
            <a
              href={anchor.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-3.5 inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3.5 text-xs font-medium text-ink-200 transition hover:border-ink-500"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Anchor investors list (PDF)
            </a>
          )}
        </Card>
      )}

      {about?.paragraphs?.length > 0 && (
        <Card eyebrow="COMPANY" title={about.title || 'About the company'}>
          {about.updatedOn && <p className="mt-1 text-[10px] text-ink-400">Updated {about.updatedOn}</p>}
          <div className="mt-2">
            {about.paragraphs.map((paragraph, i) => (
              <p key={i} className="mt-2.5 break-words text-xs leading-relaxed text-ink-300">
                {paragraph}
              </p>
            ))}
          </div>
          {about.strengths?.length > 0 && (
            <>
              <h3 className="mt-5 font-display text-sm font-semibold text-ink-100">Strengths</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-ink-300">
                {about.strengths.map((item, i) => (
                  <li key={i} className="break-words">
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}
          {promoter && (
            <p className="mt-4 text-xs text-ink-300">
              <span className="text-ink-400">Promoter:</span> <strong className="text-ink-100">{promoter}</strong>
            </p>
          )}
        </Card>
      )}

      {financials?.rows?.length > 0 && (
        <Card eyebrow="FINANCIALS" title="Company financials (restated)">
          <Blurb>{financials.summary}</Blurb>
          <DataTable header={financials.header} rows={financials.rows} />
        </Card>
      )}

      {(objectives?.rows?.length > 0 || kpi?.rows?.length > 0) && (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          {objectives?.rows?.length > 0 && (
            <Card eyebrow="USE OF FUNDS" title="Objects of the issue">
              <DataTable header={objectives.header} rows={objectives.rows} />
            </Card>
          )}
          {kpi?.rows?.length > 0 && (
            <Card eyebrow="PERFORMANCE" title="Key performance indicators">
              <DataTable header={kpi.header} rows={kpi.rows} compact />
            </Card>
          )}
        </div>
      )}

      {(valuation?.rows?.length > 0 || shareholding?.rows?.length > 0) && (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          {valuation?.rows?.length > 0 && (
            <Card eyebrow="PRICING" title="IPO valuation">
              <DataTable header={valuation.header} rows={valuation.rows} compact />
            </Card>
          )}
          {shareholding?.rows?.length > 0 && (
            <Card eyebrow="OWNERSHIP" title="Shareholding structure">
              <DataTable header={shareholding.header} rows={shareholding.rows} compact />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
