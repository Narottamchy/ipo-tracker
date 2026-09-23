import { kvGet, kvIncr, kvSet } from './kv.js';

const TAVILY_URL = 'https://api.tavily.com/search';
const DAY = 24 * 60 * 60;
// Hard stop below the plan's 1,000 monthly credits so a burst can never exhaust the account.
const MONTHLY_LIMIT = Number(process.env.TAVILY_MONTHLY_LIMIT || 900);
const JUNK_DOMAINS = ['instagram.com', 'facebook.com', 'youtube.com', 'pinterest.com', 'reddit.com', 'quora.com', 'x.com', 'twitter.com'];

const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function tavilySearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(TAVILY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      include_answer: true,
      max_results: 4,
      exclude_domains: JUNK_DOMAINS,
    }),
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  });

  if (!response.ok) return null;
  const json = await response.json();
  return {
    answer: json.answer || null,
    results: (json.results || []).map((r) => ({ title: r.title, url: r.url, content: r.content })),
  };
}

// Searches are cached by entity (an IPO, or a lead manager shared by many IPOs) and every real call
// counts against a monthly budget kept in Redis.
async function cachedSearch(cacheKey, ttlDays, query) {
  const key = `search:${cacheKey}`;
  const hit = await kvGet(key);
  if (hit) return hit;

  const used = await kvIncr(`tavily-usage:${new Date().toISOString().slice(0, 7)}`, 40 * DAY);
  if (used > MONTHLY_LIMIT) return null;

  const result = await tavilySearch(query).catch(() => null);
  if (result) await kvSet(key, result, ttlDays * DAY);
  return result;
}

// Web search only fills what the structured issue data can't (legal history, lead-manager track
// record, peer valuation). With that data on hand it's 2 queries per IPO; without it, 3 broader ones.
// Runs once per IPO and is cached until listing, so this stays well inside the shared Tavily budget.
export async function researchIpo(name, isSme, issueData = null) {
  const lead = issueData?.leadManagers?.[0];
  const plan = issueData
    ? [
        [`legal:${slug(name)}`, 14, `${name} IPO promoter director SEBI case litigation red flags India`],
        isSme
          ? [`lm:${slug(lead || name)}`, 30, `${lead || name} lead manager SME IPO track record listing performance India`]
          : [`peer:${slug(name)}`, 7, `${name} IPO peer companies valuation P/E comparison India`],
      ]
    : [
        [`legal:${slug(name)}`, 14, `${name} IPO promoter director SEBI case litigation red flags India`],
        [`anchor:${slug(name)}`, 7, `${name} IPO anchor investors ${isSme ? 'lead manager track record market maker' : 'quality institutional investors'} India`],
        [`fin:${slug(name)}`, 7, `${name} IPO financial results revenue profit peer valuation P/E ratio comparison India`],
      ];

  const results = await Promise.all(plan.map(([key, days, query]) => cachedSearch(key, days, query).catch(() => null)));
  if (!results.some(Boolean)) return null;

  return plan
    .map(([, , query], i) => {
      const r = results[i];
      if (!r) return null;
      const lines = [`Query: "${query}"`];
      if (r.answer) lines.push(`Summary: ${r.answer}`);
      r.results.forEach((item, j) => {
        lines.push(`[${j + 1}] ${item.title} — ${item.url}\n${(item.content || '').slice(0, 400)}`);
      });
      return lines.join('\n');
    })
    .filter(Boolean)
    .join('\n\n---\n\n');
}
