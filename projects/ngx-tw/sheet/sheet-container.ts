import {
  ChangeDetectionStrategy,
  Component,
  type EventEmitter,
  inject,
  type Signal,
  ViewEncapsulation,
  computed,
} from '@angular/core';
import { CdkDialogContainer } from '@angular/cdk/dialog';
import { CdkPortalOutlet } from '@angular/cdk/portal';
import {
  coerceOverlayDuration,
  mergeOverlayPanelClass,
  OverlayContainerCoordinator,
  type OverlayContainerAnimationEvent,
  type OverlayContainerState,
} from '@cdevhub/ngx-tw/core';
import { tv } from 'tailwind-variants';
import { type SheetConfig } from './sheet-config';

/** Lifecycle states a sheet passes through. */
export type SheetState = OverlayContainerState;

/** Event emitted when the sheet's animation state transitions. */
export type SheetAnimationEvent = OverlayContainerAnimationEvent;

// Sheet uses a `data-[state]` + `data-[side]` driven CSS transition rather than
// the project's `animate.enter`/`animate.leave` keyframes. Same rationale as
// the dialog container (see `dialog-container.ts`):
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

/**
 * Sheet container rendered inside the CDK overlay. Wraps the user-provided
 * content in a Tailwind-styled, edge-anchored surface and coordinates slide
 * enter/exit transitions with {@link SheetRef}.
 *
 * The animation state machine, `aria-describedby` queue, and panel-class
 * merge are shared with `DialogContainer` via {@link OverlayContainerCoordinator}
 * (component-scoped — see `providers: [OverlayContainerCoordinator]`).
 *
 * @docs-private
 */
@Component({
  selector: 'tw-sheet-container',
  template: '<ng-template cdkPortalOutlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CdkPortalOutlet],
  providers: [OverlayContainerCoordinator],
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
export class SheetContainer extends CdkDialogContainer<SheetConfig> {
  private readonly coordinator = inject(OverlayContainerCoordinator);

  /** Lifecycle state of the sheet's enter/exit animation. */
  readonly state: Signal<SheetState> = this.coordinator.state;

  /** Emits whenever the animation state transitions. */
  readonly animationStateChanged: EventEmitter<SheetAnimationEvent> =
    this.coordinator.animationStateChanged;

  /** Resolved enter-animation duration in ms. */
  readonly enterAnimationDuration: number;
  /** Resolved exit-animation duration in ms. */
  readonly exitAnimationDuration: number;

  protected readonly sideAttr = computed(() => this._config.side ?? 'right');

  private readonly variants = computed(() => {
    const side = this._config.side ?? 'right';
    const size = this._config.size ?? 'md';
    return sheetContainerVariants({ side, size });
  });

  protected readonly hostClasses = computed(() =>
    mergeOverlayPanelClass(this.variants().host(), this._config.panelClass),
  );

  protected readonly ariaDescribedByAttr = computed(
    () =>
      this._config.ariaDescribedBy ||
      this.coordinator.describedByIds()[0] ||
      null,
  );

  protected readonly transitionDuration = this.coordinator.transitionDuration;

  constructor() {
    super();
    this.enterAnimationDuration = coerceOverlayDuration(this._config.enterAnimationDuration, 200);
    this.exitAnimationDuration = coerceOverlayDuration(this._config.exitAnimationDuration, 160);
    this.coordinator.setDurations(this.enterAnimationDuration, this.exitAnimationDuration);
  }

  protected override _contentAttached(): void {
    super._contentAttached();
    this.coordinator.startEnterAnimation();
  }

  /** Triggered by the sheet ref to play the exit transition before disposing the overlay. */
  _startExitAnimation(): void {
    this.coordinator.startExitAnimation();
  }

  /** Registers a description id for the container's `aria-describedby`. */
  _addAriaDescribedBy(id: string): void {
    this.coordinator.addAriaDescribedBy(id);
  }

  /** Removes a previously registered description id. */
  _removeAriaDescribedBy(id: string): void {
    this.coordinator.removeAriaDescribedBy(id);
  }
}
