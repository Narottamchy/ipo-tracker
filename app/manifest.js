import { SITE_DESCRIPTION, SITE_NAME } from '../lib/site.js';

export default function manifest() {
  return {
    name: `${SITE_NAME} — Latest & upcoming IPOs`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#07100c',
    theme_color: '#07100c',
    lang: 'en-IN',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
