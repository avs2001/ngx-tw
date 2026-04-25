import { Directive } from '@angular/core';

/**
 * Marker directive for a custom gutter projection slot.
 * Attach to content inside `<tw-split>` to provide custom gutter visuals.
 * The container still owns all interaction logic.
 */
@Directive({
  selector: '[twSplitGutter]',
})
export class TwSplitGutter {}
