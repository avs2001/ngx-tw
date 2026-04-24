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

/** Position of the label relative to the switch control. */
export type SwitchLabelPosition = 'before' | 'after';

// ── tv() config ──────────────────────────────────────────────────

const switchVariants = tv(
  {
    slots: {
      root: 'inline-flex items-center gap-3 cursor-pointer select-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      switchEl: 'relative inline-flex items-center shrink-0',
      track:
        'relative inline-flex items-center rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none',
      thumb:
        'absolute left-0.5 inline-flex items-center justify-center bg-surface rounded-full shadow-sm transition-transform duration-200 motion-reduce:transition-none',
      iconWrap:
        'absolute inset-0 flex items-center justify-between px-1 pointer-events-none empty:hidden',
      labelWrap: 'flex flex-col min-w-0 empty:hidden',
      label: 'font-medium text-fg empty:hidden',
      description: 'text-fg-muted empty:hidden',
    },
    variants: {
      size: {
        xs: {
          track: 'h-4 w-7',
          thumb: 'size-3 data-[checked=true]:translate-x-3',
          label: 'text-xs',
          description: 'text-2xs',
        },
        sm: {
          track: 'h-5 w-9',
          thumb: 'size-4 data-[checked=true]:translate-x-4',
          label: 'text-sm',
          description: 'text-xs',
        },
        md: {
          track: 'h-6 w-11',
          thumb: 'size-5 data-[checked=true]:translate-x-5',
          label: 'text-sm',
          description: 'text-xs',
        },
        lg: {
          track: 'h-7 w-12',
          thumb: 'size-6 data-[checked=true]:translate-x-5',
          label: 'text-base',
          description: 'text-sm',
        },
        xl: {
          track: 'h-8 w-14',
          thumb: 'size-7 data-[checked=true]:translate-x-6',
          label: 'text-base',
          description: 'text-sm',
        },
      },
      labelPosition: {
        before: { root: 'flex-row-reverse' },
        after: { root: 'flex-row' },
      },
      checked: {
        true: { track: '' },
        false: { track: 'bg-surface-muted' },
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' },
        false: { root: '' },
      },
    },
    defaultVariants: {
      size: 'md',
      labelPosition: 'after',
      checked: false,
      disabled: false,
    },
  },
  { twMerge: true },
);

// ── Static checked-state color lookups (statically written for Tailwind v4 scanning) ──

const CHECKED_TRACK: Record<TwColor, string> = {
  primary: 'bg-primary-600',
  secondary: 'bg-secondary-600',
  accent: 'bg-accent-600',
  neutral: 'bg-fg',
  info: 'bg-info-600',
  success: 'bg-success-600',
  warning: 'bg-warning-500',
  error: 'bg-error-600',
};

const CHECKED_ICON_COLOR: Record<TwColor, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  accent: 'text-white',
  neutral: 'text-surface',
  info: 'text-white',
  success: 'text-white',
  warning: 'text-black',
  error: 'text-white',
};

let nextId = 0;

// ── SwitchComponent ──────────────────────────────────────────────

@Component({
  selector: 'tw-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true,
    },
  ],
  template: `
    <span [class]="switchClasses()">
      <span [class]="trackClasses()">
        <span [class]="iconWrapClasses()">
          <span [class]="offIconClasses()">
            <ng-content select="[slot='off-icon']" />
          </span>
          <span [class]="onIconClasses()">
            <ng-content select="[slot='on-icon']" />
          </span>
        </span>
        <span [class]="thumbClasses()" [attr.data-checked]="internalChecked()"></span>
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
    'role': 'switch',
    '[id]': 'hostId',
    '[class]': 'rootClasses()',
    '[attr.data-checked]': 'internalChecked()',
    '[attr.aria-checked]': 'internalChecked()',
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
export class SwitchComponent implements ControlValueAccessor, OnInit {
  /** Sets the semantic color for the active (checked) track. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls the overall scale of the track, thumb, and label typography. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** When true, prevents interaction and applies muted styling. Defaults to `false`. */
  readonly disabled = input(false);

  /** When true, sets `aria-required="true"` so assistive tech announces the control as required. Defaults to `false`. */
  readonly required = input(false);

  /** Optional inline label rendered next to the switch. Use default content projection for rich label content instead. */
  readonly label = input<string | undefined>(undefined);

  /** Optional secondary description rendered under the label. Use `[slot="description"]` content projection for rich content instead. */
  readonly description = input<string | undefined>(undefined);

  /** Position of the label/description relative to the switch. Defaults to `'after'`. */
  readonly labelPosition = input<SwitchLabelPosition>('after');

  /** Optional name attribute, mirrored to the host for form association. */
  readonly name = input<string | undefined>(undefined);

  /** Accessible name when no visible label is provided. Mirrored to `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the switch. Mirrored to `aria-labelledby`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external element that describes the switch. Mirrored to `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Two-way bound checked state. Updates when the user toggles via click, Space, or Enter. */
  readonly checked = model(false);

  /** Fires after the checked state changes from a user interaction. Does not fire when the value is updated programmatically via `writeValue`. */
  readonly change = output<boolean>();

  private readonly focusMonitor = inject(FocusMonitor);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly cvaDisabled = signal(false);

  private readonly uid = nextId++;
  readonly hostId = `tw-switch-${this.uid}`;
  readonly labelId = `${this.hostId}-label`;
  readonly descriptionId = `${this.hostId}-description`;

  constructor() {
    afterNextRender(() => {
      if (isDevMode() && !this.hasAccessibleNameHint()) {
        console.warn(
          '[tw-switch] The switch has no accessible name. Provide a `label` input, project label content, or set `aria-label` / `aria-labelledby`.',
        );
      }
    });
  }

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  readonly internalChecked = linkedSignal(() => this.checked());

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

  private readonly variantResult = computed(() =>
    switchVariants({
      size: this.size(),
      labelPosition: this.labelPosition(),
      checked: this.internalChecked(),
      disabled: this.isDisabled(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly switchClasses = computed(() => this.variantResult().switchEl());
  readonly labelWrapClasses = computed(() => this.variantResult().labelWrap());
  readonly labelClasses = computed(() => this.variantResult().label());
  readonly descriptionClasses = computed(() => this.variantResult().description());
  readonly iconWrapClasses = computed(() => this.variantResult().iconWrap());
  readonly thumbClasses = computed(() => this.variantResult().thumb());

  readonly trackClasses = computed(() => {
    const base = this.variantResult().track();
    return this.internalChecked() ? `${base} ${CHECKED_TRACK[this.color()]}` : base;
  });

  readonly onIconClasses = computed(() => {
    const base =
      'inline-flex items-center justify-center transition-opacity duration-200 motion-reduce:transition-none empty:hidden';
    const visibility = this.internalChecked() ? 'opacity-100' : 'opacity-0';
    const color = this.internalChecked() ? CHECKED_ICON_COLOR[this.color()] : 'text-fg-muted';
    return `${base} ${visibility} ${color}`;
  });

  readonly offIconClasses = computed(() => {
    const base =
      'inline-flex items-center justify-center transition-opacity duration-200 motion-reduce:transition-none text-fg-muted empty:hidden';
    const visibility = this.internalChecked() ? 'opacity-0' : 'opacity-100';
    return `${base} ${visibility}`;
  });

  // ── Interactions ──────────────────────────────────────────

  /** Toggles the checked state. No-op when disabled. */
  toggle(): void {
    if (this.isDisabled()) return;
    const next = !this.internalChecked();
    this.internalChecked.set(next);
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
    this.change.emit(next);
  }

  /** Handles keyboard activation. Space and Enter toggle the switch. */
  onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
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
