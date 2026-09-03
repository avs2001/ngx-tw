import { computed, DestroyRef, inject, signal, type Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormGroupDirective,
  NgForm,
  Validators,
  type NgControl,
  type ValidatorFn,
} from '@angular/forms';
import { merge } from 'rxjs';
import {
  TW_ERROR_STATE_MATCHER,
  type ErrorStateMatcher,
  type TwFormSubmitted,
} from './error-state-matcher';

/** Default validator set consulted by {@link ErrorStateWiring.required}. */
const DEFAULT_REQUIRED_VALIDATORS: readonly ValidatorFn[] = [Validators.required];

const NO_TRACKED_SOURCES: readonly (() => unknown)[] = [];

/**
 * Configuration for {@link wireErrorState}. Every field is a callback rather
 * than a `Signal`, so the options object may reference class members that are
 * declared *below* the `wireErrorState()` call site — the callbacks are only
 * invoked from inside the returned computeds, long after construction.
 */
export interface ErrorStateWiringOptions {
  /**
   * Resolves the host's bound `NgControl`, or `null` when the host is not bound
   * to a form control. Pass a getter rather than the instance so controls that
   * resolve `NgControl` lazily (pickers that self-provide `NG_VALIDATORS` and
   * must defer the lookup to `ngOnInit`) work unchanged. Deliberately *not*
   * injected by this helper: the host owns the `NgControl` reference because it
   * also owns `ControlValueAccessor` registration.
   */
  readonly ngControl: () => NgControl | null;
  /**
   * Reads the host's per-instance `errorStateMatcher` input. When it returns
   * `undefined` the matcher provided under `TW_ERROR_STATE_MATCHER` is used.
   */
  readonly matcher?: () => ErrorStateMatcher | undefined;
  /**
   * Reads the host's `required` input. When it returns `true`,
   * {@link ErrorStateWiring.required} is `true` without consulting validators —
   * the arm that keeps signal forms working, since `cvaControlCreate` writes the
   * `required` input directly and never inspects validators.
   */
  readonly required?: () => boolean;
  /**
   * Validators that mark the control required when present on the bound
   * `NgControl`. Defaults to `[Validators.required]`; boolean controls
   * (`tw-checkbox`, `tw-switch`) also pass `Validators.requiredTrue`.
   */
  readonly requiredValidators?: readonly ValidatorFn[];
  /**
   * Extra reactive sources {@link ErrorStateWiring.errorState} track-reads.
   * Controls pass their focus signal here so a blur — which flips `touched` on
   * the bound control without changing its status or value — repaints the error
   * styling.
   */
  readonly track?: readonly (() => unknown)[];
  /**
   * Short-circuits {@link ErrorStateWiring.errorState}. Return a boolean to use
   * it as the error state without consulting the matcher, or `undefined` to fall
   * through to the matcher. Used by the pickers (a parse or range error is an
   * error regardless of validator status) and by `tw-radio` (a radio inside a
   * group inherits the group's error state). Called after the revision signals
   * are read, so its own reads are tracked normally.
   */
  readonly errorStateOverride?: () => boolean | undefined;
}

/** Reactive error-state surface returned by {@link wireErrorState}. */
export interface ErrorStateWiring {
  /**
   * Whether the control should render as invalid, per the resolved
   * {@link ErrorStateMatcher}. Satisfies `FormFieldControl.errorState`.
   */
  readonly errorState: Signal<boolean>;
  /**
   * Whether the control is required — the host's `required` input OR'd with the
   * configured required validators on the bound `NgControl`. Satisfies
   * `FormFieldControl.required`.
   */
  readonly required: Signal<boolean>;
  /**
   * Active validation errors on the bound `NgControl`, or `null` when it reports
   * none or is unbound. Satisfies `FormFieldControl.errors`, which is what
   * `[twError match="…"]` filters on inside a `<tw-form-field>`.
   */
  readonly errors: Signal<Record<string, unknown> | null>;
  /**
   * Revision counter bumped whenever the bound control may have changed. Read it
   * from any other computed that dereferences `NgControl` — typically a
   * `disabled` computed reading `ngControl.disabled` — so that computed
   * invalidates on the same ticks the error state does.
   */
  readonly rev: Signal<number>;
  /**
   * Bumps {@link ErrorStateWiring.rev}. Call it from anywhere the bound control
   * changed without emitting on `statusChanges`/`valueChanges` — a `FocusMonitor`
   * blur that flipped `touched`, `setDisabledState`, or immediately after a
   * deferred `NgControl` lookup.
   */
  bump(): void;
  /**
   * Subscribes to the bound control's `statusChanges`/`valueChanges` and to the
   * parent form's `ngSubmit`. Call this from `ngOnInit`, never the constructor:
   * `NgControl.control` is populated by the parent `FormControl*` directive's own
   * `ngOnChanges`, which runs before children's `ngOnInit` but after their
   * constructors. Teardown is wired to the host's `DestroyRef`.
   */
  connect(): void;
}

/**
 * Builds the error-state, required and errors signals every ngx-tw form control
 * exposes to `<tw-form-field>`, plus the revision plumbing that keeps them live.
 *
 * Call it from an injection context (a field initializer or the constructor).
 * It injects `DestroyRef`, `NgForm`/`FormGroupDirective` (both optional) and
 * `TW_ERROR_STATE_MATCHER` on the host's behalf; it does **not** inject
 * `NgControl`, because the host must keep ownership of that reference for
 * `ControlValueAccessor` registration.
 *
 * Wiring an error-state-aware control takes three steps:
 *
 * ```ts
 * private readonly ngControl = inject(NgControl, { optional: true, self: true });
 * private readonly errorWiring = wireErrorState({
 *   ngControl: () => this.ngControl,
 *   matcher: () => this.errorStateMatcher(),
 *   required: () => this.requiredInput(),
 *   track: [this._focused],
 * });
 *
 * readonly errorState = this.errorWiring.errorState;
 * readonly required = this.errorWiring.required;
 * readonly errors = this.errorWiring.errors;
 *
 * ngOnInit(): void {
 *   this.errorWiring.connect();
 * }
 * ```
 */
export function wireErrorState(options: ErrorStateWiringOptions): ErrorStateWiring {
  const destroyRef = inject(DestroyRef);
  const parentForm = inject(NgForm, { optional: true });
  const parentFormGroup = inject(FormGroupDirective, { optional: true });
  const defaultMatcher = inject(TW_ERROR_STATE_MATCHER);

  const {
    ngControl,
    matcher,
    required: requiredInput,
    requiredValidators = DEFAULT_REQUIRED_VALIDATORS,
    track = NO_TRACKED_SOURCES,
    errorStateOverride,
  } = options;

  // Revision counters. `controlRev` invalidates everything derived from the
  // bound control; `submitRev` invalidates only the matcher's `form.submitted`
  // arm. They are separate because a submit must not make `required`/`errors`
  // recompute.
  const controlRev = signal(0);
  const submitRev = signal(0);

  const errorState = computed(() => {
    controlRev();
    submitRev();
    for (const source of track) {
      source();
    }
    const overridden = errorStateOverride?.();
    if (overridden !== undefined) return overridden;
    const resolved = matcher?.() ?? defaultMatcher;
    const form: TwFormSubmitted | null =
      (parentFormGroup as TwFormSubmitted | null) ?? (parentForm as TwFormSubmitted | null);
    return resolved.isErrorState(ngControl()?.control ?? null, form);
  });

  const required = computed(() => {
    controlRev();
    if (requiredInput?.()) return true;
    const control = ngControl()?.control;
    if (!control) return false;
    return requiredValidators.some((validator) => control.hasValidator(validator));
  });

  const errors = computed<Record<string, unknown> | null>(() => {
    controlRev();
    return (ngControl()?.control?.errors as Record<string, unknown> | null) ?? null;
  });

  return {
    errorState,
    required,
    errors,
    rev: controlRev.asReadonly(),
    bump: () => controlRev.update((n) => n + 1),
    connect: () => {
      const control = ngControl()?.control;
      if (control) {
        const streams = [control.statusChanges, control.valueChanges].filter(
          (stream): stream is NonNullable<typeof stream> => !!stream,
        );
        if (streams.length) {
          merge(...streams)
            .pipe(takeUntilDestroyed(destroyRef))
            .subscribe(() => controlRev.update((n) => n + 1));
        }
      }

      const submit = parentFormGroup?.ngSubmit ?? parentForm?.ngSubmit;
      if (submit) {
        submit
          .pipe(takeUntilDestroyed(destroyRef))
          .subscribe(() => submitRev.update((n) => n + 1));
      }
    },
  };
}
