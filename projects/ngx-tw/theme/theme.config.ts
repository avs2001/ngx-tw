import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { type TwThemeConfig, DEFAULT_TW_THEME_CONFIG } from './theme.types';
import { ThemeService } from './theme.service';

/** Injection token carrying the resolved {@link TwThemeConfig} (storage key, attribute, target element, default theme). */
export const THEME_CONFIG = new InjectionToken<TwThemeConfig>('THEME_CONFIG');

/**
 * Registers {@link ThemeService} and a {@link THEME_CONFIG} value built by
 * merging `config` over {@link DEFAULT_TW_THEME_CONFIG}. Call once in the
 * app's environment providers.
 */
export function provideTheme(config?: Partial<TwThemeConfig>): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: THEME_CONFIG,
      useValue: { ...DEFAULT_TW_THEME_CONFIG, ...config },
    },
    ThemeService,
  ]);
}
