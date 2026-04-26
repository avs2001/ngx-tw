import { Directive } from '@angular/core';

/**
 * Marker directive for an optional header region inside `<tw-split-pane>`.
 * A parent Dock or Panel component may key off this region; the split pane
 * itself does not apply any styling to it.
 */
@Directive({
  selector: '[twSplitPaneHeader]',
})
export class TwSplitPaneHeader {}
