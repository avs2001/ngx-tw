# ngx-tw — production-readiness audit

**Date:** 2026-07-22 · **Repo state:** branch `chore/angular-22` @ b616de9 · **npm latest:** `@cdevhub/ngx-tw@0.2.1`
**Target:** production Angular 22 + Tailwind v4 app, installed from public npm.

---

> **Status update — B1, B2 and B3 are fixed on `chore/angular-22`.** See
> [Resolution](#resolution) at the end. The blocker write-ups below are kept as
> the record of what was wrong and how it was proven, because the failure mode
> (a packaging bug invisible to every in-repo gate) is the reusable lesson.
> Component-layer findings (H1–H8 and below) are **not** addressed.

## Verdict

**The code is production-grade. The package is not — yet.**

Consuming `0.2.1` from npm today fails at install and again at styling, for reasons that have nothing to do with component quality. Two packaging blockers, both verified empirically against a real install of the packed tarball, plus an unreleased peer bump. All three are shallow fixes (hours, not weeks).

**Recommendation:** block the next release on B1–B3, cut `0.3.0`, then adopt. The component layer is genuinely ready and better engineered than most 1.0 libraries — the gap is entirely in the last mile between `dist/` and a consumer's `node_modules`.

**Confidence gradient.** The three blockers were **empirically reproduced** here: packed tarball, real install, real Tailwind compile, fix verified. The component findings (H1–H8 and the mediums) come from **focused static review** — file-anchored and cross-checked against CDK source where behavior depended on it, but not each individually reproduced at runtime. Treat the blockers as facts and the component findings as high-confidence leads; the two with the largest blast radius (`table` identity, date/time validity) carry explicit "verify against your own app" advice below.

---

## Objective gates — green except lint

| Gate | Result |
|---|---|
| `npm run build:lib` | pass |
| `npm run test:ci` | **2898 passed**, 4 skipped, 71 files |
| `npm run e2e:fast` | **818 passed**, 0 failed |
| `npm run e2e:a11y` (axe) | **354 passed**, 24 skipped |
| `npm run lint` | **exit 1** — 3 errors, 70 warnings, all in `.spec.ts`/e2e files (type-import style, `expect-expect`). Zero in shipped source. |
| `TODO`/`FIXME`/`HACK` in shipped source | **0** |
| Secondary entry points registered in all 4 required places | **56/56** — no silently-skipped specs |

**Lint was red on this branch, and that was not cosmetic.** `eslint .` covers the e2e specs, and 3 errors meant the CI lint gate failed — blocking the very merge that fixes B3. *(Fixed — see [Resolution](#resolution); `eslint .` now exits 0.)*

Test quality was sampled, not just counted: specs assert real DOM, ARIA transitions and form-control round-trips, not mount success. The two components that self-provide `NG_VALIDATORS` both ship the guard spec that asserts an error code reaching a bound `FormControl` — the exact regression that bit this project during the v22 upgrade.

---

## BLOCKERS (release-level, not code-level)

### B1 — The documented theme import cannot resolve. Hard build failure.

README tells consumers to write `@import '@cdevhub/ngx-tw/theme/index.css'`. The generated `exports` map contains only `"."` and `"./theme"` (the latter pointing at the JS entry point). An `exports` field blocks every subpath not listed, so the CSS file — which *does* physically ship — is unreachable by its documented specifier.

Verified: packed `dist/`, installed the tarball into a scratch project, resolved with Tailwind's own resolver config (`enhanced-resolve`, `conditionNames: ['style']`):

```
@cdevhub/ngx-tw/theme/index.css => FAILED: "./theme/index.css" is not exported
    under the condition "style" (see exports field in package.json)
@cdevhub/ngx-tw/theme        => OK: fesm2022/cdevhub-ngx-tw-theme.mjs
```

**Cause:** `theme/` is both a shipped CSS asset *and* a TS secondary entry point. ng-packagr writes an exact `"./theme"` export that shadows the asset path.
**Fix:** add `"./theme/*.css"` to the exports map, or rename the asset directory so it stops colliding.

### B2 — Even with B1 bypassed, zero component styles are generated. Silent failure.

The shipped `theme/index.css:29` contains `@source "../src/**/*.ts"`. Relative to an installed package that is `node_modules/@cdevhub/ngx-tw/src/` — **a directory the tarball does not contain**. Tailwind does not error on a dead glob; it compiles cleanly and emits nothing for it. Tailwind v4 never auto-scans `node_modules`, so no library class string is ever seen.

Verified with a clean, uncontaminated compile (probe strings deliberately kept out of every scanned file — my first attempt self-contaminated via the runner script and I discarded it):

| Setup | Output | `shrink-0` | `rounded-lg` | `transition-colors` | Utility rules |
|---|---|---|---|---|---|
| As shipped | 70 KB | absent | absent | absent | 165 |
| `+ @source ".../fesm2022"` | 162 KB | present | present | present | **922** |

The consumer gets semantic tokens, base layer and the inline safelist — and **none of the ~90 KB of component utilities**. Components render structurally correct and visually naked. Nothing in the README or CHANGELOG mentions the `@source` line required to make this work.

**Why CI never caught it:** the demo app imports the theme by relative path and Tailwind auto-detects the raw library source in the monorepo — precisely what a consumer does not have. The hosted demo is structurally incapable of surfacing this bug class.

**Fix:** replace the dead glob with `@source "../fesm2022/**/*.mjs"` inside the shipped CSS.

### B3 — Published package declares Angular `^21` peers.

`@cdevhub/ngx-tw@0.2.1` peers: `@angular/core: ^21.2.0`, `@angular/cdk: ^21.0.0`. On Angular 22 you get `ERESOLVE` and must install `--legacy-peer-deps`, i.e. run unsupported-by-declaration. The `^22` bump exists only on the unmerged `chore/angular-22` branch. Last publish: 2026-05-28 (~8 weeks ago).

### The undocumented gap, end to end

| Documented | Actually required today |
|---|---|
| `npm install @cdevhub/ngx-tw …` | `+ --legacy-peer-deps` (B3) |
| `@import '@cdevhub/ngx-tw/theme/index.css'` | relative path into `node_modules` (B1) |
| — | `@source '../node_modules/@cdevhub/ngx-tw/fesm2022'` (B2) |
| — | `@import '@angular/cdk/overlay-prebuilt.css'` — needed by dialog/sheet/menu/popover/select/tooltip/combobox/date-picker; present in the demo, absent from the library README |

**Missing CI job that would have caught all of this:** install the packed tarball into a scratch app *outside* the repo and assert a known library utility appears in the compiled CSS. Without it, B1/B2 will regress.

---

## Component-layer findings

No blockers. Highlights by risk.

### Structural strengths (verified, not assumed)

- **No overlay leaks.** Every overlay component follows the correct CDK split — `detach()` on hide, `dispose()` exactly once from `DestroyRef.onDestroy`, per-open subscriptions bundled and rebuilt. Observers and listeners torn down.
- **Signal graph is clean.** ~25 `effect()` calls audited across the library; none mutates a signal it track-reads; no `untracked()` used as a fig leaf. The documented `paginator` exception is genuinely bounded and settles in one extra tick.
- **CVA layer is trustworthy.** All 16 form controls use a correct registration shape for the Angular 22 custom-control trap. `setDisabledState` present on all 14 CVA controls; touched/blur routed through `FocusMonitor` with real transition guards, not raw blur.
- **`OnPush` universal; every `@for` carries `track`; JSDoc complete on all public inputs/outputs.**
- **No XSS surface** — no `innerHTML`/`bypassSecurityTrust` anywhere; `icon` builds SVG via `createElementNS` from structured data.

### HIGH — fix or work around before shipping

| # | Component | Issue |
|---|---|---|
| H1 | `date-picker` | Parse failures and out-of-range dates **never reach the form**. The control keeps its previous value, `control.errors` stays `null`, `form.valid` stays `true` — only a red border. Submitting sends stale data undetectably. Material surfaces this as `matDatepickerParse`/`matDatepickerMin`. |
| H2 | `time-picker` | `minTime`/`maxTime` are decorative for validity. Value commits correctly but no error code accompanies it; a `form.invalid` submit guard lets it through. JSDoc implies form participation. |
| H3 | `table` | Selection/expansion keyed by **raw object identity**. Any immutable store, refetch, or `signal.set([...mapped])` silently empties the user's selection. `trackBy` is accepted but not consulted for identity. Most likely production surprise in the library. |
| H4 | `table` | Master "select all" is **inert for `Observable`/`DataSource` inputs** — renders and looks functional, does nothing. |
| H5 | `table` | Selection rendering is O(rows × selected) per change-detection cycle (`includes` scan per row). 500 rows × 200 selected ≈ 100k comparisons per cycle. |
| H6 | `popover`, `command-palette` | Reopening during the close animation is silently swallowed **and reverts the consumer's two-way-bound `true` back to `false`**. Reachable by double-tapping a trigger or a doubled ⌘K. Untested in both. |
| H7 | `stepper` | `role="tab"` headers have **no roving tabindex** — every step sits in the natural tab order. Arrow keys work; this is tab-order pollution + an ARIA-conformance flag. |
| H8 | `tabs`, `tab-nav` | Arrow-key orientation hardcoded `'ltr'`; no `Directionality` injected. **RTL locales get inverted arrows.** (`stepper` and `split` do handle RTL — inconsistent.) Not patchable from outside. |

### MEDIUM — know about these

- **`calendar` ships four public no-op methods** — `open()`, `close()`, `toggle()`, `revalidate()`. JSDoc describes them as working; `close()`'s doc has no caveat at all. `revalidate()`'s comment is also stale (claims the validator doesn't exist; it does).
- **`calendar` exports legacy and current types side by side** (`DateRange` *and* `TwDateRange`), marked in-source as slated for migration, with no published timeline. **Use inline mode only; don't build against the overlay API or legacy types.**
- **`radio` has no `compareWith`** — object-valued options break after `patchValue` from an API refetch (no radio renders selected). `select` and `combobox` both have it.
- **`table` has no windowing** — practical ceiling of low thousands of rows. Documented in source, not in the README or demo.
- **`table` allocates a fresh cell context per cell per CD cycle** — O(rows × cols) GC churn, always on.
- **Focus not restored** when `popover`/`command-palette` is destroyed while open (route change drops focus to `<body>`).
- **`split` leaves a global `body` class** if destroyed mid-drag — permanently disables text selection until reload.
- **Form-control IDs use module-scoped counters**, unlike the rest of the library which migrated to CDK `_IdGenerator`. Latent SSR concern (not reproduced).

### Test-coverage gaps worth knowing

- **12 of 54 components have no e2e coverage.** The risky ones: `combobox`, `file-upload`, `number-input`, `tags-input`, `textarea` (all form controls), `tree` (roving focus), `sheet` (modal overlay).
- Where e2e exists, **a11y tagging discipline is excellent** — all 42 component specs carry `@a11y`.
- `stepper` and `toast` specs have **zero keyboard coverage**; removing the `keydown` binding would fail no test. Other components set a much higher bar.
- No spec covers H3 or H4 — which is why both survived.

---

## Project & maintenance risk

- **Bus factor: 1.** 148 commits, one human contributor (+ dependabot/CI). Project is ~3.5 months old.
- **Cadence is uneven:** 27 commits in April, 114 in May, **0 in June**, 7 in July.
- **Two npm releases ever** (0.2.0, 0.2.1).
- **Calendar is mid-cutover** — CHANGELOG says phases 4 and 6–17 of ~19 are still pending on the library's largest surface (calendar bundle is 239 KB, ~5× the next largest; `date-picker`/`date-range-picker` depend on it). The referenced plan doc **no longer exists**, so the blast radius isn't assessable.
- **Release gate excludes e2e and a11y** — `release.mjs` checks only the `ci.yml` run (lint/unit/build/pack). A fully red a11y suite does not block a publish, for a library whose headline claim is "accessible by default."
- **No deprecation policy, support window, `CONTRIBUTING.md`, or `SECURITY.md`.** At 0.x, SemVer permits breaking changes in minors and the CHANGELOG explicitly reserves that right.
- **CHANGELOG hygiene is shaky** — 0.2.0 has no section (a path that already hard-fails the release-notes extractor), and `[Unreleased]` is positioned so it will be permanently orphaned below every future release.
- **Docs drift:** component count reported as 48 / 52 / 37 across README, gap audit, and CHANGELOG (actual: 54). Node engines in `package.json` exclude Node 23, 25, 22.12–22.22 and 24.0–24.14 — narrower than the README claims.

---

## If you adopt

**Prerequisites (blocking the next release):**
0. Fix the 3 lint errors — CI lint is red, which blocks the merge that does everything below.
1. Merge the v22 peer bump and cut a release.
2. Add `"./theme/*.css"` to the exports map.
3. Replace `@source "../src/**/*.ts"` with `@source "../fesm2022/**/*.mjs"` in the shipped theme CSS.
4. Add the tarball-install CI job, or 2 and 3 will regress.

**Then, before shipping:**
- Pin the exact version (`0.3.0`, not `^0.3.0`) — 0.x minors may break.
- Document the CDK overlay stylesheet import.
- Proof-of-concept `table` against your real data shape first, specifically whether your data source re-emits new row instances (H3).
- Don't rely on `date-picker`/`time-picker` min/max or parse errors for form validity (H1/H2) — validate on the `FormControl` yourself.
- Don't use object values with `radio`.
- Use `calendar` inline only.
- If you ship RTL, H8 is a hard gate.

**Bus factor 1 is the strategic risk, not the code.** The code quality is high enough that vendoring or forking would be tractable if the project stalls — but budget for that possibility rather than assuming upstream fixes.

---

## Resolution

All three blockers fixed on `chore/angular-22`. Component-layer findings (H1–H8,
mediums) are untouched and still stand.

### What changed

| Blocker | Fix |
|---|---|
| **B1** — theme subpath unreachable | `projects/ngx-tw/package.json` declares `"exports": { "./theme/*.css": "./theme/*.css" }`. ng-packagr seeds its generated map from the source `package.json`, so the entry survives the build and sits alongside the generated `"./theme"` JS export without shadowing it. |
| **B2** — dead `@source` glob | `projects/ngx-tw/theme/index.css` now uses `@source "../fesm2022/**/*.mjs"`, resolved relative to the file's location in the *published* package. Carries a comment explaining why the path is what it is and why a wrong value fails silently. |
| **B3** — Angular `^21` peers | Peer range was already `^22.0.0` on this branch; the stale claims in both READMEs (`^21.2.0`, Node `>=20.19.0`) were corrected, and the install docs now cover the CDK overlay stylesheet that overlay components require. |

### The guard that keeps them fixed

`npm run verify:package` (`scripts/verify-package.mjs`) reproduces the consumer
path end to end: packs `dist/ngx-tw`, installs the tarball into a scratch project
**outside the repo**, resolves the documented theme specifier under the `style`
condition, compiles it with PostCSS + Tailwind, and asserts real component
utilities land in the output. Zero new dependencies — resolution is checked by
spawning `node --conditions=style`.

It is wired into `ci.yml` (pack-check job), `release.yml` (pre-publish), and the
`release.mjs` local pre-flight.

**Negative-tested, not just green:** reverting each fix in `dist/` was confirmed
to fail the guard with a diagnosis naming the cause —

- dead glob → *"generated NO component utilities … Tailwind does not error on a dead glob"*
- removed export → *"ERR_PACKAGE_PATH_NOT_EXPORTED: Package subpath './theme/index.css' is not defined by exports"*

Two traps are baked into the script's design. Probe strings are kept out of every
file written into the scratch directory, because Tailwind's automatic source
detection will scan them and manufacture a false pass — that exact
self-contamination produced a false negative during this audit. And the app's own
utility (`p-4`) is asserted first, so a harness failure reports as a harness
failure rather than a packaging one.

### Release gate strengthened

`scripts/release.mjs` now requires **`e2e.yml`** green in addition to `ci.yml`.
`e2e.yml` owns the axe sweep, so previously a fully red accessibility suite could
not block a publish.

### Verification after the fixes

| Gate | Result |
|---|---|
| `npm run build:lib` | pass |
| `npm run verify:package` | pass — resolves, 159 KB compiled from a clean consumer install, component utilities present |
| `npm run test:ci` | 2898 passed, 4 skipped |
| `npm run e2e:fast` | **818 passed, 0 failed** — with CI's settings (`--workers=2 --retries=1`), no retries consumed; matches the pre-change baseline |
| `ng build demo --configuration production` | pass — type-checks real Lucide data against the adapter |
| `npm ci` (no flags) | **exit 0** — was `ERESOLVE` before the lucide swap |
| `npx eslint .` | **exit 0** — 0 errors (was 3), 70 warnings |

### Two things worth knowing

**Local e2e runs flake; CI's configuration does not.** Three of five full local
runs each failed exactly one test — `stepper.spec.ts:80`, then
`transfer.spec.ts:42`, then `radio.spec.ts:53` (a 30s timeout). Three different
tests, each passing repeatedly in isolation: the signature of resource
contention, not a regression.

The cause is configuration, not the specs. `playwright.config.ts:23-24` sets
`retries: 1` and `workers: 2` **only when `CI` is set**; locally Playwright
defaults to roughly half the CPU cores with zero retries, so any timing-
sensitive focus assertion loses its race under load. Re-running the identical
suite with CI's settings (`--workers=2 --retries=1`) gave **818 passed, exit 0,
with no test needing its retry**.

Practical guidance: a single odd failure from `npm run e2e:fast` locally is
probably contention. Reproduce with `--workers=2` before investigating.

**Piping to `tail` masks exit codes.** `npm run <x> | tail` reports *tail's*
status, not the command's. This hid the lint failure and the e2e failure during
this audit — both looked green. Check `${PIPESTATUS[0]}` or redirect to a file.

### Still outstanding

- **Publishing is a human decision** — merging `chore/angular-22` to `develop`
  and cutting `0.3.0` was deliberately not done here.
- **CHANGELOG has no `0.2.0` section**, which the release-notes extractor
  hard-fails on, and `[Unreleased]` sits below `## 0.2.1` so `release.mjs` will
  keep orphaning it under every future release.
- **All component-layer findings** (H1–H8 and the mediums) are unaddressed.

### Follow-up found while fixing (not part of B1–B3)

- **`lucide-angular@1.0.0` peers `@angular/common`/`@angular/core` at `13.x - 21.x`** — it excludes Angular 22. That is why installs in this repo need `--legacy-peer-deps`, and it is a real constraint for any consumer using `@cdevhub/ngx-tw/icon/lucide` on v22. `verify:package` cannot catch it (it installs with `--legacy-peer-deps` by design). Either wait for an upstream bump, document the override, or drop the optional lucide entry point from the v22 support claim.
- **`verify:package` also asserts all 59 secondary entry points are reachable through the `exports` map**, added because the B1 fix hand-authors an `exports` block that could otherwise suppress ng-packagr's generated entries — a regression nothing else would notice, since in-repo builds resolve components through the tsconfig path alias rather than `exports`. Negative-tested by deleting `./button` and `./table` from the built map.

### Follow-up resolved: `lucide-angular` / `--legacy-peer-deps`

The follow-up above turned out to be more serious than "a constraint for lucide
users": **`npm ci` failed outright**, and every job in `ci.yml`, `e2e.yml` and
`pages.yml` runs `npm ci`. The v22 branch could not install in CI at all.

```
npm error While resolving: lucide-angular@1.0.0
npm error peer @angular/common@"13.x - 21.x" from lucide-angular@1.0.0
npm error Conflicting peer dependency: @angular/common@21.2.18
```

`lucide-angular@1.0.0` is its latest release; there is no v22-compatible
version to upgrade to.

**Fix:** switched to **`lucide`**, the framework-agnostic package — no peer
dependencies, no dependencies, same PascalCase exports, same `[tag, attrs][]`
data. All 39 icon names the demo uses were verified present before the swap.
`npm ci` now exits 0 with no flags.

An npm `overrides` pin was rejected as the alternative: it would silence the
error while leaving a package built and tested against Angular ≤21 in the tree.
ngx-tw only ever consumed Lucide's icon *data*, never its Angular component, so
the coupling bought nothing.

**Second bug found while fixing it.** The published `.d.ts` contained
`import { LucideIconData } from 'lucide-angular'` — a package the library
declared in neither `dependencies` nor `peerDependencies`. Anyone type-checking
against `@cdevhub/ngx-tw/icon/lucide` silently needed a package no manifest
mentioned. The types are now declared structurally in the adapter and exported,
so the entry point has no type-level dependency on any Lucide package and works
with either.

**Caught by the demo build, not by tests.** The first structural type used
`Record<string, string | number>` for attributes; Lucide declares
`Record<string, string | number | undefined>`, so real icons failed to assign.
`npm run test:ci` passed clean — only `ng build demo` surfaced it, because the
demo is the only place real Lucide data meets the adapter's signature. Widened
and re-verified.

Docs, demo, and README examples now import from `lucide`. Component-count and
"Angular v21 idioms" drift in the library README was corrected at the same time
(48 → 54 components; v21 → v22).

---

## Git workflow & release-script audit (Angular 22 adaptation)

Scope: `.github/workflows/*.yml`, `scripts/release.mjs`, `scripts/publish.mjs`,
branch model. The honest headline: **almost nothing here was Angular-22-coupled.**
The version delta is one line (Node). The value was in what the audit turned up
around it.

### Fixed

| # | Finding | Fix |
|---|---|---|
| **W1** | **`release.yml` published to npm *before* validating the release notes.** The extraction step exits 1 when the CHANGELOG has no section for the tag — and `0.2.0` genuinely has none, so the path was already reachable. An npm publish cannot be undone (unpublish is a restricted 72h window and burns the version forever), so a missing heading meant "package public, workflow red, no GitHub Release". | Moved notes extraction **above** the publish step. Everything before `Publish to npm` is now a gate; nothing after it can un-publish. |
| **W2a** | **The placeholder written back after a release would have leaked into the *next* one** — `_Nothing yet._` is a truthy string, so it survived into the following release's notes *and* bypassed the "nothing to release" guard, allowing an empty release. Found by feeding the transform its own output; the single-pass simulation could not see it. | The placeholder is a named constant and is normalised to empty on read. Negative-tested: without the fix the placeholder leaks and the guard fails to abort; with it, neither happens. |
| **W2** | **`## [Unreleased]` was orphaned by design.** It sat *below* `## 0.2.1`, and `release.mjs` inserted each new section before the first `## ` heading — so hand-written notes sank one section deeper per release and were never published in any release body. | `[Unreleased]` moved to the top; `release.mjs` now folds its contents into the release being cut and resets it to `_Nothing yet._` — the Keep a Changelog flow the file's header already claimed. Verified end-to-end on a copy of the real file: the packaging notes land in `0.3.0`, `0.2.1` is preserved, link definitions stay at the footer. |
| **W3** | **The release CI gate could report "no run found" for a tested commit.** `gh run list --limit=5` was unfiltered, but `e2e.yml` also runs on two crons whose runs are attributed to develop — the eight most recent develop runs at audit time were *all* scheduled e2e runs. | Added `--event=push` and raised the limit to 30. e2e.yml runs on every develop push, so a push run always exists for a pushed HEAD. |
| **W4** | **`.nvmrc` existed but no workflow used it**; all five hardcoded `NODE_VERSION: '22'` instead. Two sources of truth, free to drift. | All 12 `setup-node` steps now use `node-version-file: .nvmrc`; the redundant `env:` blocks are gone. Verified no other env var was removed in the process. |
| **W5** | **`ci.yml`'s header claimed required status checks make it "an enforceable quality gate".** `GET /branches/develop/protection` → 404 and `GET /rulesets` → `[]`: nothing is enforced, and a red run blocks neither merge nor push. | Header rewritten to state the checks are advisory, note that `release.mjs` is the actual gate, and document how to make them binding — including the warning that doing so breaks the direct-push release flow. |
| **W6** | **A dead link and stale content inside `[Unreleased]`** — the `[Unreleased]:` definition pointed at `ciprianiuga/ngx-tw` (nonexistent org; repo is `avs2001`), and the Requirements block still said Angular `^21.2.0`. Both would have been published verbatim into the `0.3.0` release body once W2 was fixed. | Corrected the org, moved the definition to the file footer (out of the section body), and updated the requirements to `^22.0.0`. |

### Verified correct — no change needed

- **`engines` is right, and an earlier finding in this document was wrong.** The
  infra agent flagged `^22.22.3 || ^24.15.0 || >=26.0.0` as ng-packagr's build
  requirement leaking into the published package. It is not: `@angular/core`,
  `@angular/compiler-cli`, `@angular/build` and `@angular/cli` all declare the
  **identical** range. That is Angular 22's official support matrix, so the
  library mirroring it is correct. The README was the wrong half, and it was
  already corrected. Node 23/25 and 22.12–22.22 really are unsupported by
  Angular 22 itself.
- **`pages.yml`'s build output path survives the v22 upgrade** —
  `dist/demo/browser/index.html` still exists after an Angular 22 production
  build, so the SPA-fallback copy step is intact.
- **`e2e.yml` does run on `push: develop`**, so the release gate added for it in
  the previous task cannot deadlock. This was checked before anything else.
- **`publish.mjs` is idempotent** (`npm view` guard), so a retried release
  workflow will not fail on an already-published version.
- **Dependabot is configured correctly** — grouped Angular/dev-tooling npm
  updates plus a `github-actions` ecosystem entry, all targeting `develop`.

### Known-and-accepted

- **GitHub Actions are 3+ majors behind** — `checkout` v4→v7, `setup-node`
  v4→v7, `upload-artifact` v4→v7, `download-artifact` v4→v8, `cache` v4→v6,
  `upload-pages-artifact` v3→v5, `deploy-pages` v4→v5. This is a **review
  backlog, not a misconfiguration**: Dependabot has already opened PRs #13–#17
  for most of them and they sit unmerged, alongside #20/#21/#22/#28/#36 for npm
  deps. Deliberately left to those PRs so each major lands with its own isolated
  CI run rather than mixed into the v22 change. **If you merge them, take
  `upload-artifact` and `download-artifact` together** — the artifact protocol
  is not cross-major compatible, and every e2e job depends on that pairing.
- **The visual canary runs on push**, so a baseline drift fails the whole e2e
  run and will block a release through the gate in `release.mjs`. Deliberate,
  but inspect individual job conclusions before reaching for `--skip-ci-check`.
- **`packageManager: "npm@10.9.2"`** is stale relative to the lockfile (written
  by npm 11) but inert: no workflow enables corepack, and Node 22 ships npm
  10.9.x, so CI and the field agree. `lockfileVersion: 3` is read by both.
- **`.nvmrc` says `22`; local development here is on Node 24.18.0.** Both satisfy
  Angular 22's engines, so this is a preference, not a defect — but `nvm use`
  will now change your Node version, and CI follows `.nvmrc` exactly.
- **`develop` is unprotected** — chosen deliberately over enabling protection,
  because `release.mjs` pushes directly to `develop` and protection would break
  it. Documented rather than changed.

### Not done

- No release was cut and nothing was pushed. `release.mjs`'s changelog transform
  was validated by replaying its exact logic against a copy of the real
  CHANGELOG, not by running the script — it guards on `branch === 'develop'` and
  a clean tree, so it cannot be dry-run from a feature branch. That guard is
  itself worth knowing: **you cannot rehearse a release from anywhere but a
  clean `develop`.**

---

## H1 / H2 resolved — form validity in the pickers

Both findings shared one shape: the component rendered an error border while
reporting itself valid to the form, so a `form.invalid` submit guard let the bad
value through. Fixed on `chore/angular-22`.

### What changed

**`tw-date-picker` (H1)** — two distinct halves, both fixed:

- *Out of range.* Typed input outside `minDate`/`maxDate` (or rejected by
  `dateFilter`) is now **committed** to the form and marks the control invalid
  with the same `calendarMinDate` / `calendarMaxDate` / `calendarDisabledDate`
  codes `tw-calendar` and `tw-date-range-picker` already emit — reused via
  `calendarValidator`, so consumers see one vocabulary across all three.
- *Unparseable.* The form value is cleared (previously the **previous date
  silently survived** and would be submitted) and `calendarInvalidValue` is
  raised. The typed text deliberately stays on screen — routing this through
  `commit()` would have reformatted the input and erased what the user typed.

**`tw-time-picker` (H2)** — `minTime`/`maxTime` now emit `timePickerMin` /
`timePickerMax` on the bound control. New exported type
`TimePickerValidationErrors`, shaped like `CalendarValidationErrors`.

Both components moved to the static `NG_VALUE_ACCESSOR` + deferred `NgControl`
registration shape that Angular v22 requires for a self-provided
`NG_VALIDATORS`, and both re-run validation when a constraint input changes —
without that, the verdict is right on first commit and stale the moment the
consumer moves the bound.

### Two things the fix surfaced that the finding didn't name

- **`rangeError` had to become derived.** It was a flag set at commit time, but
  the value-sync effect clears error state whenever the value changes — and now
  that out-of-range *commits*, that effect fired immediately afterwards and wiped
  the flag. It is now `computed()` from the committed value plus the constraints,
  which also keeps it correct when a constraint moves later. The same latent
  clobber applied to `parseError`, so the boolean flag and the offending text are
  now a single signal instead of two fields free to disagree.
- **Clearing the form value must not blank the input.** Because the input is
  bound to `rawInputText`, the value-sync effect blanked the field on exactly the
  unparseable-with-a-prior-value path — an error border over an empty box, with
  no sign of what was rejected. Caught only because a code comment claimed the
  text stayed visible and that claim was then tested; the original guard specs
  asserted `ctrl.value`/`ctrl.errors` and never looked at `input.value`. Note the
  two cases take different paths (`null → null` does not notify the effect), so
  the no-prior-value case behaved correctly all along and would have masked this
  in a single-case test. Both are now pinned, and the effect bail-out is
  negative-tested.
- **The JSDoc was actively misleading.** `minTime`'s docstring said "Values
  earlier than this set `errorState`" — true, and precisely why the gap was easy
  to miss. All five constraint inputs now say what happens to the bound control.

### Verification

The guard specs were written **before** the fix and confirmed red: 6 failures on
date-picker, 3 on time-picker. After the fix, both files pass in full.

The load-bearing check is the negative one. Removing just the static
`NG_VALUE_ACCESSOR` provider — the single line CLAUDE.md warns about — turns
**6 of 62** date-picker tests and **4 of 43** time-picker tests red while every
other test in those files still passes. That is the silent failure mode
demonstrated rather than asserted: without these specs, that regression ships
green.

Full suite after the change: **2910 passed** (was 2898), 4 skipped, `eslint .`
exit 0, `build:lib` clean, `e2e:fast` 818 passed.

**Scope of the guards:** they bind a reactive `FormControl`, which is what
CLAUDE.md mandates and what the trap actually breaks. Validator surfacing through
signal forms is *not* covered — the same LOW-severity gap this document already
records for `date-range-picker`. Both pickers mirror the canonical
calendar/DRP shape exactly, so they are no worse off, but do not read these
specs as proof that the signal-forms path surfaces errors.

### Not addressed

The remaining component-layer findings (H3–H8: `table` identity/select-all/perf,
`popover`/`command-palette` reopen race, `stepper` roving tabindex, `tabs` RTL)
are untouched.
