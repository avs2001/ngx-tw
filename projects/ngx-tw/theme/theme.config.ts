import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { type ThemeConfig, DEFAULT_THEME_CONFIG } from './theme.types';
import { ThemeService } from './theme.service';

export const THEME_CONFIG = new InjectionToken<ThemeConfig>('THEME_CONFIG');

export function provideTheme(config?: Partial<ThemeConfig>): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: THEME_CONFIG,
      useValue: { ...DEFAULT_THEME_CONFIG, ...config },
    },
    ThemeService,
  ]);
}
