import {
  Injectable,
  computed,
  effect,
  inject,
  signal,
  PLATFORM_ID,
  type OnDestroy,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { THEME_CONFIG } from './theme.config';
import { THEMES, type Theme, type ResolvedTheme, type ThemeState } from './theme.types';

@Injectable()
export class ThemeService implements OnDestroy {
  private readonly config = inject(THEME_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private mediaQuery: MediaQueryList | null = null;
  private readonly mediaListener = (e: MediaQueryListEvent) => {
    this.systemTheme.set(e.matches ? 'dark' : 'light');
  };

  /** The user-selected theme (may be `'system'`). */
  readonly theme = signal<Theme>(this.loadInitialTheme());

  /** The OS color scheme preference. */
  readonly systemTheme = signal<ResolvedTheme>(this.detectSystemTheme());

  /** The resolved theme actually applied to the DOM (never `'system'`). */
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
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
  readonly state = computed<ThemeState>(() => ({
    theme: this.theme(),
    resolvedTheme: this.resolvedTheme(),
    systemTheme: this.systemTheme(),
    isDark: this.isDark(),
    isLight: this.isLight(),
    isHighContrast: this.isHighContrast(),
  }));

  constructor() {
    if (this.isBrowser) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.mediaListener);
    }

    effect(() => {
      const resolved = this.resolvedTheme();
      const selected = this.theme();
      this.applyToDocument(resolved);
      this.persistTheme(selected);
    });
  }

  /** Sets the selected theme. Pass `'system'` to follow the OS preference. */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  /** Advances the selected theme to the next entry in {@link THEMES}, wrapping around. */
  cycleTheme(): void {
    const current = this.theme();
    const idx = THEMES.indexOf(current);
    this.theme.set(THEMES[(idx + 1) % THEMES.length]);
  }

  /** Writes the configured theme attribute onto an arbitrary element — used to scope themes to a subtree. */
  applyToElement(element: HTMLElement, theme: ResolvedTheme): void {
    element.setAttribute(this.config.attribute, theme);
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener('change', this.mediaListener);
  }

  private loadInitialTheme(): Theme {
    if (!this.isBrowser) return this.config.defaultTheme;
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored && (THEMES as readonly string[]).includes(stored)) {
        return stored as Theme;
      }
    } catch {
      /* localStorage unavailable */
    }
    return this.config.defaultTheme;
  }

  private detectSystemTheme(): ResolvedTheme {
    if (!this.isBrowser) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyToDocument(theme: ResolvedTheme): void {
    if (!this.isBrowser) return;
    const target =
      this.config.target === 'documentElement'
        ? this.document.documentElement
        : this.document.body;
    target.setAttribute(this.config.attribute, theme);
  }

  private persistTheme(theme: Theme): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.config.storageKey, theme);
    } catch {
      /* localStorage unavailable */
    }
  }
}
