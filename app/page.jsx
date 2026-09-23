import Link from 'next/link';
import Logo from '../components/Logo.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import IpoListClient from '../components/IpoListClient.jsx';
import JsonLd from '../components/JsonLd.jsx';
import { detailPathFor, friendlyError, loadMarket } from '../lib/market.js';
import { faqJsonLd } from '../lib/seo.js';
import { SITE_DESCRIPTION, SITE_NAME, canonicalSiteUrl } from '../lib/site.js';

export const metadata = {
  title: { absolute: 'IPO GMP Today, Upcoming & Open IPOs in India | IPO Focus' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { title: 'IPO GMP Today, Upcoming & Open IPOs in India', description: SITE_DESCRIPTION, url: '/' },
};

const GLOSSARY_FAQ = [
  {
    q: 'What is IPO GMP (grey market premium)?',
    a: "GMP is the unofficial premium at which an IPO's shares trade before listing, over the issue price. A GMP of ₹50 on a ₹100 issue price hints at a listing near ₹150. It is not regulated, so it is an indicator, not a guarantee.",
  },
  {
    q: 'How is the estimated listing price calculated?',
    a: 'Estimated listing price = issue price + GMP. GMP % = GMP ÷ issue price × 100. Treat it as indicative: GMP can move sharply until listing day.',
  },
  {
    q: 'What does IPO subscription (×) mean?',
    a: 'Subscription is the number of shares bid for divided by the shares on offer. A 10× subscription means bids for ten times the available shares. It is reported by category: QIB (institutions), NII/HNI (larger individual investors) and retail.',
  },
  {
    q: 'What is the difference between mainboard and SME IPOs?',
    a: 'Mainboard IPOs are larger companies listing on the main NSE/BSE boards. SME IPOs are smaller companies listing on the NSE Emerge or BSE SME platforms; they have a larger minimum application value (about ₹1 lakh or more), thinner trading and higher risk.',
  },
  {
    q: 'Is GMP reliable for deciding whether to apply?',
    a: 'Not on its own. GMP is unofficial and can be thin or manipulated, especially for SME IPOs. Consider subscription, financials, valuation and the lead manager alongside it. This site is informational and not investment advice.',
  },
  {
    q: 'How often is the data updated?',
    a: 'The IPO list refreshes about hourly. Individual IPO pages refresh more often while bidding is open, and cached data is kept until an IPO lists.',
  },
];

export const dynamic = 'force-dynamic';

async function getInitialData() {
  try {
    const data = await loadMarket();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: friendlyError(error) };
  }
}

export default async function HomePage() {
  const { data, error } = await getInitialData();

  const site = canonicalSiteUrl();
  const listed = (data?.ipos || []).filter((ipo) => ipo.statusCode !== 'C').slice(0, 30);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${site}/#website`, url: site, name: SITE_NAME, description: SITE_DESCRIPTION, inLanguage: 'en-IN' },
      { '@type': 'Organization', '@id': `${site}/#organization`, name: SITE_NAME, url: site, logo: `${site}/icon.svg` },
      ...(listed.length
        ? [
            {
              '@type': 'ItemList',
              name: 'Open and upcoming IPOs in India',
              itemListElement: listed.map((ipo, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: `${ipo.name} IPO`,
                url: `${site}${detailPathFor(ipo.sourceUrl)}`,
              })),
            },
          ]
        : []),
      faqJsonLd(GLOSSARY_FAQ.map(({ q, a }) => ({ q, a }))),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <header className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-4 sm:h-[90px] sm:px-10">
        <Link href="/" className="focus-ring rounded-md">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-[11px] text-ink-300 sm:text-xs">
            <span className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400 shadow-[0_0_0_4px_rgba(92,199,151,0.18)]" />
            <span className="hidden sm:inline">Live market data</span>
          </span>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-10 sm:pb-20 sm:pt-10">
        <IpoListClient initialData={data} initialError={error} />

        <section aria-labelledby="ipo-guide" className="mt-14 border-t border-ink-800 pt-10">
          <h2 id="ipo-guide" className="font-display text-xl font-semibold text-ink-100 sm:text-2xl">
            Understanding IPO GMP, subscription and listing gains
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-300">
            {SITE_NAME} tracks live grey market premium, price band, subscription status and key dates for open, upcoming and
            recently closed mainboard and SME IPOs in India.
          </p>
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {GLOSSARY_FAQ.map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-ink-700 bg-ink-900 p-4">
                <summary className="focus-ring cursor-pointer list-none rounded font-display text-sm font-semibold text-ink-100">
                  {q}
                </summary>
                <p className="mt-2.5 text-xs leading-relaxed text-ink-300">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-ink-800 px-4 py-6 text-[10px] text-ink-400 sm:flex-row sm:justify-between sm:px-10">
        <span>
          IPO focus <span aria-hidden="true" className="mx-2.5 inline-block h-3 w-px bg-ink-600 align-middle" /> Built for clarity.
        </span>
        <span>GMP is indicative and does not guarantee listing gains.</span>
      </footer>
    </>
  );
}
