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
import { TW_THEME_CONFIG } from './theme.config';
import { TW_THEMES, type TwTheme, type TwResolvedTheme, type TwThemeState } from './theme.types';

/** OS colour-scheme query backing `'system'` resolution. */
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** OS contrast query backing `'system'` → `'high-contrast'` / `'high-contrast-dark'` resolution. */
const CONTRAST_QUERY = '(prefers-contrast: more)';

/**
 * Stateful runtime service that owns the active theme, reacts to OS
 * `prefers-color-scheme` / `prefers-contrast` changes, persists an explicit
 * user selection to `localStorage`, and writes the resolved theme onto the
 * configured DOM target as a `data-theme` attribute.
 *
 * The selected {@link theme} may be `'system'` (defer to the OS); the
 * {@link resolvedTheme} computed from it is always one of `'light'`,
 * `'dark'`, `'high-contrast'`, or `'high-contrast-dark'` — never `'system'`.
 * Register via
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
  private readonly config = inject(TW_THEME_CONFIG);
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

  /**
   * True when the resolved theme is a **dark** scheme — `'dark'` or
   * `'high-contrast-dark'`.
   *
   * It answers the appearance question, not "which scheme": the canonical use
   * is picking a colour that has to sit on the page background (a chart grid,
   * a canvas fill), and dark high contrast needs the dark answer there just as
   * much as plain dark does. It is therefore **not** mutually exclusive with
   * {@link isHighContrast}; branch on {@link resolvedTheme} for one case.
   */
  readonly isDark = computed(() => {
    const t = this.resolvedTheme();
    return t === 'dark' || t === 'high-contrast-dark';
  });
  /**
   * True when the resolved theme is exactly `'light'`.
   *
   * Deliberately narrower than {@link isDark}'s mirror image: the light-based
   * `'high-contrast'` does **not** set it, because widening it would change
   * what a shipped scheme reports to consumers already reading this flag.
   * Use `!isDark()` for the appearance question.
   */
  readonly isLight = computed(() => this.resolvedTheme() === 'light');
  /**
   * True when the resolved theme is an **increased-contrast** scheme —
   * `'high-contrast'` or `'high-contrast-dark'`.
   *
   * It answers the contrast question, so it can be true at the same time as
   * {@link isDark}.
   */
  readonly isHighContrast = computed(() => {
    const t = this.resolvedTheme();
    return t === 'high-contrast' || t === 'high-contrast-dark';
  });

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
   * Each of the four schemes ships an element-agnostic `[data-theme=…]` block
   * (`_light.css`, `_dark.css`, `_high-contrast.css`,
   * `_high-contrast-dark.css`), so the tokens really do re-resolve on the
   * element and cascade into its descendants — including back to `'light'`
   * from inside a dark page.
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
   * The two preferences are treated as independent axes and composed, not
   * ranked: `prefers-color-scheme` picks the appearance and
   * `prefers-contrast: more` picks the contrast, giving the full 2×2 —
   * `light` / `dark` / `high-contrast` / `high-contrast-dark`.
   *
   * This is only correct because the library ships **both** high-contrast
   * ramps. While `_high-contrast.css` was the only one, contrast had to be
   * suppressed whenever the OS also asked for dark, or a user running dark +
   * increased contrast — a common pairing — would have been moved from a dark
   * surface onto a white one. `_high-contrast-dark.css` removed that
   * constraint, so the ranking is gone; if a future change ever drops one of
   * the two ramps, this method has to go back to ranking them.
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
    if (prefersMoreContrast) return prefersDark ? 'high-contrast-dark' : 'high-contrast';
    return prefersDark ? 'dark' : 'light';
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
