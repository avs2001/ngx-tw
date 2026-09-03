#!/usr/bin/env node
/**
 * Which palette step does each role's `-border` token need in order to clear
 * SC 1.4.11 (3:1) against that scheme's `--color-surface`?
 *
 * Reuses the exact colour maths of `p6-contrast.mjs` (validated there against
 * Tailwind's published hexes). Prints every step 200..800 per hue so the choice
 * is made from the table rather than guessed.
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
const hex = (c) => '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

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

// role -> tailwind hue, per _dark.css / _light.css.
const HUES = {
  primary: 'blue', secondary: 'slate', accent: 'violet',
  info: 'sky', success: 'green', warning: 'amber', error: 'red',
};
const STEPS = [200, 300, 400, 500, 600, 700, 800];

for (const [surfaceName, surfaceToken] of [['dark surface (gray-950)', 'color-gray-950'], ['light surface (white)', 'color-white']]) {
  const surface = palette.get(surfaceToken);
  console.log(`\n=== ${surfaceName} ${hex(surface)} — ratio of {hue}-{step} against it (floor 3.0) ===`);
  console.log('role       ' + STEPS.map((s) => String(s).padStart(7)).join(''));
  for (const [role, hue] of Object.entries(HUES)) {
    const cells = STEPS.map((s) => {
      const c = palette.get(`color-${hue}-${s}`);
      const r = ratio(c, surface);
      return (r.toFixed(2) + (r >= 3 ? '*' : ' ')).padStart(7);
    });
    console.log(role.padEnd(11) + cells.join(''));
  }
  console.log(`(gray-500 = ${ratio(palette.get('color-gray-500'), surface).toFixed(2)}  <- --color-border)`);
}
