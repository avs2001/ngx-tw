import { Directive, inject } from '@angular/core';
import { POPOVER_REF } from './popover-tokens';

/**
 * Convenience directive that closes the enclosing popover when the host element is clicked.
 * Place on any element inside popover content.
 *
 * ```html
 * <button twPopoverClose>Cancel</button>
 * ```
 */
@Directive({
  selector: '[twPopoverClose]',
  host: {
    '(click)': 'closePopover()',
    '[attr.type]': '"button"',
  },
})
export class PopoverCloseDirective {
  private readonly popoverRef = inject(POPOVER_REF, { optional: true });

  protected closePopover(): void {
    this.popoverRef?.close();
  }
}
