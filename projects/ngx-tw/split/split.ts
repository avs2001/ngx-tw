import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  input,
  output,
} from '@angular/core';
import type { SplitCollapseEvent, SplitDirection, SplitResizeEvent, SplitUnit } from './split.types';
import { TwSplitPane } from './split-pane';

/**
 * Container component that lays out two or more panes along a single axis and
 * lets the user resize them by dragging the gutters between them.
 *
 * @example
 * ```html
 * <tw-split direction="horizontal" [gutterSize]="6">
 *   <tw-split-pane [defaultSize]="30" [minSize]="15">…</tw-split-pane>
 *   <tw-split-pane [defaultSize]="70">…</tw-split-pane>
 * </tw-split>
 * ```
 */
@Component({
  selector: 'tw-split',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '_hostClass()',
    '[attr.data-split-direction]': 'direction()',
  },
  template: `<ng-content />`,
})
export class TwSplit {
  /** Axis along which panes are laid out. `'horizontal'` = side-by-side; `'vertical'` = stacked. Defaults to `'horizontal'`. */
  readonly direction = input<SplitDirection>('horizontal');

  /** How sizes are expressed and reported. A single unit governs the whole container. Defaults to `'percent'`. */
  readonly unit = input<SplitUnit>('percent');

  /** Thickness of each gutter in pixels, perpendicular to the split axis. Defaults to `6`. */
  readonly gutterSize = input(6);

  /** When true, all resize interactions are disabled. Gutters are not focusable and do not respond to input. Defaults to `false`. */
  readonly disabled = input(false);

  /** How much to move the gutter per arrow-key press, in the container's declared unit. Defaults to `10`. */
  readonly keyboardStep = input(10);

  /** Step size for `PageUp` / `PageDown` key presses, in the container's declared unit. Defaults to `50`. */
  readonly keyboardStepLarge = input(50);

  /**
   * If non-null, pane sizes are persisted to `localStorage` under this key and restored on init.
   * Defaults to `null` (persistence disabled).
   */
  readonly storageKey = input<string | null>(null);

  /**
   * When true, horizontal direction is visually reversed (RTL layout).
   * Defaults to `null`, which means the value is inherited from the nearest ancestor `dir` attribute.
   */
  readonly rtl = input<boolean | null>(null);

  /**
   * Fires after any committed resize with the ordered array of current pane sizes.
   * Does **not** fire on every pointer move during drag — only on commit (release, keyboard step, programmatic call).
   */
  readonly sizesChange = output<number[]>();

  /** Fires on pointer/touch down or keyboard-initiated resize start. */
  readonly resizeStart = output<SplitResizeEvent>();

  /** Fires on pointer/touch up, blur, or keyboard resize commit. */
  readonly resizeEnd = output<SplitResizeEvent>();

  /** Fires when a pane collapses or expands via snap, keyboard, or programmatic API. */
  readonly collapseChange = output<SplitCollapseEvent>();

  private readonly panes = contentChildren(TwSplitPane);

  readonly _hostClass = computed(() =>
    [
      'flex h-full w-full',
      this.direction() === 'horizontal' ? 'flex-row' : 'flex-col',
    ].join(' '),
  );

  constructor() {
    effect(() => {
      const panes = this.panes();
      const count = panes.length;
      if (count === 0) return;
      const basis = `${100 / count}%`;
      for (const pane of panes) {
        pane._basis.set(basis);
      }
    });
  }

  /**
   * Programmatically set all pane sizes.
   * The array length must equal the current pane count and sizes must be
   * compatible with the declared unit. Throws on mismatch.
   */
  setSizes(_sizes: number[]): void {
    throw new Error('TwSplit.setSizes: not implemented');
  }

  /**
   * Collapse the pane at `paneIndex` to its `collapsedSize`.
   * The pane must have `collapsible = true`. Throws if the index is out of range.
   */
  collapse(_paneIndex: number): void {
    throw new Error('TwSplit.collapse: not implemented');
  }

  /**
   * Restore the pane at `paneIndex` to its pre-collapse size, or its `defaultSize` if none is recorded.
   * Throws if the index is out of range.
   */
  expand(_paneIndex: number): void {
    throw new Error('TwSplit.expand: not implemented');
  }

  /**
   * Restore all panes to their declared `defaultSize` values.
   * Clears any persisted sizes if `storageKey` is set.
   */
  reset(): void {
    throw new Error('TwSplit.reset: not implemented');
  }
}
