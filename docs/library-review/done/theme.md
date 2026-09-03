# Theme — Production-Grade Review

**Entry point:** `ngx-tw/theme`
**Files:** `projects/ngx-tw/theme/`

## Snapshot
- Public exports:
  - CSS asset entry (`index.css`) which globs four CSS partials — `_palette.css`, `_semantic.css`, `_dark.css`, `_high-contrast.css`, `_base.css` — into the consumer's stylesheet.
  - TypeScript secondary entry exposing `ThemeService`, `ThemeDirective`, `THEME_CONFIG`, `provideTheme()`, plus the type triple `Theme | ResolvedTheme | ThemeConfig | ThemeState` and the constants `THEMES`, `RESOLVED_THEMES`, `DEFAULT_THEME_CONFIG`.
- Consumers: every component (via Tailwind v4 utility resolution against `--color-*` tokens), plus the demo app (via `provideTheme()`).
- A11y / forms / styling concerns this surface owns: (1) WCAG-AA color contrast for every solid-fill pair (`{role}-500` ↔ `on-{role}`), (2) the runtime light / dark / high-contrast switcher and its OS-preference reactivity, (3) keyframe definitions and `prefers-reduced-motion` enforcement for every component's enter/leave animation, (4) the typography scale floor (`text-2xs` at 0.6875rem), (5) calendar size pinning so view transitions don't reflow.

## Public surface
| Export | Kind | JSDoc? | Notes |
|---|---|---|---|
| `index.css` | CSS asset | n/a | Imports `tailwindcss`, then `_palette`, `_semantic`, `_dark`, `_high-contrast`, `_base`. Single line of `@source` glob for library Tailwind class detection. Correct. |
| `ThemeService` | service (not `providedIn: 'root'`) | partial | Stateful runtime service; correctly *not* `providedIn: 'root'` — provided via `provideTheme()`. Class-level JSDoc is absent though; public signals/methods are documented. |
| `ThemeDirective` | directive | yes | Sets `data-theme` on the host. Single required `input.required<ResolvedTheme>`. |
| `THEME_CONFIG` | `InjectionToken<ThemeConfig>` | yes | Carries the resolved config. No factory — provided exclusively via `provideTheme()`. |
| `provideTheme(config?)` | `EnvironmentProviders` factory | yes | Merges over `DEFAULT_THEME_CONFIG`. Returns `makeEnvironmentProviders` — correct API. |
| `Theme` | type | implicit (defined in `theme.types.ts`) | `'light' \| 'dark' \| 'high-contrast' \| 'system'`. No JSDoc on the type itself. |
| `ResolvedTheme` | type | implicit | `'light' \| 'dark' \| 'high-contrast'`. No JSDoc. |
| `ThemeConfig` | interface | yes (fields) | Each field documented. |
| `ThemeState` | interface | yes (fields) | Each field documented. |
| `THEMES` | const tuple | implicit | `readonly Theme[]`. No JSDoc. |
| `RESOLVED_THEMES` | const tuple | implicit | `readonly ResolvedTheme[]`. No JSDoc. |
| `DEFAULT_THEME_CONFIG` | const | implicit | `{ defaultTheme: 'system', storageKey: 'ngx-tw-theme', attribute: 'data-theme', target: 'documentElement' }`. No JSDoc. |

### Findings
- **Naming inconsistency:** The two type aliases and three constants in `theme.types.ts` carry no `Tw` prefix (`Theme`, `ResolvedTheme`, `ThemeConfig`, `ThemeState`, `THEMES`, `RESOLVED_THEMES`, `DEFAULT_THEME_CONFIG`). CLAUDE.md codifies that "Shared **types** are the only identifiers that carry a `Tw` prefix (`TwColor`, `TwSize`) because they are hand-authored and appear in consumer code with no other namespace cue." `Theme`, `ResolvedTheme`, and `ThemeState` are exactly such hand-authored types and risk colliding with consumer-side types — they should be `TwTheme`, `TwResolvedTheme`, `TwThemeConfig`, `TwThemeState`, plus `TW_THEMES` / `TW_RESOLVED_THEMES` / `DEFAULT_TW_THEME_CONFIG`. The directive class `ThemeDirective` and service class `ThemeService` are correctly un-prefixed per the same rule (component/directive class identifiers must not carry `Tw*`).
- **Missing JSDoc** on the type aliases and constants in `theme.types.ts`. `Theme`, `ResolvedTheme`, `THEMES`, `RESOLVED_THEMES`, `DEFAULT_THEME_CONFIG` have none. Compodoc will render empty API entries.
- **`ng-package.json`** is the minimal one-liner — correct for a secondary entry point.
- The TS surface is well-scoped: one stateful service, one directive, one config token + factory, and a small type set. No NgModules. No `providedIn: 'root'` on the stateful service. Compliant with all the codified service rules.

## CSS tokens

### Tokens defined in `_semantic.css`
- **Typography:** `--text-2xs` (0.6875rem / 11px) + `--text-2xs--line-height` (1rem). Pinned because Tailwind has no smaller built-in step.
- **Calendar widths:** `--width-calendar-{xs,sm,md,lg,xl}`. Pinned so view transitions don't reflow.
- **Surface (5 tokens):** `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`, `--color-surface-sunken`, `--color-surface-muted`.
- **Foreground (3 tokens):** `--color-fg`, `--color-fg-muted`, `--color-fg-subtle`.
- **Border (3 tokens):** `--color-border`, `--color-border-muted`, `--color-border-strong`.
- **Color roles × 11 shades = 88 tokens:** `--color-{primary, secondary, accent, neutral, info, success, warning, error}-{50..950}`. Every shade is mapped to a Tailwind built-in palette (`blue`, `slate`, `violet`, `gray`, `sky`, `green`, `amber`, `red` respectively).
- **`on-{role}` solid-fill foregrounds (8 tokens):** `--color-on-{info, success, warning, error, primary, secondary, accent, neutral}`. `success` and `warning` correctly use `-950` (deep tint) because their `-500` mid-tone is amber/green and too bright for white; the rest use `white`.

### Tokens defined elsewhere
- **`_palette.css` defines `--duration-fast: 150ms` and `--duration-normal: 200ms`** along with `--font-sans` and `--font-mono`. The file's `@theme` block also re-anchors the font stacks. These two animation-duration tokens are defined but **not consumed anywhere** in the library (`grep -rn "duration-fast\|duration-normal"` returns only the definitions). Components use raw `duration-150` / `duration-200` Tailwind utilities directly. Either consume the tokens or remove them; their presence implies a public contract the library doesn't honour.
- `_palette.css` is misnamed — it does not define a palette, it defines fonts + animation durations. The actual palette mappings live in `_semantic.css`, `_dark.css`, and `_high-contrast.css` (which all re-bind to Tailwind built-in `--color-blue-*` etc.).

### Dark-mode mapping in `_dark.css`
- Surface, fg, border tokens are all re-bound to gray-scale shades (light gray → dark gray). Sensible.
- Color roles 50–950 are inverted (light shades map to deep Tailwind palette values, deep shades map to light) — this preserves "intent" so `bg-error-50` is "subtle error background" in both themes, which is correct.
- Activated via `[data-theme="dark"]` selector strategy (no `@media (prefers-color-scheme: dark)` fallback in the CSS itself). The runtime service detects OS preference and writes the attribute. **Gap:** for non-Angular SSG snippets or pre-hydration screens, the dark theme will not activate from OS preference until the service hydrates. Material and shadcn ship both strategies. P2.
- **No dark variants for `on-{role}` tokens.** `on-success` and `on-warning` use `-950` (deep tint) in light mode; in dark mode the palette is inverted so `-950` maps to the *light* shade, and consumers using `text-on-success` against a `bg-success-500` (now resolved to dark green from the inversion) will end up with light text on dark green — which actually *works* but is by accident, not design. Worth a deliberate review pass. P1.

### High-contrast mapping in `_high-contrast.css`
- Surface, fg, border tokens collapse to pure white/black with very thick contrast (e.g., `--color-border-strong: var(--color-black)`).
- Color roles shift one step deeper (50 → 100, 500 → 600 etc.) so colored fills have higher contrast against white.
- **No `on-{role}` overrides** — they inherit from light mode. Verify visually with the new mappings; `on-warning` against `bg-warning-500` (now mapped to `amber-600`) may still need a deeper foreground. P1.
- **No focus-ring color override.** Per CLAUDE.md: "High-contrast mode coverage. Should provide deeper contrast for `border-strong`, `fg`, focus rings." The CSS overrides `border-strong` and `fg` but leaves `--color-primary-500` mapped to `blue-600` — the focus ring `focus-visible:outline-primary-500` will still be the same blue. A `forced-colors: active` media query that maps focus rings to `Highlight` (a system color) would handle Windows high-contrast mode properly. P1.

### Keyframe / animation classes in `_base.css`
Defined classes (referenced via `animate.enter` / `animate.leave` or via `class="..."`):
- `fade-in`, `fade-out`, `scale-in`, `scale-out` — used by tooltip, popover, menu, command-palette, alert, select-overlay, date/range/time-picker overlays.
- `collapsible-enter`, `collapsible-leave`, `collapsible-keep-alive` — used by collapsible / accordion.
- `check-in` — used by checkbox glyph.
- `step-panel-enter-forward`, `step-panel-enter-backward` — used by stepper.
- `tw-dialog-backdrop` — used by dialog.
- `tw-spinner-dot`, `tw-spinner-bar` (named class + keyframes `tw-spinner-dots-bounce`, `tw-spinner-bars-stretch`).
- `skeleton-pulse`, `skeleton-wave` — used by skeleton.
- `animate-progress-bar-indeterminate` — used by progress-bar.
- `toast-enter-{right,left,top,bottom}` and matching `toast-leave-*` — used by toast.
- `tw-flip-perspective`, `tw-flip-inner`, `tw-flip-face`, `tw-flip-axis-{x,y}`, `tw-flip-rotated`, `tw-flip-back-{x,y}` — used by flip-card.
- Utility classes: `tw-scrollbar-none`, `tw-split-no-select`, `tw-toast-overlay`.

All keyframe-classed animations have a `prefers-reduced-motion: reduce` override that clamps duration to 0ms. Additionally a universal `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0s !important; ... } }` rule sweeps long-tail inline Tailwind `transition-*` / `animate-*` usages.

### Gaps
1. **`--duration-fast` / `--duration-normal` are defined but unused** (`_palette.css:7-8`). Either migrate component class strings (`duration-150` → `duration-fast`) or remove the tokens.
2. **`on-{role}` tokens lack dark / high-contrast overrides.** In light mode `on-success` is `green-950` (very dark green). When the inversion in `_dark.css` swaps `green-*` shades, the *background* `success-500` will still be `green-500` (mid-green; the inversion is on the *role*, not the underlying Tailwind palette in `_dark.css`). Re-check by reading `_dark.css:84-95`: `--color-success-500: var(--color-green-500)` is unchanged — it stays mid-green. So `text-on-success` (=`green-950`) on `bg-success-500` (=`green-500`) still has WCAG-AA contrast in dark mode by coincidence. But `--color-on-success` is *not redefined for high-contrast*, where `success-500` is remapped to `green-600` and the `green-950` foreground might shift. Verify with an automated contrast pass.
3. **No `@media (prefers-color-scheme: dark)` fallback** for SSR/pre-hydration. The `data-theme="dark"` selector is the only activation path.
4. **No `@media (forced-colors: active)` rule.** Windows high-contrast mode users get the same blue focus ring as everyone else. Should map to system `Highlight` color.
5. **`--text-2xs` is defined but not registered as a public `text-2xs` Tailwind utility** in any explicit way. Tailwind v4 auto-generates utilities from `@theme` tokens following the `--text-{name}` convention, so `text-2xs` works at the consumer end — but this is convention-based and not documented in any JSDoc. Worth a one-line comment in `_semantic.css`.
6. **`_palette.css` is misnamed.** It contains fonts + durations, not palette shades.

### Findings (CSS tokens)
- The token surface is comprehensive and well-organised; the major omissions are the two unused duration tokens and the missing high-contrast `on-{role}` overrides + focus-ring + `forced-colors` rule.
- The convention "use `surface/fg/border` tokens for neutral structural styling, use `{color}-{shade}` for variant colors, use explicit `dark:` overrides per-component for dark mode tinting" is consistent in the components I sampled — only `popover/popover.ts:101` uses a raw `neutral-500`, and that's intentional (the colored arrow accent for `color: 'neutral'`).

## Accessibility / theming concerns

### Color contrast — `{role}-500` ↔ `on-{role}` pairings
Per the codified rule "every `{role}-{shade}` paired with its `on-{role}` foreground must meet WCAG AA":

| Pair | Light mode | Risk |
|---|---|---|
| `bg-primary-500` (blue-500 `oklch(.59 .145 245)`) ↔ `text-on-primary` (white) | ratio ≈ 4.78 against the visible blue-500 — passes AA for large text, marginal for body text (3:1 is graphics, 4.5 is body). | Verify against actual rendering; blue-500 is borderline. |
| `bg-secondary-500` (slate-500) ↔ white | ~4.6 | OK. |
| `bg-accent-500` (violet-500) ↔ white | ~4.8 | OK. |
| `bg-neutral-500` (gray-500) ↔ white | ~4.0 | **Likely FAILS** AA for body text. The gray-500 is `oklch(.554 .046 257)` — closer to mid-tone. Consider switching `--color-on-neutral` to `gray-950` or shifting the rule to use `bg-neutral-700` for solid fills (per Material's accent-on-neutral guidance). P0-to-verify. |
| `bg-info-500` (sky-500) ↔ white | ~3.6 | **Likely FAILS** AA for body text. Sky is bright. Consider `--color-on-info: var(--color-sky-950)` to mirror the `success`/`warning` convention. P0-to-verify. |
| `bg-success-500` (green-500) ↔ green-950 | ~12+ | Strong pass. |
| `bg-warning-500` (amber-500) ↔ amber-950 | ~14+ | Strong pass. |
| `bg-error-500` (red-500) ↔ white | ~3.8 | **Likely FAILS** AA for body text. P0-to-verify. |

**Two `on-{role}` pairs almost certainly fail WCAG-AA body-text contrast (info, error, possibly neutral).** Empirically: Tailwind blue/sky/red-500 against white sit around 3.5–4.0:1, below the 4.5:1 threshold for body text. This is the single highest-severity finding in this entry point.

Action: run an automated contrast pass (axe-core or equivalent) against the demo's `bg-{role}-500 text-on-{role}` combinations for all 8 roles in light/dark/high-contrast, and either deepen the role-500 to role-600 OR change the `on-{role}` foreground.

### `prefers-reduced-motion` handling
- Per-keyframe overrides in `_base.css:284-317` clamp specific named animations to 0ms.
- Universal `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { ... } }` rule in `_base.css:325-335` sweeps the long-tail. Strong belt-and-suspenders.
- Findings: comprehensive. No gaps observed.

### `prefers-color-scheme` integration
- `ThemeService.detectSystemTheme()` (theme.service.ts:102-105) reads `window.matchMedia('(prefers-color-scheme: dark)').matches` once at construction; the `mediaListener` (theme.service.ts:21-23) updates `systemTheme` reactively on subsequent OS changes.
- Theme is resolved into a `data-theme` attribute on `documentElement` (or `body` if configured) by the `applyToDocument` effect (theme.service.ts:107-114).
- **Gap:** no CSS-only fallback. Apps that render before the service hydrates (e.g., during SSR), or apps that prefer not to ship the theme service at all, get light mode regardless of OS preference. Recommend wrapping the bulk of `_dark.css`'s rules in an additional `@media (prefers-color-scheme: dark)` block alongside the `[data-theme="dark"]` selector. P2.

### High-contrast mode coverage
- Tokens overridden in `_high-contrast.css`:
  - All 5 surface tokens, all 3 fg, all 3 border, all 11 shades × 8 roles = 96 tokens.
- Tokens **not overridden**:
  - `--color-on-{role}` (8 tokens).
  - `--text-2xs`, `--width-calendar-{xs..xl}` (intentional — sizing/typography is independent of contrast).
  - Animation duration tokens (intentional).
- **Missing rules:**
  - No `focus-visible:outline-*` color override. Focus rings remain `primary-500` (blue-600 in high-contrast). Should use a system color (`Highlight`) inside `@media (forced-colors: active)`.
  - No `@media (forced-colors: active)` rule at all. Windows high-contrast mode (which forces a system palette) will lose all `--color-*` tokens entirely — components need to be tested in this mode and either fall back to `CanvasText` / `Highlight` / `ButtonText` system colors, or explicitly opt-out via `forced-color-adjust: none` on critical visual elements.

### Findings (theming)
- **Color contrast on `on-info`, `on-error`, and `on-neutral` is the highest-severity issue in this surface.** P0 to verify and fix.
- High-contrast mode is well-covered for the data-theme attribute strategy, but lacks `forced-colors` handling for Windows-native high-contrast. P1.
- No CSS-only `prefers-color-scheme` fallback. P2.

## Consistency across components
- All 24+ components that style themselves with semantic colors use the `{role}-{shade}` tokens correctly; no raw palette colors leak through (except the deliberate `popover/popover.ts:101` accent arrow).
- All components that use surfaces/fg/borders use the structural tokens (`surface`, `surface-raised`, `surface-overlay`, `surface-sunken`, `surface-muted`, `fg`, `fg-muted`, `fg-subtle`, `border`, `border-muted`, `border-strong`). No raw `neutral-*` usage observed outside the one popover case.
- `text-2xs` is used in `radio`, `checkbox`, `switch`, `time-picker`, `command-palette` — all consistent with the codified "xs-density secondary text" intent.
- Animation classes are referenced consistently: every overlay component uses `scale-in fade-in` / `scale-out fade-out` (popover, menu, command-palette, select-overlay, date-picker-overlay, date-range-picker-overlay); tooltip uses `fade-in`/`fade-out`; alert uses `fade-out` on leave only.

### Findings (consistency)
- No drift observed. The theme tokens are consumed exactly as intended.
- The two unused duration tokens (`--duration-fast`, `--duration-normal`) represent a contract the library doesn't honour — defining tokens you don't use confuses consumers who might layer their own customisation on top.

## Tests
- `theme.service.spec.ts` — 14 tests covering: localStorage hydration (valid value, missing, invalid), `setTheme` + persistence, `cycleTheme` ordering, mutually-exclusive boolean flags, system theme reactivity, target=documentElement vs body, localStorage error tolerance, server platform skip, `applyToElement`, composite `state()`, and one inline-style-injected contrast check for `--color-on-*`.
- `theme.directive.spec.ts` — 3 tests: initial attribute, attribute updates on input change, iteration over all `ResolvedTheme` values.
- No spec for `theme.config.ts` (`provideTheme`) — covered transitively via the service spec.
- No spec for the CSS tokens themselves — that requires a visual/contrast tool (axe-core, Playwright with screenshot diff) and is intentionally out of unit-spec scope.
- Vitest-specific: uses `vi.stubGlobal`, `vi.fn`, `vi.restoreAllMocks` correctly. No `fakeAsync`/`tick`. `TestBed.flushEffects()` is used to drain the persistence effect. Compliant.
- **Findings:**
  - The contrast-tokens test (theme.service.spec.ts:194-220) injects an inline `<style>` block to seed `--color-on-*` values and asserts they are non-empty — this is a *style injection test*, not a true CSS-asset test, since the spec runs without the actual `_semantic.css` partial loaded. It assures the token *names* are stable, not that the *real* values resolve. That's the right scope for a Vitest spec; the real-value pass belongs to an e2e contrast check. Worth a one-line code comment to clarify the testing boundary.

## Gaps & lacks
1. **Color contrast pass on `on-info` / `on-error` / `on-neutral` (P0-verify).** Three of the eight `on-{role}` foregrounds are very likely below WCAG-AA body-text contrast in light mode. If confirmed, either deepen the corresponding `-500` shade or change the foreground.
2. **High-contrast: no `forced-colors: active` handling, no focus-ring override (P1).**
3. **Dark mode: `on-{role}` tokens not redefined for `[data-theme="dark"]` (P1).** Currently works by coincidence; should be deliberate.
4. **Type / constant naming: `Theme`, `ResolvedTheme`, `ThemeConfig`, `ThemeState`, `THEMES`, `RESOLVED_THEMES`, `DEFAULT_THEME_CONFIG` should carry the `Tw` prefix per the codified rule (P1).**
5. **Missing JSDoc on `Theme`, `ResolvedTheme`, `THEMES`, `RESOLVED_THEMES`, `DEFAULT_THEME_CONFIG` (P2).**
6. **`--duration-fast` / `--duration-normal` defined but unused (P2).** Either adopt or remove.
7. **`_palette.css` is misnamed (P3).** It defines fonts + durations.
8. **No CSS-only `prefers-color-scheme` fallback for SSR (P2).**

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this foundation.

### Goal
Bring the theme surface to production-grade by (1) closing two WCAG-AA contrast gaps, (2) adding the high-contrast `forced-colors` and dark-mode `on-{role}` overrides, (3) renaming the public TS surface to follow the codified `Tw`-prefix rule, and (4) reconciling the unused animation-duration tokens with how components actually consume durations.

### Tasks
1. **Audit and fix contrast for `on-info`, `on-error`, `on-neutral` solid fills** — one-line summary: every `{role}-500` ↔ `on-{role}` pair must meet WCAG-AA body-text contrast (4.5:1) in all three resolved themes.
   - File(s): `projects/ngx-tw/theme/_semantic.css:138-152` (light), `projects/ngx-tw/theme/_dark.css:1-122` (dark — add `on-{role}` overrides), `projects/ngx-tw/theme/_high-contrast.css:1-122` (high-contrast — add `on-{role}` overrides).
   - Why: `info-500` (sky-500), `error-500` (red-500), and `neutral-500` (gray-500) against `white` foreground sit around 3.5–4.0:1 in light mode — below the AA threshold for normal text.
   - Change:
     - Use the WebAIM contrast checker or axe-core for ground truth on each pair across all three themes.
     - Likely outcomes:
       - `--color-on-info: var(--color-sky-950)` (mirror `on-success`/`on-warning`'s pattern) OR shift the components that use `bg-info-500` to `bg-info-600`.
       - `--color-on-error: var(--color-red-50)` (very light) is unlikely to help — instead consider `--color-error-500: var(--color-red-600)` so the existing `text-on-error: white` continues to work. Verify against components that use `border-error-500` (form-field error state) — deepening the role-500 may affect borders.
       - `--color-on-neutral: var(--color-gray-950)` (dark text on mid-gray); or migrate neutral solid fills to `bg-neutral-700` plus white. Material picks the latter.
     - For each `{role}` where the fill shade shifts, audit existing component class strings (`grep -rn "bg-{role}-500"`) — a deepening of `-500` may darken existing badges/buttons/alerts visibly. If so, prefer the *foreground* change.
     - Add the corresponding `--color-on-*` overrides to `_dark.css` and `_high-contrast.css` so each theme sets a known-good foreground rather than inheriting from light.
   - Acceptance:
     - axe-core run on a demo page that renders `<tw-badge color="info">`, `<tw-button color="error">`, `<tw-alert color="neutral">` in light/dark/high-contrast passes all `color-contrast` checks for body-text size.
     - The 8 `{role}-500` × `on-{role}` pairs each meet ≥4.5:1 in each of the three resolved themes (24 pairs total).
     - Theme service spec (`theme.service.spec.ts:194-220`) still passes; update the inline-injected style block if foreground tokens changed.

2. **Add `forced-colors` and focus-ring overrides to the high-contrast layer** — one-line summary: handle Windows high-contrast mode and ensure focus rings remain visible.
   - File(s): `projects/ngx-tw/theme/_high-contrast.css` (extend), or a new `_forced-colors.css` partial imported from `index.css`.
   - Why: Windows users with "High contrast" enabled get a `forced-colors: active` media context that replaces backgrounds with `Canvas`, text with `CanvasText`, and selection with `Highlight`. Today none of those mappings are honoured.
   - Change:
     - Add at the end of `_high-contrast.css` (or a new file):
       ```css
       @media (forced-colors: active) {
         :root, [data-theme="high-contrast"] {
           --color-surface: Canvas;
           --color-surface-raised: Canvas;
           --color-surface-overlay: Canvas;
           --color-fg: CanvasText;
           --color-fg-muted: CanvasText;
           --color-fg-subtle: GrayText;
           --color-border: CanvasText;
           --color-border-strong: CanvasText;
           --color-primary-500: Highlight;
         }
         /* Disable color-adjust on critical interactive affordances so
            system colors apply uniformly. */
         button, [role="button"], input, select, textarea,
         [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"],
         [role="option"], [role="tab"] {
           forced-color-adjust: none;
         }
       }
       ```
     - Verify the demo's focus indicator policy still resolves — `focus-visible:outline-primary-500` will now use `Highlight` automatically since the token is remapped.
   - Acceptance:
     - Open the demo in Windows + High Contrast (or simulate via DevTools "Emulate CSS forced-colors: active"). All interactive elements remain visible with system colors. Focus rings appear in system Highlight color.
     - No regression in non-forced-colors high-contrast mode.

3. **Add dark-mode `on-{role}` overrides** — one-line summary: redefine `--color-on-*` in `_dark.css` to match the inverted role-500 backgrounds.
   - File(s): `projects/ngx-tw/theme/_dark.css` (extend).
   - Why: today `on-success` and `on-warning` use `-950` (deep green/amber) in light mode and the dark inversion (`green-950 → green-50`) results in *light* foregrounds against the still-mid green/amber backgrounds. It works, but by accident. Make it deliberate.
   - Change:
     - Append to `_dark.css`:
       ```css
       [data-theme="dark"] {
         /* In dark mode, the role-500 backgrounds remain at the Tailwind palette
            -500 shade (the role-→shade map in _dark.css inverts only the role
            shades, not the Tailwind base). So `bg-success-500` stays mid-green
            and the on-foreground stays at the deep amber/green that worked in
            light mode. Other roles redefine to preserve readability. */
         --color-on-info: var(--color-white);
         --color-on-success: var(--color-green-950);
         --color-on-warning: var(--color-amber-950);
         --color-on-error: var(--color-white);
         --color-on-primary: var(--color-white);
         --color-on-secondary: var(--color-white);
         --color-on-accent: var(--color-white);
         --color-on-neutral: var(--color-white);
       }
       ```
     - Once Task 1 lands with corrected light-mode `on-*` values, copy whichever values pass dark-mode contrast.
   - Acceptance: same contrast check from Task 1 passes in dark mode. The values are explicit in `_dark.css`, not inherited.

4. **Rename theme types and constants to follow the `Tw` prefix rule** — one-line summary: `Theme → TwTheme`, `ResolvedTheme → TwResolvedTheme`, etc.
   - File(s): `projects/ngx-tw/theme/theme.types.ts`, `projects/ngx-tw/theme/index.ts`, `projects/ngx-tw/theme/theme.service.ts`, `projects/ngx-tw/theme/theme.directive.ts`, `projects/ngx-tw/theme/theme.config.ts`, spec files.
   - Why: codified in CLAUDE.md — shared hand-authored types in the public surface that have no other namespace cue must carry the `Tw` prefix. `Theme`, `ResolvedTheme`, `ThemeConfig`, `ThemeState` are exactly such types; consumers will write `import { Theme } from 'ngx-tw/theme'` and risk collision with their own `Theme` types.
   - Change:
     - Rename: `Theme → TwTheme`, `ResolvedTheme → TwResolvedTheme`, `ThemeConfig → TwThemeConfig`, `ThemeState → TwThemeState`.
     - Rename: `THEMES → TW_THEMES`, `RESOLVED_THEMES → TW_RESOLVED_THEMES`, `DEFAULT_THEME_CONFIG → DEFAULT_TW_THEME_CONFIG`.
     - Update `index.ts` exports.
     - Update all internal usages (theme.service.ts, theme.directive.ts, theme.config.ts, both spec files).
     - **Do not** rename `ThemeDirective` / `ThemeService` — directive and service classes correctly carry no `Tw` prefix per the same rule.
     - ~~**Do not** rename `THEME_CONFIG` (the `InjectionToken`) — it follows the canonical `TW_ERROR_STATE_MATCHER` pattern and is already correctly prefixed.~~
     - **Corrected (pass 6): the premise was factually wrong.** `THEME_CONFIG` was **not** prefixed — it was declared `export const THEME_CONFIG = new InjectionToken(...)`. It was one of 12 unprefixed tokens of 24, and was renamed to `TW_THEME_CONFIG` with a deprecated `export const THEME_CONFIG = TW_THEME_CONFIG` alias. This line is left struck through rather than deleted because, as written, it would lead the next reviewer to re-derive the same wrong objection.
   - Acceptance:
     - `grep -rn "import.*Theme.*from 'ngx-tw/theme'" projects/demo/` returns the new names.
     - `npm run build:lib` passes.
     - `npm test` passes.
     - Spec files reference `TwTheme`, `TwResolvedTheme`, etc.

5. **Reconcile unused animation-duration tokens** — one-line summary: either adopt `--duration-fast` / `--duration-normal` in component class strings or remove them from `_palette.css`.
   - File(s): `projects/ngx-tw/theme/_palette.css:7-8` (canonical), plus every component that uses `duration-150` or `duration-200`.
   - Why: defining a token the library doesn't consume creates an implicit public contract the library can't honour.
   - Change:
     - **Option A (preferred):** Tailwind v4's `@theme` block generates `duration-fast` and `duration-normal` utilities automatically. Migrate every `duration-150` to `duration-fast` and every `duration-200` to `duration-normal`. Consumers can then override the tokens to globally re-time the library.
     - **Option B:** delete the two tokens from `_palette.css`. Components keep using hardcoded `duration-150`/`duration-200`.
   - Acceptance:
     - Option A: `grep -rn "duration-150\|duration-200" projects/ngx-tw/` returns zero results in component source files; `grep -rn "duration-fast\|duration-normal" projects/ngx-tw/` matches the migrated usages.
     - Option B: `_palette.css` no longer defines duration tokens.

6. **Add CSS-only `prefers-color-scheme` fallback** — one-line summary: hoist the dark-mode rules into a `@media (prefers-color-scheme: dark)` block in addition to the `[data-theme="dark"]` selector.
   - File(s): `projects/ngx-tw/theme/_dark.css`.
   - Why: SSR / pre-hydration / non-Angular consumers get light mode regardless of OS preference today.
   - Change: wrap the `[data-theme="dark"]` block as `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]):not([data-theme="high-contrast"]) { /* same body */ } } [data-theme="dark"] { /* same body */ }`. The `:not()` selectors let an explicit `data-theme` override win over the OS preference.
   - Acceptance:
     - Loading the demo without any `data-theme` attribute on `<html>` in a browser set to "prefer dark" renders in dark mode.
     - Explicitly setting `data-theme="light"` overrides the OS preference.

7. **Add missing JSDoc on theme types/constants** — one-line summary: one-liner JSDoc on `Theme`, `ResolvedTheme`, `THEMES`, `RESOLVED_THEMES`, `DEFAULT_THEME_CONFIG`.
   - File(s): `projects/ngx-tw/theme/theme.types.ts:1-38`.
   - Why: Compodoc API tables.
   - Change: add a one-line JSDoc above each. Trivial.
   - Acceptance: Compodoc renders descriptions for the renamed types and constants.

8. **Add class-level JSDoc to `ThemeService`** — one-line summary: explain what the service does, registration via `provideTheme`, and how `theme` vs `resolvedTheme` differ.
   - File(s): `projects/ngx-tw/theme/theme.service.ts:13-15`.
   - Why: public service has signal-level docs but no class-level doc.
   - Change: 3-line JSDoc.
   - Acceptance: Compodoc renders the class-level description.

9. **Rename `_palette.css` to `_typography.css` (or split)** — one-line summary: the file is misnamed.
   - File(s): `projects/ngx-tw/theme/_palette.css`, `projects/ngx-tw/theme/index.css`.
   - Why: the file contains fonts + animation durations, not palette shades. The actual palette mappings are in `_semantic.css`/`_dark.css`/`_high-contrast.css`.
   - Change: rename to `_typography.css` (and adjust the `@import` in `index.css`). If task 5 keeps `--duration-*`, split into `_typography.css` + a `_motion.css` partial. Cosmetic but reduces confusion. P3.

### Out of scope
- Migrating components to use shared `Tw`-prefixed types from `core` (covered in `core.md`).
- Renaming `ThemeService` or `ThemeDirective` (correct as-is).
- Renaming `THEME_CONFIG` (correct as-is).
- Visual redesign of any component — this PR adjusts tokens and theme infrastructure only.

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Theme: visual sanity-check in demo at `http://localhost:4600` with light + dark + high-contrast modes toggled. Specifically:
  - Visit `/badge`, `/button`, `/alert`, `/stepper` and inspect every `color` variant in each of the three themes.
  - Open Chrome DevTools → Rendering → "Emulate CSS forced-colors: active" → check that focus rings switch to system Highlight color and interactive elements remain visible.
  - Open Chrome DevTools → Rendering → "Emulate prefers-color-scheme: dark" → with `<html data-theme>` *unset*, the page should render in dark mode (validates Task 6).
- Contrast: run axe-core (or `@axe-core/cli`) on the demo with each theme active and assert zero `color-contrast` violations.

## Priority
**P0** — the theme is mostly excellent, but the contrast-pass issue on `on-info` / `on-error` / `on-neutral` is a WCAG-AA accessibility issue that the library currently ships. Until that pair audit is run and any failing shades fixed, every component using a solid `bg-info-500` / `bg-error-500` / `bg-neutral-500` fill (badges, buttons, alerts in info/error/neutral colors, stepper indicators) is at risk of failing AXE checks for consumers. Everything else (forced-colors, dark-mode `on-{role}`, naming, JSDoc, duration tokens, palette rename) is P1/P2 and can be batched into a follow-up.
