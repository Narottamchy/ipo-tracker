import { NextResponse } from 'next/server';
import { loadDetail, loadMarket } from '../../../../lib/market.js';
import { ensureClosedAnalysis, getCachedAnalysis } from '../../../../lib/aiAnalyst.js';
import { getChittorgarhDetails } from '../../../../lib/chittorgarh.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_ANALYSES_PER_RUN = 6;
const CONCURRENCY = 4;

const idsFrom = (sourceUrl) => {
  const [slug, id] = new URL(sourceUrl).pathname.replace(/^\/gmp\//, '').split('/').filter(Boolean);
  return { slug, id };
};

async function inBatches(items, size, task) {
  const results = [];
  for (let i = 0; i < items.length; i += size) {
    results.push(...(await Promise.allSettled(items.slice(i, i + size).map(task))));
  }
  return results;
}

// Scheduled by Vercel Cron (see vercel.json). Requires `Authorization: Bearer $CRON_SECRET`.
//  - no params: refresh the shared market snapshot, then warm detail + issue data for live IPOs and
//    fan out one request per closed IPO that still needs its final analysis.
//  - ?slug=&id=: generate that single closed IPO's analysis (own function invocation, own timeout).
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const slugParam = url.searchParams.get('slug');
  if (slugParam) {
    const id = url.searchParams.get('id');
    const detail = await loadDetail(slugParam, id, true);
    const generated = await ensureClosedAnalysis(slugParam, id, detail);
    return NextResponse.json({ slug: slugParam, generated });
  }

  const market = await loadMarket(true);
  const live = market.ipos.filter((ipo) => ['O', 'CT', 'C'].includes(ipo.statusCode));

  await inBatches(live, CONCURRENCY, async (ipo) => {
    const { slug, id } = idsFrom(ipo.sourceUrl);
    const detail = await loadDetail(slug, id);
    await getChittorgarhDetails(slug, detail);
  });

  const closedIpos = live.filter((ipo) => ipo.statusCode === 'C');
  const stages = await Promise.all(
    closedIpos.map((ipo) => {
      const { slug, id } = idsFrom(ipo.sourceUrl);
      return getCachedAnalysis(slug, id).then((cached) => cached?.stage);
    })
  );
  const closed = closedIpos.filter((_, i) => stages[i] !== 'closed').slice(0, MAX_ANALYSES_PER_RUN);
  const headers = { Authorization: `Bearer ${secret}` };
  const analyses = await inBatches(closed, MAX_ANALYSES_PER_RUN, (ipo) => {
    const { slug, id } = idsFrom(ipo.sourceUrl);
    return fetch(`${url.origin}/api/cron/warm?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(id)}`, {
      headers,
      signal: AbortSignal.timeout(55_000),
    }).then((response) => response.json());
  });

  return NextResponse.json({
    market: market.count,
    warmed: live.length,
    analyses: analyses.map((r) => (r.status === 'fulfilled' ? r.value : { error: String(r.reason?.message || r.reason) })),
  });
}
