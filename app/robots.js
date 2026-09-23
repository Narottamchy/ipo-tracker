import { headers } from 'next/headers';
import { hostSiteUrl } from '../lib/site.js';

export default async function robots() {
  const site = hostSiteUrl((await headers()).get('host'));
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
