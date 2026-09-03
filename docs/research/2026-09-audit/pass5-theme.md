# Pass 5 — lens: CSS token & theme system (`theme`)

Read-only audit of `projects/ngx-tw/theme/` (CSS + runtime API), its consumption across
`projects/ngx-tw/**` and `projects/demo/**`, its packaging into `dist/ngx-tw/`, and its
e2e / MCP coverage.

---

## Verified clean — stated positively so pass 6 does not re-sweep

Spot-check of the pass-4 closed list still holds on the current tree: **0** raw Tailwind
palette colours in library component code, **0** `transition-all`, **0** forbidden shadows
(`shadow-lg|xl|2xl`), **0** forbidden radii (`rounded-sm|2xl|3xl` / bare `rounded`),
**0** `dark:` variants. Not re-derived further. **[measured]**

New clean results from this pass — all mechanical, all reproducible:

1. **Scheme parity is exact.** Extracted every custom-property *definition* from the four
   token-bearing blocks: `_semantic.css` `@theme` (+`_typography.css`), `_dark.css`'s
   `[data-theme="dark"]` block (`:13-274`), `_dark.css`'s `@media (prefers-color-scheme:
   dark)` block (`:276-520`), and `_high-contrast.css`'s `[data-theme="high-contrast"]`
   block (`:1-242`). All three schemes define **exactly the same 195 colour tokens** —
   zero keys in one scheme and missing from another, in any direction. The 17 tokens
   present only in the light/`@theme` set are all deliberately scheme-invariant
   (`--font-*`, `--duration-*`, `--text-*`, `--shadow-table-sticky*` which resolves through
   `var(--color-border)` at use site, and `--color-overlay-control{,-hover}` whose fixed
   `oklch(0 0 0 / 0.4)` is documented at `_semantic.css:9-16`). **There are no dark-mode
   or high-contrast token holes.** **[measured]**

2. **The two hand-duplicated dark blocks are byte-identical.** `_dark.css:1-11` warns that
   the `[data-theme="dark"]` body and the `prefers-color-scheme` body are duplicated by
   hand and must stay in lock-step. Diffed all 195 `--name: value;` declarations from each:
   **identical, values included.** No drift today. (See F9 — nothing prevents future drift.)
   **[measured]**

3. **No undefined tokens.** Extracted every colour-namespace utility written in library
   source (`bg-|text-|border-|ring-|inset-ring-|outline-|fill-|stroke-|divide-|from-|to-|
   via-|shadow-|decoration-|caret-|accent-|placeholder-` × `surface|fg|border|
   overlay-control|on-{role}|{role}`, including `-x/-y/-t/-r/-b/-l/-s/-e` side variants):
   **225 distinct classes, 0 that resolve to an undefined `--color-*` token.** Same sweep
   over `projects/demo/src`: **90 distinct, 0 undefined.** `text-2xs`, `duration-normal`,
   `duration-fast`, `shadow-table-sticky{,-cell-start,-cell-end}`, `font-mono`, `font-sans`
   all check out against their definitions too. **[measured]**

4. **No dead tokens.** Swept all 212 definitions for consumption across
   `projects/ngx-tw`, `projects/demo`, `e2e`. The naive sweep flags 51, and **all 51 are
   false positives** for two documented reasons: (a) the `{role}-{shade}` 50–950 rungs are
   the consumer escape-hatch scale that `_semantic.css:168-175` explicitly preserves as a
   complete, uniform grid — an unreferenced `--color-accent-200` is the API, not dead code;
   (b) the slot tokens (`-soft-hover`, `-soft-fg-muted`, `-border`, …) are consumed through
   template literals — `alert.ts:40-62` builds `bg-${role}-soft-hover` etc. — which is
   exactly why `index.css:45-49` enumerates the role × slot matrix in `@source inline(...)`.
   Confirms **pass 1's F5 (`--width-calendar-*`) is closed**: the token is gone; only the
   prose comment at `calendar/calendar.ts:187` explaining its removal remains. **[measured]**

5. **Every `animate.enter` / `animate.leave` class has a keyframe, and no keyframe is
   orphaned.** Resolved all 16 distinct class names used across the library — including the
   dynamic ones (`toast-container.ts:222-224` `toast-{enter,leave}-${axis}` over
   `POSITION_AXIS`'s four values; `stepper.ts:419-424`; `timeline.ts:1260-1264`;
   `toast-container.ts:413`'s `leaveAnimationOverride`) — against `_base.css`. **16/16
   defined.** Inverse direction: all 28 classes defined in `_base.css`
   have at least one non-theme consumer. `prefers-reduced-motion` is covered per-class at
   `_base.css:339-376` **and** by the universal `!important` guard at `_base.css:384-394`.
   The universal guard's `animation-duration: 1ms !important` does supersede the named
   `0ms` rules, but the two declarations it does *not* set — `transform: none`
   (`:360`, timeline) and `translateX(35%)` (`:369`, progress bar) — still apply, so the
   named block is not dead. **[measured]**

6. **SSR-safe.** All five environment touch-points in `theme.service.ts` are guarded by
   `isPlatformBrowser`: `loadInitialTheme` (`:109`), `detectSystemTheme` (`:122`),
   `applyToDocument` (`:127`), `persistTheme` (`:136`), and the `matchMedia` +
   `addEventListener` in the constructor (`:68-77`). `localStorage` access is additionally
   wrapped in `try/catch`. `theme.service.spec.ts:235` covers the server path. **[verified]**

7. **`ThemeService` is `@Injectable()` with no `providedIn`** (`theme.service.ts:26`) —
   compliant with the CLAUDE.md rule. `THEME_CONFIG` is provided by `provideTheme`, not
   root-provided. **[verified]**

8. **`provideTheme`'s explicit-`undefined` hole (P4-8) is fully closed, not partially.**
   `theme.config.ts:31-33` filters `undefined` from **all** entries generically, so
   `defaultTheme`, `attribute` and `target` are covered by the same fix as `storageKey` —
   there is no second hole in the config surface. **[verified]**

9. **Both shipping paths for the theme actually resolve.** `projects/ngx-tw/ng-package.json`
   carries `"assets": ["theme/**/*.css"]`; `dist/ngx-tw/theme/` holds all six CSS files;
   `dist/ngx-tw/package.json` `exports` carries **both** `"./theme/*.css" → "./theme/*.css"`
   and `"./theme" → fesm2022/cdevhub-ngx-tw-theme.mjs` + types, and
   `dist/ngx-tw/theme/package.json` points at the fesm bundle. **This closes
   `docs/production-audit.md:48-55`**, which recorded
   `@cdevhub/ngx-tw/theme/index.css => FAILED: "./theme/index.css" is not exported`.
   The documented specifiers in `projects/ngx-tw/README.md:49,141,329-330` are the ones that
   exist. `@source "../fesm2022/**/*.mjs"` (`index.css:37`) resolves correctly relative to
   the published `theme/` directory. **[measured]**

### Register correction — "high-contrast has zero verification" is stale

`docs/audit-2026-09-register.md:143` records the cross-theme contrast sweep as `test.fixme`'d
with high-contrast unverified. That is no longer true: `e2e/specs/02-cross-cutting/
theme-matrix.spec.ts:52-115` was re-enabled 2026-09-02 and now sweeps all three resolved
themes. State the scope precisely so it is not over-read:

- 4 sampled pages only (`theme-matrix.spec.ts:30-35`: button, alert, input, dialog examples),
- the `color-contrast` axe rule only,
- with `[id^="tw-form-field-hint"]` excluded by selector,
- plus an attribute assertion that `<html data-theme>` matches the seeded value.

`/services/theme/examples` is **not** in `SAMPLED_PAGES`. The only browser coverage the theme
page itself gets is one visual baseline (`e2e/specs/04-visual/canary.spec.ts:257-265`) scoped
to its **"Semantic Tokens"** swatch grid — *not* to its "Side-by-Side Preview" section. That
is precisely why F1 below is unguarded. **[measured]**

---

## Findings

### F1 `[twTheme]="'light'"` is a no-op inside any dark or high-contrast ancestor — `light` is the only resolved theme with no selector-based token block
Severity: HIGH
Anchor: projects/ngx-tw/theme/_dark.css:13
Register: not in register
Confidence: [verified]
What: `dark` and `high-contrast` each get an element-agnostic, unlayered rule —
`[data-theme="dark"] { … }` (`_dark.css:13`) and `[data-theme="high-contrast"] { … }`
(`_high-contrast.css:1`) — which match **any** element carrying the attribute and cascade
their custom properties into the subtree. `light` has no such rule. Its values exist only
inside `_semantic.css`'s `@theme` block, which Tailwind v4 emits as
`@layer theme { :root, :host { … } }`. A `<div data-theme="light">` matches neither `:root`
nor `:host`, so **nothing re-declares the light tokens on it** and it inherits whatever its
ancestors resolved to. Grep confirms the only `[data-theme="light"]` selector anywhere in
the theme CSS is `_high-contrast.css:253`, inside `@media (forced-colors: active)`, which
sets structural tokens only. Consequence: `[twTheme]="'light'"` works only when the root is
already light; `dark` and `high-contrast` subtrees work in every direction. Three amplifiers
of the same root cause:
- `ThemeService.applyToElement()` (`theme.service.ts:100`) is public API with the identical
  hole; its JSDoc reads "used to scope themes to a subtree."
- `theme.meta.ts:12` advertises subtree scoping into the MCP index, and
  `projects/ngx-tw/README.md:187` promises it in prose. `scripts/verify-mcp-index.mjs:6-8`
  argues in its own header that a wrong index *amplifies* — consumers' models will emit
  broken subtree code confidently.
- The mirror bug in the `dark:` custom variant: `index.css:18-25`'s media branch matches
  `:root:not([data-theme="light"]) *`, so under an OS-dark root a `[data-theme="light"]`
  subtree's descendants still take `dark:` utilities. Zero library impact (the library
  ships no `dark:` variants), consumer-facing only.
Why it matters: the demo's own page demonstrates it. `theme-examples.component.ts:197-219`
renders three side-by-side `[twTheme]` panes for light / dark / high-contrast. Switch the
page to dark and the "light" pane stays dark — the feature's own showcase is broken in the
one state where it matters. A consumer building an always-light preview pane, an email/print
preview, or a light-on-dark hero gets silent no-op with no error.
Fix: add a `[data-theme="light"] { … }` block to `_semantic.css` (or a new `_light.css`
imported alongside `_dark.css` / `_high-contrast.css`) duplicating the light values, mirroring
how dark and high-contrast are already structured. **Purely additive CSS — not a semver
break**, and safe: the block only ever matches an element that explicitly opts in, and
`_dark.css:277` already excludes `[data-theme="light"]` from its `:root` media branch. Apply
the same `:where([data-theme="light"], [data-theme="light"] *)` exclusion to `index.css`'s
`@custom-variant dark` media branch. On the visual baseline: the only theme-page screenshot
(`canary.spec.ts:257-265`) covers the "Semantic Tokens" grid, and it runs under the
`chromium-light` project where `ThemeService` has written `data-theme="light"` onto `<html>`
— so a new `[data-theme="light"]` block *does* newly match the baseline's root element. It is
still baseline-neutral, and this is the whole argument: the block restates exactly the
declarations `@theme` already resolves on `:root` (same `var(--color-gray-50)` etc.), so every
computed value is byte-identical and no pixel moves. Keep the two in sync — or, safer, author
the light block by mechanical copy from the `@theme` body rather than by hand, and extend
F9's parity check to cover it. Add a `theme-matrix.spec.ts` case seeding
`ngx-tw-theme=dark`, loading `/services/theme/examples`, and asserting the three
Side-by-Side panes have three different `background-color`s — no such assertion exists today.

### F2 `provideTheme()` never instantiates `ThemeService`, so a persisted theme is silently not applied until something injects it
Severity: HIGH
Anchor: projects/ngx-tw/theme/theme.config.ts:34
Register: not in register
Confidence: [verified]
What: `makeEnvironmentProviders([{ provide: THEME_CONFIG, … }, ThemeService])` *registers*
`ThemeService` but never constructs it — there is no `provideEnvironmentInitializer`,
`ENVIRONMENT_INITIALIZER` or `APP_INITIALIZER` anywhere in the entry point. The service is
built on first `inject()`. Everything that applies the theme lives in its constructor
effect (`theme.service.ts:79-84`) and its field initialisers (`:39`, `:42`), so until
someone injects it: no `data-theme` attribute is written, the stored `localStorage` value is
never read, and the OS media listener is never registered.
Why it matters: a consumer who calls `provideTheme({ defaultTheme: 'dark' })` and puts their
theme toggle in a lazily-loaded route gets **no theme at all** on first paint of every other
route — their persisted "dark" choice is dropped until the settings chunk loads. The
`prefers-color-scheme` CSS fallback masks the subset where the stored choice happens to agree
with the OS, which makes the failure intermittent and hard to attribute. The demo cannot
surface it because `projects/demo/src/app/layout/shell.ts:639` injects `ThemeService` in the
eagerly-loaded root layout, and every spec in `theme.service.spec.ts` calls
`TestBed.inject(ThemeService)` explicitly — the un-injected path has zero coverage.
Counter-argument, stated honestly: `projects/ngx-tw/README.md:161` does say "register
`provideTheme()` **and inject** `ThemeService`". But `provideTheme`'s own JSDoc
(`theme.config.ts:18-20`) says only "Call once in the app's environment providers", with no
hint that it is inert on its own — the documentation is the defect as much as the code.
Fix: add `provideEnvironmentInitializer(() => { inject(ThemeService); })` to the returned
provider array in `provideTheme` (`theme.config.ts:34-40`). Behaviour fix, no API change,
no semver break; the service is already idempotent and SSR-guarded. Add a spec that
bootstraps a TestBed with `provideTheme({ defaultTheme: 'dark' })`, injects **nothing**, and
asserts `document.documentElement.getAttribute('data-theme') === 'dark'`; confirm it fails
before the fix.

### F3 No flash-free path for a persisted theme that disagrees with the OS preference
Severity: MEDIUM
Anchor: projects/ngx-tw/README.md:154
Register: not in register
Confidence: [verified]
What: the CSS-only story is genuinely good and should be kept — `_dark.css:276-277`'s
`@media (prefers-color-scheme: dark)` branch means a consumer who never calls `provideTheme`
gets flash-free OS-driven dark with zero JavaScript, and the README says so (`README.md:154-159`). The gap is the
other case: once a user makes an **explicit** choice that disagrees with their OS (chose
light on a dark machine, or chose `high-contrast` at all), the attribute is written by the
`ThemeService` constructor effect, which cannot run before the app bundle executes. Every
such reload paints the OS-derived theme first, then snaps. Neither README ships nor documents
the standard inline-`<head>` bootstrap snippet, and nothing in the package provides one.
Why it matters: this is the single most-reported complaint about any theme switcher, and the
library currently has no answer for it in code or in docs. It also survives F2's fix —
`provideEnvironmentInitializer` still runs after bundle execution.
Fix: document (README "Dark mode & runtime switching", and mirror into
`theme.meta.ts.whenToUse` so the MCP index carries it) a copy-pasteable inline snippet for
`index.html`, keyed off the same storage key and attribute the service uses, e.g.
`<script>try{var t=localStorage.getItem('ngx-tw-theme');if(t&&t!=='system')
document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>`. Optionally ship
it as an exported string constant so the key/attribute cannot drift from `THEME_CONFIG`.
Docs + additive export; no semver break.

### F4 `'system'` can never resolve to `high-contrast` — `prefers-contrast` is observed nowhere
Severity: MEDIUM
Anchor: projects/ngx-tw/theme/theme.service.ts:121
Register: not in register
Confidence: [measured]
What: `TwTheme` includes `'high-contrast'` and `DEFAULT_TW_THEME_CONFIG.defaultTheme` is
`'system'`, but `detectSystemTheme()` (`:121-124`) and the media listener (`:34-36`) query
only `(prefers-color-scheme: dark)`. `systemTheme` is typed `TwResolvedTheme` yet can only
ever hold `'light' | 'dark'`. Grep across `projects/`, `e2e/` and `scripts/`:
`prefers-contrast` and `contrast-more` appear **zero** times in the entire repo.
Why it matters: a user with macOS "Increase contrast" or the equivalent GTK/Windows setting,
on an app using the default `'system'`, silently gets the ordinary light theme. The
`@media (forced-colors: active)` block (`_high-contrast.css:251-289`) covers Windows High
Contrast at the CSS layer, but `prefers-contrast: more` is a different, more common signal
and is covered by neither the CSS nor the service. The high-contrast theme is a shipped,
fully-parity'd 195-token scheme that the OS can never select.
Fix: observe a second `MediaQueryList` for `(prefers-contrast: more)` alongside the existing
one and let `systemTheme` resolve to `'high-contrast'` when it matches. Additive, no API
change — **but flag the tradeoff it forces**, because it is not free: the library ships only
one high-contrast scheme and it is light-based (`_high-contrast.css:2-13` maps every surface
to white/`gray-50` and `--color-fg` to black). So a user with *both* OS settings on — dark
appearance **and** increased contrast, a common pairing — would be moved from the dark scheme
to a white-background one. That is a visible regression for a real population, and it is the
actual constraint, not an abstract semantics question.
**Needs a decision, naming that constraint:** either (a) add a fourth, dark-based
high-contrast scheme so `prefers-contrast` can compose with `prefers-color-scheme` instead of
overriding it — the honest fix, and the largest; (b) let `prefers-contrast` win only when the
OS is *not* also dark, so dark users keep dark; or (c) leave `'system'` meaning colour scheme
only, and instead narrow `TwThemeState.systemTheme` / document at `theme.types.ts:1` that
`'system'` never selects `'high-contrast'` — today the type promises more than the
implementation delivers, which is the part that is unambiguously wrong under any option.

### F5 `provideTheme` persists a theme the user never chose, making `defaultTheme` a one-shot
Severity: MEDIUM
Anchor: projects/ngx-tw/theme/theme.service.ts:83
Register: not in register
Confidence: [verified]
What: the constructor effect calls `persistTheme(selected)` unconditionally on its very first
run, so merely loading the app writes `DEFAULT_TW_THEME_CONFIG.defaultTheme` (`'system'`) —
or whatever `provideTheme` was given — into `localStorage`. From then on `loadInitialTheme()`
(`:108-119`) finds a stored value and the configured `defaultTheme` is permanently ignored
for that browser.
Why it matters (leading with the part that bites immediately): the library writes to client
storage on page load with no user action at all. Consumers operating under a storage-consent
flow have to either patch around the service or not use it — and nothing in the README or the
JSDoc warns them that merely providing it writes. The secondary consequence is narrower than
it first looks and is stated here deliberately so it is not over-weighted: while
`defaultTheme` stays `'system'`, persisting `'system'` and re-resolving it against the live OS
is behaviourally identical to having stored nothing. It only bites when a consumer *changes*
`defaultTheme` in a later release and finds it silently ignored for every returning visitor,
with no way to distinguish "user chose system" from "user never chose anything".
Fix: only persist on an explicit change — either move the write out of the effect into
`setTheme()` / `cycleTheme()`, or keep the effect and guard it with a `hasUserChosen` flag
set by those two methods. Behaviour fix, no API change. `theme.service.spec.ts:80` already
asserts `setTheme` persists, so that guard survives; add a spec asserting a freshly
constructed service leaves `localStorage` untouched.

### F6 The MCP index serves zero snippets for the entire runtime theming API
Severity: MEDIUM
Anchor: projects/demo/src/app/routes/theme/examples/theme-examples.component.ts:226
Register: extends "Open — carried to pass 5" (`verify:mcp-index`'s 7th warning)
Confidence: [measured]
What: the register's diagnosis is correct and can be stated more precisely than "inlines code
samples instead of using `{section}Snippet` consts". `scripts/mcp/extract-snippets.mjs:99`
collects **`PropertyDeclaration`s whose name ends in `Snippet`**, and pairs each with a
`[code]="name"` binding on a `<tw-code-block>` (`:76`). The theme route contains **zero**
`*Snippet` properties and **zero** `<tw-code-block>` elements — grep over
`projects/demo/src/app/routes/theme/` returns nothing for either. All three code samples are
raw `<pre><code>` blocks with `{{ '{' }}` brace escaping:
`theme-examples.component.ts:226`, `theme-overview.component.ts:41`,
`theme-api.component.ts:113`. So `extractSnippets` legitimately returns `[]` and check 5
warns.
Why it matters: `verify-mcp-index.mjs:6-8` states the stakes itself — a model consuming the
index has no example of `provideTheme`, `ThemeService`, `[twTheme]`, or the CSS import for
the one entry point most likely to be the consumer's *first* integration step.
Fix: this is **authoring**, not refactoring. Add `*Snippet` properties + `<tw-code-block>`
renderings per the `demo-doc-page` skill, minimally: `providerSnippet` (ts —
`provideTheme()` in `app.config.ts`), `cssImportSnippet` (css — `@import
'@cdevhub/ngx-tw/theme/index.css'`), `toggleSnippet` (ts — inject `ThemeService`, `setTheme`
/ `cycleTheme`), `subtreeSnippet` (html — `[twTheme]`; author this **after** F1 is fixed, or
the index will amplify a broken pattern), and `rebrandSnippet` (css — `@theme` token
override). Note check 4 (`verify-mcp-index.mjs:358`) already whitelists
`theme/*.css` import paths, so the CSS snippet will validate.

### F7 `verify-mcp-index` check 5 reports a wrong cause when the demo page exists
Severity: LOW
Anchor: scripts/verify-mcp-index.mjs:370
Register: extends "Open — carried to pass 5" (same register bullet as F6)
Confidence: [verified]
What: the warning text is hard-coded to
`missing or renamed demo page at projects/demo/src/app/routes/${entry.name}` regardless of
whether the directory exists. For `theme` the directory exists with five files; the real
cause is "no extractable snippets". A maintainer following the message looks for a renamed
route and finds nothing wrong.
Why it matters: a diagnostic that names the wrong cause costs more than no diagnostic — this
one has already been recorded as a mystery in the register.
Fix: branch on the route directory's existence. `verify-mcp-index.mjs` has only `repoRoot`
and `libRoot` in scope (`:28-29`) — `demoRoutes` is defined in `build-mcp-index.mjs:26` — so
either compute `join(repoRoot, 'projects/demo/src/app/routes', entry.name)` locally, or
(cleaner, and it removes the duplicated path constant) have `build-mcp-index.mjs:70-84`
carry `hasRouteDir: existsSync(routeDir)` onto each index entry and branch on that. Emit
"demo page exists but declares no `{section}Snippet` properties bound to a `<tw-code-block>`"
in the exists case.

### F8 Root `README.md` still describes the theme as "an asset, not an entry point"
Severity: LOW
Anchor: README.md:19
Register: extends docs/tree-shaking-audit.md F3
Confidence: [verified]
What: the repo-layout table says `projects/ngx-tw/theme/` is "Default semantic theme CSS —
ships as an asset, not an entry point." It is both: `theme/ng-package.json` makes it a
secondary entry point, `dist/ngx-tw/package.json` exports `"./theme"`, and
`src/public-api.ts` re-exports it. `docs/tree-shaking-audit.md:25` records that CLAUDE.md and
the library README were corrected; the root README was missed.
Why it matters: the root README is the first thing a contributor reads, and it states the
opposite of what the package does.
Fix: reword to "Default semantic theme CSS (shipped as a copied asset) **and** the
`@cdevhub/ngx-tw/theme` runtime theming entry point." Docs only.

### F9 Nothing guards the hand-duplicated dark blocks against drift
Severity: LOW
Anchor: projects/ngx-tw/theme/_dark.css:11
Register: not in register
Confidence: [measured]
What: `_dark.css` deliberately duplicates 195 declarations between its `[data-theme="dark"]`
block and its `@media (prefers-color-scheme: dark)` block, with a comment instructing
maintainers to "keep the two blocks in lock-step" and a second reminder at `:290-293`
spelling out the failure mode. I measured them: **currently byte-identical**. The finding is
not that they have drifted — it is that if one ever does, the symptom is that a user on
system-dark and a user who explicitly chose dark see *different colours for one token*, with
no test, lint rule or build step that would notice.
Why it matters: this is the exact shape the repo already solved elsewhere (`A11Y_BACKLOG`
fails on a stale entry; `app.routes.spec.ts` fails on a route missing from
`e2e/support/routes.ts`). The invariant is documented in a comment, which is the weakest
possible enforcement for a 195-line hand-copy.
Fix: a ~15-line check in `npm run verify:package` (or a standalone
`scripts/verify-theme-parity.mjs` wired into `lint`) that extracts both blocks' `--name:
value;` declarations and fails on any difference; extend it to assert the three schemes'
**key sets** match, which is the F1-adjacent invariant nobody is watching either. Build
tooling only; no library change.

### F10 `duration-300` in `flip-card` is outside the codified transition scale
Severity: LOW
Anchor: projects/ngx-tw/flip-card/flip-card.ts:36
Register: not in register
Confidence: [measured]
What: CLAUDE.md's Transitions table admits `duration-150`, `duration-200` and the
`duration-normal` alias. Library-wide counts: `duration-normal` ×70, `duration-200` ×13,
`duration-fast` ×2, `duration-150` ×1, and `duration-300` ×1 — the single outlier, on the 3D
card flip.
Why it matters: trivial in isolation, but it is the only value in the library that the
documented scale cannot express, so the next person either copies it or "fixes" it and
shortens a deliberate animation.
Fix: I believe the **spec** is the defect here, not the code — a 3D flip genuinely needs
longer than a colour transition, and the same file already carries the
`motion-reduce:transition-none` guard the rule requires. Add a `duration-300` row to the
Transitions table scoped to "3D / large-displacement transforms", or define a
`--duration-slow: 300ms` token in `_typography.css` next to `--duration-fast` /
`--duration-normal` and use `duration-slow`, which keeps it theme-overridable like its
siblings.

---

## Method notes (for reproducing the [measured] claims)

- Token definition sets: `grep -oE '^\s*--[a-z0-9-]+:'` over each scheme block's line range
  (`_dark.css` 13-274 and 276-520; `_high-contrast.css` 1-242; `_semantic.css` +
  `_typography.css` whole `@theme`), then `comm` the sorted sets pairwise.
- Value-level dark drift: same extraction including the value (`--name:[^;]*;`), sorted,
  `diff`ed.
- Dead / undefined token sweeps: two throwaway Node scripts walking
  `projects/ngx-tw`, `projects/demo`, `e2e` for `.ts`/`.html`/`.css`, matching
  `var(--tok)` plus `(<util-prefix>)(-side)?-<token-name>` with a `(?![a-z0-9-])` boundary so
  `primary-soft` does not swallow `primary-soft-hover`.
- Animation cross-check: grep every `animate.enter` / `animate.leave` site, resolve the four
  dynamic bindings to their computed class sets, intersect with `_base.css`'s `.class {
  animation: … }` rules in both directions.
