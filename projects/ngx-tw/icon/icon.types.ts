import type { TwColor } from 'ngx-tw/core';

/** A single SVG element: [tagName, attributes]. */
export type TwIconNode = readonly [string, Readonly<Record<string, string | number>>];

/** Icon data: array of SVG child elements rendered inside the `<svg>` wrapper. */
export type TwIconData = readonly TwIconNode[];

/** Map of PascalCase icon names to their SVG data. */
export type TwIconMap = Record<string, TwIconData>;

/** Color options for the icon component: any semantic color plus `'current'` for color inheritance. */
export type TwIconColor = TwColor | 'current';
