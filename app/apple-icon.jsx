import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07100c' }}>
        <div style={{ width: 132, height: 132, borderRadius: 36, background: '#175f46', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9be3bf', fontSize: 84 }}>
          &#8599;
        </div>
      </div>
    ),
    { ...size }
  );
}
