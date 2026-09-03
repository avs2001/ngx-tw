import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ThemeService } from './theme.service';
// `THEME_CONFIG` is deliberately the *deprecated* spelling: `provideTheme()`
// now provides `TW_THEME_CONFIG`, so the read at the bottom of this file
// doubles as an end-to-end proof that the alias is the same token instance.
// See `theme-token-alias.spec.ts`.
import { provideTheme, THEME_CONFIG } from './theme.config';
import { DEFAULT_TW_THEME_CONFIG } from './theme.types';
import type { TwTheme } from './theme.types';
import { describe, it, expect, vi, afterEach } from 'vitest';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const CONTRAST_QUERY = '(prefers-contrast: more)';

/**
 * A `MediaQueryList` double that is *stateful* and keyed by its query string.
 * The previous mock returned a fresh object with a fixed `matches` for every
 * query, which meant `matchMedia('(prefers-contrast: more)')` would answer with
 * the colour-scheme preference — a mock that lies about the thing under test.
 */
function createMediaQueryList(query: string, matches: boolean) {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];
  const mql = {
    media: query,
    matches,
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    }),
    /** Flips the preference and notifies, the way a real OS change does. */
    emit(next: boolean) {
      mql.matches = next;
      for (const cb of [...listeners]) cb({ matches: next } as MediaQueryListEvent);
    },
    listenerCount: () => listeners.length,
  };
  return mql;
}

describe('ThemeService', () => {
  let service: ThemeService;
  let doc: Document;

  function setup(options?: {
    defaultTheme?: TwTheme;
    storedTheme?: string | null;
    prefersDark?: boolean;
    prefersContrast?: boolean;
    platform?: string;
  }) {
    const {
      defaultTheme = 'system',
      storedTheme = null,
      prefersDark = false,
      prefersContrast = false,
      platform = 'browser',
    } = options ?? {};

    // Mock localStorage
    const storage = new Map<string, string>();
    if (storedTheme !== null) {
      storage.set(DEFAULT_TW_THEME_CONFIG.storageKey, storedTheme);
    }
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
    });

    // Mock matchMedia — one persistent double per query, so repeated calls
    // return the same object the service attached its listener to.
    const queries = new Map<string, ReturnType<typeof createMediaQueryList>>();
    queries.set(DARK_QUERY, createMediaQueryList(DARK_QUERY, prefersDark));
    queries.set(CONTRAST_QUERY, createMediaQueryList(CONTRAST_QUERY, prefersContrast));
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => {
        let mql = queries.get(query);
        if (!mql) {
          mql = createMediaQueryList(query, false);
          queries.set(query, mql);
        }
        return mql;
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        provideTheme({ defaultTheme }),
        ...(platform === 'server' ? [{ provide: PLATFORM_ID, useValue: 'server' }] : []),
      ],
    });

    service = TestBed.inject(ThemeService);
    doc = TestBed.inject(DOCUMENT);

    const media = (query: string) => {
      const mql = queries.get(query);
      if (!mql) throw new Error(`matchMedia was never called with ${query}`);
      return mql;
    };

    return { storage, media };
  }

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
    // `data-theme` lives on the shared jsdom documentElement and survives
    // `resetTestingModule`. Without this, a test asserting the attribute can
    // pass on residue left by an earlier one.
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
  });

  it('should load theme from localStorage when a valid value is stored', () => {
    setup({ storedTheme: 'dark' });
    expect(service.theme()).toBe('dark');
  });

  it('should fall back to defaultTheme when nothing is stored', () => {
    setup({ defaultTheme: 'light' });
    expect(service.theme()).toBe('light');
  });

  it('should fall back to defaultTheme when an invalid value is stored', () => {
    setup({ defaultTheme: 'light', storedTheme: 'neon' });
    expect(service.theme()).toBe('light');
  });

  it('should update theme signal and persist to localStorage on setTheme', () => {
    const { storage } = setup();
    service.setTheme('dark');
    TestBed.flushEffects();
    expect(service.theme()).toBe('dark');
    expect(storage.get(DEFAULT_TW_THEME_CONFIG.storageKey)).toBe('dark');
  });

  it('should never return system from resolvedTheme', () => {
    setup({ defaultTheme: 'system', prefersDark: true });
    expect(service.theme()).toBe('system');
    expect(service.resolvedTheme()).toBe('dark');
  });

  it('should resolve system to light when OS prefers light', () => {
    setup({ defaultTheme: 'system', prefersDark: false });
    expect(service.resolvedTheme()).toBe('light');
  });

  // `isDark` / `isHighContrast` answer two independent questions — appearance
  // and contrast — so they are deliberately NOT mutually exclusive since
  // `'high-contrast-dark'` exists. `isLight` stays exactly `=== 'light'`: the
  // light-based `'high-contrast'` does not set it, and widening it would
  // change what a shipped scheme reports to consumers already reading it.
  it('reports isDark / isLight / isHighContrast per axis, not per scheme', () => {
    setup({ defaultTheme: 'dark' });

    expect(service.isDark()).toBe(true);
    expect(service.isLight()).toBe(false);
    expect(service.isHighContrast()).toBe(false);

    service.setTheme('light');
    expect(service.isDark()).toBe(false);
    expect(service.isLight()).toBe(true);
    expect(service.isHighContrast()).toBe(false);

    service.setTheme('high-contrast');
    expect(service.isDark()).toBe(false);
    expect(service.isLight()).toBe(false);
    expect(service.isHighContrast()).toBe(true);

    // Both axes at once. Under the pre-`high-contrast-dark` flags — strict
    // `=== 'dark'` / `=== 'high-contrast'` equality — every one of these three
    // read `false`, which would have painted light-surface chart colours onto
    // a dark surface for anyone branching on `isDark()`.
    service.setTheme('high-contrast-dark');
    expect(service.isDark()).toBe(true);
    expect(service.isLight()).toBe(false);
    expect(service.isHighContrast()).toBe(true);
  });

  it('should cycle through all themes in order', () => {
    setup({ defaultTheme: 'light' });

    expect(service.theme()).toBe('light');
    service.cycleTheme();
    expect(service.theme()).toBe('dark');
    service.cycleTheme();
    expect(service.theme()).toBe('high-contrast');
    service.cycleTheme();
    expect(service.theme()).toBe('high-contrast-dark');
    service.cycleTheme();
    expect(service.theme()).toBe('system');
    service.cycleTheme();
    expect(service.theme()).toBe('light');
  });

  it('should catch localStorage errors silently', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => { throw new Error('quota'); }),
      setItem: vi.fn(() => { throw new Error('quota'); }),
    });
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    TestBed.configureTestingModule({
      providers: [provideTheme()],
    });

    expect(() => {
      service = TestBed.inject(ThemeService);
      service.setTheme('dark');
      TestBed.flushEffects();
    }).not.toThrow();
  });

  it('should apply data-theme attribute to documentElement', () => {
    setup({ defaultTheme: 'dark' });
    TestBed.flushEffects();
    expect(doc.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should apply data-theme attribute to body when configured', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    TestBed.configureTestingModule({
      providers: [provideTheme({ defaultTheme: 'dark', target: 'body' })],
    });
    service = TestBed.inject(ThemeService);
    TestBed.flushEffects();
    expect(doc.body.getAttribute('data-theme')).toBe('dark');
  });

  it('should update systemTheme when media query changes', () => {
    const { media } = setup({ defaultTheme: 'system', prefersDark: false });
    expect(service.resolvedTheme()).toBe('light');

    media(DARK_QUERY).emit(true);
    expect(service.systemTheme()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
  });

  // ===== F4: `'system'` must be able to resolve to `'high-contrast'` =====
  // Before this, `detectSystemTheme()` and the listener queried only
  // `prefers-color-scheme`, so `systemTheme` was typed `TwResolvedTheme` but
  // could only ever hold `'light' | 'dark'` — the shipped, fully-parity'd
  // high-contrast scheme was unreachable from `'system'`.

  it('resolves system to high-contrast when the OS asks for more contrast', () => {
    setup({ defaultTheme: 'system', prefersDark: false, prefersContrast: true });
    expect(service.systemTheme()).toBe('high-contrast');
    expect(service.resolvedTheme()).toBe('high-contrast');
    expect(service.isHighContrast()).toBe(true);
  });

  // The two OS preferences are independent axes and compose into the full 2×2.
  // This used to resolve to plain `'dark'`: while `_high-contrast.css` was the
  // only high-contrast ramp and it is light-based, honouring contrast here
  // would have moved a dark+contrast user onto a white surface, so contrast
  // was suppressed whenever dark was also asked for. `_high-contrast-dark.css`
  // removed that constraint. Against that older `detectSystemTheme()` — `if
  // (prefersDark) return 'dark'` before the contrast check — this test reads
  // `'dark'` and fails on all four assertions below.
  it('resolves system to high-contrast-dark when the OS asks for dark AND more contrast', () => {
    setup({ defaultTheme: 'system', prefersDark: true, prefersContrast: true });
    expect(service.systemTheme()).toBe('high-contrast-dark');
    expect(service.resolvedTheme()).toBe('high-contrast-dark');
    expect(service.isDark()).toBe(true);
    expect(service.isHighContrast()).toBe(true);
  });

  it('writes the dark high-contrast scheme onto the document like any other', () => {
    setup({ defaultTheme: 'system', prefersDark: true, prefersContrast: true });
    TestBed.flushEffects();
    expect(doc.documentElement.getAttribute('data-theme')).toBe('high-contrast-dark');
  });

  it('composes the two axes live in both directions', () => {
    // Each axis flipped on its own must move the resolution along that axis
    // only. Under the old ranking the second assertion read `'dark'` (contrast
    // suppressed) and the fourth `'dark'` as well, so this fails twice.
    const { media } = setup({ defaultTheme: 'system' });
    expect(service.resolvedTheme()).toBe('light');

    media(CONTRAST_QUERY).emit(true);
    expect(service.resolvedTheme()).toBe('high-contrast');

    media(DARK_QUERY).emit(true);
    expect(service.resolvedTheme()).toBe('high-contrast-dark');

    media(CONTRAST_QUERY).emit(false);
    expect(service.resolvedTheme()).toBe('dark');

    media(DARK_QUERY).emit(false);
    expect(service.resolvedTheme()).toBe('light');
  });

  it('re-resolves live when the contrast preference changes', () => {
    const { media } = setup({ defaultTheme: 'system' });
    expect(service.resolvedTheme()).toBe('light');

    media(CONTRAST_QUERY).emit(true);
    expect(service.resolvedTheme()).toBe('high-contrast');

    media(CONTRAST_QUERY).emit(false);
    expect(service.resolvedTheme()).toBe('light');
  });

  // Guards the clobber this design exists to prevent: two independent
  // listeners, each setting `systemTheme` from its own query alone, would let
  // the next colour-scheme tick erase the contrast decision.
  it('does not let a colour-scheme change clobber the contrast decision', () => {
    const { media } = setup({ defaultTheme: 'system', prefersContrast: true });
    expect(service.resolvedTheme()).toBe('high-contrast');

    // The contrast preference is still set, so the colour-scheme tick moves
    // the appearance axis only — it must not drop back to plain `'dark'`.
    media(DARK_QUERY).emit(true);
    expect(service.resolvedTheme()).toBe('high-contrast-dark');

    media(DARK_QUERY).emit(false);
    expect(service.resolvedTheme()).toBe('high-contrast');
  });

  it('detaches both media listeners on destroy', () => {
    const { media } = setup();
    expect(media(DARK_QUERY).listenerCount()).toBe(1);
    expect(media(CONTRAST_QUERY).listenerCount()).toBe(1);

    service.ngOnDestroy();
    expect(media(DARK_QUERY).listenerCount()).toBe(0);
    expect(media(CONTRAST_QUERY).listenerCount()).toBe(0);
  });

  it('should apply theme to a specific element via applyToElement', () => {
    setup();
    const el = doc.createElement('div');
    service.applyToElement(el, 'dark');
    expect(el.getAttribute('data-theme')).toBe('dark');
  });

  it('should define --color-on-{role} tokens for all 8 semantic roles on the theme root', () => {
    setup();
    // Inject the canonical on-role token mappings from _semantic.css onto the
    // documentElement so we can verify them via getComputedStyle. Real apps
    // pick these up by importing `ngx-tw/theme`. Style-injection scope: this
    // checks token *names* are stable and non-empty, not that the actual
    // values resolve from the CSS asset — that belongs to an e2e contrast pass.
    // Keep this style block in sync with the `--color-on-*` block in _semantic.css.
    const style = doc.createElement('style');
    style.textContent = `:root {
      --color-on-info: #082f49;
      --color-on-success: #052e16;
      --color-on-warning: #451a03;
      --color-on-error: #450a0a;
      --color-on-primary: white;
      --color-on-secondary: white;
      --color-on-accent: white;
      --color-on-neutral: white;
    }`;
    doc.head.appendChild(style);
    try {
      const cs = getComputedStyle(doc.documentElement);
      for (const role of ['info', 'success', 'warning', 'error', 'primary', 'secondary', 'accent', 'neutral']) {
        expect(cs.getPropertyValue(`--color-on-${role}`).trim()).not.toBe('');
      }
    } finally {
      style.remove();
    }
  });

  it('should return correct composite state', () => {
    setup({ defaultTheme: 'dark', prefersDark: false });
    const state = service.state();
    expect(state.theme).toBe('dark');
    expect(state.resolvedTheme).toBe('dark');
    expect(state.systemTheme).toBe('light');
    expect(state.isDark).toBe(true);
    expect(state.isLight).toBe(false);
    expect(state.isHighContrast).toBe(false);
  });

  it('should skip DOM access when platform is server', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    TestBed.configureTestingModule({
      providers: [
        provideTheme({ defaultTheme: 'dark' }),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    expect(() => {
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
    }).not.toThrow();

    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem).not.toHaveBeenCalled();
  });

  // Regression guard for pass-4 API M2. `exactOptionalPropertyTypes` is off, so
  // `provideTheme({ storageKey: env.themeKey })` compiles when `env.themeKey`
  // is `string | undefined`. A plain spread wrote that `undefined` into fields
  // `TwThemeConfig` types as `string`, so `ThemeService` persisted under the
  // literal key `"undefined"` and would have called
  // `setAttribute("undefined", …)`.
  it('drops explicitly-undefined provideTheme keys instead of writing undefined', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
    });
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    TestBed.configureTestingModule({
      providers: [
        provideTheme({
          storageKey: undefined,
          attribute: undefined,
          target: undefined,
          defaultTheme: 'dark',
        }),
      ],
    });

    expect(TestBed.inject(THEME_CONFIG)).toEqual({
      ...DEFAULT_TW_THEME_CONFIG,
      defaultTheme: 'dark',
    });

    service = TestBed.inject(ThemeService);
    doc = TestBed.inject(DOCUMENT);
    service.setTheme('light');
    TestBed.flushEffects();

    expect(storage.has('undefined')).toBe(false);
    expect(storage.get(DEFAULT_TW_THEME_CONFIG.storageKey)).toBe('light');
    expect(doc.documentElement.getAttribute('undefined')).toBeNull();
    expect(doc.documentElement.getAttribute('data-theme')).toBe('light');
  });

  // ===== F5: constructing the service must not write to localStorage =====
  // The constructor effect used to call `persistTheme(selected)` on its first
  // run, so merely loading the app stored the configured `defaultTheme`. From
  // then on `loadInitialTheme()` found a value and `defaultTheme` was
  // permanently ignored for that browser — and the library wrote to client
  // storage with no user action, which consumers under a storage-consent flow
  // cannot accept. Against the old code this fails on the very first
  // assertion: the flushed effect has already called `setItem`.
  it('does not write to localStorage until an explicit setTheme', () => {
    const { storage } = setup({ defaultTheme: 'dark' });
    TestBed.flushEffects();

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(storage.size).toBe(0);
    // The theme still applied — this is about storage, not about the DOM.
    expect(doc.documentElement.getAttribute('data-theme')).toBe('dark');

    service.setTheme('light');
    expect(storage.get(DEFAULT_TW_THEME_CONFIG.storageKey)).toBe('light');
  });

  it('persists through cycleTheme as well', () => {
    const { storage } = setup({ defaultTheme: 'light' });
    service.cycleTheme();
    expect(storage.get(DEFAULT_TW_THEME_CONFIG.storageKey)).toBe('dark');
  });
});

// ===== F2: `provideTheme()` must construct the service itself =====
// This describe deliberately never injects `ThemeService`. `provideTheme`
// previously only *registered* it, so everything that applies a theme — the
// field initialisers and the constructor effect — waited for a first
// `inject()`. An app whose toggle lives in a lazily-loaded route rendered
// every other route with no `data-theme` at all. Against the old code nothing
// constructs the service here, so the attribute stays `null` and the
// assertion fails.
describe('provideTheme bootstrap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
    document.documentElement.removeAttribute('data-theme');
  });

  it('applies the theme without anything injecting ThemeService', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => createMediaQueryList(query, false)),
    );

    TestBed.configureTestingModule({
      providers: [provideTheme({ defaultTheme: 'dark' })],
    });

    // Prove the assertion below cannot pass on residue from another test.
    document.documentElement.removeAttribute('data-theme');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();

    // Resolving *any* token creates the environment injector, which runs the
    // environment initializers — including the one that constructs
    // `ThemeService`. `DOCUMENT` is not `ThemeService`, which is the point.
    const doc = TestBed.inject(DOCUMENT);
    TestBed.flushEffects();

    expect(doc.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('reads a persisted choice without anything injecting ThemeService', () => {
    const storage = new Map<string, string>([
      [DEFAULT_TW_THEME_CONFIG.storageKey, 'high-contrast'],
    ]);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn(),
    });
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => createMediaQueryList(query, false)),
    );

    TestBed.configureTestingModule({ providers: [provideTheme()] });

    document.documentElement.removeAttribute('data-theme');
    const doc = TestBed.inject(DOCUMENT);
    TestBed.flushEffects();

    expect(doc.documentElement.getAttribute('data-theme')).toBe('high-contrast');
  });
});
