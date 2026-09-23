# IPO Focus

A Next.js (App Router) dashboard that automatically lists open, closing-today, and upcoming IPOs. Each IPO has a detailed page with dates, pricing, lot size, issue size, subscription, estimated listing figures, GMP trend analysis, and a history chart. No pasted links, API keys, or database are required.

Requires Node.js 20 or newer.

```bash
npm install
npm run dev     # http://localhost:3100
npm run build   # production build
npm start       # serve the production build on :3100
npm test        # parser.test.mjs (plain node --test, no server needed)
```

## Stack

- **Next.js (App Router, JavaScript)** for routing, server components, and API routes.
- **Tailwind CSS** for styling — a dark, card-based fintech-dashboard look with a green accent for positive GMP and amber for "closing today."
- **lucide-react** for all icons (refresh, search, trend arrows, clock, back navigation, etc).
- `parser.mjs` / `parser.test.mjs` are untouched — the battle-tested InvestorGain HTML scraper. Next.js API routes import `parseMarket`, `parseDetail`, `parseSubscription`, and `MARKET_URL` from it; its parsing logic is never modified.

## Routes

- `/` — home/list page. `app/page.jsx` is a server component that fetches the initial IPO list; `components/IpoListClient.jsx` is a client component that owns search, filters, and the 60s polling loop.
- `/ipo/[slug]/[id]` — detail page (`app/ipo/[slug]/[id]/page.jsx`), a server component rendering hero, summary grid, subscription breakdown, GMP chart + trend card, issue facts, and GMP history table.
- `/api/ipos` — GET, wraps `loadMarket()` from `lib/market.js`.
- `/api/ipo/[slug]/[id]` — GET, wraps `loadDetail()` from `lib/market.js`.

`lib/market.js` ports the original in-memory caching (60s TTL market cache with pending-promise dedupe, per-IPO detail cache capped at 100 entries) and preserves the upstream fetch behavior (User-Agent, Accept header, `redirect: 'error'`, `AbortSignal.timeout(15000)`) so InvestorGain requests behave exactly as before.

The server fetches InvestorGain's live GMP report and caches it for 60 seconds. The browser refreshes every minute while the tab is visible. Closed and listed IPOs are excluded. Missing subscription values display as "Not open," while a reported blank GMP displays as ₹0.

## Mobile

Mobile is a first-class layout, not a squeeze of the desktop one:

- The list becomes stacked cards with labeled rows, 44px+ tap targets, horizontally scrollable filter chips, and a full-width search field.
- The detail page reflows the summary grid to 2 columns, the facts grid to 1 column, and the subscription grid to 2 columns; the GMP chart and history table scroll horizontally inside their cards instead of overflowing the page, and chart value labels are hidden below the `sm` breakpoint to stay legible.

## Branding

`components/Logo.jsx` renders an SVG wordmark (a geometric ascending-line/chart mark + "IPOfocus" wordmark), reused for `app/icon.svg` (favicon) and `app/opengraph-image.jsx` (OG image via `next/og`).

## SEO

`app/sitemap.js` includes the home page plus a `/ipo/[slug]/[id]` entry for every currently active IPO (reusing `loadMarket()`), and `app/robots.js` points crawlers at it. Set `NEXT_PUBLIC_SITE_URL` in production; it falls back to `http://localhost:3100`.

## Notes

The parser reads InvestorGain's rendered market table. Upstream layout changes or access restrictions may require updating the parser. This site is independent of InvestorGain.
