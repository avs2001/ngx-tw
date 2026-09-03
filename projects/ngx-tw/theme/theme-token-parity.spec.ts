/* eslint-disable @typescript-eslint/triple-slash-reference -- the referenced
   file declares ambient Node modules (see its header); an `import` of it would
   have to resolve at runtime, and it emits no JavaScript. */
/// <reference path="./theme-node-shims.d.ts" />

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TW_RESOLVED_THEMES } from './theme.types';

/**
 * Drift guard for the theme's five hand-duplicated token blocks.
 *
 * `_semantic.css` defines the canonical token set inside Tailwind's `@theme`,
 * which compiles to `:root, :host`. A `<div data-theme="…">` matches neither,
 * so every scheme additionally ships an element-agnostic `[data-theme=…]`
 * block, and dark ships a second copy under `@media (prefers-color-scheme:
 * dark)` because CSS cannot apply one rule body through both a selector and a
 * media query. Four schemes plus that duplicate leaves five blocks that must
 * be edited in lock-step:
 *
 *   1. `_light.css`              → `[data-theme="light"]`
 *   2. `_dark.css`               → `[data-theme="dark"]`
 *   3. `_dark.css`               → `@media (prefers-color-scheme: dark)`
 *   4. `_high-contrast.css`      → `[data-theme="high-contrast"]`
 *   5. `_high-contrast-dark.css` → `[data-theme="high-contrast-dark"]`
 *
 * Three of those files say in prose "keep these in lock-step" and nothing
 * enforced it. A token added to one block and forgotten in another does not
 * error, does not warn, and does not fail any existing test — it renders as
 * the *other* scheme's value inside the drifted subtree, which is exactly the
 * class of bug the element-agnostic blocks were introduced to remove.
 *
 * The check is text-based on purpose: evaluating the CSS would need a
 * PostCSS/Tailwind pipeline in a unit test, and the invariant being guarded is
 * a source-level one (what the files declare), not a computed-value one.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

/** Strips CSS block comments so a commented-out declaration never counts. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Every `--custom-property: value;` declaration in `segment`, in source order. */
function declarations(segment: string): readonly (readonly [string, string])[] {
  const pattern = /^[ \t]*(--[a-zA-Z0-9-]+)[ \t]*:[ \t]*([^;]+);/gm;
  const out: (readonly [string, string])[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(segment)) !== null) {
    out.push([match[1], match[2].trim().replace(/\s+/g, ' ')] as const);
  }
  return out;
}

/**
 * Reads `file` and returns the declarations between `from` and `to` (end of
 * file when `to` is absent).
 *
 * Throws rather than asserting because this runs at module scope, where a
 * failed `expect()` is not attributable to any test. A throw here surfaces as
 * a collection error, which fails the run just as loudly.
 */
function block(file: string, from: string, to?: string): readonly (readonly [string, string])[] {
  const css = stripComments(readFileSync(join(HERE, file), 'utf8'));
  const start = css.indexOf(from);
  if (start < 0) throw new Error(`theme parity guard: "${from}" not found in ${file}`);
  const end = to === undefined ? css.length : css.indexOf(to, start);
  if (to !== undefined && end < 0) {
    throw new Error(`theme parity guard: "${to}" not found after "${from}" in ${file}`);
  }
  return declarations(css.slice(start, end));
}

const SEMANTIC = block('_semantic.css', '@theme');
const LIGHT = block('_light.css', '[data-theme="light"]');
const DARK_EXPLICIT = block('_dark.css', '[data-theme="dark"]', '@media (prefers-color-scheme: dark)');
const DARK_MEDIA = block('_dark.css', '@media (prefers-color-scheme: dark)');
const HIGH_CONTRAST = block(
  '_high-contrast.css',
  '[data-theme="high-contrast"]',
  '@media (forced-colors: active)',
);
const HIGH_CONTRAST_DARK = block('_high-contrast-dark.css', '[data-theme="high-contrast-dark"]');
const FORCED_COLORS = block('_high-contrast.css', '@media (forced-colors: active)');

const BLOCKS = [
  ['_light.css [data-theme="light"]', LIGHT],
  ['_dark.css [data-theme="dark"]', DARK_EXPLICIT],
  ['_dark.css @media (prefers-color-scheme: dark)', DARK_MEDIA],
  ['_high-contrast.css [data-theme="high-contrast"]', HIGH_CONTRAST],
  ['_high-contrast-dark.css [data-theme="high-contrast-dark"]', HIGH_CONTRAST_DARK],
] as const;

const keysOf = (b: readonly (readonly [string, string])[]): string[] => b.map(([k]) => k);

describe('theme token parity', () => {
  it('finds a non-trivial number of declarations in every scheme block', () => {
    // Guards the guard: a refactor that moved a selector would otherwise make
    // every comparison below trivially pass on two empty arrays.
    for (const [name, b] of BLOCKS) {
      expect(b.length, `${name} parsed as empty`).toBeGreaterThan(100);
    }
  });

  it('declares no token twice within a single block', () => {
    for (const [name, b] of BLOCKS) {
      const keys = keysOf(b);
      const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
      expect(duplicates, `${name} declares these tokens more than once`).toEqual([]);
    }
  });

  it('declares the same token set in every scheme block', () => {
    const expected = [...new Set(keysOf(LIGHT))].sort();
    for (const [name, b] of BLOCKS) {
      const actual = [...new Set(keysOf(b))].sort();
      const missing = expected.filter((k) => !actual.includes(k));
      const extra = actual.filter((k) => !expected.includes(k));
      expect(
        { missing, extra },
        `${name} has drifted from _light.css's token set`,
      ).toEqual({ missing: [], extra: [] });
    }
  });

  it("keeps _semantic.css's @theme in lock-step with _light.css", () => {
    // The sixth duplicated block, and the one the header above does not count.
    // `@theme` compiles to `:root, :host`, so it IS the light scheme for every
    // consumer who never sets `data-theme` — the default rendering path. Its
    // colour tokens are hand-copied into `[data-theme="light"]` and nothing
    // checked that the copies agreed: a value raised in one and forgotten in
    // the other renders differently depending on whether an ancestor happens
    // to carry the attribute, which no test, lint or screenshot would catch.
    //
    // Not folded into BLOCKS above, because `@theme` legitimately carries a
    // few tokens no scheme block redefines (`--shadow-table-sticky*`,
    // `--text-2xs*`, `--color-overlay-control*`). So this asserts the weaker
    // true thing: every token `[data-theme="light"]` declares must exist in
    // `@theme` with an identical value.
    const semantic = new Map(SEMANTIC);
    const missing: string[] = [];
    const differing: string[] = [];
    for (const [token, value] of LIGHT) {
      if (!semantic.has(token)) missing.push(token);
      else if (semantic.get(token) !== value) {
        differing.push(`${token}: @theme=${semantic.get(token)} light=${value}`);
      }
    }
    expect(
      { missing, differing },
      '_semantic.css @theme and _light.css [data-theme="light"] have drifted',
    ).toEqual({ missing: [], differing: [] });
  });

  it("keeps _dark.css's two blocks byte-identical, values included", () => {
    // These two are literal copies of one another — unlike the four scheme
    // blocks, whose *values* are supposed to differ. `_dark.css` says "Keep
    // the two blocks in lock-step"; this is that sentence, enforced.
    expect(DARK_MEDIA).toEqual(DARK_EXPLICIT);
  });

  it("excludes every explicitly-tagged scheme from _dark.css's media branch", () => {
    // `:root:not(…)` in that branch is specificity 0,4,0 while each scheme's
    // own block is a bare `[data-theme=…]` at 0,1,0. So on a dark-preferring
    // OS the media branch outranks every other scheme regardless of import
    // order, and a scheme missing from the `:not()` list silently renders as
    // plain dark on exactly the machines it exists for. Source order cannot
    // fix a specificity loss, which is why this is checked and not just
    // written down.
    const css = stripComments(readFileSync(join(HERE, '_dark.css'), 'utf8'));
    const start = css.indexOf('@media (prefers-color-scheme: dark)');
    const selector = css.slice(start, css.indexOf('{', css.indexOf('{', start) + 1));
    const excluded = [...selector.matchAll(/:not\(\s*\[data-theme="([a-z-]+)"\]\s*\)/g)].map(
      (m) => m[1],
    );
    const missing = TW_RESOLVED_THEMES.filter((t) => t !== 'dark' && !excluded.includes(t));
    expect(
      missing,
      "_dark.css's prefers-color-scheme branch does not opt these schemes out, so they lose to it",
    ).toEqual([]);
  });

  it('lists every resolved scheme in the forced-colors remap', () => {
    // Same specificity story from the other side: the remap's selector list
    // names each scheme at 0,1,0, the identical specificity as that scheme's
    // own block, so the tie is broken by source order alone (hence
    // `_high-contrast.css` importing last). A scheme absent from this list
    // keeps its author colors under Windows High Contrast while the others
    // yield to the system palette.
    const css = stripComments(readFileSync(join(HERE, '_high-contrast.css'), 'utf8'));
    const start = css.indexOf('@media (forced-colors: active)');
    const selector = css.slice(start, css.indexOf('{', css.indexOf('{', start) + 1));
    const listed = [...selector.matchAll(/\[data-theme="([a-z-]+)"\]/g)].map((m) => m[1]);
    const missing = TW_RESOLVED_THEMES.filter((t) => !listed.includes(t));
    expect(
      missing,
      '@media (forced-colors: active) omits these schemes, so they keep author colors under Windows HCM',
    ).toEqual([]);
  });

  it('remaps only tokens the schemes actually declare in the forced-colors block', () => {
    const declared = new Set(keysOf(LIGHT));
    const unknown = keysOf(FORCED_COLORS).filter((k) => !declared.has(k));
    expect(unknown, '@media (forced-colors: active) remaps tokens no scheme defines').toEqual([]);
  });

  it("keeps _light.css's stated declaration count true", () => {
    // The header comment names the number out loud ("The N declarations
    // below…"). Reading it back rather than hard-coding one means adding a
    // token to all four blocks fails here until the prose is updated too,
    // instead of leaving a quietly wrong comment behind.
    const header = readFileSync(join(HERE, '_light.css'), 'utf8');
    const claim = /The (\d+) declarations below/.exec(header);
    expect(claim, '_light.css no longer states its declaration count').not.toBeNull();
    expect(Number(claim?.[1])).toBe(LIGHT.length);
  });
});
