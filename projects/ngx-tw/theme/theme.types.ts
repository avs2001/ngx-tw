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
  readonly theme: Theme;
  readonly resolvedTheme: ResolvedTheme;
  readonly systemTheme: ResolvedTheme;
  readonly isDark: boolean;
  readonly isLight: boolean;
  readonly isHighContrast: boolean;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  defaultTheme: 'system',
  storageKey: 'ngx-tw-theme',
  attribute: 'data-theme',
  target: 'documentElement',
};
