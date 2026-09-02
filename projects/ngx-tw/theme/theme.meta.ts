import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Runtime theming API — provideTheme, ThemeService, THEME_CONFIG, and a [twTheme] directive — that switches between light, dark, high-contrast, and system modes and persists the choice, alongside the default theme CSS.',
  whenToUse: [
    'Building a theme toggle or a light/dark/high-contrast picker: inject ThemeService and call setTheme() or cycleTheme()',
    'Reading the active appearance in component logic via the theme, resolvedTheme, systemTheme, isDark, isLight, and isHighContrast signals',
    'The choice must survive a reload — setTheme() and cycleTheme() persist to localStorage under ngx-tw-theme by default; nothing else writes to storage, so merely calling provideTheme() never does',
    'Following the OS preference by default and re-resolving live when the user changes it, via the "system" theme — prefers-color-scheme: dark resolves to dark, and prefers-contrast: more resolves to high-contrast when dark is not also requested',
    'Customizing where and how the theme is written: provideTheme({ defaultTheme, storageKey, attribute, target }) changes the data-theme attribute name or targets body instead of documentElement',
    'Registering the provider is enough — provideTheme() constructs ThemeService at bootstrap, so the persisted theme applies on first paint even if the toggle lives in a lazily-loaded route',
    'Scoping a different theme to one subtree of the page (a preview pane, an always-dark hero, an always-light print preview) with the [twTheme] directive — all three schemes ship element-agnostic [data-theme="..."] blocks, so light-inside-dark works as well as dark-inside-light',
    'Removing the theme flash on reload when an explicit choice disagrees with the OS: paste the inline head script <script>try{var t=localStorage.getItem(\'ngx-tw-theme\');if(t&&t!==\'system\')document.documentElement.setAttribute(\'data-theme\',t)}catch(e){}</script> into index.html, or interpolate the exported TW_THEME_BOOTSTRAP_SCRIPT constant, which is built from the same defaults so the key and attribute cannot drift',
    'Rebranding the whole library: import the theme CSS and override the semantic tokens (--color-primary-500, surface, fg, border) in your own @theme block',
    'Note: plain dark mode needs no JavaScript at all — the imported theme CSS already falls back to prefers-color-scheme when no data-theme attribute is set, so provideTheme is only for explicit, persisted switching',
  ],
  related: ['core', 'switch', 'segmented-control', 'menu', 'button', 'icon'],
  aliases: [
    'dark mode',
    'theming',
    'color scheme',
    'tokens',
    'light mode',
    'high contrast',
    'prefers-color-scheme',
    'data-theme',
    'theme toggle',
    'theme switcher',
    'palette',
    'branding',
    'css variables',
    'provideTheme',
    'ThemeService',
    'prefers-contrast',
    'theme flash',
    'FOUC',
  ],
} satisfies ComponentMeta;
