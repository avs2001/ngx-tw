# ngx-tw Library Fix Plan

**Source:** [`library-audit-report.md`](./library-audit-report.md) — 1 CRITICAL, 46 MAJOR, ~108 MINOR/NIT across 49 entry points.
**Goal:** turn every audit finding into a landed PR. Execution-ready: every PR lists files to change, acceptance criteria, dependencies, and effort tier.

---

## Overview

The plan is **7 phases / 21 PRs**. Three foundational PRs (1, 2, 3) must land before most of the rest — they unblock dependent fixes. After that, work parallelizes heavily.

| Phase | PRs | Purpose | Blocks | Can parallelize? |
|---|---|---|---|---|
| 1 | PR1 | CRITICAL fix | — | — |
| 2 | PR2 | Ruleset / CLAUDE.md alignment | unblocks Phase 5 / 7 | sequential |
| 3 | PR3 | Theme `on-{role}` tokens | unblocks PR4 / PR5 | sequential |
| 4 | PR4–PR6 | A11y & color sweep | depends on PR2 + PR3 | yes (3-way parallel) |
| 5 | PR7–PR9 | API reshape | depends on PR2 | yes (3-way parallel) |
| 6 | PR10–PR12 | Modernization & backfill | depends on PR2 | yes (3-way parallel) |
| 7 | PR13–PR21 | MINOR/NIT cleanup sweeps | depends on PR2 | yes (9-way parallel — one PR per audit group) |

**Effort tiers:** S = <2h, M = half day, L = full day, XL = multi-day. Estimates assume one engineer familiar with the codebase.

**Total effort estimate:** ~5–8 engineer-days for Phases 1–6 (must-do). Phase 7 cleanup is another ~3–5 days, fully parallelizable across the team.

---

## Phase 1 — Critical fix

### PR1: stepper panel — restore focus indicator (CRITICAL — C1)

**Why:** keyboard users land on a focusable `<div tabindex="0" outline-none>` with no visible indication of focus. WCAG AA failure.

**Files to change:**
- `projects/ngx-tw/stepper/stepper.ts:105,113` — `stepPanel` slot in the `tv()` config
- `projects/ngx-tw/stepper/stepper.spec.ts` — add focus-visible assertion

**Implementation:**
```ts
stepPanel: 'rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 motion-reduce:transition-none'
```
Alternative: remove `tabindex="0"` from the panel if the CDK tab pattern doesn't require panel-level focus (verify against CDK stepper spec first).

**Acceptance criteria:**
- [ ] Panel has a visible focus ring when Tab-focused
- [ ] Spec asserts `focus-visible:outline-*` classes are applied
- [ ] AXE no longer flags the panel
- [ ] `vitest run stepper` green

**Effort:** S · **Dependencies:** none · **Risk:** low

---

## Phase 2 — Foundational policy alignment

### PR2: CLAUDE.md + ruleset + project memory (foundational)

**Why:** the audit found 6 systemic patterns that account for ~30 MAJOR findings. Most resolve by codifying exceptions in CLAUDE.md instead of refactoring code. **This PR must land first** — subsequent per-component PRs cite the codified exceptions.

**Files to change:**
- `.claude/CLAUDE.md` — append new sections to Library Structure, Visual Design System (Icon Sizing), API Design, Accessibility
- `docs/library-audit-ruleset.md` — update affected rules to reflect new exceptions
- Project memory: 3 new entries under `~/.claude/projects/-Users-ciprianiuga-dev-sandbox-ngx-tw/memory/`:
  - `feedback_input_count_form_control.md` — form controls may exceed 5–6 inputs (ARIA + forms baseline ~12)
  - `feedback_input_count_structural.md` — structural-layout primitives may exceed cap
  - `feedback_input_count_data.md` — data primitives may exceed cap
- Update `MEMORY.md` index accordingly

**Decisions to bake in** (this PR makes these explicit so the rest of the plan can execute mechanically):

| Decision | Recommended | Rationale |
|---|---|---|
| Form-control input-count exception | **Codify** | Floor of ~12 ARIA + forms inputs is real; reshape would harm API ergonomics |
| Structural-layout input-count exception | **Codify** (canonical: split) | 10 inputs on split = 10 independent axes |
| Data-primitive input-count | **Reshape table** (v2 grouping already planned at `table.ts:663-667`) | Table genuinely has 4 axes; group them |
| `avatar`/`icon` input count | **Reshape** (collapse correlated inputs) | These are visual primitives; 7-8 is genuinely too many |
| `progress-bar` 12 inputs | **Reshape** | Consolidate `min`/`max`/`step`/`value` → `range` object |
| Icon-size scale | **Widen ruleset** | Add 3 sub-scales: button-target (`size-6/7/8/9`), dot (`size-2/2.5/3`), half-step (`size-3.5`) |
| `Tw*` class prefix on components | **Rename to drop prefix** | CLAUDE.md is clear; library should align. Affects `TwSplit*`, `TwCalendarPresets` |
| Menu-item focus indicator | **Codify carve-out** | Background-shift focus is industry-standard for `role="menuitem*"` |
| Boolean default `true` exception | **Codify** with rationale tag | `spinner.track`, `accordion.collapsible`, `calendar.{bordered, allowSingleDayRange, persistPartialRange, showAdjacentMonths}` all defensible |
| `TW_ERROR_STATE_MATCHER` `providedIn:'root'` | **Codify exception** for policy tokens (not services) | Pragmatic; the token isn't a stateful service |

**Acceptance criteria:**
- [ ] CLAUDE.md updated with new exceptions, each citing the canonical example component
- [ ] Ruleset updated; severity tags adjusted on affected rules
- [ ] 3 new memory entries written + indexed
- [ ] Each decision has a one-line rationale in the doc

**Effort:** M (mostly writing/decisions, not code) · **Dependencies:** none · **Risk:** low (text-only changes)

---

## Phase 3 — Foundational theme tokens

### PR3: add `--color-on-{role}` semantic tokens

**Why:** the only raw-palette usage in the entire library is `text-white` (stepper + 3 calendar cell states) — used as foreground against `primary-500` fills. Adding semantic `on-{role}` tokens fixes both sites cleanly, dark-mode-safe by construction, and fills a real gap in the theme surface.

**Files to change:**
- `projects/ngx-tw/theme/_semantic.css` — define `--color-on-{role}` for all 8 roles (info, success, warning, error, primary, secondary, accent, neutral)
- `projects/ngx-tw/theme/_dark.css` — dark-mode overrides if any need to flip
- `projects/ngx-tw/theme/_high-contrast.css` — same
- `projects/ngx-tw/theme/theme.types.ts` — if any type tracks role names, sync

**Implementation note:** for solid `{role}-500` fills, contrast usually requires near-white text in light mode AND near-white text in dark mode (since `{role}-500` doesn't darken much between modes). Verify per-role with the AA contrast tool before locking values.

**Acceptance criteria:**
- [ ] All 8 `on-{role}` tokens defined in `_semantic.css`
- [ ] Dark-mode + high-contrast variants where needed
- [ ] Pass AA contrast against the matched `{role}-500` fill
- [ ] No consumer of `text-white` against `{role}-500` remains in the library (verified by grep)
- [ ] Theme spec extended with token-presence assertion

**Effort:** S · **Dependencies:** none (parallelizable with PR2) · **Risk:** low

---

## Phase 4 — A11y & color sweep (parallel after PR2 + PR3)

### PR4: calendar comprehensive a11y + naming refactor

**Why:** the calendar is otherwise reference-quality but ships 4 MAJOR findings clustered in a11y + naming. Single PR closes all of them.

**Files to change:**
- `projects/ngx-tw/calendar/calendar.ts:177-179` — drop hand-rolled `<div aria-live>`, inject CDK `LiveAnnouncer`
- `projects/ngx-tw/calendar/calendar.ts` — every `liveAnnouncement.set(...)` → `liveAnnouncer.announce(message, 'polite')` (search for `announceViewChange`, `announceNavigation`, `announceRangeStart`, `announceSelection`)
- `projects/ngx-tw/calendar/month-view.ts:36`, `year-view.ts:26`, `multi-year-view.ts:29` — add `[attr.aria-multiselectable]="multiSelectable() || null"` to each `role="grid"` host div
- `projects/ngx-tw/calendar/calendar-view-base.ts` — add `multiSelectable` input thread-down
- `projects/ngx-tw/calendar/calendar-cell.ts:44,48,56` — `text-white` → `text-on-primary` (depends on PR3)
- `projects/ngx-tw/calendar/calendar-presets.ts:14` — rename `TwCalendarPresets` class → `CalendarPresetsDirective` (selector `[twCalendarPresets]` unchanged)
- `projects/ngx-tw/calendar/index.ts` — update export
- `projects/ngx-tw/calendar/calendar.spec.ts` — update affected assertions

**Acceptance criteria:**
- [ ] No `<div aria-live>` remains in calendar.html templates; `LiveAnnouncer` used throughout
- [ ] All three grid views set `aria-multiselectable="true"` when `mode ∈ {multiple, range}`
- [ ] No `text-white` in `calendar-cell.ts`; visual unchanged
- [ ] `CalendarPresetsDirective` exported; consumers using `[twCalendarPresets]` selector unaffected
- [ ] Calendar spec green; LiveAnnouncer spy assertions added

**Effort:** M · **Dependencies:** PR2 (class-prefix decision), PR3 (on-primary token) · **Risk:** low (well-bounded refactor)

### PR5: focus-indicator hygiene sweep

**Why:** `select` listbox and (depending on PR2 menu-item decision) menu items don't conform to canonical focus ring.

**Files to change:**
- `projects/ngx-tw/select/select.ts` — listbox container, replace `focus:outline-none` with paired `focus-visible:outline-*`
- `projects/ngx-tw/menu/menu.ts:42` — apply Phase 2 decision (likely **no change** — codified carve-out covers this); if Phase 2 went the other way, add canonical ring alongside background change
- `projects/ngx-tw/stepper/stepper.ts:157,161-173,177-184` — `text-white` → `text-on-primary` (overlaps PR3-dependent work; can land here OR in PR4)
- Specs updated

**Acceptance criteria:**
- [ ] `select` listbox shows focus-visible ring on keyboard focus
- [ ] `menu` matches Phase 2 decision exactly
- [ ] `stepper` indicator no longer uses `text-white`
- [ ] No regression in disabled/loading state visuals

**Effort:** S · **Dependencies:** PR2 (menu decision), PR3 (on-primary token) · **Risk:** low

### PR6: `Tw*` class rename across split

**Why:** Phase 2 decided to align with CLAUDE.md ("no manual prefix on component/directive classes"). Apply mechanically.

**Files to change:**
- `projects/ngx-tw/split/split.ts:223` — `TwSplit` → `SplitComponent`
- `projects/ngx-tw/split/split-pane.ts:30` — `TwSplitPane` → `SplitPaneComponent`
- `projects/ngx-tw/split/split-gutter.ts:22` — `TwSplitGutter` → `SplitGutterDirective`
- `projects/ngx-tw/split/split-pane-header.ts:11` — `TwSplitPaneHeader` → `SplitPaneHeaderDirective`
- `projects/ngx-tw/split/index.ts` — re-export under new names
- `projects/ngx-tw/split/split.spec.ts` — sweep import names
- All demo usages (`projects/demo/src/app/routes/split/**`) — sweep
- Selectors (`tw-split`, `tw-split-pane`, `[twSplitGutter]`, `[twSplitPaneHeader]`) **stay unchanged** — only class identifiers change

**Acceptance criteria:**
- [ ] `grep -r 'TwSplit' projects/ngx-tw` returns no class-identifier matches
- [ ] Selectors still match templates throughout
- [ ] Demo routes still compile and render identically
- [ ] Spec green

**Effort:** S · **Dependencies:** PR2 (decision) · **Risk:** medium (rename touches many import sites — sweep carefully)

---

## Phase 5 — API reshape (parallel after PR2)

### PR7: progress-bar API consolidation (12 → ~6 inputs)

**Why:** progress-bar's 12 inputs are not a baseline-ARIA floor — they include genuinely over-decomposed knobs. Form-control exception doesn't apply.

**Files to change:**
- `projects/ngx-tw/progress-bar/progress-bar.ts:190-223` — consolidate inputs
- Spec
- Demo `projects/demo/src/app/routes/progress-bar/**`

**Recommended grouping:**
- Keep: `value`, `variant`, `color`, `size`, `label`, `indeterminate`
- Group: `min`/`max`/`step` → single `range: { min, max, step }` input
- Drop or merge: any decorative-only inputs that overlap with `variant`

**Acceptance criteria:**
- [ ] Public input count ≤ 6
- [ ] All existing demo usages remain valid (input config-object form accepts undefined defaults)
- [ ] Spec covers the new shape; old assertions adapted
- [ ] No visual regression

**Effort:** M · **Dependencies:** PR2 (confirms we're refactoring, not exempting) · **Risk:** medium (consumer-visible API change — document as breaking)

### PR8: table v2 input grouping (already planned)

**Why:** `table.ts:663-667` already has a TODO referencing v2 input grouping. Execute it.

**Files to change:**
- `projects/ngx-tw/table/table.ts:686-758` (TableComponent inputs) — group into `appearance`, `sticky`, `responsive`, `selection`
- `projects/ngx-tw/table/table.ts:532-562` (ColumnComponent inputs) — group into `display: { sticky, align, numeric, hideBelow, width }`
- `projects/ngx-tw/table/table.html` — bind to new structures
- `projects/ngx-tw/table/table.spec.ts` — update fixtures
- Demo `projects/demo/src/app/routes/table/**`
- Optional: rename `rowClick` → `rowClicked` per dual output convention (breaking)

**Acceptance criteria:**
- [ ] TableComponent ≤ 6 top-level inputs; nested config objects accept partial overrides
- [ ] ColumnComponent ≤ 6 top-level inputs
- [ ] Demo updated to new shape
- [ ] Spec green
- [ ] Migration note in changelog

**Effort:** L · **Dependencies:** PR2 · **Risk:** high (most extensive consumer-API change in the plan — ship as v2 breaking change; document migration carefully)

### PR9: avatar + icon API consolidation

**Why:** avatar (7 inputs) and icon (8 inputs) are visual primitives; the inputs are not ARIA-baseline. Recommended to reshape rather than codify a fourth exception.

**Files to change:**
- `projects/ngx-tw/avatar/avatar.ts:124-142` — consolidate
- `projects/ngx-tw/icon/icon.ts:100-122` — consolidate
- Both specs
- Demo routes

**Suggested merges** (verify per-component before locking):
- **avatar:** merge `src`/`alt`/`fallback` into a single `image: { src, alt, fallback }` config? Or pull avatar-group concerns into a separate `tw-avatar-group` parent.
- **icon:** drop or merge `aria-label` / `aria-labelledby` / `aria-hidden` into a single `a11y: { label, hidden }` config; keep `name`, `size`, `color`, `variant` as flat.

**Acceptance criteria:**
- [ ] avatar ≤ 6 inputs
- [ ] icon ≤ 6 inputs
- [ ] All existing demo usages remain valid
- [ ] Specs green
- [ ] No visual regression

**Effort:** M · **Dependencies:** PR2 · **Risk:** medium (breaking; document)

---

## Phase 6 — Modernization & backfill (parallel after PR2)

### PR10: command-palette `*ngTemplateOutlet` modernization

**Files to change:**
- `projects/ngx-tw/command-palette/command-palette-overlay.html:25,48,71` — replace 3 instances of `<ng-container *ngTemplateOutlet="tpl; context: ctx" />` with `<ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="ctx" />`

**Acceptance criteria:**
- [ ] No `*ngTemplateOutlet` structural form in command-palette
- [ ] Spec green
- [ ] Visual unchanged

**Effort:** S · **Dependencies:** none (could land Phase 1 even) · **Risk:** trivial

### PR11: spec + JSDoc backfill

**Files to change:**
- Create `projects/ngx-tw/core/time-utils.spec.ts` — cover `padTwo`, `to12h`/`from12h` round-trip, `fieldMax/Min`, `appendDigit` (3-digit overflow), `isTerminalDigit`, `stepWithWrap` (forward/reverse/wrap/step≤0), `clamp`, `parseField`, `timeOfDaySeconds`
- Create `projects/ngx-tw/core/error-state-matcher.spec.ts` — cover null control, pristine+untouched, invalid+dirty, invalid+submitted, invalid+untouched
- Create `projects/ngx-tw/calendar/selection/week-selection-strategy.spec.ts` — `weekRange` across DST + `getFirstDayOfWeek()` rotation
- Create `projects/ngx-tw/calendar/testing/calendar-harness.spec.ts` — test-of-tests for harness methods
- `projects/ngx-tw/segmented-control/segmented-control.spec.ts` — add template-driven + signal forms cases (reactive already covered)
- `projects/ngx-tw/theme/theme.directive.ts:11` — JSDoc for `twTheme` input
- `projects/ngx-tw/theme/theme.service.ts:38,39` — JSDoc for `isLight`, `isHighContrast`
- `projects/ngx-tw/theme/theme.service.ts:41-48` — JSDoc for `state`
- `projects/ngx-tw/theme/theme.config.ts:5,7` — JSDoc for `THEME_CONFIG`, `provideTheme`
- `projects/ngx-tw/theme/theme.types.ts:18-25` — JSDoc on `ThemeState` fields
- `projects/ngx-tw/split/split-sizing.ts:12` — JSDoc for `clampSize`; field JSDoc for `PaneConstraints`

**Acceptance criteria:**
- [ ] 4 new spec files green
- [ ] segmented-control spec adds explicit template-driven and signal-forms describes
- [ ] No public input/method on theme/ lacks JSDoc (Compodoc API tables fully populated)
- [ ] Coverage report no longer flags time-utils.ts / error-state-matcher.ts / week-selection-strategy.ts as uncovered

**Effort:** L · **Dependencies:** none · **Risk:** low

### PR12: CalendarHarness stability + public-api adjustments

**Files to change:**
- `projects/ngx-tw/calendar/testing/calendar-harness.ts:163-169` — replace DOM-index destructure with `aria-label`-based lookup OR add `data-cdk-header-button` attribute to header buttons
- `projects/ngx-tw/calendar/calendar-header.ts:38-92` — add `[attr.data-cdk-header-button]="..."` to each button if going the data-attribute route
- `projects/ngx-tw/calendar/testing/calendar-harness.ts:115-135` — `pressKey` no-target fallback → throw descriptive error
- `projects/ngx-tw/src/public-api.ts` — **decide and document**: re-export `ngx-tw/icon/lucide` or formalize as opt-in sub-entry only. Recommendation: leave as opt-in (intentional adapter pattern) and add a README note.

**Acceptance criteria:**
- [ ] Header-button locator survives template reordering (verified by adding a dummy reorder in spec)
- [ ] `pressKey` throws clear error when no cell owns focus
- [ ] Public-api decision documented in `projects/ngx-tw/README.md` and `library-audit-report.md` decision row

**Effort:** S · **Dependencies:** none · **Risk:** low

---

## Phase 7 — MINOR/NIT cleanup sweeps (parallel; one PR per audit group)

Each PR sweeps a single group file's MINOR + NIT items. Highly parallelizable — distribute to team or batch alongside related work.

| PR | Group file | Indicative count | Top items |
|---|---|---|---|
| **PR13** | [group-1-foundations.md](./audits/group-1-foundations.md) | 10 MINOR + 7 NIT | `ButtonIconDirective` manual class concat → `tv()` (`button.ts:201-206`); alert `pr-10` outside `tv()`; avatar-group host class building |
| **PR14** | [group-2-visual.md](./audits/group-2-visual.md) | 12 MINOR | spinner `size-[1em]` → theme utility; flip-card `duration-[400ms]` → `duration-500`; accordion + spinner boolean defaults (after PR2 codifies exception) |
| **PR15** | [group-3-form-controls.md](./audits/group-3-form-controls.md) | 17 MINOR + 5 NIT | `checkbox.ts:36` `rounded-[3px]` → `rounded-sm`; slider extract 143-line inline template → `slider.html`; form-field `top-[calc(...)]` / `max-w-[calc(...)]` |
| **PR16** | [group-4-pickers.md](./audits/group-4-pickers.md) | 11 MINOR/NIT | time-picker meridiem hard-coded `primary-500` → respect `color` input; date-range-picker `min-w-[10rem]`; remove `!`-important overrides on tw-calendar (add `bordered: false` variant) |
| **PR17** | [group-5-layout-nav.md](./audits/group-5-layout-nav.md) | 21 MINOR | paginator size scale alignment (after PR2 sub-scale); various Tailwind class consolidations |
| **PR18** | [group-6-data-items.md](./audits/group-6-data-items.md) | 7 MINOR | sort-header padding scale + arrow `size-3.5`; sort template `*ngTemplateOutlet` → property form; menu xs padding; stepper JSDoc "Defaults to …" clauses |
| **PR19** | [group-7-overlays.md](./audits/group-7-overlays.md) | 10 MINOR/NIT | dialog/toast minor polish; command-palette polish |
| **PR20** | [group-8-infra.md](./audits/group-8-infra.md) | 9 MINOR/NIT | core specs already in PR11; theme JSDoc already in PR11; theme hardcoded backdrop alphas (`_base.css:105,170`) → tokenize; split chevron size (after PR2 widening); split `h-[3px]`/`w-[3px]` document or align |
| **PR21** | [group-9-calendar.md](./audits/group-9-calendar.md) | 11 MINOR + 6 NIT | `month-view.ts:41,54` `gap-0` document as approved exception; calendar `setTimeout` in `flashInvalid` → `effect()`; experimental inputs gated for Compodoc; calendar liveRegion slot cleanup (already covered by PR4) |

**Each PR's acceptance criteria template:**
- [ ] Every MINOR + NIT item in the group file is either fixed or formally deferred with a one-line rationale in the file's footer
- [ ] Group spec(s) green
- [ ] No visual regression (compare demo routes)

**Effort:** S–M each · **Dependencies:** PR2 (some items only resolvable after codified exceptions) · **Risk:** low

---

## Dependency graph

```
                            ┌──────────────┐
                            │  PR1 stepper │  (P0 CRITICAL, ships independently)
                            └──────────────┘

PR2 CLAUDE.md ────────────────────────────────┬──────────────┬──────────────┐
                                              │              │              │
PR3 on-{role} tokens ──┬──────────┬───────────┤              │              │
                       │          │           │              │              │
                       ▼          ▼           ▼              ▼              ▼
                     PR4        PR5         PR6 split    PR7–PR9       PR13–PR21
                  calendar   focus ring    Tw* rename   API reshape    cleanup sweep
                                                                   (9 parallel)

                            PR10–PR12 modernization & backfill (parallel after PR2)
```

**Critical path:** PR2 → PR3 → PR4 → done. Worst-case sequential = ~4 days.
**Parallel optimum:** with 2-3 engineers, full plan lands in ~1 week.

---

## Recommended execution order

**Day 1 (sequential):**
1. PR1 (stepper CRITICAL) — close before anything else
2. PR2 (CLAUDE.md alignment) — start in parallel with PR3 if possible
3. PR3 (theme tokens) — close so PR4/PR5 unblock

**Day 2–3 (parallel):**
4. PR4 (calendar a11y) — largest of Phase 4
5. PR5 (focus-ring sweep) — small
6. PR6 (Tw* rename) — small, mechanical
7. PR7 (progress-bar reshape) — medium
8. PR10 (command-palette modernization) — trivial; can sneak in anytime
9. PR11 (spec/JSDoc backfill) — start early, run in background

**Day 4–5 (parallel):**
10. PR8 (table v2) — heaviest of Phase 5; consider its own branch + careful changelog
11. PR9 (avatar/icon reshape) — breaking; align with table
12. PR12 (harness stability) — small

**Day 5+ (fully parallel, one engineer per PR):**
13. PR13–PR21 (cleanup sweeps) — distribute or batch alongside related feature work

---

## Risk register

| Risk | PR(s) | Mitigation |
|---|---|---|
| PR2 decisions invalidated mid-execution | PR2 | Get explicit sign-off before opening dependent PRs |
| PR8 table reshape is API-breaking | PR8 | Mark as v2.0.0 release; ship migration guide; consider keeping a thin compat layer for 1 release |
| PR9 avatar/icon API-breaking | PR9 | Same as PR8 |
| PR6 Tw* rename breaks consumer code | PR6 | Verify with grep + run demo routes; selectors unchanged, so templates safe; only class identifiers change |
| PR3 contrast values fail AA | PR3 | Use Tailwind's color contrast tool per role; iterate before locking |
| PR4 LiveAnnouncer timing differs from manual aria-live | PR4 | Watch for "announcer too verbose" or "announcer missed announcement" — `politeness: 'polite'` matches existing behavior |
| Phase 7 cleanup PRs touching same file | PR13–PR21 | Group files don't overlap; PRs are file-disjoint by construction |

---

## Execution tracker

Copy this section into your issue tracker / GitHub project board. Each row maps to one PR.

| # | Phase | Title | Status | Owner | Effort | Blocked by |
|---|---|---|---|---|---|---|
| PR1 | 1 | Stepper focus indicator | 🔵 Review | — | S | — |
| PR2 | 2 | CLAUDE.md alignment | ✅ Merged | — | M | — |
| PR3 | 3 | `on-{role}` semantic tokens | ✅ Merged | — | S | — |
| PR4 | 4 | Calendar a11y + naming | ✅ Merged | — | M | PR2, PR3 |
| PR5 | 4 | Focus-ring hygiene sweep | ✅ Merged | — | S | PR2, PR3 |
| PR6 | 4 | `Tw*` rename across split | ☐ Open | — | S | PR2 |
| PR7 | 5 | progress-bar reshape | ☐ Open | — | M | PR2 |
| PR8 | 5 | table v2 input grouping | ☐ Open | — | L | PR2 |
| PR9 | 5 | avatar/icon reshape | ☐ Open | — | M | PR2 |
| PR10 | 6 | command-palette modernization | ☐ Open | — | S | — |
| PR11 | 6 | Spec + JSDoc backfill | ☐ Open | — | L | — |
| PR12 | 6 | Harness stability + public-api | ☐ Open | — | S | — |
| PR13 | 7 | Group 1 cleanup | ☐ Open | — | S | PR2 |
| PR14 | 7 | Group 2 cleanup | ☐ Open | — | S | PR2 |
| PR15 | 7 | Group 3 cleanup | ☐ Open | — | M | PR2 |
| PR16 | 7 | Group 4 cleanup | ☐ Open | — | S | PR2 |
| PR17 | 7 | Group 5 cleanup | ☐ Open | — | M | PR2 |
| PR18 | 7 | Group 6 cleanup | ☐ Open | — | S | PR2 |
| PR19 | 7 | Group 7 cleanup | ☐ Open | — | S | — |
| PR20 | 7 | Group 8 cleanup | ☐ Open | — | S | PR2, PR11 |
| PR21 | 7 | Group 9 cleanup | ☐ Open | — | S | PR4 |

**Total: 21 PRs · Critical path ~4 days · Parallel optimum ~1 week with 2-3 engineers.**

---

## Notes for the implementer

- **Run `vitest` per package** after each PR (`pnpm vitest --project ngx-tw <component>`) before opening.
- **Visual regression:** there is no Chromatic-style infra in the audit's known surface; smoke-test affected demo routes manually before merge.
- **Changelog:** PR2, PR7, PR8, PR9 are public-API-affecting — call out in the changelog with a migration note. The rest are internal.
- **Commit format:** the project uses scoped/imperative commit messages (see `e2e(hardening): …` recent history). Keep that style.
