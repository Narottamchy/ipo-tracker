export const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
export const moneyFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatNumber = (value) => numberFormat.format(value);
export const formatMoney = (value) => moneyFormat.format(value);
export const formatPercent = (value) => `${value > 0 ? '+' : ''}${numberFormat.format(value)}%`;
export const formatMultiplier = (value) => (value === null || value === undefined ? 'Not open' : `${numberFormat.format(value)}×`);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Fixed to IST and built by hand: Intl output differs between Node and browsers (timezone, ICU
// spacing), which breaks hydration when the same text renders on the server and in the browser.
export const formatDateTime = (iso) => {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';
  const d = new Date(time + 330 * 60_000);
  const hour = d.getUTCHours();
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hour % 12 || 12}:${minutes} ${hour < 12 ? 'am' : 'pm'} IST`;
};
export const show = (value, fallback = 'Unavailable') => (value === null || value === undefined || value === '' ? fallback : value);
export const detailPathFor = (sourceUrl) => new URL(sourceUrl).pathname.replace(/^\/gmp\//, '/ipo/').replace(/\/$/, '');
