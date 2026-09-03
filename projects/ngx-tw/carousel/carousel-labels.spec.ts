import { describe, expect, it } from 'vitest';

import { DEFAULT_CAROUSEL_LABELS, formatLabel } from './carousel-labels';

// Extracting `formatLabel` out of `carousel.ts` is what makes these assertions
// possible: two of the three branches below cannot be reached through the
// component API at all. `resolvedLabels()` filters explicitly-undefined keys,
// so the non-string guard is dead from the outside; and every shipped default
// template supplies exactly the variables its call site passes, so the
// unknown-placeholder path never fires either. The remaining component-level
// behaviour (slide `aria-label`, indicator `aria-label`) is already covered
// through the DOM in `carousel.spec.ts` and is not restated here.

describe('formatLabel', () => {
  it('substitutes every known placeholder, including repeats', () => {
    expect(formatLabel('{a} then {b} then {a}', { a: 'x', b: 'y' })).toBe(
      'x then y then x',
    );
  });

  it('stringifies numeric values', () => {
    expect(
      formatLabel(DEFAULT_CAROUSEL_LABELS.slideOf, { index: 2, total: 5 }),
    ).toBe('2 of 5');
  });

  it('leaves an unknown placeholder verbatim rather than emitting "undefined"', () => {
    // Without the `hasOwnProperty` guard this would render "1 of undefined".
    expect(formatLabel('{index} of {total}', { index: 1 })).toBe('1 of {total}');
  });

  it('returns an empty string for a non-string template instead of throwing', () => {
    // Defence in depth: unreachable via the `labels` input, but a regression in
    // `resolvedLabels()`'s undefined filter would otherwise throw inside a
    // `computed` and take the whole render down. Without the guard this call
    // throws `template.replace is not a function`.
    expect(
      formatLabel(undefined as unknown as string, { index: 1, total: 2 }),
    ).toBe('');
  });
});
