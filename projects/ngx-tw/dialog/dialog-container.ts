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
import { type TwDialogConfig } from './dialog-config';

/** Lifecycle states a dialog passes through. */
export type TwDialogState = 'opening' | 'open' | 'closing' | 'closed';

/** Event emitted when the dialog's animation state transitions. */
export interface TwDialogAnimationEvent {
  /** New state that the dialog just transitioned into. */
  state: TwDialogState;
  /** Duration, in ms, of the transition that triggered the event. */
  totalTime: number;
}

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

/** Fallback padding (ms) added to transition timers in case `transitionend` is swallowed. */
const ANIMATION_FALLBACK_PADDING = 50;

/**
 * Dialog container rendered inside the CDK overlay. Wraps the user-provided
 * content in a Tailwind-styled surface and coordinates enter/exit transitions
 * with {@link TwDialogRef}.
 *
 * @docs-private
 */
@Component({
  selector: 'tw-dialog-container',
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
    '[attr.aria-describedby]': '_config.ariaDescribedBy || null',
    '[attr.data-state]': 'state()',
    '[class]': 'hostClasses()',
    '[style.transition-duration.ms]': 'transitionDuration()',
  },
})
export class TwDialogContainer extends CdkDialogContainer<TwDialogConfig> implements OnDestroy {
  /** Lifecycle state of the dialog's enter/exit animation. */
  readonly state = signal<TwDialogState>('opening');

  /** Count of action bars currently projected (used by consumers to adapt padding). */
  readonly actionSectionCount = signal(0);

  /** Emits whenever the animation state transitions. */
  readonly animationStateChanged = new EventEmitter<TwDialogAnimationEvent>();

  /** Resolved enter-animation duration in ms. */
  readonly enterAnimationDuration: number;
  /** Resolved exit-animation duration in ms. */
  readonly exitAnimationDuration: number;

  private _animationTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly sizeVariant = computed(() => {
    const size = this._config.size ?? 'md';
    return dialogContainerVariants({ size });
  });

  protected readonly hostClasses = computed(() => {
    const base = this.sizeVariant().host();
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
    this.enterAnimationDuration = coerceDuration(this._config.enterAnimationDuration, 150);
    this.exitAnimationDuration = coerceDuration(this._config.exitAnimationDuration, 120);
  }

  protected override _contentAttached(): void {
    super._contentAttached();
    this._startEnterAnimation();
  }

  /** Triggered by the dialog ref to play the exit transition before disposing the overlay. */
  _startExitAnimation(): void {
    this.state.set('closing');
    this.animationStateChanged.emit({ state: 'closing', totalTime: this.exitAnimationDuration });

    this._runAnimationTimer(this.exitAnimationDuration, () => {
      this.state.set('closed');
      this.animationStateChanged.emit({ state: 'closed', totalTime: this.exitAnimationDuration });
    });
  }

  /** Adjust the projected action section count. */
  _updateActionSectionCount(delta: number): void {
    this.actionSectionCount.update((c) => c + delta);
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

    // Defer state change one frame so the browser applies the initial (hidden)
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
