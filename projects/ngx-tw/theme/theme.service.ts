import {
  Injectable,
  NgZone,
  computed,
  effect,
  inject,
  signal,
  PLATFORM_ID,
  type OnDestroy,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { THEME_CONFIG } from './theme.config';
import { TW_THEMES, type TwTheme, type TwResolvedTheme, type TwThemeState } from './theme.types';

/**
 * Stateful runtime service that owns the active theme, reacts to OS
 * `prefers-color-scheme` changes, persists the user selection to
 * `localStorage`, and writes the resolved theme onto the configured DOM
 * target as a `data-theme` attribute.
 *
 * The selected {@link theme} may be `'system'` (defer to the OS); the
 * {@link resolvedTheme} computed from it is always one of `'light'`,
 * `'dark'`, or `'high-contrast'` — never `'system'`. Register via
 * {@link provideTheme} in the app's environment providers.
 */
@Injectable()
export class ThemeService implements OnDestroy {
  private readonly config = inject(THEME_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ngZone = inject(NgZone);

  private mediaQuery: MediaQueryList | null = null;
  private readonly mediaListener = (e: MediaQueryListEvent) => {
    this.systemTheme.set(e.matches ? 'dark' : 'light');
  };

  /** The user-selected theme (may be `'system'`). */
  readonly theme = signal<TwTheme>(this.loadInitialTheme());

  /** The OS color scheme preference. */
  readonly systemTheme = signal<TwResolvedTheme>(this.detectSystemTheme());

  /** The resolved theme actually applied to the DOM (never `'system'`). */
  readonly resolvedTheme = computed<TwResolvedTheme>(() => {
    const t = this.theme();
    return t === 'system' ? this.systemTheme() : t;
  });

  /** True when the resolved theme is `'dark'`. */
  readonly isDark = computed(() => this.resolvedTheme() === 'dark');
  /** True when the resolved theme is `'light'`. */
  readonly isLight = computed(() => this.resolvedTheme() === 'light');
  /** True when the resolved theme is `'high-contrast'`. */
  readonly isHighContrast = computed(() => this.resolvedTheme() === 'high-contrast');

  /** Snapshot of the full theme state — selected, resolved, system, and boolean flags. */
  readonly state = computed<TwThemeState>(() => ({
    theme: this.theme(),
    resolvedTheme: this.resolvedTheme(),
    systemTheme: this.systemTheme(),
    isDark: this.isDark(),
    isLight: this.isLight(),
    isHighContrast: this.isHighContrast(),
  }));

  constructor() {
    if (this.isBrowser) {
      // Register the media-query listener outside the Angular zone — it fires
      // on OS theme changes, not user interaction, and we don't want zone.js
      // bookkeeping for every system colour-scheme tick. The listener calls
      // `signal.set()`, which schedules its own change detection.
      this.ngZone.runOutsideAngular(() => {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.mediaQuery.addEventListener('change', this.mediaListener);
      });
    }

    effect(() => {
      const resolved = this.resolvedTheme();
      const selected = this.theme();
      this.applyToDocument(resolved);
      this.persistTheme(selected);
    });
  }

  /** Sets the selected theme. Pass `'system'` to follow the OS preference. */
  setTheme(theme: TwTheme): void {
    this.theme.set(theme);
  }

  /** Advances the selected theme to the next entry in {@link TW_THEMES}, wrapping around. */
  cycleTheme(): void {
    const current = this.theme();
    const idx = TW_THEMES.indexOf(current);
    this.theme.set(TW_THEMES[(idx + 1) % TW_THEMES.length]);
  }

  /** Writes the configured theme attribute onto an arbitrary element — used to scope themes to a subtree. */
  applyToElement(element: HTMLElement, theme: TwResolvedTheme): void {
    element.setAttribute(this.config.attribute, theme);
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener('change', this.mediaListener);
  }

  private loadInitialTheme(): TwTheme {
    if (!this.isBrowser) return this.config.defaultTheme;
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored && (TW_THEMES as readonly string[]).includes(stored)) {
        return stored as TwTheme;
      }
    } catch {
      /* localStorage unavailable */
    }
    return this.config.defaultTheme;
  }

  private detectSystemTheme(): TwResolvedTheme {
    if (!this.isBrowser) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyToDocument(theme: TwResolvedTheme): void {
    if (!this.isBrowser) return;
    const target =
      this.config.target === 'documentElement'
        ? this.document.documentElement
        : this.document.body;
    target.setAttribute(this.config.attribute, theme);
  }

  private persistTheme(theme: TwTheme): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.config.storageKey, theme);
    } catch {
      /* localStorage unavailable */
    }
  }
}
