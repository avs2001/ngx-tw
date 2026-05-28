import { InjectionToken, type Signal } from '@angular/core';

/**
 * Read-only view of a sortable region's state.
 *
 * Components that render column headers (e.g., `<tw-table>`) consume this handle to
 * project `aria-sort` onto the active column without taking a hard dependency on the
 * sort implementation. The canonical provider is `SortDirective` (`[twSort]`).
 */
export interface TwSortHandle {
  /** Signal of the id of the currently active sort header, or `null` when no sort is active. */
  readonly active: Signal<string | null>;
  /** Signal of the active sort direction (`'asc'` / `'desc'`), or `null` when cleared. */
  readonly direction: Signal<'asc' | 'desc' | null>;
}

/**
 * DI token through which sort containers expose their state to consumers. Provided by
 * `SortDirective` (`[twSort]`). Inject with `{ optional: true }` — components that need
 * aria-sort plumbing should degrade gracefully when no sort directive is present.
 */
export const TW_SORT_HANDLE = new InjectionToken<TwSortHandle>('TwSortHandle');
