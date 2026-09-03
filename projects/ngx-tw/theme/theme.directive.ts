import { Directive, input } from '@angular/core';
import type { TwResolvedTheme } from './theme.types';

@Directive({
  selector: '[twTheme]',
  host: {
    '[attr.data-theme]': 'twTheme()',
  },
})
export class ThemeDirective {
  /**
   * Scopes a subtree to a specific resolved theme by writing `data-theme` on
   * the host. Required.
   *
   * Works in every direction: each of the four schemes ships an
   * element-agnostic `[data-theme="…"]` block (`_light.css`, `_dark.css`,
   * `_high-contrast.css`, `_high-contrast-dark.css`), so a `'light'` pane
   * inside a dark page re-resolves the tokens rather than inheriting the
   * ancestor's.
   *
   * The attribute name is the literal `data-theme` that the shipped CSS keys
   * off — it deliberately ignores `provideTheme({ attribute })`, since a
   * renamed attribute matches none of those blocks.
   */
  readonly twTheme = input.required<TwResolvedTheme>();
}
