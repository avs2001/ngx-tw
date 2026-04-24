import type { Provider } from '@angular/core';
import type { LucideIconData, LucideIcons } from 'lucide-angular';
import { provideTwIcons } from 'ngx-tw/icon';
import type { TwIconData } from 'ngx-tw/icon';

/**
 * Converts a single Lucide icon to the generic `TwIconData` format.
 *
 * Lucide's `LucideIconData` is structurally identical to `TwIconData`.
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
 * import { provideTwLucideIcons } from 'ngx-tw/icon/lucide';
 * import { ChevronRight, Star, Check } from 'lucide-angular';
 *
 * export const appConfig = {
 *   providers: [provideTwLucideIcons({ ChevronRight, Star, Check })]
 * };
 * ```
 */
export function provideTwLucideIcons(icons: LucideIcons): Provider[] {
  return provideTwIcons(icons as unknown as Record<string, TwIconData>);
}
