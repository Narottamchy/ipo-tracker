import { NextResponse } from 'next/server';
import { friendlyError, loadDetail } from '../../../../../../lib/market.js';
import { getAiAnalysis, getCachedAnalysis } from '../../../../../../lib/aiAnalyst.js';
import { kvIncr } from '../../../../../../lib/kv.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const GENERATIONS_PER_IP_PER_HOUR = 6;

export async function GET(request, { params }) {
  const { slug, id } = await params;
  try {
    const cached = await getCachedAnalysis(slug, id);
    if (cached) return NextResponse.json(cached, { headers: NO_STORE });

    // Only a cache miss can spend NVIDIA/Tavily credits, so only misses are rate limited.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if ((await kvIncr(`rl:ai:${ip}`, 3600)) > GENERATIONS_PER_IP_PER_HOUR) {
      return NextResponse.json({ error: 'Too many analysis requests. Please try again later.' }, { status: 429, headers: NO_STORE });
    }

    const detail = await loadDetail(slug, id);
    const result = await getAiAnalysis(slug, id, detail);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    const status = error.status || 502;
    return NextResponse.json({ error: friendlyError(error) }, { status, headers: NO_STORE });
  }
}
