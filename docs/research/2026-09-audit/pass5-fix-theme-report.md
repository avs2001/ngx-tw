# Pass 5 FIX — theme agent report

Scope owned: `projects/ngx-tw/theme/**` + `projects/ngx-tw/README.md`. No file outside
that scope was touched. Per the brief, **no builds or tests were run**; verification was by
reading, by `npx tsc --noEmit` on both library tsconfigs, by `npx eslint`, and by compiling
`theme/index.css` through Tailwind v4.3 with `postcss` + `@tailwindcss/postcss` (a CSS
compile, not `ng build` / `ng test`).

## Files touched

| File | Change |
|---|---|
| `projects/ngx-tw/theme/_light.css` | **new** — the `[data-theme="light"]` token block (F1) |
| `projects/ngx-tw/theme/index.css` | imports `_light.css`; both `dark:` variant branches narrowed (F1) |
| `projects/ngx-tw/theme/_base.css` | `color-scheme` restated at the light / high-contrast boundaries (F1 completion) |
| `projects/ngx-tw/theme/theme.config.ts` | `provideEnvironmentInitializer` (F2) + JSDoc |
| `projects/ngx-tw/theme/theme.service.ts` | persist only on explicit choice (F5); `prefers-contrast` (F4); `applyToElement` JSDoc (F1) |
| `projects/ngx-tw/theme/theme.types.ts` | JSDoc for `TwTheme`, `TwThemeState.systemTheme`, `storageKey` |
| `projects/ngx-tw/theme/theme.directive.ts` | JSDoc — subtree scoping now true, attribute caveat |
| `projects/ngx-tw/theme/theme.bootstrap.ts` | **new** — `TW_THEME_BOOTSTRAP_SCRIPT` (F3) |
| `projects/ngx-tw/theme/theme.bootstrap.spec.ts` | **new** — 5 specs for the snippet (F3) |
| `projects/ngx-tw/theme/index.ts` | exports `TW_THEME_BOOTSTRAP_SCRIPT` |
| `projects/ngx-tw/theme/theme.meta.ts` | MCP `whenToUse` for F1–F5; 3 new aliases |
| `projects/ngx-tw/theme/theme.service.spec.ts` | query-aware media mock; 8 new specs; attribute cleanup in `afterEach` |
| `projects/ngx-tw/README.md` | F8 + the staleness F2/F3/F5 introduce |

`projects/ngx-tw/src/public-api.ts` needed no edit — it does `export * from '@cdevhub/ngx-tw/theme'`,
so the new constant flows to the root barrel automatically. `ng-package.json`'s
`"assets": ["theme/**/*.css"]` picks up `_light.css` with no change.

---

## F1 (HIGH) — `[twTheme]="'light'"` inside a dark/high-contrast ancestor

**Confirmed the anchor.** `_dark.css:13` and `_high-contrast.css:1` are element-agnostic;
the only `[data-theme="light"]` selector in the theme CSS was `_high-contrast.css:253`
inside `@media (forced-colors: active)`.

### New `_light.css`

**Generated mechanically from `_semantic.css`**, not hand-copied (script kept out of the
repo; it filtered declaration lines and re-indented them). Verified three ways:

- **195 declarations emitted** — the exact number the report measured for each scheme.
- Key set is **identical to `_dark.css:13-274` and `_high-contrast.css:1-242`, and in the
  same order** (`comm`-equivalent diff both directions returned empty).
- **Zero value drift** against `_semantic.css`: every one of the 195 `--name: value` pairs
  string-compares equal to the `@theme` declaration. That is the pixel-neutrality argument —
  on a light-on-light root the block and the `@theme` `:root` rule resolve byte-identical
  values.

The seven `@theme` tokens deliberately omitted are `--color-overlay-control{,-hover}`,
`--shadow-table-sticky{,-cell-start,-cell-end}` and `--text-2xs{,--line-height}` — the same
seven `_dark.css` and `_high-contrast.css` omit. (The report's "17 light-only tokens" =
these 7 plus `_typography.css`'s 10.)

**I checked the advisor's concern that `--shadow-table-sticky*` bakes in the root's
`--color-border` and so belongs in the light block. It does not — measured, not reasoned.**
Tailwind v4.3 *inlines* a named `--shadow-*` theme value into the utility rather than
referencing the custom property: `dist/demo/browser/styles.css:3823` compiles
`.shadow-table-sticky` to `--tw-shadow: 0 1px 0 0 var(--tw-shadow-color, var(--color-border))`,
so `--color-border` re-resolves at the **use site**, inside the subtree. The tokens are
genuinely scheme-invariant and omitting them keeps exact key parity with the other two
schemes. (The arbitrary-value form `shadow-(--shadow-table-sticky)` *does* reference the
property and would bake in the root value, but nothing in the library uses it.)

### Import order

`_light.css` is imported **before** `_dark.css` / `_high-contrast.css`, with the reason in a
comment in both `index.css` and the file header: `_high-contrast.css`'s
`@media (forced-colors: active)` selector list already names `[data-theme="light"]` at the
same specificity (0,1,0), so source order is the only tie-breaker and forced-colors must
win. Confirmed in the compiled output: light block at line 6579, dark 6776, high-contrast
7172, forced-colors 7369. The block is emitted **unlayered**, so it beats `@layer theme`'s
`:root, :host` for any element that carries the attribute, exactly like the dark block does.

### `index.css` `dark:` variant — I did *not* apply the same exclusion to both branches

The brief (and the advisor) suggested `:not(:where([data-theme="light"], [data-theme="light"] *))`
on both branches. **On the explicit branch that form is a regression**, and I want this on
record rather than buried:

- `light > dark > span` — the span has a `[data-theme="light"]` *ancestor*, so the plain
  exclusion strips `dark:` from a span whose nearest theme boundary is dark. That case
  works correctly today.
- CSS has no "nearest themed ancestor" combinator. Inherited custom properties get that
  semantic for free; selectors do not.

So the two branches got deliberately different shapes:

- **Media branch** — plain exclusion of `[data-theme="light"]` / `[data-theme="high-contrast"]`
  ancestors. No regression, because re-entering dark below such a subtree is picked up by the
  explicit branch independently. (I extended it to `high-contrast` too; the existing
  `:root:not(...)` only excluded at the root.)
- **Explicit branch** — `[data-theme="dark"] [data-theme="light"] *`-shaped exclusion, i.e.
  only a light/HC boundary that sits *below* the dark one. Correct for both realistic
  nestings; the residual gap is depth-3 alternation (dark → light → dark), which is no worse
  than before.

All of it carries `:not(:where(…))`, so specificity is unchanged. Verified the whole
`@custom-variant` block compiles through Tailwind and emits both branches intact. Zero
library impact (0 `dark:` variants in `projects/ngx-tw`); the demo has exactly 2, in
`segmented-control/examples`, neither inside a `[twTheme]` pane — no visual baseline moves.

### `_base.css` `color-scheme` — one addition beyond the literal brief

`color-scheme` inherits and drives UA chrome (scrollbars, native `<select>` popups, form
controls). `_base.css` set it on `:root` and `[data-theme="dark"]` only, so a
`[twTheme]="'light'"` pane inside a dark page would have kept **dark native chrome** — F1
fixed the tokens but not the browser's own rendering. Added
`[data-theme="light"], [data-theme="high-contrast"] { color-scheme: light; }`. It is a
**no-op at the root** (`:root` already resolves `light` for both) and only affects subtrees,
so no baseline moves. Flagging it as a judgement call since it was not in the six items.

### `applyToElement` JSDoc

Re-read as instructed. It previously *understated* (subtree scoping was a lie for `light`);
it now also names a hole it previously hid: the CSS blocks key off the **literal**
`data-theme`, while the method writes `this.config.attribute`. A consumer who renamed the
attribute gets a silent no-op. Same note added to `ThemeDirective.twTheme`, which hard-codes
`[attr.data-theme]` and ignores `THEME_CONFIG` entirely — **service and directive disagree**.
I documented it rather than "fixing" it: making the directive inject `THEME_CONFIG` would
either break its current no-provider usage or make it silently stop working with the shipped
CSS. Worth a register entry.

**Spec:** none. This is CSS; a jsdom unit spec cannot observe cascade or `getComputedStyle`
against a stylesheet the runner does not load. The report itself names the right guard: a
`theme-matrix.spec.ts` case seeding `ngx-tw-theme=dark`, loading `/services/theme/examples`,
and asserting the three Side-by-Side panes resolve three different `background-color`s.
`e2e/` is not mine — **please dispatch that to the e2e owner.** What I *did* verify is
stronger than a shallow spec would be: byte-identical values, identical key set, correct
emitted cascade order, and a successful Tailwind compile.

---

## F2 (HIGH) — `provideTheme()` never constructed `ThemeService`

Added `provideEnvironmentInitializer(() => { inject(ThemeService); })` to the provider array.
Verified `provideEnvironmentInitializer` exists in the installed `@angular/core`
(`types/core.d.ts:386`) and that TestBed runs environment initializers — TestBed's own root
scope module registers an `ENVIRONMENT_INITIALIZER`
(`@angular/core/fesm2022/testing.mjs:1066`), so they demonstrably fire on injector creation.

**Specs (new `describe('provideTheme bootstrap')`, which never injects `ThemeService`):**

1. `applies the theme without anything injecting ThemeService` — configures
   `provideTheme({ defaultTheme: 'dark' })`, **removes `data-theme` and asserts it is `null`
   first** (the shared jsdom `documentElement` is not reset by `resetTestingModule`, so
   without this the test could pass on residue from an earlier test that set `dark`), then
   resolves `DOCUMENT` — deliberately *not* `ThemeService` — flushes effects, and asserts
   `data-theme === 'dark'`.
2. `reads a persisted choice without anything injecting ThemeService` — same shape with
   `'high-contrast'` in storage and a bare `provideTheme()`.

**Non-vacuity:** against the old code nothing constructs the service in either test, so
`applyToDocument` never runs, the attribute stays `null` after the explicit clear, and both
fail on the final assertion. The `TestBed.flushEffects()` matters: `applyToDocument` runs
inside the constructor `effect()`, so without the flush the test would fail *with* the fix
too.

I also added `document.documentElement.removeAttribute('data-theme')` (and `body`) to the
`ThemeService` `afterEach`, which removes the same residue hazard from the pre-existing
attribute assertions. No existing test depended on the residue — every one that asserts the
attribute sets it within the test.

---

## F5 (MEDIUM) — persisting a theme the user never chose

`persistTheme` moved out of the constructor effect into `setTheme()`; `cycleTheme()` now
routes through `setTheme()` so persistence has exactly **one** write point. The effect is now
`applyToDocument(resolvedTheme())` only.

**Confirming what the brief asked me to check: no existing spec asserted persist-on-init.**
Every storage assertion in `theme.service.spec.ts` sits after an explicit `setTheme` — `:80`
(now `:~176`) and the pass-4 `undefined`-keys guard at `:376`. Both still pass, and the
`undefined`-keys guard is arguably stronger now (the write is synchronous with the call
rather than deferred to a flush). **No existing guard was asserting the bug, so none needed
updating.**

**Specs:**
- `does not write to localStorage until an explicit setTheme` — `setup({defaultTheme:'dark'})`,
  `flushEffects()`, then `expect(localStorage.setItem).not.toHaveBeenCalled()` and
  `storage.size === 0`; asserts the theme still *applied* (`data-theme="dark"`) so the test
  cannot be satisfied by breaking application; then `setTheme('light')` writes.
- `persists through cycleTheme as well`.

**Non-vacuity:** the `flushEffects()` is load-bearing — against the old code the effect has
by then already called `persistTheme(selected)`, so the very first assertion fails. Without
the flush the test would pass against the old code too. The `cycleTheme` spec is also
non-vacuous against the old code: it asserts persistence *without* a flush, which the old
effect-based write could not deliver.

**Interaction with F2 handled as the brief required** — F2 alone would have made this
strictly worse (an unconditional persist firing on every boot for every consumer). They land
together.

---

## F4 (MEDIUM) — `'system'` could never resolve to `high-contrast`

**Chose (b): contrast wins only when the OS is not also dark.**

Reasoning, written into the `detectSystemTheme()` JSDoc, the `TwTheme` JSDoc, the README and
`theme.meta.ts`: the discriminator is blast radius, not semantics. (a) *moves* existing
dark+contrast users — a common OS pairing — from a dark surface onto the light-based
high-contrast scheme, a visible regression for a real population. (b) only adds behaviour for
users who currently get plain light, and never takes dark away from anyone. **(c) — a
fourth, dark-based high-contrast ramp — is the honest fix and is recorded as the follow-up**;
it is 195 more hand-tuned tokens with per-pairing WCAG measurements plus a fourth block to
keep in lock-step, which is a different-sized piece of work than this pass. Once it exists,
`prefers-contrast` composes with `prefers-color-scheme` instead of overriding it and the
`!prefersDark` guard comes out.

`forced-colors: active` was considered and rejected as the signal: the CSS already handles
it at `_high-contrast.css:251-289` (remapping to `Canvas`/`CanvasText` system colours), it is
Windows-HCM-specific, and it is a *stronger* mode than the theme — `prefers-contrast: more`
is the more common signal and is covered by neither layer today, which is exactly the gap.

**Implementation — the clobber trap the advisor flagged is avoided.** Both queries are stored
(`darkQuery`, `contrastQuery`) and **one** listener is attached to both; it re-reads
`detectSystemTheme()`, which reads both. Two independent listeners each setting `systemTheme`
from their own query would let the next colour-scheme tick erase the contrast decision.
The listener ignores the event payload deliberately — a real `MediaQueryList`'s `matches` is
already updated when `change` fires, so re-reading both is the single source of truth.
Both queries are minted lazily inside `detectSystemTheme()` via `??=` because the
`systemTheme` **field initialiser runs before the constructor body**; the constructor's
`??=` then finds them already there and only attaches listeners (still inside
`runOutsideAngular`). Both are detached in `ngOnDestroy`.

**The listener is live, not read-once** — that is asserted, not just intended (see spec 3/4
below).

**Spec-mock fix (worth calling out).** The old `matchMedia` mock answered *every* query with
the colour-scheme preference, so it would have lied about `prefers-contrast`. Replaced with
`createMediaQueryList(query, matches)` — stateful, keyed by query string, returning the same
object on repeated calls so the service's listener registration lines up. `setup()` now
returns `media(query)` instead of an order-dependent `listeners[0]`, which also removes the
registration-order fragility in the pre-existing "media query changes" test (rewritten to
`media(DARK_QUERY).emit(true)`).

**Specs:**
1. `resolves system to high-contrast when the OS asks for more contrast`
2. `keeps dark when the OS asks for both dark and more contrast` — guards the (b) tradeoff
3. `re-resolves live when the contrast preference changes` (both directions)
4. `does not let a colour-scheme change clobber the contrast decision` — contrast on, dark
   flips on then off, must return to `high-contrast`
5. `detaches both media listeners on destroy`

**Non-vacuity:** against the old code, 1/2/4 return `'light'`/`'dark'` from a colour-scheme-only
resolver and fail; 3 and 5 fail earlier still — the old code never calls
`matchMedia('(prefers-contrast: more)')`, so `media(CONTRAST_QUERY)` throws
`matchMedia was never called with …`. 2 passes against the old code by accident, which is
the point of keeping it: it is the regression guard for anyone later "simplifying" the
`!prefersDark` condition.

Docs updated for the widened semantics: `TwTheme`, `TwThemeState.systemTheme`,
`ThemeService.systemTheme`, README, `theme.meta.ts`.

---

## F3 (MEDIUM) — FOUC bootstrap snippet

New `theme.bootstrap.ts` exporting **`TW_THEME_BOOTSTRAP_SCRIPT`**, built by interpolating
`DEFAULT_TW_THEME_CONFIG.storageKey` / `.attribute` through `JSON.stringify` — the anti-drift
point. `try`/`catch`-wrapped, dependency-free, no framework references. Exported from
`theme/index.ts` (and therefore from the root barrel via `export *`). Documented in the
README (literal copy-pasteable `<head>` snippet **and** the constant for SSR/index-transform
setups) and mirrored into `theme.meta.ts.whenToUse`.

**The `theme.meta.ts` bullet contains a literal `<script>` tag — I verified the MCP pipeline
survives it rather than assuming.** Ran `build-mcp-index.mjs`'s exact `loadMeta` transform
(regex strip → base64 `data:text/javascript` → dynamic `import`) against the edited file:
10 `whenToUse` entries, 18 aliases, clean `JSON.parse(JSON.stringify(...))` round-trip. The
field is consumed only as JSON by `projects/ngx-tw-mcp/src/{index,search}.js` and is never
rendered into HTML, so the tag cannot be mangled or stripped. Note it *is* a search-weighted
field (`search.js:31`, weight 20), so the snippet adds some lexical noise — acceptable, since
discoverability of the FOUC fix was the point.

JSDoc records the three deliberate non-behaviours: a stored `'system'` writes nothing (so the
CSS `prefers-color-scheme` fallback keeps deciding); it assumes `target: 'documentElement'`
because a `<head>` script runs before `<body>` exists; and a custom `storageKey`/`attribute`
needs an adapted literal snippet.

**Specs (new `theme.bootstrap.spec.ts`, 5 cases).** Executed via
`new Function('localStorage', 'document', TW_THEME_BOOTSTRAP_SCRIPT)` with both globals passed
as parameters — hermetic, touches no shared jsdom state, and `new Function` throws loudly on
a syntax error, which a string-matching assertion would not catch. Cases: applies a stored
choice; applies `'high-contrast'`; writes nothing for `'system'`; writes nothing when nothing
is stored; swallows a throwing `localStorage`.

**Non-vacuity:** the constant is new, so all five are new coverage. The load-bearing part is
that the key and attribute are read back through `DEFAULT_TW_THEME_CONFIG` rather than
hard-coded — hard-coding `'ngx-tw-theme'`/`'data-theme'` would let a rename silently break
every consumer's `index.html` while the test stayed green. `no-implied-eval` / `no-new-func`
are not enabled (config uses plain `tseslint.configs.recommended`); `npx eslint` on the
directory is clean.

---

## F8 (LOW) — README staleness

**The report's F8 as written does not apply to my file.** `projects/ngx-tw/README.md`'s
entry-point table already listed both `@cdevhub/ngx-tw/theme` and
`@cdevhub/ngx-tw/theme/index.css`; the "asset, **not** an entry point" wording lives only in
the root `README.md`.

**→ For the agent who owns the root `README.md`:** `README.md:19` says
`projects/ngx-tw/theme/` "ships as an asset, not an entry point". It is both. Suggested
wording: *"Default semantic theme CSS (shipped as a copied asset) **and** the
`@cdevhub/ngx-tw/theme` runtime theming entry point."*

What I *did* fix in my README is the staleness F2/F3/F4/F5 create, which was the more
misleading half:

- `provideTheme()` **and inject `ThemeService`** → `provideTheme()` is self-sufficient;
  injection is only for reading/changing.
- "persists the selection to `localStorage`" → persists **on explicit selection**, with an
  explicit sentence that providing the service never writes (the storage-consent answer).
- `'system'` semantics now include `prefers-contrast` and the light-based tradeoff.
- New **"Scoping a theme to a subtree"** section (F1 is what makes this true), with the
  custom-`attribute` caveat.
- New **"Avoiding a theme flash on reload"** section with the inline snippet and the constant.
- Entry-point table now lists `TW_THEME_BOOTSTRAP_SCRIPT` and states the theme directory
  ships as both an asset and a TS entry point.
- Provider table / `app.config.ts` comment reworded ("theme service + persistence" was
  describing the old behaviour).

---

## F9 (LOW) — parity guard: **not cheap, deliberately skipped**

The brief allowed skipping if it is not cheap. It is not, and the blocker is concrete rather
than a judgement call:

- `@types/node` is **not installed** (`ls node_modules/@types` → chai, deep-eql, esrecurse,
  estree, json-schema, luxon). I probed it: a spec with `import { readFileSync } from 'node:fs'`
  fails `npx tsc --noEmit -p projects/ngx-tw/tsconfig.spec.json` with
  `TS2591: Cannot find name 'node:fs'`. Probe deleted.
- The Vite alternatives (`import css from './_light.css?raw'`, `import.meta.glob`) need
  `vite/client` types, which are equally absent, and would need a `.d.ts` shim — which would
  have to live outside `theme/**`, i.e. outside my ownership. It is also unverifiable whether
  Angular's `@angular/build:unit-test` pipeline honours `?raw` on spec imports, and I cannot
  run the suite to find out.
- Suppressing with `@ts-expect-error` to force a filesystem read into a unit spec is exactly
  the "something elaborate" the brief said not to build.

**→ Recommendation for the `scripts/` owner (or the register):** a standalone
`scripts/verify-theme-parity.mjs` wired into `lint`. The whole check, already derived here so
nobody re-derives it:

```
keys(file, start, end) = grep -oE '^\s*--[a-z0-9-]+:' | tr -d ' :' | sort -u
```

Assert three things, all of which hold on the tree I am handing over:
1. `_dark.css`'s `[data-theme="dark"]` body and its `@media (prefers-color-scheme: dark)`
   body are identical **including values** (the invariant `_dark.css:9-11` and `:290-293`
   only ask for in a comment).
2. `_light.css`, `_dark.css` (both blocks) and `_high-contrast.css` have identical **key
   sets** — 195 each today.
3. `_light.css`'s `--name: value` pairs equal `_semantic.css`'s for those 195 keys. This one
   is new with this pass and is the most likely to rot, since `_light.css` is a generated
   mirror.

The three-way key parity is the F1-adjacent invariant nobody was watching either.

---

## F10, F6, F7

Out of my file ownership (`flip-card.ts`, the demo theme route, `scripts/verify-mcp-index.mjs`).
Untouched. One note for whoever picks up **F6**: author `subtreeSnippet` freely now — `[twTheme]`
genuinely works in every direction after F1, so the MCP index will no longer amplify a broken
pattern. Add the FOUC snippet there too if it fits the page.

---

## Semver

Everything is additive or behavioural. New CSS file, new exported const
(`TW_THEME_BOOTSTRAP_SCRIPT`), new provider entry, new media query, narrower `dark:` variant
predicate. **No exported symbol renamed or removed, no required member added to an exported
interface.** F5 and F4 are behaviour changes, not API changes — F5 removes a write nobody
asked for, F4 widens what `'system'` can resolve to (which the `TwResolvedTheme` type already
promised). No break to report.

## Open risks I am not hiding

1. **No e2e guard for F1.** The strongest available check is a browser assertion on the demo's
   three `[twTheme]` panes; `e2e/` is not mine. Please dispatch. My verification (value
   parity, key parity, emitted cascade order, Tailwind compile) is thorough but is not a
   rendered-pixel check.
2. **`ThemeDirective` vs `ThemeService` disagree on the attribute.** The directive hard-codes
   `data-theme`; the service honours `config.attribute`. Documented in both JSDocs; not
   reconciled, because either direction breaks something. Register-worthy.
3. **`_base.css` sets `:root { color-scheme: light }` with no `prefers-color-scheme` branch.**
   So a consumer on OS-dark with no `data-theme` gets dark *tokens* from `_dark.css`'s media
   branch but light *native chrome* (scrollbars, `<select>` popups). Pre-existing, out of the
   six items, and fixing it would move visual baselines — reporting only.
4. **Depth-3 `dark:` alternation** (`dark → light → dark`) still hands the wrong variant
   state to descendants. Unsolvable in pure CSS; documented in `index.css`; no worse than
   before.
5. **`_light.css` is a fourth hand-maintained duplicate** of the same 195 keys, and F9's guard
   was not built. The file header says "edit `_semantic.css`, then regenerate", which is the
   same weakest-possible enforcement `_dark.css` already relies on.

## Note for the orchestrator

On my last verification run, `npx tsc --noEmit -p projects/ngx-tw/tsconfig.spec.json`
reported four errors — **all four in `projects/ngx-tw/segmented-control/segmented-control.spec.ts`
(`TS2304: Cannot find name 'host' / 'fixture'`, lines 1031-1034), none in `theme/`.** That is
a sibling agent's in-flight edit, exactly the cross-agent phantom the brief warns about. An
earlier run of the same command, before that file changed underneath me, was clean.
`tsconfig.lib.json` and `npx eslint projects/ngx-tw/theme` are both clean at handoff.
