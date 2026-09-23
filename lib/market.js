import { MARKET_URL, parseDetail, parseMarket, parseSubscription } from '../parser.mjs';

const TTL = 120_000;
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
      return await fetch(url, { ...FETCH_OPTIONS, signal: AbortSignal.timeout(20000) });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

let cache;
let lastGood;
let pending;
const detailCache = new Map();
const lastGoodDetail = new Map();

export async function loadMarket(force = false) {
  if (!force && cache && Date.now() - cache.time < TTL) return cache.data;
  if (pending) return pending;
  pending = (async () => {
    try {
      const response = await fetchWithRetry(MARKET_URL);
      if (!response.ok) throw new Error(`Market data is unavailable (HTTP ${response.status}). Please try again later.`);
      const ipos = parseMarket(await response.text());
      const data = { ipos, count: ipos.length, sourceUrl: MARKET_URL, fetchedAt: new Date().toISOString() };
      cache = { time: Date.now(), data };
      lastGood = data;
      return data;
    } catch (error) {
      if (lastGood) {
        cache = { time: Date.now(), data: lastGood };
        return lastGood;
      }
      throw error;
    }
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}

export async function loadDetail(slug, id, force = false) {
  const key = `${slug}/${id}`;
  const cached = detailCache.get(key);
  if (!force && cached && Date.now() - cached.time < TTL) return cached.data;
  const market = await loadMarket(force);
  const sourceUrl = `https://www.investorgain.com/gmp/${slug}/${id}/`;
  const subscriptionUrl = `https://www.investorgain.com/subscription/${slug}/${id}/`;
  const marketIpo = market.ipos.find((ipo) => ipo.sourceUrl === sourceUrl);
  if (!marketIpo) throw Object.assign(new Error('IPO not found in the active market.'), { status: 404 });
  try {
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
    const data = {
      ...detail,
      subscription: categoryTotal ?? detail.subscription,
      subscriptionBreakdown: subscription,
      fetchedAt: new Date().toISOString(),
    };
    if (detailCache.size >= 100) detailCache.delete(detailCache.keys().next().value);
    detailCache.set(key, { time: Date.now(), data });
    lastGoodDetail.set(key, data);
    return data;
  } catch (error) {
    const stale = lastGoodDetail.get(key);
    if (stale) {
      detailCache.set(key, { time: Date.now(), data: stale });
      return stale;
    }
    throw error;
  }
}

export function friendlyError(error) {
  if (error?.name === 'TimeoutError') return 'The market data source took too long to respond. Please try again.';
  if (error?.message === 'fetch failed') return 'Could not reach the market data source. Please try again.';
  return error?.message || 'Something went wrong.';
}

export { detailPathFor } from './format.js';
