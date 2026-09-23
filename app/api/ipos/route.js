import { NextResponse } from 'next/server';
import { friendlyError, loadMarket } from '../../../lib/market.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const force = new URL(request.url).searchParams.get('force') === '1';
    const data = await loadMarket(force);
    // The snapshot only changes hourly: let the CDN absorb polling, except explicit refreshes.
    const cacheControl = force ? 'no-store' : 'public, s-maxage=300, stale-while-revalidate=3600';
    return NextResponse.json(data, { headers: { 'Cache-Control': cacheControl } });
  } catch (error) {
    return NextResponse.json({ error: friendlyError(error) }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
