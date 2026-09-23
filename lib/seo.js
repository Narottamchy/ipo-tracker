import { formatMoney, formatMultiplier, formatNumber, formatPercent } from './format.js';
import { SITE_NAME, canonicalSiteUrl } from './site.js';

const has = (value) => value !== null && value !== undefined && value !== '';

export function ipoTitle(data) {
  return `${data.name} IPO GMP, Price Band & Subscription | ${SITE_NAME}`;
}

export function ipoDescription(data) {
  const bits = [`${data.name} IPO GMP today is ${formatMoney(data.gmp)} (${formatPercent(data.gmpPercent)})`];
  if (has(data.priceBand)) bits.push(`price band ${data.priceBand}`);
  if (has(data.openDate) && has(data.closeDate)) bits.push(`opens ${data.openDate}, closes ${data.closeDate}`);
  if (has(data.listingDate)) bits.push(`listing ${data.listingDate}`);
  if (has(data.lotSize)) bits.push(`lot size ${formatNumber(data.lotSize)}`);
  if (has(data.subscription)) bits.push(`subscribed ${formatMultiplier(data.subscription)}`);
  const text = `${bits.join(', ')}. Live GMP trend, subscription and issue details.`;
  return text.length > 158 ? `${text.slice(0, 155).replace(/[,\s]+\S*$/, '')}…` : text;
}

// Question/answer pairs generated only from data we actually hold.
export function ipoFaq(data) {
  const faq = [];
  const asOf = data.fetchedAt ? new Date(data.fetchedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null;
  faq.push({
    q: `What is the GMP of ${data.name} IPO today?`,
    a: `The grey market premium (GMP) of ${data.name} IPO is ${formatMoney(data.gmp)} (${formatPercent(data.gmpPercent)} of the issue price)${asOf ? `, as of ${asOf}` : ''}. GMP is an unofficial indicator and can change quickly.`,
  });
  if (has(data.priceBand)) faq.push({ q: `What is the price band of ${data.name} IPO?`, a: `The price band of ${data.name} IPO is ${data.priceBand}.` });
  if (has(data.openDate) && has(data.closeDate)) {
    faq.push({
      q: `When does ${data.name} IPO open and close?`,
      a: `${data.name} IPO opens on ${data.openDate} and closes on ${data.closeDate}${has(data.listingDate) ? `, with listing expected on ${data.listingDate}` : ''}.`,
    });
  }
  if (has(data.lotSize)) {
    faq.push({
      q: `What is the lot size of ${data.name} IPO?`,
      a: `The lot size is ${formatNumber(data.lotSize)} shares${has(data.minimumInvestment) ? `, so the minimum investment is ${formatMoney(data.minimumInvestment)}` : ''}.`,
    });
  }
  if (has(data.subscription)) {
    faq.push({ q: `What is the subscription status of ${data.name} IPO?`, a: `${data.name} IPO is subscribed ${formatMultiplier(data.subscription)} overall${asOf ? ` as of ${asOf}` : ''}.` });
  }
  if (has(data.estimatedListingPrice)) {
    faq.push({ q: `What is the estimated listing price of ${data.name} IPO?`, a: `Based on the current GMP, the estimated listing price is ${formatMoney(data.estimatedListingPrice)}. This is indicative only and not guaranteed.` });
  }
  return faq;
}

export function faqJsonLd(faq) {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

export function ipoJsonLd(data, path) {
  const site = canonicalSiteUrl();
  const url = `${site}${path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: ipoTitle(data),
        description: ipoDescription(data),
        inLanguage: 'en-IN',
        dateModified: data.fetchedAt,
        isPartOf: { '@type': 'WebSite', '@id': `${site}/#website`, url: site, name: SITE_NAME },
        about: { '@type': 'Corporation', name: data.name },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'IPOs', item: site },
          { '@type': 'ListItem', position: 2, name: `${data.name} IPO`, item: url },
        ],
      },
      { '@id': `${url}#faq`, ...faqJsonLd(ipoFaq(data)) },
    ],
  };
}
