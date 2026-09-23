import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'IPO Focus — Latest & upcoming IPOs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 96,
          backgroundColor: '#07100c',
          color: '#dfe9e2',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: '#175f46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9be3bf',
              fontSize: 34,
            }}
          >
            &#8599;
          </div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>
            IPO<span style={{ fontWeight: 500, color: '#8ba296' }}>focus</span>
          </div>
        </div>
        <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.15, maxWidth: 900 }}>
          Latest &amp; upcoming IPOs at a glance.
        </div>
        <div style={{ fontSize: 26, color: '#8ba296', marginTop: 28 }}>
          GMP, closing dates, and subscription — live from the market.
        </div>
      </div>
    ),
    { ...size }
  );
}
