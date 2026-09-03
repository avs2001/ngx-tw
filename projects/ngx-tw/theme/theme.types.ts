/**
 * The user-selectable theme. `'system'` defers to the OS, resolving
 * `prefers-color-scheme` and `prefers-contrast` as two independent axes: dark
 * plus increased contrast lands on `'high-contrast-dark'`, light plus increased
 * contrast on `'high-contrast'`.
 */
export type TwTheme = 'light' | 'dark' | 'high-contrast' | 'high-contrast-dark' | 'system';

/**
 * The theme actually applied to the DOM after resolving `'system'` against the
 * OS preference.
 *
 * The two axes are appearance (light / dark) and contrast (normal / increased),
 * so the four values are their product: `'high-contrast'` is the light-based
 * increased-contrast scheme and `'high-contrast-dark'` the dark-based one.
 */
export type TwResolvedTheme = 'light' | 'dark' | 'high-contrast' | 'high-contrast-dark';

/** Ordered list of every {@link TwTheme} value, used by `cycleTheme()` and for UI iteration. */
export const TW_THEMES = [
  'light',
  'dark',
  'high-contrast',
  'high-contrast-dark',
  'system',
] as const satisfies readonly TwTheme[];

/** Ordered list of every {@link TwResolvedTheme} value (i.e. {@link TW_THEMES} minus `'system'`). */
export const TW_RESOLVED_THEMES = [
  'light',
  'dark',
  'high-contrast',
  'high-contrast-dark',
] as const satisfies readonly TwResolvedTheme[];

/**
 * Runtime configuration for {@link provideTheme}; controls storage, attribute
 * name, target element, and default.
 *
 * Every member is optional. This interface only ever reaches consumers through
 * `provideTheme(config?: Partial<TwThemeConfig>)`, which fills each unset key
 * from {@link DEFAULT_TW_THEME_CONFIG} — so a consumer holding a config object
 * typed as `TwThemeConfig` must not be forced to restate keys they do not
 * override, and adding a member in a future minor must not break them. The
 * resolved value handed to {@link TW_THEME_CONFIG} is `Required<TwThemeConfig>`.
 */
export interface TwThemeConfig {
  /** The default theme when no preference is stored. Defaults to `'system'`. */
  defaultTheme?: TwTheme;
  /**
   * localStorage key for persisting an explicit theme choice. Defaults to
   * `'ngx-tw-theme'`. Only `setTheme()` / `cycleTheme()` write it — providing
   * the service never does.
   */
  storageKey?: string;
  /** The HTML attribute written to the target element. Defaults to `'data-theme'`. */
  attribute?: string;
  /** Which element receives the theme attribute. Defaults to `'documentElement'`. */
  target?: 'documentElement' | 'body';
}

/**
 * Composite snapshot of `ThemeService` state — selected, resolved, system, and
 * boolean flags.
 *
 * The three flags are **not** mutually exclusive: `'high-contrast-dark'` sets
 * both {@link isDark} and {@link isHighContrast}, because it is dark *and*
 * high contrast. Branch on {@link resolvedTheme} when you need one case.
 */
export interface TwThemeState {
  /** The user-selected theme — may be `'system'`. */
  readonly theme: TwTheme;
  /** The theme actually applied to the DOM — never `'system'`. */
  readonly resolvedTheme: TwResolvedTheme;
  /** The OS appearance preference detected via `prefers-color-scheme` and `prefers-contrast`. */
  readonly systemTheme: TwResolvedTheme;
  /** True when {@link resolvedTheme} is a dark scheme — `'dark'` or `'high-contrast-dark'`. */
  readonly isDark: boolean;
  /** True when {@link resolvedTheme} is exactly `'light'`; the light-based `'high-contrast'` does not set it. */
  readonly isLight: boolean;
  /** True when {@link resolvedTheme} is an increased-contrast scheme — `'high-contrast'` or `'high-contrast-dark'`. */
  readonly isHighContrast: boolean;
}

/**
 * Built-in defaults merged under any user-provided {@link TwThemeConfig} by
 * `provideTheme()`. Typed `Required<TwThemeConfig>` so readers keep a
 * non-optional `string` / `TwTheme` for every field even though the interface
 * itself is all-optional.
 */
export const DEFAULT_TW_THEME_CONFIG: Required<TwThemeConfig> = {
  defaultTheme: 'system',
  storageKey: 'ngx-tw-theme',
  attribute: 'data-theme',
  target: 'documentElement',
};
