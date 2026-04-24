import {
  type AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  InjectionToken,
  input,
  isDevMode,
  signal,
  type Signal,
  viewChild,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor } from 'ngx-tw/core';

/** Visual appearance of the form-field container. */
export type FormFieldAppearance = 'outline' | 'filled';

/** Floating label behavior. */
export type FloatLabel = 'auto' | 'always';

/**
 * Contract every ngx-tw form-field-compatible control must implement. A
 * concrete control provides itself under {@link TW_FORM_FIELD_CONTROL} so the
 * surrounding `FormFieldComponent` can mirror its state and wire ARIA.
 */
export abstract class FormFieldControl<T = unknown> {
  /** Unique id on the control's host element. Used by the form-field label `for` attribute and `aria-describedby` wiring. */
  abstract readonly id: Signal<string>;
  /** Current value of the control. */
  abstract readonly value: Signal<T | null>;
  /** Whether the control currently has focus. Typically driven by CDK `FocusMonitor`. */
  abstract readonly focused: Signal<boolean>;
  /** Whether the control's value is considered empty. Drives the floating-label state. */
  abstract readonly empty: Signal<boolean>;
  /** Whether the control is disabled. */
  abstract readonly disabled: Signal<boolean>;
  /** Whether the control is marked required. */
  abstract readonly required: Signal<boolean>;
  /** Whether the control should be rendered as invalid. Usually derived from `NgControl.invalid` combined with `touched`/`submitted`. */
  abstract readonly errorState: Signal<boolean>;
  /** Optional control-type identifier (e.g. `'input'`, `'select'`). When set, the form-field appends `tw-form-field-type-{controlType}` to its host for styling hooks. */
  abstract readonly controlType?: string;
  /** Optional consumer-supplied `aria-describedby` ids the form-field preserves when merging in hint/error ids. */
  abstract readonly userAriaDescribedBy?: Signal<string | undefined>;

  /** Called by the form-field to push the merged `aria-describedby` ids back onto the control's host element. */
  abstract setDescribedByIds(ids: string[]): void;
  /** Called when the form-field container is clicked. Concrete controls typically focus their underlying native element or open a panel. */
  abstract onContainerClick(event: MouseEvent): void;
}

/**
 * Injection token matching {@link FormFieldControl}. Controls register via
 * `providers: [{ provide: TW_FORM_FIELD_CONTROL, useExisting: MyControl }]`.
 */
export const TW_FORM_FIELD_CONTROL = new InjectionToken<FormFieldControl<unknown>>(
  'TW_FORM_FIELD_CONTROL',
);

// ── Unique ID counters ──
let nextLabelId = 0;
let nextHintId = 0;
let nextErrorId = 0;

// ── tv() config ──

const formFieldVariants = tv({
  slots: {
    root: 'block text-fg',
    controlWrapper:
      'relative flex items-stretch gap-2 rounded-md bg-transparent transition-colors duration-200 motion-reduce:transition-none',
    infix: 'relative flex-1 flex items-center min-w-0 [&_input::placeholder]:transition-opacity [&_input::placeholder]:duration-200 [&_textarea::placeholder]:transition-opacity [&_textarea::placeholder]:duration-200',
    labelWrapper:
      'absolute pointer-events-none flex items-center max-w-[calc(100%-1.5rem)] transition-[top,left,color,transform] duration-200 motion-reduce:transition-none origin-[top_left]',
    label:
      'text-fg-muted truncate transition-[font-size,color] duration-200 motion-reduce:transition-none',
    requiredMarker: 'text-error-600 ml-0.5',
    prefix: 'flex items-center shrink-0 text-fg-muted',
    suffix: 'flex items-center shrink-0 text-fg-muted',
    subscriptWrapper: 'mt-1 min-h-5 text-xs flex gap-2',
    hint: 'text-fg-muted',
    error: 'text-error-600 font-medium',
  },
  variants: {
    appearance: {
      outline: {
        controlWrapper:
          'border border-border px-3 py-2 hover:border-border-strong',
      },
      filled: {
        controlWrapper:
          'bg-surface-muted border-b border-border px-3 pt-6 pb-2 hover:bg-surface-sunken',
        infix: 'items-end',
      },
    },
    color: {
      primary: {},
      secondary: {},
      accent: {},
      neutral: {},
      info: {},
      success: {},
      warning: {},
      error: {},
    },
    focused: {
      true: {},
      false: {},
    },
    invalid: {
      true: {},
      false: {},
    },
    labelFloated: {
      true: {
        labelWrapper: 'top-1 left-2',
        label: 'text-xs',
      },
      false: {
        labelWrapper: 'top-1/2 -translate-y-1/2 left-3',
        label: 'text-sm',
      },
    },
    disabled: {
      true: { root: 'opacity-50 pointer-events-none' },
      false: {},
    },
  },
  compoundVariants: [
    // ── Outline + focused → colored border ──
    { appearance: 'outline', focused: true, color: 'primary', class: { controlWrapper: 'border-primary-500' } },
    { appearance: 'outline', focused: true, color: 'secondary', class: { controlWrapper: 'border-secondary-500' } },
    { appearance: 'outline', focused: true, color: 'accent', class: { controlWrapper: 'border-accent-500' } },
    { appearance: 'outline', focused: true, color: 'neutral', class: { controlWrapper: 'border-border-strong' } },
    { appearance: 'outline', focused: true, color: 'info', class: { controlWrapper: 'border-info-500' } },
    { appearance: 'outline', focused: true, color: 'success', class: { controlWrapper: 'border-success-500' } },
    { appearance: 'outline', focused: true, color: 'warning', class: { controlWrapper: 'border-warning-500' } },
    { appearance: 'outline', focused: true, color: 'error', class: { controlWrapper: 'border-error-500' } },

    // ── Filled + focused → colored bottom border ──
    { appearance: 'filled', focused: true, color: 'primary', class: { controlWrapper: 'border-b-2 border-primary-500' } },
    { appearance: 'filled', focused: true, color: 'secondary', class: { controlWrapper: 'border-b-2 border-secondary-500' } },
    { appearance: 'filled', focused: true, color: 'accent', class: { controlWrapper: 'border-b-2 border-accent-500' } },
    { appearance: 'filled', focused: true, color: 'neutral', class: { controlWrapper: 'border-b-2 border-border-strong' } },
    { appearance: 'filled', focused: true, color: 'info', class: { controlWrapper: 'border-b-2 border-info-500' } },
    { appearance: 'filled', focused: true, color: 'success', class: { controlWrapper: 'border-b-2 border-success-500' } },
    { appearance: 'filled', focused: true, color: 'warning', class: { controlWrapper: 'border-b-2 border-warning-500' } },
    { appearance: 'filled', focused: true, color: 'error', class: { controlWrapper: 'border-b-2 border-error-500' } },

    // ── Floated label + focused → colored label ──
    { labelFloated: true, focused: true, color: 'primary', class: { label: 'text-primary-600' } },
    { labelFloated: true, focused: true, color: 'secondary', class: { label: 'text-secondary-600' } },
    { labelFloated: true, focused: true, color: 'accent', class: { label: 'text-accent-600' } },
    { labelFloated: true, focused: true, color: 'neutral', class: { label: 'text-fg' } },
    { labelFloated: true, focused: true, color: 'info', class: { label: 'text-info-600' } },
    { labelFloated: true, focused: true, color: 'success', class: { label: 'text-success-600' } },
    { labelFloated: true, focused: true, color: 'warning', class: { label: 'text-warning-600' } },
    { labelFloated: true, focused: true, color: 'error', class: { label: 'text-error-600' } },

    // ── Outline + floated label → sit centered on the top border with a surface notch ──
    { appearance: 'outline', labelFloated: true, class: { labelWrapper: 'bg-surface px-1 top-0 -translate-y-1/2' } },

    // ── Filled + resting label → align vertically with the input (input is items-end inside an asymmetric pt-6 pb-2 container) ──
    { appearance: 'filled', labelFloated: false, class: { labelWrapper: 'top-[calc(50%+0.5rem)]' } },

    // ── Invalid overrides (declared last so twMerge lets them win) ──
    { invalid: true, appearance: 'outline', class: { controlWrapper: 'border-error-500' } },
    { invalid: true, appearance: 'filled', class: { controlWrapper: 'border-b-2 border-error-500' } },
    { invalid: true, labelFloated: true, class: { label: 'text-error-600' } },
  ],
  defaultVariants: {
    appearance: 'outline',
    color: 'primary',
    focused: false,
    invalid: false,
    labelFloated: false,
    disabled: false,
  },
}, {
  twMerge: true,
});

// ── LabelDirective ──

@Directive({
  selector: '[twLabel]',
  host: {
    '[attr.id]': 'id',
    '[attr.for]': 'controlId()',
    '[class]': 'classes()',
  },
})
export class LabelDirective {
  private readonly formField = inject(FormFieldComponent);

  /** @internal */
  readonly id = `tw-form-field-label-${nextLabelId++}`;

  /** @internal */
  readonly controlId = computed(() => this.formField.control()?.id() ?? null);

  /** @internal */
  readonly classes = computed(() => this.formField.labelClasses());
}

// ── HintDirective ──

@Directive({
  selector: '[twHint]',
  host: {
    '[attr.id]': 'id',
    '[class]': 'classes()',
  },
})
export class HintDirective {
  private readonly formField = inject(FormFieldComponent);

  /** @internal */
  readonly id = `tw-form-field-hint-${nextHintId++}`;

  /** Alignment within the subscript row. `'end'` pushes the hint to the right. When unset, the form-field's `hintAlign` input supplies the default. */
  readonly align = input<'start' | 'end' | undefined>(undefined);

  /** @internal */
  readonly effectiveAlign = computed(
    () => this.align() ?? this.formField.hintAlign(),
  );

  /** @internal */
  readonly classes = computed(() => {
    const base = this.formField.hintClasses();
    return this.effectiveAlign() === 'end' ? `${base} ml-auto` : base;
  });
}

// ── ErrorDirective ──

@Directive({
  selector: '[twError]',
  host: {
    'role': 'alert',
    'aria-live': 'polite',
    '[attr.id]': 'id',
    '[class]': 'classes()',
  },
})
export class ErrorDirective {
  private readonly formField = inject(FormFieldComponent);

  /** @internal */
  readonly id = `tw-form-field-error-${nextErrorId++}`;

  /** @internal */
  readonly classes = computed(() => this.formField.errorClasses());
}

// ── PrefixDirective ──

@Directive({
  selector: '[slot="prefix"]',
  host: {
    '[class]': 'classes()',
  },
})
export class PrefixDirective {
  private readonly formField = inject(FormFieldComponent);

  /** @internal Used by the form-field to measure the prefix area and align the resting label after it. */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  /** @internal */
  readonly classes = computed(() => this.formField.prefixClasses());
}

// ── SuffixDirective ──

@Directive({
  selector: '[slot="suffix"]',
  host: {
    '[class]': 'classes()',
  },
})
export class SuffixDirective {
  private readonly formField = inject(FormFieldComponent);

  /** @internal */
  readonly classes = computed(() => this.formField.suffixClasses());
}

// ── FormFieldComponent ──

@Component({
  selector: 'tw-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-field.html',
  host: {
    '[class]': 'rootClasses()',
    '(click)': '_onContainerClick($event)',
  },
})
export class FormFieldComponent implements AfterContentInit {
  /** Visual appearance of the field container. `'outline'` draws a full border around the control; `'filled'` uses a filled surface with a bottom border. Defaults to `'outline'`. */
  readonly appearance = input<FormFieldAppearance>('outline');

  /** Floating label behavior. `'auto'` floats the label above the control when focused or non-empty; `'always'` keeps it floated. Defaults to `'auto'`. */
  readonly floatLabel = input<FloatLabel>('auto');

  /** Hides the visual required marker (`*`) even when the wrapped control is required. `aria-required` on the control is unaffected. Defaults to `false`. */
  readonly hideRequiredMarker = input(false);

  /** Semantic color for focused/active accents (focused border, floated label). Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Default alignment for a `twHint` element that does not specify its own `align`. Defaults to `'start'`. */
  readonly hintAlign = input<'start' | 'end'>('start');

  /** @internal */
  readonly control = contentChild(TW_FORM_FIELD_CONTROL, { descendants: true });
  /** @internal */
  readonly labelChild = contentChild(LabelDirective, { descendants: true });
  /** @internal */
  readonly hintChildren = contentChildren(HintDirective, { descendants: true });
  /** @internal */
  readonly errorChildren = contentChildren(ErrorDirective, { descendants: true });
  /** @internal */
  readonly prefixChildren = contentChildren(PrefixDirective, { descendants: true });
  /** @internal */
  readonly infixRef = viewChild<ElementRef<HTMLElement>>('infix');

  /** @internal */
  readonly hasLabel = computed(() => !!this.labelChild());
  /** @internal */
  readonly hasPrefix = computed(() => this.prefixChildren().length > 0);

  /** @internal Resting-label left offset in pixels, mirroring the infix's `offsetLeft` so the label sits right after any prefix. */
  private readonly restingLabelOffset = signal(12);

  /** @internal */
  readonly isFocused = computed(() => !!this.control()?.focused());
  /** @internal */
  readonly isInvalid = computed(() => !!this.control()?.errorState());
  /** @internal */
  readonly isDisabled = computed(() => !!this.control()?.disabled());
  /** @internal */
  readonly isRequired = computed(() => !!this.control()?.required());

  /** @internal */
  readonly shouldLabelFloat = computed(() => {
    if (this.floatLabel() === 'always') return true;
    const ctrl = this.control();
    if (!ctrl) return false;
    return ctrl.focused() || !ctrl.empty();
  });

  /** @internal Inline `left` value for the label wrapper. Floated labels pin to the container edge; resting labels align with the infix's left (after any prefix). */
  readonly labelLeft = computed(() =>
    this.shouldLabelFloat() ? '0.5rem' : `${this.restingLabelOffset()}px`,
  );

  /** @internal */
  readonly subscriptMode = computed<'error' | 'hint'>(() =>
    this.isInvalid() && this.errorChildren().length > 0 ? 'error' : 'hint',
  );

  private readonly controlTypeClass = computed(() => {
    const type = this.control()?.controlType;
    return type ? `tw-form-field-type-${type}` : '';
  });

  private readonly variantResult = computed(() =>
    formFieldVariants({
      appearance: this.appearance(),
      color: this.color(),
      focused: this.isFocused(),
      invalid: this.isInvalid(),
      labelFloated: this.shouldLabelFloat(),
      disabled: this.isDisabled(),
    }),
  );

  /** @internal */
  readonly rootClasses = computed(() => {
    const base = this.variantResult().root();
    const type = this.controlTypeClass();
    return type ? `${base} ${type}` : base;
  });
  /** @internal */
  readonly controlWrapperClasses = computed(() => this.variantResult().controlWrapper());
  /** @internal */
  readonly infixClasses = computed(() => {
    const base = this.variantResult().infix();
    const hidePlaceholder = this.hasLabel() && !this.shouldLabelFloat();
    return hidePlaceholder
      ? `${base} [&_input::placeholder]:opacity-0 [&_textarea::placeholder]:opacity-0`
      : base;
  });
  /** @internal */
  readonly labelWrapperClasses = computed(() => this.variantResult().labelWrapper());
  /** @internal */
  readonly labelClasses = computed(() => this.variantResult().label());
  /** @internal */
  readonly requiredMarkerClasses = computed(() => this.variantResult().requiredMarker());
  /** @internal */
  readonly prefixClasses = computed(() => this.variantResult().prefix());
  /** @internal */
  readonly suffixClasses = computed(() => this.variantResult().suffix());
  /** @internal */
  readonly subscriptWrapperClasses = computed(() => this.variantResult().subscriptWrapper());
  /** @internal */
  readonly hintClasses = computed(() => this.variantResult().hint());
  /** @internal */
  readonly errorClasses = computed(() => this.variantResult().error());

  constructor() {
    // Push merged aria-describedby ids to the control whenever hint/error lists or the subscript mode change.
    effect(() => {
      const ctrl = this.control();
      if (!ctrl) return;
      const ids: string[] = [];
      if (this.subscriptMode() === 'error') {
        for (const e of this.errorChildren()) ids.push(e.id);
      } else {
        for (const h of this.hintChildren()) ids.push(h.id);
      }
      const userIds = ctrl.userAriaDescribedBy?.();
      if (userIds) {
        for (const id of userIds.split(/\s+/)) {
          if (id) ids.push(id);
        }
      }
      ctrl.setDescribedByIds(ids);
    });

    // Dev-mode validation: at most one hint per alignment.
    effect(() => {
      if (!isDevMode()) return;
      const hints = this.hintChildren();
      const startCount = hints.filter((h) => h.effectiveAlign() === 'start').length;
      const endCount = hints.filter((h) => h.effectiveAlign() === 'end').length;
      if (startCount > 1 || endCount > 1) {
        throw new Error(
          'tw-form-field: only one twHint per alignment ("start" / "end") is allowed.',
        );
      }
    });

    // Track the infix's left offset so the resting label can sit right after any prefix.
    effect((onCleanup) => {
      const prefixes = this.prefixChildren();
      if (prefixes.length === 0) {
        this.restingLabelOffset.set(12);
        return;
      }
      const infix = this.infixRef()?.nativeElement;
      if (!infix) return;
      const update = (): void => this.restingLabelOffset.set(infix.offsetLeft);
      update();
      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(update);
      for (const p of prefixes) {
        ro.observe(p.elementRef.nativeElement);
      }
      ro.observe(infix);
      onCleanup(() => ro.disconnect());
    });
  }

  ngAfterContentInit(): void {
    if (isDevMode() && !this.control()) {
      throw new Error(
        'tw-form-field requires a child control providing TW_FORM_FIELD_CONTROL. ' +
          'Place a control (e.g. <input twInput />) inside the <tw-form-field>.',
      );
    }
  }

  /** @internal */
  _onContainerClick(event: MouseEvent): void {
    this.control()?.onContainerClick(event);
  }
}
