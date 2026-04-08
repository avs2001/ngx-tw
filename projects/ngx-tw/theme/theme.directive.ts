import { Directive, input } from '@angular/core';
import type { ResolvedTheme } from './theme.types';

@Directive({
  selector: '[twTheme]',
  host: {
    '[attr.data-theme]': 'twTheme()',
  },
})
export class ThemeDirective {
  readonly twTheme = input.required<ResolvedTheme>();
}
