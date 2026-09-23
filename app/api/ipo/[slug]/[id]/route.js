import { NextResponse } from 'next/server';
import { friendlyError, loadDetail } from '../../../../../lib/market.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { slug, id } = await params;
  try {
    const data = await loadDetail(slug, id);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error.status || 502;
    return NextResponse.json({ error: friendlyError(error) }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
