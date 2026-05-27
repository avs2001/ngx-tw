import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  type OnDestroy,
  signal,
  ViewEncapsulation,
  computed,
} from '@angular/core';
import { CdkDialogContainer } from '@angular/cdk/dialog';
import { CdkPortalOutlet } from '@angular/cdk/portal';
import { tv } from 'tailwind-variants';
import { type SheetConfig } from './sheet-config';

/** Lifecycle states a sheet passes through. */
export type SheetState = 'opening' | 'open' | 'closing' | 'closed';

/** Event emitted when the sheet's animation state transitions. */
export interface SheetAnimationEvent {
  /** New state that the sheet just transitioned into. */
  state: SheetState;
  /** Duration, in ms, of the transition that triggered the event. */
  totalTime: number;
}

// Sheet uses a `data-[state]` + `data-[side]` driven CSS transition rather than
// the project's `animate.enter`/`animate.leave` keyframes. Same rationale as
// the dialog container (see `dialog-container.ts:27-35`):
//   1. The ref owns the open/close lifecycle (state signal, observables) and
//      needs runtime-configurable enter/exit durations per `Sheet.open()` call
//      — `animate.enter` only accepts a static class name.
//   2. The transform direction depends on `side`, and encoding four pairs of
//      keyframe classes (slide-in/out × 4 sides) is noisier than four
//      `data-[side=…]` selectors on a single transition rule.
// All other library overlays (popover, menu, tooltip) use animate.enter/leave;
// this divergence is intentional and isolated to the sheet container.
const sheetContainerVariants = tv(
  {
    slots: {
      host: 'fixed flex flex-col outline-none bg-surface-raised text-fg shadow-md overflow-hidden transition-[transform,opacity] ease-out motion-reduce:transition-none opacity-0 data-[state=open]:opacity-100',
    },
    variants: {
      side: {
        right: {
          host: 'h-screen right-0 top-0 border-l border-border data-[state=opening]:translate-x-full data-[state=closing]:translate-x-full data-[state=open]:translate-x-0',
        },
        left: {
          host: 'h-screen left-0 top-0 border-r border-border data-[state=opening]:-translate-x-full data-[state=closing]:-translate-x-full data-[state=open]:translate-x-0',
        },
        top: {
          host: 'w-screen left-0 top-0 border-b border-border data-[state=opening]:-translate-y-full data-[state=closing]:-translate-y-full data-[state=open]:translate-y-0',
        },
        bottom: {
          host: 'w-screen left-0 bottom-0 border-t border-border data-[state=opening]:translate-y-full data-[state=closing]:translate-y-full data-[state=open]:translate-y-0',
        },
      },
      size: {
        xs: { host: '' },
        sm: { host: '' },
        md: { host: '' },
        lg: { host: '' },
        xl: { host: '' },
        full: { host: '' },
      },
    },
    // Sheets are axis-aware: `size` controls width on horizontal sides and
    // height on vertical sides. Encoded as compound variants so a single
    // {side, size} pair resolves to one set of utility classes.
    compoundVariants: [
      // ── Right-anchored ─────────────────────────────────────────────
      { side: 'right', size: 'xs', class: { host: 'w-full max-w-xs' } },
      { side: 'right', size: 'sm', class: { host: 'w-full max-w-sm' } },
      { side: 'right', size: 'md', class: { host: 'w-full max-w-md' } },
      { side: 'right', size: 'lg', class: { host: 'w-full max-w-xl' } },
      { side: 'right', size: 'xl', class: { host: 'w-full max-w-2xl' } },
      { side: 'right', size: 'full', class: { host: 'w-screen max-w-none' } },
      // ── Left-anchored ──────────────────────────────────────────────
      { side: 'left', size: 'xs', class: { host: 'w-full max-w-xs' } },
      { side: 'left', size: 'sm', class: { host: 'w-full max-w-sm' } },
      { side: 'left', size: 'md', class: { host: 'w-full max-w-md' } },
      { side: 'left', size: 'lg', class: { host: 'w-full max-w-xl' } },
      { side: 'left', size: 'xl', class: { host: 'w-full max-w-2xl' } },
      { side: 'left', size: 'full', class: { host: 'w-screen max-w-none' } },
      // ── Top-anchored ───────────────────────────────────────────────
      { side: 'top', size: 'xs', class: { host: 'h-[20vh]' } },
      { side: 'top', size: 'sm', class: { host: 'h-[33vh]' } },
      { side: 'top', size: 'md', class: { host: 'h-[50vh]' } },
      { side: 'top', size: 'lg', class: { host: 'h-[66vh]' } },
      { side: 'top', size: 'xl', class: { host: 'h-[80vh]' } },
      { side: 'top', size: 'full', class: { host: 'h-screen' } },
      // ── Bottom-anchored ────────────────────────────────────────────
      { side: 'bottom', size: 'xs', class: { host: 'h-[20vh]' } },
      { side: 'bottom', size: 'sm', class: { host: 'h-[33vh]' } },
      { side: 'bottom', size: 'md', class: { host: 'h-[50vh]' } },
      { side: 'bottom', size: 'lg', class: { host: 'h-[66vh]' } },
      { side: 'bottom', size: 'xl', class: { host: 'h-[80vh]' } },
      { side: 'bottom', size: 'full', class: { host: 'h-screen' } },
    ],
    defaultVariants: { side: 'right', size: 'md' },
  },
  { twMerge: true },
);

/** Fallback padding (ms) added to transition timers in case `transitionend` is swallowed. */
const ANIMATION_FALLBACK_PADDING = 50;

/**
 * Sheet container rendered inside the CDK overlay. Wraps the user-provided
 * content in a Tailwind-styled, edge-anchored surface and coordinates slide
 * enter/exit transitions with {@link SheetRef}.
 *
 * @docs-private
 */
@Component({
  selector: 'tw-sheet-container',
  template: '<ng-template cdkPortalOutlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CdkPortalOutlet],
  host: {
    tabindex: '-1',
    '[attr.id]': '_config.id || null',
    '[attr.role]': '_config.role',
    '[attr.aria-modal]': '_config.ariaModal',
    '[attr.aria-labelledby]': '_config.ariaLabel ? null : _ariaLabelledByQueue[0]',
    '[attr.aria-label]': '_config.ariaLabel',
    '[attr.aria-describedby]': 'ariaDescribedByAttr()',
    '[attr.data-state]': 'state()',
    '[attr.data-side]': 'sideAttr()',
    '[class]': 'hostClasses()',
    '[style.transition-duration.ms]': 'transitionDuration()',
  },
})
export class SheetContainer extends CdkDialogContainer<SheetConfig> implements OnDestroy {
  /** Lifecycle state of the sheet's enter/exit animation. */
  readonly state = signal<SheetState>('opening');

  /**
   * Queue of IDs that describe the sheet, populated by `SheetDescriptionDirective`.
   * Held as a signal so the host `aria-describedby` binding refreshes via OnPush
   * without an explicit `markForCheck()`.
   */
  readonly _ariaDescribedByQueue = signal<readonly string[]>([]);

  /** @internal Resolved `aria-describedby` value; first registered description wins. */
  protected readonly ariaDescribedByAttr = computed(
    () => this._config.ariaDescribedBy || this._ariaDescribedByQueue()[0] || null,
  );

  /** Emits whenever the animation state transitions. */
  readonly animationStateChanged = new EventEmitter<SheetAnimationEvent>();

  /** Resolved enter-animation duration in ms. */
  readonly enterAnimationDuration: number;
  /** Resolved exit-animation duration in ms. */
  readonly exitAnimationDuration: number;

  private _animationTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly sideAttr = computed(() => this._config.side ?? 'right');

  private readonly variants = computed(() => {
    const side = this._config.side ?? 'right';
    const size = this._config.size ?? 'md';
    return sheetContainerVariants({ side, size });
  });

  protected readonly hostClasses = computed(() => {
    const base = this.variants().host();
    const extra = this._config.panelClass;
    if (!extra) return base;
    return Array.isArray(extra) ? [base, ...extra].join(' ') : `${base} ${extra}`;
  });

  protected readonly transitionDuration = computed(() => {
    const current = this.state();
    if (current === 'opening' || current === 'open') return this.enterAnimationDuration;
    if (current === 'closing') return this.exitAnimationDuration;
    return 0;
  });

  constructor() {
    super();
    this.enterAnimationDuration = coerceDuration(this._config.enterAnimationDuration, 200);
    this.exitAnimationDuration = coerceDuration(this._config.exitAnimationDuration, 160);
  }

  protected override _contentAttached(): void {
    super._contentAttached();
    this._startEnterAnimation();
  }

  /** Triggered by the sheet ref to play the exit transition before disposing the overlay. */
  _startExitAnimation(): void {
    this.state.set('closing');
    this.animationStateChanged.emit({ state: 'closing', totalTime: this.exitAnimationDuration });

    this._runAnimationTimer(this.exitAnimationDuration, () => {
      this.state.set('closed');
      this.animationStateChanged.emit({ state: 'closed', totalTime: this.exitAnimationDuration });
    });
  }

  /** Registers a description id for the container's `aria-describedby`. */
  _addAriaDescribedBy(id: string): void {
    this._ariaDescribedByQueue.update((q) => [...q, id]);
  }

  /** Removes a previously registered description id. */
  _removeAriaDescribedBy(id: string): void {
    this._ariaDescribedByQueue.update((q) => q.filter((existing) => existing !== id));
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this._clearTimer();
    this.animationStateChanged.complete();
  }

  private _startEnterAnimation(): void {
    this.animationStateChanged.emit({ state: 'opening', totalTime: this.enterAnimationDuration });

    if (this.enterAnimationDuration === 0) {
      this.state.set('open');
      this.animationStateChanged.emit({ state: 'open', totalTime: 0 });
      return;
    }

    // Defer state change one frame so the browser applies the initial (offscreen)
    // styles before transitioning to the "open" state.
    requestAnimationFrame(() => {
      this.state.set('open');
      this._runAnimationTimer(this.enterAnimationDuration, () => {
        this.animationStateChanged.emit({
          state: 'open',
          totalTime: this.enterAnimationDuration,
        });
      });
    });
  }

  private _runAnimationTimer(duration: number, callback: () => void): void {
    this._clearTimer();
    if (duration === 0) {
      callback();
      return;
    }
    this._animationTimer = setTimeout(callback, duration + ANIMATION_FALLBACK_PADDING);
  }

  private _clearTimer(): void {
    if (this._animationTimer !== null) {
      clearTimeout(this._animationTimer);
      this._animationTimer = null;
    }
  }
}

function coerceDuration(value: number | undefined, fallback: number): number {
  if (value == null || value < 0 || !Number.isFinite(value)) return fallback;
  return value;
}
