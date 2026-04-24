import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  InjectionToken,
  input,
  isDevMode,
  isSignal,
  type OnInit,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { Platform } from '@angular/cdk/platform';
import { merge } from 'rxjs';
import { tv } from 'tailwind-variants';
import {
  type ErrorStateMatcher,
  TW_ERROR_STATE_MATCHER,
  type TwFormSubmitted,
} from 'ngx-tw/core';
import {
  FormFieldComponent,
  FormFieldControl,
  TW_FORM_FIELD_CONTROL,
} from 'ngx-tw/form-field';

/**
 * Extension point for directives that wrap an `<input twInput>` and need to
 * own how its value is read and written. The directive's `value` property can
 * be a plain object slot (`{ value: T }`) or a `WritableSignal<T>`. Mirrors
 * Angular Material's `MAT_INPUT_VALUE_ACCESSOR`.
 */
export const TW_INPUT_VALUE_ACCESSOR = new InjectionToken<{
  value: unknown | WritableSignal<unknown>;
}>('TW_INPUT_VALUE_ACCESSOR');

const INVALID_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

const NEVER_EMPTY_TYPES = new Set([
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
  'color',
]);

const inputVariants = tv(
  {
    base: 'block w-full bg-transparent text-fg placeholder:text-fg-subtle outline-none',
    variants: {
      inFormField: {
        true: 'border-0 p-0 shadow-none focus:outline-none focus-visible:outline-none',
        false:
          'rounded-md border border-border px-4 py-2 text-sm transition-[color,border-color,box-shadow] duration-200 motion-reduce:transition-none hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      },
      errorState: {
        true: '',
        false: '',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
    compoundVariants: [
      {
        inFormField: false,
        errorState: true,
        class: 'border-error-500 focus-visible:outline-error-500',
      },
    ],
    defaultVariants: {
      inFormField: false,
      errorState: false,
      disabled: false,
    },
  },
  { twMerge: true },
);

let nextInputId = 0;

/**
 * Adapts a native `<input>` or `<textarea>` into an ngx-tw form-field-compatible
 * control. Works standalone (applies its own border and focus styling) or
 * inside a `<tw-form-field>` (strips its chrome and provides signals the
 * form-field uses to float the label and wire `aria-describedby`).
 *
 * Extension points:
 * - Implement a completely custom control → extend {@link FormFieldControl}
 *   and provide under `TW_FORM_FIELD_CONTROL`.
 * - Swap value storage for an existing `<input twInput>` (masked input,
 *   date parser, etc.) → provide {@link TW_INPUT_VALUE_ACCESSOR}.
 * - Change when errors show → override {@link TW_ERROR_STATE_MATCHER} at any
 *   injector level, or pass `errorStateMatcher` per instance.
 *
 * Forms integration is inherited: Angular's native value accessors attach to
 * the underlying element, so the directive works with template-driven,
 * reactive, and signal-based forms without additional glue.
 */
@Directive({
  selector: 'input[twInput], textarea[twInput]',
  exportAs: 'twInput',
  providers: [
    { provide: TW_FORM_FIELD_CONTROL, useExisting: InputDirective },
  ],
  host: {
    '[class]': 'classes()',
    '[attr.id]': 'id()',
    '[attr.type]': '_isTextarea ? null : type()',
    '[disabled]': 'disabled()',
    '[attr.aria-invalid]': 'errorState() || null',
    '[attr.aria-required]': 'required() || null',
    '(input)': '_onInput()',
  },
})
export class InputDirective
  extends FormFieldControl<string>
  implements OnInit
{
  private readonly elementRef = inject<
    ElementRef<HTMLInputElement | HTMLTextAreaElement>
  >(ElementRef);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly autofillMonitor = inject(AutofillMonitor);
  private readonly platform = inject(Platform);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formField = inject(FormFieldComponent, { optional: true });
  private readonly ngControl = inject(NgControl, {
    optional: true,
    self: true,
  });
  private readonly parentForm = inject(NgForm, { optional: true });
  private readonly parentFormGroup = inject(FormGroupDirective, {
    optional: true,
  });
  private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);
  private readonly valueAccessor = inject(TW_INPUT_VALUE_ACCESSOR, {
    optional: true,
    self: true,
  });

  /** @internal */
  readonly _isTextarea =
    this.elementRef.nativeElement.tagName.toLowerCase() === 'textarea';

  /** Contract value — `'input'` for `<input>` and `'textarea'` for `<textarea>`. Form-field appends it as `tw-form-field-type-*` for styling hooks. */
  readonly controlType: string = this._isTextarea ? 'textarea' : 'input';

  private readonly uid = `tw-input-${nextInputId++}`;

  /** Id on the underlying element. Auto-generated as `tw-input-N` when not provided. Used by the form-field's `<label for>` attribute. */
  readonly idInput = input<string | undefined>(undefined, { alias: 'id' });

  /** Native HTML input `type`. Defaults to `'text'`. Dev-mode throws on unsupported values (`checkbox`, `radio`, `submit`, etc.) — use the dedicated component instead. Ignored on `<textarea>`. */
  readonly type = input<string>('text');

  /** Disables the control. Also reflects `ngControl.disabled` when the element is bound to a reactive form. Defaults to `false`. */
  readonly disabledInput = input<boolean, unknown>(false, {
    alias: 'disabled',
    transform: booleanAttribute,
  });

  /** Marks the control as required. Also inferred from `Validators.required` on a bound `NgControl`. Defaults to `false`. */
  readonly requiredInput = input<boolean, unknown>(false, {
    alias: 'required',
    transform: booleanAttribute,
  });

  /** Makes the control read-only (native `readonly` attribute). Defaults to `false`. */
  readonly readonlyInput = input<boolean, unknown>(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });

  /** Per-instance override of the {@link ErrorStateMatcher}. When omitted, the directive uses the `TW_ERROR_STATE_MATCHER` token's value. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  /** Consumer-supplied `aria-describedby` ids. The form-field preserves these when merging hint and error ids. Alias: `aria-describedby`. */
  readonly userAriaDescribedByInput = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });

  // ── Internal state signals ──

  private readonly _value = signal<string>(this._readInitialValue());
  private readonly _focused = signal(false);
  private readonly _autofilled = signal(false);
  private readonly _ngControlRev = signal(0);
  private readonly _formSubmitRev = signal(0);

  // ── FormFieldControl signals ──

  /** @internal */
  readonly id = computed(() => this.idInput() ?? this.uid);

  /** @internal */
  readonly value = computed<string | null>(() => this._value() || null);

  /** @internal */
  readonly focused = this._focused.asReadonly();

  /** @internal */
  readonly empty = computed(() => {
    if (!this._isTextarea && NEVER_EMPTY_TYPES.has(this.type())) {
      return false;
    }
    return !this._value() && !this._autofilled();
  });

  /** @internal */
  readonly disabled = computed(() => {
    this._ngControlRev();
    return this.disabledInput() || !!this.ngControl?.disabled;
  });

  /** @internal */
  readonly required = computed(() => {
    this._ngControlRev();
    if (this.requiredInput()) return true;
    return !!this.ngControl?.control?.hasValidator(Validators.required);
  });

  /** @internal */
  readonly errorState = computed(() => {
    this._ngControlRev();
    this._formSubmitRev();
    this._focused();
    const matcher = this.errorStateMatcher() ?? this.defaultMatcher;
    const form: TwFormSubmitted | null =
      (this.parentFormGroup as TwFormSubmitted | null) ??
      (this.parentForm as TwFormSubmitted | null);
    return matcher.isErrorState(this.ngControl?.control ?? null, form);
  });

  /** @internal */
  readonly userAriaDescribedBy = computed(() =>
    this.userAriaDescribedByInput(),
  );

  /** @internal */
  readonly classes = computed(() =>
    inputVariants({
      inFormField: !!this.formField,
      errorState: this.errorState(),
      disabled: this.disabled(),
    }),
  );

  constructor() {
    super();

    this.focusMonitor
      .monitor(this.elementRef)
      .pipe(takeUntilDestroyed())
      .subscribe((origin) => {
        const wasFocused = this._focused();
        this._focused.set(!!origin);
        if (wasFocused && !origin) {
          // Blur often flips `touched` on the bound `NgControl`; bump the
          // revision signal so `errorState` recomputes.
          this._ngControlRev.update((n) => n + 1);
        }
      });
    this.destroyRef.onDestroy(() =>
      this.focusMonitor.stopMonitoring(this.elementRef),
    );

    // Keep `_value` in sync when the accessor's value is itself a signal.
    if (this.valueAccessor && isSignal(this.valueAccessor.value)) {
      effect(() => {
        const v = (this.valueAccessor!.value as Signal<unknown>)();
        this._value.set(this._stringify(v));
      });
    }

    // Sync the `readonly` input to the native attribute.
    effect(() => {
      const el = this.elementRef.nativeElement;
      if (this.readonlyInput()) {
        el.setAttribute('readonly', 'true');
      } else {
        el.removeAttribute('readonly');
      }
    });

    // Validate the input type in dev mode.
    effect(() => {
      const t = this.type();
      if (
        isDevMode() &&
        !this._isTextarea &&
        INVALID_INPUT_TYPES.has(t)
      ) {
        throw new Error(
          `tw-input: unsupported input type "${t}". Use a dedicated ngx-tw component for that control.`,
        );
      }
    });
  }

  ngOnInit(): void {
    if (this.platform.isBrowser) {
      this.autofillMonitor
        .monitor(this.elementRef.nativeElement)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => this._autofilled.set(event.isAutofilled));
      this.destroyRef.onDestroy(() =>
        this.autofillMonitor.stopMonitoring(this.elementRef.nativeElement),
      );
    }

    // NgControl's `control` is set by the parent `FormControl*` directive's
    // own `ngOnChanges`, which runs before children's `ngOnInit`. Subscribe
    // here so `statusChanges`/`valueChanges` are actually available.
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

  /** Moves focus to the underlying element. */
  focus(options?: FocusOptions): void {
    this.elementRef.nativeElement.focus(options);
  }

  /** @internal Called when `<tw-form-field>` has computed the merged describedby ids. */
  setDescribedByIds(ids: string[]): void {
    const el = this.elementRef.nativeElement;
    if (ids.length) {
      el.setAttribute('aria-describedby', ids.join(' '));
    } else {
      el.removeAttribute('aria-describedby');
    }
  }

  /** @internal Called when the form-field container is clicked. */
  onContainerClick(_event: MouseEvent): void {
    if (!this._focused()) {
      this.focus();
    }
  }

  /** @internal */
  _onInput(): void {
    this._value.set(this._currentValue());
  }

  private _currentValue(): string {
    if (this.valueAccessor) {
      const v = this.valueAccessor.value;
      if (isSignal(v)) return this._stringify((v as Signal<unknown>)());
      return this._stringify(v);
    }
    return this.elementRef.nativeElement.value;
  }

  private _readInitialValue(): string {
    const el = this.elementRef.nativeElement;
    return el.value ?? '';
  }

  private _stringify(v: unknown): string {
    return v === null || v === undefined ? '' : String(v);
  }
}
