export const SITE_NAME = 'IPO Focus';
export const SITE_TAGLINE = 'Latest & upcoming IPOs at a glance';
export const SITE_DESCRIPTION =
  'Live IPO GMP today, price band, subscription status, closing dates and listing dates for every open, upcoming and closed mainboard and SME IPO in India.';

// One canonical domain for search engines even though the site is served from two hostnames.
// Override with NEXT_PUBLIC_SITE_URL.
const DEFAULT_PRIMARY = 'https://ipo.narottamchy.in';

export function canonicalSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  return process.env.NODE_ENV === 'production' ? DEFAULT_PRIMARY : 'http://localhost:3100';
}

export function hostSiteUrl(host) {
  const clean = (host || '').split(':')[0];
  if (!clean || clean === 'localhost' || clean === '127.0.0.1') return `http://${host || 'localhost:3100'}`;
  return `https://${clean}`;
}
