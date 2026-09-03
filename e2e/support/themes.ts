/**
 * The library's resolved theme schemes, imported from the library rather than
 * restated here.
 *
 * **Why this file exists.** Every data-driven sweep in this suite that varies
 * the theme used to iterate a hand-written literal — `theme-matrix.spec.ts`
 * declared `type Theme = 'light' | 'dark' | 'high-contrast'` and swept the
 * matching array; `canary.spec.ts` swept `['light', 'dark']`. When the library
 * gained a fourth scheme (`'high-contrast-dark'`) nothing failed, because
 * nothing looked. That is the single most expensive recurring defect shape in
 * this repo: pass 1 found five components with **zero** e2e coverage because
 * they were missing from `support/routes.ts`, and the suite reported green the
 * whole time. `projects/demo/src/app/app.routes.spec.ts` exists as a drift
 * guard for exactly that failure.
 *
 * Rather than add a second drift guard, the lists are **derived**, so drift is
 * not possible: a fifth scheme is swept by `theme-matrix.spec.ts` the moment
 * `TW_RESOLVED_THEMES` gains it, and enrols in the visual canary as a
 * missing-baseline failure (see `SWATCH_ONLY_SCHEMES` below). No guard can rot
 * because there is no second list to keep in step.
 *
 * **Why the import is a relative source path and not `@cdevhub/ngx-tw/theme`.**
 * `e2e/tsconfig.json` maps that specifier to `../dist/ngx-tw/*`, so the alias
 * would (a) require a library build before Playwright can even collect the
 * suite and (b) pull `theme.service.ts` and its `@angular/core` import into a
 * plain Node process for the sake of two string arrays. `theme.types.ts` has
 * **no imports at all** — it is types and `as const` arrays — so importing the
 * source file directly is both cheaper and always in step with the working
 * tree rather than with the last build.
 */
import {
  TW_RESOLVED_THEMES,
  type TwResolvedTheme,
} from '../../projects/ngx-tw/theme/theme.types';

export { TW_RESOLVED_THEMES, type TwResolvedTheme };

/**
 * Whether each scheme paints a light or a dark `--color-surface`.
 *
 * Typed as a total `Record` on purpose: adding a member to `TwResolvedTheme`
 * makes this object a **compile error** until the new scheme is classified, so
 * the luminance assertions in `theme-matrix.spec.ts` cannot silently skip it.
 * That is the structural equivalent of the `A11Y_BACKLOG` stale-entry check —
 * it fails on absence rather than trusting a reader to notice.
 *
 * Mirrors the library's own `isDark` predicate (`theme.service.ts`), which
 * reads `'dark' | 'high-contrast-dark'`. Measured surfaces: `light` #ffffff,
 * `high-contrast` #ffffff, `dark` #030712, `high-contrast-dark` #000000.
 */
export const SCHEME_APPEARANCE: Record<TwResolvedTheme, 'light' | 'dark'> = {
  light: 'light',
  dark: 'dark',
  'high-contrast': 'light',
  'high-contrast-dark': 'dark',
};

/**
 * Schemes the visual canary captures in full — every canonical scene.
 *
 * Deliberately **two**, not four. The canary's job is component-shape
 * regression, and its scope is capped by chapter 07 ("what NOT to snapshot").
 * `high-contrast` shipped long before `high-contrast-dark` and has never had a
 * canary baseline: the canary was never the scheme-coverage mechanism —
 * `theme-matrix.spec.ts` is, and it now sweeps all four schemes across four
 * pages with an axe `color-contrast` assertion per cell. Capturing 10 scenes ×
 * 4 schemes would take the canary from 20 baselines to 40 to re-cover ground
 * that is already covered functionally.
 *
 * What a *scheme* change actually alters is the token ramp, so every scheme
 * outside this list still gets the one scene whose entire subject is that ramp
 * — see `SWATCH_ONLY_SCHEMES`.
 */
export const FULL_SCENE_SCHEMES = ['light', 'dark'] as const satisfies readonly TwResolvedTheme[];

/**
 * Schemes the visual canary covers with the Semantic Tokens swatch grid alone.
 *
 * Derived by subtraction, so a fifth scheme enrols here automatically and
 * announces itself as a missing-baseline failure on the next `@visual` run —
 * loud, and impossible to forget.
 */
export const SWATCH_ONLY_SCHEMES: readonly TwResolvedTheme[] = TW_RESOLVED_THEMES.filter(
  (scheme) => !(FULL_SCENE_SCHEMES as readonly TwResolvedTheme[]).includes(scheme),
);
