import { DEFAULT_TW_THEME_CONFIG } from './theme.types';

/**
 * Body of an inline `<head>` script that applies a previously persisted theme
 * before the app bundle runs, eliminating the flash of the wrong theme on
 * reload.
 *
 * `ThemeService` cannot cover this case: it is JavaScript in the application
 * bundle, so the browser has already painted by the time it writes
 * `data-theme` — and `provideTheme`'s environment initializer does not change
 * that. The CSS `@media (prefers-color-scheme: dark)` fallback covers users
 * who never chose a theme; the flash is what an *explicit* choice that
 * disagrees with the OS looks like — light chosen on a dark machine, or
 * either high-contrast scheme chosen on a machine not already asking for
 * increased contrast (the CSS has a `prefers-color-scheme` branch but
 * deliberately no `prefers-contrast` one, so neither contrast scheme is
 * reachable without an explicit `data-theme`).
 *
 * The string is built from {@link DEFAULT_TW_THEME_CONFIG}, so the storage key
 * and attribute cannot drift from what `ThemeService` actually uses — that
 * drift is the reason this ships as code rather than as a README snippet
 * alone. Copy the literal script into `index.html`, or interpolate this
 * constant during an SSR / index transform:
 *
 * ```html
 * <head>
 *   <script>try{var t=localStorage.getItem('ngx-tw-theme');if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
 * </head>
 * ```
 *
 * Notes on the behaviour it deliberately does *not* have:
 * - A stored `'system'` writes nothing, so the CSS `prefers-color-scheme`
 *   fallback keeps deciding — which is exactly what `'system'` means.
 * - It assumes the default `target: 'documentElement'`. A `<head>` script runs
 *   before `<body>` exists, so `target: 'body'` cannot be bootstrapped this
 *   way.
 * - If you overrode `storageKey` or `attribute` via `provideTheme`, adapt the
 *   literal snippet to match; this constant only encodes the defaults.
 * - It is dependency-free and wrapped in `try`/`catch`, so a browser with
 *   storage blocked falls through to the CSS behaviour instead of throwing
 *   before the app loads.
 */
export const TW_THEME_BOOTSTRAP_SCRIPT =
  `try{var t=localStorage.getItem(${JSON.stringify(DEFAULT_TW_THEME_CONFIG.storageKey)});` +
  `if(t&&t!=='system')document.documentElement.setAttribute(` +
  `${JSON.stringify(DEFAULT_TW_THEME_CONFIG.attribute)},t)}catch(e){}`;
