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
import { type TwDialogConfig } from './dialog-config';

/** Lifecycle states a dialog passes through. */
export type DialogState = OverlayContainerState;

/** Event emitted when the dialog's animation state transitions. */
export type DialogAnimationEvent = OverlayContainerAnimationEvent;

// Dialog uses a `data-[state]` driven CSS transition rather than the project's
// `animate.enter`/`animate.leave` keyframes. Justification:
//   1. The ref owns the open/close lifecycle (state signal, observables) and
//      needs runtime-configurable enter/exit durations per `TwDialog.open()`
//      call — `animate.enter` only accepts a static class name.
//   2. The container drives the same CSS variables (opacity + scale) for both
//      transitions, so a single `transition-[opacity,transform]` rule with a
//      data-state attribute is simpler than two keyframe declarations.
// All other library overlays (popover, menu, tooltip) use animate.enter/leave;
// this divergence is intentional and isolated to the dialog container.
const dialogContainerVariants = tv(
  {
    slots: {
      host: 'relative flex flex-col outline-none bg-surface-raised text-fg rounded-lg shadow-md border border-border overflow-hidden transition-[opacity,transform] ease-out motion-reduce:transition-none opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closing]:opacity-0 data-[state=closing]:scale-95',
    },
    variants: {
      size: {
        xs: { host: 'w-full max-w-sm max-h-[85vh]' },
        sm: { host: 'w-full max-w-md max-h-[85vh]' },
        md: { host: 'w-full max-w-lg max-h-[85vh]' },
        lg: { host: 'w-full max-w-2xl max-h-[85vh]' },
        xl: { host: 'w-full max-w-4xl max-h-[85vh]' },
        fullscreen: {
          host: 'w-screen h-screen max-w-none max-h-none rounded-none border-0',
        },
      },
    },
    defaultVariants: { size: 'md' },
  },
  { twMerge: true },
);

/**
 * Dialog container rendered inside the CDK overlay. Wraps the user-provided
 * content in a Tailwind-styled surface and coordinates enter/exit transitions
 * with {@link TwDialogRef}.
 *
 * The animation state machine, `aria-describedby` queue, and panel-class
 * merge are shared with `SheetContainer` via {@link OverlayContainerCoordinator}
 * (component-scoped — see `providers: [OverlayContainerCoordinator]`).
 *
 * @docs-private
 */
@Component({
  selector: 'tw-dialog-container',
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
    '[class]': 'hostClasses()',
    '[style.transition-duration.ms]': 'transitionDuration()',
  },
})
export class DialogContainer extends CdkDialogContainer<TwDialogConfig> {
  private readonly coordinator = inject(OverlayContainerCoordinator);

  /** Lifecycle state of the dialog's enter/exit animation. */
  readonly state: Signal<DialogState> = this.coordinator.state;

  /** Emits whenever the animation state transitions. */
  readonly animationStateChanged: EventEmitter<DialogAnimationEvent> =
    this.coordinator.animationStateChanged;

  /** Resolved enter-animation duration in ms. */
  readonly enterAnimationDuration: number;
  /** Resolved exit-animation duration in ms. */
  readonly exitAnimationDuration: number;

  private readonly sizeVariant = computed(() => {
    const size = this._config.size ?? 'md';
    return dialogContainerVariants({ size });
  });

  protected readonly hostClasses = computed(() =>
    mergeOverlayPanelClass(this.sizeVariant().host(), this._config.panelClass),
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
    this.enterAnimationDuration = coerceOverlayDuration(this._config.enterAnimationDuration, 150);
    this.exitAnimationDuration = coerceOverlayDuration(this._config.exitAnimationDuration, 120);
    this.coordinator.setDurations(this.enterAnimationDuration, this.exitAnimationDuration);
  }

  protected override _contentAttached(): void {
    super._contentAttached();
    this.coordinator.startEnterAnimation();
  }

  /** Triggered by the dialog ref to play the exit transition before disposing the overlay. */
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
