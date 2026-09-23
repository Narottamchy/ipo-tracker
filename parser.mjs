export const MARKET_URL = 'https://www.investorgain.com/report/ipo-gmp-live/331/';

const decode = (value = '') => value.replace(/&#8377;/gi, '₹').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&nbsp;/gi, ' ').replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
const plain = (html = '') => decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
export const dated = (label, now) => {
  const match = label?.match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (!match || months[match[2]] === undefined) return null;
  let value = Date.UTC(now.getUTCFullYear(), months[match[2]], Number(match[1]));
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (value < today - 86_400_000) value = Date.UTC(now.getUTCFullYear() + 1, months[match[2]], Number(match[1]));
  return new Date(value).toISOString().slice(0, 10);
};

export function parseMarket(html, now = new Date()) {
  const rows = [...html.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)];
  const ipos = rows.flatMap(([, row]) => {
    const cells = {};
    for (const match of row.matchAll(/<td\b[^>]*data-label="([^"]+)"[^>]*>([\s\S]*?)<\/td>/gi)) cells[decode(match[1])] = match[2];
    if (!cells.Name) return [];
    const link = cells.Name.match(/<a\b[^>]*href="([^"]*\/gmp\/[^"]+)"[^>]*title="([^"]+)"/i);
    if (!link) return [];
    const badges = [...cells.Name.matchAll(/<span\b[^>]*badge[^>]*>([\s\S]*?)<\/span>/gi)].map((match) => plain(match[1]));
    const statusCode = badges.find((value) => ['U', 'O', 'CT', 'C', 'L'].includes(value));
    if (!['U', 'O', 'CT'].includes(statusCode)) return [];
    const number = (label) => {
      const value = plain(cells[label]).match(/(?:₹\s*)?(-?\d[\d,.]*)/)?.[1];
      return value === undefined ? null : Number(value.replace(/,/g, ''));
    };
    const gmpMatch = cells.GMP?.match(/(?:&#8377;|₹)\s*<b[^>]*>(--|-?[\d,.]+)<\/b>/i);
    const gmpPercentMatch = plain(cells.GMP).match(/\((-?[\d,.]+)%\)/);
    const closeDate = plain(cells.Close).match(/\d{1,2}-[A-Za-z]{3}/)?.[0] || null;
    return [{
      name: decode(link[2]),
      type: badges.find((value) => !['U', 'O', 'CT', 'C', 'L'].includes(value)) || 'IPO',
      status: { U: 'Upcoming', O: 'Open', CT: 'Closing today' }[statusCode],
      statusCode,
      gmp: gmpMatch && gmpMatch[1] !== '--' ? Number(gmpMatch[1].replace(/,/g, '')) : 0,
      gmpPercent: gmpPercentMatch ? Number(gmpPercentMatch[1].replace(/,/g, '')) : 0,
      openDate: plain(cells.Open).match(/\d{1,2}-[A-Za-z]{3}/)?.[0] || null,
      closeDate,
      closeDateISO: dated(closeDate, now),
      subscription: /^-?$/.test(plain(cells.Sub)) ? null : number('Sub'),
      price: number('Price (₹)'),
      issueSize: plain(cells['IPO Size']) || null,
      lotSize: number('Lot'),
      listingDate: plain(cells.Listing).match(/\d{1,2}-[A-Za-z]{3}/)?.[0] || null,
      sourceUrl: new URL(decode(link[1]), 'https://www.investorgain.com').href,
    }];
  });
  if (!ipos.length) throw new Error('Received an unrecognized market page. Try again later.');
  const statusOrder = { CT: 0, O: 1, U: 2 };
  return ipos.sort((a, b) => (a.closeDateISO || '9999-12-31').localeCompare(b.closeDateISO || '9999-12-31') || statusOrder[a.statusCode] - statusOrder[b.statusCode] || a.name.localeCompare(b.name));
}

export function parseDetail(html, marketIpo = {}) {
  const documents = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((match) => {
    try { const value = JSON.parse(match[1]); return Array.isArray(value) ? value : [value, ...(value['@graph'] || [])]; } catch { return []; }
  });
  const product = documents.find((item) => item['@type'] === 'FinancialProduct');
  const trend = documents.find((item) => item['@type'] === 'Dataset' && /GMP Trend Analysis/i.test(item.name || ''));
  if (!product?.name) throw new Error('IPO details are temporarily unavailable.');
  const properties = product.additionalProperty || [];
  const propertyNumber = (name) => {
    const raw = properties.find((item) => item.name === name)?.value;
    const value = Number(String(raw ?? '').replace(/,/g, ''));
    return Number.isFinite(value) ? value : null;
  };
  const trendProperties = trend?.variableMeasured || [];
  const metrics = Object.fromEntries(trendProperties.map((item) => [item.name, Number(item.value)]));
  const historyTable = html.match(/<table\b[^>]*aria-label="GMP timewise history"[^>]*>([\s\S]*?)<\/table>/i)?.[1] || '';
  const history = [...historyTable.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)].flatMap(([, row]) => {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => plain(match[1]));
    if (cells.length < 4) return [];
    const value = Number(cells[1].replace(/[^\d.-]/g, ''));
    return Number.isFinite(value) ? [{ value, time: cells[2], direction: cells[3].replace(/^[▲▼-]+\s*/, '') }] : [];
  }).reverse();
  const price = marketIpo.price ?? null;
  const gmp = propertyNumber('GMP') ?? marketIpo.gmp ?? 0;
  const gmpPercent = price ? (gmp / price) * 100 : marketIpo.gmpPercent ?? 0;
  const lotSize = marketIpo.lotSize ?? null;
  const subscription = propertyNumber('Subscription') ?? marketIpo.subscription ?? null;
  const pageText = plain(html);
  const priceBand = pageText.match(/₹\s*([\d,.]+)\s*-\s*([\d,.]+)\s+per share/i);
  return {
    ...marketIpo,
    name: product.provider?.name || marketIpo.name || product.name.replace(/ IPO GMP.*$/, ''),
    category: product.category || marketIpo.type || 'IPO',
    sector: properties.find((item) => item.name === 'Sector')?.value || null,
    exchange: properties.find((item) => item.name === 'Exchange')?.value || null,
    gmp, gmpPercent, subscription,
    priceBand: priceBand ? `₹${priceBand[1]} – ₹${priceBand[2]}` : price === null ? null : `₹${price}`,
    issueSize: marketIpo.issueSize || (propertyNumber('Issue Size') === null ? null : `₹${propertyNumber('Issue Size')} Cr`),
    estimatedListingPrice: price === null ? null : price + gmp,
    estimatedProfitPerLot: lotSize === null ? null : gmp * lotSize,
    minimumInvestment: price === null || lotSize === null ? null : price * lotSize,
    trend: trend ? {
      direction: trendProperties.find((item) => item.name === 'GMP Trend Direction')?.value || trend.description?.match(/showing a ([A-Za-z ]+) trend/i)?.[1] || 'Initial',
      description: trend.description?.replace(/InvestorGain(?:\.com)?(?:'s)?/gi, 'The market data') || null,
      sessions: metrics['Trend Duration'] ?? history.length,
      startingGmp: metrics['Starting GMP'] ?? history[0]?.value ?? gmp,
      currentGmp: metrics['Current GMP'] ?? gmp,
      netChange: metrics['Net GMP Change'] ?? (history.length ? gmp - history[0].value : 0),
      range: metrics['GMP Range'] ?? 0,
      positiveSessions: metrics['Positive Sessions'] ?? null,
      negativeSessions: metrics['Negative Sessions'] ?? null,
    } : null,
    history,
  };
}

export function parseSubscription(html) {
  const datasets = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((match) => {
    try { const value = JSON.parse(match[1]); return Array.isArray(value) ? value : [value, ...(value['@graph'] || [])]; } catch { return []; }
  });
  const dataset = datasets.find((item) => item['@type'] === 'Dataset' && /Subscription Status/i.test(item.name || ''));
  if (!dataset) return { categories: [], totalBidAmountCrore: null, updatedText: null };
  const values = new Map((dataset.variableMeasured || []).map((item) => [item.name, item.value]));
  const numeric = (name) => {
    const value = Number(String(values.get(name) ?? '').replace(/,/g, ''));
    return Number.isFinite(value) ? value : null;
  };
  const definitions = [
    ['QIB Subscription', 'QIB', 'Qualified institutions'],
    ['NII Subscription', 'NII / HNI', 'Non-institutional investors'],
    ['bNII Subscription', 'bNII', 'HNI applications above ₹10L'],
    ['sNII Subscription', 'sNII', 'HNI applications below ₹10L'],
    ['RII Subscription', 'Retail', 'Retail individual investors'],
    ['Employee Subscription', 'Employee', 'Employee reservation'],
    ['Shareholder Subscription', 'Shareholder', 'Shareholder reservation'],
    ['Total Subscription', 'Total', 'Overall subscription'],
  ];
  return {
    categories: definitions.flatMap(([key, label, description]) => values.has(key) ? [{ key, label, description, value: numeric(key) }] : []),
    totalBidAmountCrore: numeric('Total Bid Amount'),
    updatedText: dataset.description?.match(/as of (.+?)\.?$/i)?.[1] || null,
  };
}
