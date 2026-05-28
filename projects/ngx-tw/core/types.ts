/** Semantic color palette used across all ngx-tw components. */
export type TwColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

/** Size scale used across all ngx-tw components. */
export type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Layout axis used by oriented components (tabs, segmented-control, separator, etc.). */
export type TwOrientation = 'horizontal' | 'vertical';

/** Tailwind-aligned breakpoint. Used by responsive component inputs. */
export type TwBreakpoint = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Range-mode behavior knobs shared by `tw-calendar` (when `mode="range"`) and
 * by overlay-bearing range pickers that forward to it. Consumer inputs accept
 * `Partial<RangeBehaviorConfig>`; unset fields fall back to the documented
 * defaults — `allowSingleDayRange` and `persistPartialRange` default to `true`
 * because dropping either would surprise consumers (clicking the same cell
 * twice and committing one day; an in-flight draft surviving navigation are
 * the expected gestures). `allowBackwardRange` and
 * `disableRangesCrossingDisabledDates` default to `false`.
 */
export interface RangeBehaviorConfig {
  /**
   * When `true`, the calendar accepts ranges with `start > end` and skips
   * the auto-swap path (§21.5). Default `false` — backward clicks normalize.
   */
  allowBackwardRange: boolean;
  /**
   * When `true`, clicking the same cell as `draft.start` commits a single-day
   * range `{ start, end: start }`. When `false`, the click is rejected with
   * `data-state-invalid-flash`. Default `true` — selecting one day twice in
   * range mode is the expected user gesture.
   */
  allowSingleDayRange: boolean;
  /**
   * When `true`, the in-flight range draft survives across view navigation
   * (next/prev month, drill-up/down). When `false`, navigation during
   * SELECTING discards the draft and emits `selectionCleared`. Default
   * `true` — losing a half-finished range on navigation is unexpected.
   */
  persistPartialRange: boolean;
  /**
   * When `true`, a range commit that would span any disabled date in its
   * interior is rejected with `data-state-invalid-flash` and the committed
   * value is left unchanged. Default `false`.
   */
  disableRangesCrossingDisabledDates: boolean;
}
