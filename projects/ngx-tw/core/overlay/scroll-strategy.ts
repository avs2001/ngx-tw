import type { Overlay, ScrollStrategy } from '@angular/cdk/overlay';

/** Named scroll-strategy variants supported by select-like overlays. */
export type SelectScrollStrategyName = 'reposition' | 'close' | 'block';

/**
 * Maps a named scroll-strategy variant to the corresponding CDK
 * `ScrollStrategy` instance. `'reposition'` is the default for select-like
 * overlays; `'close'` dismisses the panel on scroll; `'block'` locks page
 * scrolling while the panel is open.
 *
 * Used by `SelectComponent`, `ComboboxComponent`, `DatePickerComponent`, and
 * `DateRangePickerComponent` — any overlay-bearing form control that exposes
 * the same three-option scroll-strategy input.
 */
export function resolveSelectScrollStrategy(
  name: SelectScrollStrategyName,
  overlay: Overlay,
): ScrollStrategy {
  switch (name) {
    case 'close':
      return overlay.scrollStrategies.close();
    case 'block':
      return overlay.scrollStrategies.block();
    default:
      return overlay.scrollStrategies.reposition();
  }
}
