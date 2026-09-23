import { detailPathFor, loadMarket } from '../lib/market.js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

export default async function sitemap() {
  const entries = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
  ];

  try {
    const market = await loadMarket();
    for (const ipo of market.ipos) {
      entries.push({
        url: `${siteUrl}${detailPathFor(ipo.sourceUrl)}`,
        lastModified: new Date(market.fetchedAt),
        changeFrequency: 'hourly',
        priority: 0.7,
      });
    }
  } catch {
    // Upstream unavailable at build/request time — fall back to just the home page.
  }

  return entries;
}
