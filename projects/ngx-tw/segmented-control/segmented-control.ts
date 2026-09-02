import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  isDevMode,
  linkedSignal,
  model,
  type OnInit,
  signal,
  type Signal,
} from '@angular/core';
import {
  type ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import { Directionality } from '@angular/cdk/bidi';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { tv } from 'tailwind-variants';
import {
  type ErrorStateMatcher,
  TW_ERROR_STATE_MATCHER,
  type TwColor,
  type TwFormSubmitted,
  type TwOrientation,
  type TwSize,
} from '@cdevhub/ngx-tw/core';

/** Visual style of the active indicator. */
export type SegmentedControlVariant =
  | 'surface'
  | 'solid'
  | 'outline'
  | SegmentedControlVariantLegacy;

/**
 * Legacy `variant` spellings, kept so existing templates keep compiling.
 *
 * @deprecated `'filled'` is an alias for `'solid'`; it will be removed in the next
 * major. Prefer `'solid'`.
 */
export type SegmentedControlVariantLegacy = 'filled';

/** Canonical `variant` spellings — the set `tv()` actually keys on. */
type SegmentedControlVariantCanonical = Exclude<
  SegmentedControlVariant,
  SegmentedControlVariantLegacy
>;

/** Maps every legacy spelling onto its canonical replacement. */
const VARIANT_ALIASES: Readonly<
  Record<SegmentedControlVariantLegacy, SegmentedControlVariantCanonical>
> = {
  filled: 'solid',
};

/** Border-radius shape of the container and options. */
export type SegmentedControlRounded = 'pill' | 'md';

// ── tv() config ──
// All slot styling — base, size, orientation, rounded, variant × color × active,
// disabled — flows through this single config. Static literal class strings are
// required so the Tailwind v4 JIT scanner picks them up; new
// `{role}-{solid,fg,border-strong}` combinations need a matching entry in
// `theme/index.css`'s `@source inline(...)` safelist.

const segmentedControlVariants = tv({
  slots: {
    root: 'inline-flex bg-surface-muted p-1',
    option:
      'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap cursor-pointer transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
  },
  variants: {
    // Pinned control heights — see `docs/vertical-rhythm.md`. The option carries
    // horizontal padding and font size only; the height itself is pinned in the
    // orientation-keyed compound variants below, because *which box* owns the
    // pin depends on the axis (root when horizontal, option when vertical).
    size: {
      xs: { option: 'px-2 text-xs' },
      sm: { option: 'px-3 text-sm' },
      md: { option: 'px-4 text-sm' },
      lg: { option: 'px-5 text-base' },
      xl: { option: 'px-6 text-base' },
    },
    orientation: {
      horizontal: { root: 'flex-row gap-1' },
      vertical: { root: 'flex-col gap-1' },
    },
    rounded: {
      pill: { root: 'rounded-full', option: 'rounded-full' },
      md: { root: 'rounded-md', option: 'rounded-md' },
    },
    // `variant` and `color` participate only via `compoundVariants` below —
    // their per-axis entries are intentionally empty so the cartesian product
    // (3 variants × 8 colors × 2 active states = 48 compound entries) owns
    // all active styling without per-axis defaults bleeding through.
    variant: {
      surface: {},
      solid: {},
      outline: {},
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
    active: {
      true: {},
      false: { option: 'text-fg-muted hover:text-fg' },
    },
    disabled: {
      true: { option: 'opacity-50 pointer-events-none cursor-default' },
      false: {},
    },
  },
  compoundVariants: [
    // ── Pinned heights (docs/vertical-rhythm.md) ──
    // Horizontal: the *root* is the single-line control, so the pin lives there.
    // The `p-1` recessed track stays (it is the component's visual identity) and
    // is absorbed by the pinned box under `box-sizing: border-box`; the root is
    // `inline-flex` with the default `align-items: stretch`, so each option fills
    // the remaining height without a pin of its own.
    //
    // `xs` is the exception, and it is an accessibility floor rather than a
    // style choice. The option — not the root — carries `role="radio"`, the
    // tabindex and the click handler, so the option IS the target. A 24px root
    // minus a 4px inset per side leaves a 16px target, under the WCAG 2.2
    // SC 2.5.8 (AA) 24px minimum. An inset track and a 24px target cannot both
    // fit inside 24px, so at `xs` the inset is dropped: the option fills the
    // full 24px and `gap-1` alone carries the track read. Widening the root to
    // 32px instead would restore the inset but break the shared control height
    // that lets a segmented control sit flush beside a button or input.
    { orientation: 'horizontal', size: 'xs', class: { root: 'h-6 p-0' } },
    { orientation: 'horizontal', size: 'sm', class: { root: 'h-8' } },
    { orientation: 'horizontal', size: 'md', class: { root: 'h-9' } },
    { orientation: 'horizontal', size: 'lg', class: { root: 'h-11' } },
    { orientation: 'horizontal', size: 'xl', class: { root: 'h-12' } },
    // Vertical: the root grows with the option count, so pinning it would crush
    // the stack. Each option is its own single-line control row instead, which
    // reproduces the pre-migration vertical height exactly (padding-derived
    // before, declared now).
    { orientation: 'vertical', size: 'xs', class: { option: 'h-6' } },
    { orientation: 'vertical', size: 'sm', class: { option: 'h-8' } },
    { orientation: 'vertical', size: 'md', class: { option: 'h-9' } },
    { orientation: 'vertical', size: 'lg', class: { option: 'h-11' } },
    { orientation: 'vertical', size: 'xl', class: { option: 'h-12' } },
    // surface × color × active=true
    { variant: 'surface', color: 'primary', active: true, class: { option: 'bg-surface shadow-sm text-primary-fg' } },
    { variant: 'surface', color: 'secondary', active: true, class: { option: 'bg-surface shadow-sm text-secondary-fg' } },
    { variant: 'surface', color: 'accent', active: true, class: { option: 'bg-surface shadow-sm text-accent-fg' } },
    { variant: 'surface', color: 'neutral', active: true, class: { option: 'bg-surface shadow-sm text-fg' } },
    { variant: 'surface', color: 'info', active: true, class: { option: 'bg-surface shadow-sm text-info-fg' } },
    { variant: 'surface', color: 'success', active: true, class: { option: 'bg-surface shadow-sm text-success-fg' } },
    { variant: 'surface', color: 'warning', active: true, class: { option: 'bg-surface shadow-sm text-warning-fg' } },
    { variant: 'surface', color: 'error', active: true, class: { option: 'bg-surface shadow-sm text-error-fg' } },
    // solid × color × active=true
    { variant: 'solid', color: 'primary', active: true, class: { option: 'bg-primary-solid text-primary-solid-fg shadow-sm' } },
    { variant: 'solid', color: 'secondary', active: true, class: { option: 'bg-secondary-solid text-secondary-solid-fg shadow-sm' } },
    { variant: 'solid', color: 'accent', active: true, class: { option: 'bg-accent-solid text-accent-solid-fg shadow-sm' } },
    { variant: 'solid', color: 'neutral', active: true, class: { option: 'bg-neutral-solid text-neutral-solid-fg shadow-sm' } },
    { variant: 'solid', color: 'info', active: true, class: { option: 'bg-info-solid text-info-solid-fg shadow-sm' } },
    { variant: 'solid', color: 'success', active: true, class: { option: 'bg-success-solid text-success-solid-fg shadow-sm' } },
    { variant: 'solid', color: 'warning', active: true, class: { option: 'bg-warning-solid text-warning-solid-fg shadow-sm' } },
    { variant: 'solid', color: 'error', active: true, class: { option: 'bg-error-solid text-error-solid-fg shadow-sm' } },
    // outline × color × active=true
    { variant: 'outline', color: 'primary', active: true, class: { option: 'ring-2 ring-primary-border-strong text-primary-fg' } },
    { variant: 'outline', color: 'secondary', active: true, class: { option: 'ring-2 ring-secondary-border-strong text-secondary-fg' } },
    { variant: 'outline', color: 'accent', active: true, class: { option: 'ring-2 ring-accent-border-strong text-accent-fg' } },
    { variant: 'outline', color: 'neutral', active: true, class: { option: 'ring-2 ring-border-strong text-fg' } },
    { variant: 'outline', color: 'info', active: true, class: { option: 'ring-2 ring-info-border-strong text-info-fg' } },
    { variant: 'outline', color: 'success', active: true, class: { option: 'ring-2 ring-success-border-strong text-success-fg' } },
    { variant: 'outline', color: 'warning', active: true, class: { option: 'ring-2 ring-warning-border-strong text-warning-fg' } },
    { variant: 'outline', color: 'error', active: true, class: { option: 'ring-2 ring-error-border-strong text-error-fg' } },
  ],
  defaultVariants: {
    size: 'md',
    orientation: 'horizontal',
    rounded: 'pill',
    variant: 'surface',
    color: 'primary',
    active: false,
    disabled: false,
  },
}, { twMerge: true });

// ── SegmentedControlOptionComponent ──

let nextId = 0;

@Component({
  selector: 'tw-segmented-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    'role': 'radio',
    '[id]': 'id',
    '[class]': 'classes()',
    '[attr.aria-checked]': 'isActive()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.tabindex]': 'isFocusable() ? 0 : -1',
    '(click)': 'select()',
  },
})
export class SegmentedControlOptionComponent {
  /** Unique value identifying this option. Required. */
  readonly value = input.required<string>();

  /** When true, this option cannot be selected and is skipped by keyboard navigation. Defaults to `false`. */
  readonly disabled = input(false);

  readonly elementRef = inject(ElementRef<HTMLElement>);
  // `{ optional: true }` so the dev-mode guard below can fire a clearer
  // error than a raw DI failure when the option is rendered outside a
  // `<tw-segmented-control>`. All downstream reads use `this.parent?.` so
  // production misconfiguration degrades cleanly to a non-interactive option
  // (the dev `console.error` makes the cause obvious during development).
  private readonly parent: SegmentedControlComponent | null = inject(
    forwardRef(() => SegmentedControlComponent),
    { optional: true },
  );

  readonly id = `tw-segmented-option-${nextId++}`;

  constructor() {
    if (isDevMode() && !this.parent) {
      console.error(
        '<tw-segmented-option> must be a child of <tw-segmented-control>.',
      );
    }
  }

  readonly isActive = computed(() => this.parent?.activeValue() === this.value());

  readonly isDisabled = computed(() => this.disabled() || (this.parent?.isDisabled() ?? false));

  readonly isFocusable = computed(() => {
    if (this.isDisabled()) return false;
    if (this.isActive()) return true;
    // Roving-tabindex recovery. The fallback used to be gated on
    // `activeValue() === null`, which is a strict check: `undefined`, `''`, a
    // stale id, or an active option that is itself disabled all left NO
    // option tabbable and dropped the whole control out of the tab order
    // (WCAG SC 2.1.1). The real condition is "no enabled option is active".
    const opts = this.parent?.options() ?? [];
    const hasTabbableActive = opts.some(
      (o: SegmentedControlOptionComponent) => o.isActive() && !o.isDisabled(),
    );
    if (hasTabbableActive) return false;
    const first = opts.find((o: SegmentedControlOptionComponent) => !o.isDisabled());
    return first?.value() === this.value();
  });

  readonly classes = computed(() => {
    const result = segmentedControlVariants({
      size: this.parent?.size() ?? 'md',
      orientation: this.parent?.orientation() ?? 'horizontal',
      rounded: this.parent?.effectiveRounded() ?? 'pill',
      variant: this.parent?.resolvedVariant() ?? 'surface',
      color: this.parent?.color() ?? 'primary',
      active: this.isActive(),
      disabled: this.isDisabled(),
    });
    return result.option();
  });

  /** Selects this option in the parent segmented control. No-op when the option is disabled. */
  select(): void {
    if (this.isDisabled()) return;
    this.parent?.selectOption(this.value());
  }

  /** Moves DOM focus to this option's element. Called by the parent group's arrow-key handler, which moves focus and selection together (selection-follows-focus, as WAI-ARIA APG specifies for a radiogroup). */
  focus(): void {
    this.elementRef.nativeElement.focus();
  }
}

// ── SegmentedControlComponent ──

@Component({
  selector: 'tw-segmented-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  // No static `NG_VALUE_ACCESSOR` provider: this control injects
  // `NgControl` with `{ self: true }` for `TW_ERROR_STATE_MATCHER`
  // integration, and a static provider on the same element creates circular
  // DI against it. The accessor is registered by runtime assignment in the
  // constructor instead — see the constructor comment for why that must be
  // the constructor and not `ngOnInit`.
  host: {
    'role': 'radiogroup',
    '[class]': 'rootClasses()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-invalid]': 'errorState() || null',
    '[attr.aria-required]': 'required() || null',
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class SegmentedControlComponent implements ControlValueAccessor, OnInit {
  /** Controls the active indicator style. `'surface'` shows a raised white pill; `'solid'` shows a solid colored background; `'outline'` shows a colored ring border. Defaults to `'surface'`. `'filled'` is a deprecated alias for `'solid'`. */
  readonly variant = input<SegmentedControlVariant>('surface');

  /** Sets the semantic color for the active option indicator. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls padding, font size, and gap of options. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Layout direction of the control. Defaults to `'horizontal'`. */
  readonly orientation = input<TwOrientation>('horizontal');

  /** Controls the border-radius shape of the container and options. `'pill'` uses fully rounded corners; `'md'` uses standard radius. Vertical orientation forces `'md'`. Defaults to `'pill'`. */
  readonly rounded = input<SegmentedControlRounded>('pill');

  /** When true, prevents all interaction and applies muted styling. Defaults to `false`. */
  readonly disabled = input(false);

  /** When true, sets `aria-required="true"` on the radiogroup so assistive tech announces a choice is mandatory. Also inferred from `Validators.required` on a bound control, so a reactive/template-driven form does not have to state it twice. Defaults to `false`. */
  readonly requiredInput = input(false, { alias: 'required' });

  /** Per-instance override of the {@link ErrorStateMatcher}. When omitted, the control uses the `TW_ERROR_STATE_MATCHER` token's value. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  /** The value of the currently selected option. Two-way bound. Updates on user selection. Defaults to `null`. */
  readonly value = model<string | null>(null);

  /** @internal */
  readonly options = contentChildren(SegmentedControlOptionComponent);

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly parentForm = inject(NgForm, { optional: true });
  private readonly parentFormGroup = inject(FormGroupDirective, { optional: true });
  private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);
  /**
   * Optional so a consumer that never imports `BidiModule` still gets a working
   * control — arrow navigation falls back to LTR when the token is absent. Read
   * imperatively inside the keydown handler; nothing here needs to re-render on
   * a direction change.
   */
  private readonly directionality = inject(Directionality, { optional: true });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly cvaDisabled = signal(false);
  private readonly _ngControlRev = signal(0);
  private readonly _formSubmitRev = signal(0);

  constructor() {
    // Material-style CVA wiring: declare ourselves as the value accessor on any
    // host-level `NgControl` (FormControlDirective, NgModel, etc.). This avoids
    // the circular-DI that a static `NG_VALUE_ACCESSOR` provider would create
    // because `NgControl` is injected with `self: true` on the same element.
    //
    // The assignment MUST stay in the constructor. This component exposes a
    // `value` model(), so Angular v22 would otherwise compile it as a
    // signal-forms *custom control* and skip `setUpValidators` entirely — a
    // silent validator drop that no value/disabled test can catch.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  /**
   * @internal Resolved required state: the `required` input OR'd with
   * `Validators.required` on a bound `NgControl`. The OR (rather than a
   * validator-only read) is what keeps signal forms working — `cvaControlCreate`
   * writes the `required` *input* directly from the field state and never
   * consults validators, so the input arm carries that branch while the
   * validator arm carries reactive/template-driven forms.
   */
  readonly required: Signal<boolean> = computed(() => {
    this._ngControlRev();
    if (this.requiredInput()) return true;
    return !!this.ngControl?.control?.hasValidator(Validators.required);
  });

  /** @internal Whether the control is in an error state per the configured `ErrorStateMatcher`. Reads the bound `NgControl.invalid` through the matcher and drives `aria-invalid` on the radiogroup host. */
  readonly errorState: Signal<boolean> = computed(() => {
    this._ngControlRev();
    this._formSubmitRev();
    const matcher = this.errorStateMatcher() ?? this.defaultMatcher;
    const form: TwFormSubmitted | null =
      (this.parentFormGroup as TwFormSubmitted | null) ??
      (this.parentForm as TwFormSubmitted | null);
    return matcher.isErrorState(this.ngControl?.control ?? null, form);
  });

  readonly activeValue = linkedSignal(() => this.value());

  /** @internal Read by `SegmentedControlOptionComponent.classes` to resolve the option's tv() bucket. Vertical orientation forces `'md'` regardless of input. */
  readonly effectiveRounded = computed<SegmentedControlRounded>(() =>
    this.orientation() === 'vertical' ? 'md' : this.rounded(),
  );

  /** @internal Canonical variant with legacy spellings folded in. Read by `SegmentedControlOptionComponent.classes` to resolve the option's tv() bucket. */
  readonly resolvedVariant = computed<SegmentedControlVariantCanonical>(() => {
    const v = this.variant();
    return (
      (VARIANT_ALIASES as Record<string, SegmentedControlVariantCanonical | undefined>)[v] ??
      (v as SegmentedControlVariantCanonical)
    );
  });

  private readonly variantResult = computed(() =>
    segmentedControlVariants({
      size: this.size(),
      orientation: this.orientation(),
      rounded: this.effectiveRounded(),
    }),
  );

  readonly rootClasses = computed(() => {
    const base = this.variantResult().root();
    return this.isDisabled()
      ? `${base} opacity-50 pointer-events-none`
      : base;
  });

  // ── Selection ──

  /** Selects the option with the given value, updating the two-way bound `value` and notifying the registered `ControlValueAccessor` callbacks. No-op when the control is disabled. */
  selectOption(val: string): void {
    if (this.isDisabled()) return;
    this.activeValue.set(val);
    this.value.set(val);
    this.onChange(val);
    // Deliberately NOT `onTouched()`. Angular's CVA contract registers
    // `onTouched` as the BLUR notification; calling it on selection flipped
    // `touched` with no blur, so a consumer staging error display on `touched`
    // got different behaviour from `tw-segmented-control` than from
    // `tw-slider` / `tw-input`. `onFocusOut()` below is the only place that
    // fires it. The control's own `valueChanges`/`statusChanges` subscription
    // (see `ngOnInit`) is what refreshes `errorState` after this write.
  }

  /**
   * @internal Blur notification for the CVA contract. Fires `onTouched` only
   * when focus leaves the radiogroup entirely — roving focus moves between
   * option elements inside the group, and each of those hops raises `focusout`
   * on the host too. Without this the control is only ever marked `touched` by
   * a selection, so a user who tabs through without choosing never surfaces the
   * `required` error.
   */
  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.elementRef.nativeElement.contains(next)) return;
    this.onTouched();
    this._ngControlRev.update((n) => n + 1);
  }

  // ── Keyboard navigation ──

  /** @internal Handles roving-focus keyboard navigation (Arrow keys, Home, End) and Space / Enter activation across the option group. */
  onKeydown(event: KeyboardEvent): void {
    const opts = this.options();
    if (opts.length === 0) return;

    // Space activates the focused option, as WAI-ARIA requires of every
    // `role="radio"`. The option host is a custom element, not a native
    // control, so no click event is synthesised for us — without this branch
    // selection is pointer-only (WCAG SC 2.1.1). Enter is accepted too: it
    // costs nothing and matches what users expect from a button-like control.
    if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
      const target = event.target as Node | null;
      const focused = target
        ? opts.find(o => o.elementRef.nativeElement.contains(target))
        : undefined;
      if (focused && !focused.isDisabled()) {
        // Space would otherwise scroll the page.
        event.preventDefault();
        this.selectOption(focused.value());
      }
      return;
    }

    let targetIndex = -1;
    const currentIdx = opts.findIndex(o => o.value() === this.activeValue());
    const startIdx = currentIdx >= 0 ? currentIdx : 0;

    // Horizontal arrows follow the layout direction. The option host is a
    // custom element carrying `role="radio"`, not a native `<input>`, so the
    // browser's RTL arrow flipping is unavailable — without this the arrows
    // step backwards in DOM order but forwards visually in an RTL locale.
    // Vertical arrows are direction-independent (CDK's ListKeyManager draws the
    // same line), and the flip applies regardless of `orientation()` because a
    // radiogroup accepts both arrow pairs in either layout, per WAI-ARIA APG.
    const forward: 1 | -1 = this.directionality?.value === 'rtl' ? -1 : 1;
    const backward: 1 | -1 = forward === 1 ? -1 : 1;

    switch (event.key) {
      case 'ArrowRight':
        targetIndex = this.findNextEnabledIndex(opts, startIdx, forward);
        break;
      case 'ArrowLeft':
        targetIndex = this.findNextEnabledIndex(opts, startIdx, backward);
        break;
      case 'ArrowDown':
        targetIndex = this.findNextEnabledIndex(opts, startIdx, 1);
        break;
      case 'ArrowUp':
        targetIndex = this.findNextEnabledIndex(opts, startIdx, -1);
        break;
      case 'Home':
        targetIndex = opts.findIndex(o => !o.isDisabled());
        break;
      case 'End':
        for (let i = opts.length - 1; i >= 0; i--) {
          if (!opts[i].isDisabled()) { targetIndex = i; break; }
        }
        break;
      default:
        return;
    }

    if (targetIndex >= 0) {
      event.preventDefault();
      const opt = opts[targetIndex];
      this.selectOption(opt.value());
      opt.focus();
    }
  }

  private findNextEnabledIndex(
    opts: readonly SegmentedControlOptionComponent[],
    from: number,
    direction: 1 | -1,
  ): number {
    const len = opts.length;
    let idx = from;
    for (let i = 0; i < len; i++) {
      idx = (idx + direction + len) % len;
      if (!opts[idx].isDisabled()) return idx;
    }
    return -1;
  }

  // ── ControlValueAccessor ──

  writeValue(val: string | null): void {
    this.activeValue.set(val);
    this.value.set(val ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // ── Lifecycle ──

  ngOnInit(): void {
    // NgControl's `control` is set by the parent FormControl* directive before
    // children's `ngOnInit`. Subscribe here so `errorState` reacts to
    // status/value changes on the bound control.
    const ctrl = this.ngControl?.control;
    if (ctrl) {
      const streams = [ctrl.statusChanges, ctrl.valueChanges].filter(
        (s): s is NonNullable<typeof s> => !!s,
      );
      if (streams.length) {
        merge(...streams)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this._ngControlRev.update((n) => n + 1));
      }
    }

    const submit = this.parentFormGroup?.ngSubmit ?? this.parentForm?.ngSubmit;
    if (submit) {
      submit
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this._formSubmitRev.update((n) => n + 1));
    }
  }
}
