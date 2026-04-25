import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  isDevMode,
  NgZone,
  output,
  signal,
  untracked,
  input,
} from '@angular/core';
import type { SplitCollapseEvent, SplitDirection, SplitResizeEvent, SplitUnit } from './split.types';
import { TwSplitPane } from './split-pane';
import {
  availableSpace,
  computeBasis,
  hasMinSizeOverflow,
  redistributeOnPaneAdded,
  redistributeOnPaneRemoved,
  redistributeWithConstraints,
  rescaleForContainerResize,
  resolveInitialSizes,
  type PaneConstraints,
} from './split-sizing';

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

  private readonly _elRef = inject(ElementRef);
  private readonly _ngZone = inject(NgZone);
  private readonly _destroyRef = inject(DestroyRef);

  readonly _panes = contentChildren(TwSplitPane);

  /**
   * @internal
   * Container dimension in pixels along the split axis, updated by ResizeObserver.
   * Starts at 0 until the first observation fires.
   */
  readonly _containerSizePx = signal(0);

  /**
   * @internal
   * Current pane sizes in the container's declared unit.
   * Percent mode: values sum to 100 (within epsilon).
   * Pixel mode: values are absolute pixel sizes.
   */
  readonly _sizes = signal<number[]>([]);

  // Previous pane refs — plain field, not a signal, so the pane effect does
  // not re-run just because we wrote this value.
  private _prevPaneRefs: readonly TwSplitPane[] | null = null;

  readonly _hostClass = computed(() =>
    ['flex h-full w-full', this.direction() === 'horizontal' ? 'flex-row' : 'flex-col'].join(' '),
  );

  constructor() {
    // ResizeObserver — runs outside Angular zone to avoid CD on every resize.
    // Guard against environments (e.g. jsdom in tests) where ResizeObserver
    // is not available; those environments call _onContainerResize() directly.
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const el = this._elRef.nativeElement as HTMLElement;
      const ro = new ResizeObserver(entries => {
        const rect = entries[0]?.contentRect;
        if (!rect) return;
        const sizePx = this.direction() === 'horizontal' ? rect.width : rect.height;
        this._ngZone.run(() => this._onContainerResize(sizePx));
      });
      ro.observe(el);
      this._destroyRef.onDestroy(() => ro.disconnect());
    });

    // Pane-list effect — re-runs whenever the ContentChildren list changes.
    // Container size is read with untracked() so this effect does NOT re-run
    // on container resize (the ResizeObserver handles that path independently).
    effect(() => {
      const panes = this._panes();
      const containerPx = untracked(() => this._containerSizePx());
      this._onPanesChange(panes, containerPx);
    });
  }

  // ── Internal resize handler ─────────────────────────────────────────────────

  /**
   * @internal — exposed for testing; do not call from application code.
   * Called by the ResizeObserver when the container's pixel size changes.
   */
  _onContainerResize(newSizePx: number): void {
    const oldSizePx = this._containerSizePx();
    if (Math.abs(newSizePx - oldSizePx) < 0.5) return;

    const panes = this._panes();
    const unit = this.unit();
    const gutterSize = this.gutterSize();
    const n = panes.length;

    const oldAvailable = availableSpace(oldSizePx, n, gutterSize);
    const newAvailable = availableSpace(newSizePx, n, gutterSize);
    const currentSizes = this._sizes();

    const configs = panes.map(toPaneConfig);
    const { sizes, clamped } = rescaleForContainerResize(
      currentSizes,
      configs,
      unit,
      oldAvailable,
      newAvailable,
    );

    this._containerSizePx.set(newSizePx);
    this._sizes.set(sizes);
    this._applyToPanes(panes, sizes, unit, n, gutterSize);

    // Fire sizesChange only when clamping altered a proportional share (§4.3)
    if (clamped) {
      this.sizesChange.emit([...sizes]);
    }
  }

  // ── Pane-list reconciliation ────────────────────────────────────────────────

  /**
   * @internal — exposed for testing; do not call from application code.
   * Called by the contentChildren effect when the pane list changes.
   */
  _onPanesChange(panes: readonly TwSplitPane[], containerPx: number): void {
    const unit = this.unit();
    const gutterSize = this.gutterSize();
    const n = panes.length;
    const available = availableSpace(containerPx, n, gutterSize);

    if (this._prevPaneRefs === null) {
      this._initializeSizes(panes, unit, available, gutterSize);
    } else {
      this._reconcilePanes(panes, this._prevPaneRefs, unit, available, gutterSize);
    }
    this._prevPaneRefs = panes;
  }

  private _initializeSizes(
    panes: readonly TwSplitPane[],
    unit: SplitUnit,
    available: number,
    gutterSize: number,
  ): void {
    if (panes.length === 0) {
      this._sizes.set([]);
      return;
    }
    const configs = panes.map(toPaneConfig);

    if (available > 0 && isDevMode() && hasMinSizeOverflow(configs, unit, available)) {
      console.warn(
        `TwSplit: sum of minSize values exceeds available space (${available}${unit === 'percent' ? '%' : 'px'}). Panes will overflow.`,
      );
    }

    const sizes = resolveInitialSizes(configs, unit, available);
    this._sizes.set(sizes);
    this._applyToPanes(panes, sizes, unit, panes.length, gutterSize);
  }

  private _reconcilePanes(
    newPanes: readonly TwSplitPane[],
    prevPanes: readonly TwSplitPane[],
    unit: SplitUnit,
    available: number,
    gutterSize: number,
  ): void {
    const currentSizes = this._sizes();
    let sizes = [...currentSizes];

    const prevSet = new Set(prevPanes);
    const newSet = new Set(newPanes);
    const added = newPanes.filter(p => !prevSet.has(p));
    const removed = prevPanes.filter(p => !newSet.has(p));

    // Process removals first (working against the prev order)
    let workingPanes: TwSplitPane[] = [...prevPanes];
    for (const removedPane of removed) {
      const idx = workingPanes.indexOf(removedPane);
      if (idx === -1) continue;
      workingPanes = workingPanes.filter((_, i) => i !== idx);
      sizes = redistributeOnPaneRemoved(sizes, idx, workingPanes.map(toPaneConfig), unit, available);
    }

    // Process additions — `sizes` already represents workingPanes (without the
    // new pane). redistributeOnPaneAdded inserts the new size at newIdx internally.
    for (const addedPane of added) {
      const newIdx = newPanes.indexOf(addedPane);
      workingPanes = [...workingPanes];
      workingPanes.splice(newIdx, 0, addedPane);
      sizes = redistributeOnPaneAdded(
        sizes,
        newIdx,
        toPaneConfig(addedPane),
        workingPanes.map(toPaneConfig),
        unit,
        available,
      );
    }

    this._sizes.set(sizes);
    this._applyToPanes(newPanes, sizes, unit, newPanes.length, gutterSize);
  }

  // ── Apply sizes to pane DOM ─────────────────────────────────────────────────

  private _applyToPanes(
    panes: readonly TwSplitPane[],
    sizes: number[],
    unit: SplitUnit,
    numPanes: number,
    gutterSize: number,
  ): void {
    for (let i = 0; i < panes.length; i++) {
      const size = sizes[i] ?? 0;
      panes[i]._basis.set(computeBasis(size, unit, numPanes, gutterSize));
      panes[i]._size.set(size);
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Programmatically set all pane sizes.
   * The array length must equal the current pane count and sizes must be
   * compatible with the declared unit. Throws on mismatch.
   */
  setSizes(sizes: number[]): void {
    const panes = this._panes();
    if (sizes.length !== panes.length) {
      throw new Error(`TwSplit.setSizes: expected ${panes.length} sizes, got ${sizes.length}`);
    }
    const unit = this.unit();
    const containerPx = this._containerSizePx();
    const gutterSize = this.gutterSize();
    const n = panes.length;
    const available = availableSpace(containerPx, n, gutterSize);
    const totalUnit = unit === 'percent' ? 100 : available;
    const configs = panes.map(toPaneConfig);
    const clamped = redistributeWithConstraints(sizes, configs, totalUnit);
    this._sizes.set(clamped);
    this._applyToPanes(panes, clamped, unit, n, gutterSize);
    this.sizesChange.emit([...clamped]);
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
    const panes = this._panes();
    const unit = this.unit();
    const containerPx = this._containerSizePx();
    const gutterSize = this.gutterSize();
    const n = panes.length;
    const available = availableSpace(containerPx, n, gutterSize);
    this._initializeSizes(panes, unit, available, gutterSize);
    if (panes.length > 0) {
      this.sizesChange.emit([...this._sizes()]);
    }
  }
}

function toPaneConfig(pane: TwSplitPane): PaneConstraints {
  return {
    defaultSize: pane.defaultSize(),
    minSize: pane.minSize(),
    maxSize: pane.maxSize(),
  };
}
