import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  input,
  model,
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
        'relative block rounded-lg transition-shadow duration-normal motion-reduce:transition-none tw-flip-perspective',
      inner:
        'relative h-full w-full tw-flip-inner transition-transform duration-300 ease-in-out motion-reduce:transition-none',
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

/**
 * Two-faced card with a CSS 3D-perspective flip animation.
 *
 * @remarks
 * **Hard theme dependency.** The flip animation is driven by helper classes
 * (`tw-flip-perspective`, `tw-flip-inner`, `tw-flip-face`, `tw-flip-back-face`,
 * `tw-flip-axis-x`, `tw-flip-axis-y`, `tw-flip-rotated`, `tw-flip-back-x`,
 * `tw-flip-back-y`) declared in `projects/ngx-tw/theme/_base.css` and re-exported
 * via `ngx-tw/theme/default.css`. Consumers MUST import the theme stylesheet —
 * without it the card renders as two stacked faces with no perspective and no
 * rotation, and there is no run-time fallback. `prefers-reduced-motion: reduce`
 * is handled in the theme CSS, not here.
 */
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
    '[attr.aria-label]': 'hostAriaLabel()',
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
  template: `
    <div [class]="innerClasses()">
      <div
        [class]="frontClasses()"
        [attr.aria-hidden]="frontAriaHidden()"
        [attr.inert]="frontInert()"
      >
        <ng-content select="[slot='front']" />
      </div>
      <div
        #backWrapper
        [class]="backClasses()"
        [class.hidden]="!hasBack()"
        [attr.aria-hidden]="backAriaHidden()"
        [attr.inert]="backInert()"
      >
        <ng-content select="[slot='back']" />
      </div>
    </div>
  `,
})
export class FlipCardComponent {
  /**
   * Visual style of the card chrome. Mirrors `tw-card`'s variant vocabulary.
   * Defaults to `'outlined'` (vs `tw-card`'s `'elevated'` default) so the flip
   * animation reads more clearly without a baseline shadow underneath.
   */
  readonly variant = input<FlipCardVariant>('outlined');

  /** Axis of rotation. `'horizontal'` rotates around the Y axis (left/right flip); `'vertical'` rotates around the X axis (top/bottom flip). Defaults to `'horizontal'`. */
  readonly direction = input<FlipCardDirection>('horizontal');

  /** Which user action flips the card. `'both'` enables click and hover. `'manual'` disables all triggers and defers control to the `flipped` model. Defaults to `'both'`. */
  readonly trigger = input<FlipCardTrigger>('both');

  /** When true, all triggers and keyboard handling are disabled; the current face stays visible. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Whether the back face is currently visible. Two-way bindable via `[(flipped)]`. Defaults to `false`. The `flippedChange` event fires on every toggle. */
  readonly flipped = model(false);

  /**
   * Accessible name for the host element, mirrored to `aria-label`. Required
   * when `trigger` is `'manual'` (the host renders as `role="region"`, which
   * AXE requires to have an accessible name); a default of `'Flip card'` is
   * used in that mode if no value is provided. In interactive modes the host's
   * accessible name is normally derived from the visible face's content — set
   * this input to override. Defaults to `undefined`.
   */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly destroyRef = inject(DestroyRef);
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

  /** @internal */
  readonly hostAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit !== undefined && explicit !== '') return explicit;
    return this.trigger() === 'manual' ? 'Flip card' : null;
  });

  /** @internal */
  readonly frontAriaHidden = computed(() =>
    this.hasBack() && this.flipped() ? 'true' : null,
  );

  /** @internal */
  readonly backAriaHidden = computed(() =>
    !this.hasBack() || !this.flipped() ? 'true' : null,
  );

  /** @internal */
  readonly frontInert = computed(() =>
    this.hasBack() && this.flipped() ? '' : null,
  );

  /** @internal */
  readonly backInert = computed(() =>
    !this.hasBack() || !this.flipped() ? '' : null,
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
    // `MutationObserver` (not `contentChild`) because the spec exercises
    // *dynamic* projection toggled by an `@if` in the host template
    // (see `DynamicBackHost` in flip-card.spec.ts). `contentChild` resolves
    // the parent's own content children — it does NOT see elements projected
    // *through* the host via `<ng-content select="[slot='back']" />`. The
    // observer is single-target and listens only for `childList` on the back
    // wrapper, so the cost is bounded and the disconnect runs on destroy.
    afterNextRender(() => {
      const el = this.backWrapper()?.nativeElement;
      if (!el) return;
      const update = () => this._hasBack.set(el.childElementCount > 0);
      update();
      const observer = new MutationObserver(update);
      observer.observe(el, { childList: true });
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    let firstRun = true;
    effect(() => {
      const isFlipped = this.flipped();
      if (firstRun) {
        firstRun = false;
        return;
      }
      // Announce in any mode that exposes a flippable back face. Manual mode
      // historically owned this because it sets `aria-live='polite'` on the
      // host; interactive modes (hover, click, both) still need an explicit
      // `LiveAnnouncer.announce` so screen-reader users hear the transition
      // when triggering the card via keyboard or pointer.
      if (this.hasBack()) {
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
  }
}
