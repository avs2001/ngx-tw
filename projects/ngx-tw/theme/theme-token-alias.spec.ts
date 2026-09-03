import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { THEME_CONFIG, TW_THEME_CONFIG } from './theme.config';
import { ThemeService } from './theme.service';
import { DEFAULT_TW_THEME_CONFIG, type TwThemeConfig } from './theme.types';

/**
 * `THEME_CONFIG` was renamed to `TW_THEME_CONFIG`. The alias must be a
 * *reference to the same `InjectionToken` instance*, never a second
 * `new InjectionToken(...)`: two instances are two distinct DI keys, so an app
 * that hand-provides `THEME_CONFIG` (instead of calling `provideTheme()`) would
 * leave `ThemeService` with no config at all.
 *
 * The service test below runs under `PLATFORM_ID: 'server'` on purpose: that
 * branch skips `matchMedia`, the media listeners and the `documentElement`
 * write, so the test needs no globals stubbed and mutates nothing — while
 * `loadInitialTheme()` and `applyToElement()` still read the injected config,
 * which is the thing under test.
 */

const CUSTOM: Required<TwThemeConfig> = {
  ...DEFAULT_TW_THEME_CONFIG,
  defaultTheme: 'dark',
  attribute: 'data-scheme',
};

describe('THEME_CONFIG → TW_THEME_CONFIG alias', () => {
  it('is the same token instance, not a second InjectionToken', () => {
    expect(THEME_CONFIG).toBe(TW_THEME_CONFIG);
  });

  it('lets ThemeService, which injects the new name, read a config provided under the deprecated name', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: THEME_CONFIG, useValue: CUSTOM },
        { provide: PLATFORM_ID, useValue: 'server' },
        ThemeService,
      ],
    });

    // A split DI graph fails loudly right here: `inject(TW_THEME_CONFIG)` in
    // the service's field initialiser would raise NullInjectorError.
    const service = TestBed.inject(ThemeService);

    // Both config reads the service makes, observed through behaviour rather
    // than through the injected object.
    expect(service.theme()).toBe('dark');

    const element = TestBed.inject(DOCUMENT).createElement('div');
    service.applyToElement(element, 'high-contrast');
    expect(element.getAttribute('data-scheme')).toBe('high-contrast');
    expect(element.hasAttribute('data-theme')).toBe(false);
  });

  it('resolves a config provided under the new name when injected under the deprecated name', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: TW_THEME_CONFIG, useValue: CUSTOM }],
    });
    expect(TestBed.inject(THEME_CONFIG)).toBe(CUSTOM);
  });
});
