const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
