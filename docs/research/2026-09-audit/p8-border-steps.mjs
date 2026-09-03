#!/usr/bin/env node
/**
 * Pass 8 — picking the `light` scheme's coloured border steps.
 *
 * `p6-border-steps.mjs` answered one question (which step clears 3:1 against
 * the *surface*) and that was enough for `dark`, whose `-border-strong` sat at
 * `{hue}-500` and already cleared every floor. In `light` the same move
 * collides with `-border-strong`: on white, contrast rises with the step
 * number, so raising `-border` to the first passing step lands it exactly where
 * `-border-strong` already is and collapses the two tiers.
 *
 * So this prints BOTH columns the theme spec asserts — `{hue}-{step}` against
 * `--color-surface` and against that role's `-soft` fill — for every step, so
 * the pair of values is chosen from one table instead of two.
 *
 * Colour maths is copied verbatim from `p6-contrast.mjs`, which validates it
 * against Tailwind's published hexes.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const THEME = join(ROOT, 'projects', 'ngx-tw', 'theme');

function oklchToSrgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
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
  const a = luminance(c1);
  const b = luminance(c2);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const palette = new Map();
{
  const css = readFileSync(join(ROOT, 'node_modules', 'tailwindcss', 'theme.css'), 'utf8');
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

function schemeTokens(file, selector) {
  const css = readFileSync(join(THEME, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const start = css.indexOf(selector);
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
  const out = new Map();
  const decl = /^[ \t]*--([a-zA-Z0-9-]+)[ \t]*:[ \t]*([^;]+);/gm;
  let m;
  const body = css.slice(open, end);
  while ((m = decl.exec(body)) !== null) out.set(m[1], m[2].trim());
  return out;
}

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

const SCHEMES = {
  light: ['_light.css', '[data-theme="light"]'],
  dark: ['_dark.css', '[data-theme="dark"]'],
  hc: ['_high-contrast.css', '[data-theme="high-contrast"]'],
  'hc-dark': ['_high-contrast-dark.css', '[data-theme="high-contrast-dark"]'],
};
const ROLES = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const STEPS = [200, 300, 400, 500, 600, 700, 800, 900];

const scheme = process.argv[2] ?? 'light';
const tokens = schemeTokens(...SCHEMES[scheme]);
const surface = resolve(tokens, 'color-surface');

console.log(
  `\n=== ${scheme}: {role}-{step} vs --color-surface | vs {role}-soft  (floor 3.0, target 3.4) ===`,
);
for (const role of ROLES) {
  const soft = resolve(tokens, `color-${role}-soft`);
  const cells = STEPS.map((s) => {
    let c;
    try {
      c = resolve(tokens, `color-${role}-${s}`);
    } catch {
      return '      —      ';
    }
    const a = ratio(c, surface);
    const b = ratio(c, soft);
    const mark = a >= 3.4 && b >= 3 ? '*' : ' ';
    return `${a.toFixed(2)}/${b.toFixed(2)}${mark}`.padStart(13);
  });
  console.log(role.padEnd(10) + cells.join(''));
}
console.log('          ' + STEPS.map((s) => String(s).padStart(13)).join(''));
console.log('\n(a* marks a step clearing BOTH the 3.4 surface target and the 3.0 soft floor)');

// Current values, for the record.
console.log(`\ncurrent ${scheme} values:`);
for (const role of ROLES) {
  const soft = resolve(tokens, `color-${role}-soft`);
  const b = resolve(tokens, `color-${role}-border`);
  const bs = resolve(tokens, `color-${role}-border-strong`);
  console.log(
    `  ${role.padEnd(10)} -border ${ratio(b, surface).toFixed(2)} on surface, ` +
      `${ratio(b, soft).toFixed(2)} on soft   |   ` +
      `-border-strong ${ratio(bs, surface).toFixed(2)} on surface, ${ratio(bs, soft).toFixed(2)} on soft`,
  );
}
