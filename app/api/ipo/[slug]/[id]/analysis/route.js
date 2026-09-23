import { NextResponse } from 'next/server';
import { friendlyError, loadDetail } from '../../../../../../lib/market.js';
import { getAiAnalysis } from '../../../../../../lib/aiAnalyst.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { slug, id } = await params;
  try {
    const detail = await loadDetail(slug, id);
    const result = await getAiAnalysis(slug, id, detail);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error.status || 502;
    return NextResponse.json({ error: friendlyError(error) }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
