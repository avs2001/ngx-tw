import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

/**
 * A single resizable pane inside `<tw-split>`.
 * Declare size constraints here; the parent container drives the actual sizing.
 */
@Component({
  selector: 'tw-split-pane',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.id]': '_paneId()',
    '[style.flex-basis]': '_basis()',
    '[style.min-width]': '"0"',
    '[style.min-height]': '"0"',
    '[style.order]': '_index() * 2',
    '[attr.data-split-pane-collapsed]': '_collapsed()',
    class: 'overflow-auto',
  },
  template: `<ng-content />`,
})
export class SplitPaneComponent {
  /** Initial size of this pane in the container's unit. Omit to use even distribution. */
  readonly defaultSize = input<number | undefined>(undefined);

  /** Minimum size in the container's unit. The gutter will not move past this. Defaults to `0`. */
  readonly minSize = input(0);

  /** Maximum size in the container's unit. The gutter will not move past this. Defaults to `Infinity`. */
  readonly maxSize = input(Infinity);

  /** When true, the pane may collapse to `collapsedSize` via snap, keyboard, or API. Defaults to `false`. */
  readonly collapsible = input(false);

  /** Size to use when the pane is collapsed. May be `> 0` for rail-style collapse. Defaults to `0`. */
  readonly collapsedSize = input(0);

  /**
   * If `> 0`, dragging within `snapSize` units of `collapsedSize` snaps the pane closed.
   * Dragging back out past `snapSize` re-expands it. Defaults to `0` (snap disabled).
   */
  readonly snapSize = input(0);

  /**
   * Stable ordering token used by the container when content-projection order and
   * resize math must stay consistent across change detection. Defaults to declaration order.
   */
  readonly order = input<number | undefined>(undefined);

  /** Fires when this pane's size changes, in the container's unit. */
  readonly sizeChange = output<number>();

  /** Fires when this pane's collapsed state changes. */
  readonly collapsedChange = output<boolean>();

  /**
   * @internal
   * Written by the parent SplitComponent to set this pane's current flex-basis.
   * Not part of the public API.
   */
  readonly _basis = signal('');

  /**
   * @internal
   * Current size in the container's unit. Written by the parent SplitComponent.
   * Not part of the public API.
   */
  readonly _size = signal(0);

  /**
   * @internal
   * Written by the parent SplitComponent to reflect collapsed state on the host.
   * Not part of the public API.
   */
  readonly _collapsed = signal(false);

  /**
   * @internal
   * Size recorded immediately before this pane collapses, restored on expand.
   * `null` whenever the pane is not collapsed or no pre-collapse size was captured.
   */
  readonly _preCollapseSize = signal<number | null>(null);

  /**
   * @internal
   * Pane's positional index. Drives flex `order` so gutters can interleave via
   * order = index * 2 + 1.
   */
  readonly _index = signal(0);

  /**
   * @internal
   * DOM id used by the parent gutter's `aria-controls` reference.
   * Assigned by the parent SplitComponent on content reconciliation.
   */
  readonly _paneId = signal<string | null>(null);

  /**
   * @internal — idempotent id assignment. Re-using the existing id when the
   * pane is re-reconciled keeps aria-controls stable across CD. The current
   * id is read via `untracked` so callers running inside an `effect()` don't
   * subscribe to `_paneId` and re-fire when it transitions from `null`.
   */
  _ensureId(componentId: string, index: number): void {
    if (untracked(() => this._paneId()) === null) {
      this._paneId.set(`${componentId}-pane-${index}`);
    }
  }
}
