#!/usr/bin/env node
/**
 * WCAG contrast measurement for the ngx-tw theme token blocks.
 *
 * Parses the Tailwind v4 palette (oklch) out of node_modules, resolves a
 * scheme's `[data-theme=…]` block token graph down to sRGB, and prints
 * contrast ratios per pairing — with a comparison column so a new scheme can
 * be shown to out-contrast an existing one rather than asserted to.
 */
import { readFileSync } from 'node:fs';

const ROOT = '/Users/ciprianiuga/dev/sandbox/ngx-tw';
const THEME = `${ROOT}/projects/ngx-tw/theme`;

/* ---------- colour maths ---------- */

function oklchToSrgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  // gamma-encode, then clamp into gamut (some v4 steps sit slightly outside sRGB)
  return lin.map((v) => {
    const e = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, e));
  });
}

const linearize = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function luminance([r, g, b]) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function ratio(c1, c2) {
  const a = luminance(c1);
  const b = luminance(c2);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const hex = (c) =>
  '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

/* ---------- palette ---------- */

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

/* ---------- scheme blocks ---------- */

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

function schemeTokens(file, selector) {
  const css = stripComments(readFileSync(`${THEME}/${file}`, 'utf8'));
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`${selector} not found in ${file}`);
  // Read to the matching close brace of the block that follows the selector.
  const open = css.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) {
      end = i;
      break;
    }
  }
  const body = css.slice(open, end);
  const out = new Map();
  const decl = /^[ \t]*(--[a-zA-Z0-9-]+)[ \t]*:[ \t]*([^;]+);/gm;
  let m;
  while ((m = decl.exec(body)) !== null) out.set(m[1].slice(2), m[2].trim());
  return out;
}

/** Resolves `name` (no leading `--`) inside `tokens`, falling back to the palette. */
function resolve(tokens, name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`cycle at ${name}`);
  seen.add(name);
  const raw = tokens.get(name);
  if (raw === undefined) {
    const p = palette.get(name);
    if (!p) throw new Error(`unknown token ${name}`);
    return p;
  }
  const v = raw.match(/^var\(\s*--([a-zA-Z0-9-]+)\s*\)$/);
  if (v) return resolve(tokens, v[1], seen);
  const p = palette.get(name);
  if (p) return p;
  throw new Error(`unresolvable ${name} = ${raw}`);
}

/* ---------- pairings ---------- */

const ROLES = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SURFACES = ['surface', 'surface-raised', 'surface-overlay', 'surface-sunken', 'surface-muted'];

function pairings() {
  const p = [];
  for (const fg of ['fg', 'fg-muted', 'fg-subtle'])
    for (const bg of SURFACES) p.push([`color-${fg}`, `color-${bg}`, 4.5, 'text']);
  for (const b of ['border', 'border-strong'])
    p.push([`color-${b}`, 'color-surface', 3, 'ui']);
  p.push(['color-primary-500', 'color-surface', 3, 'ui']); // canonical focus ring
  for (const r of ROLES) {
    p.push([`color-${r}-soft-fg`, `color-${r}-soft`, 4.5, 'text']);
    p.push([`color-${r}-soft-fg-muted`, `color-${r}-soft`, 4.5, 'text']);
    p.push([`color-${r}-soft-fg`, `color-${r}-soft-hover`, 4.5, 'text']);
    p.push([`color-${r}-solid-fg`, `color-${r}-solid`, 4.5, 'text']);
    p.push([`color-${r}-solid-fg`, `color-${r}-solid-hover`, 4.5, 'text']);
    p.push([`color-${r}-fg`, 'color-surface', 4.5, 'text']);
    p.push([`color-${r}-icon`, 'color-surface', 3, 'ui']);
    p.push([`color-${r}-border`, 'color-surface', 3, 'ui']);
    p.push([`color-${r}-border-strong`, `color-${r}-soft`, 3, 'ui']);
  }
  return p;
}

/* ---------- run ---------- */

const SCHEMES = {
  light: ['_light.css', '[data-theme="light"]'],
  dark: ['_dark.css', '[data-theme="dark"]'],
  hc: ['_high-contrast.css', '[data-theme="high-contrast"]'],
  'hc-dark': ['_high-contrast-dark.css', '[data-theme="high-contrast-dark"]'],
};

const want = process.argv.slice(2);
const subject = want[0] ?? 'hc-dark';
const baseline = want[1] ?? 'dark';

const A = schemeTokens(...SCHEMES[subject]);
const B = schemeTokens(...SCHEMES[baseline]);

let fails = 0;
let regressions = 0;
const rows = [];
for (const [fg, bg, min, kind] of pairings()) {
  const a = ratio(resolve(A, fg), resolve(A, bg));
  const b = ratio(resolve(B, fg), resolve(B, bg));
  const ok = a >= min;
  if (!ok) fails++;
  if (a < b - 0.005) regressions++;
  rows.push({
    pair: `${fg.replace('color-', '')} on ${bg.replace('color-', '')}`,
    kind,
    min,
    subject: a,
    baseline: b,
    ok,
    better: a >= b - 0.005,
  });
}

const w = Math.max(...rows.map((r) => r.pair.length));
console.log(`\n${'pairing'.padEnd(w)}  min   ${subject.padStart(7)}  ${baseline.padStart(7)}   verdict`);
console.log('-'.repeat(w + 40));
for (const r of rows) {
  console.log(
    `${r.pair.padEnd(w)}  ${String(r.min).padStart(3)}  ` +
      `${r.subject.toFixed(2).padStart(7)}  ${r.baseline.toFixed(2).padStart(7)}   ` +
      `${r.ok ? 'PASS' : 'FAIL'}${r.better ? '' : '  ↓ below baseline'}`,
  );
}
console.log(
  `\n${rows.length} pairings — ${fails} below the WCAG floor, ${regressions} below the "${baseline}" baseline.`,
);

if (process.env.SWATCH) {
  for (const t of [...A.keys()].sort()) {
    try {
      console.log(`  --${t}: ${hex(resolve(A, t))}`);
    } catch {
      /* non-colour token */
    }
  }
}
