import { Injectable } from '@angular/core';
import type { TwIconData, TwIconMap } from './icon.types';

/**
 * Stores icon data (SVG element tuples) for use by `tw-icon`.
 *
 * Not provided in root — use `provideTwIcons()` or `provideTwLucideIcons()`
 * to register icons and supply this service.
 */
@Injectable()
export class IconRegistry {
  private readonly icons: TwIconMap = {};

  /** Merges the given icons into the registry. */
  register(icons: TwIconMap): void {
    Object.assign(this.icons, icons);
  }

  /** Returns the icon data for the given PascalCase name, or `null` if not registered. */
  get(name: string): TwIconData | null {
    return this.icons[name] ?? null;
  }
}
