import type { OverlayRef } from '@angular/cdk/overlay';
import { filter } from 'rxjs/operators';

/**
 * Subscribes to overlay-level `Escape` keydown events and invokes `onEscape`
 * for each one. Returns an unsubscribe function so callers can scope teardown
 * to the open lifecycle of the overlay (typically tied into a `Subscription`
 * aggregate or a `takeUntilDestroyed` flow).
 *
 * Listens via `OverlayRef.keydownEvents()` so the handler fires for any
 * keystroke originating inside the overlay, regardless of which element holds
 * DOM focus — useful for select-style overlays whose search/listbox children
 * may receive focus apart from the trigger.
 *
 * Callers remain responsible for calling `event.preventDefault()` /
 * `stopPropagation()` inside `onEscape` if they want to short-circuit further
 * key handling.
 */
export function consumeOverlayEscape(
  overlayRef: OverlayRef,
  onEscape: (event: KeyboardEvent) => void,
): () => void {
  const subscription = overlayRef
    .keydownEvents()
    .pipe(filter((event) => event.key === 'Escape'))
    .subscribe((event) => onEscape(event));
  return () => subscription.unsubscribe();
}
