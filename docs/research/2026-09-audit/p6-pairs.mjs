#!/usr/bin/env node
/**
 * Measure arbitrary raw-palette pairings. Same colour maths as
 * `p6-contrast.mjs` (validated there against Tailwind's published hexes),
 * exposed so a doc-comment table can be checked row by row instead of trusted.
 *
 *   node scratchpad/p6-pairs.mjs green-500 green-950 blue-500 blue-950 ...
 * with no args it re-measures every claim written into the theme headers.
 */
import { readFileSync } from 'node:fs';

const ROOT = '/Users/ciprianiuga/dev/sandbox/ngx-tw';

function oklchToSrgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((v) => {
    const e = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, e));
  });
}
const linearize = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]) => 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
function ratio(c1, c2) {
  const a = luminance(c1), b = luminance(c2);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const palette = new Map();
{
  const css = readFileSync(`${ROOT}/node_modules/tailwindcss/theme.css`, 'utf8');
  const oklch = /--(color-[a-z0-9-]+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/g;
  let m;
  while ((m = oklch.exec(css)) !== null) {
    palette.set(m[1], oklchToSrgb(Number(m[2]) / 100, Number(m[3]), Number(m[4])));
  }
  const hexes = /--(color-[a-z0-9-]+):\s*#([0-9a-fA-F]{3,6})\b/g;
  while ((m = hexes.exec(css)) !== null) {
    const h = m[2].length === 3 ? m[2].split('').map((x) => x + x).join('') : m[2];
    palette.set(m[1], [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255));
  }
}
const get = (n) => {
  const c = palette.get(`color-${n}`);
  if (!c) throw new Error(`unknown palette colour ${n}`);
  return c;
};

// [fg, bg, what the repo currently claims, where it is claimed]
const CLAIMS = [
  ['green-500', 'green-950', 8.1, '_dark.css header'],
  ['amber-400', 'amber-950', 11.2, '_dark.css header'],
  ['red-500', 'red-950', 5.4, '_dark.css header'],
  ['blue-500', 'blue-950', 5.8, '_dark.css header'],
  ['violet-500', 'violet-950', 6.0, '_dark.css header'],
  ['slate-300', 'slate-950', 11.6, '_dark.css header'],
  ['blue-500', 'blue-950', 3.92, '_dark.css inline (primary-solid)'],
  ['violet-500', 'violet-950', 3.46, '_dark.css inline (accent-solid)'],
  ['red-500', 'red-950', 4.14, '_dark.css inline (error-solid)'],
  ['blue-400', 'blue-950', 7.8, '_dark.css inline (primary-solid, "~7.8")'],
  ['violet-400', 'violet-950', 5.4, '_dark.css inline (accent-solid, "~5.4")'],
  ['red-400', 'red-950', 5.8, '_dark.css inline (error-solid, "~5.8")'],
  ['gray-300', 'white', 1.47, '_semantic.css border note (light)'],
  ['gray-400', 'white', 2.60, '_semantic.css border note (light)'],
  ['gray-500', 'white', 4.79, '_semantic.css border note (light --color-border)'],
  ['gray-600', 'white', 7.56, '_semantic.css border note (light --color-border-strong)'],
  ['gray-500', 'gray-950', 4.16, '_semantic.css border note (dark --color-border)'],
  ['gray-400', 'gray-950', 8.59, '_semantic.css border note (dark --color-border-strong)'],
  ['gray-600', 'gray-950', 2.66, '_semantic.css border note (dark, "gray-600 failed")'],
];

const args = process.argv.slice(2);
const rows = args.length
  ? Array.from({ length: args.length / 2 }, (_, i) => [args[i * 2], args[i * 2 + 1], null, ''])
  : CLAIMS;

const w = Math.max(...rows.map((r) => `${r[0]} on ${r[1]}`.length));
console.log(`${'pairing'.padEnd(w)}  measured   claimed   verdict   source`);
console.log('-'.repeat(w + 60));
for (const [fg, bg, claimed, where] of rows) {
  const r = ratio(get(fg), get(bg));
  const ok = claimed === null ? '' : Math.abs(r - claimed) <= 0.05 ? 'ok' : 'STALE';
  console.log(
    `${`${fg} on ${bg}`.padEnd(w)}  ${r.toFixed(2).padStart(8)}  ` +
      `${(claimed === null ? '-' : claimed.toFixed(2)).padStart(8)}   ${ok.padEnd(7)}   ${where}`,
  );
}
