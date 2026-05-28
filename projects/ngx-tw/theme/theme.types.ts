/** The user-selectable theme. `'system'` defers to the OS `prefers-color-scheme` setting. */
export type TwTheme = 'light' | 'dark' | 'high-contrast' | 'system';

/** The theme actually applied to the DOM after resolving `'system'` against the OS preference. */
export type TwResolvedTheme = 'light' | 'dark' | 'high-contrast';

/** Ordered list of every {@link TwTheme} value, used by `cycleTheme()` and for UI iteration. */
export const TW_THEMES = ['light', 'dark', 'high-contrast', 'system'] as const satisfies readonly TwTheme[];

/** Ordered list of every {@link TwResolvedTheme} value (i.e. {@link TW_THEMES} minus `'system'`). */
export const TW_RESOLVED_THEMES = ['light', 'dark', 'high-contrast'] as const satisfies readonly TwResolvedTheme[];

/** Runtime configuration for {@link provideTheme}; controls storage, attribute name, target element, and default. */
export interface TwThemeConfig {
  /** The default theme when no preference is stored. Defaults to `'system'`. */
  defaultTheme: TwTheme;
  /** localStorage key for persisting theme preference. Defaults to `'ngx-tw-theme'`. */
  storageKey: string;
  /** The HTML attribute written to the target element. Defaults to `'data-theme'`. */
  attribute: string;
  /** Which element receives the theme attribute. Defaults to `'documentElement'`. */
  target: 'documentElement' | 'body';
}

/** Composite snapshot of `ThemeService` state — selected, resolved, system, and boolean flags. */
export interface TwThemeState {
  /** The user-selected theme — may be `'system'`. */
  readonly theme: TwTheme;
  /** The theme actually applied to the DOM — never `'system'`. */
  readonly resolvedTheme: TwResolvedTheme;
  /** The OS color-scheme preference detected via `prefers-color-scheme`. */
  readonly systemTheme: TwResolvedTheme;
  /** True when {@link resolvedTheme} is `'dark'`. */
  readonly isDark: boolean;
  /** True when {@link resolvedTheme} is `'light'`. */
  readonly isLight: boolean;
  /** True when {@link resolvedTheme} is `'high-contrast'`. */
  readonly isHighContrast: boolean;
}

/** Built-in defaults merged under any user-provided {@link TwThemeConfig} by `provideTheme()`. */
export const DEFAULT_TW_THEME_CONFIG: TwThemeConfig = {
  defaultTheme: 'system',
  storageKey: 'ngx-tw-theme',
  attribute: 'data-theme',
  target: 'documentElement',
};
