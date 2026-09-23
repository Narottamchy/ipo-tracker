import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChittorgarh } from './lib/chittorgarh.js';

const kv = (rows) => `<table class="t"><tbody>${rows.map(([k, v]) => `<tr><td><span><a>${k}</a></span></td><td class="text-end">${v}</td></tr>`).join('')}</tbody></table>`;
const page = `
<h2 class="accordion-header"><button>IPO Insights</button></h2>
${kv([['IPO Date', '21 to 23 Sep, 2026'], ['Listing Date', 'Mon, Sep 28, 2026<span class="badge">T</span>']])}
${kv([['Total Issue Size', '29,32,800 shares']])}
<h2 class="section-title">IPO<!-- --> Timetable <!-- -->(Tentative)</h2>
<ul class="top-ratios"><li><span><a>IPO<!-- --> Open</a></span><span class="text-end">Mon, Sep 21, 2026</span></li><li><span><a>Allotment</a></span><span class="text-end">Thu, Sep 24, 2026</span></li></ul>
<h2 class="section-title">Issue Reservation</h2><p>Total issue of 100 shares.</p>
<table><thead><tr><th>Investor Category</th><th>Shares</th></tr></thead><tbody><tr><td>&minus; Anchor</td><td>10</td></tr><tr><td>Firm Reservations</td></tr></tbody></table>
<table id='financialTable'><thead><tr><th>Period Ended</th><th>31 Mar 2026</th></tr></thead><tbody><tr><td>Total Income</td><td>93.72</td></tr></tbody></table>
<p><b>Company Promoter:</b> Jane Doe</p>`;

test('parses details, timetable, tables and summaries from the right sections', () => {
  const r = parseChittorgarh(page);
  assert.deepEqual(r.details.map((d) => [d.label, d.value]), [['IPO Date', '21 to 23 Sep, 2026'], ['Listing Date', 'Mon, Sep 28, 2026 T'.replace(' T', '')], ['Total Issue Size', '29,32,800 shares']]);
  assert.deepEqual(r.timetable, [{ label: 'IPO Open', value: 'Mon, Sep 21, 2026' }, { label: 'Allotment', value: 'Thu, Sep 24, 2026' }]);
  assert.equal(r.reservation.summary, 'Total issue of 100 shares.');
  assert.deepEqual(r.reservation.rows[0], ['− Anchor', '10']);
  assert.deepEqual(r.reservation.rows[1], ['Firm Reservations']);
  assert.deepEqual(r.financials.rows, [['Total Income', '93.72']]);
  assert.equal(r.promoter, 'Jane Doe');
});

test('returns null for pages without IPO content', () => assert.equal(parseChittorgarh('<html><body>Access denied</body></html>'), null));
