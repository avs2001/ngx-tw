import { Directive, input } from '@angular/core';
import type { ResolvedTheme } from './theme.types';

@Directive({
  selector: '[twTheme]',
  host: {
    '[attr.data-theme]': 'twTheme()',
  },
})
export class ThemeDirective {
  /** Scopes a subtree to a specific resolved theme by writing `data-theme` on the host. Required. */
  readonly twTheme = input.required<ResolvedTheme>();
}
