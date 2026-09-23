import { headers } from 'next/headers';
import { DM_Sans, Manrope } from 'next/font/google';
import './globals.css';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, canonicalSiteUrl } from '../lib/site.js';

// latin-ext is needed for the ₹ sign; listing it makes Next preload it instead of discovering it late.
const dmSans = DM_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-dm-sans', display: 'swap' });
const manrope = Manrope({ subsets: ['latin', 'latin-ext'], variable: '--font-manrope', display: 'swap' });

const GA_MEASUREMENT_IDS = {
  'ipo.chynarottam.in': 'G-SSXHGFKGT4',
  'ipo.narottamchy.in': 'G-HCN33R35XJ',
};

const title = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata = {
  metadataBase: new URL(canonicalSiteUrl()),
  title: { default: title, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'IPO GMP today',
    'IPO grey market premium',
    'upcoming IPO India',
    'IPO subscription status',
    'SME IPO GMP',
    'mainboard IPO',
    'IPO listing date',
    'IPO price band',
  ],
  category: 'finance',
  alternates: { canonical: '/' },
  openGraph: {
    title,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_IN',
    url: '/',
  },
  twitter: { card: 'summary_large_image', title, description: SITE_DESCRIPTION },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7faf8' },
    { media: '(prefers-color-scheme: dark)', color: '#07100c' },
  ],
};

export default async function RootLayout({ children }) {
  const host = (await headers()).get('host')?.split(':')[0] || '';
  const gaId = GA_MEASUREMENT_IDS[host];

  return (
    <html lang="en-IN" className={`${dmSans.variable} ${manrope.variable}`} suppressHydrationWarning>
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
