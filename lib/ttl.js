import { dated } from '../parser.mjs';

const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60;

// Seconds until the IPO's listing date (falls back to close date, then 30 days).
export function secondsUntilListing(detailData) {
  const label = detailData.listingDate || detailData.closeDate;
  const isoDate = dated(label, new Date());
  if (!isoDate) return DEFAULT_TTL_SECONDS;
  const listingMs = new Date(`${isoDate}T23:59:59Z`).getTime();
  const remaining = Math.floor((listingMs - Date.now()) / 1000);
  return remaining > 0 ? remaining : 60 * 60;
}
