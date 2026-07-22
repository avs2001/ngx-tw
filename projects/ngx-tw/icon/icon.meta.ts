import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Renders an SVG glyph from a bring-your-own registry — there is no bundled icon set, so names must first be registered with `provideTwIcons()` (raw SVG data) or `provideTwLucideIcons()` (Lucide adapter) — on a consistent size scale with semantic color variants.',
  whenToUse: [
    'Any inline glyph inside a button, alert, list row, menu entry, or table cell',
    'After registering the specific glyphs the app uses, so only those end up in the bundle — never assume an icon name resolves without a matching provider entry',
    'Icons that should inherit surrounding text color via `currentColor`, or take an explicit semantic color that follows the theme',
    'Decorative glyphs that must stay `aria-hidden`, or meaningful ones that need an `ariaLabel`',
    'Non-24x24 or differently-stroked SVG sources, via the `svg` config (`strokeWidth`, `absoluteStrokeWidth`, `viewBox`)',
  ],
  related: ['button', 'alert', 'avatar', 'badge', 'empty-state'],
  aliases: [
    'svg',
    'glyph',
    'symbol',
    'pictogram',
    'lucide',
    'iconography',
    'icon registry',
    'provideTwIcons',
    'provideTwLucideIcons',
    'material icon',
  ],
} satisfies ComponentMeta;
