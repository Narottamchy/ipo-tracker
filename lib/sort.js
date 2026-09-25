const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

export const SORT_OPTIONS = [
  { key: 'listing', label: 'Listing date (earliest first)' },
  { key: 'gmp', label: 'GMP % (high to low)' },
];

// "28-Sep" → timestamp. The source omits the year, so a date that already passed rolls to next
// year (same rule the market parser uses). Missing/unparseable dates return null.
export function listingTime(label, now = new Date()) {
  const match = label?.match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (!match || MONTHS[match[2]] === undefined) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let value = Date.UTC(now.getUTCFullYear(), MONTHS[match[2]], Number(match[1]));
  if (value < today - 86_400_000) value = Date.UTC(now.getUTCFullYear() + 1, MONTHS[match[2]], Number(match[1]));
  return value;
}

// Returns a new array. Listing sort puts IPOs with no listing date last; GMP sort breaks ties by
// rupee GMP and then listing date, so equal-GMP IPOs still come out in a sensible order.
export function sortIpos(ipos, mode = 'listing', now = new Date()) {
  const time = (ipo) => listingTime(ipo.listingDate, now) ?? Infinity;
  const byListing = (a, b) => time(a) - time(b) || a.name.localeCompare(b.name);
  const compare =
    mode === 'gmp'
      ? (a, b) => (b.gmpPercent || 0) - (a.gmpPercent || 0) || (b.gmp || 0) - (a.gmp || 0) || byListing(a, b)
      : byListing;
  return [...ipos].sort(compare);
}
