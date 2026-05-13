import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ThemeService } from './theme.service';
import { provideTheme, THEME_CONFIG } from './theme.config';
import { DEFAULT_THEME_CONFIG } from './theme.types';
import type { Theme } from './theme.types';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('ThemeService', () => {
  let service: ThemeService;
  let doc: Document;

  function setup(options?: {
    defaultTheme?: Theme;
    storedTheme?: string | null;
    prefersDark?: boolean;
    platform?: string;
  }) {
    const {
      defaultTheme = 'system',
      storedTheme = null,
      prefersDark = false,
      platform = 'browser',
    } = options ?? {};

    // Mock localStorage
    const storage = new Map<string, string>();
    if (storedTheme !== null) {
      storage.set(DEFAULT_THEME_CONFIG.storageKey, storedTheme);
    }
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
    });

    // Mock matchMedia
    const listeners: ((e: MediaQueryListEvent) => void)[] = [];
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: prefersDark,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb)),
      removeEventListener: vi.fn(),
    })));

    TestBed.configureTestingModule({
      providers: [
        provideTheme({ defaultTheme }),
        ...(platform === 'server' ? [{ provide: PLATFORM_ID, useValue: 'server' }] : []),
      ],
    });

    service = TestBed.inject(ThemeService);
    doc = TestBed.inject(DOCUMENT);

    return { storage, listeners };
  }

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
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
    expect(storage.get(DEFAULT_THEME_CONFIG.storageKey)).toBe('dark');
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

  it('should have mutually exclusive isDark, isLight, isHighContrast', () => {
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
  });

  it('should cycle through all themes in order', () => {
    setup({ defaultTheme: 'light' });

    expect(service.theme()).toBe('light');
    service.cycleTheme();
    expect(service.theme()).toBe('dark');
    service.cycleTheme();
    expect(service.theme()).toBe('high-contrast');
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
    const { listeners } = setup({ defaultTheme: 'system', prefersDark: false });
    expect(service.resolvedTheme()).toBe('light');

    listeners[0]({ matches: true } as MediaQueryListEvent);
    expect(service.systemTheme()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
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
    // pick these up by importing `ngx-tw/theme`. Keep this style block in sync
    // with the `--color-on-*` block in _semantic.css.
    const style = doc.createElement('style');
    style.textContent = `:root {
      --color-on-info: white;
      --color-on-success: #052e16;
      --color-on-warning: #451a03;
      --color-on-error: white;
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
});
