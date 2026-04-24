import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';

/** Visual style of the flip card chrome. Mirrors `tw-card`. */
export type FlipCardVariant = 'outlined' | 'elevated' | 'ghost';

/** Axis of rotation for the flip animation. */
export type FlipCardDirection = 'horizontal' | 'vertical';

/** Which user interaction flips the card. */
export type FlipCardTrigger = 'hover' | 'click' | 'manual' | 'both';

// ── tv() config ──

const flipCardVariants = tv(
  {
    slots: {
      root:
        'relative block rounded-lg transition-shadow duration-200 motion-reduce:transition-none tw-flip-perspective',
      inner:
        'relative h-full w-full tw-flip-inner transition-transform duration-[400ms] ease-in-out motion-reduce:transition-none',
      face:
        'absolute inset-0 h-full w-full rounded-lg overflow-hidden tw-flip-face',
      front: '',
      back: 'tw-flip-back-face',
    },
    variants: {
      variant: {
        outlined: {
          face: 'bg-surface border border-border text-fg',
        },
        elevated: {
          face: 'bg-surface-raised shadow text-fg',
          root: 'hover:shadow-md',
        },
        ghost: {
          face: 'bg-transparent text-fg',
        },
      },
      direction: {
        horizontal: {
          inner: 'tw-flip-axis-y',
          back: 'tw-flip-back-y',
        },
        vertical: {
          inner: 'tw-flip-axis-x',
          back: 'tw-flip-back-x',
        },
      },
      flipped: {
        true: { inner: 'tw-flip-rotated' },
        false: {},
      },
      interactive: {
        true: {
          root:
            'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        },
        false: {},
      },
      disabled: {
        true: { root: 'opacity-50 cursor-not-allowed' },
        false: {},
      },
    },
    defaultVariants: {
      variant: 'outlined',
      direction: 'horizontal',
      flipped: false,
      interactive: true,
      disabled: false,
    },
  },
  { twMerge: true },
);

@Component({
  selector: 'tw-flip-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
    '[attr.role]': 'hostRole()',
    '[attr.tabindex]': 'hostTabindex()',
    '[attr.aria-pressed]': 'ariaPressed()',
    '[attr.aria-live]': 'ariaLive()',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
  template: `
    <div [class]="innerClasses()">
      <div [class]="frontClasses()">
        <ng-content select="[slot='front']" />
      </div>
      <div #backWrapper [class]="backClasses()" [class.hidden]="!hasBack()">
        <ng-content select="[slot='back']" />
      </div>
    </div>
  `,
})
export class FlipCardComponent {
  /** Visual style of the card chrome. Mirrors tw-card variants. Defaults to `'outlined'`. */
  readonly variant = input<FlipCardVariant>('outlined');

  /** Axis of rotation. `'horizontal'` rotates around the Y axis (left/right flip); `'vertical'` rotates around the X axis (top/bottom flip). Defaults to `'horizontal'`. */
  readonly direction = input<FlipCardDirection>('horizontal');

  /** Which user action flips the card. `'both'` enables click and hover. `'manual'` disables all triggers and defers control to the `flipped` model. Defaults to `'both'`. */
  readonly trigger = input<FlipCardTrigger>('both');

  /** When true, all triggers and keyboard handling are disabled; the current face stays visible. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Whether the back face is currently visible. Two-way bindable via `[(flipped)]`. Defaults to `false`. */
  readonly flipped = model(false);

  /** Fires after the visible face changes. Payload is the new `flipped` state (`true` when the back is showing). */
  readonly flippedChange = output<boolean>();

  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly backWrapper = viewChild<ElementRef<HTMLElement>>('backWrapper');

  private readonly _hasBack = signal(false);
  /** @internal */
  readonly hasBack = this._hasBack.asReadonly();

  /** @internal */
  readonly interactive = computed(
    () => this.trigger() !== 'manual' && !this.disabled() && this.hasBack(),
  );

  /** @internal */
  readonly hostRole = computed(() =>
    this.trigger() === 'manual' ? 'region' : 'button',
  );

  /** @internal */
  readonly hostTabindex = computed(() => (this.interactive() ? 0 : null));

  /** @internal */
  readonly ariaPressed = computed(() =>
    this.interactive() ? String(this.flipped()) : null,
  );

  /** @internal */
  readonly ariaLive = computed(() =>
    this.trigger() === 'manual' ? 'polite' : null,
  );

  /** @internal */
  readonly ariaDisabled = computed(() =>
    this.disabled() ? 'true' : null,
  );

  private readonly variantResult = computed(() =>
    flipCardVariants({
      variant: this.variant(),
      direction: this.direction(),
      flipped: this.flipped(),
      interactive: this.interactive(),
      disabled: this.disabled(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly innerClasses = computed(() => this.variantResult().inner());
  readonly frontClasses = computed(
    () => `${this.variantResult().face()} ${this.variantResult().front()}`,
  );
  readonly backClasses = computed(
    () => `${this.variantResult().face()} ${this.variantResult().back()}`,
  );

  constructor() {
    afterNextRender(() => {
      const el = this.backWrapper()?.nativeElement;
      this._hasBack.set(!!el && el.childElementCount > 0);
    });

    let firstRun = true;
    effect(() => {
      const isFlipped = this.flipped();
      if (firstRun) {
        firstRun = false;
        return;
      }
      if (this.trigger() === 'manual' && this.hasBack()) {
        this.liveAnnouncer.announce(
          isFlipped ? 'Back face visible' : 'Front face visible',
        );
      }
    });
  }

  /** @internal */
  onClick(): void {
    if (this.disabled() || !this.hasBack()) return;
    const t = this.trigger();
    if (t === 'manual') return;
    this.toggle();
  }

  /** @internal */
  onKeydown(event: KeyboardEvent): void {
    if (!this.interactive()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }

  /** @internal */
  onMouseEnter(): void {
    if (this.disabled() || !this.hasBack()) return;
    const t = this.trigger();
    if (t !== 'hover' && t !== 'both') return;
    this.setFlipped(true);
  }

  /** @internal */
  onMouseLeave(): void {
    if (this.disabled() || !this.hasBack()) return;
    const t = this.trigger();
    if (t !== 'hover' && t !== 'both') return;
    this.setFlipped(false);
  }

  private toggle(): void {
    this.setFlipped(!this.flipped());
  }

  private setFlipped(next: boolean): void {
    if (this.flipped() === next) return;
    this.flipped.set(next);
    this.flippedChange.emit(next);
  }
}
