import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { type TwThemeConfig, DEFAULT_TW_THEME_CONFIG } from './theme.types';
import { ThemeService } from './theme.service';

/**
 * Injection token carrying the resolved {@link TwThemeConfig} (storage key,
 * attribute, target element, default theme).
 *
 * The value is `Required<TwThemeConfig>`: `TwThemeConfig`'s members are
 * optional so consumers can pass a partial config, but `provideTheme` fills
 * every key from {@link DEFAULT_TW_THEME_CONFIG} before providing it. Injectors
 * therefore still read a non-optional field for each setting, exactly as
 * before this token's type was tightened.
 */
export const THEME_CONFIG = new InjectionToken<Required<TwThemeConfig>>('THEME_CONFIG');

/**
 * Registers {@link ThemeService} and a {@link THEME_CONFIG} value built by
 * merging `config` over {@link DEFAULT_TW_THEME_CONFIG}. Call once in the
 * app's environment providers.
 *
 * Keys explicitly set to `undefined` are dropped before merging. Root
 * `tsconfig.json` does not set `exactOptionalPropertyTypes`, so
 * `provideTheme({ storageKey: env.themeKey })` type-checks even when
 * `env.themeKey` is `string | undefined` — and a plain spread would then write
 * `undefined` into a field `TwThemeConfig` types as `string`, making
 * `ThemeService` persist under the literal `localStorage` key `"undefined"`
 * (and, for `attribute`, call `setAttribute("undefined", …)`).
 */
export function provideTheme(config?: Partial<TwThemeConfig>): EnvironmentProviders {
  const overrides = Object.fromEntries(
    Object.entries(config ?? {}).filter(([, value]) => value !== undefined),
  );
  return makeEnvironmentProviders([
    {
      provide: THEME_CONFIG,
      useValue: { ...DEFAULT_TW_THEME_CONFIG, ...overrides } as Required<TwThemeConfig>,
    },
    ThemeService,
  ]);
}
