/**
 * Measures every slot on the rhythm grid, at every size, and prints the result
 * as a table plus a JSON blob.
 *
 * Usage:  node scripts/measure-rhythm.mjs [baseURL] [--json out.json]
 * Needs the demo dev server running (npm start).
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const baseURL = process.argv.find(a => a.startsWith('http')) ?? 'http://localhost:4600';
const jsonFlag = process.argv.indexOf('--json');
const jsonOut = jsonFlag > -1 ? process.argv[jsonFlag + 1] : null;
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

page.on('pageerror', e => console.error('PAGE ERROR:', e.message));

await page.goto(`${baseURL}/foundations/rhythm`, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-rg-cell]', { timeout: 30_000 });

const result = {};

for (const size of SIZES) {
  await page.getByRole('button', { name: size, exact: true }).click();
  // Let ResizeObserver flush twice before reading.
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(120);

  result[size] = await page.evaluate(() =>
    [...document.querySelectorAll('[data-rg-cell]')].map(el => ({
      label: el.getAttribute('data-rg-cell'),
      height: Number(el.getAttribute('data-rg-height')),
      onGrid: el.getAttribute('data-rg-ongrid') === 'true',
      group: el.getAttribute('data-rg-group') ?? '',
    })),
  );
}

await browser.close();

// ---- report ----
const labels = [...new Set(Object.values(result).flat().map(c => c.label))];
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);
const W = Math.max(22, ...labels.map(l => l.length + 2));

console.log('\n' + pad('SLOT', W) + SIZES.map(s => rpad(s, 8)).join('') + '   grid(4px)');
console.log('-'.repeat(W + 8 * SIZES.length + 14));

for (const label of labels) {
  const cells = SIZES.map(s => result[s].find(c => c.label === label));
  const flags = cells.map(c => (c ? (c.onGrid ? '.' : 'X') : '-')).join('');
  console.log(
    pad(label, W) + cells.map(c => rpad(c ? c.height : '—', 8)).join('') + '   ' + flags,
  );
}

// The verdict: the form-row cohort must collapse to a single height.
console.log('\nFORM-ROW COHORT — the controls meant to share a filter bar:');
let worst = 0;
for (const s of SIZES) {
  const row = result[s].filter(c => c.group === 'form-row' && c.height > 0);
  const uniq = [...new Set(row.map(c => c.height))].sort((a, b) => a - b);
  const spread = uniq.length ? Math.round((uniq.at(-1) - uniq[0]) * 100) / 100 : 0;
  worst = Math.max(worst, spread);
  const flag = spread === 0 ? 'PASS' : 'FAIL';
  console.log(`  ${pad(s, 4)} ${flag}  spread=${rpad(spread + 'px', 8)} n=${rpad(row.length, 3)} heights=[${uniq.join(', ')}]`);
  if (spread > 0) {
    const tallest = Math.max(...row.map(c => c.height));
    const shortest = Math.min(...row.map(c => c.height));
    const lo = row.filter(c => c.height === shortest).map(c => c.label).join(', ');
    const hi = row.filter(c => c.height === tallest).map(c => c.label).join(', ');
    console.log(`         shortest ${shortest}px: ${lo}`);
    console.log(`         tallest  ${tallest}px: ${hi}`);
  }
}
console.log(`\n  WORST FORM-ROW SPREAD ACROSS ALL SIZES: ${worst}px  ${worst === 0 ? '(PASS)' : '(FAIL)'}`);

console.log('\nOff-grid slots per size (all measured):');
for (const s of SIZES) {
  const hs = result[s].filter(c => c.height > 0);
  const off = hs.filter(c => !c.onGrid);
  console.log(`  ${pad(s, 4)} ${off.length}/${hs.length} off-grid: ${off.map(c => c.label + '(' + c.height + ')').join(', ') || 'none'}`);
}

if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify(result, null, 2));
  console.log(`\nwrote ${jsonOut}`);
}
