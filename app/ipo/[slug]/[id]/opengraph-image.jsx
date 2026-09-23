import { ImageResponse } from 'next/og';
import { loadDetail } from '../../../../lib/market.js';
import { formatMoney, formatPercent } from '../../../../lib/format.js';

export const runtime = 'nodejs';
export const alt = 'IPO GMP, price band and subscription';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The default image font has no rupee glyph, so amounts are rendered as "Rs.".
const rs = (text) => String(text).replace(/₹\s*/g, 'Rs. ');

const stat = (label, value) => (
  <div style={{ display: 'flex', flexDirection: 'column', marginRight: 56 }}>
    <div style={{ fontSize: 22, color: '#8ba296', textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
    <div style={{ fontSize: 40, fontWeight: 700, marginTop: 8, color: '#dfe9e2' }}>{rs(value)}</div>
  </div>
);

export default async function Image({ params }) {
  const { slug, id } = await params;
  let data = null;
  try {
    data = await loadDetail(slug, id);
  } catch {
    // Fall back to the generic card below.
  }

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#07100c', color: '#dfe9e2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#175f46', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9be3bf', fontSize: 28 }}>
            &#8599;
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800 }}>
            <span>IPO</span>
            <span style={{ fontWeight: 500, color: '#8ba296' }}>focus</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: data && data.name.length > 28 ? 60 : 76, fontWeight: 800, lineHeight: 1.1 }}>
            {data ? `${data.name} IPO` : 'IPO details'}
          </div>
          <div style={{ fontSize: 30, color: '#5cc797', marginTop: 14 }}>{data ? `${data.type} · ${data.status}` : 'Live GMP, price band & subscription'}</div>
        </div>
        {data ? (
          <div style={{ display: 'flex' }}>
            {stat('GMP', `${formatMoney(data.gmp)} (${formatPercent(data.gmpPercent)})`)}
            {data.priceBand ? stat('Price band', data.priceBand) : null}
            {data.closeDate ? stat('Closes', data.closeDate) : null}
          </div>
        ) : (
          <div style={{ fontSize: 30, color: '#8ba296' }}>GMP, closing dates and subscription — live.</div>
        )}
      </div>
    ),
    { ...size }
  );
}
