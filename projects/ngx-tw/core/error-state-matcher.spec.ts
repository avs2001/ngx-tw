import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import {
  defaultErrorStateMatcher,
  type TwFormSubmitted,
} from './error-state-matcher';

function makeForm(submitted: boolean): TwFormSubmitted {
  return { submitted };
}

describe('defaultErrorStateMatcher', () => {
  it('returns false when the control is null', () => {
    expect(defaultErrorStateMatcher.isErrorState(null, null)).toBe(false);
    expect(defaultErrorStateMatcher.isErrorState(null, makeForm(true))).toBe(false);
  });

  it('returns false when the control is pristine + untouched (even if invalid)', () => {
    const control = new FormControl('', () => ({ required: true }));
    control.updateValueAndValidity();
    expect(control.invalid).toBe(true);
    expect(control.dirty).toBe(false);
    expect(control.touched).toBe(false);
    expect(defaultErrorStateMatcher.isErrorState(control, null)).toBe(false);
  });

  it('returns true when invalid + dirty', () => {
    const control = new FormControl('', () => ({ required: true }));
    control.markAsDirty();
    control.updateValueAndValidity();
    expect(defaultErrorStateMatcher.isErrorState(control, null)).toBe(true);
  });

  it('returns true when invalid + touched', () => {
    const control = new FormControl('', () => ({ required: true }));
    control.markAsTouched();
    control.updateValueAndValidity();
    expect(defaultErrorStateMatcher.isErrorState(control, null)).toBe(true);
  });

  it('returns true when invalid + form submitted (even if untouched)', () => {
    const control = new FormControl('', () => ({ required: true }));
    control.updateValueAndValidity();
    expect(control.dirty).toBe(false);
    expect(control.touched).toBe(false);
    expect(defaultErrorStateMatcher.isErrorState(control, makeForm(true))).toBe(true);
  });

  it('returns false when invalid + untouched + form not submitted', () => {
    const control = new FormControl('', () => ({ required: true }));
    control.updateValueAndValidity();
    expect(defaultErrorStateMatcher.isErrorState(control, makeForm(false))).toBe(false);
  });

  it('returns false when valid regardless of interaction state', () => {
    const control = new FormControl('value');
    control.markAsTouched();
    control.markAsDirty();
    expect(defaultErrorStateMatcher.isErrorState(control, makeForm(true))).toBe(false);
  });
});
