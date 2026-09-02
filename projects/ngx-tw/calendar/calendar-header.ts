import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  type InputSignal,
  type OutputEmitterRef,
  type Signal,
} from '@angular/core';
import { tv } from 'tailwind-variants';

const headerVariants = tv(
  {
    slots: {
      root: 'flex items-center justify-between px-2 py-1 mb-2',
      navButton:
        'inline-flex items-center justify-center select-none h-9 w-9 rounded-full text-fg hover:bg-surface-muted transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:text-fg-subtle disabled:hover:bg-transparent',
      periodButton:
        'inline-flex items-center justify-center select-none px-3 py-1.5 text-sm font-semibold rounded-md text-fg hover:bg-surface-muted transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:text-fg-subtle disabled:hover:bg-transparent',
    },
    variants: {},
    defaultVariants: {},
  },
  { twMerge: true },
);

/**
 * Calendar navigation header — previous / period / next button row.
 * The period label button toggles between views (month → year → multi-year).
 */
@Component({
  selector: 'tw-calendar-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div [class]="classes().root">
      <button
        type="button"
        [class]="classes().navButton"
        [disabled]="prevDisabled()"
        [attr.aria-label]="prevAriaLabel()"
        (click)="prevClicked.emit()"
      >
        <svg
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            d="M15 18l-6-6 6-6"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        [class]="classes().periodButton"
        [attr.aria-label]="periodAriaLabel()"
        [disabled]="!canSwitchView()"
        (click)="onPeriodClick()"
      >
        {{ periodLabel() }}
      </button>

      <button
        type="button"
        [class]="classes().navButton"
        [disabled]="nextDisabled()"
        [attr.aria-label]="nextAriaLabel()"
        (click)="nextClicked.emit()"
      >
        <svg
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            d="M9 18l6-6-6-6"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  `,
})
export class CalendarHeaderComponent {
  /** Display text for the period button (e.g. "January 2026"). */
  readonly periodLabel: InputSignal<string> = input.required<string>();

  /** Accessible label for the period button. */
  readonly periodAriaLabel: InputSignal<string> = input.required<string>();

  /** Accessible label for the previous button. */
  readonly prevAriaLabel: InputSignal<string> = input.required<string>();

  /** Accessible label for the next button. */
  readonly nextAriaLabel: InputSignal<string> = input.required<string>();

  /** Disables the previous button — set by the orchestrator when `minDate` blocks backward navigation. Defaults to `false`. */
  readonly prevDisabled: InputSignal<boolean> = input<boolean>(false);

  /** Disables the next button — set by the orchestrator when `maxDate` blocks forward navigation. Defaults to `false`. */
  readonly nextDisabled: InputSignal<boolean> = input<boolean>(false);

  /** When false, the period button is disabled (e.g. when already at the top view). Defaults to `true`. */
  // TRUE-default: the period button is the calendar header's primary drill-up
  // affordance; disabling it is reserved for the top view where there's nowhere
  // to drill up to.
  readonly canSwitchView: InputSignal<boolean> = input<boolean>(true);

  /** Fires on previous button click. */
  readonly prevClicked: OutputEmitterRef<void> = output<void>();

  /** Fires on next button click. */
  readonly nextClicked: OutputEmitterRef<void> = output<void>();

  /** Fires on period button click (switch to the next higher view). */
  readonly periodClicked: OutputEmitterRef<void> = output<void>();

  protected readonly classes: Signal<{
    root: string;
    navButton: string;
    periodButton: string;
  }> = computed(() => {
    const v = headerVariants();
    return { root: v.root(), navButton: v.navButton(), periodButton: v.periodButton() };
  });

  protected onPeriodClick(): void {
    if (this.canSwitchView()) this.periodClicked.emit();
  }
}
