import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { clampSize } from './split-sizing';
import type { SplitDirection, SplitUnit } from './split.types';

/** @internal Event payload passed from gutter to TwSplit for drag coordination. */
export interface GutterDragEvent {
  gutterIndex: number;
  beforeSize: number;
  afterSize: number;
}

/**
 * @internal
 * Rendered between each pair of adjacent panes by `TwSplit`.
 * Owns all pointer-drag interaction for one gutter slot.
 */
@Component({
  selector: 'tw-split-gutter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '_hostClass()',
    '[style.width]': 'direction() === "horizontal" ? gutterSize() + "px" : null',
    '[style.height]': 'direction() === "vertical" ? gutterSize() + "px" : null',
    '[attr.role]': '"separator"',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.aria-orientation]':
      'direction() === "horizontal" ? "vertical" : "horizontal"',
    '[attr.aria-valuenow]': '_ariaValueNow()',
    '[attr.aria-valuemin]': 'beforeMinSize()',
    '[attr.aria-valuemax]': 'beforeMaxSize()',
    '[attr.data-split-gutter-state]': '_gutterState()',
    '(pointerdown)': '_onPointerDown($event)',
    '(focus)': '_onFocus()',
    '(blur)': '_onBlur()',
  },
  template: `<ng-content />`,
})
export class TwSplitGutterBar {
  /** Which split axis this gutter belongs to. */
  readonly direction = input.required<SplitDirection>();

  /** The unit used by the container. */
  readonly unit = input.required<SplitUnit>();

  /** Pixel thickness of the gutter along the split axis. */
  readonly gutterSize = input.required<number>();

  /** Index of the pane before (left/top of) this gutter. */
  readonly gutterIndex = input.required<number>();

  /** Current size of the pane before this gutter, in the container's unit. */
  readonly beforeSize = input.required<number>();

  /** Current size of the pane after this gutter, in the container's unit. */
  readonly afterSize = input.required<number>();

  /** minSize of the pane before this gutter, in the container's unit. */
  readonly beforeMinSize = input<number>(0);

  /** maxSize of the pane before this gutter, in the container's unit. */
  readonly beforeMaxSize = input<number>(Infinity);

  /** minSize of the pane after this gutter, in the container's unit. */
  readonly afterMinSize = input<number>(0);

  /** maxSize of the pane after this gutter, in the container's unit. */
  readonly afterMaxSize = input<number>(Infinity);

  /** Container pixel size along the split axis. */
  readonly containerSizePx = input.required<number>();

  /** Total number of panes (for gutter-count in px→unit conversion). */
  readonly paneCount = input.required<number>();

  /** When true, the gutter is non-interactive. */
  readonly disabled = input(false);

  /** Fires each rAF frame while dragging with proposed new adjacent sizes. */
  readonly dragMove = output<GutterDragEvent>();

  /** Fires on pointerdown (drag start) with this gutter's index. */
  readonly dragStart = output<number>();

  /**
   * Fires on pointerup/cancel/Escape/blur with the final [before, after] sizes.
   * On cancel (Escape, blur, pointercancel) the sizes are the pre-drag values.
   */
  readonly dragEnd = output<GutterDragEvent>();

  private readonly _elRef = inject(ElementRef<HTMLElement>);
  private readonly _ngZone = inject(NgZone);

  readonly _dragging = signal(false);
  private readonly _focused = signal(false);

  readonly _gutterState = computed(() => {
    if (this.disabled()) return 'disabled';
    if (this._dragging()) return 'dragging';
    if (this._focused()) return 'focus';
    return 'idle';
  });

  readonly _ariaValueNow = computed(() => Math.round(this.beforeSize()));

  readonly _hostClass = computed(() => {
    const isH = this.direction() === 'horizontal';
    const parts: string[] = ['shrink-0 relative touch-none select-none'];
    parts.push(isH ? 'cursor-col-resize' : 'cursor-row-resize');

    const state = this._gutterState();
    if (state === 'disabled') {
      parts.push('bg-border-muted cursor-not-allowed');
    } else if (state === 'dragging') {
      parts.push('bg-primary-300');
    } else {
      parts.push(
        'bg-border hover:bg-border-strong transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      );
    }
    return parts.join(' ');
  });

  // ── Drag state — cached at pointerdown, no per-frame DOM reads (§11) ────────

  private _dragStartPosPx = 0;
  private _dragStartBeforeSize = 0;
  private _dragStartAfterSize = 0;
  private _dragBeforeMin = 0;
  private _dragBeforeMax = 0;
  private _dragAfterMin = 0;
  private _dragAfterMax = 0;
  private _dragContainerPx = 0;
  private _dragPaneCount = 0;
  private _dragUnit: SplitUnit = 'percent';
  private _dragDirection: SplitDirection = 'horizontal';
  private _dragGutterSize = 0;

  /** Latest pointermove position, coalesced by rAF. */
  private _pendingPosPx: number | null = null;
  private _rafId: number | null = null;

  /** Transparent full-viewport overlay to catch iframe-entered pointer events (§5.1). */
  private _overlay: HTMLDivElement | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this._dragging()) this._teardown();
    });
  }

  // ── Pointer handlers ───────────────────────────────────────────────────────

  _onPointerDown(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) return;
    event.preventDefault();

    const el = this._elRef.nativeElement;
    el.setPointerCapture(event.pointerId);

    // Cache all container reads here — no per-frame DOM access (§11).
    this._dragDirection = this.direction();
    this._dragUnit = this.unit();
    this._dragContainerPx = this.containerSizePx();
    this._dragPaneCount = this.paneCount();
    this._dragGutterSize = this.gutterSize();
    this._dragStartPosPx =
      this._dragDirection === 'horizontal' ? event.clientX : event.clientY;
    this._dragStartBeforeSize = this.beforeSize();
    this._dragStartAfterSize = this.afterSize();
    this._dragBeforeMin = this.beforeMinSize();
    this._dragBeforeMax = this.beforeMaxSize();
    this._dragAfterMin = this.afterMinSize();
    this._dragAfterMax = this.afterMaxSize();

    this._createOverlay();
    this._applyDocumentDragState(true);

    // Bind outside Angular zone — no CD on every pointermove (§11).
    this._ngZone.runOutsideAngular(() => {
      el.addEventListener('pointermove', this._boundMove);
      el.addEventListener('pointerup', this._boundUp);
      el.addEventListener('pointercancel', this._boundCancel);
      window.addEventListener('blur', this._boundBlur);
      window.addEventListener('keydown', this._boundEscape, { capture: true });
    });

    this._ngZone.run(() => {
      this._dragging.set(true);
      this.dragStart.emit(this.gutterIndex());
    });
  }

  private readonly _boundMove = (e: Event) => this._onPointerMove(e as PointerEvent);
  private readonly _boundUp = (e: Event) => this._commitDrag(e as PointerEvent);
  private readonly _boundCancel = () => this._cancelDrag();
  private readonly _boundBlur = () => this._cancelDrag();
  private readonly _boundEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this._dragging()) {
      e.stopPropagation();
      this._cancelDrag();
    }
  };

  private _onPointerMove(event: PointerEvent): void {
    this._pendingPosPx =
      this._dragDirection === 'horizontal' ? event.clientX : event.clientY;
    if (this._rafId !== null) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      const pos = this._pendingPosPx;
      if (pos === null) return;
      this._pendingPosPx = null;
      const [bs, as_] = this._computeSizes(pos);
      this._ngZone.run(() => {
        this.dragMove.emit({ gutterIndex: this.gutterIndex(), beforeSize: bs, afterSize: as_ });
      });
    });
  }

  private _commitDrag(event: PointerEvent): void {
    if (!this._dragging()) return;
    const pos =
      this._dragDirection === 'horizontal' ? event.clientX : event.clientY;
    const [bs, as_] = this._computeSizes(pos);
    this._teardown();
    this._ngZone.run(() => {
      this._dragging.set(false);
      this.dragEnd.emit({ gutterIndex: this.gutterIndex(), beforeSize: bs, afterSize: as_ });
    });
  }

  /** Cancel drag: restore pre-drag sizes (Escape, blur, pointercancel). */
  private _cancelDrag(): void {
    if (!this._dragging()) return;
    const bs = this._dragStartBeforeSize;
    const as_ = this._dragStartAfterSize;
    this._teardown();
    this._ngZone.run(() => {
      this._dragging.set(false);
      this.dragEnd.emit({ gutterIndex: this.gutterIndex(), beforeSize: bs, afterSize: as_ });
    });
  }

  private _teardown(): void {
    const el = this._elRef.nativeElement;
    el.removeEventListener('pointermove', this._boundMove);
    el.removeEventListener('pointerup', this._boundUp);
    el.removeEventListener('pointercancel', this._boundCancel);
    window.removeEventListener('blur', this._boundBlur);
    window.removeEventListener('keydown', this._boundEscape, { capture: true });

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._pendingPosPx = null;
    this._removeOverlay();
    this._applyDocumentDragState(false);
  }

  // ── Size computation ───────────────────────────────────────────────────────

  /**
   * Given the current pointer position, return clamped [beforeSize, afterSize].
   * The gutter stops at the nearest valid position — never jumps past a minimum (§5.1).
   */
  private _computeSizes(currentPosPx: number): [number, number] {
    const deltaPx = currentPosPx - this._dragStartPosPx;
    const deltaUnit = this._pxToUnit(deltaPx);

    let bs = this._dragStartBeforeSize + deltaUnit;
    let as_ = this._dragStartAfterSize - deltaUnit;

    // Clamp before pane; fold overflow into after pane.
    const bsClamped = clampSize(bs, this._dragBeforeMin, this._dragBeforeMax);
    as_ = as_ - (bsClamped - bs);
    bs = bsClamped;

    // Clamp after pane; fold overflow back into before pane.
    const asClamped = clampSize(as_, this._dragAfterMin, this._dragAfterMax);
    bs = clampSize(bs - (asClamped - as_), this._dragBeforeMin, this._dragBeforeMax);
    as_ = asClamped;

    return [bs, as_];
  }

  private _pxToUnit(deltaPx: number): number {
    if (this._dragUnit === 'pixel') return deltaPx;
    const gutterCount = Math.max(0, this._dragPaneCount - 1);
    const available = Math.max(
      1,
      this._dragContainerPx - gutterCount * this._dragGutterSize,
    );
    return (deltaPx / available) * 100;
  }

  // ── Overlay — catches pointer events that enter iframes during drag (§5.1) ──

  private _createOverlay(): void {
    const div = document.createElement('div');
    div.setAttribute('data-split-drag-overlay', '');
    div.style.cssText =
      'position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;opacity:0;pointer-events:all;cursor:' +
      (this._dragDirection === 'horizontal' ? 'col-resize' : 'row-resize');
    document.body.appendChild(div);
    this._overlay = div;
  }

  private _removeOverlay(): void {
    this._overlay?.remove();
    this._overlay = null;
  }

  // ── Document-level cursor + user-select (§8.4) ─────────────────────────────

  private _applyDocumentDragState(active: boolean): void {
    const cls =
      this._dragDirection === 'horizontal'
        ? 'tw-split-dragging-h'
        : 'tw-split-dragging-v';
    if (active) {
      document.documentElement.classList.add(cls);
      document.body.style.userSelect = 'none';
    } else {
      document.documentElement.classList.remove(cls);
      document.body.style.userSelect = '';
    }
  }

  // ── Focus / blur ───────────────────────────────────────────────────────────

  _onFocus(): void {
    this._focused.set(true);
  }

  _onBlur(): void {
    this._focused.set(false);
  }
}
