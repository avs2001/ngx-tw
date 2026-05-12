import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormResetEvent, NgControl } from '@angular/forms';

/**
 * Subscribes to the host's `NgControl` and invokes `onReset` whenever the bound
 * control receives a `FormResetEvent` — i.e. the consumer called `control.reset()`,
 * `formGroup.reset()`, or set the value back to its initial state through a
 * `[(ngModel)]` reset. Use this from a form-control component's constructor to
 * clear internal draft/UI state without coupling to a specific forms strategy
 * (template-driven, reactive, and signal-based forms all funnel through here).
 *
 * Constraints:
 * - Must be called inside an injection context (constructor or factory).
 * - Resolves `NgControl` with `{ self: true, optional: true }`; if the host is
 *   not bound to a form control the call is a clean no-op.
 * - Listener teardown is wired to the host's `DestroyRef` automatically.
 */
export function onFormReset(onReset: () => void): void {
  const destroyRef = inject(DestroyRef);
  const ngControl = inject(NgControl, { self: true, optional: true });
  const control = ngControl?.control;
  // Signal Forms' control type does not expose an `events` stream — guard
  // matches calendar.ts's `if (ctrl?.events)` pattern.
  if (!control?.events) return;

  control.events.pipe(takeUntilDestroyed(destroyRef)).subscribe((event) => {
    if (event instanceof FormResetEvent) onReset();
  });
}
