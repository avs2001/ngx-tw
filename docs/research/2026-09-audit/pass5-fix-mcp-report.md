# Pass 5 FIX report — MCP snippets, verifier diagnostics, root README (F6 / F7 / F8)

Owner scope: `projects/demo/src/app/routes/theme/**`, `scripts/verify-mcp-index.mjs`,
root `README.md`. Nothing else touched. No builds, no tests, no `verify:mcp-index` run.

---

## F6 (MEDIUM) — the MCP index served zero snippets for the runtime theming API

**Status: fixed. `theme` goes from 0 → 12 extractable snippets.**

The audit's diagnosis was correct: the route had zero `*Snippet` properties and zero
`<tw-code-block>` elements, so `extractSnippets` legitimately returned `[]`. The fix was
authoring, per the `demo-doc-page` skill.

### What was added

| id | lang | title (from the `<h2>`) | covers |
|---|---|---|---|
| `basicUsageSnippet` | ts | Basic Usage | `provideTheme()` in `app.config.ts` |
| `importSnippet` | ts | Import | the entry point's symbols |
| `stylesheetSnippet` | css | Import | `@import '@cdevhub/ngx-tw/theme/index.css'` |
| `switchingThemesTsSnippet` | ts | Switching Themes | `inject(ThemeService)` + `TW_THEMES` |
| `switchingThemesHtmlSnippet` | html | Switching Themes | `setTheme()` / `cycleTheme()` wiring |
| `scopedSubtreesSnippet` | html | Scoped Subtrees | `[twTheme]` subtree scoping |
| `readingThemeStateTsSnippet` | ts | Reading Theme State | `computed()` off `isDark()` |
| `readingThemeStateHtmlSnippet` | html | Reading Theme State | reading `resolvedTheme()` in a template |
| `providerConfigurationSnippet` | ts | Provider Configuration | partial `TwThemeConfig` |
| `initialFlashHtmlSnippet` | html | Preventing the Initial Flash | inline `<head>` bootstrap script |
| `initialFlashTsSnippet` | ts | Preventing the Initial Flash | `TW_THEME_BOOTSTRAP_SCRIPT` |
| `typesSnippet` | ts | Types | all exported types + consts |

All four minimum-coverage items from the prompt are covered (`provideTheme` registration,
`ThemeService` injection + `setTheme()`, `[twTheme]` scoping, reading the current theme).

### Page work (demo-doc-page skill)

- **Shell** migrated from the legacy hand-rolled `<div>` header + `<nav>` to the canonical
  `tw-item` (`size="lg"`, leading-aligned) + `twTabNav` form. Same icon, rewired through
  `twItemLeading`, `aria-hidden="true"` added.
- **Overview** restructured to the four required sections in order (Description, Basic Usage,
  Import, Key Features). Raw `<pre>` blocks replaced by `tw-code-block`.
- **Examples** now: Switching Themes → Semantic Tokens → Scoped Subtrees → Reading Theme
  State → Provider Configuration → Preventing the Initial Flash. Every section except the
  frozen swatch grid has an intro paragraph, a live demo surface, and a paired snippet.
- **API** gained `provideTheme`, `THEME_CONFIG` and `TW_THEME_BOOTSTRAP_SCRIPT` sections,
  plus the missing `state()` signal and `applyToElement` method rows; Types section is now a
  `tw-code-block`.
- Raw `text-white` replaced with `text-on-primary` / `text-on-success` / `text-on-error` in
  the sections that were rewritten.

### Verification (reading + local harnesses, no build)

1. `extractSnippets('projects/demo/src/app/routes/theme')` run directly — returns **12**
   snippets with the ids, languages and `<h2>`-derived titles in the table above. This is the
   non-vacuity check: against the pre-change files the same call returns `[]`.
2. A standalone replica of the verifier's **check 3** (Angular `parseTemplate` + the
   binding-allowlist walk, seeded from the current `dist/ngx-tw/index.json` symbol tables)
   and **check 4** reports clean across all 12. The four `html` snippets parse as pure
   templates — **no new "not parseable as a pure template" warning**, which matters because
   such a warning would undercut F7.
3. All four route templates parsed with `parseTemplate` — 0 errors (guards the brace/ICU trap).
4. `npx tsc --noEmit -p projects/demo/tsconfig.app.json` — 13 errors, **all pre-existing**
   variant-name mismatches in other routes caused by a stale `dist/ngx-tw`; **zero** in
   `routes/theme/`.
5. `npx eslint projects/demo/src/app/routes/theme scripts/verify-mcp-index.mjs` — clean.

### Coordination with the theme-CSS agent

Their work landed while I was writing, and I re-read it and aligned to what shipped rather
than to the pre-fix behaviour:

- `provideTheme` now carries `provideEnvironmentInitializer` → the Overview says registering
  the provider is the whole setup and that nothing needs to inject the service.
- `_light.css` exists → the Scoped Subtrees prose describes `[twTheme]` as working in every
  direction, including a light pane inside a dark page.
- `systemTheme` now also observes `prefers-contrast: more` → Description, Key Features and
  the API `systemTheme()` row say so.
- Storage is written only by `setTheme` / `cycleTheme` → Key Features says merely providing
  the service writes nothing.
- **`TW_THEME_BOOTSTRAP_SCRIPT` became visible mid-task** (exported from
  `theme/theme.bootstrap.ts` via `theme/index.ts`), so I named it rather than falling back to
  prose. **Please re-check this identifier at reconcile time** — it is referenced by name in
  `theme-overview` (Key Features + Basic Usage follow-up), `theme-examples`
  (`initialFlashTsSnippet` + section prose) and `theme-api` (its own section + `typesSnippet`).
  Nothing in `verify:mcp-index` validates a TS identifier, so a rename here would go silent.
- `ThemeDirective` deliberately writes the literal `data-theme` and ignores a renamed
  `attribute`. My first draft of the Provider Configuration prose recommended overriding
  `attribute` "when an existing stylesheet already owns data-theme" — that would have been
  actively wrong advice, since the shipped stylesheet would then stop reacting. Corrected in
  both the prose and `providerConfigurationSnippet`.

---

## The audit was wrong about check 4 — and it would have broken the release gate

`pass5-theme.md` F6 states: *"check 4 (`verify-mcp-index.mjs:358`) already whitelists
`theme/*.css` import paths, so the CSS snippet will validate."* **This is false.**

Check 4's scanner was `/@cdevhub\/ngx-tw(\/[\w/-]+)?/g`. `[\w/-]` excludes `.`, so
`@cdevhub/ngx-tw/theme/index.css` captured as `theme/index` — which fails
`path.endsWith('.css')`, so the carve-out never fired, then fails both entry-point lookups,
so it calls `fail()` and the run exits 1. The carve-out at :358 was **dead code that has
never been exercised** — zero snippets in the current index contain a dotted `ngx-tw` path,
because until now the theme page's `@import` lived in a raw `<pre>` the extractor ignores.

Landing `stylesheetSnippet` without fixing this would have turned an advisory WARN into a
**hard release-gate failure** on the library's own documented stylesheet import.

**Fix** (in `scripts/verify-mcp-index.mjs`, which I own): the tail is opt-in —
`/@cdevhub\/ngx-tw(\/[\w/-]+(?:\.css)?)?/g` — so `.` is only consumed when a real `.css`
suffix follows. Verified against six shapes:

| input | captured path |
|---|---|
| `@import '@cdevhub/ngx-tw/theme/index.css'` | `theme/index.css` → carve-out fires |
| `@cdevhub/ngx-tw/theme` | `theme` |
| prose ending `…see @cdevhub/ngx-tw/button.` | `button` (trailing period not swallowed) |
| `@cdevhub/ngx-tw` | `undefined` (root barrel) |
| `@cdevhub/ngx-tw/calendar/luxon` | `calendar/luxon` |
| `@cdevhub/ngx-tw/theme/_semantic.css` | `theme/_semantic.css` |

**Non-vacuity, measured:** re-running my checks-3+4 replica with the *old* regex produces
`FAIL theme › stylesheetSnippet: "@cdevhub/ngx-tw/theme/index" is not an entry point`; with
the fix, clean. The fix is load-bearing, not cosmetic.

---

## F7 (LOW) — check 5 reported a wrong cause

**Status: confirmed and fixed.** Anchor verified: the hard-coded message is at
`verify-mcp-index.mjs:369-370` (audit said `:370` — correct, the string spans two lines).

Diagnosis confirmed independently: `extractSnippets` returns `[]` both when the route
directory is absent *and* when it exists but authors samples some other way, and the warning
text asserted the first cause unconditionally.

Fix: check 5 now computes `join(repoRoot, 'projects/demo/src/app/routes', entry.name)` locally
(`repoRoot`, `join` and `existsSync` were already in scope) and branches:

- directory absent → `missing or renamed demo page at …` (unchanged wording)
- directory present → ``demo page … exists but declares no `{section}Snippet` properties bound
  to a `<tw-code-block>` via `[code]="…"` ``

I used the local-computation option rather than the "cleaner" one the audit preferred
(`hasRouteDir` carried on each index entry from `build-mcp-index.mjs:70-84`) because
`build-mcp-index.mjs` is **not in my ownership list**. A comment on the new block explains the
duplication and points at `build-mcp-index.mjs`'s `demoRoutes`.

**"Report which" — the answer the prompt asked for:**

- **`theme` stops warning entirely.** It now has 12 snippets, so check 5 never reaches it.
- **`core` still warns, and now says something true.** It is a types-only entry point with no
  demo route (`projects/demo/src/app/routes/core` does not exist), so it takes the
  missing-directory branch. That is accurate; I deliberately did **not** add a third
  "types-only, will never have a demo page" branch — two branches is the fix the audit asked
  for and it is correct in both cases. Flagging `core` as an observation only: if the team
  wants that warning gone, the answer is an opt-out list in the meta layer, not more branches
  in the verifier.

These two are the only zero-snippet entry points in the current index (measured against
`dist/ngx-tw/index.json`: 56 entry points, `["core","theme"]`). No entry point in the index
has a nested (`a/b`) name, so the branch cannot mis-report on a sub-entry-point.

`node --check scripts/verify-mcp-index.mjs` passes; eslint clean.

---

## F8 (LOW) — root README theme description

**Status: fixed.** `README.md:19` said the theme "ships as an asset, not an entry point". It is
both. Reworded to name both consumption paths explicitly:
`@cdevhub/ngx-tw/theme/index.css` (copied CSS asset) **and** `@cdevhub/ngx-tw/theme` (runtime
API: `provideTheme`, `ThemeService`, `ThemeDirective`, `THEME_CONFIG`).

### Import-path audit of the root README

Every path the root README tells a consumer to write, checked against `dist/ngx-tw`
(current as of pass start):

| path in README | resolves? | evidence |
|---|---|---|
| `@cdevhub/ngx-tw/button` (line 18) | yes | `exports["./button"]` → fesm + types |
| `@cdevhub/ngx-tw/theme` (new, line 19) | yes | `exports["./theme"]` → fesm + types |
| `@cdevhub/ngx-tw/theme/index.css` (new, line 19) | yes | `exports["./theme/*.css"]`, file present in `dist/ngx-tw/theme/` |
| `@cdevhub/ngx-tw-mcp` (lines 22, 38) | yes | `projects/ngx-tw-mcp/` exists; npx package name |

Every repo path it links (`projects/ngx-tw/README.md`, `docs/mcp-server-architecture.md`,
`.claude/CLAUDE.md`, `CHANGELOG.md`, `LICENSE`, `e2e/`, `docs/`, `projects/ngx-tw-mcp/`)
exists. Every script it names exists in `package.json`.

### Two further staleness items found and fixed (same class of defect, docs only)

1. **`e2e/` described as "scaffold — specs to be filled in".** There are **74** spec files
   across `00-smoke`, `01-components`, `02-cross-cutting` and `04-visual`. Reworded.
2. **The release pre-flight list was incomplete.** README said `lint`, `build:lib`, `test:ci`,
   `pack:check`. `scripts/release.mjs:137-154` actually runs `lint`, `build:lib`,
   `verify:mcp-index`, `build:mcp`, `test:ci`, `pack:check`, `verify:package`. A contributor
   reading the short list would not know a broken MCP index blocks a release — which is
   exactly the guarantee F6/F7 exist to protect. Corrected.

### Flagged, not changed

- **`README.md:87` — "Vitest — unit test runner (Angular v21 default)"** vs `.claude/CLAUDE.md`
  — "default in Angular v22 via `@angular/build:unit-test`". `package.json` pins Angular `^22`.
  Which version made Vitest the default is a factual claim I cannot settle by reading this
  repo, and both readings are defensible (v21 introduced it; v22 is what ships here).
  **Ambiguous — left alone per the brief.**
- **`README.md:107` — `npm test` described as "Run unit tests (Vitest)".** True but thin:
  CLAUDE.md records that narrowing this script to the library alone once cost five components
  their entire e2e coverage, because the demo project holds the `app.routes.spec.ts` drift
  guard. Not wrong, so not changed; worth a one-line enrichment if someone else is in the file.
- **`projects/ngx-tw/README.md` — already fixed by the theme agent, no action needed.** The
  audit's sibling finding (the `(asset)` row) was corrected in their pass; the row is now at
  `:393` and reads *"Default semantic theme stylesheet — the same directory ships as a copied
  CSS asset **and** as the TypeScript entry point above"*, with `:392` listing
  `@cdevhub/ngx-tw/theme` including `TW_THEME_BOOTSTRAP_SCRIPT`. Root and library READMEs now
  agree. I re-checked for any remaining `asset` staleness in that file: one occurrence, and it
  is the corrected one.
- **`projects/demo/src/app/routes/select/overview/select-overview.component.ts:158+`** links
  related components as `routerLink="/form-field"`, `"/input"`, `"/checkbox"`, but
  `app.routes.ts` registers them under `components/<slug>`. Those links look dead. Not my
  file and not in scope for this pass — reporting it as an observation.

---

## Chosen not to do, and why

- **No Vitest spec for any of the three findings.** F6 is demo-page authoring (the repo has no
  spec harness for demo route content — the only demo spec is the `app.routes.ts` ⇄
  `e2e/support/routes.ts` drift guard, and `services/theme` is already in `SERVICES`). F7 is a
  build script with no test harness. F8 is documentation. Writing a spec for any of them would
  produce a guard that cannot meaningfully fail, which the brief itself says is worse than
  none. In place of a spec, the F6 and check-4 fixes each have a **measured non-vacuity check**
  documented above (extractor returns `[]` before / 12 after; old regex FAILs / new regex
  clean).
- **No Playground section on the Examples page**, contrary to `demo-doc-page` § 5.9. `theme` is
  a service, not a component with inputs to combine; the page's interactive surface already
  exists as the Switching Themes control row, and a synthetic playground would add controls
  that do nothing. F6 explicitly scopes this task as "authoring, not refactoring". **Deviation
  noted, not hidden.**
- **The "Semantic Tokens" section's rendered content is frozen byte-for-byte.**
  `e2e/specs/04-visual/canary.spec.ts:257-265` screenshots that whole `<section>` element
  (located by its `<h2>`) against two committed baselines
  (`theme-swatches-{light,dark}.png`). An intro paragraph or a code block inside it — which the
  skill would otherwise require — would diff the baseline and fail e2e. Only its indentation
  changed; I verified the section is identical after whitespace normalisation, and Angular
  strips template whitespace by default, so **no baseline update should be needed.** This was
  deliberate; if you would rather the section conform to the skill, it needs
  `npm run e2e:update-snapshots` in the same change.
- **Did not modify `scripts/build-mcp-index.mjs`** (not in my ownership list), which is why F7
  duplicates the demo-routes path constant rather than threading `hasRouteDir` through the
  index. Noted in a comment at the site.
- **Did not run `verify:mcp-index`, `build:lib`, or any test**, per the brief.

---

## Files touched

- `projects/demo/src/app/routes/theme/theme-page.component.ts`
- `projects/demo/src/app/routes/theme/overview/theme-overview.component.ts`
- `projects/demo/src/app/routes/theme/examples/theme-examples.component.ts`
- `projects/demo/src/app/routes/theme/api/theme-api.component.ts`
- `scripts/verify-mcp-index.mjs`
- `README.md`

`projects/demo/src/app/routes/theme/theme.routes.ts` was already in canonical form and is
unchanged.

## Residual risk

1. **`TW_THEME_BOOTSTRAP_SCRIPT` — low risk, corroborated three ways.** It is referenced by
   name in three of my files, and nothing mechanical validates a TS identifier inside a snippet
   string. But it is not a mid-edit guess: it is exported from `theme/index.ts`, defined in
   `theme/theme.bootstrap.ts`, load-bearing in `theme.config.ts`'s JSDoc, and listed by the
   theme agent in `projects/ngx-tw/README.md:392`. A final grep at reconcile time is enough.
2. **Checks 3 and 4 were validated against a replica seeded from the *stale* `dist` index.**
   The argument that the verdict survives a rebuild is specific, not general — "allowlists only
   widen" is *not* true of check 3 as a whole, because `elementSymbols` drives a failing branch
   (`tag.startsWith('tw-') && !elementSymbols.has(tag)`). What makes the verdict hold here:
   none of my four `html` snippets contains a `tw-` element tag at all, and the only library
   binding any of them uses is `[twTheme]`, which resolves through `attributeSymbols` from
   `ThemeDirective`'s `selector: '[twTheme]'` — read directly from the theme agent's **final**
   `theme.directive.ts`, after their edit landed. Check 4 depends only on the entry-point name
   set, and `theme` is unchanged there.
3. **Checks 0 (`tsc -p tsconfig.meta.json`) and 1 (meta coverage) were not exercised by me at
   all** — they cover the library's guidance layer, which is outside my ownership.
