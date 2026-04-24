import { InjectionToken } from '@angular/core';
import type { AbstractControl } from '@angular/forms';

/**
 * Minimal contract for a parent form's "submitted" state. Both `NgForm` and
 * `FormGroupDirective` satisfy this, so the matcher can work with either.
 */
export interface TwFormSubmitted {
  readonly submitted: boolean;
}

/**
 * Strategy that decides when a form control should be rendered in the error
 * state. Controls read the injected matcher (or accept a per-instance
 * override) and combine the result with their own signals. Override at any
 * injector level via {@link TW_ERROR_STATE_MATCHER}.
 */
export interface ErrorStateMatcher {
  /** Returns true when the control should display an error. */
  isErrorState(
    control: AbstractControl | null,
    form: TwFormSubmitted | null,
  ): boolean;
}

/**
 * Default error-state strategy: errored when the control is `invalid` and
 * either has been interacted with (`dirty` or `touched`) or its parent form
 * has been submitted. Matches Material's default behavior.
 */
export const defaultErrorStateMatcher: ErrorStateMatcher = {
  isErrorState(control, form) {
    if (!control) {
      return false;
    }
    const interacted = control.dirty || control.touched;
    return !!control.invalid && (interacted || !!form?.submitted);
  },
};

/**
 * Injection token carrying the {@link ErrorStateMatcher} used by every ngx-tw
 * form control. Defaults to {@link defaultErrorStateMatcher}; provide a
 * different matcher at root to change global error-display policy, or at any
 * descendant injector to scope the change.
 */
export const TW_ERROR_STATE_MATCHER = new InjectionToken<ErrorStateMatcher>(
  'TW_ERROR_STATE_MATCHER',
  {
    providedIn: 'root',
    factory: () => defaultErrorStateMatcher,
  },
);
