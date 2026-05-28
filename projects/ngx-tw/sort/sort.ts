import {
  Directive,
  input,
  isDevMode,
  model,
  output,
} from '@angular/core';
import { TW_SORT_HANDLE } from '@cdevhub/ngx-tw/core';

/** Sort direction. `null` represents the cleared (unsorted) state. */
export type SortDirection = 'asc' | 'desc' | null;

/** Shape that `SortHeaderComponent` implements when registering with a parent `SortDirective`. */
export interface TwSortable {
  /** Unique id identifying the column or field this header sorts. */
  readonly id: string;
  /** Header-level starting direction. `undefined` falls back to the parent directive's `start`. */
  readonly start: 'asc' | 'desc' | undefined;
  /** Header-level override for disabling the cleared state in the cycle. `undefined` falls back to the parent directive's `disableClear`. */
  readonly disableClear: boolean | undefined;
  /** Whether this header is disabled. */
  readonly disabled: boolean;
}

/** Payload emitted by `SortDirective.sortChange` whenever a user interaction changes the sort state. */
export interface TwSortEvent {
  /** The new active header id, or `null` when the sort was cleared. */
  active: string | null;
  /** The new sort direction. */
  direction: SortDirection;
  /** Snapshot of the previous state, before this change. */
  previous: {
    /** Previous active header id. */
    active: string | null;
    /** Previous sort direction. */
    direction: SortDirection;
  };
}

/**
 * Returns the direction cycle for a given starting direction and disable-clear flag.
 * @internal Exported for unit tests; not part of the public API.
 */
export function getSortDirectionCycle(
  start: 'asc' | 'desc',
  disableClear: boolean,
): SortDirection[] {
  const cycle: SortDirection[] = start === 'desc' ? ['desc', 'asc'] : ['asc', 'desc'];
  if (!disableClear) cycle.push(null);
  return cycle;
}

/**
 * Container directive that holds the current sort state (`active` id + `direction`) and
 * coordinates with child `SortHeaderComponent` instances. Compose with any rendering layer —
 * tables, lists, custom grids — by placing child headers inside an element marked `[twSort]`.
 *
 * @remarks
 * **`tw*` input/output aliases.** Every `input()` / `output()` / `model()` on this directive
 * carries a `tw*` alias (e.g. `'twSortActive'`, `'twSortDirection'`, `'twSortChange'`). The
 * aliases namespace bindings under the directive selector so they cannot collide with
 * attributes the host element already owns (a `<table>` consumer binding `[active]` would
 * otherwise be ambiguous). This mirrors Angular Material's `mat*` aliasing precedent on
 * `MatSort`. Compodoc surfaces both the field name and the alias; consumer templates MUST
 * bind via the aliased name (`[twSortActive]`, `(twSortChange)`, …). Removing an alias is a
 * breaking API change requiring a major version bump.
 */
@Directive({
  selector: '[twSort]',
  exportAs: 'twSort',
  host: {
    'class': 'tw-sort',
  },
  providers: [{ provide: TW_SORT_HANDLE, useExisting: SortDirective }],
})
export class SortDirective {
  /** The id of the currently sorted header, or `null` when nothing is sorted. Two-way bindable via `[(twSortActive)]`. Defaults to `null`. */
  readonly active = model<string | null>(null, { alias: 'twSortActive' });

  /** Current sort direction. `null` represents the cleared state. Two-way bindable via `[(twSortDirection)]`. Defaults to `null`. */
  readonly direction = model<SortDirection>(null, { alias: 'twSortDirection' });

  /** Starting direction used when a header becomes active for the first time. Per-header `start` overrides this. Defaults to `'asc'`. */
  readonly start = input<'asc' | 'desc'>('asc', { alias: 'twSortStart' });

  /** When true, the direction cycle skips the cleared (`null`) state — headers toggle between `'asc'` and `'desc'` only. Per-header `disableClear` overrides this. Defaults to `false`. */
  readonly disableClear = input<boolean>(false, { alias: 'twSortDisableClear' });

  /** When true, all child sort headers are disabled. Defaults to `false`. */
  readonly disabled = input<boolean>(false, { alias: 'twSortDisabled' });

  /** Fires whenever the user changes `active` or `direction` by interacting with a header. Programmatic writes to `[(twSortActive)]` / `[(twSortDirection)]` do NOT emit. */
  readonly sortChange = output<TwSortEvent>({ alias: 'twSortChange' });

  private readonly sortableIds = new Set<string>();

  /** Registers a header id so duplicates can be detected. Called by `SortHeaderComponent` on init. Throws in dev mode if another header with the same id is already registered. */
  register(id: string): void {
    if (isDevMode()) {
      if (!id) {
        throw new Error('tw-sort-header must be provided with a unique id.');
      }
      if (this.sortableIds.has(id)) {
        throw new Error(
          `Cannot have two tw-sort-header elements with the same id (${id}).`,
        );
      }
    }
    this.sortableIds.add(id);
  }

  /** Deregisters a header id. Called on destroy. */
  deregister(id: string): void {
    this.sortableIds.delete(id);
  }

  /** Cycles the direction for the given header and emits `sortChange`. No-op when the directive or the header is disabled. */
  sort(sortable: TwSortable): void {
    if (this.disabled() || sortable.disabled) return;

    const previousActive = this.active();
    const previousDirection = this.direction();

    let nextActive: string | null;
    let nextDirection: SortDirection;

    if (previousActive !== sortable.id) {
      nextActive = sortable.id;
      nextDirection = sortable.start ?? this.start();
    } else {
      nextDirection = this.getNextSortDirection(sortable);
      nextActive = nextDirection === null ? null : sortable.id;
    }

    this.active.set(nextActive);
    this.direction.set(nextDirection);

    this.sortChange.emit({
      active: nextActive,
      direction: nextDirection,
      previous: {
        active: previousActive,
        direction: previousDirection,
      },
    });
  }

  /** Returns the next direction in the cycle for the given header, based on the current state and header/parent overrides. */
  getNextSortDirection(sortable: TwSortable): SortDirection {
    const start = sortable.start ?? this.start();
    const disableClear = sortable.disableClear ?? this.disableClear();
    const cycle = getSortDirectionCycle(start, disableClear);

    // If the header is not currently active, the next direction is the starting one.
    if (this.active() !== sortable.id) {
      return start;
    }

    const currentIndex = cycle.indexOf(this.direction());
    if (currentIndex < 0) {
      return start;
    }
    return cycle[(currentIndex + 1) % cycle.length] as SortDirection;
  }
}
