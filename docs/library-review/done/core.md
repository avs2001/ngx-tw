# Core — Production-Grade Review

**Entry point:** `ngx-tw/core`
**Files:** `projects/ngx-tw/core/`

## Snapshot
- Public exports: 3 types (`TwColor`, `TwSize`, `TwBreakpoint`) + 1 a11y/forms token + 1 default + 1 interface + 1 helper type (`TwFormSubmitted`) + 10 time helpers + 2 time types (`TimePickerFormat`, `TimePickerMeridiem`).
- Consumers: every component entry point. `TwColor` is imported by 24 components, `TwSize` by 22, `TwBreakpoint` only by `table`. `TW_ERROR_STATE_MATCHER` + `ErrorStateMatcher` are consumed by `input`, `date-picker`, `date-range-picker`, `time-picker` (form controls with their own internal text fields). Time utilities are consumed by `time-picker` exclusively today.
- A11y / forms / styling concerns this surface owns: (1) the cross-component form-control error policy (`TW_ERROR_STATE_MATCHER`), (2) the canonical color/size/breakpoint vocabulary that every variant in the library composes against, (3) shared time-field digit-buffer behaviour for picker components.

## Public surface
| Export | Kind | JSDoc? | Notes |
|---|---|---|---|
| `TwColor` | type | yes (one line) | 8 semantic roles. Used by 24 components. |
| `TwSize` | type | yes (one line) | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`. Used by 22 components. |
| `TwBreakpoint` | type | yes | `'sm' \| 'md' \| 'lg' \| 'xl'`. Only `table` consumes it (note: missing `'xs'` — `TwBreakpoint` is a strict subset of `TwSize`, which is correct since `xs` is not a Tailwind breakpoint). |
| `ErrorStateMatcher` | interface | yes (block) | `isErrorState(control, form)` shape. |
| `TwFormSubmitted` | interface | yes (block) | Minimal `{ submitted: boolean }` so both `NgForm` and `FormGroupDirective` satisfy it. |
| `defaultErrorStateMatcher` | const | yes (block) | Material-equivalent default: `invalid && (touched || dirty || form.submitted)`. |
| `TW_ERROR_STATE_MATCHER` | `InjectionToken<ErrorStateMatcher>` | yes (block) | `providedIn: 'root'` — codified exception (stateless policy token). |
| `padTwo` | util | yes (one line) | Zero-pads. |
| `to12h` / `from12h` | util | yes | 24h ↔ 12h conversion. |
| `fieldMax` / `fieldMin` | util | yes | Bounds for `hour\|minute\|second` given `TimePickerFormat`. |
| `appendDigit` | util | yes (block) | Buffered two-digit field input. |
| `isTerminalDigit` | util | yes (block) | Auto-advance heuristic. |
| `stepWithWrap` | util | yes (block) | Step + wrap in `[min, max]`. |
| `clamp` | util | yes (one line) | Non-wrap clamp. |
| `parseField` | util | yes (one line) | `string → number \| null`. |
| `timeOfDaySeconds` | util | yes (one line) | `(h,m,s) → seconds since midnight`. |
| `TimePickerFormat` | type | yes | `'12h' \| '24h'`. |
| `TimePickerMeridiem` | type | yes | `'AM' \| 'PM'`. |

### Findings
- **`form-reset.ts` is not exported from `core/index.ts`.** The file defines `onFormReset(onReset: () => void)` — a thin helper that subscribes to `AbstractControl.events` and invokes the callback on `FormResetEvent` — but it never lands on the public surface. `calendar.ts` (lines 760–766) hand-rolls the exact same logic. Either export the helper and migrate calendar, or delete the file. Currently it is dead code in a public entry point.
- All exported identifiers carry JSDoc; most are one-liners and adequate for Compodoc.
- Naming is consistent: types carry the `Tw` prefix; the constant `TW_ERROR_STATE_MATCHER` is `UPPER_SNAKE_CASE`; helper functions are camelCase.
- `TwFormSubmitted` is exported as a *type* — correct, since it is a structural shape both Reactive and Template-driven forms satisfy. Public.
- Time utilities are framework-agnostic (no Angular / CDK imports); good — they could move to a node-only test runner without TestBed.
- `ng-package.json` is a one-line `{ "lib": { "entryFile": "index.ts" } }` — minimal and correct.

## CSS tokens (theme only)
N/A — `core/` is a TypeScript-only entry point and does not own tokens.

## Accessibility / theming concerns
- Color contrast: N/A here — see `theme.md`.
- `prefers-reduced-motion`: N/A here — see `theme.md`.
- `prefers-color-scheme`: N/A.
- High-contrast mode: N/A.
- **Forms baseline:** `TW_ERROR_STATE_MATCHER`'s `defaultErrorStateMatcher.isErrorState(control, form)` exposes the four canonical pieces of state (touched, dirty, invalid, form-submitted) that match Material's `ErrorStateMatcher` shape. The interface is sufficient — no missing surface. The token correctly uses `providedIn: 'root'` per the stateless-policy-token exception codified in `CLAUDE.md`.
- **Findings:**
  - The `ErrorStateMatcher` contract is silent about pending validators. Material's default ignores `control.pending` too, so the omission is intentional — but it's worth documenting in JSDoc so consumers writing custom matchers don't accidentally surface errors during async validation.
  - `defaultErrorStateMatcher` is correctly a stateless `const` (no constructor needed) and can therefore be safely tree-shaken even when consumers replace the matcher.

## Consistency across components
> Cross-references with component usage. Which components import directly? Which redeclare types or utilities they should be reusing from here?

- **Type duplication / lift candidates:** the following types are redeclared in components and have ≥3 occurrences with identical or near-identical shape. They are strong candidates for promotion to `core/types.ts`:

  | Proposed core type | Shape | Local declarations today | Severity |
  |---|---|---|---|
  | `TwVariant` | `'solid' \| 'outline' \| 'ghost' \| 'soft' \| 'link'` (broad union) or split into `TwFillVariant = 'solid' \| 'outline' \| 'soft'` + `TwTriggerVariant = 'solid' \| 'outline' \| 'ghost' \| 'soft' \| 'link'` | `BadgeVariant`, `AlertVariant`, `ButtonVariant`, `CheckboxVariant`, `RadioVariant`, `SliderVariant`, `SegmentedControlVariant`, `AccordionVariant`, `CollapsibleVariant`, `TabsVariant`, `TabNavVariant`, `CodeBlockVariant`, `SeparatorVariant`, `CardVariant`, `FlipCardVariant`, `StepperVariant`, `SelectVariant`, `DatePickerVariant`, `DateRangePickerVariant`, `TimePickerVariant`, `TwTableVariant`, `ProgressBarVariant`, `SpinnerVariant`, `PopoverScrollStrategy`, etc. | P1 — too many bespoke variants. A single shared union is unrealistic, but `TwFillVariant` (`'solid' \| 'outline' \| 'soft'`) would consolidate badge/alert/checkbox/radio. |
  | `TwOrientation` | `'horizontal' \| 'vertical'` | `RadioOrientation`, `FlipCardDirection`, `SplitDirection`, inline string literals in `tabs.ts` (line 224, 340), `segmented-control.ts` (line 201), `separator.ts` (line 91) | P1 — 6+ duplicates, several inline. |
  | `TwLabelPosition` | `'before' \| 'after'` | `CheckboxLabelPosition`, `RadioLabelPosition`, `SwitchLabelPosition`, `TwSortArrowPosition` | P1 — 4 identical shapes. |
  | `TwArrowDirection` | `'top' \| 'bottom' \| 'left' \| 'right'` | `popover/popover.ts` and `tooltip/tooltip.ts` declare the *same* private alias and even share a `resolveArrowDirection` and `ARROW_POSITION_CLASSES` shape. | P1 — copy-paste across two overlay components. |
  | `TwOverlayPosition` | `'top' \| 'top-start' \| 'top-end' \| 'bottom' \| ... \| 'right-end'` (12-arm) | `PopoverPosition`, `TooltipPosition` declare the identical 12-arm union. | P1 — pure copy-paste. |
  | `TwSortDirection` | `'asc' \| 'desc' \| null` | `sort/sort.ts` (`SortDirection`). Only one consumer today, but the name is generic enough to live in core. | P2 — keep local until a second consumer appears. |
  | `TwDensity` | `'comfortable' \| 'compact'` | `TwTableDensity`. Only one consumer today. | P2 — defer until there's a second consumer (e.g., if `tw-item` ever exposes density). |

  Recommendation: lift `TwOrientation`, `TwLabelPosition`, `TwArrowDirection`, and `TwOverlayPosition` to `core/types.ts` now; defer `TwVariant` and `TwDensity` until the broader variant taxonomy is settled (likely as part of the codified library-fix plan).

- **Inline string literals not aliased at all:** `tabs.ts` and `segmented-control.ts` declare `input<'horizontal' | 'vertical'>('horizontal')` inline rather than using a named type, while `radio` / `separator` use the same union via different aliases. After lifting `TwOrientation`, these inline usages should all migrate.

- **`TW_ERROR_STATE_MATCHER` usage audit:**

  | Component | Imports `TW_ERROR_STATE_MATCHER`? | Per-instance override input? | Notes |
  |---|---|---|---|
  | `input` | yes | yes (`errorStateMatcher` input) | Canonical implementation. |
  | `date-picker` | yes | yes | Mirrors `input`. |
  | `date-range-picker` | yes | yes | Mirrors `input`. |
  | `time-picker` | yes | yes | Mirrors `input`. |
  | `checkbox` / `radio` / `switch` / `select` / `calendar` | **no** | **no** | These are form controls too, but they currently surface "error" purely via the bound control's own state and Tailwind classes (the convention `aria-invalid && touched`). Whether they should integrate with `TW_ERROR_STATE_MATCHER` is a policy question, not a bug — but the inconsistency is worth a deliberate decision. P2. |
  | `slider` | **no** | **no** | Same as above. |

  The four pickers and `input` use the matcher consistently. The structural inconsistency with `checkbox`/`radio`/`switch`/`select`/`calendar` is intentional today but should be revisited.

- **Time-utils consumers:** Currently only `time-picker` imports `padTwo`, `to12h`, `from12h`, `appendDigit`, `isTerminalDigit`, `fieldMax`, `fieldMin`, `parseField`. `calendar` performs its own date-to-time logic via `DateAdapter` and does not need the digit-buffer helpers. Verdict: the time-utils placement in `core/` is justified — they are reused via `TimePickerFormat` by `date-picker`, `date-range-picker`, and `time-picker` — but only the type is re-exported by `date-picker` overlays, not the helpers. That's correct; pickers compose the time-picker component rather than the helpers.

- **Token / utility sprawl:** none observed. Components do not redeclare `TwColor` or `TwSize` (every import comes from `ngx-tw/core`).

### Findings (consistency)
- Eight high-traffic types are re-declared locally and warrant promotion (above).
- Inconsistent adoption of `TW_ERROR_STATE_MATCHER` across form controls is worth a deliberate "yes, these too" or "no, these are intentionally different" decision.
- `form-reset.ts` exists but is unexported and unused — calendar duplicates its body. Either ship it or delete it.

## Tests
- `error-state-matcher.spec.ts` — 7 tests, covers `null` control, pristine/untouched invalid, dirty, touched, submitted, valid + interacted. Solid coverage.
- `time-utils.spec.ts` — 23 tests across all 10 helpers including round-trip property checks (`to12h` ↔ `from12h` for every hour 0–23). Solid coverage.
- No spec for `form-reset.ts` — consistent with its un-exported status, but if it ships it needs a test.
- Vitest-specific: both specs import `describe`, `it`, `expect` from `'vitest'` and avoid `fakeAsync`/`tick` — compliant.
- Findings: no Vitest-specific issues. Adding one test for `clamp(value === min)` and `clamp(value === max)` (the boundary cases) would be a low-effort improvement; current spec asserts strictly-below and strictly-above only.

## Gaps & lacks
1. **`onFormReset` helper is orphaned** — defined, not exported, not used. Calendar reinvents it.
2. **Shared `TwOrientation`, `TwLabelPosition`, `TwArrowDirection`, `TwOverlayPosition` are missing** — components hand-roll the same unions. `tabs` and `segmented-control` use inline string literals; `popover` and `tooltip` are byte-for-byte copy-pastes of the arrow direction machinery.
3. **No `TwDir` / RTL helper** — components that handle RTL (calendar, split, popover position flipping) each consult `bidiUtils` / `Directionality` ad-hoc. A canonical `inject(Directionality).value` wrapper or `TwDirection` type is not provided. Lower priority — CDK's `Directionality` already covers it.
4. **No shared `coerceBoolean`/`coerceNumber` helpers** — Material has these (`@angular/cdk/coercion`); ngx-tw inputs are typed via signals so consumers can't pass `''` or `null`, but a coercion utility would help once attribute selectors with template HTML get involved (e.g., `[disabled]=""`). Lower priority — Angular signal inputs largely obviate the need.
5. **No `TwVariant` taxonomy** — see Consistency above. P1.
6. **`ErrorStateMatcher` JSDoc doesn't document the pending-validator semantics** — minor.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this foundation.

### Goal
Consolidate `ngx-tw/core` into the single source of truth for cross-component vocabulary and form-control policy. Lift the four shared types that are currently duplicated across 4+ components, ship the orphaned form-reset helper (or delete it), and codify which form controls participate in the `TW_ERROR_STATE_MATCHER` contract.

### Tasks
1. **Lift shared variant types into `core/types.ts`** — one-line summary: add `TwOrientation`, `TwLabelPosition`, `TwArrowDirection`, `TwOverlayPosition` and migrate consumers.
   - File(s): `projects/ngx-tw/core/types.ts`, `projects/ngx-tw/core/index.ts`, plus consumers (`tabs/tabs.ts`, `tab-nav/tab-nav.ts`, `segmented-control/segmented-control.ts`, `separator/separator.ts`, `radio/radio.ts`, `flip-card/flip-card.ts`, `split/split.types.ts`, `checkbox/checkbox.ts`, `switch/switch.ts`, `sort/sort-header.ts`, `popover/popover.ts:42-66`, `tooltip/tooltip.ts:28-46`).
   - Why: 4+ identical declarations across the library. `popover` and `tooltip` are byte-for-byte copy-pastes of `PopoverPosition`/`TooltipPosition` (12-arm overlay positions) and `ArrowDirection` (4-arm cardinal). Inline string literals in `tabs.ts:224,340` and `segmented-control.ts:201` should also collapse to the shared type.
   - Change:
     - Add to `core/types.ts`:
       ```ts
       /** Two-axis orientation used by tabs, segmented controls, radio groups, separators, splits, and flip-cards. */
       export type TwOrientation = 'horizontal' | 'vertical';
       /** Label placement relative to a control. */
       export type TwLabelPosition = 'before' | 'after';
       /** Direction the arrow of an overlay points toward. */
       export type TwArrowDirection = 'top' | 'bottom' | 'left' | 'right';
       /** Twelve-arm overlay anchor: cardinal + start/end variants. */
       export type TwOverlayPosition =
         | 'top' | 'top-start' | 'top-end'
         | 'bottom' | 'bottom-start' | 'bottom-end'
         | 'left' | 'left-start' | 'left-end'
         | 'right' | 'right-start' | 'right-end';
       ```
     - Re-export from `core/index.ts` alongside `TwColor`, `TwSize`, `TwBreakpoint`.
     - Replace local declarations:
       - `RadioOrientation`, `FlipCardDirection`, `SplitDirection` → `TwOrientation` (keep the legacy alias for one minor as a deprecated re-export to preserve consumer code; see *Out of scope* for the deprecation deadline).
       - `CheckboxLabelPosition`, `RadioLabelPosition`, `SwitchLabelPosition`, `TwSortArrowPosition` → `TwLabelPosition`.
       - `popover/popover.ts` private `ArrowDirection` → `TwArrowDirection`.
       - `tooltip/tooltip.ts` private `ArrowDirection` → `TwArrowDirection`.
       - `PopoverPosition`, `TooltipPosition` → `TwOverlayPosition`.
       - Inline `'horizontal' | 'vertical'` in `tabs.ts:224,340`, `segmented-control.ts:201`, `separator.ts:91` → `TwOrientation`.
   - Acceptance:
     - `npm run build:lib` passes with zero new warnings.
     - `npm test` passes with no spec changes required (these are pure type renames).
     - `grep -rn "'horizontal' | 'vertical'" projects/ngx-tw/` returns only the definition site in `core/types.ts`.
     - `grep -rn "'before' | 'after'" projects/ngx-tw/` returns only `core/types.ts`.
     - `popover/popover.ts` and `tooltip/tooltip.ts` no longer declare a local `ArrowDirection`.

2. **Decide and act on `form-reset.ts`** — one-line summary: either export it and migrate calendar, or delete it.
   - File(s): `projects/ngx-tw/core/form-reset.ts`, `projects/ngx-tw/core/index.ts`, `projects/ngx-tw/calendar/calendar.ts:752-766`.
   - Why: `onFormReset()` is defined, JSDoc'd, and unreachable from any entry point. Calendar duplicates the body (subscribe to `control.events`, filter `FormResetEvent`). Either it earns its keep or it should not ship.
   - Change:
     - **Option A (preferred):** export from `core/index.ts`, write a spec (`form-reset.spec.ts`) with at least: (i) no-op when host has no `NgControl`, (ii) fires `onReset` when `control.reset()` is called, (iii) does not leak after `DestroyRef` fires, (iv) gracefully handles Signal Forms (no `events` stream). Migrate `calendar.ts` lines 752–766 to call `onFormReset(() => this.handleFormReset())` from its constructor (note: calendar resolves `NgControl` lazily in `ngOnInit` to avoid a construction cycle — confirm `onFormReset` works in `ngOnInit` too, or document the constraint).
     - **Option B:** delete `form-reset.ts`. Calendar keeps its inline implementation. Use this option only if Option A turns out to add risk (e.g., calendar's lazy `NgControl` lookup is incompatible).
   - Acceptance:
     - Option A: `grep "FormResetEvent" projects/ngx-tw/` shows references only in `form-reset.ts`, its spec, and (transitively) any docs. `calendar.spec.ts` still passes; calendar's reset-behaviour tests still pass.
     - Option B: file is removed; no broken imports.

3. **Document pending-validator semantics on `ErrorStateMatcher`** — one-line summary: clarify in JSDoc that the default matcher ignores `control.pending`.
   - File(s): `projects/ngx-tw/core/error-state-matcher.ts:18-39`.
   - Why: Async validators are common; consumers writing custom matchers will want to know whether to surface errors mid-validation. Material's behaviour (mirrored here) is to suppress; document explicitly.
   - Change: add one sentence to the `ErrorStateMatcher` JSDoc and the `defaultErrorStateMatcher` JSDoc: "Pending async validators are not considered — only the resolved `invalid` state."
   - Acceptance: JSDoc renders in Compodoc for the demo app's API page.

4. **Audit + decide on `TW_ERROR_STATE_MATCHER` adoption for non-text form controls** — one-line summary: choose whether `checkbox`/`radio`/`switch`/`select`/`calendar` should integrate.
   - File(s): scoping audit — produce a 1-paragraph decision doc; no code changes in this PR.
   - Why: today only text-input form controls (`input`, time/date pickers) use the matcher. Toggle-style controls expose error state ad-hoc. Inconsistent.
   - Change: write the decision as JSDoc on `TW_ERROR_STATE_MATCHER` itself ("Applies to controls whose visible error surface depends on `touched`/`dirty`/submitted gating — text inputs, pickers, calendar's hidden input. Toggle controls — checkbox, radio, switch, select — surface error purely via `aria-invalid` and visible state without gating, and do not consume this token.") OR adopt the matcher in those components (larger PR — out of scope here).
   - Acceptance: JSDoc reflects the policy; followup PR (if adoption is chosen) is filed separately.

### Out of scope
- `TwVariant` consolidation — the per-component variant unions diverge enough (`solid|outline|soft` vs `solid|outline|ghost` vs `default|striped|bordered` vs `circular|dots|bars`) that lifting a single union is more harm than help today. Defer to the broader variant-taxonomy decision in the library-fix plan.
- `TwDensity` — only `table` exposes density today; add when a second consumer appears.
- Renaming `TwSplit` / `TwSplitPane` / `TwSplitGutter` / `TwSplitPaneHeader` / `TwCalendarPresets` to drop the `Tw` prefix — codified in the library-fix plan (PR4/PR6), not this PR.
- Deprecation aliasing for renamed types (e.g., `export type SplitDirection = TwOrientation`) — if backward compatibility is required, do it inside the migrated component files as a one-line `@deprecated` re-export, not in `core`.

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Theme: N/A — `core/` ships no CSS.
- Grep checks (post-migration):
  - `grep -rn "'horizontal' | 'vertical'" projects/ngx-tw/src/ projects/ngx-tw/*/` → only `core/types.ts`.
  - `grep -rn "ArrowDirection = 'top'" projects/ngx-tw/` → only `core/types.ts`.
  - `grep -rn "FormResetEvent" projects/ngx-tw/` → only `core/form-reset.ts` + spec (or zero, if Option B).

## Priority
**P1** — the `core/` surface is correct and well-tested, but eight high-traffic types are duplicated across the library, one helper is orphaned, and one cross-cutting policy (`TW_ERROR_STATE_MATCHER` adoption) is undecided. None of these block consumers today; all of them will pay rent at every subsequent component refactor.
