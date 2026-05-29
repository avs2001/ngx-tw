import {
  Directive,
  computed,
  input,
} from '@angular/core';

/**
 * The aspect ratio applied when the input is absent, invalid, or non-positive.
 * Uses the spaced CSS form so every applied value (fallback and normalized
 * ratios alike) is rendered consistently.
 */
const DEFAULT_RATIO = '1 / 1';

/**
 * Normalizes a single ratio side: returns the numeric value when it parses as a
 * finite number greater than zero, otherwise `null`. Uses `Number()` (not
 * `parseFloat`) so partial-numeric garbage like `'16px'` is rejected rather than
 * silently truncated to `16`.
 */
function positiveOrNull(part: string): number | null {
  const n = Number(part.trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Coerces an aspect-ratio input into a valid CSS `aspect-ratio` string, or the
 * default when the value is invalid. Every output is normalized to the uniform
 * `'<w> / <h>'` form: a bare number `n` becomes `'n / 1'` (equivalent CSS), and
 * ratio strings using `/` or `:` are validated on both sides and joined with
 * `' / '`.
 */
function coerceRatio(value: number | string): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? `${value} / 1` : DEFAULT_RATIO;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return DEFAULT_RATIO;
  }

  // Ratio form: '16/9' or '16:9' (CSS rejects the colon, so normalize to '/').
  if (trimmed.includes('/') || trimmed.includes(':')) {
    const parts = trimmed.split(/[/:]/);
    if (parts.length !== 2) {
      return DEFAULT_RATIO;
    }
    const w = positiveOrNull(parts[0]);
    const h = positiveOrNull(parts[1]);
    return w !== null && h !== null ? `${w} / ${h}` : DEFAULT_RATIO;
  }

  // Plain numeric string: '1.5' → '1.5 / 1'.
  const single = positiveOrNull(trimmed);
  return single !== null ? `${single} / 1` : DEFAULT_RATIO;
}

/**
 * Sets the native CSS `aspect-ratio` property on its host element, standardizing
 * the `aspect-[16/9]` pattern consumers otherwise hand-roll across cards,
 * thumbnails, video, and image grids.
 *
 * The directive sets **only** `aspect-ratio` — it does not set `width`,
 * `display`, or any other layout property (matching Tailwind's `aspect-*`
 * utility). Block-level hosts already fill their container width; for replaced
 * elements (`<img>`, `<video>`) pair it with `w-full` / `object-cover` so the
 * box has a definite cross-axis size.
 *
 * Purely presentational: it adds no `role` or `aria-*` and leaves the host
 * media's own accessibility (`alt`, `aria-*`, `title`) untouched.
 *
 * @example
 * ```html
 * <div twAspectRatio class="w-full bg-surface-muted"></div>
 * <img twAspectRatio="16/9" class="w-full object-cover rounded-lg" [src]="thumb" alt="Preview" />
 * <div [twAspectRatio]="4 / 3" class="w-full"></div>
 * <video twAspectRatio="21:9" class="w-full" [src]="clip"></video>
 * ```
 */
@Directive({
  selector: '[twAspectRatio]',
  exportAs: 'twAspectRatio',
  host: {
    '[style.aspect-ratio]': 'ratio()',
  },
})
export class AspectRatioDirective {
  /**
   * Sets the host's aspect ratio. Accepts a unitless number (e.g. `1.7777`) or a
   * ratio string using `/` or `:` (e.g. `'16/9'` or `'16:9'`). The value is
   * normalized to CSS `'<w> / <h>'` form (a bare number `n` becomes `'n / 1'`).
   * Invalid or non-positive values fall back to the default. Defaults to a
   * square (`1 / 1`).
   */
  readonly twAspectRatio = input<number | string>(DEFAULT_RATIO);

  /** The coerced, CSS-valid `aspect-ratio` value applied to the host. */
  readonly ratio = computed(() => coerceRatio(this.twAspectRatio()));
}
