import { headers } from 'next/headers';
import { detailPathFor, loadMarket } from '../lib/market.js';
import { hostSiteUrl } from '../lib/site.js';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const site = hostSiteUrl((await headers()).get('host'));
  const entries = [{ url: site, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 }];

  try {
    const market = await loadMarket();
    const lastModified = new Date(market.fetchedAt);
    for (const ipo of market.ipos) {
      const live = ['O', 'CT'].includes(ipo.statusCode);
      entries.push({
        url: `${site}${detailPathFor(ipo.sourceUrl)}`,
        lastModified,
        changeFrequency: live ? 'hourly' : ipo.statusCode === 'U' ? 'daily' : 'weekly',
        priority: live ? 0.9 : ipo.statusCode === 'U' ? 0.7 : 0.5,
      });
    }
  } catch {
    // Upstream unavailable — the home page alone is still a valid sitemap.
  }

  return entries;
}
