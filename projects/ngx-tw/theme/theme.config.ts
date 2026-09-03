import {
  InjectionToken,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  type EnvironmentProviders,
} from '@angular/core';
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
export const TW_THEME_CONFIG = new InjectionToken<Required<TwThemeConfig>>('TW_THEME_CONFIG');

/**
 * @deprecated Renamed to {@link TW_THEME_CONFIG} for consistency with every
 * other ngx-tw injection token. This is the *same token instance*, not a copy —
 * providing under either name and injecting under the other resolves — so the
 * rename is safe to adopt incrementally. Removed in the next major.
 */
export const THEME_CONFIG = TW_THEME_CONFIG;

/**
 * Registers {@link ThemeService}, a {@link TW_THEME_CONFIG} value built by merging
 * `config` over {@link DEFAULT_TW_THEME_CONFIG}, and an environment initializer
 * that constructs the service at bootstrap. Call once in the app's environment
 * providers.
 *
 * The initializer is what makes the call self-sufficient. Everything that
 * applies a theme lives in `ThemeService`'s field initialisers and constructor
 * effect, so without it the stored preference was read — and `data-theme`
 * written — only once something happened to `inject(ThemeService)`. An app
 * whose theme toggle sits in a lazily-loaded route therefore rendered every
 * other route with no `data-theme` at all, silently falling back to the
 * `prefers-color-scheme` CSS branch; the failure looked intermittent because
 * it disappeared whenever the stored choice agreed with the OS. Injecting the
 * service yourself is still supported and is idempotent.
 *
 * Keys explicitly set to `undefined` are dropped before merging. Root
 * `tsconfig.json` does not set `exactOptionalPropertyTypes`, so
 * `provideTheme({ storageKey: env.themeKey })` type-checks even when
 * `env.themeKey` is `string | undefined` — and a plain spread would then write
 * `undefined` into a field `TwThemeConfig` types as `string`, making
 * `ThemeService` persist under the literal `localStorage` key `"undefined"`
 * (and, for `attribute`, call `setAttribute("undefined", …)`).
 *
 * Providing the service does **not** write to `localStorage`; only an explicit
 * `setTheme()` / `cycleTheme()` does. For a flash-free first paint when the
 * stored choice disagrees with the OS, pair this with
 * {@link TW_THEME_BOOTSTRAP_SCRIPT} in `index.html`.
 */
export function provideTheme(config?: Partial<TwThemeConfig>): EnvironmentProviders {
  const overrides = Object.fromEntries(
    Object.entries(config ?? {}).filter(([, value]) => value !== undefined),
  );
  return makeEnvironmentProviders([
    {
      provide: TW_THEME_CONFIG,
      useValue: { ...DEFAULT_TW_THEME_CONFIG, ...overrides } as Required<TwThemeConfig>,
    },
    ThemeService,
    provideEnvironmentInitializer(() => {
      inject(ThemeService);
    }),
  ]);
}
