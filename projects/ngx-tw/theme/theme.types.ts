export type Theme = 'light' | 'dark' | 'high-contrast' | 'system';
export type ResolvedTheme = 'light' | 'dark' | 'high-contrast';

export const THEMES = ['light', 'dark', 'high-contrast', 'system'] as const satisfies readonly Theme[];
export const RESOLVED_THEMES = ['light', 'dark', 'high-contrast'] as const satisfies readonly ResolvedTheme[];

export interface ThemeConfig {
  /** The default theme when no preference is stored. Defaults to `'system'`. */
  defaultTheme: Theme;
  /** localStorage key for persisting theme preference. Defaults to `'ngx-tw-theme'`. */
  storageKey: string;
  /** The HTML attribute written to the target element. Defaults to `'data-theme'`. */
  attribute: string;
  /** Which element receives the theme attribute. Defaults to `'documentElement'`. */
  target: 'documentElement' | 'body';
}

export interface ThemeState {
  /** The user-selected theme — may be `'system'`. */
  readonly theme: Theme;
  /** The theme actually applied to the DOM — never `'system'`. */
  readonly resolvedTheme: ResolvedTheme;
  /** The OS color-scheme preference detected via `prefers-color-scheme`. */
  readonly systemTheme: ResolvedTheme;
  /** True when {@link resolvedTheme} is `'dark'`. */
  readonly isDark: boolean;
  /** True when {@link resolvedTheme} is `'light'`. */
  readonly isLight: boolean;
  /** True when {@link resolvedTheme} is `'high-contrast'`. */
  readonly isHighContrast: boolean;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  defaultTheme: 'system',
  storageKey: 'ngx-tw-theme',
  attribute: 'data-theme',
  target: 'documentElement',
};
