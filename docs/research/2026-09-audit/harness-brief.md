# Component test harness brief — ngx-tw

You are one of three parallel agents adding CDK component harnesses.
Read `scratchpad/pass5-fix-brief.md` too — the semver and house rules there apply.

## Why ~14 and not 56

Pass 5 took this position and the maintainer approved it: a harness per component is the
wrong goal. **Harnesses are semver-frozen public API** — every method you add is a promise
you can never change. The right target is the components a consumer *cannot* reasonably
drive with plain DOM queries: overlay-bearing surfaces and complex form controls.

That means: **do not** add convenience methods speculatively. Add what a consumer testing
their own app genuinely needs, and stop. A thin harness that ships is better than a wide one
you regret.

## The shape — copy it, do not invent one

`projects/ngx-tw/calendar/testing/` is the only existing harness and it is the model.
**Read `calendar-harness.ts`, `calendar-cell-harness.ts`, `index.ts` and
`calendar-harness.spec.ts` before writing anything.** Match their conventions exactly:

- `extends ComponentHarness`, `static hostSelector = '<selector>'`
- a `static with(options): HarnessPredicate<T>` using `.addOption(...)` and
  `HarnessPredicate.stringMatches`
- a `Filters` interface `extends BaseHarnessFilters`, exported as a type
- `private readonly x = this.locatorFor('...')` for internals
- JSDoc on **every** public member — `scripts/mcp/extract-api.mjs` reads `node.jsDoc`
  (`/** */` blocks only) and ships it in `dist/ngx-tw/index.json`
- import from `@angular/cdk/testing`; type-only imports as `import type`

## Files per component

    projects/ngx-tw/<component>/testing/ng-package.json   -> { "lib": { "entryFile": "index.ts" } }
    projects/ngx-tw/<component>/testing/index.ts           -> named re-exports, no `export *`
    projects/ngx-tw/<component>/testing/<name>-harness.ts
    projects/ngx-tw/<component>/testing/<name>-harness.spec.ts

**Do NOT** add these to `projects/ngx-tw/src/public-api.ts`. Verified: `calendar/testing` is
absent from the root barrel — nested entry points are auto-discovered by ng-packagr from
`ng-package.json` and are direct-import only (`@cdevhub/ngx-tw/<component>/testing`).

## Overlay components need care

Most of your targets render into a CDK overlay, i.e. **outside the fixture's host element**.
`ComponentHarness.locatorFor` searches within the harness host, so a panel/dialog harness
must be reached from the `HarnessLoader`'s **document root** loader
(`TestbedHarnessEnvironment.documentRootLoader(fixture)`), not the fixture loader. Get this
wrong and the harness silently finds nothing. Assert it in the spec.

## Tests

A spec per harness, using `TestbedHarnessEnvironment.loader(fixture)`. Each must drive the
component **through the harness only** — no `fixture.nativeElement.querySelector`. That is
the point: if the harness cannot express the interaction, the harness is incomplete.

Prove each harness is non-vacuous: a method that returns a hardcoded value would pass a
weak spec. Assert state *changes* across an interaction, not just an initial read.

## Do not run builds or tests

Two sibling agents are adding harnesses concurrently. `ng test <one component>` type-checks
the whole library program, so a sibling's half-written file fails your run and you will chase
a phantom. Verify by reading; `npx tsc --noEmit -p projects/ngx-tw/tsconfig.lib.json` is
permitted but treat a cross-entry-point error as suspect (the root tsconfig maps
`@cdevhub/ngx-tw/*` at `dist/`, i.e. the last build). The orchestrator runs everything
centrally.

## Report

Per component: the harness's public surface (method names only), what you deliberately left
out, and anything that could not be expressed through a harness. The last one is the most
useful thing you can tell me — it usually means the component lacks a stable hook.
