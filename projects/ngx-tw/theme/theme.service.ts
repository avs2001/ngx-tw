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

/** OS colour-scheme query backing `'system'` resolution. */
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** OS contrast query backing `'system'` → `'high-contrast'` resolution. */
const CONTRAST_QUERY = '(prefers-contrast: more)';

/**
 * Stateful runtime service that owns the active theme, reacts to OS
 * `prefers-color-scheme` / `prefers-contrast` changes, persists an explicit
 * user selection to `localStorage`, and writes the resolved theme onto the
 * configured DOM target as a `data-theme` attribute.
 *
 * The selected {@link theme} may be `'system'` (defer to the OS); the
 * {@link resolvedTheme} computed from it is always one of `'light'`,
 * `'dark'`, or `'high-contrast'` — never `'system'`. Register via
 * {@link provideTheme} in the app's environment providers; `provideTheme`
 * also constructs the service at bootstrap, so injecting it is only needed
 * to read or change the theme.
 *
 * Storage is written **only** by {@link setTheme} / {@link cycleTheme}.
 * Merely providing the service never touches `localStorage`, so the
 * configured `defaultTheme` keeps applying until the user actually picks
 * something, and apps under a storage-consent flow can provide the service
 * before consent is granted.
 */
@Injectable()
export class ThemeService implements OnDestroy {
  private readonly config = inject(THEME_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ngZone = inject(NgZone);

  private darkQuery: MediaQueryList | null = null;
  private contrastQuery: MediaQueryList | null = null;

  // One listener for both queries: the resolution rule reads them together, so
  // a handler that only knew its own query would clobber the other's decision
  // on the next OS tick. The event payload is deliberately ignored — a
  // `MediaQueryList`'s `matches` is already updated when `change` fires, so
  // re-reading both is the single source of truth.
  private readonly mediaListener = () => {
    this.systemTheme.set(this.detectSystemTheme());
  };

  /** The user-selected theme (may be `'system'`). */
  readonly theme = signal<TwTheme>(this.loadInitialTheme());

  /** The OS appearance preference — `prefers-color-scheme` plus `prefers-contrast`. */
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
      // Register the media-query listeners outside the Angular zone — they fire
      // on OS preference changes, not user interaction, and we don't want
      // zone.js bookkeeping for every system tick. The listener calls
      // `signal.set()`, which schedules its own change detection.
      // Both `MediaQueryList`s already exist: the `systemTheme` field
      // initialiser above ran `detectSystemTheme()`, which mints them. The
      // `??=` keeps this correct if that ever stops being true.
      this.ngZone.runOutsideAngular(() => {
        this.darkQuery ??= window.matchMedia(DARK_QUERY);
        this.contrastQuery ??= window.matchMedia(CONTRAST_QUERY);
        this.darkQuery.addEventListener('change', this.mediaListener);
        this.contrastQuery.addEventListener('change', this.mediaListener);
      });
    }

    effect(() => {
      this.applyToDocument(this.resolvedTheme());
    });
  }

  /**
   * Sets the selected theme and persists it. Pass `'system'` to follow the OS
   * preference.
   *
   * This is the only entry point that writes to `localStorage` — see the note
   * on the class.
   */
  setTheme(theme: TwTheme): void {
    this.theme.set(theme);
    this.persistTheme(theme);
  }

  /** Advances the selected theme to the next entry in {@link TW_THEMES}, wrapping around, and persists it. */
  cycleTheme(): void {
    const idx = TW_THEMES.indexOf(this.theme());
    this.setTheme(TW_THEMES[(idx + 1) % TW_THEMES.length]);
  }

  /**
   * Writes the configured theme attribute onto an arbitrary element, scoping
   * that subtree to the given theme.
   *
   * Each of the three schemes ships an element-agnostic `[data-theme=…]` block
   * (`_light.css`, `_dark.css`, `_high-contrast.css`), so the tokens really do
   * re-resolve on the element and cascade into its descendants — including
   * back to `'light'` from inside a dark page.
   *
   * Caveat: those CSS blocks key off the literal `data-theme` attribute. If
   * `provideTheme({ attribute })` renamed it, this method writes the renamed
   * attribute and the shipped stylesheet will not react — a custom attribute
   * only works with matching custom CSS.
   */
  applyToElement(element: HTMLElement, theme: TwResolvedTheme): void {
    element.setAttribute(this.config.attribute, theme);
  }

  ngOnDestroy(): void {
    this.darkQuery?.removeEventListener('change', this.mediaListener);
    this.contrastQuery?.removeEventListener('change', this.mediaListener);
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

  /**
   * Resolves `'system'` against the OS.
   *
   * `prefers-contrast: more` selects `'high-contrast'` — but only when the OS
   * is not also asking for dark. The library ships a single high-contrast
   * scheme and it is light-based (`_high-contrast.css` maps every surface to
   * white/`gray-50` and `--color-fg` to black), so letting contrast win
   * unconditionally would move users who run dark + increased contrast — a
   * common pairing — from a dark surface to a white one. Adding a dark-based
   * high-contrast ramp is the fix that lets the two preferences compose
   * instead of one overriding the other; until it exists, this branch only
   * *adds* behaviour for users who would otherwise have been given plain
   * light, and never takes dark away from anyone.
   *
   * Both queries are minted here (not in the constructor) because the
   * `systemTheme` field initialiser calls this before the constructor body
   * runs; the constructor then attaches `change` listeners to the same two
   * objects, so the resolution stays live rather than read-once.
   */
  private detectSystemTheme(): TwResolvedTheme {
    if (!this.isBrowser) return 'light';
    const prefersDark = (this.darkQuery ??= window.matchMedia(DARK_QUERY)).matches;
    const prefersMoreContrast = (this.contrastQuery ??= window.matchMedia(CONTRAST_QUERY)).matches;
    if (prefersDark) return 'dark';
    return prefersMoreContrast ? 'high-contrast' : 'light';
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
