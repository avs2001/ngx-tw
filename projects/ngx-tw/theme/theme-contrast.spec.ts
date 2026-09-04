/* eslint-disable @typescript-eslint/triple-slash-reference -- the referenced
   file declares ambient Node modules (see its header); an `import` of it would
   have to resolve at runtime, and it emits no JavaScript. */
/// <reference path="./theme-node-shims.d.ts" />

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TW_RESOLVED_THEMES, type TwResolvedTheme } from './theme.types';

/**
 * Measured contrast guard for the border tokens SC 1.4.11 governs.
 *
 * **Why this exists.** `_semantic.css` explains at length that `--color-border`
 * and `--color-border-strong` were raised to clear WCAG 2.2 SC 1.4.11's 3:1
 * non-text-contrast floor, and that "axe does not catch any of this: its
 * `color-contrast` rule tests TEXT only". Nothing enforced it. The seven
 * coloured siblings in the same slot — `--color-{role}-border` — were then left
 * at values measuring 1.95–2.84:1 in `dark` for as long as the scheme has
 * shipped, and no test, no lint, and no visual baseline noticed: the only
 * component that paints them is the alert `outline` variant, and the visual
 * canary captures the alert *Colors* section, which renders the `soft` variant.
 *
 * A screenshot would be the wrong guard even if one existed. `maxDiffPixelRatio:
 * 0.01` can absorb a 1px border shifting hue, and a PNG cannot state the
 * invariant. This states it: resolve the scheme's token graph down to sRGB and
 * assert the ratio.
 *
 * **Method.** Tailwind v4's palette is authored in oklch, so the numbers cannot
 * be read off the source. Each value is converted oklch → linear sRGB →
 * gamma-encoded sRGB (clamped: a few v4 steps sit marginally outside the gamut)
 * → WCAG relative luminance → ratio. The conversion is checked against
 * Tailwind's own published hexes in the first test below, so a wrong
 * implementation fails loudly instead of producing plausible numbers.
 *
 * **What this file used to also assert, and why it no longer does.** A second
 * pairing — `{role}-border` painted on `{role}-soft` — was tracked here as a
 * two-sided `EXPECTED_BELOW_FLOOR` list, because `item.ts` drew its selected
 * state as `bg-primary-soft ring-2 ring-inset ring-primary-border`. On
 * 2026-09-04 that ring moved to `ring-primary-border-strong`, and with it the
 * last site in the library painting the subtle tier on a soft fill. The
 * expectation was removed rather than updated: nothing paints that pairing, so
 * it would have recorded a number about a combination the library does not
 * produce and no one could act on. What replaced it is stronger, not weaker —
 * `borderRatios()` below asserts `-border-strong` on `-soft` for all eight
 * roles in all four schemes against a hard floor, with no allowance list. For
 * the record, the retired pairing measured 2.37–2.97 for four of dark's eight
 * roles (primary, accent, info, warning) and cleared 3:1 everywhere else.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

/** WCAG 2.2 SC 1.4.11 — non-text contrast. */
const NON_TEXT_FLOOR = 3;

/**
 * Schemes whose coloured `-border` tokens are known to fail `NON_TEXT_FLOOR`,
 * with the reason.
 *
 * Modelled on `e2e/support/a11y.ts`'s `A11Y_BACKLOG`: the assertion below fails
 * both when a listed scheme *passes* (a stale allowance that should be deleted)
 * and when an unlisted one fails (a regression). An entry cannot rot into
 * permanent permission, because fixing the scheme turns the list red.
 */
const KNOWN_FAILING: ReadonlyMap<TwResolvedTheme, string> = new Map<TwResolvedTheme, string>([
  // Empty, and worth keeping empty rather than deleting: the assertion below is
  // two-sided, so an entry added here to buy time turns the list red the moment
  // its scheme is fixed. `dark` was raised on 2026-09-03 and `light` — the last
  // holdout, and the default — on 2026-09-04.
]);

/** Which file and selector carry each scheme's element-agnostic token block. */
const SCHEME_BLOCKS: Record<TwResolvedTheme, readonly [string, string]> = {
  light: ['_light.css', '[data-theme="light"]'],
  dark: ['_dark.css', '[data-theme="dark"]'],
  'high-contrast': ['_high-contrast.css', '[data-theme="high-contrast"]'],
  'high-contrast-dark': ['_high-contrast-dark.css', '[data-theme="high-contrast-dark"]'],
};

const ROLES = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'info',
  'success',
  'warning',
  'error',
] as const;

/* ───────────────────────── colour maths ───────────────────────── */

type Rgb = readonly [number, number, number];

/** oklch → sRGB in 0..1, gamma-encoded and gamut-clamped. */
function oklchToSrgb(lightness: number, chroma: number, hue: number): Rgb {
  const h = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(h);
  const b = chroma * Math.sin(h);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const encoded = linear.map((v) => {
    const e = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(v, 0) ** (1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, e));
  });
  return [encoded[0], encoded[1], encoded[2]] as const;
}

const toLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** WCAG relative luminance. */
function luminance([r, g, b]: Rgb): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio, order-independent. */
function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = luminance(a) > luminance(b) ? [luminance(a), luminance(b)] : [luminance(b), luminance(a)];
  return (hi + 0.05) / (lo + 0.05);
}

const toHex = (c: Rgb): string =>
  `#${c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;

/* ───────────────────────── palette + scheme parsing ───────────────────────── */

/** Every `--color-*` in Tailwind's shipped theme, resolved to sRGB. */
function readPalette(): ReadonlyMap<string, Rgb> {
  // `tailwindcss` is a declared peer dependency and is installed by `npm ci`,
  // so this path is present wherever the suite runs.
  const path = join(HERE, '..', '..', '..', 'node_modules', 'tailwindcss', 'theme.css');
  let css: string;
  try {
    css = readFileSync(path, 'utf8');
  } catch {
    throw new Error(
      `theme contrast guard: could not read Tailwind's palette at ${path}. ` +
        'If Tailwind moved this file, update the path — do not delete the guard.',
    );
  }
  const out = new Map<string, Rgb>();
  const oklch = /--(color-[a-z0-9-]+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = oklch.exec(css)) !== null) {
    out.set(match[1], oklchToSrgb(Number(match[2]) / 100, Number(match[3]), Number(match[4])));
  }
  // `white`, `black` and a few others are plain hex.
  const hex = /--(color-[a-z0-9-]+):\s*#([0-9a-fA-F]{3,6})\b/g;
  while ((match = hex.exec(css)) !== null) {
    const raw =
      match[2].length === 3
        ? match[2]
            .split('')
            .map((c) => c + c)
            .join('')
        : match[2];
    out.set(match[1], [
      parseInt(raw.slice(0, 2), 16) / 255,
      parseInt(raw.slice(2, 4), 16) / 255,
      parseInt(raw.slice(4, 6), 16) / 255,
    ] as const);
  }
  return out;
}

const PALETTE = readPalette();

/** `--custom-property: value;` declarations inside `selector`'s block in `file`. */
function schemeTokens(file: string, selector: string): ReadonlyMap<string, string> {
  const css = readFileSync(join(HERE, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`theme contrast guard: "${selector}" not found in ${file}`);
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
  const out = new Map<string, string>();
  const decl = /^[ \t]*--([a-zA-Z0-9-]+)[ \t]*:[ \t]*([^;]+);/gm;
  let match: RegExpExecArray | null;
  const body = css.slice(open, end);
  while ((match = decl.exec(body)) !== null) out.set(match[1], match[2].trim());
  return out;
}

/** Resolves a token name through the scheme's `var()` chain down to the palette. */
function resolve(tokens: ReadonlyMap<string, string>, name: string, seen = new Set<string>()): Rgb {
  if (seen.has(name)) throw new Error(`theme contrast guard: var() cycle at --${name}`);
  seen.add(name);
  const declared = tokens.get(name);
  if (declared === undefined) {
    const fromPalette = PALETTE.get(name);
    if (!fromPalette) throw new Error(`theme contrast guard: unknown token --${name}`);
    return fromPalette;
  }
  const indirect = /^var\(\s*--([a-zA-Z0-9-]+)\s*\)$/.exec(declared);
  if (indirect) return resolve(tokens, indirect[1], seen);
  const fromPalette = PALETTE.get(name);
  if (fromPalette) return fromPalette;
  throw new Error(`theme contrast guard: cannot resolve --${name} = ${declared}`);
}

/**
 * Every border pairing SC 1.4.11 governs, keyed `"{token} on {background}"`.
 *
 * Two backgrounds, because the tokens are painted on both:
 *   - on `--color-surface` — the alert `outline` variant's boundary, and every
 *     container outline drawn straight onto the page.
 *   - `-border-strong` on the matching `-soft` — the "indicators, rings" tier
 *     sitting on its own soft fill, which is where 73 of the library's uses of
 *     `border-{role}-border-strong` land.
 *
 * `--color-border-muted` is deliberately absent: `_semantic.css` documents it as
 * the purely decorative divider SC 1.4.11 exempts.
 */
function borderRatios(theme: TwResolvedTheme): ReadonlyMap<string, number> {
  const tokens = schemeTokens(...SCHEME_BLOCKS[theme]);
  const surface = resolve(tokens, 'color-surface');
  const out = new Map<string, number>();
  for (const token of ['color-border', 'color-border-strong']) {
    out.set(`${token} on surface`, contrast(resolve(tokens, token), surface));
  }
  for (const role of ROLES) {
    for (const slot of ['border', 'border-strong']) {
      out.set(
        `color-${role}-${slot} on surface`,
        contrast(resolve(tokens, `color-${role}-${slot}`), surface),
      );
    }
    out.set(
      `color-${role}-border-strong on ${role}-soft`,
      contrast(resolve(tokens, `color-${role}-border-strong`), resolve(tokens, `color-${role}-soft`)),
    );
  }
  return out;
}

/* ───────────────────────── tests ───────────────────────── */

describe('theme border contrast (WCAG 2.2 SC 1.4.11)', () => {
  it('reproduces Tailwind v4 palette colours exactly', () => {
    // Guards the guard. Every assertion below is downstream of this conversion,
    // so a subtly wrong matrix would produce plausible-looking numbers and a
    // green suite. These five hexes are Tailwind's own published values.
    expect({
      'blue-500': toHex(PALETTE.get('color-blue-500')!),
      'red-500': toHex(PALETTE.get('color-red-500')!),
      'gray-950': toHex(PALETTE.get('color-gray-950')!),
      'amber-400': toHex(PALETTE.get('color-amber-400')!),
      'blue-950': toHex(PALETTE.get('color-blue-950')!),
    }).toEqual({
      'blue-500': '#2b7fff',
      'red-500': '#fb2c36',
      'gray-950': '#030712',
      'amber-400': '#ffb900',
      'blue-950': '#162456',
    });
  });

  it('resolves a non-trivial number of border tokens in every scheme', () => {
    // A refactor that renamed a slot would otherwise make every assertion below
    // pass on an empty map.
    for (const theme of TW_RESOLVED_THEMES) {
      expect(borderRatios(theme).size, `${theme} resolved no border pairings`).toBe(
        2 + ROLES.length * 3,
      );
    }
  });

  it('clears 3:1 on every border token, except in the schemes listed as known-failing', () => {
    // Two-sided, so the allowance list cannot rot: an unlisted scheme that
    // fails is a regression, and a listed scheme that passes is a stale entry
    // whose deletion is now overdue.
    const failing: string[] = [];
    const staleAllowances: TwResolvedTheme[] = [];

    for (const theme of TW_RESOLVED_THEMES) {
      const below = [...borderRatios(theme)]
        .filter(([, ratio]) => ratio < NON_TEXT_FLOOR)
        .map(([token, ratio]) => `${theme}: --${token} = ${ratio.toFixed(2)}:1`);

      if (KNOWN_FAILING.has(theme)) {
        if (below.length === 0) staleAllowances.push(theme);
      } else {
        failing.push(...below);
      }
    }

    expect(
      { failing, staleAllowances },
      'A border token below 3:1 fails SC 1.4.11 and axe cannot see it — its ' +
        '`color-contrast` rule tests text only. A stale allowance means the ' +
        'scheme was fixed; delete its KNOWN_FAILING entry.',
    ).toEqual({ failing: [], staleAllowances: [] });
  });

  it('keeps each `-border` visually distinct from its `-border-strong`', () => {
    // The two tiers exist to be told apart: `-border` is the outline-variant
    // boundary, `-border-strong` the indicator/ring. Raising `-border` to clear
    // SC 1.4.11 must not collapse it onto its stronger sibling.
    const collapsed: string[] = [];
    for (const theme of TW_RESOLVED_THEMES) {
      const tokens = schemeTokens(...SCHEME_BLOCKS[theme]);
      for (const role of ROLES) {
        const subtle = toHex(resolve(tokens, `color-${role}-border`));
        const strong = toHex(resolve(tokens, `color-${role}-border-strong`));
        if (subtle === strong) collapsed.push(`${theme}: ${role}-border === ${role}-border-strong (${subtle})`);
      }
    }
    expect(collapsed, 'these roles lost the distinction between the two border tiers').toEqual([]);
  });
});

/* ─────────────── the same floor, applied to COMPONENT source ─────────────── */

/**
 * Where the tokens are asserted above, this asserts what components actually
 * *use*.
 *
 * **Why a second guard was needed.** The block above proves every
 * `--color-{role}-border{,-strong}` clears 3:1. It says nothing about a
 * component that writes `border-primary-300`, which resolves through
 * `--color-primary-300` and bypasses the slot entirely. That gap was not
 * hypothetical: it hid **14 of 28** raw-scale utilities below the floor across
 * ~20 components — `badge`'s outline at 1.40–1.92, focus rings at 2.15–2.71 —
 * for the entire life of the library, while every sweep the audit register ran
 * reported "no raw Tailwind palette colours in shipped source". That claim was
 * true and irrelevant: it rules out `blue-500`, not `primary-300`.
 *
 * Pass 9 fixed all of them. This is what stops the next component reintroducing
 * one, so the fix is an invariant rather than a snapshot.
 *
 * **It measures rather than pattern-matches.** A lint rule banning the syntax
 * would also reject `outline-primary-500` — the canonical focus ring CLAUDE.md
 * documents verbatim, which passes comfortably. The rule that matters is the
 * contrast floor, so that is what is asserted, in every scheme.
 *
 * **Two known blind spots, stated so nobody mistakes green here for
 * completeness.**
 *
 * 1. *Background.* This resolves each utility against its scheme's
 *    `--color-surface`, because that is where the overwhelming majority are
 *    painted. A utility on a *coloured* background is not covered, and the
 *    assumption is not always conservative: `switch`'s error ring sits on
 *    `bg-error-100` and measured **1.57** there versus 1.92 against white —
 *    worse, not better.
 * 2. *Property.* The regex covers `border|ring|outline|divide` only, so a
 *    **fill** is not scanned. That matters: `--color-warning-solid` measures
 *    **2.15:1 against surface in `light` and 1.72:1 in `high-contrast`**, and
 *    every component painting a solid warning fill — alert, badge, button,
 *    stepper, timeline, toast — inherits it. Nothing asserts that pairing:
 *    `borderRatios()` covers the border tiers, and `p6-contrast.mjs` covers
 *    `solid-fg` on `solid` (the text ON the fill) but never the fill against
 *    the page. That is how a 1.72 survived in the high-contrast scheme. Left
 *    unfixed deliberately — see the register's pass 11 entry.
 */
const COMPONENT_SRC = join(HERE, '..');

/** `{utility}-{role}-{step}` occurrences in shipped component source. */
function rawScaleUses(): ReadonlyMap<string, ReadonlySet<string>> {
  const out = new Map<string, Set<string>>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') walk(full);
        continue;
      }
      // Specs and this file are not shipped; `.d.ts` carries no classes.
      if (!/\.(ts|html)$/.test(entry.name)) continue;
      if (/\.spec\.ts$|\.d\.ts$/.test(entry.name)) continue;
      const src = readFileSync(full, 'utf8');
      const re =
        /\b(?:border|ring|outline|divide)-(primary|secondary|accent|neutral|info|success|warning|error)-(50|100|200|300|400|500|600|700|800|900|950)\b/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        const key = `${m[1]}-${m[2]}`;
        if (!out.has(key)) out.set(key, new Set());
        out.get(key)!.add(full.slice(COMPONENT_SRC.length + 1));
      }
    }
  };
  walk(COMPONENT_SRC);
  return out;
}

/**
 * Raw-scale utilities allowed to sit below the floor, with the reason.
 *
 * Two-sided like `KNOWN_FAILING`: an entry that stops failing is reported as
 * stale and must be deleted, so this cannot rot into permission.
 */
const RAW_SCALE_BACKLOG: ReadonlyMap<string, string> = new Map<string, string>([
  // Empty. `warning-500` lived here for one commit — checkbox, radio and
  // paginator painted a boundary the same colour as their fill, and
  // `--color-warning-solid` IS `amber-500` because dark-on-yellow is what makes
  // its glyph pass AA. The fix was to leave the fill and give those three a
  // `-border-strong` boundary; this list then reported the entry as STALE
  // without being asked, which is the whole point of it being two-sided.
]);

/**
 * Walked ONCE, at module scope, and shared by both tests below.
 *
 * Not a micro-optimisation — a correctness fix for a flake this guard shipped
 * with. Calling `rawScaleUses()` inside each `it()` read ~400 files
 * synchronously, twice, and under full-suite contention that exceeded Vitest's
 * **5000ms per-test budget**: `Error: Test timed out in 5000ms`, measured at
 * 19363ms, reproducing roughly 1 run in 3 while passing every time the theme
 * specs ran alone. Module-scope evaluation is not governed by that budget, is
 * the pattern `PALETTE` above already uses in this same file, and halves the
 * I/O. A guard whose specs hang is worse than no guard.
 */
const RAW_SCALE_USES = rawScaleUses();

describe('component raw-scale border contrast (WCAG 2.2 SC 1.4.11)', () => {
  it('finds a non-trivial number of raw-scale utilities to check', () => {
    // Guards the guard: a regex that stopped matching would make the assertion
    // below pass on an empty map.
    expect(RAW_SCALE_USES.size).toBeGreaterThan(3);
  });

  it('clears 3:1 on every raw-scale border/ring/outline in shipped source', () => {
    const failing: string[] = [];
    const seen = new Set<string>();
    const uses = RAW_SCALE_USES;

    // Parsed once per scheme rather than once per (utility x scheme): the inner
    // form re-read and re-parsed four CSS files on every iteration.
    const perTheme = TW_RESOLVED_THEMES.map(
      (theme) => [theme, schemeTokens(...SCHEME_BLOCKS[theme])] as const,
    );

    for (const [key, files] of uses) {
      const [role, step] = key.split('-');
      for (const [theme, tokens] of perTheme) {
        const ratio = contrast(
          resolve(tokens, `color-${role}-${step}`),
          resolve(tokens, 'color-surface'),
        );
        if (ratio >= NON_TEXT_FLOOR) continue;
        if (RAW_SCALE_BACKLOG.has(key)) {
          seen.add(key);
          continue;
        }
        failing.push(
          `${theme}: ${key} = ${ratio.toFixed(2)}:1 (${[...files].sort().join(', ')})`,
        );
      }
    }

    const stale = [...RAW_SCALE_BACKLOG.keys()].filter(
      (k) => !seen.has(k) || !uses.has(k),
    );

    expect(
      { failing, stale },
      'A component naming a palette step bypasses the token guard above — that is how 14 of 28 ' +
        'such utilities shipped below the floor. Use the `{role}-border` / `-border-strong` slot ' +
        'instead. A stale entry means the use was fixed or removed; delete it.',
    ).toEqual({ failing: [], stale: [] });
  });
});
