import test from 'node:test';
import assert from 'node:assert/strict';
import { ipoDescription, ipoFaq, ipoJsonLd, ipoTitle } from './lib/seo.js';
import { detailPathFor } from './lib/format.js';

const ipo = { name: 'Example Ltd', gmp: 12, gmpPercent: 10.5, priceBand: '₹100 – ₹106', openDate: '21-Sep', closeDate: '23-Sep', listingDate: '28-Sep', lotSize: 1200, subscription: 3.5, fetchedAt: '2026-09-23T10:00:00.000Z' };

test('description stays within search-snippet length and carries the live numbers', () => {
  const text = ipoDescription(ipo);
  assert.ok(text.length <= 160, `too long: ${text.length}`);
  assert.match(text, /Example Ltd IPO GMP today is/);
  assert.match(ipoTitle(ipo), /Example Ltd IPO GMP/);
});

test('FAQ only asks about data we hold', () => {
  assert.equal(ipoFaq({ name: 'Bare', gmp: 0, gmpPercent: 0 }).length, 1);
  assert.ok(ipoFaq(ipo).length >= 5);
});

test('JSON-LD has a webpage, breadcrumb and FAQ, and survives script-breaking text', () => {
  const graph = ipoJsonLd({ ...ipo, name: '</script>Evil' }, '/ipo/example-ipo/1')['@graph'];
  assert.deepEqual(graph.map((n) => n['@type']), ['WebPage', 'BreadcrumbList', 'FAQPage']);
  assert.ok(graph[0].url.endsWith('/ipo/example-ipo/1'));
});

test('detail paths have no trailing slash (matches the canonical URL)', () => {
  assert.equal(detailPathFor('https://www.investorgain.com/gmp/example-ipo/1/'), '/ipo/example-ipo/1');
});
