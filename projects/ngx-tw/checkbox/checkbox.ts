import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  isDevMode,
  linkedSignal,
  model,
  type OnInit,
  output,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';

/** Visual style of the checkbox when checked or indeterminate. */
export type CheckboxVariant = 'solid' | 'outline';

/** Position of the label relative to the checkbox control. */
export type CheckboxLabelPosition = 'before' | 'after';

// ── tv() config ──────────────────────────────────────────────────

const checkboxVariants = tv(
  {
    slots: {
      root: 'inline-flex items-start gap-3 cursor-pointer select-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      boxWrap: 'relative inline-flex items-center justify-center shrink-0 mt-0.5',
      box: 'inline-flex items-center justify-center rounded-[3px] border transition-colors duration-200 motion-reduce:transition-none',
      icon: 'absolute inset-0 flex items-center justify-center pointer-events-none empty:hidden',
      labelWrap: 'flex flex-col min-w-0 empty:hidden',
      label: 'font-medium text-fg empty:hidden',
      description: 'text-fg-muted empty:hidden',
    },
    variants: {
      size: {
        xs: {
          box: 'size-3.5',
          icon: '[&_svg]:size-3',
          label: 'text-xs',
          description: 'text-2xs',
        },
        sm: {
          box: 'size-4',
          icon: '[&_svg]:size-3',
          label: 'text-sm',
          description: 'text-xs',
        },
        md: {
          box: 'size-5',
          icon: '[&_svg]:size-3.5',
          label: 'text-sm',
          description: 'text-xs',
        },
        lg: {
          box: 'size-6',
          icon: '[&_svg]:size-4',
          label: 'text-base',
          description: 'text-sm',
        },
        xl: {
          box: 'size-7',
          icon: '[&_svg]:size-5',
          label: 'text-base',
          description: 'text-sm',
        },
      },
      labelPosition: {
        before: { root: 'flex-row-reverse' },
        after: { root: 'flex-row' },
      },
      active: {
        true: { box: '' },
        false: { box: 'bg-surface border-border hover:border-border-strong' },
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' },
        false: { root: '' },
      },
    },
    defaultVariants: {
      size: 'md',
      labelPosition: 'after',
      active: false,
      disabled: false,
    },
  },
  { twMerge: true },
);

// ── Static active-state color lookups (statically written for Tailwind v4 scanning) ──

const SOLID_BOX: Record<TwColor, string> = {
  primary: 'bg-primary-600 border-primary-600',
  secondary: 'bg-secondary-600 border-secondary-600',
  accent: 'bg-accent-600 border-accent-600',
  neutral: 'bg-fg border-fg',
  info: 'bg-info-600 border-info-600',
  success: 'bg-success-600 border-success-600',
  warning: 'bg-warning-500 border-warning-500',
  error: 'bg-error-600 border-error-600',
};

const SOLID_ICON: Record<TwColor, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  accent: 'text-white',
  neutral: 'text-surface',
  info: 'text-white',
  success: 'text-white',
  warning: 'text-black',
  error: 'text-white',
};

const OUTLINE_BOX: Record<TwColor, string> = {
  primary: 'bg-surface border-primary-600',
  secondary: 'bg-surface border-secondary-600',
  accent: 'bg-surface border-accent-600',
  neutral: 'bg-surface border-fg',
  info: 'bg-surface border-info-600',
  success: 'bg-surface border-success-600',
  warning: 'bg-surface border-warning-500',
  error: 'bg-surface border-error-600',
};

const OUTLINE_ICON: Record<TwColor, string> = {
  primary: 'text-primary-600',
  secondary: 'text-secondary-600',
  accent: 'text-accent-600',
  neutral: 'text-fg',
  info: 'text-info-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
};

let nextId = 0;

// ── CheckboxComponent ────────────────────────────────────────────

@Component({
  selector: 'tw-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <span [class]="boxWrapClasses()">
      <span [class]="boxClasses()">
        <span [class]="iconClasses()">
          @if (internalIndeterminate()) {
            <span [class]="iconColorClasses()" animate.enter="check-in">
              <ng-content select="[slot='indeterminate-icon']">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path
                    d="M5 12 h14"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </ng-content>
            </span>
          } @else if (internalChecked()) {
            <span [class]="iconColorClasses()" animate.enter="check-in">
              <ng-content select="[slot='check-icon']">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path
                    d="M5 12 l5 5 l9 -11"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </ng-content>
            </span>
          }
        </span>
      </span>
    </span>

    <span [class]="labelWrapClasses()">
      <span [id]="labelId" [class]="labelClasses()">
        <ng-content />
        @if (label()) {
          {{ label() }}
        }
      </span>
      <span [id]="descriptionId" [class]="descriptionClasses()">
        <ng-content select="[slot='description']" />
        @if (description()) {
          {{ description() }}
        }
      </span>
    </span>
  `,
  host: {
    'role': 'checkbox',
    '[id]': 'hostId',
    '[class]': 'rootClasses()',
    '[attr.data-checked]': 'internalChecked()',
    '[attr.data-indeterminate]': 'internalIndeterminate()',
    '[attr.aria-checked]': 'ariaCheckedValue()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-required]': 'required() || null',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'effectiveAriaLabelledby() || null',
    '[attr.aria-describedby]': 'effectiveAriaDescribedby() || null',
    '[attr.tabindex]': 'isDisabled() ? -1 : 0',
    '[attr.name]': 'name() || null',
    '(click)': 'toggle()',
    '(keydown)': 'onKeydown($event)',
    '(blur)': 'onBlur()',
  },
})
export class CheckboxComponent implements ControlValueAccessor, OnInit {
  /** Sets the semantic color for the checked and indeterminate box fill/border. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls the overall scale of the box, check icon, and label typography. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Visual style when checked or indeterminate. `'solid'` fills the box with the color; `'outline'` keeps a transparent fill with a colored border and check. Defaults to `'solid'`. */
  readonly variant = input<CheckboxVariant>('solid');

  /** When true, prevents interaction and applies muted styling. Defaults to `false`. */
  readonly disabled = input(false);

  /** When true, sets `aria-required="true"` so assistive tech announces the control as required. Defaults to `false`. */
  readonly required = input(false);

  /** Optional inline label rendered next to the checkbox. Use default content projection for rich label content instead. */
  readonly label = input<string | undefined>(undefined);

  /** Optional secondary description rendered under the label. Use `[slot="description"]` content projection for rich content instead. */
  readonly description = input<string | undefined>(undefined);

  /** Position of the label/description relative to the checkbox. Defaults to `'after'`. */
  readonly labelPosition = input<CheckboxLabelPosition>('after');

  /** Optional name attribute, mirrored to the host for form association. */
  readonly name = input<string | undefined>(undefined);

  /** Accessible name when no visible label is provided. Mirrored to `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the checkbox. Mirrored to `aria-labelledby`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external element that describes the checkbox. Mirrored to `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Two-way bound checked state. Updates when the user toggles via click or Space. */
  readonly checked = model(false);

  /** Two-way bound indeterminate state. When true, the box shows a dash and the host exposes `aria-checked="mixed"`. Any user toggle clears indeterminate and sets `checked` to `true`. */
  readonly indeterminate = model(false);

  /** Fires after the checked state changes from a user interaction. Does not fire when the value is updated programmatically via `writeValue`. */
  readonly change = output<boolean>();

  private readonly focusMonitor = inject(FocusMonitor);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly cvaDisabled = signal(false);

  private readonly uid = nextId++;
  readonly hostId = `tw-checkbox-${this.uid}`;
  readonly labelId = `${this.hostId}-label`;
  readonly descriptionId = `${this.hostId}-description`;

  constructor() {
    afterNextRender(() => {
      if (isDevMode() && !this.hasAccessibleNameHint()) {
        console.warn(
          '[tw-checkbox] The checkbox has no accessible name. Provide a `label` input, project label content, or set `aria-label` / `aria-labelledby`.',
        );
      }
    });
  }

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  readonly internalChecked = linkedSignal(() => this.checked());
  readonly internalIndeterminate = linkedSignal(() => this.indeterminate());

  readonly ariaCheckedValue = computed(() => {
    if (this.internalIndeterminate()) return 'mixed';
    return this.internalChecked() ? 'true' : 'false';
  });

  readonly effectiveAriaLabelledby = computed(() => {
    const external = this.ariaLabelledby();
    if (external) return external;
    if (this.ariaLabel()) return undefined;
    return this.labelId;
  });

  readonly effectiveAriaDescribedby = computed(() => {
    const external = this.ariaDescribedby();
    if (external) return external;
    return this.descriptionId;
  });

  private readonly isActive = computed(() => this.internalChecked() || this.internalIndeterminate());

  private readonly variantResult = computed(() =>
    checkboxVariants({
      size: this.size(),
      labelPosition: this.labelPosition(),
      active: this.isActive(),
      disabled: this.isDisabled(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly boxWrapClasses = computed(() => this.variantResult().boxWrap());
  readonly iconClasses = computed(() => this.variantResult().icon());
  readonly labelWrapClasses = computed(() => this.variantResult().labelWrap());
  readonly labelClasses = computed(() => this.variantResult().label());
  readonly descriptionClasses = computed(() => this.variantResult().description());

  readonly boxClasses = computed(() => {
    const base = this.variantResult().box();
    if (!this.isActive()) return base;
    const lookup = this.variant() === 'solid' ? SOLID_BOX : OUTLINE_BOX;
    return `${base} ${lookup[this.color()]}`;
  });

  readonly iconColorClasses = computed(() => {
    const lookup = this.variant() === 'solid' ? SOLID_ICON : OUTLINE_ICON;
    return `inline-flex items-center justify-center ${lookup[this.color()]}`;
  });

  // ── Interactions ──────────────────────────────────────────

  /** Toggles the checked state. Clears indeterminate if set. No-op when disabled. */
  toggle(): void {
    if (this.isDisabled()) return;
    const wasIndeterminate = this.internalIndeterminate();
    const next = wasIndeterminate ? true : !this.internalChecked();
    this.internalChecked.set(next);
    this.checked.set(next);
    if (wasIndeterminate) {
      this.internalIndeterminate.set(false);
      this.indeterminate.set(false);
    }
    this.onChange(next);
    this.onTouched();
    this.change.emit(next);
  }

  /** Handles keyboard activation. Only Space toggles — matches native checkbox semantics. */
  onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.toggle();
    }
  }

  /** @internal Called on host blur to notify forms the control has been touched. */
  onBlur(): void {
    this.onTouched();
  }

  // ── ControlValueAccessor ──────────────────────────────────

  writeValue(value: boolean | null | undefined): void {
    const next = !!value;
    this.internalChecked.set(next);
    this.checked.set(next);
    this.internalIndeterminate.set(false);
    this.indeterminate.set(false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // ── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    this.focusMonitor.monitor(this.elementRef);
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
    });
  }

  private hasAccessibleNameHint(): boolean {
    if (this.label() || this.ariaLabel() || this.ariaLabelledby()) return true;
    const host = this.elementRef.nativeElement;
    return host.textContent !== null && host.textContent.trim().length > 0;
  }
}
