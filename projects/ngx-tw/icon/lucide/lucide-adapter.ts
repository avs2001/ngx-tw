import type { Provider } from '@angular/core';
import { provideTwIcons } from '@cdevhub/ngx-tw/icon';
import type { TwIconData } from '@cdevhub/ngx-tw/icon';

/**
 * A single Lucide SVG element: `[tagName, attributes]`.
 *
 * Declared structurally rather than imported from a Lucide package on purpose.
 * An `import type … from 'lucide'` here would be emitted into the published
 * `.d.ts`, making a package this library does not depend on a hard requirement
 * for anyone who merely *type-checks* against this entry point. Declaring the
 * shape locally keeps the entry point dependency-free and lets it accept icons
 * from `lucide`, `lucide-angular`, or any other source with the same shape.
 */
export type LucideIconNode = readonly [
  tag: string,
  // `undefined` is included because that is how Lucide declares its own
  // `SVGProps` (`Record<string, string | number | undefined>`). Narrowing it
  // to `string | number` makes real Lucide icons fail to assign — the demo
  // build catches this immediately, the unit tests do not.
  attrs: Record<string, string | number | undefined>,
];

/** Icon data as Lucide emits it: the SVG child elements, without the `<svg>` wrapper. */
export type LucideIconData = readonly LucideIconNode[];

/** A map of PascalCase icon names to Lucide icon data, as produced by `import { Star } from 'lucide'`. */
export type LucideIcons = Readonly<Record<string, LucideIconData>>;

/**
 * Converts a single Lucide icon to the generic `TwIconData` format.
 *
 * Lucide's icon data is structurally identical to `TwIconData`.
 * This function exists for type-level conversion and explicit intent.
 */
export function fromLucideIcon(icon: LucideIconData): TwIconData {
  return icon as unknown as TwIconData;
}

/**
 * Registers Lucide icons for use with `tw-icon`.
 *
 * Drop-in replacement for `provideTwIcons` that accepts Lucide icon imports directly.
 *
 * @example
 * ```ts
 * import { provideTwLucideIcons } from '@cdevhub/ngx-tw/icon/lucide';
 * import { ChevronRight, Star, Check } from 'lucide';
 *
 * export const appConfig = {
 *   providers: [provideTwLucideIcons({ ChevronRight, Star, Check })]
 * };
 * ```
 */
export function provideTwLucideIcons(icons: LucideIcons): Provider[] {
  return provideTwIcons(icons as unknown as Record<string, TwIconData>);
}
