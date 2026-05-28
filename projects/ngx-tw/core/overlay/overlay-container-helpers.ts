/**
 * Pure helpers shared by `DialogContainer` and `SheetContainer` (both live
 * under `projects/ngx-tw/{dialog,sheet}/`) — and consumable by any future
 * `CdkDialogContainer` subclass that needs the same plumbing.
 *
 * No DOM, no Angular DI. The DI-bound state lives in
 * {@link OverlayContainerCoordinator}; this file is the data-only layer.
 */

/**
 * Fallback padding (ms) added on top of an enter/exit animation duration when
 * scheduling the `transitionend` fallback timer. The browser SHOULD fire
 * `transitionend` at the configured duration, but transitions can be
 * swallowed (focus changes during the animation, interrupted transitions,
 * etc.) — the padding gives the browser a small grace period before our
 * fallback runs.
 *
 * Both dialog and sheet containers used the same constant — extracted here so
 * a future tweak applies to both at once.
 */
export const OVERLAY_ANIMATION_FALLBACK_PADDING = 50;

/**
 * Coerces a user-supplied animation duration to a safe positive integer, or
 * falls back to a default if the input is `null`, `undefined`, negative, or
 * non-finite (`NaN`, `Infinity`). Dialog and sheet containers both used this
 * same standalone function; centralised here.
 */
export function coerceOverlayDuration(value: number | undefined, fallback: number): number {
  if (value == null || value < 0 || !Number.isFinite(value)) return fallback;
  return value;
}

/**
 * Merges a consumer-supplied `panelClass` (single class, list, or
 * `undefined`) with the container's internal class string. Returns a single
 * space-separated class string suitable for `[class]` host binding.
 *
 * `consumer` always wins ordering (appended after `internal`) so consumer
 * overrides resolve correctly through `tailwind-merge` upstream.
 */
export function mergeOverlayPanelClass(
  internal: string,
  consumer: string | readonly string[] | undefined,
): string {
  if (!consumer) return internal;
  return Array.isArray(consumer) ? [internal, ...consumer].join(' ') : `${internal} ${consumer}`;
}

/**
 * Append-only id list with idempotent insertion, used for the
 * `aria-describedby` queue both `DialogContainer` and `SheetContainer`
 * maintain (the matching `aria-labelledby` queue lives in CDK's
 * `CdkDialogContainer`).
 *
 * Pure data structure — no DOM, no Angular signals. Consumers wrap an
 * instance in their own change-detection mechanism (the
 * {@link OverlayContainerCoordinator} keeps the live snapshot in a signal so
 * the container's `[attr.aria-describedby]` binding refreshes via OnPush
 * without a manual `markForCheck()`).
 *
 * First-registered-wins semantics for `first()` mirror CDK's
 * `_ariaLabelledByQueue[0]` host binding — describing the dialog by the
 * earliest registered description prevents a late-mounted nested directive
 * from silently re-aiming the description target.
 */
export class AriaIdQueue {
  private readonly ids: string[] = [];

  /** Inserts an id at the tail. No-op if the id is already present. */
  add(id: string): void {
    if (this.ids.includes(id)) return;
    this.ids.push(id);
  }

  /** Removes the given id. No-op if the id is not present. */
  remove(id: string): void {
    const index = this.ids.indexOf(id);
    if (index >= 0) this.ids.splice(index, 1);
  }

  /** First registered id (or `null` if empty). Matches CDK's `_ariaLabelledByQueue[0]` semantics. */
  first(): string | null {
    return this.ids[0] ?? null;
  }

  /** Returns a fresh snapshot of all registered ids in insertion order. */
  snapshot(): readonly string[] {
    return [...this.ids];
  }
}
