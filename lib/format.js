export const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
export const moneyFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatNumber = (value) => numberFormat.format(value);
export const formatMoney = (value) => moneyFormat.format(value);
export const formatPercent = (value) => `${value > 0 ? '+' : ''}${numberFormat.format(value)}%`;
export const formatMultiplier = (value) => (value === null || value === undefined ? 'Not open' : `${numberFormat.format(value)}×`);
export const formatDateTime = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const show = (value, fallback = 'Unavailable') => (value === null || value === undefined || value === '' ? fallback : value);
export const detailPathFor = (sourceUrl) => new URL(sourceUrl).pathname.replace(/^\/gmp\//, '/ipo/').replace(/\/$/, '');
