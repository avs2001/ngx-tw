import { describe, it, expect, vi } from 'vitest';
import { TW_THEME_BOOTSTRAP_SCRIPT } from './theme.bootstrap';
import { DEFAULT_TW_THEME_CONFIG } from './theme.types';

/**
 * Runs the shipped snippet the way a browser would, but hermetically:
 * `localStorage` and `document` are passed as parameters so the script's own
 * global references are shadowed and nothing in the shared jsdom document is
 * touched. `new Function` also fails loudly on a syntax error, which a plain
 * string assertion would not.
 */
function runBootstrap(stored: string | null | (() => never)) {
  const documentElement = document.createElement('html');
  const fakeLocalStorage = {
    getItem: vi.fn((key: string): string | null => {
      if (typeof stored === 'function') stored();
      if (key !== DEFAULT_TW_THEME_CONFIG.storageKey) return null;
      return typeof stored === 'string' ? stored : null;
    }),
  };
  new Function('localStorage', 'document', TW_THEME_BOOTSTRAP_SCRIPT)(fakeLocalStorage, {
    documentElement,
  });
  return { documentElement, getItem: fakeLocalStorage.getItem };
}

describe('TW_THEME_BOOTSTRAP_SCRIPT', () => {
  // The point of shipping this as a constant rather than as README prose is
  // that the key and the attribute cannot drift from what `ThemeService`
  // uses. Reading both back through `DEFAULT_TW_THEME_CONFIG` is what makes
  // the guard real: hard-coding 'ngx-tw-theme' / 'data-theme' here would let
  // a rename break every consumer's `index.html` while the test stayed green.
  it('applies a persisted explicit choice using the configured key and attribute', () => {
    const { documentElement, getItem } = runBootstrap('dark');
    expect(getItem).toHaveBeenCalledWith(DEFAULT_TW_THEME_CONFIG.storageKey);
    expect(documentElement.getAttribute(DEFAULT_TW_THEME_CONFIG.attribute)).toBe('dark');
  });

  it('applies high-contrast, not just dark', () => {
    const { documentElement } = runBootstrap('high-contrast');
    expect(documentElement.getAttribute(DEFAULT_TW_THEME_CONFIG.attribute)).toBe('high-contrast');
  });

  // `'system'` must write nothing so the CSS `prefers-color-scheme` fallback
  // keeps deciding — writing `data-theme="system"` would match no token block
  // at all and strand the page on the light defaults.
  it('writes nothing for a stored "system"', () => {
    const { documentElement } = runBootstrap('system');
    expect(documentElement.hasAttribute(DEFAULT_TW_THEME_CONFIG.attribute)).toBe(false);
  });

  it('writes nothing when no choice has been stored', () => {
    const { documentElement } = runBootstrap(null);
    expect(documentElement.hasAttribute(DEFAULT_TW_THEME_CONFIG.attribute)).toBe(false);
  });

  // The snippet runs before the app bundle, so an exception here would break
  // the page for every visitor with storage blocked.
  it('swallows a throwing localStorage instead of breaking the document', () => {
    expect(() =>
      runBootstrap(() => {
        throw new Error('storage blocked');
      }),
    ).not.toThrow();
  });
});
