import test from 'node:test';
import assert from 'node:assert/strict';
import { listingTime, sortIpos } from './lib/sort.js';

const now = new Date('2026-09-24T00:00:00Z');
const ipos = [
  { name: 'Late', listingDate: '02-Oct', gmpPercent: 5, gmp: 5 },
  { name: 'NoDate', listingDate: null, gmpPercent: 90, gmp: 90 },
  { name: 'Soon', listingDate: '28-Sep', gmpPercent: 40, gmp: 40 },
  { name: 'Soon B', listingDate: '28-Sep', gmpPercent: 10, gmp: 10 },
];

test('listing sort: earliest first, ties by name, undated last', () => {
  assert.deepEqual(sortIpos(ipos, 'listing', now).map((i) => i.name), ['Soon', 'Soon B', 'Late', 'NoDate']);
});

test('gmp sort: highest percent first, regardless of date', () => {
  assert.deepEqual(sortIpos(ipos, 'gmp', now).map((i) => i.name), ['NoDate', 'Soon', 'Soon B', 'Late']);
});

test('gmp ties fall back to rupee GMP, then listing date', () => {
  const tied = [
    { name: 'B', listingDate: '30-Sep', gmpPercent: 0, gmp: 0 },
    { name: 'A', listingDate: '28-Sep', gmpPercent: 0, gmp: 0 },
    { name: 'C', listingDate: '29-Sep', gmpPercent: 0, gmp: 3 },
  ];
  assert.deepEqual(sortIpos(tied, 'gmp', now).map((i) => i.name), ['C', 'A', 'B']);
});

test('year rolls over for dates that already passed; does not mutate input', () => {
  assert.equal(new Date(listingTime('02-Jan', new Date('2026-12-30T00:00:00Z'))).getUTCFullYear(), 2027);
  assert.equal(new Date(listingTime('28-Sep', now)).getUTCFullYear(), 2026);
  assert.equal(listingTime('nonsense', now), null);
  const copy = ipos.map((i) => i.name);
  sortIpos(ipos, 'gmp', now);
  assert.deepEqual(ipos.map((i) => i.name), copy);
});
