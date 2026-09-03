export { ThemeService } from './theme.service';
export { ThemeDirective } from './theme.directive';
export {
  TW_THEME_CONFIG,
  /** @deprecated Use `TW_THEME_CONFIG` — same token instance. */
  THEME_CONFIG,
  provideTheme,
} from './theme.config';
export { TW_THEME_BOOTSTRAP_SCRIPT } from './theme.bootstrap';
export {
  type TwTheme,
  type TwResolvedTheme,
  type TwThemeConfig,
  type TwThemeState,
  TW_THEMES,
  TW_RESOLVED_THEMES,
  DEFAULT_TW_THEME_CONFIG,
} from './theme.types';
