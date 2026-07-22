// Theme-token extraction for the MCP index.
//
// Scraped from the `@theme` blocks in `theme/_semantic.css` and
// `theme/_typography.css` rather than hand-listed, because this is the one
// content layer with a machine source of truth. Its job is to stop a model
// inventing `bg-brand-500` or `text-[11px]` when only `bg-primary-500` and
// `text-2xs` exist.

import { readFileSync } from 'node:fs';

/** Tailwind v4 derives utility prefixes from the token namespace. */
const NAMESPACES = [
  { prefix: '--color-', kind: 'color', utilities: ['bg-', 'text-', 'border-', 'ring-', 'fill-'] },
  { prefix: '--text-', kind: 'typography', utilities: ['text-'] },
  { prefix: '--font-', kind: 'font', utilities: ['font-'] },
  { prefix: '--duration-', kind: 'duration', utilities: ['duration-'] },
  { prefix: '--shadow-', kind: 'shadow', utilities: ['shadow-'] },
  { prefix: '--width-', kind: 'width', utilities: ['w-', 'max-w-', 'min-w-'] },
];

/** Strip comments so a commented-out token never lands in the index. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Group a semantic token name into a role bucket for `list_theme_tokens`. */
function groupOf(name) {
  if (/^(surface|overlay-control)/.test(name)) return 'surface';
  if (/^fg/.test(name)) return 'foreground';
  if (/^border/.test(name)) return 'border';
  const role = name.match(/^(primary|secondary|accent|neutral|info|success|warning|error)\b/);
  return role ? 'semantic-color' : 'other';
}

/**
 * Read every custom property declared in the `@theme` blocks of the given CSS
 * files. Only `@theme` declarations become Tailwind utilities, so the
 * per-theme override blocks in `_dark.css` are deliberately not scraped — they
 * restate the same token names with different values.
 */
export function extractThemeTokens(files) {
  const tokens = [];
  const seen = new Set();

  for (const file of files) {
    const css = stripComments(readFileSync(file, 'utf8'));

    for (const block of css.matchAll(/@theme\s*\{([\s\S]*?)\n\}/g)) {
      for (const decl of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
        const [, property, rawValue] = decl;
        const ns = NAMESPACES.find((n) => property.startsWith(n.prefix));
        if (!ns || seen.has(property)) continue;
        // `--text-2xs--line-height` is a modifier on `--text-2xs`, not a token.
        if (property.slice(ns.prefix.length).includes('--')) continue;
        seen.add(property);

        const name = property.slice(ns.prefix.length);
        tokens.push({
          token: name,
          property,
          kind: ns.kind,
          group: ns.kind === 'color' ? groupOf(name) : ns.kind,
          value: rawValue.trim().replace(/\s+/g, ' '),
          utilities: ns.utilities.map((u) => `${u}${name}`),
        });
      }
    }
  }

  return tokens;
}
