import type { ConnectedPosition } from '@angular/cdk/overlay';

/**
 * Connected-overlay position list for "select-like" overlays — overlays whose
 * panel attaches directly under (or above) a trigger element and falls back to
 * the opposite vertical side when there is not enough room. Returns four
 * fallback positions: below-start, below-end, above-start, above-end.
 *
 * Used by `SelectComponent`, `ComboboxComponent`, `DatePickerComponent`, and
 * `DateRangePickerComponent` — any overlay-bearing form control that anchors
 * a listbox / menu / calendar panel to its trigger. The shape is identical for
 * all four; the historical "select-like" name refers to the original consumer.
 *
 * @param offset Vertical offset in pixels applied between the trigger edge and
 *   the panel edge. Below-positions use `+offset`; above-positions use
 *   `-offset` so the panel pulls away from the trigger consistently.
 */
export function buildSelectLikePositions(offset = 0): ConnectedPosition[] {
  return [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: offset },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: offset },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -offset },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -offset },
  ];
}
