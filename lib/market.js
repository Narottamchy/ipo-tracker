import { MARKET_URL, parseDetail, parseMarket, parseSubscription } from '../parser.mjs';
import { kvGet, kvLock, kvSet } from './kv.js';
import { secondsUntilListing } from './ttl.js';

const HOUR = 3_600_000;
const MARKET_KEY = 'market:snapshot';
const MARKET_HARD_TTL = 48 * 60 * 60; // stale copy stays available through upstream outages
const MIN = 60_000;
// How long a detail snapshot counts as fresh, by IPO status (bidding data moves; closed IPOs barely do).
const DETAIL_FRESH_MS = { O: 10 * MIN, CT: 10 * MIN, U: 60 * MIN, C: 6 * 60 * MIN };
const currentHourKey = () => Math.floor(Date.now() / HOUR);

const FETCH_OPTIONS = {
  redirect: 'error',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  },
};

async function fetchWithRetry(url, attempts = 2) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, { ...FETCH_OPTIONS, signal: AbortSignal.timeout(20000), cache: 'no-store' });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

let cache; // { hourKey, data } — newest snapshot this instance has seen (fresh or stale)
let pending;
const detailCache = new Map();
const pendingDetail = new Map();

async function refreshMarket(stale) {
  try {
    const response = await fetchWithRetry(MARKET_URL);
    if (!response.ok) throw new Error(`Market data is unavailable (HTTP ${response.status}). Please try again later.`);
    const ipos = parseMarket(await response.text());
    const data = { ipos, count: ipos.length, sourceUrl: MARKET_URL, fetchedAt: new Date().toISOString() };
    cache = { hourKey: currentHourKey(), data };
    await kvSet(MARKET_KEY, cache, MARKET_HARD_TTL);
    return data;
  } catch (error) {
    const fallback = stale || cache;
    if (fallback) {
      cache = { hourKey: currentHourKey(), data: fallback.data };
      return fallback.data;
    }
    throw error;
  }
}

// Shared across all instances: memory → Redis (fresh when from the current clock hour) → upstream.
// A stale snapshot is served immediately to everyone except the single caller that wins the refresh
// lock, and it is also the fallback when upstream fails. Manual refreshes are throttled to one/minute.
export async function loadMarket(force = false) {
  if (force && !(await kvLock('lock:market-force', 60))) force = false;
  if (!force && cache && cache.hourKey === currentHourKey()) return cache.data;

  let stale = cache || null;
  if (!force) {
    const stored = await kvGet(MARKET_KEY);
    if (stored?.data) {
      if (stored.hourKey === currentHourKey()) {
        cache = stored;
        return stored.data;
      }
      stale = stored;
    }
    if (stale && !(await kvLock('lock:market', 45))) return stale.data;
  }

  if (pending) return pending;
  pending = refreshMarket(stale);
  try {
    return await pending;
  } finally {
    pending = null;
  }
}

async function fetchDetail(slug, id, marketIpo) {
  const sourceUrl = `https://www.investorgain.com/gmp/${slug}/${id}/`;
  const subscriptionUrl = `https://www.investorgain.com/subscription/${slug}/${id}/`;
  const [response, subscriptionResponse] = await Promise.all([
    fetchWithRetry(sourceUrl),
    fetchWithRetry(subscriptionUrl).catch(() => null),
  ]);
  if (!response.ok) throw new Error(`IPO details are unavailable (HTTP ${response.status}).`);
  const subscription = subscriptionResponse?.ok
    ? parseSubscription(await subscriptionResponse.text())
    : { categories: [], totalBidAmountCrore: null, updatedText: null };
  const detail = parseDetail(await response.text(), marketIpo);
  const categoryTotal = subscription.categories.find((item) => item.key === 'Total Subscription')?.value;
  return {
    ...detail,
    subscription: categoryTotal ?? detail.subscription,
    subscriptionBreakdown: subscription,
    fetchedAt: new Date().toISOString(),
  };
}

export async function loadDetail(slug, id, force = false) {
  const key = `${slug}/${id}`;
  const redisKey = `detail:${key}`;
  let entry = detailCache.get(key);
  if (!entry) {
    const stored = await kvGet(redisKey);
    if (stored?.data) entry = { time: stored.fetchedAt, data: stored.data };
  }
  const fresh = entry && Date.now() - entry.time < (DETAIL_FRESH_MS[entry.data.statusCode] ?? 10 * MIN);
  if (!force && fresh) {
    detailCache.set(key, entry);
    return entry.data;
  }

  const market = await loadMarket(false);
  const sourceUrl = `https://www.investorgain.com/gmp/${slug}/${id}/`;
  const marketIpo = market.ipos.find((ipo) => ipo.sourceUrl === sourceUrl);
  if (!marketIpo) throw Object.assign(new Error('IPO not found in the active market.'), { status: 404 });

  if (entry && !force && !(await kvLock(`lock:detail:${key}`, 45))) {
    detailCache.set(key, entry);
    return entry.data;
  }
  if (pendingDetail.has(key)) return pendingDetail.get(key);

  const promise = (async () => {
    try {
      const data = await fetchDetail(slug, id, marketIpo);
      const stored = { time: Date.now(), data };
      if (detailCache.size >= 100) detailCache.delete(detailCache.keys().next().value);
      detailCache.set(key, stored);
      await kvSet(redisKey, { fetchedAt: stored.time, data }, secondsUntilListing(marketIpo));
      return data;
    } catch (error) {
      if (entry) return entry.data;
      throw error;
    }
  })();
  pendingDetail.set(key, promise);
  try {
    return await promise;
  } finally {
    pendingDetail.delete(key);
  }
}

export function friendlyError(error) {
  if (error?.name === 'TimeoutError') return 'The market data source took too long to respond. Please try again.';
  if (error?.message === 'fetch failed') return 'Could not reach the market data source. Please try again.';
  return error?.message || 'Something went wrong.';
}

export { detailPathFor } from './format.js';
