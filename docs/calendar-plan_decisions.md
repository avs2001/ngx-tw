# Calendar Component — Open Decisions Rationale

Scope: resolves the 7 entries in `docs/open_decisions.md` by accepting or rejecting the default recommendation, with a short rationale and a map of the other requirement sections each decision affects.

Sources: `docs/open_decisions.md`, `docs/requirements/calendar-component-requirements.md` (v2.3). Section numbers below refer to the requirements spec.

---

## 1. Angular version support — backport to 17–20?

- **Default recommendation:** 21-only.
- **Decision:** **Accept — 21-only.**
- **Rationale:** The spec is explicitly built on Angular 21 primitives: `FormValueControl<T>` from `@angular/forms/signals` (§6.3), signal-based public API (`input()`, `output()`, `model()`, `linkedSignal()` — §33), zoneless CD compatibility (§3), and `OutputEmitterRef` as the sole event surface (§33.5). Backporting to 17 removes Signal Forms entirely and forces shim layers around every signal input — a different product. The ngx-tw quality bar is Angular Material, which tracks current versions rather than maintaining multi-major compat shims. Consumers on 17–20 can pin to a future v0.x line if community demand appears; that is not v1 scope.
- **Sections affected:** §3 (Compatibility & Environment), §6.3 (Signal Forms), §7.3 (typing resolution using Signal Forms directives), §32.3 (OnPush + signal internals), §33 (API uses `input()` / `output()` / `model()`), §35.1 (Signal Forms typing test), §35.4 (zoneless), §38.1 (semver — Angular peer range becomes part of the public contract).

---

## 2. `@angular/cdk` as a peer dependency?

- **Default recommendation:** Yes.
- **Decision:** **Accept — declare `@angular/cdk` as a peer dependency.**
- **Rationale:** The ngx-tw charter is "compose CDK, don't reinvent it." The spec already requires CDK-shaped behavior across every interactive surface: Overlay with fallback positioning (§14.2), FocusTrap + focus return (§13, §15.4, §17), LiveAnnouncer for range/view announcements (§15.5), a11y primitives to meet WCAG 2.2 AA (§15), and CDK virtual scroll for the 12-pane year view (§32.3). Reimplementing any of these would cost more bytes than the CDK package contributes once tree-shaken, and would fail the "zero axe violations" bar (§35.2) on the first review. The §32.1 bundle budgets (≤35 KB gzipped core + native adapter) were authored assuming CDK is the overlay/a11y substrate.
- **Sections affected:** §3 (peer deps), §13 (overlay lifecycle — CDK Overlay), §14.2 (Overlay mode positioning), §15 (a11y — LiveAnnouncer, FocusMonitor, AriaDescriber), §17 (focus contract — FocusTrap), §23.4 / §32.3 (virtual scroll), §32.1 (bundle budget assumes CDK), §36.1 (`CalendarHarness` built on `ComponentHarness`).

---

## 3. `persistentStateId` — localStorage-backed state persistence

- **Default recommendation:** Defer to v1.1+.
- **Decision:** **Accept — defer. v1 ships only the in-memory `stateId`.**
- **Rationale:** The §8.6 in-memory `stateId` (scoped through `CalendarCoordinator`'s injector) already solves the concrete re-mount cases: `@if` toggles, route-component swaps, dialog reopens within a session. Cross-session persistence is a distinct feature with four hard problems that are not yet resolved in v1:
  1. Serialization depends on `valueTransformer` (§7.6), which is itself still a `[SHOULD]` and will stabilize during v1.
  2. Cache invalidation when `mode`, constraints, or adapter change is not specified.
  3. User-consent model (cookie-law / privacy) is a consumer concern that a library input cannot paper over.
  4. SSR/hydration interaction — a restored `viewState` must not conflict with the "overlay closed on hydration" invariant in §31.2.
  Shipping this in v1 would couple two maturing APIs (`valueTransformer` + persistence) at the worst moment. A v1.1 landing is low-risk because the input is additive.
- **Sections affected:** §8.6 (defines the feature), §7.6 (`valueTransformer` is a hard prerequisite), §31.2 (SSR — hydration must not restore `overlayState`), §33.1 (no `persistentStateId` input in v1), §42.2 (confirm listing under "deferred to future version" if not already there).

---

## 4. Mobile full-screen / responsive overlay mode

- **Default recommendation:** SHOULD ship in v1 for viewport < 600px, `mobileMode: 'auto'` default.
- **Decision:** **Accept — ship in v1 as `[SHOULD]`, default `mobileMode: 'auto'`.**
- **Rationale:** Booking flows are the primary persona (§1.1–§1.2), and mobile booking is where the current Angular date-picker ecosystem visibly fails — a cramped desktop overlay on a 375px viewport is a known anti-pattern. `mobileMode: 'auto'` gives zero-config consumers the right behavior (auto-detect <600px → fullscreen for overlay mode). The explicit values (`overlay | fullscreen | bottom-sheet | auto`) let power users opt out without the library prescribing. Gating this to v1.1 would push mobile-first consumers to a different library on day one, which defeats the product thesis.
- **Sections affected:** §18.5 (defines it), §18.6 (iOS safe-area composes with fullscreen), §9.5 (virtual-keyboard suppression composes with fullscreen trigger-tap), §13 (overlay lifecycle — positioning branches on `mobileMode`, close sequence unchanged), §15.4 (dialog a11y — focus trap + `role="dialog"` apply to fullscreen/bottom-sheet), §33.1 (`mobileMode: MobileMode` input, default `'auto'`), §35.2 / §35.5 (a11y + visual-regression coverage for each `mobileMode` value), §41 (add fullscreen acceptance criteria if not already present).

---

## 5. Non-Gregorian calendar adapters

- **Default recommendation:** Defer to v2+.
- **Decision:** **Accept — defer. v1 ships Gregorian only.**
- **Rationale:** §20.1 already requires the `DateAdapter` contract to be Gregorian-agnostic, so this is a purely additive feature in v2 — no breaking change risk. Doing it properly is a large scope: Hebrew leap-month math, Islamic observation-based vs. tabular variants, Japanese era boundaries (including the most recent Reiwa transition edge), Buddhist year offset, plus expanded `CalendarIntl` strings and an extended screen-reader matrix (§15.8). Attempting it during v1 would starve the core picker surface. The spec's `[SHOULD]` posture on non-7 week grids (§12.2) is the correct forward-compat hedge; v1 verifies the 7-day path and keeps the contract honest.
- **Sections affected:** §19.5 (defines it), §20.1 / §20.2 (adapter contract must stay Gregorian-agnostic — hardens the constraint), §12.2 (v1 ships tested CSS for 7-column grids only), §19.4 (`CalendarIntl` keys may grow when adapters land), §35.3 (locale/TZ test matrix — extend later), §42.2 (already listed as deferred; leave in place).

---

## 6. Which third-party date adapters ship in v1?

- **Default recommendation:** *(none stated in `open_decisions.md`)*. §43 of the spec recommends native + Luxon in v1; date-fns and Temporal in v1.1.
- **Decision:** **Accept the §43 stance — native + Luxon in v1. Defer date-fns and Temporal to v1.1.**
- **Rationale:**
  - **Native** is a `[REQ] [MUST]` already.
  - **Luxon** is the right second adapter: it is the only ecosystem choice with a mature, timezone-aware surface that cleanly maps to §4.2's opt-in TZ-aware adapter contract, has a stable API, and is widely adopted in Angular/Node shops doing booking and enterprise work (Luxon's use of Intl aligns with our SSR ICU requirement in §31.4).
  - **date-fns** is deferred because the v2 → v3 migration and the fragmented TZ story (`date-fns-tz` as a separate package) make the adapter surface less stable; a v1.1 slot lets us pick the right API shape once.
  - **Temporal** is deferred because browser support is still rolling out and polyfill maturity is uneven. A v1 dependency would force a polyfill bundle into consumer apps that may not want it. v1.1 is the right moment.
  Tree-shakability (§32.1) must still hold: each adapter ships as a separate secondary entry point so importing `ngx-tw/calendar/luxon` does not pull native adapter code and vice versa.
- **Sections affected:** §20.4 (shipped adapters list), §7.5 (serialization — Luxon/Temporal do not round-trip through strings; v1 Luxon respects this), §3 (Luxon added as optional peer dependency), §32.1 (bundle budget — each adapter tree-shakable, budgets measured against native-only), §35.1 (per-adapter unit tests for Luxon), §35.3 (DST and locale edge cases exercised against Luxon's TZ-aware path), §39.1 (docs — per-adapter setup guide).

---

## 7. Event-layer / schedule-mode customization

- **Default recommendation:** Explicitly defer from v1; reserve for a sibling v2+ component.
- **Decision:** **Accept — defer. v1 keeps Layer 1 (badges) and Layer 2 (cell template) only.**
- **Rationale:** §2's scope statement is load-bearing: "the component is a range-capable date picker, not a calendar surface." Schedule semantics — drag-create, drag-resize, multi-day event bars, lane packing for overlapping events — need a different layout model (overflow cells, lane allocation, gesture conflicts with range selection). Grafting that onto the picker grid distorts both products. Layer 1 (`BadgeConfig`) and Layer 2 (`cellTemplate` with full `DayCellContext`) are the correct extensibility ceiling for a picker: consumers who need richer cell content already have a TemplateRef, and the ARIA contract for sub-elements is their responsibility (§24.4). A sibling `schedule` component in v2 inherits `DateAdapter` and `CalendarIntl` cleanly.
- **Sections affected:** §2 (scope statement — reinforced), §24.3 Layer 3 (defined as WONT for v1), §24.1 (`DayCellContext` shape — stays picker-focused; no event-specific fields), §33.1 (no Layer-3 inputs), §42.1 (already lists interactive schedule mode + drag-to-create/resize + multi-day event bars as v2 sibling scope — keep as the canonical home for this decision).

---

## Summary table

| # | Topic | Default | Decision | Primary sections affected |
|---|---|---|---|---|
| 1 | Angular 17–20 backport | 21-only | **Accept** | §3, §6.3, §7.3, §32.3, §33, §35.1, §35.4, §38.1 |
| 2 | `@angular/cdk` peer dep | Yes | **Accept** | §3, §13, §14.2, §15, §17, §23.4, §32.1, §32.3, §36.1 |
| 3 | `persistentStateId` (localStorage) | Defer to v1.1+ | **Accept (defer)** | §8.6, §7.6, §31.2, §33.1, §42.2 |
| 4 | Mobile full-screen overlay | Ship v1, default `'auto'` | **Accept** | §9.5, §13, §15.4, §18.5, §18.6, §33.1, §35.2, §35.5, §41 |
| 5 | Non-Gregorian adapters | Defer to v2+ | **Accept (defer)** | §12.2, §19.4, §19.5, §20.1, §20.2, §35.3, §42.2 |
| 6 | Luxon / date-fns / Temporal in v1 | (none) → §43: native + Luxon | **Accept (native + Luxon v1; date-fns + Temporal v1.1)** | §3, §7.5, §20.4, §32.1, §35.1, §35.3, §39.1 |
| 7 | Event/schedule-mode cell layer | Defer to v2 sibling | **Accept (defer)** | §2, §24.1, §24.3, §33.1, §42.1 |

---

# Phase 0 — Refactoring-Plan Migration Shape

Source: `docs/calendar-refactoring-plan.md` §4 Phase 0. These six resolutions unblock the Phase 1 breaking cutover. Section numbers continue to refer to `docs/requirements/calendar-component-requirements.md` (v2.6) unless noted.

## 8. Back-compat inputs — remove vs. `@deprecated` no-ops

- **Candidates:** `withTime`, `timeFormat`, `showSeconds`, `hourStep`, `minuteStep`, `secondStep`, `minTime`, `maxTime`, `color`, `size`, `headerless`, `startAt`, `numberOfMonths` (as alias for `monthColumns`).
- **Default recommendation:** Remove outright.
- **Decision:** **Accept — remove all back-compat inputs at the Phase 1 cutover.**
- **Rationale:** The library is pre-1.0 and has no published `ngx-tw/calendar` consumers outside this repo. Keeping these as `@deprecated` no-ops would bloat the API surface, confuse JSDoc-driven Compodoc output, and create `[input() && no-op]` smells that consumers will file bugs against. Removing them costs one line in the Phase 1 migration note. Time-of-day (`withTime` and its eight dependants) is explicitly out of scope per §42.2; `color` / `size` / `headerless` were never wired to the variant system; `startAt` collapses into `activeDate` per §33.3; `numberOfMonths` is superseded by Phase 9's first-class multi-month surface. Clean break.
- **Sections affected:** §33.1 (input table loses twelve entries), §42.2 (time-of-day stays WONT), §43 decision rows that reference `startAt`.

## 9. Single `value` model vs. dual `selected` + `value`

- **Default recommendation:** Collapse to a single `value: ModelSignal<CalendarValue<M, D>>`.
- **Decision:** **Accept — single `value` model; drop `selected` and the `effect()`-driven mirror.**
- **Rationale:** The current component maintains two `model()` signals kept in lockstep by two `effect()`s writing each other — a textbook source of write feedback loops and one of the reasons `writeValue` has to poke both. §7.3 mandates `value` as the canonical consumer-facing contract, and the Signal Forms directives (§6.3) bind exactly to `value`. The `selected` alias was a legacy Material-picker convention; with no external consumers there is nothing to preserve. Collapsing removes ~40 lines of sync plumbing, guarantees the write order in §30.2 is observable from a single signal, and unblocks the `CalendarValue<M, D>` typing in Phase 1.
- **Sections affected:** §7.3 (typing resolution), §7.6 (`valueTransformer` applies at the `value` boundary), §8.3 (state table reads from a single source), §30.2 (emit order), §33.3 (public signal surface).

## 10. `selectionMode` → `mode`, `'multi'` → `'multiple'`, drop `'week'` from the surface

- **Default recommendation:** Follow the spec.
- **Decision:** **Accept — rename to `mode`, rename `'multi'` → `'multiple'`, drop `'week'` from the `mode` union. `WeekSelectionStrategy` stays available via DI.**
- **Rationale:** §5 is unambiguous: the union is `'single' | 'multiple' | 'range'`. `'week'` is explicitly `[WONT] v1` (§42.2), but the existing `WeekSelectionStrategy` + `provideWeekSelectionStrategy()` have a clean DI-based extension story and no incremental maintenance cost beyond what the strategy interface already carries — keeping them as a non-`MUST` advanced affordance lets us discharge the "extension point" use case without enlarging the `mode` surface. The rename is consistent with the rest of ngx-tw (`TwCalendarSelectionMode` becomes `CalendarMode`, colocated in `core/` so it does not force a calendar import on consumers who only want the shared color/size tokens).
- **Sections affected:** §5 (mode union), §7.1 (signature), §33.1 (`mode` input), §42.2 (week-as-unit stays WONT from the primary surface), §43 cross-refs.

## 11. `DateAdapter` method names — spec surface + 1-based month

- **Default recommendation:** Commit to spec names; switch `createDate` to a 1-based month contract.
- **Decision:** **Accept — rename in Phase 2; all internal call sites migrate in the same commit.**
- **Mapping:**
  - `addCalendarYears` → `addYears`
  - `addCalendarMonths` → `addMonths`
  - `addCalendarDays` → `addDays`
  - (new) `addHours`, `addMinutes`
  - `compareDate` → `compare`
  - `createDate(year, zeroBasedMonth, day)` → `create(year, oneBasedMonth, day)`
  - `toIso8601` → `toIso`; add `fromIso`
  - Add `startOfWeek`, `endOfWeek`, `startOfDay`, `getDaysInWeek`, `getDateNames(style)`
  - Add optional TZ virtuals: `getTimezone`, `withTimezone`, `isDST`, `resolveAmbiguous`
  - Remove `withTime` from the adapter (time-of-day is out of scope per §42.2).
- **Rationale:** §20.2 freezes the public adapter shape a downstream Luxon / Temporal / date-fns adapter author must implement. Spec-shaped method names make those adapters drop-in. The 1-based-month switch is the single riskiest rename because it is silent at compile time — Phase 2's acceptance test (`create(2026, 1, 1)` equals the old `createDate(2026, 0, 1)` for the same DOM output) catches it. Because there are no external `DateAdapter` implementations yet, this is a one-time cost localized to `NativeDateAdapter`. TZ hooks ship as **optional virtuals** (default to floating / pass-through behavior) so the native adapter does not take on timezone scope it does not implement.
- **Sections affected:** §4.1–§4.3 (TZ contract surface), §20.1 (adapter contract), §20.2 (required methods), §20.4 (third-party adapters — Luxon implements the full surface including TZ virtuals), §35.3 (DST matrix).

## 12. View naming — spec `'day' | 'month' | 'year'` replaces impl `'month' | 'year' | 'multi-year'`

- **Default recommendation:** Adopt spec names. The existing `month` view becomes `day`; `multi-year` becomes `year`; the current `year` view becomes `month`.
- **Decision:** **Accept — rename in Phase 1 as part of the public-API cutover.**
- **Rename map:**
  - Impl `CalendarView = 'month' | 'year' | 'multi-year'` → spec `CalendarViewState = 'day' | 'month' | 'year'`.
  - Impl `MonthViewComponent` (7×6 day grid) → keeps file/class name; selector stays `tw-calendar-month-view`; it is now the `'day'` view. *Note: the class name is deliberately kept — the component renders a calendar **month**, so `MonthViewComponent` remains the correct name; only the view-state token it answers to changes. This keeps the view-component naming convention consistent with Material's `MatMonthView`.*
  - Impl `YearViewComponent` (4×3 month grid) → keeps file/class name; it is now the `'month'` view (user is picking a month).
  - Impl `MultiYearViewComponent` (4×6 year grid) → renamed to `YearsViewComponent` (plural) for the `'year'` view. *Rationale for renaming this one specifically: the component name "`MultiYear`" is a spec-impl leak — the spec treats it as the `year` picker regardless of page size. Keeping `MultiYearViewComponent` would invert the impl/spec semantics on the one place they now align.*
  - `yearsPerPage` input (default 20 per §33.1, not 24) gates the page size shown by `YearsViewComponent` — this replaces the current hardcoded `YEARS_PER_PAGE = 24` constant (see Phase 7 deliverable).
- **Rationale:** The spec's `'day' | 'month' | 'year'` convention is what consumers will read in `viewState`, `startView`, `viewChange.from|to`, and `rangeGranularity`. Every reference in the spec uses those tokens. Keeping the impl's `multi-year` creates a permanent vocabulary mismatch between the code and every demo page, every API table, and the migration guide. The rename is localized to one `type` export and three template `@switch` arms, so the diff stays small.
- **Sections affected:** §7.4 (view type), §22.4 (granularity × view matrix uses `'day' | 'month' | 'year'`), §22.6 (`viewChange` payload), §33.1 (`startView`, `rangeGranularity`), §33.3 (`viewState`).

## 13. Dropping `'week'` from the `mode` surface — clarification

This is covered by Decision #10 above but warrants a separate line for the `WeekSelectionStrategy` extension point:

- **`CalendarSelectionStrategy<D, S>` abstract class and `CALENDAR_SELECTION_STRATEGY` DI token remain public** as a non-`[MUST]` advanced affordance. Documented as "custom non-range selection patterns" — week-of-month, multi-interval, business-day patterns.
- **`SingleSelectionStrategy` / `MultipleSelectionStrategy` / `RangeSelectionStrategy` become internal** after Phase 6 (§6.6 in the plan's open-decisions block says "Recommend: keep as advanced extension" — we are keeping only the abstract surface public, not the three built-ins, because Phase 6 migrates range-state ownership into the orchestrator).
- **`WeekSelectionStrategy` and `provideWeekSelectionStrategy()` stay exported** as the one ready-made example of a custom strategy. Renaming to match the new internal naming (if any) happens during Phase 6.

## Phase 0 summary

| # | Topic | Decision | Land in phase |
|---|---|---|---|
| 8 | Remove back-compat inputs | **Accept — remove** | 1 |
| 9 | Single `value` model | **Accept — drop `selected` alias** | 1 |
| 10 | `selectionMode`→`mode`; `'multi'`→`'multiple'`; drop `'week'` from surface | **Accept** | 1 |
| 11 | `DateAdapter` spec-shape rename + 1-based month + TZ virtuals | **Accept** | 2 |
| 12 | View naming `'day' \| 'month' \| 'year'` | **Accept** | 1 |
| 13 | `WeekSelectionStrategy` stays as advanced DI-only affordance | **Accept** | 1 (surface), 6 (internals) |

No ambiguity remains for Phase 1 / Phase 2 to execute against.
