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
  type Signal,
} from '@angular/core';
import {
  type ControlValueAccessor,
  NgControl,
  Validators,
} from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isObservable } from 'rxjs';
import { tv } from 'tailwind-variants';
import {
  type ErrorStateMatcher,
  type TwColor,
  type TwSize,
  wireErrorState,
} from '@cdevhub/ngx-tw/core';
import { FormFieldControl, TW_FORM_FIELD_CONTROL } from '@cdevhub/ngx-tw/form-field';

/** Visual style of the checkbox when checked or indeterminate. */
export type CheckboxVariant = 'solid' | 'outline';

/** Position of the label relative to the checkbox control. */
export type CheckboxLabelPosition = 'before' | 'after';

// ── tv() config ──────────────────────────────────────────────────

const checkboxVariants = tv(
  {
    slots: {
      // `items-start` aligns the boxWrap with the top of the label container; combined with
      // a `min-h-N` matching the label's first-line line-height on boxWrap, the box stays
      // centered on the first line of the label whether it spans one line or many.
      //
      // ── Row-height scale (selection cohort) ──────────────────────────────
      // The rendered row is `max(boxWrap, label first line)`, and the host itself is the
      // click target (`role="checkbox"` + `tabindex` + `(click)` all sit on the root), so
      // the row IS the interactive target. It runs 16 / 20 / 24 / 28 / 32 px — five distinct
      // steps, every one on the 4px baseline of docs/vertical-rhythm.md, and identical to
      // `switch`, the sibling selection control. Selection controls are glyph-scale and
      // deliberately do NOT take the pinned 24/32/36/44/48 form-row scale (vertical-rhythm.md
      // section 4).
      //
      // The row is driven by `boxWrap` min-h, NOT by the box glyph, which stays at its own
      // well-proportioned 14 / 16 / 20 / 24 / 28 scale (4px of slack inside the row at every
      // size; 2px at xs, where the codified size-3.5 half-step applies). Driving it from
      // boxWrap is what makes the five steps survive when no label is projected.
      //
      // Because centering demands `boxWrap height == label first-line leading`, the label
      // leading carries the same 4 / 5 / 6 / 7 / 8 progression. That is forced, not chosen:
      // the label font scale has only three steps (text-xs, text-sm, text-base), so leading
      // is the only lever that can break the sm/md and lg/xl ties. Before this, sm and md
      // both rendered a 20px row — a dead step. Accepted cost: `text-base leading-8` at xl is
      // a 2.0 line ratio, looser than typographic ideal on a wrapped multi-line label.
      root: 'relative inline-flex items-start gap-3 cursor-pointer select-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      boxWrap: 'relative inline-flex items-center justify-center shrink-0',
      box: 'inline-flex items-center justify-center rounded-md border transition-colors duration-normal motion-reduce:transition-none',
      icon: 'absolute inset-0 flex items-center justify-center pointer-events-none empty:hidden',
      labelWrap: 'flex flex-col min-w-0 empty:hidden',
      label: 'font-medium text-fg empty:hidden',
      description: 'text-fg-muted empty:hidden',
    },
    variants: {
      size: {
        xs: {
          // `size-3.5` half-step: aligns with text-xs/leading-4. Codified per CLAUDE.md.
          box: 'size-3.5',
          icon: '[&_svg]:size-3',
          boxWrap: 'min-h-4',
          label: 'text-xs leading-4',
          description: 'text-2xs leading-4',
        },
        sm: {
          box: 'size-4',
          icon: '[&_svg]:size-3',
          boxWrap: 'min-h-5',
          label: 'text-sm leading-5',
          description: 'text-xs leading-4',
        },
        md: {
          box: 'size-5',
          // md icon uses `size-3.5` (14px) — proportional inset (70%) of the
          // size-5 (20px) box; the half-step is the only size that fills the
          // checkmark without crowding the box edges.
          icon: '[&_svg]:size-3.5',
          // 24px row. `text-sm` is shared with sm by the documented font scale, so the
          // leading breaks the tie: leading-6 lifts the row off sm's 20px.
          boxWrap: 'min-h-6',
          label: 'text-sm leading-6',
          description: 'text-xs leading-4',
        },
        lg: {
          box: 'size-6',
          icon: '[&_svg]:size-4',
          // 28px row — leading-7 keeps the first label line the same height as boxWrap.
          boxWrap: 'min-h-7',
          label: 'text-base leading-7',
          description: 'text-sm leading-5',
        },
        xl: {
          box: 'size-7',
          icon: '[&_svg]:size-5',
          // 32px row. `text-base` is shared with lg, so leading-8 breaks that tie the same
          // way leading-6 breaks sm/md. A 2.0 ratio on a wrapped label is the accepted cost.
          boxWrap: 'min-h-8',
          label: 'text-base leading-8',
          description: 'text-sm leading-5',
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
  primary: 'text-on-primary',
  secondary: 'text-on-secondary',
  accent: 'text-on-accent',
  neutral: 'text-on-neutral',
  info: 'text-on-info',
  success: 'text-on-success',
  warning: 'text-on-warning',
  error: 'text-on-error',
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
      provide: TW_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => CheckboxComponent),
    },
  ],
  template: `
    <!--
      Hidden form-submission proxy. Uses \`hidden\` (display:none), not \`sr-only\`:
      a display:none control is excluded from focus order so axe's
      \`nested-interactive\` rule doesn't flag it inside the \`role="checkbox"\`
      host, yet it still participates in native (non-Angular) form submission —
      the entry-list algorithm excludes only \`disabled\` controls, not hidden ones.
    -->
    <input
      type="checkbox"
      hidden
      aria-hidden="true"
      [name]="name() || null"
      [checked]="internalChecked()"
      [disabled]="isDisabled()"
    />

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
      <span [id]="labelElementId()" [class]="labelClasses()">
        <ng-content>
          @if (label()) {
            {{ label() }}
          }
        </ng-content>
      </span>
      <span [id]="descriptionElementId()" [class]="descriptionClasses()">
        <ng-content select="[slot='description']">
          @if (description()) {
            {{ description() }}
          }
        </ng-content>
      </span>
    </span>
  `,
  host: {
    'role': 'checkbox',
    '[id]': 'id()',
    '[class]': 'rootClasses()',
    '[attr.data-checked]': 'internalChecked()',
    '[attr.data-indeterminate]': 'internalIndeterminate()',
    '[attr.aria-checked]': 'ariaCheckedValue()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-required]': 'required() || null',
    '[attr.aria-invalid]': 'errorState() || null',
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
export class CheckboxComponent
  extends FormFieldControl<boolean>
  implements ControlValueAccessor, OnInit
{
  /** Sets the semantic color for the checked and indeterminate box fill/border. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls the overall scale of the box, check icon, and label typography. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Visual style when checked or indeterminate. `'solid'` fills the box with the color; `'outline'` keeps a transparent fill with a colored border and check. Defaults to `'solid'`. */
  readonly variant = input<CheckboxVariant>('solid');

  /** When true, prevents interaction and applies muted styling. Defaults to `false`. */
  readonly disabled = input(false);

  /** When true, sets `aria-required="true"` so assistive tech announces the control as required. Defaults to `false`. */
  readonly requiredInput = input(false, { alias: 'required' });

  /** Optional inline label rendered next to the checkbox. Use default content projection for rich label content instead. Projection takes precedence. */
  readonly label = input<string | undefined>(undefined);

  /** Optional secondary description rendered under the label. Use `[slot="description"]` content projection for rich content instead. Projection takes precedence. */
  readonly description = input<string | undefined>(undefined);

  /** Position of the label/description relative to the checkbox. Defaults to `'after'`. */
  readonly labelPosition = input<CheckboxLabelPosition>('after');

  /** Optional name attribute, applied to the hidden native `<input type="checkbox">` so native form submission includes the control. */
  readonly name = input<string | undefined>(undefined);

  /** Id on the host element. Auto-generated as `tw-checkbox-N` when not provided. Anchors the derived label/description ids; the accessible name inside a `<tw-form-field>` comes from `aria-labelledby`, not from the field's `<label for>` (the host is a custom element, which `for` cannot target). */
  readonly idInput = input<string | undefined>(undefined, { alias: 'id' });

  /** Accessible name when no visible label is provided. Mirrored to `aria-label`. Defaults to `undefined`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the checkbox. Mirrored to `aria-labelledby`. Defaults to `undefined`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external element that describes the checkbox. Mirrored to `aria-describedby`. Form-field merges its hint/error ids alongside. Defaults to `undefined`. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Per-instance override of the {@link ErrorStateMatcher}. When omitted, the directive uses the `TW_ERROR_STATE_MATCHER` token's value. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  /**
   * Two-way bound checked state. Updates when the user toggles via click or
   * Space, **and** when a bound form writes into the control
   * (`FormControl.setValue`, `ngModel`, `writeValue`). Defaults to `false`.
   *
   * The two-way binding mints a `checkedChange` output. That output is the
   * *any-change* channel: it fires on programmatic writes as well as user
   * gestures. `(change)` is the *user-gesture-only* channel. Bind
   * `(checkedChange)` to mirror state; bind `(change)` for analytics or a
   * confirmation prompt, where a programmatic write must not count as a click.
   * Writing back into the same form from a `(checkedChange)` handler will echo.
   */
  readonly checked = model(false);

  /**
   * Two-way bound indeterminate state. When true, the box shows a dash and the
   * host exposes `aria-checked="mixed"`. Any user toggle clears indeterminate
   * and sets `checked` to `true`. Defaults to `false`.
   *
   * Its minted `indeterminateChange` output follows the same rule as
   * `checkedChange`: it also fires when `writeValue` clears the state, so it is
   * an any-change channel, not a gesture channel.
   */
  readonly indeterminate = model(false);

  /**
   * Fires after the checked state changes from a user interaction (click or
   * Space). Does **not** fire when the value is updated programmatically via
   * `writeValue` / `FormControl.setValue` / `ngModel` — for those, bind the
   * two-way binding's `(checkedChange)` instead, which fires on any change.
   */
  readonly change = output<boolean>();

  private readonly focusMonitor = inject(FocusMonitor);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly cvaDisabled = signal(false);

  private readonly _focused = signal(false);

  /** @internal Shared `errorState` / `required` / `errors` derivation — see `wireErrorState`. */
  private readonly errorWiring = wireErrorState({
    ngControl: () => this.ngControl,
    matcher: () => this.errorStateMatcher(),
    required: () => this.requiredInput(),
    // A checkbox bound with `Validators.requiredTrue` is required too.
    requiredValidators: [Validators.required, Validators.requiredTrue],
    track: [() => this._focused()],
  });
  private readonly describedByIdsSignal = signal<readonly string[]>([]);
  private readonly labelledByIdsSignal = signal<readonly string[]>([]);

  private readonly uid = nextId++;
  /** @internal Fallback id used when the consumer does not set `[id]`. */
  readonly hostId = `tw-checkbox-${this.uid}`;

  /** @internal Resolved id on the host element. */
  readonly id: Signal<string> = computed(() => this.idInput() ?? this.hostId);

  /** @internal Id of the internal label `<span>`, derived from the resolved host id. */
  readonly labelElementId = computed(() => `${this.id()}-label`);

  /** @internal Id of the internal description `<span>`, derived from the resolved host id. */
  readonly descriptionElementId = computed(() => `${this.id()}-description`);

  constructor() {
    super();
    // Material-style CVA wiring: declare ourselves as the value accessor on any
    // host-level `NgControl` (FormControlDirective, NgModel, etc.). This avoids
    // the circular-DI that a static `NG_VALUE_ACCESSOR` provider would create
    // because `NgControl` is injected with `self: true` on the same element.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    afterNextRender(() => {
      if (isDevMode() && !this.hasAccessibleNameHint()) {
        console.warn(
          '[tw-checkbox] The checkbox has no accessible name. Provide a `label` input, project label content, or set `aria-label` / `aria-labelledby`.',
        );
      }
    });
  }

  /** @internal */
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  /**
   * @internal Visible-state mirror of the `checked` model. `linkedSignal` keeps it
   * synced with parent updates (including `writeValue` from reactive forms), while
   * also accepting explicit `set()` calls from `toggle()` / `writeValue()` so the
   * DOM reflects the new state synchronously — before `checkedChange` propagates
   * through the host binding round-trip. Reading this signal in host bindings
   * (`aria-checked`, `data-checked`, box classes) decouples render from the
   * model's notification cadence.
   */
  readonly internalChecked = linkedSignal(() => this.checked());

  /**
   * @internal Visible-state mirror of the `indeterminate` model. Same rationale as
   * `internalChecked` — `toggle()` and `writeValue()` clear it synchronously so
   * `aria-checked="mixed"` flips off in the same microtask as `aria-checked="true"`.
   */
  readonly internalIndeterminate = linkedSignal(() => this.indeterminate());

  readonly ariaCheckedValue = computed(() => {
    if (this.internalIndeterminate()) return 'mixed';
    return this.internalChecked() ? 'true' : 'false';
  });

  readonly effectiveAriaLabelledby = computed(() => {
    // A wrapping `<tw-form-field>` pushes the projected `<label twLabel>` id (plus
    // any consumer `aria-labelledby`) through `setLabelledByIds`. Those ids win:
    // the host is `<tw-checkbox role="checkbox">`, a custom element that is not a
    // labelable form control, so the field's `<label for>` resolves to nothing and
    // this attribute is the ONLY route from the visible label to the control.
    // Without it the checkbox's own label span is empty in that arrangement — the
    // visible text lives in the form-field — and the control has no name at all.
    const pushed = this.labelledByIdsSignal();
    if (pushed.length) return pushed.join(' ');
    const external = this.ariaLabelledby();
    if (external) return external;
    if (this.ariaLabel()) return undefined;
    return this.labelElementId();
  });

  readonly effectiveAriaDescribedby = computed(() => {
    const merged: string[] = [];
    const extra = this.describedByIdsSignal();
    for (const id of extra) merged.push(id);
    const external = this.ariaDescribedby();
    if (external) {
      for (const id of external.split(/\s+/).filter(Boolean)) merged.push(id);
    } else if (extra.length === 0) {
      // Only fall back to the internal description id when no external sources are wired.
      merged.push(this.descriptionElementId());
    }
    return merged.length ? merged.join(' ') : undefined;
  });

  private readonly isActive = computed(() => this.internalChecked() || this.internalIndeterminate());

  // ── FormFieldControl signals ──

  /** @internal */
  readonly value: Signal<boolean | null> = computed(() => this.internalChecked());

  /** @internal */
  readonly focused: Signal<boolean> = this._focused.asReadonly();

  /** @internal Checkboxes are never empty in the form-field sense — they always have a boolean value. */
  readonly empty: Signal<boolean> = computed(() => false);

  /** @internal */
  readonly required: Signal<boolean> = this.errorWiring.required;

  /** @internal */
  readonly errorState: Signal<boolean> = this.errorWiring.errorState;

  /** @internal Active validation errors map from the bound `NgControl`. Drives `[twError match="…"]` inside a wrapping `tw-form-field`; without it the form-field's key set is permanently empty and every `match`ed error stays hidden. */
  override readonly errors: Signal<Record<string, unknown> | null> = this.errorWiring.errors;

  /** @internal */
  readonly controlType = 'checkbox';

  /** @internal */
  readonly userAriaDescribedBy: Signal<string | undefined> = computed(() => this.ariaDescribedby());

  /** @internal Consumer-supplied `aria-labelledby`, surfaced so the wrapping form-field merges it into the ids it pushes back rather than replacing it. */
  override readonly userAriaLabelledby: Signal<string | undefined> = computed(() =>
    this.ariaLabelledby(),
  );

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
    const active = this.isActive();
    const error = this.errorState();
    const variant = this.variant();
    const effectiveColor: TwColor = error ? 'error' : this.color();
    if (!active) {
      if (error) return `${base} border-error-500`;
      return base;
    }
    const lookup = variant === 'solid' ? SOLID_BOX : OUTLINE_BOX;
    return `${base} ${lookup[effectiveColor]}`;
  });

  readonly iconColorClasses = computed(() => {
    const lookup = this.variant() === 'solid' ? SOLID_ICON : OUTLINE_ICON;
    const effectiveColor: TwColor = this.errorState() ? 'error' : this.color();
    return `inline-flex items-center justify-center ${lookup[effectiveColor]}`;
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
    // Deliberately NOT `onTouched()`. Angular's CVA contract registers
    // `onTouched` as the BLUR notification; calling it here flipped `touched`
    // the instant the value changed, so a consumer staging error display on
    // `touched` ("only once they leave the field") got different behaviour from
    // `tw-checkbox` than from `tw-slider` / `tw-input`. `onBlur()` below is the
    // only place that fires it.
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

  /** @internal Called on host blur to notify forms the control has been touched and recompute errorState. */
  onBlur(): void {
    this.onTouched();
    this.errorWiring.bump();
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

  // ── FormFieldControl methods ──

  /** @internal Called by the form-field once it has computed the merged describedby ids. */
  setDescribedByIds(ids: string[]): void {
    this.describedByIdsSignal.set([...ids]);
  }

  /** @internal Receives the merged `aria-labelledby` ids from the wrapping form-field. Required because the host is a custom element rather than a labelable control, so the field's `<label for>` never reaches it. */
  override setLabelledByIds(ids: string[]): void {
    this.labelledByIdsSignal.set([...ids]);
  }

  /** @internal Called when the form-field container is clicked — focus the host without toggling. */
  onContainerClick(event: MouseEvent): void {
    if (this.isDisabled()) return;
    if (event.defaultPrevented) return;
    const host = this.elementRef.nativeElement;
    if (event.target === host || host.contains(event.target as Node)) return;
    host.focus();
  }

  // ── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    const monitor$ = this.focusMonitor.monitor(this.elementRef);
    if (isObservable(monitor$)) {
      monitor$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((origin) => {
          const wasFocused = this._focused();
          this._focused.set(!!origin);
          if (wasFocused && !origin) {
            // Blur often flips `touched` on the bound `NgControl`; notify forms
            // and bump the revision so `errorState` recomputes.
            this.onTouched();
            this.errorWiring.bump();
          }
        });
    }
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
    });

    // NgControl's `control` is set by the parent FormControl* directive before
    // children's `ngOnInit`. Connect here so errorState reacts to status/value
    // changes on the bound control.
    this.errorWiring.connect();
  }

  private hasAccessibleNameHint(): boolean {
    if (this.label() || this.ariaLabel() || this.ariaLabelledby()) return true;
    const host = this.elementRef.nativeElement;
    return host.textContent !== null && host.textContent.trim().length > 0;
  }
}
