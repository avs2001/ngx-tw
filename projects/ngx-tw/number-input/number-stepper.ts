import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import type { NumberInputDirective } from './number-input';

const numberStepper = tv(
  {
    slots: {
      // The column stretches to the field's height (host is `flex self-stretch`)
      // and the two buttons split it via `flex-1`.
      group: 'flex flex-col self-stretch',
      // `flex-1` gives each button HALF the field height. Codified departure
      // from CLAUDE.md "Square interactive targets" (size-6/7/8): stacking two
      // square buttons made the column 2× a button tall — far taller than the
      // text line — which is exactly what bloated the field's height. So the
      // buttons carry a fixed WIDTH only; the chevron glyph's min-content
      // (size-3 = 12px) is the natural floor that keeps the column compact.
      //
      // WCAG 2.5.8 (target-size, 24px — which slider.ts / badge.ts codify):
      // two stacked buttons cannot each be ≥24px tall inside a ~38–42px field
      // without re-bloating it, so each spinner ends up < 24px tall. The
      // equivalent-control exception covers most cases — the value is reachable
      // by typing into the ≥24px spinbutton input and, with a keyboard, via ↑/↓.
      // Known gap: a negative-allowed field on touch — iOS `inputmode`
      // numeric/decimal exposes no minus key and there are no hardware arrows,
      // so the sub-24px decrement button becomes the only path to a negative
      // value; a consumer needing negatives on touch must provide an alternative.
      // Matches the sub-24px stacked-spinner convention of native/Mantine/Chakra.
      button:
        'flex-1 inline-flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-muted rounded-md transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-40 disabled:pointer-events-none',
      icon: '',
    },
    variants: {
      // Button WIDTH (the height comes from `flex-1`); glyph sub-scale for the
      // chevrons (per CLAUDE.md "Icon Sizing").
      size: {
        xs: { button: 'w-6', icon: 'size-3' },
        sm: { button: 'w-7', icon: 'size-3' },
        md: { button: 'w-7', icon: 'size-3' },
        lg: { button: 'w-8', icon: 'size-4' },
        xl: { button: 'w-8', icon: 'size-4' },
      },
    },
    defaultVariants: { size: 'md' },
  },
  { twMerge: true },
);

/**
 * The visible up/down spinner column for a {@link NumberInputDirective}. A
 * directive cannot emit sibling DOM, so the spinner buttons live in this tiny
 * companion. Bind it to the directive via a template ref and drop it into a
 * `<tw-form-field>`'s `[twSuffix]` slot (or a standalone flex row):
 *
 * ```html
 * <input twInput twNumberInput #qty="twNumberInput" [formControl]="ctrl" />
 * <tw-number-stepper twSuffix [for]="qty" />
 * ```
 *
 * The buttons are kept out of the tab order (`tabindex="-1"`) — the spinbutton
 * input owns value + keyboard semantics — and refocus the input after stepping.
 */
@Component({
  selector: 'tw-number-stepper',
  exportAs: 'twNumberStepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // `flex` makes the inner group fill the host; `self-stretch` makes the host
  // fill the field height — overriding `items-center` in a `<tw-form-field>`
  // `[twSuffix]` slot, and matching `items-stretch` in a standalone flex row.
  host: {
    'class': 'flex self-stretch',
  },
  template: `
    <div [class]="groupClasses()">
      <button
        type="button"
        tabindex="-1"
        aria-label="Increase"
        [class]="buttonClasses()"
        [disabled]="isDisabled()"
        (mousedown)="$event.preventDefault()"
        (click)="onStep(1)"
      >
        <ng-content select="[slot=up]">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            [class]="iconClasses()"
          >
            <path
              fill-rule="evenodd"
              d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.94l-3.71 3.83a.75.75 0 1 1-1.08-1.04l4.25-4.39a.75.75 0 0 1 1.08 0l4.25 4.39a.75.75 0 0 1-.02 1.06Z"
              clip-rule="evenodd"
            />
          </svg>
        </ng-content>
      </button>
      <button
        type="button"
        tabindex="-1"
        aria-label="Decrease"
        [class]="buttonClasses()"
        [disabled]="isDisabled()"
        (mousedown)="$event.preventDefault()"
        (click)="onStep(-1)"
      >
        <ng-content select="[slot=down]">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            [class]="iconClasses()"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
              clip-rule="evenodd"
            />
          </svg>
        </ng-content>
      </button>
    </div>
  `,
})
export class NumberStepperComponent {
  /** The number-input directive instance this stepper controls. Bind to a template ref, e.g. `[for]="qty"` with `#qty="twNumberInput"`. When omitted, the buttons render but do nothing (no-op) and disable. */
  readonly for = input<NumberInputDirective | undefined>(undefined);

  /** Button + glyph density. Match the field's `size` for visual alignment. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  private readonly variant = computed(() => numberStepper({ size: this.size() }));

  /** @internal */
  readonly groupClasses = computed(() => this.variant().group());

  /** @internal */
  readonly buttonClasses = computed(() => this.variant().button());

  /** @internal */
  readonly iconClasses = computed(() => this.variant().icon());

  /** @internal Disabled when there is no target, or the target input is disabled / readonly. */
  readonly isDisabled = computed(() => {
    const d = this.for();
    return !d || d.disabled() || d.readonly();
  });

  /** @internal Step the bound directive, then refocus the input (the refocus lives here, not in `increment`/`decrement`). */
  onStep(direction: 1 | -1): void {
    const dir = this.for();
    if (!dir) return;
    if (direction === 1) {
      dir.increment();
    } else {
      dir.decrement();
    }
    dir.focus();
  }
}
