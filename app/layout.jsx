import { headers } from 'next/headers';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

const GA_MEASUREMENT_IDS = {
  'ipo.chynarottam.in': 'G-SSXHGFKGT4',
  'ipo.narottamchy.in': 'G-HCN33R35XJ',
};

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'IPO Focus — Latest & upcoming IPOs',
    template: '%s — IPO Focus',
  },
  description: 'Only the numbers you need: GMP, closing date, and subscription for every live and upcoming IPO.',
  openGraph: {
    title: 'IPO Focus — Latest & upcoming IPOs',
    description: 'Only the numbers you need: GMP, closing date, and subscription for every live and upcoming IPO.',
    siteName: 'IPO Focus',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#07100c',
};

export default async function RootLayout({ children }) {
  const host = (await headers()).get('host')?.split(':')[0] || '';
  const gaId = GA_MEASUREMENT_IDS[host];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        {gaId && (
          <>
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-screen bg-ink-950">{children}</body>
    </html>
  );
}
