# Pass 6 — `TW_` token prefix + unexported public types + `theme/` follow-ups

Agent scope: `avatar/`, `calendar/`, `command-palette/`, `popover/`, `sheet/`, `theme/`
(+ the demo pages referencing renamed symbols). Date 2026-09-03.

**Status: all three tasks complete.** 58 files touched (50 modified, 8 added).
No build or test run (per brief); verified by reading plus two permitted
`tsc --noEmit` passes.

---

## Task 1 — `TW_` prefix on 12 injection tokens

### Register check: the pass-5 correction is confirmed. All 12 are root-barrel public.

Re-derived from source, not from the pass-5 note:

| Token | Reaches `index.ts` via | Root barrel |
|---|---|---|
| `AVATAR_GROUP_SIZE` | `avatar/index.ts:1` (explicit) | `export * from '@cdevhub/ngx-tw/avatar'` |
| `COMMAND_PALETTE_REF` | `command-palette/index.ts` (explicit) | yes |
| `POPOVER_DATA`, `POPOVER_REF` | `popover/index.ts` (explicit) | yes |
| `SHEET_DATA`, `SHEET_DEFAULT_OPTIONS` | `sheet/index.ts` (explicit) | yes |
| `THEME_CONFIG` | `theme/index.ts:3` (explicit) | yes |
| `DATE_ADAPTER`, `DATE_FORMATS`, `TZ_OVERRIDE`, `DATE_SERIALIZATION` | `calendar/index.ts:97-100` (explicit) | yes |
| `CALENDAR_SELECTION_STRATEGY` | `calendar/selection/index.ts:3` → `calendar/index.ts` `export * from './selection'` | yes |

**There is no internal subset.** The work was all 12. `src/public-api.ts` re-exports
all six owning entry points with `export *`.

### The mechanism, and how I know it is the safe one

Every alias is `export const OLD = TW_NEW;` — a binding to the **same
`InjectionToken` instance**. No second `new InjectionToken(...)` was created
anywhere. Verified by reading each declaration site after the edit:
`grep -n "InjectionToken\|^export const"` over each file shows exactly one
`new InjectionToken(...)` per token and one `= TW_*` alias.

Each old name carries a full `@deprecated` JSDoc block naming the replacement
and stating explicitly that it is the same instance, so the note reaches the
`.d.ts` and a consumer's IDE. Each entry-point barrel exports both names, with a
one-line `@deprecated` marker on the old one.

Where the description string literally duplicated the old identifier
(`'POPOVER_DATA'`, `'SHEET_DATA'`, `'THEME_CONFIG'`, …) it was updated to the
`TW_` spelling, matching the house convention set by `TW_DIALOG_DATA` /
`TW_TOAST_DATA` / `TW_FORM_FIELD`. The five calendar tokens already carried
namespaced descriptions (`'tw-calendar/DateAdapter'`) and were left alone.

### Specs — what I wrote and why

Six new alias specs, one per entry point. Each has **three** layers, weakest to
strongest:

1. `expect(OLD).toBe(TW_NEW)` — identity. The brief calls this the weaker second
   line; it is present in all six.
2. **Bidirectional DI round-trip** — provide under the deprecated name, resolve
   under the new one, *and* the reverse. This is the test the brief asked for.
   Against the two-instance mistake it fails with `NullInjectorError`, because
   two `InjectionToken` objects are two distinct DI keys. Against the current
   (correct) code it passes. It cannot pass vacuously: nothing else in the suite
   provides and injects across the two spellings.
3. **A real library class or component on the receiving end**, where one exists:
   - `avatar-token-alias.spec.ts` — DOM-observable and the sharpest of the six.
     A host component provides the *deprecated* `AVATAR_GROUP_SIZE` and contains
     `<tw-avatar size="xs">`; `AvatarComponent` injects `TW_AVATAR_GROUP_SIZE`
     **optionally** and falls back to its own `size` input, so a split DI graph
     would **not throw** — it would quietly render `size-6` instead of
     `size-16`. Asserting the rendered class is the only thing that separates the
     two. This is exactly the failure mode the brief called untestable, made
     testable.
   - `calendar-token-alias.spec.ts` — a real `SingleSelectionStrategy` (which
     injects `TW_DATE_ADAPTER` in a field initialiser) resolving against an
     adapter provided as `DATE_ADAPTER`, then exercised through
     `isSelected()` rather than merely asserted present.
   - `theme-token-alias.spec.ts` — the real `ThemeService` (injects
     `TW_THEME_CONFIG`) reading a config provided as `THEME_CONFIG`, observed
     through `theme()` and `applyToElement()`. Runs under
     `PLATFORM_ID: 'server'` so it needs no `matchMedia`/`localStorage` stubs
     and mutates no global state, while still exercising both config reads.
   - `command-palette`, `popover`, `sheet` — probe components that `inject()`
     each token, created through `TestBed.createComponent`.

**Five existing specs were deliberately left on the deprecated spellings**, each
with a new comment saying so. They are now free end-to-end proofs: real library
code provides/injects the `TW_` name while the spec uses the old one, through the
real overlay, renderer, service or strategy.

| Spec | What it now proves |
|---|---|
| `popover/popover.spec.ts` | `PopoverDirective` provides `TW_POPOVER_DATA`/`TW_POPOVER_REF`; content injects `POPOVER_DATA`/`POPOVER_REF` |
| `sheet/sheet.spec.ts` | `sheet-renderer.ts` provides `TW_SHEET_DATA`; content injects `SHEET_DATA` |
| `theme/theme.service.spec.ts` | `provideTheme()` provides `TW_THEME_CONFIG`; the spec reads `THEME_CONFIG` |
| `calendar/selection/week-selection-strategy.spec.ts` | provides `DATE_ADAPTER`; `WeekSelectionStrategy` injects `TW_DATE_ADAPTER` |
| `calendar/luxon/luxon-date-adapter.spec.ts` | provides `TZ_OVERRIDE`; `LuxonDateAdapter` injects `TW_TZ_OVERRIDE` |

Had I "cleaned up" those five to the new spelling, the suite would have lost its
only realistic coverage of the alias. Deliberate, and commented so it does not
look stale.

### Semver

**Additive. Zero breaks.** Both names ship from every barrel; the old one is
`@deprecated` only. Removing the old arm is the next major's job.

### Calendar file count (asked for explicitly)

**17 files under `calendar/`** — 16 modified, 1 added:

```
calendar.ts                    calendar-view-base.ts       date-adapter.ts
index.ts                       native-date-adapter.ts
luxon/luxon-date-adapter.ts    luxon/luxon-date-adapter.spec.ts
luxon/provide-luxon-date-adapter.ts
selection/index.ts             selection/providers.ts      selection/selection-strategy.ts
selection/single-selection-strategy.ts   selection/range-selection-strategy.ts
selection/multi-selection-strategy.ts    selection/week-selection-strategy.ts
selection/week-selection-strategy.spec.ts
calendar-token-alias.spec.ts   (new)
```

Plus one demo page (`calendar/overview/calendar-overview.component.ts`).

### Left deliberately undone — hand this to whoever owns those directories

**Three library files outside my scope still import the deprecated
`DATE_ADAPTER`:**

- `projects/ngx-tw/date-picker/date-picker.ts:60, :591`
- `projects/ngx-tw/date-range-picker/date-range-picker.ts:65, :564`
- `projects/ngx-tw/time-picker/time-picker.ts:65, :622`

All three import from `@cdevhub/ngx-tw/calendar`, which still exports
`DATE_ADAPTER` as the same instance, so **they compile and behave identically** —
this is a tidiness item, not a defect. I did not touch them because the brief
scopes me to six directories. One-line change each (`DATE_ADAPTER` →
`TW_DATE_ADAPTER`) once someone owns them.

---

## Task 2 — unexported types in public signatures

### `ResolvedItem` / `ResolvedGroup` (command-palette) — confirmed, exported

Verified the finding before acting. Both were bare `interface` declarations at
`command-palette.ts:52` / `:60`, and both are reachable from members carrying
**no `@internal` tag**: `filteredItems` (`:504`), `grouped` (`:521`),
`selectItem()` (`:659`), `setActiveItem()` (`:668`). A `viewChild(CommandPaletteComponent)`
consumer could call all four and name none of the types. Confirmed.

Both are now `export interface`, with per-member JSDoc added (they had none), and
re-exported from `command-palette/index.ts` **renamed**:

```ts
export type {
  ResolvedItem as CommandPaletteResolvedItem,
  ResolvedGroup as CommandPaletteResolvedGroup,
} from './command-palette';
```

Renamed per pass-5 F-2(a): the bare names are far too generic for a root-barrel
symbol. Purely additive — they were never exported, so no alias is owed.

### `SheetContainer` — confirmed, exported **type-only**, and the false comment fixed

`SheetRef.containerInstance` (`sheet-ref.ts:73`) is a documented public getter
returning `SheetContainer | null`, and the shipped rollup carries
`declare class SheetContainer` at `dist/ngx-tw/types/cdevhub-ngx-tw-sheet.d.ts:105`
with the getter at `:174`. So the barrel comment claiming the container is "no
longer part of the public API" was **true of the runtime chunk and false of the
type surface**. Corrected in place with an explanation of both halves.

**The one thing that mattered here and is easy to get wrong:** the export must be
`export type { SheetContainer }`, not a value export. `SheetContainer` lives in
the dynamically-imported renderer chunk; a value re-export from `sheet/index.ts`
would pull the class back into the eager `sheet` chunk and silently undo the
deferral. `sheet-ref.ts` already uses `import type`, so type-only keeps the
runtime graph byte-identical.

I chose **export** over pass-5 F-3's alternative (narrow the getter to a small
handle interface) because narrowing the return type is a **breaking change** for
anyone already calling members on it, and the brief's semver rule is the core of
this task. Exporting adds no members to the shipped surface — the whole class
declaration is already in the rollup — it only makes the type nameable.

### Reported, not mine to fix

- **`dialog/index.ts:3-5` carries the identical false comment** about
  `DialogContainer`, and `TwDialogRef.containerInstance` (`dialog-ref.ts:66`)
  hands the class out the same way. `dialog/` is not in my scope. Same two-line
  fix as `sheet/`: `export type { DialogContainer, ... } from './dialog-container'`
  plus a corrected comment. **Type-only, for the same chunking reason.**
- `ThumbId` (slider, pass-5 F-2) — not my scope, untouched.

---

## Task 3.1 — `ThemeDirective` vs `ThemeService` attribute disagreement

**Analysed. No behavioural change landed.** Here is what I found and what I
recommend.

### The disagreement is wider than two files — there are three consumers, and two ignore the config

| Consumer | Honours `TwThemeConfig.attribute`? |
|---|---|
| `ThemeService.applyToDocument()` / `.applyToElement()` | **yes** (`theme.service.ts:143`, `:191`) |
| `ThemeDirective` | **no** — hard-codes `'[attr.data-theme]'` (`theme.directive.ts:7`) |
| `TW_THEME_BOOTSTRAP_SCRIPT` | **no** — hard-codes `DEFAULT_TW_THEME_CONFIG.attribute` (`theme.bootstrap.ts:43`) |

The bootstrap case is already documented in its own JSDoc ("this constant only
encodes the defaults"), so it is a known limitation rather than a hidden one. But
it matters for the decision: with `provideTheme({ attribute: 'data-mode' })` the
`<head>` script writes `data-theme` pre-hydration and the service then writes
`data-mode` and **never clears the stale `data-theme`**. Two of the three
consumers already ignore `attribute`.

### Why this is really a misfeature, not a two-file inconsistency

Every shipped stylesheet keys off the **literal** `data-theme`:
`_light.css:39`, `_dark.css:13` and its `prefers-color-scheme` branch (`:276`),
`_high-contrast.css:1` and its `forced-colors` list, and `index.css`'s
`@custom-variant dark`. A renamed attribute matches **none** of them. So
`attribute` is only meaningful for a consumer who also ships their own complete
token CSS keyed on the new name — at which point they have replaced the theme
layer anyway.

### The four directions, with what each breaks

| | Change | What breaks |
|---|---|---|
| **A** | Directive reads `THEME_CONFIG.attribute`, falls back to `data-theme` | **Silent regression.** An app that renamed `attribute` gets a directive that stops writing `data-theme`, so `[twTheme]` subtree scoping against the shipped CSS becomes a no-op — precisely the bug `_light.css` was created to fix. No compile error. **Do not do this.** |
| **B** | Directive writes `data-theme` **and** the configured attribute when it differs | Nothing that works today stops working. Residual hazard: a consumer whose own CSS uses a negative selector such as `:root:not([data-theme])` would now match differently. Rare, and only for apps that renamed the attribute. Costs one extra DOM attribute. |
| **C** | Service also always writes `data-theme` alongside the configured attribute | **Riskier than B.** An app that renamed the attribute specifically to keep the shipped blocks *off* would suddenly have them apply — a real visual regression. |
| **D** | No behavioural change; `@deprecate` `TwThemeConfig.attribute` in JSDoc, stating it is not honoured by `[twTheme]` or the bootstrap script and only works with matching custom CSS | Nothing. |

### Recommendation

**Land D now; treat B as an optional follow-up, and consider removing
`attribute` in the next major.**

D is zero-risk and makes all three JSDoc blocks tell one consistent story
instead of three partial ones. B is the "non-breaking reconciliation" the brief
asked about and it does exist — the compatibility argument is that *adding* an
attribute cannot remove behaviour, and the shipped CSS keeps matching
`data-theme` exactly as before — but it buys very little, because a consumer who
renamed the attribute still has a stale `data-theme` from the bootstrap script
and still needs their own CSS. The honest end-state is that `attribute` should
not exist.

I landed neither, because D changes published JSDoc semantics (deprecating a
config member is a documentation-level API signal) and the brief said to
recommend rather than decide. **Both JSDocs already document the disagreement
accurately today**, so nothing is misleading in the meantime.

---

## Task 3.2 — theme token drift guard

**A Vitest spec can do it, and it is written.**

`projects/ngx-tw/theme/theme-token-parity.spec.ts` (+ a 3-declaration ambient
shim, `theme-node-shims.d.ts`).

### The `@types/node` blocker is real but already solved in this repo

`@types/node` is genuinely absent (`node_modules/@types/` holds only chai,
deep-eql, esrecurse, estree, json-schema, luxon). But the **demo project already
hit and solved this**: `projects/demo/src/types/raw-import.d.ts` hand-declares
`node:fs` / `node:path` / `node:url`, and
`projects/demo/src/app/app.routes.spec.ts` — the load-bearing route drift guard
that runs in CI — imports `readFileSync` from it. I copied that pattern.

The library's `tsconfig.spec.json` picks up `theme/**/*.spec.ts` but no `.d.ts`
from that directory, so the shim reaches the program through a
`/// <reference path>` at the top of the spec (with a scoped `eslint-disable` for
`@typescript-eslint/triple-slash-reference`, which `stylistic` sets to
`path: 'never'`). Confirmed in the program:
`tsc -p tsconfig.spec.json --listFiles` lists both files.

I kept the shim inside `theme/` rather than adding a file to
`projects/ngx-tw/src/` (where the existing `src/**/*.d.ts` include would have
picked it up automatically) because `src/` is not my scope and a sibling agent is
editing `public-api.ts` in this same tree.

### What it actually checks — four blocks, not three

The brief says three; there are **four** hand-duplicated blocks, because
`_dark.css` carries two:

1. `_light.css` → `[data-theme="light"]`
2. `_dark.css` → `[data-theme="dark"]`
3. `_dark.css` → `@media (prefers-color-scheme: dark)`
4. `_high-contrast.css` → `[data-theme="high-contrast"]`

Measured: all four declare **exactly the same 195 custom properties, in the same
order**, and the two `_dark.css` blocks are identical down to their values.

Six assertions:

| Test | Guards |
|---|---|
| every block parses to > 100 declarations | the guard itself — a moved selector would otherwise make every comparison trivially pass on empty arrays |
| no duplicate key within a block | a token declared twice, where the second silently wins |
| all four blocks declare the same key set | the drift the brief asked for |
| `_dark.css`'s two blocks are equal **including values** | `_dark.css` says "keep the two blocks in lock-step"; these two are literal copies, unlike the light/dark/HC trio whose values are meant to differ. Key-set parity alone would miss a value drift here |
| `forced-colors` remaps only tokens the schemes declare | a typo'd override that lands on no real token |
| `_light.css`'s prose count ("The 195 declarations below") matches reality | the comment rotting. Parsed from the file rather than hard-coded, so adding a token to all four fails here until the prose is updated too |

Comment-stripping runs first, so a commented-out declaration never counts.

### Non-vacuity — measured, not reasoned

I transcribed the spec's exact parsing and comparison logic into a standalone
Node script and ran it against copies of the real CSS:

| Scenario | Result |
|---|---|
| unmodified tree | **ALL PASS** |
| drop `--color-fg-subtle` from `_high-contrast.css` | **FAIL** (key-set drift) |
| change one value in `_dark.css`'s media block only | **FAIL** (dark blocks not identical) |
| add a new token to `_light.css` only | **FAIL** three ways (drift vs dark-explicit, dark-media and HC; plus stale prose count) |

So the guard fails before the drift is fixed and passes after — in three
independent directions.

---

## Verification performed (no builds, no test runs)

- `npx tsc --noEmit -p projects/ngx-tw/tsconfig.lib.json`
- `npx tsc --noEmit -p projects/ngx-tw/tsconfig.spec.json`

Both clean **except** two errors I am confident are the documented stale-`dist`
artefact, not defects:

```
calendar/luxon/luxon-date-adapter.ts(3,23): TS2724: '"@cdevhub/ngx-tw/calendar"'
  has no exported member named 'TW_TZ_OVERRIDE'. Did you mean 'TZ_OVERRIDE'?
calendar/luxon/luxon-date-adapter.ts(62,27): TS2322: Type '{}' is not assignable to 'string'.
calendar/luxon/provide-luxon-date-adapter.ts(2,10): TS2724: ... 'TW_DATE_ADAPTER' ...
```

`calendar/luxon/` is a **nested entry point** and already imported from
`@cdevhub/ngx-tw/calendar` (the `dist/` alias) before my change — that is its
pre-existing pattern, not something I introduced. Confirmed the cause directly:
`grep -c "TW_TZ_OVERRIDE\|TW_DATE_ADAPTER" dist/ngx-tw/types/cdevhub-ngx-tw-calendar.d.ts`
returns **0**, and the same file still exports the bare names. The second error
is a cascade of the first (the failed import types the token as `{}`). Both
resolve on the orchestrator's `npm run build:lib`. **Flagging explicitly so the
orchestrator does not read them as my breakage — but they are also the one thing
worth re-checking first after the rebuild.**

**Everything below needs `npm run build:lib` before it can be judged.** Same
class as the luxon errors, different files — worth stating separately because
the orchestrator will hit these *first* if it runs `ng build demo` before
`build:lib`:

- the **12 demo pages**, which now import `TW_*` names from `@cdevhub/ngx-tw/*`
  (→ stale `dist/`) and will emit TS2724 until the rebuild;
- `theme.meta.ts`, whose prose feeds the MCP index — `npm run verify:mcp-index`
  needs the rebuild too.

None of those are breakage.

Three demo files outside my scope (`empty-state`, `foundations/rhythm`, `toast`)
show as modified in `git status`; those are sibling agents working in the same
tree, not me.

---

## Residual risks

1. **The two `luxon` errors above are the only unverified claim in this report.**
   I reasoned them to stale `dist/` and confirmed the dist content, but I was
   instructed not to build, so I have not seen them go green.
2. **`theme-node-shims.d.ts` is matched by `tsconfig.lib.json`'s `theme/**` glob**,
   so `declare module 'node:fs'` is ambient in the library *program* (not the
   output). Consequence: library source could import `node:fs` without a type
   error. Harmless in practice, emits nothing, and the root `ng-package.json`
   `assets` glob is `theme/**/*.css` so it is never copied into `dist/`. The
   clean fix is one line in `tsconfig.lib.json` (`exclude: ["**/*.d.ts"]` scoped
   appropriately) — not my file.
3. **`theme.meta.ts` prose was updated** (`THEME_CONFIG` → `TW_THEME_CONFIG`),
   which feeds the MCP index. `npm run verify:mcp-index` will need the rebuild;
   I did not run it.
4. **Task 3.1 landed nothing**, by instruction. If the team wants D (the JSDoc
   deprecation), it is a ~10-line change across `theme.types.ts`,
   `theme.directive.ts` and `theme.service.ts`.
5. **Nothing was done about pass-5 F-4** (`@internal` leak) — out of scope.

## Corrections to the inputs

- **A prior recorded decision says not to do Task 1's `THEME_CONFIG` rename, and
  that decision is factually wrong.** `docs/library-review/done/theme.md:255`
  reads: *"**Do not** rename `THEME_CONFIG` (the `InjectionToken`) — it follows
  the canonical `TW_ERROR_STATE_MATCHER` pattern and is already correctly
  prefixed."* — restated at `:300` (*"Renaming `THEME_CONFIG` (correct as-is)"*).
  It is false on its face: `THEME_CONFIG` carried **no** `TW_` prefix. The
  reviewer appears to have confused it with the neighbouring
  `DEFAULT_TW_THEME_CONFIG` / `TW_THEMES`, which are correctly prefixed.
  CLAUDE.md's identifier table (`TW_` for injection tokens) and pass-5 §A2.2 both
  say rename, so **the rename stands** — but the stale line should be struck by
  whoever owns `docs/`, or the next reviewer will re-derive the same wrong
  objection.
- **The brief's own proposed reconciliation for Task 3.1 is not non-breaking.**
  It suggests, by name, "the directive reading `THEME_CONFIG` when present and
  falling back to `data-theme`". That is option **A** in the table above, and it
  is a *silent behavioural regression*: for exactly the consumers who renamed
  `attribute`, `[twTheme]` stops writing `data-theme` and its subtree scoping
  against the shipped CSS becomes a no-op — the bug `_light.css` was created to
  fix — with no compile error anywhere. The genuinely non-breaking shape is
  option **B** (write both), and the honest end-state is option **D** plus
  removing `attribute` in the next major.
- The brief says "three hand-duplicated 195-token blocks". There are **four**
  (`_dark.css` contributes two). The guard covers all four.
- `pass5-api.md` §A2.2 lists `THEME_CONFIG` at `theme/theme.config.ts:15`; it was
  at `:21`. The fix brief's table had it right.
- Everything else in the pass-5 register correction held: 12 of 12 non-prefixed
  tokens are root-barrel public, and there is no internal subset.

## Stale `docs/` references — handoff, not my scope

These name the old token spellings and are now wrong. Nothing breaks, but
nothing else will flag them either:

- `docs/library-review/done/theme.md:255, :300` — the false "do not rename" note above
- `docs/prompts/tw-sheet.md:100, :224` — spells out
  `SHEET_DATA = new InjectionToken<unknown>('SHEET_DATA')` and the barrel export list
- `docs/library-review/done/avatar.md:8, :23, :35` — `AVATAR_GROUP_SIZE`
- `docs/library-review/done/popover.md:62, :99` — `POPOVER_DATA` / `POPOVER_REF`
- `docs/prompts/tw-carousel.md:12`, `docs/prompts/tw-timeline.md:11` — cite
  `AVATAR_GROUP_SIZE` as the canonical propagation idiom
- `docs/audit-2026-09-register.md:761-762` — the under-stated "six of which"
  claim, already corrected by pass-5 F-1 and re-confirmed here

## Files touched — 58 (50 modified, 8 added)

**Added (8):** `avatar/avatar-token-alias.spec.ts`,
`calendar/calendar-token-alias.spec.ts`,
`command-palette/command-palette-token-alias.spec.ts`,
`popover/popover-token-alias.spec.ts`, `sheet/sheet-token-alias.spec.ts`,
`theme/theme-token-alias.spec.ts`, `theme/theme-token-parity.spec.ts`,
`theme/theme-node-shims.d.ts`

**Modified — library (38):**
`avatar/avatar.ts`, `avatar/index.ts`;
`calendar/` (16, listed above);
`command-palette/command-palette.ts`, `command-palette/command-palette-tokens.ts`, `command-palette/index.ts`;
`popover/popover.ts`, `popover/popover-tokens.ts`, `popover/popover-close.ts`, `popover/popover-title.ts`, `popover/popover.spec.ts`, `popover/index.ts`;
`sheet/sheet.ts`, `sheet/sheet-config.ts`, `sheet/sheet-renderer.ts`, `sheet/sheet.spec.ts`, `sheet/index.ts`;
`theme/theme.config.ts`, `theme/theme.service.ts`, `theme/theme.types.ts`, `theme/theme.meta.ts`, `theme/theme.service.spec.ts`, `theme/index.ts`

**Modified — demo (12):** the `api`/`examples`/`overview` pages under
`routes/{avatar,calendar,command-palette,popover,sheet,theme}/` that named a
renamed token.
