import {
  type AfterContentInit,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  InjectionToken,
  input,
  isDevMode,
  signal,
  type Signal,
  untracked,
  viewChild,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

/** Visual appearance of the form-field container. */
export type FormFieldAppearance = 'outline' | 'filled';

/** Floating label behavior. `'never'` disables floating entirely; the label wrapper is not rendered and the wrapped control's placeholder is always visible. */
export type FloatLabel = 'auto' | 'always' | 'never';

/** Subscript (hint/error row) sizing strategy. `'fixed'` always reserves vertical space; `'dynamic'` collapses the row when no hint/error is projected. */
export type SubscriptSizing = 'fixed' | 'dynamic';

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
  /**
   * Active validation errors map keyed by validator name (e.g. `{ required: true, email: true }`).
   * Returns `null` when the control has no validation errors.
   *
   * This is the *only* source the form-field consults for `[twError match="…"]` filtering: it
   * feeds `FormFieldComponent.activeErrorKeys`, and an error with a `match` renders only while
   * that key is present. A control that leaves this undefined therefore reports an empty key set,
   * and **every `match`-targeted message under it is permanently hidden** — in all three form
   * strategies, with no warning. Unmatched `[twError]` messages are unaffected; they follow
   * `errorState` alone.
   *
   * Optional only so the member can be added to existing controls without a breaking change. Any
   * control that resolves an `NgControl` should implement it — typically as
   * `computed(() => ngControl?.control?.errors ?? null)`, reading whatever revision signal the
   * control already uses to invalidate `errorState`, so the map tracks validator transitions that
   * do not flip `VALID`/`INVALID`. Omit it only for a control that genuinely has no validation
   * errors to report.
   */
  readonly errors?: Signal<Record<string, unknown> | null>;
  /** Optional control-type identifier (e.g. `'input'`, `'select'`). When set, the form-field appends `tw-form-field-type-{controlType}` to its host for styling hooks. */
  abstract readonly controlType?: string;
  /** Optional consumer-supplied `aria-describedby` ids the form-field preserves when merging in hint/error ids. */
  abstract readonly userAriaDescribedBy?: Signal<string | undefined>;
  /** Optional consumer-supplied `aria-labelledby` ids the form-field preserves when merging in the projected label id. Controls that consume label pushdown (non-native triggers) override this. */
  readonly userAriaLabelledby?: Signal<string | undefined>;

  /** Called by the form-field to push the merged `aria-describedby` ids back onto the control's host element. */
  abstract setDescribedByIds(ids: string[]): void;
  /** Called when the form-field container is clicked. Concrete controls typically focus their underlying native element or open a panel. */
  abstract onContainerClick(event: MouseEvent): void;
  /**
   * Called by the form-field to push the merged `aria-labelledby` ids onto the control's host element.
   * Default is a no-op — native `<input>` controls rely on the label's `for=` attribute for the canonical association.
   * Non-native controls (combobox triggers, date-pickers, etc.) override this to set the attribute explicitly.
   */
  setLabelledByIds(_ids: string[]): void {
    // Default no-op. Controls override when label pushdown is required for accessibility.
  }
}

/**
 * Injection token matching {@link FormFieldControl}. Controls register via
 * `providers: [{ provide: TW_FORM_FIELD_CONTROL, useExisting: MyControl }]`.
 */
export const TW_FORM_FIELD_CONTROL = new InjectionToken<FormFieldControl<unknown>>(
  'TW_FORM_FIELD_CONTROL',
);

/**
 * Minimal surface a wrapped control reads from its surrounding form-field —
 * presence (via optional injection) plus whether a label is projected — without
 * depending on the concrete {@link FormFieldComponent}. Controls inject
 * {@link TW_FORM_FIELD} typed as this interface so detecting a parent form-field
 * never pins the heavier component class into the control's own bundle.
 */
export interface TwFormFieldParent {
  /** Whether a `twLabel` element is projected into the form-field. */
  readonly hasLabel: Signal<boolean>;
}

/**
 * Injection token exposing the wrapping {@link TwFormFieldParent}. The
 * {@link FormFieldComponent} provides itself under this token; controls inject
 * it with `{ optional: true }` to detect (and read label state from) a parent
 * `tw-form-field` without referencing the concrete component class — keeping the
 * form-field component out of each control's bundle.
 */
export const TW_FORM_FIELD = new InjectionToken<TwFormFieldParent>('TW_FORM_FIELD');

// Resting-label left offset used when the field has no prefix: matches the control row's own
// horizontal padding so the label lines up with the control's text.
const DEFAULT_RESTING_LABEL_OFFSET_PX = 12;

// ── Unique ID counters ──
let nextLabelId = 0;
let nextHintId = 0;
let nextErrorId = 0;

// ── tv() config ──

const formFieldVariants = tv({
  slots: {
    root: 'block text-fg',
    controlWrapper:
      'relative flex items-stretch gap-2 rounded-md bg-transparent transition-colors duration-normal motion-reduce:transition-none',
    infix: 'relative flex-1 flex items-center min-w-0 [&_input::placeholder]:transition-opacity [&_input::placeholder]:duration-normal [&_textarea::placeholder]:transition-opacity [&_textarea::placeholder]:duration-normal',
    labelWrapper:
      'absolute pointer-events-none flex items-center max-w-[calc(100%-1.5rem)] transition-[top,left,color,transform] duration-normal motion-reduce:transition-none origin-[top_left]',
    label:
      'text-fg-muted truncate transition-[font-size,color] duration-normal motion-reduce:transition-none',
    requiredMarker: 'text-error-600 ml-0.5',
    prefix: 'flex items-center shrink-0 text-fg-muted',
    suffix: 'flex items-center shrink-0 text-fg-muted',
    subscriptWrapper: 'mt-1 text-xs flex gap-2',
    hint: 'text-fg-muted',
    error: 'text-error-600 font-medium',
  },
  variants: {
    appearance: {
      outline: {
        controlWrapper: 'border border-border hover:border-border-strong',
      },
      filled: {
        controlWrapper:
          'bg-surface-muted border-b border-border hover:bg-surface-sunken',
        infix: 'items-end',
      },
    },
    // Density of the control row. Two things ride this axis:
    //
    // 1. The font scale, on `controlWrapper` rather than `infix`. A nested
    //    control strips its own `text-*` (see `inputVariants`' `inFormField`
    //    branch), so without this the row inherited the ambient 16px/24px line
    //    box at every size and the size axis did nothing vertically. It sits on
    //    `controlWrapper` so the prefix and suffix adornments scale with the
    //    control instead of driving the row taller than the control it wraps;
    //    the `label` slot sets its own `text-*` per (size, labelFloated) and so
    //    is unaffected.
    // 2. The `min-h-*` floor from the control-height scale
    //    (`docs/vertical-rhythm.md`). A floor rather than a pinned height
    //    because a form-field wraps arbitrary consumer controls — a textarea,
    //    a wrapping tag list — and must be free to grow. The vertical padding
    //    is deliberately retained for the same reason: it is the only vertical
    //    breathing room a nested `p-0` control has.
    size: {
      xs: { controlWrapper: 'min-h-6 text-xs' },
      sm: { controlWrapper: 'min-h-8 text-sm' },
      md: { controlWrapper: 'min-h-9 text-sm' },
      lg: { controlWrapper: 'min-h-11 text-base' },
      xl: { controlWrapper: 'min-h-12 text-base' },
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
      },
      false: {
        labelWrapper: 'top-1/2 -translate-y-1/2 left-3',
      },
    },
    subscriptReserve: {
      true: { subscriptWrapper: 'min-h-5' },
      false: {},
    },
    // The disabled treatment splits across two slots on purpose.
    //
    // `opacity-50` moved OFF `root`. `root` wraps both the control row and the
    // subscript (hint/error) row, so dimming it composited every hint down to
    // 50% alpha over the page surface. At that alpha no foreground token can
    // reach AA: pure black at 50% over white is #808080 = 3.95:1, and
    // `text-fg-muted` (gray-600, 7.56:1 at rest) measured 2.34:1 light /
    // 3.92:1 dark. That is a real SC 1.4.3 failure — a hint is a description OF
    // the control, not part OF the inactive control, so it does not inherit
    // 1.4.3's inactive-component exemption — and it is the text most worth
    // reading on a disabled field ("Disabled — slugs can no longer be edited").
    // The label wrapper is nested inside `controlWrapper` (see
    // `form-field.html`), so the label keeps exactly the dimming it had, and
    // axe already exempts it anyway via its `<label for>` → disabled control.
    //
    // `pointer-events-none` deliberately STAYS on `root`. Moving it would make
    // the subscript row live again, and the host's `(click)` forwards to
    // `control.onContainerClick()` — which not every wrapped control guards on
    // its disabled state. Keeping it on the host preserves the interaction
    // semantics exactly; only the composited alpha changes.
    disabled: {
      true: { root: 'pointer-events-none', controlWrapper: 'opacity-50' },
      false: {},
    },
  },
  compoundVariants: [
    // ── Padding × (appearance, size) ──
    // Vertical padding sits one half-step below the inline-padding scale so the
    // `min-h-*` floor on the control row actually BINDS at rest. With the
    // nominal padding the natural height (padding + line box + 2px border)
    // lands 2px above the floor at every size, leaving the floor inert and a
    // wrapped control 2px taller than the same control standalone. The padding
    // still governs the multi-line case (textarea), where the row grows past
    // the floor. `filled` is deliberately NOT shifted — its asymmetric
    // `pt-*`/`pb-*` reserves room for the floating label and is taller by design.
    { appearance: 'outline', size: 'xs', class: { controlWrapper: 'px-2 py-0.5' } },
    { appearance: 'outline', size: 'sm', class: { controlWrapper: 'px-3 py-1' } },
    { appearance: 'outline', size: 'md', class: { controlWrapper: 'px-3 py-1.5' } },
    { appearance: 'outline', size: 'lg', class: { controlWrapper: 'px-4 py-2' } },
    { appearance: 'outline', size: 'xl', class: { controlWrapper: 'px-5 py-2.5' } },
    { appearance: 'filled', size: 'xs', class: { controlWrapper: 'px-2 pt-5 pb-1' } },
    { appearance: 'filled', size: 'sm', class: { controlWrapper: 'px-3 pt-5 pb-1.5' } },
    { appearance: 'filled', size: 'md', class: { controlWrapper: 'px-3 pt-6 pb-2' } },
    { appearance: 'filled', size: 'lg', class: { controlWrapper: 'px-4 pt-7 pb-2.5' } },
    { appearance: 'filled', size: 'xl', class: { controlWrapper: 'px-5 pt-8 pb-3' } },

    // ── Label font-size × (size, labelFloated) ──
    { size: 'xs', labelFloated: false, class: { label: 'text-xs' } },
    { size: 'xs', labelFloated: true, class: { label: 'text-2xs' } },
    { size: 'sm', labelFloated: false, class: { label: 'text-sm' } },
    { size: 'sm', labelFloated: true, class: { label: 'text-xs' } },
    { size: 'md', labelFloated: false, class: { label: 'text-sm' } },
    { size: 'md', labelFloated: true, class: { label: 'text-xs' } },
    { size: 'lg', labelFloated: false, class: { label: 'text-base' } },
    { size: 'lg', labelFloated: true, class: { label: 'text-sm' } },
    { size: 'xl', labelFloated: false, class: { label: 'text-base' } },
    { size: 'xl', labelFloated: true, class: { label: 'text-sm' } },

    // ── Outline + focused → colored border ──
    { appearance: 'outline', focused: true, color: 'primary', class: { controlWrapper: 'border-primary-border' } },
    { appearance: 'outline', focused: true, color: 'secondary', class: { controlWrapper: 'border-secondary-border' } },
    { appearance: 'outline', focused: true, color: 'accent', class: { controlWrapper: 'border-accent-border' } },
    { appearance: 'outline', focused: true, color: 'neutral', class: { controlWrapper: 'border-border-strong' } },
    { appearance: 'outline', focused: true, color: 'info', class: { controlWrapper: 'border-info-border' } },
    { appearance: 'outline', focused: true, color: 'success', class: { controlWrapper: 'border-success-border' } },
    { appearance: 'outline', focused: true, color: 'warning', class: { controlWrapper: 'border-warning-border' } },
    { appearance: 'outline', focused: true, color: 'error', class: { controlWrapper: 'border-error-border' } },

    // ── Filled + focused → colored bottom border ──
    { appearance: 'filled', focused: true, color: 'primary', class: { controlWrapper: 'border-b-2 border-primary-border' } },
    { appearance: 'filled', focused: true, color: 'secondary', class: { controlWrapper: 'border-b-2 border-secondary-border' } },
    { appearance: 'filled', focused: true, color: 'accent', class: { controlWrapper: 'border-b-2 border-accent-border' } },
    { appearance: 'filled', focused: true, color: 'neutral', class: { controlWrapper: 'border-b-2 border-border-strong' } },
    { appearance: 'filled', focused: true, color: 'info', class: { controlWrapper: 'border-b-2 border-info-border' } },
    { appearance: 'filled', focused: true, color: 'success', class: { controlWrapper: 'border-b-2 border-success-border' } },
    { appearance: 'filled', focused: true, color: 'warning', class: { controlWrapper: 'border-b-2 border-warning-border' } },
    { appearance: 'filled', focused: true, color: 'error', class: { controlWrapper: 'border-b-2 border-error-border' } },

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

    // ── Filled + resting label → align vertically with the input baseline (input is items-end inside an asymmetric pt/pb container) ──
    { appearance: 'filled', labelFloated: false, class: { labelWrapper: 'top-[calc(50%+0.5rem)]' } },

    // ── Invalid overrides (declared last so twMerge lets them win) ──
    { invalid: true, appearance: 'outline', class: { controlWrapper: 'border-error-border' } },
    { invalid: true, appearance: 'filled', class: { controlWrapper: 'border-b-2 border-error-border' } },
    { invalid: true, labelFloated: true, class: { label: 'text-error-600' } },
  ],
  defaultVariants: {
    appearance: 'outline',
    size: 'md',
    color: 'primary',
    focused: false,
    invalid: false,
    labelFloated: false,
    subscriptReserve: true,
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
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** @internal */
  readonly id = `tw-form-field-label-${nextLabelId++}`;

  /** @internal */
  readonly controlId = computed(() => this.formField.control()?.id() ?? null);

  /** @internal */
  readonly classes = computed(() => this.formField.labelClasses());

  constructor() {
    if (isDevMode()) {
      const tag = this.elementRef.nativeElement.tagName;
      if (tag !== 'LABEL') {
        console.warn(
          `[tw-form-field] twLabel should be applied to a <label> element for the native \`for\`/\`id\` association to work; got <${tag.toLowerCase()}>. Non-native controls (e.g. tw-select) still receive label pushdown via aria-labelledby.`,
        );
      }
    }
  }
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
    '[class.hidden]': '!shouldShow()',
  },
})
export class ErrorDirective {
  private readonly formField = inject(FormFieldComponent);

  /** @internal */
  readonly id = `tw-form-field-error-${nextErrorId++}`;

  /** Validation error key this message is bound to (e.g. `'required'`, `'email'`, `'minlength'`). When set, the error renders only while the surrounding control reports that key in its active validation errors. When omitted, the error displays whenever the form-field is in an error state — useful as a generic fallback. */
  readonly match = input<string | undefined>(undefined);

  /** @internal Whether this error should display given the control's active error keys. */
  readonly shouldShow = computed(() => {
    const key = this.match();
    if (!key) return true;
    return this.formField.activeErrorKeys().has(key);
  });

  /** @internal */
  readonly classes = computed(() => this.formField.errorClasses());
}

// ── PrefixDirective ──

@Directive({
  selector: '[twPrefix]',
  host: {
    '[class]': 'prefixClasses()',
  },
})
export class PrefixDirective {
  protected readonly formField = inject(FormFieldComponent);

  /** @internal Used by the form-field to measure the prefix area and align the resting label after it. */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  /** @internal */
  readonly prefixClasses = computed(() => this.formField.prefixClasses());
}

// ── SuffixDirective ──

@Directive({
  selector: '[twSuffix]',
  host: {
    '[class]': 'suffixClasses()',
  },
})
export class SuffixDirective {
  protected readonly formField = inject(FormFieldComponent);

  /** @internal */
  readonly suffixClasses = computed(() => this.formField.suffixClasses());
}

// ── PrefixIconDirective / SuffixIconDirective ──
// Opt-in directives that apply a glyph-sized adornment (`size-5 text-fg-muted shrink-0`) so consumers
// don't pick `size-4` vs `size-5` ad-hoc. Use these for SVG icons; use [twPrefix]/[twSuffix]
// when the adornment is text (currency, units, kbd hints).
// They extend Prefix/SuffixDirective so the form-field's content query picks them up as a prefix/suffix
// when computing the resting-label offset.

@Directive({
  selector: '[twPrefixIcon]',
  host: {
    '[class]': 'prefixClasses()',
  },
  providers: [{ provide: PrefixDirective, useExisting: PrefixIconDirective }],
})
export class PrefixIconDirective extends PrefixDirective {
  /** @internal */
  override readonly prefixClasses = computed(
    () => `${this.formField.prefixClasses()} size-5`,
  );
}

@Directive({
  selector: '[twSuffixIcon]',
  host: {
    '[class]': 'suffixClasses()',
  },
  providers: [{ provide: SuffixDirective, useExisting: SuffixIconDirective }],
})
export class SuffixIconDirective extends SuffixDirective {
  /** @internal */
  override readonly suffixClasses = computed(
    () => `${this.formField.suffixClasses()} size-5`,
  );
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
  providers: [
    { provide: TW_FORM_FIELD, useExisting: forwardRef(() => FormFieldComponent) },
  ],
})
export class FormFieldComponent implements AfterContentInit, TwFormFieldParent {
  /** Visual appearance of the field container. `'outline'` draws a full border around the control; `'filled'` uses a filled surface with a bottom border. Defaults to `'outline'`. */
  readonly appearance = input<FormFieldAppearance>('outline');

  /** Density of the field container. Maps to the inline-padding scale (`px-2 py-1` xs … `px-5 py-3` xl), the control-row font scale (`text-xs` xs, `text-sm` sm/md, `text-base` lg/xl — inherited by the nested control and by prefix/suffix adornments), the label font scale, and a `min-h-*` floor on the control row from the control-height scale (24/32/36/44/48px). The floor is a minimum, not a fixed height: the row grows for a textarea or any other multi-line control. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Floating label behavior. `'auto'` floats when focused or non-empty; `'always'` stays floated; `'never'` disables floating entirely (the label wrapper is not rendered and the wrapped control's placeholder is always visible). Defaults to `'auto'`. */
  readonly floatLabel = input<FloatLabel>('auto');

  /** Subscript sizing strategy. `'fixed'` always reserves a 20px row for hints/errors so adjacent fields align; `'dynamic'` collapses the row when no hint/error is projected. Defaults to `'fixed'`. */
  readonly subscriptSizing = input<SubscriptSizing>('fixed');

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
  private readonly restingLabelOffset = signal(DEFAULT_RESTING_LABEL_OFFSET_PX);

  /** @internal */
  readonly isFocused = computed(() => !!this.control()?.focused());
  /** @internal */
  readonly isInvalid = computed(() => !!this.control()?.errorState());
  /** @internal */
  readonly isDisabled = computed(() => !!this.control()?.disabled());
  /** @internal */
  readonly isRequired = computed(() => !!this.control()?.required());

  /** @internal Whether the floating label wrapper should render at all. `'never'` opts out entirely. */
  readonly shouldRenderLabelWrapper = computed(
    () => this.hasLabel() && this.floatLabel() !== 'never',
  );

  /** @internal */
  readonly shouldLabelFloat = computed(() => {
    const mode = this.floatLabel();
    if (mode === 'never') return false;
    if (mode === 'always') return true;
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

  /** @internal Set of validation error keys currently active on the bound control (e.g. `Set('required', 'email')`). Empty when the control has no `errors` signal or no active errors. Read by `[twError match="…"]` to decide whether to display. */
  readonly activeErrorKeys = computed<ReadonlySet<string>>(() => {
    const errs = this.control()?.errors?.();
    return new Set(errs ? Object.keys(errs) : []);
  });

  /** @internal Whether the subscript row has anything to render right now. */
  readonly hasSubscriptContent = computed(() => {
    if (this.subscriptMode() === 'error') return this.errorChildren().length > 0;
    return this.hintChildren().length > 0;
  });

  /** @internal Whether the subscript wrapper renders. In `'fixed'` mode it always renders to reserve vertical space; in `'dynamic'` mode it collapses when empty. */
  readonly shouldRenderSubscript = computed(() => {
    if (this.subscriptSizing() === 'fixed') return true;
    return this.hasSubscriptContent();
  });

  private readonly controlTypeClass = computed(() => {
    const type = this.control()?.controlType;
    return type ? `tw-form-field-type-${type}` : '';
  });

  private readonly variantResult = computed(() =>
    formFieldVariants({
      appearance: this.appearance(),
      size: this.size(),
      color: this.color(),
      focused: this.isFocused(),
      invalid: this.isInvalid(),
      labelFloated: this.shouldLabelFloat(),
      subscriptReserve: this.subscriptSizing() === 'fixed',
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
    // Hide the placeholder while the resting label is occupying the same space.
    // `floatLabel='never'` keeps the placeholder visible regardless of label projection.
    const hidePlaceholder =
      this.shouldRenderLabelWrapper() && !this.shouldLabelFloat();
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
    // Push merged aria-describedby ids to the control whenever hint/error lists, the subscript mode, or per-error `match` visibility change.
    effect(() => {
      const ctrl = this.control();
      if (!ctrl) return;
      const ids: string[] = [];
      if (this.subscriptMode() === 'error') {
        for (const e of this.errorChildren()) {
          // Filter by `shouldShow()` so `[twError match="…"]` entries that
          // don't match the active validation keys are not announced.
          if (e.shouldShow()) ids.push(e.id);
        }
      } else {
        for (const h of this.hintChildren()) ids.push(h.id);
      }
      const userIds = ctrl.userAriaDescribedBy?.();
      if (userIds) {
        for (const id of userIds.split(/\s+/)) {
          if (id) ids.push(id);
        }
      }
      untracked(() => ctrl.setDescribedByIds(ids));
    });

    // Push merged aria-labelledby ids (projected label id + user-supplied) to the control.
    // Native inputs ignore this in practice (the `for=`/`id` association wins) but non-native
    // triggers (combobox, date-picker) need the explicit attribute for screen readers.
    effect(() => {
      const ctrl = this.control();
      if (!ctrl) return;
      const ids: string[] = [];
      const labelId = this.labelChild()?.id;
      if (labelId && this.shouldRenderLabelWrapper()) ids.push(labelId);
      const userIds = ctrl.userAriaLabelledby?.();
      if (userIds) {
        for (const id of userIds.split(/\s+/)) {
          if (id) ids.push(id);
        }
      }
      untracked(() => ctrl.setLabelledByIds(ids));
    });

    // Dev-mode validation: at most one hint per alignment.
    // Reports via `console.error` instead of `throw` so an authoring mistake
    // surfaces during development without crashing the surrounding effect graph
    // (which would otherwise leave Angular in an unrecoverable error state).
    effect(() => {
      if (!isDevMode()) return;
      const hints = this.hintChildren();
      const startCount = hints.filter((h) => h.effectiveAlign() === 'start').length;
      const endCount = hints.filter((h) => h.effectiveAlign() === 'end').length;
      if (startCount > 1 || endCount > 1) {
        console.error(
          'tw-form-field: only one twHint per alignment ("start" / "end") is allowed.',
        );
      }
    });

    // Track the infix's left offset so the resting label can sit right after any prefix.
    //
    // The measurement lives in `afterRenderEffect`'s `earlyRead` phase, NOT in a plain
    // `effect()`. `effect()` runs inside `refreshView` *after* this component's own template but
    // *before* its embedded views, content queries, host bindings and child components are
    // refreshed, so `offsetLeft` read there samples geometry that predates the very change that
    // triggered the run — a prefix appearing inside an `@if`, for instance. `earlyRead` runs
    // after the whole render has committed, which is what it exists for.
    //
    // `afterRenderEffect` is a *reactive* effect scheduled into a render phase, not an
    // every-render hook: it re-runs only when a tracked producer changes. The tracked producers
    // here are `prefixChildren()` and `infixRef()` — exactly the set the previous `effect()`
    // tracked, so this is a timing fix, not a coverage fix. A prefix that changes width without
    // changing the prefix set is invisible to the signal graph either way, which is why the
    // ResizeObserver below stays.
    afterRenderEffect({
      earlyRead: () => {
        if (this.prefixChildren().length === 0) return DEFAULT_RESTING_LABEL_OFFSET_PX;
        const infix = this.infixRef()?.nativeElement;
        // `null` means "nothing measurable this run" — leave the previous offset in place.
        return infix ? infix.offsetLeft : null;
      },
      write: (offset) => {
        const px = offset();
        if (px !== null) this.restingLabelOffset.set(px);
      },
    });

    // Keep the offset fresh when an already-mounted prefix changes size. Creating the observer
    // is a subscription, not a layout read, so a plain `effect()` is the right hook; the
    // callback itself is delivered after layout, so its `offsetLeft` read is safe. Note this
    // repairs *size* changes only — an infix that shifts position with no observed box resizing
    // is not covered here and not covered by the render effect above either.
    effect((onCleanup) => {
      const prefixes = this.prefixChildren();
      if (prefixes.length === 0) return;
      const infix = this.infixRef()?.nativeElement;
      if (!infix) return;
      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(() =>
        this.restingLabelOffset.set(infix.offsetLeft),
      );
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
