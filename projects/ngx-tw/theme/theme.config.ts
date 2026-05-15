import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { type ThemeConfig, DEFAULT_THEME_CONFIG } from './theme.types';
import { ThemeService } from './theme.service';

/** Injection token carrying the resolved {@link ThemeConfig} (storage key, attribute, target element, default theme). */
export const THEME_CONFIG = new InjectionToken<ThemeConfig>('THEME_CONFIG');

/**
 * Registers {@link ThemeService} and a {@link THEME_CONFIG} value built by
 * merging `config` over {@link DEFAULT_THEME_CONFIG}. Call once in the app's
 * environment providers.
 */
export function provideTheme(config?: Partial<ThemeConfig>): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: THEME_CONFIG,
      useValue: { ...DEFAULT_THEME_CONFIG, ...config },
    },
    ThemeService,
  ]);
}
