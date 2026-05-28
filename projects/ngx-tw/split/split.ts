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
  PLATFORM_ID,
  signal,
  untracked,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';
import { tv } from 'tailwind-variants';
import type { SplitCollapseEvent, SplitDirection, SplitResizeEvent, SplitUnit } from './split.types';
import { SplitPaneComponent } from './split-pane';
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

let nextSplitId = 0;

const splitVariants = tv(
  {
    slots: {
      root: 'flex h-full w-full',
      gutter:
        'shrink-0 bg-border transition-colors duration-normal motion-reduce:transition-none hover:bg-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      direction: {
        horizontal: { root: 'flex-row', gutter: 'cursor-col-resize' },
        vertical: { root: 'flex-col', gutter: 'cursor-row-resize' },
      },
      disabled: {
        true: { gutter: 'opacity-50 pointer-events-none cursor-default' },
        false: {},
      },
    },
    defaultVariants: {
      direction: 'horizontal',
      disabled: false,
    },
  },
  { twMerge: true },
);

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
    '[class]': '_rootClass()',
    '[attr.data-split-direction]': 'direction()',
  },
  template: `
    <ng-content />
    @for (i of _gutterIndices(); track i) {
      <div
        role="separator"
        [attr.aria-orientation]="direction()"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="100"
        [attr.aria-valuenow]="_ariaValueNow(i)"
        [attr.aria-controls]="_ariaControls(i)"
        [attr.aria-label]="_ariaLabel(i)"
        [attr.aria-disabled]="disabled() || null"
        [attr.tabindex]="disabled() ? -1 : 0"
        [class]="_gutterClass()"
        [style.order]="i * 2 + 1"
        [style.flex-basis.px]="gutterSize()"
        [style.min-width.px]="direction() === 'horizontal' ? gutterSize() : 0"
        [style.min-height.px]="direction() === 'vertical' ? gutterSize() : 0"
        (pointerdown)="_onGutterPointerDown($event, i)"
        (keydown)="_onGutterKeydown($event, i)"
      ></div>
    }
  `,
})
export class SplitComponent {
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
  private readonly _directionality = inject(Directionality, { optional: true });
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly _panes = contentChildren(SplitPaneComponent);

  /** Stable id used to namespace per-pane DOM ids inside this container. */
  private readonly _componentId = `tw-split-${nextSplitId++}`;

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

  /** Tracks the live `dir` attribute resolved through CDK Directionality. */
  private readonly _cdkDir = signal<'ltr' | 'rtl'>(this._directionality?.value ?? 'ltr');

  /** Resolves the effective RTL state: explicit `rtl` input overrides CDK `dir`. */
  readonly _isRtl = computed(() => this.rtl() ?? this._cdkDir() === 'rtl');

  // Previous pane refs — plain field, not a signal, so the pane effect does
  // not re-run just because we wrote this value.
  private _prevPaneRefs: readonly SplitPaneComponent[] | null = null;

  /** True until the first pane-list reconciliation has run; gates persistence hydration. */
  private _initialReconciled = false;

  /** Resolved class strings from tailwind-variants. */
  private readonly _classes = computed(() =>
    splitVariants({
      direction: this.direction(),
      disabled: this.disabled(),
    }),
  );

  readonly _rootClass = computed(() => this._classes().root());
  readonly _gutterClass = computed(() => this._classes().gutter());

  /** Indices `0..panes.length - 2` representing the gutter between pane[i] and pane[i+1]. */
  readonly _gutterIndices = computed(() => {
    const n = this._panes().length;
    return n > 0 ? Array.from({ length: n - 1 }, (_, i) => i) : [];
  });

  /** @internal — drag state for the active pointer. */
  private _drag: {
    pointerId: number;
    gutterIndex: number;
    startClient: number;
    startSizes: number[];
    target: HTMLElement;
    moveHandler: (e: PointerEvent) => void;
    upHandler: (e: PointerEvent) => void;
  } | null = null;

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

    // Reflect CDK Directionality changes into the local signal so the computed
    // _isRtl re-evaluates and keyboard / pointer handlers honour live `dir`
    // attribute changes (e.g. when an ancestor flips the page direction).
    if (this._directionality) {
      const sub = this._directionality.change.subscribe(value => {
        this._cdkDir.set(value);
      });
      this._destroyRef.onDestroy(() => sub.unsubscribe());
    }
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
      this._commit(sizes);
    }
  }

  // ── Pane-list reconciliation ────────────────────────────────────────────────

  /**
   * @internal — exposed for testing; do not call from application code.
   * Called by the contentChildren effect when the pane list changes.
   */
  _onPanesChange(panes: readonly SplitPaneComponent[], containerPx: number): void {
    const unit = this.unit();
    const gutterSize = this.gutterSize();
    const n = panes.length;
    const available = availableSpace(containerPx, n, gutterSize);

    // Assign a stable DOM id to each pane so aria-controls on the gutter can
    // reference them. Idempotent — only the first assignment for a given pane
    // sticks; later runs are no-ops.
    for (let i = 0; i < panes.length; i++) {
      panes[i]._ensureId(this._componentId, i);
    }

    if (this._prevPaneRefs === null) {
      const restored = this._readPersistedSizes(panes);
      if (restored) {
        this._sizes.set(restored);
        this._applyToPanes(panes, restored, unit, panes.length, gutterSize);
      } else {
        this._initializeSizes(panes, unit, available, gutterSize);
      }
    } else {
      this._reconcilePanes(panes, this._prevPaneRefs, unit, available, gutterSize);
    }
    this._prevPaneRefs = panes;
    this._initialReconciled = true;
  }

  private _initializeSizes(
    panes: readonly SplitPaneComponent[],
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
        `SplitComponent: sum of minSize values exceeds available space (${available}${unit === 'percent' ? '%' : 'px'}). Panes will overflow.`,
      );
    }

    const sizes = resolveInitialSizes(configs, unit, available);
    this._sizes.set(sizes);
    this._applyToPanes(panes, sizes, unit, panes.length, gutterSize);
  }

  private _reconcilePanes(
    newPanes: readonly SplitPaneComponent[],
    prevPanes: readonly SplitPaneComponent[],
    unit: SplitUnit,
    available: number,
    gutterSize: number,
  ): void {
    // `_reconcilePanes` runs from inside the contentChildren effect; reading
    // `_sizes` tracked + writing `_sizes.set(newArray)` below would re-fire the
    // effect on every CD tick (new array reference fails Object.is equality).
    const currentSizes = untracked(() => this._sizes());
    let sizes = [...currentSizes];

    const prevSet = new Set(prevPanes);
    const newSet = new Set(newPanes);
    const added = newPanes.filter(p => !prevSet.has(p));
    const removed = prevPanes.filter(p => !newSet.has(p));

    // Process removals first (working against the prev order)
    let workingPanes: SplitPaneComponent[] = [...prevPanes];
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
    panes: readonly SplitPaneComponent[],
    sizes: number[],
    unit: SplitUnit,
    numPanes: number,
    gutterSize: number,
  ): void {
    for (let i = 0; i < panes.length; i++) {
      const size = sizes[i] ?? 0;
      // Read the previous size without subscribing — `_applyToPanes` runs from
      // an effect (initial reconciliation) as well as direct calls, and a
      // tracked read combined with the write below would loop the effect
      // indefinitely.
      const prev = untracked(() => panes[i]._size());
      panes[i]._index.set(i);
      panes[i]._basis.set(computeBasis(size, unit, numPanes, gutterSize));
      panes[i]._size.set(size);
      if (Math.abs(prev - size) > 1e-6) {
        panes[i].sizeChange.emit(size);
      }
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
      throw new Error(`SplitComponent.setSizes: expected ${panes.length} sizes, got ${sizes.length}`);
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
    this._commit(clamped);
  }

  /**
   * Collapse the pane at `paneIndex` to its `collapsedSize`.
   * The pane must have `collapsible = true`. Throws if the index is out of range.
   */
  collapse(paneIndex: number): void {
    const panes = this._panes();
    if (paneIndex < 0 || paneIndex >= panes.length) {
      throw new Error(`SplitComponent.collapse: paneIndex ${paneIndex} out of range`);
    }
    const pane = panes[paneIndex];
    if (!pane.collapsible()) {
      throw new Error(
        `SplitComponent.collapse: pane ${paneIndex} is not marked collapsible`,
      );
    }
    if (pane._collapsed()) return;

    this._setCollapsed(panes, paneIndex, true, 'programmatic');
  }

  /**
   * Restore the pane at `paneIndex` to its pre-collapse size, or its `defaultSize` if none is recorded.
   * Throws if the index is out of range.
   */
  expand(paneIndex: number): void {
    const panes = this._panes();
    if (paneIndex < 0 || paneIndex >= panes.length) {
      throw new Error(`SplitComponent.expand: paneIndex ${paneIndex} out of range`);
    }
    const pane = panes[paneIndex];
    if (!pane._collapsed()) return;

    this._setCollapsed(panes, paneIndex, false, 'programmatic');
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
    for (const pane of panes) {
      pane._collapsed.set(false);
      pane._preCollapseSize.set(null);
    }
    this._initializeSizes(panes, unit, available, gutterSize);
    if (panes.length > 0) {
      this.sizesChange.emit([...this._sizes()]);
    }
    // Clear persisted sizes after emit so the cleared state is the resting
    // state at the end of reset(). New commits will repopulate the entry.
    this._clearPersistedSizes();
  }

  // ── ARIA / pointer / keyboard ───────────────────────────────────────────────

  /** @internal — `aria-valuenow` for the gutter between pane i and i+1. Reports the LEFT pane size as a percent. */
  _ariaValueNow(gutterIndex: number): number | null {
    const sizes = this._sizes();
    const size = sizes[gutterIndex];
    if (size === undefined) return null;
    if (this.unit() === 'percent') return Math.round(size);
    const available = availableSpace(
      this._containerSizePx(),
      this._panes().length,
      this.gutterSize(),
    );
    if (available <= 0) return null;
    return Math.round((size / available) * 100);
  }

  /** @internal — `aria-controls` references the two adjacent panes' DOM ids. */
  _ariaControls(gutterIndex: number): string | null {
    const panes = this._panes();
    const a = panes[gutterIndex]?._paneId();
    const b = panes[gutterIndex + 1]?._paneId();
    if (!a || !b) return null;
    return `${a} ${b}`;
  }

  /** @internal — accessible name fallback for the separator handle. */
  _ariaLabel(gutterIndex: number): string {
    return this.direction() === 'horizontal'
      ? `Resize column ${gutterIndex + 1}`
      : `Resize row ${gutterIndex + 1}`;
  }

  /** @internal */
  _onGutterPointerDown(event: PointerEvent, gutterIndex: number): void {
    if (this.disabled() || event.button !== 0) return;
    const target = event.target as HTMLElement;
    target.setPointerCapture(event.pointerId);
    const startClient = this.direction() === 'horizontal' ? event.clientX : event.clientY;
    const startSizes = [...this._sizes()];

    const moveHandler = (e: PointerEvent) => this._onGutterPointerMove(e);
    const upHandler = (e: PointerEvent) => this._onGutterPointerUp(e);

    target.addEventListener('pointermove', moveHandler);
    target.addEventListener('pointerup', upHandler);
    target.addEventListener('pointercancel', upHandler);

    this._drag = {
      pointerId: event.pointerId,
      gutterIndex,
      startClient,
      startSizes,
      target,
      moveHandler,
      upHandler,
    };

    this._setNoSelect(true);

    this.resizeStart.emit({
      sizes: [...startSizes],
      unit: this.unit(),
      originPaneIndex: gutterIndex,
      cause: event.pointerType === 'touch' ? 'touch' : 'pointer',
    });
    event.preventDefault();
  }

  private _onGutterPointerMove(event: PointerEvent): void {
    const drag = this._drag;
    if (!drag) return;
    const horizontal = this.direction() === 'horizontal';
    const current = horizontal ? event.clientX : event.clientY;
    let deltaPx = current - drag.startClient;
    if (deltaPx === 0) return;
    // In RTL horizontal mode the visual delta is inverted from the pane order.
    if (horizontal && this._isRtl()) deltaPx = -deltaPx;

    const panes = this._panes();
    const unit = this.unit();
    const containerPx = this._containerSizePx();
    const available = availableSpace(containerPx, panes.length, this.gutterSize());
    if (available <= 0) return;

    const deltaUnit = unit === 'percent' ? (deltaPx / available) * 100 : deltaPx;

    // Apply delta to gutterIndex (grows) and gutterIndex+1 (shrinks).
    const next = [...drag.startSizes];
    next[drag.gutterIndex] = drag.startSizes[drag.gutterIndex] + deltaUnit;
    next[drag.gutterIndex + 1] = drag.startSizes[drag.gutterIndex + 1] - deltaUnit;

    const totalUnit = unit === 'percent' ? 100 : available;
    const configs = panes.map(toPaneConfig);
    const clamped = redistributeWithConstraints(next, configs, totalUnit);
    this._sizes.set(clamped);
    this._applyToPanes(panes, clamped, unit, panes.length, this.gutterSize());
  }

  private _onGutterPointerUp(event: PointerEvent): void {
    const drag = this._drag;
    if (!drag) return;
    const target = drag.target;
    try {
      target.releasePointerCapture(drag.pointerId);
    } catch {
      /* pointer already released */
    }
    target.removeEventListener('pointermove', drag.moveHandler);
    target.removeEventListener('pointerup', drag.upHandler);
    target.removeEventListener('pointercancel', drag.upHandler);
    this._drag = null;

    this._setNoSelect(false);

    const finalSizes = this._sizes();

    // Snap-collapse threshold check on the two panes adjacent to the drag.
    this._maybeSnap(drag.gutterIndex);

    this._commit(this._sizes());
    this.resizeEnd.emit({
      sizes: [...finalSizes],
      unit: this.unit(),
      originPaneIndex: drag.gutterIndex,
      cause: event.pointerType === 'touch' ? 'touch' : 'pointer',
    });
  }

  /** @internal */
  _onGutterKeydown(event: KeyboardEvent, gutterIndex: number): void {
    if (this.disabled()) return;
    const horizontal = this.direction() === 'horizontal';
    const step = this.keyboardStep();
    const stepLarge = this.keyboardStepLarge();
    const rtl = horizontal && this._isRtl();
    const unit = this.unit();
    const containerPx = this._containerSizePx();
    const available = availableSpace(containerPx, this._panes().length, this.gutterSize());
    const totalUnit = unit === 'percent' ? 100 : available;
    // Use the container's full extent for Home/End so the delta saturates the
    // left pane against its bounds without resorting to Infinity (which would
    // produce NaN once multiplied by the redistribution scaling factor).
    const saturate = totalUnit > 0 ? totalUnit : 1e9;

    let delta: number | null = null;
    const cause: SplitResizeEvent['cause'] = 'keyboard';
    let restore = false;

    switch (event.key) {
      case 'ArrowLeft':
        if (horizontal) delta = rtl ? step : -step;
        break;
      case 'ArrowRight':
        if (horizontal) delta = rtl ? -step : step;
        break;
      case 'ArrowUp':
        if (!horizontal) delta = -step;
        break;
      case 'ArrowDown':
        if (!horizontal) delta = step;
        break;
      case 'PageUp':
        delta = -stepLarge;
        break;
      case 'PageDown':
        delta = stepLarge;
        break;
      case 'Home':
        delta = -saturate;
        break;
      case 'End':
        delta = saturate;
        break;
      case 'Enter':
      case ' ':
        restore = true;
        break;
      default:
        return;
    }

    if (delta === null && !restore) return;
    event.preventDefault();

    const panes = this._panes();
    const startSizes = [...this._sizes()];

    this.resizeStart.emit({
      sizes: [...startSizes],
      unit,
      originPaneIndex: gutterIndex,
      cause,
    });

    if (restore) {
      // Enter / Space toggles collapse on the LEFT pane of the focused gutter
      // when collapsible; otherwise falls back to reset() for keyboard-only recovery.
      const leftPane = panes[gutterIndex];
      if (leftPane?.collapsible()) {
        this._setCollapsed(panes, gutterIndex, !leftPane._collapsed(), 'keyboard');
        this.resizeEnd.emit({
          sizes: [...this._sizes()],
          unit,
          originPaneIndex: gutterIndex,
          cause,
        });
        return;
      }
      this.reset();
      this.resizeEnd.emit({
        sizes: [...this._sizes()],
        unit,
        originPaneIndex: gutterIndex,
        cause,
      });
      return;
    }

    const next = [...startSizes];
    next[gutterIndex] = startSizes[gutterIndex] + (delta as number);
    next[gutterIndex + 1] = startSizes[gutterIndex + 1] - (delta as number);

    const configs = panes.map(toPaneConfig);
    const clamped = redistributeWithConstraints(next, configs, totalUnit);
    this._sizes.set(clamped);
    this._applyToPanes(panes, clamped, unit, panes.length, this.gutterSize());
    this._commit(clamped);
    this.resizeEnd.emit({
      sizes: [...clamped],
      unit,
      originPaneIndex: gutterIndex,
      cause,
    });
  }

  // ── Collapse helpers ────────────────────────────────────────────────────────

  private _setCollapsed(
    panes: readonly SplitPaneComponent[],
    paneIndex: number,
    collapsed: boolean,
    cause: SplitCollapseEvent['cause'],
  ): void {
    const pane = panes[paneIndex];
    const unit = this.unit();
    const containerPx = this._containerSizePx();
    const gutterSize = this.gutterSize();
    const available = availableSpace(containerPx, panes.length, gutterSize);
    const totalUnit = unit === 'percent' ? 100 : available;

    const current = [...this._sizes()];
    // Pick the neighbour that absorbs the size delta: prefer the right pane,
    // fall back to the left pane when collapsing the last pane in the row.
    const partner = paneIndex < panes.length - 1 ? paneIndex + 1 : paneIndex - 1;
    const target = [...current];
    const configs = panes.map(toPaneConfig);

    if (collapsed) {
      pane._preCollapseSize.set(current[paneIndex] ?? null);
      const collapsedSize = pane.collapsedSize();
      const delta = current[paneIndex] - collapsedSize;
      target[paneIndex] = collapsedSize;
      if (partner >= 0) target[partner] = current[partner] + delta;
      // Lock the collapsed pane to exactly `collapsedSize` during redistribution
      // so slack does not flow back into it.
      configs[paneIndex] = {
        defaultSize: configs[paneIndex].defaultSize,
        minSize: collapsedSize,
        maxSize: collapsedSize,
      };
    } else {
      const restored =
        pane._preCollapseSize() ?? pane.defaultSize() ?? totalUnit / Math.max(1, panes.length);
      const delta = restored - current[paneIndex];
      target[paneIndex] = restored;
      if (partner >= 0) target[partner] = current[partner] - delta;
      pane._preCollapseSize.set(null);
    }

    const next = redistributeWithConstraints(target, configs, totalUnit);

    pane._collapsed.set(collapsed);
    pane.collapsedChange.emit(collapsed);
    this._sizes.set(next);
    this._applyToPanes(panes, next, unit, panes.length, gutterSize);
    this._commit(next);
    this.collapseChange.emit({ paneIndex, collapsed, cause });
  }

  private _maybeSnap(gutterIndex: number): void {
    const panes = this._panes();
    const sizes = this._sizes();
    for (const i of [gutterIndex, gutterIndex + 1]) {
      const pane = panes[i];
      if (!pane?.collapsible()) continue;
      const snap = pane.snapSize();
      if (snap <= 0) continue;
      const size = sizes[i] ?? 0;
      const collapsed = pane._collapsed();
      const collapsedSize = pane.collapsedSize();
      const distance = Math.abs(size - collapsedSize);
      if (!collapsed && distance <= snap && size > collapsedSize) {
        this._setCollapsed(panes, i, true, 'snap');
      } else if (collapsed && size > collapsedSize + snap) {
        this._setCollapsed(panes, i, false, 'snap');
      }
    }
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  private _readPersistedSizes(panes: readonly SplitPaneComponent[]): number[] | null {
    const key = this.storageKey();
    if (!key || !this._isBrowser || typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length !== panes.length) return null;
      if (!parsed.every((v: unknown) => typeof v === 'number' && Number.isFinite(v))) return null;
      const unit = this.unit();
      const configs = panes.map(toPaneConfig);
      // `_containerSizePx` is read untracked: this method runs inside the
      // contentChildren effect, which already handles container-size changes
      // through the separate ResizeObserver path.
      const containerPx = untracked(() => this._containerSizePx());
      const available = availableSpace(containerPx, panes.length, this.gutterSize());
      const totalUnit = unit === 'percent' ? 100 : available;
      // Re-clamp persisted sizes against current constraints. If totalUnit is 0
      // (pixel mode pre-measurement), fall back to raw values for later rescaling.
      if (totalUnit <= 0) return parsed as number[];
      return redistributeWithConstraints(parsed as number[], configs, totalUnit);
    } catch {
      return null;
    }
  }

  private _writePersistedSizes(sizes: number[]): void {
    const key = this.storageKey();
    if (!key || !this._isBrowser || typeof localStorage === 'undefined') return;
    if (!this._initialReconciled) return;
    try {
      localStorage.setItem(key, JSON.stringify(sizes));
    } catch {
      /* quota / private-browsing — silently skip persistence */
    }
  }

  private _clearPersistedSizes(): void {
    const key = this.storageKey();
    if (!key || !this._isBrowser || typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* swallow */
    }
  }

  // ── Commit helper ──────────────────────────────────────────────────────────

  private _commit(sizes: number[]): void {
    this.sizesChange.emit([...sizes]);
    this._writePersistedSizes(sizes);
  }

  // ── User-select suppression during drag ────────────────────────────────────

  private _setNoSelect(active: boolean): void {
    if (!this._isBrowser || typeof document === 'undefined') return;
    document.body.classList.toggle('tw-split-no-select', active);
  }
}

function toPaneConfig(pane: SplitPaneComponent): PaneConstraints {
  return {
    defaultSize: pane.defaultSize(),
    minSize: pane.minSize(),
    maxSize: pane.maxSize(),
  };
}
