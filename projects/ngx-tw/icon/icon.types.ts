import type { TwColor } from 'ngx-tw/core';

/** A single SVG element: [tagName, attributes]. */
export type TwIconNode = readonly [string, Readonly<Record<string, string | number>>];

/** Icon data: array of SVG child elements rendered inside the `<svg>` wrapper. */
export type TwIconData = readonly TwIconNode[];

/** Map of PascalCase icon names to their SVG data. */
export type TwIconMap = Record<string, TwIconData>;

/** Color options for the icon component: any semantic color plus `'current'` for color inheritance. */
export type TwIconColor = TwColor | 'current';

/**
 * SVG-author configuration grouped into a single input to keep the icon's
 * top-level surface small. All fields are optional; unset fields fall back to
 * sensible defaults (`strokeWidth: 2`, `absoluteStrokeWidth: false`,
 * `viewBox: '0 0 24 24'`).
 */
export interface TwIconSvgConfig {
  /** SVG stroke width. Defaults to `2`. */
  readonly strokeWidth?: number;
  /** When true, stroke width scales inversely with icon size to maintain consistent visual weight. Defaults to `false`. */
  readonly absoluteStrokeWidth?: boolean;
  /** SVG viewBox attribute. Defaults to `'0 0 24 24'`. */
  readonly viewBox?: string;
}
