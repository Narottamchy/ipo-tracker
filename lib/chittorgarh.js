import { kvGet, kvLock, kvSet } from './kv.js';
import { secondsUntilListing } from './ttl.js';

const BASE = 'https://www.chittorgarh.com';
const INDEX_PAGES = [`${BASE}/report/ipo-in-india-list-main-board-sme/82/`, `${BASE}/ipo/ipo_dashboard.asp`];
// Refresh cadence by IPO status: upcoming pages change (price band, anchor), closed ones barely do.
const HOUR_MS = 60 * 60 * 1000;
const FRESH_MS = { U: 12 * HOUR_MS, O: 3 * HOUR_MS, CT: 3 * HOUR_MS, C: 24 * HOUR_MS };
const NO_PAGE_MS = 3 * HOUR_MS; // how long "no matching page yet" is remembered
const NO_PAGE_TTL_S = NO_PAGE_MS / 1000;
const ID_TTL_S = 14 * 24 * 60 * 60;
const MEMORY_MAX = 150;
const INDEX_TTL_MS = 60 * 60 * 1000;
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const decode = (value = '') =>
  value
    .replace(/&#8377;/gi, '₹')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&minus;/gi, '−')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&rarr;/gi, '→')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
const text = (html = '') =>
  decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();

function tablesOf(html) {
  return [...html.matchAll(/<table\b([^>]*)>([\s\S]*?)<\/table>/gi)].map(([, attrs, body]) => ({
    id: attrs.match(/\bid=['"]([^'"]+)['"]/i)?.[1] || null,
    rows: [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(([, row]) =>
      [...row.matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(([, cell]) => text(cell))
    ),
  }));
}

const asTable = (table) => (table ? { header: table.rows[0] || [], rows: table.rows.slice(1) } : null);
const asPairs = (table) => (table ? table.rows.filter((r) => r.length >= 2 && r[0]).map(([label, value]) => ({ label, value: value.replace(/\sT$/, '') })) : []);

// HTML between the <h2> whose text contains `heading` and the next <h2> (capped at `span` chars).
function sectionAfter(html, heading, span = 6000) {
  for (const match of html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)) {
    if (!text(match[1]).toLowerCase().includes(heading.toLowerCase())) continue;
    const start = match.index + match[0].length;
    const rest = html.slice(start, start + span);
    const next = rest.search(/<h2\b/i);
    return next >= 0 ? rest.slice(0, next) : rest;
  }
  return null;
}

// First <p> in a section, provided it comes before the section's first table/list.
function paragraphAfter(html, heading) {
  const section = sectionAfter(html, heading);
  if (!section) return null;
  const p = section.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!p) return null;
  const table = section.search(/<table\b|<ul\b/i);
  return table >= 0 && table < p.index ? null : text(p[1]) || null;
}

export function parseChittorgarh(html) {
  const clean = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const tables = tablesOf(clean);
  const first = (pred) => tables.find(pred);
  const head = (t) => t.rows[0]?.[0] || '';

  const detailTables = [first((t) => head(t) === 'IPO Date'), first((t) => head(t) === 'Total Issue Size')];
  const details = detailTables.flatMap(asPairs);

  const timetable = [...(sectionAfter(clean, 'IPO Timetable') || '').matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map(([, li]) => {
      const spans = [...li.matchAll(/<span\b[^>]*class="text-end"[^>]*>([\s\S]*?)<\/span>/gi)];
      const value = spans.length ? text(spans[spans.length - 1][1]) : '';
      const label = text(li.replace(/<span\b[^>]*class="text-end"[\s\S]*$/i, ''));
      return { label, value };
    })
    .filter((item) => item.label && item.value);

  const summaryBlock = clean.match(/id="ipoSummary"[^>]*>([\s\S]*?)<\/div><div[^>]*float-end/i)?.[1] || '';
  const strengthsAt = summaryBlock.search(/<strong>\s*Strengths/i);
  const aboutHtml = strengthsAt >= 0 ? summaryBlock.slice(0, strengthsAt) : summaryBlock;
  const aboutParagraphs = [...aboutHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(([, p]) => text(p)).filter(Boolean);
  const strengths =
    strengthsAt >= 0 ? [...summaryBlock.slice(strengthsAt).matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(([, li]) => text(li)) : [];
  const updatedOn = clean.match(/Updated on\s*(?:<!--\s*-->)?\s*([A-Za-z]{3,9} \d{1,2}, \d{4})/)?.[1] || null;
  const aboutTitle = text(clean.match(/<h2[^>]*>\s*(About [^<]+)<\/h2>/i)?.[1] || '');

  const anchorTable = first((t) => head(t) === 'Bid Date');
  const anchorPdf = clean.match(/<a[^>]*href="([^"]+)"[^>]*>[^<]*Anchor Investors Letter/i)?.[1] || null;

  const promoter = text(clean.match(/<b>\s*Company Promoter:?\s*<\/b>([\s\S]*?)<\/p>/i)?.[1] || '') || null;
  const leadManagerList = (sectionAfter(clean, 'Lead Manager(s)') || '').match(/<ol\b[\s\S]*?<\/ol>/i)?.[0] || '';
  const leadManagers = [...leadManagerList.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].slice(0, 6).map(([, li]) => text(li)).filter(Boolean);
  const registrar = text((sectionAfter(clean, 'IPO Registrar') || '').match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '') || null;

  const result = {
    details,
    timetable,
    reservation: { summary: paragraphAfter(clean, 'Issue Reservation'), ...(asTable(first((t) => head(t) === 'Investor Category')) || {}) },
    lotSize: { summary: paragraphAfter(clean, 'IPO Lot Size'), ...(asTable(first((t) => head(t) === 'Application')) || {}) },
    anchor: {
      summary: paragraphAfter(clean, 'Anchor Investors')?.replace(/\s*📝?\s*Anchor Investors Letter \(PDF\)\s*$/, '') || null,
      pdfUrl: anchorPdf,
      pairs: asPairs(anchorTable),
    },
    about: { title: aboutTitle, updatedOn, paragraphs: aboutParagraphs, strengths },
    financials: { summary: paragraphAfter(clean, 'Company Financials'), ...(asTable(first((t) => t.id === 'financialTable')) || {}) },
    objectives: asTable(first((t) => t.id === 'ObjectiveIssue')),
    kpi: asTable(first((t) => head(t) === 'KPI')),
    valuation: asTable(first((t) => head(t) === 'Valuation Metric')),
    shareholding: asTable(first((t) => head(t) === 'Category' && t.rows[0]?.includes('Pre IPO'))),
    promoter,
    leadManagers,
    registrar,
  };

  const hasContent = details.length || result.financials.rows?.length || result.about.paragraphs.length;
  return hasContent ? result : null;
}

let indexCache;

async function fetchText(url) {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000), cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function loadIndex() {
  if (indexCache && Date.now() - indexCache.time < INDEX_TTL_MS) return indexCache.map;
  const map = new Map(indexCache?.map || []);
  const pages = await Promise.all(INDEX_PAGES.map((url) => fetchText(url).catch(() => '')));
  for (const page of pages) for (const [, slug, id] of page.matchAll(/\/ipo\/([a-z0-9-]+-ipo)\/(\d+)/g)) map.set(slug, id);
  if (map.size) indexCache = { time: Date.now(), map };
  return map;
}

// The Chittorgarh page id for a slug never changes: remember it (and "no page yet") in Redis so
// cold instances don't re-download the two index pages.
async function resolveId(slug) {
  const known = await kvGet(`chit-id:${slug}`);
  if (known) return known;
  const id = (await loadIndex()).get(slug);
  if (id) await kvSet(`chit-id:${slug}`, id, ID_TTL_S);
  return id || null;
}

const memory = new Map();
const pending = new Map();

function remember(key, entry) {
  if (memory.size >= MEMORY_MAX) memory.delete(memory.keys().next().value);
  memory.set(key, entry);
}

// Cached for everyone: memory → Redis (kept until the IPO lists) → scrape. Freshness depends on the
// IPO's status; stale copies are served instantly (one caller refreshes under a lock) and remain the
// fallback if the source is unreachable.
export async function getChittorgarhDetails(slug, detailData) {
  const key = `chit:${slug}`;
  const inMemory = memory.get(key);
  let cached = inMemory && inMemory.expiresAt > Date.now() ? inMemory : null;
  if (inMemory && !cached) memory.delete(key);
  if (!cached) {
    const stored = await kvGet(key);
    if (stored) cached = { ...stored, expiresAt: stored.expiresAt || Date.now() + secondsUntilListing(detailData) * 1000 };
  }

  const freshFor = cached && !cached.data ? NO_PAGE_MS : FRESH_MS[detailData.statusCode] ?? FRESH_MS.O;
  if (cached) remember(key, cached);
  if (cached && Date.now() - cached.fetchedAt < freshFor) return cached.data;
  if (cached && !(await kvLock(`lock:${key}`, 60))) return cached.data;
  if (pending.has(key)) return pending.get(key);

  const promise = (async () => {
    try {
      const id = await resolveId(slug);
      if (!id) {
        const none = { fetchedAt: Date.now(), expiresAt: Date.now() + NO_PAGE_MS, data: null };
        remember(key, none);
        await kvSet(key, none, NO_PAGE_TTL_S);
        return cached?.data || null;
      }
      const sourceUrl = `${BASE}/ipo/${slug}/${id}/`;
      const parsed = parseChittorgarh(await fetchText(sourceUrl));
      if (!parsed) return cached?.data || null;
      const ttl = secondsUntilListing(detailData);
      const entry = { fetchedAt: Date.now(), expiresAt: Date.now() + ttl * 1000, data: { ...parsed, sourceUrl, fetchedAt: new Date().toISOString() } };
      remember(key, entry);
      await kvSet(key, entry, ttl);
      return entry.data;
    } catch {
      return cached?.data || null;
    }
  })();

  pending.set(key, promise);
  try {
    return await promise;
  } finally {
    pending.delete(key);
  }
}
