# Test & Demo-Documentation Coverage Audit

**Repo:** `ngx-tw` · **Branch:** `develop` @ `69d3711` · **Date:** 2026-09-02
**Scope:** library specs (`projects/ngx-tw/**/*.spec.ts`), demo routes (`projects/demo/src/app/`), e2e suite (`e2e/`)
**Rules of record:** `.claude/CLAUDE.md` § Testing · `.claude/skills/demo-doc-page/SKILL.md`

---

## Executive summary

The library is **well tested by volume** — 2,672 library tests across 55 component entry points, every entry point has at least one spec, and the Vitest-rule hygiene is essentially perfect (zero `fakeAsync`, zero Jasmine spies, zero missing `vitest` imports). The four `NG_VALIDATORS` guard specs that CLAUDE.md calls "the only thing standing between this trap and a silent regression" **all exist and all genuinely assert error codes**.

The real risks are not in the unit specs. They are:

1. **HIGH — a drift guard that has never executed.** `e2e/support/routes.ts` documents itself as protected by `projects/demo/src/app/app.routes.spec.ts`, which "fails the build if they diverge." Nothing ever runs that spec. The lists have already drifted by 5 components, and those 5 have **zero e2e coverage of any kind**.
2. **HIGH — 3 outputs are never referenced by any test**, and one unit test contains no assertion at all.
3. **MEDIUM — 21% of all library inputs (138 / 647) never appear in any spec.**
4. **MEDIUM — ~7% of tests are ceremonial** (cannot meaningfully fail), concentrated in the `variant`/`color`/`size` render loops.

---

## Method (read this before trusting a cell)

Dimension-1 cells are **derived mechanically** from per-spec marker greps, then **hand-verified on a sample**. They are not hand-read for all 55 components — 42k lines of spec would not survive an honest line-by-line claim.

| Cell | Derivation |
|---|---|
| Rendering | a mount/create/render/default test exists **and** every `variant`/`color`/`size` axis the component exposes has a matching `describe`/loop |
| Inputs/Outputs | share of declared `input()`/`model()`/`output()` identifiers that appear **anywhere** in the spec, alias- and kebab-aware. `COVERED` ≥85%. `PARTIAL*` = at least one **output** is never referenced at all |
| Interaction | count of `dispatchEvent` / `.click()` / `KeyboardEvent` / `.focus()` plus ≥1 disabled-state test. `N/A` when the source exposes no click/key/tabindex/interactive-role surface |
| A11y | ≥3 `getAttribute('aria-…')` assertions plus a `role` assertion or an accessibility `describe` |
| Projection | `N/A` when the source declares no `<ng-content>`; otherwise presence of projection/slot/fallback tests |
| CVA | `N/A` when not a `ControlValueAccessor`; `COVERED` requires value round-trip (`writeValue` **or** `setValue`/`patchValue`) **and** disabled handling (`setDisabledState` **or** `FormControl.disable()`) **and** a real `FormControl`/`ngModel` binding |

**Verification sample (22 spec files opened and checked against their derived cells):** `aspect-ratio`, `alert`, `button`, `calendar`, `checkbox`, `code-block`, `date-picker`, `date-range-picker`, `input`, `item`, `radio`, `select`, `slider`, `spinner`, `separator`, `split`, `switch`, `table`, `tags-input`, `textarea`, `timeline`, `toast`, `transfer`, `tree`, `theme`.

**The verification changed the results.** Five `Rendering: MISSING` cells (`table`, `flip-card`, `toast`, `aspect-ratio`, `theme`) and three `Projection: MISSING` cells (`code-block`, `tabs`, `toast`) were **regex false negatives** and were corrected. An earlier "missing `ariaLabel` input" list was **entirely false positives** — specs bind the `aria-label` *attribute*, not the `ariaLabel` identifier — and was discarded. Treat the **Projection** column as the least reliable; `Inputs/Outputs` and `CVA` as the most.

---

## 1. Coverage matrix

`COVERED` / `PARTIAL` / `MISSING` / `N/A` (not applicable to this component's shape).
`PARTIAL*` in Inputs/Outputs = **an output exists that no test references at all** — see §3.

| Component | #tests | Rendering | Inputs/Outputs | Interaction | A11y | Projection | CVA |
|---|---:|---|---|---|---|---|---|
| `accordion` | 31 | COVERED | COVERED | N/A | COVERED | MISSING | N/A |
| `alert` | 42 | COVERED | COVERED | PARTIAL | PARTIAL | COVERED | N/A |
| `aspect-ratio` | 12 | COVERED | COVERED | N/A | PARTIAL | N/A | N/A |
| `avatar` | 41 | COVERED | COVERED | N/A | COVERED | COVERED | N/A |
| `badge` | 38 | COVERED | COVERED | PARTIAL | COVERED | COVERED | N/A |
| `breadcrumbs` | 35 | COVERED | COVERED | N/A | COVERED | N/A | N/A |
| `button` | 27 | COVERED | COVERED | PARTIAL | COVERED | N/A | N/A |
| `calendar` | 282 | COVERED | PARTIAL | COVERED | COVERED | MISSING | COVERED |
| `card` | 26 | COVERED | COVERED | N/A | PARTIAL | COVERED | N/A |
| `carousel` | 32 | PARTIAL | PARTIAL | COVERED | COVERED | MISSING | N/A |
| `checkbox` | 68 | PARTIAL | COVERED | COVERED | COVERED | COVERED | COVERED |
| `code-block` | 34 | PARTIAL | COVERED | PARTIAL | COVERED | PARTIAL | N/A |
| `collapsible` | 44 | COVERED | COVERED | COVERED | COVERED | COVERED | N/A |
| `combobox` | 55 | PARTIAL | PARTIAL | COVERED | COVERED | COVERED | COVERED |
| `command-palette` | 55 | COVERED | COVERED | PARTIAL | COVERED | COVERED | N/A |
| `date-picker` | 64 | PARTIAL | PARTIAL | COVERED | COVERED | COVERED | COVERED |
| `date-range-picker` | 49 | PARTIAL | PARTIAL | COVERED | COVERED | MISSING | COVERED |
| `dialog` | 44 | PARTIAL | PARTIAL | PARTIAL | COVERED | N/A | N/A |
| `empty-state` | 33 | COVERED | COVERED | N/A | COVERED | COVERED | N/A |
| `file-upload` | 69 | PARTIAL | COVERED | PARTIAL | COVERED | COVERED | COVERED |
| `flip-card` | 36 | PARTIAL | COVERED | COVERED | COVERED | COVERED | N/A |
| `form-field` | 73 | COVERED | COVERED | PARTIAL | PARTIAL | COVERED | N/A |
| `icon` | 27 | COVERED | COVERED | N/A | COVERED | N/A | N/A |
| `input` | 33 | COVERED | COVERED | N/A | COVERED | N/A | N/A |
| `item` | 37 | COVERED | COVERED | COVERED | COVERED | COVERED | N/A |
| `menu` | 37 | COVERED | COVERED | N/A | COVERED | PARTIAL | N/A |
| `number-input` | 55 | COVERED | COVERED | COVERED | COVERED | PARTIAL | COVERED |
| `paginator` | 63 | PARTIAL | COVERED | COVERED | COVERED | N/A | N/A |
| `popover` | 43 | COVERED | PARTIAL | COVERED | COVERED | N/A | N/A |
| `progress-bar` | 33 | COVERED | COVERED | N/A | COVERED | N/A | N/A |
| `radio` | 71 | PARTIAL | PARTIAL | COVERED | COVERED | COVERED | COVERED |
| `segmented-control` | 56 | COVERED | COVERED | COVERED | COVERED | COVERED | COVERED |
| `select` | 50 | PARTIAL | PARTIAL* | COVERED | COVERED | PARTIAL | COVERED |
| `separator` | 19 | PARTIAL | COVERED | N/A | COVERED | COVERED | N/A |
| `sheet` | 49 | PARTIAL | PARTIAL | PARTIAL | COVERED | N/A | N/A |
| `skeleton` | 25 | COVERED | COVERED | N/A | COVERED | N/A | N/A |
| `slider` | 45 | PARTIAL | PARTIAL | COVERED | COVERED | N/A | PARTIAL |
| `sort` | 38 | PARTIAL | COVERED | COVERED | COVERED | COVERED | N/A |
| `spinner` | 19 | COVERED | COVERED | N/A | PARTIAL | N/A | N/A |
| `split` | 91 | COVERED | COVERED | COVERED | COVERED | PARTIAL | N/A |
| `stat` | 41 | PARTIAL | COVERED | N/A | COVERED | COVERED | N/A |
| `stepper` | 34 | PARTIAL | COVERED | COVERED | COVERED | COVERED | N/A |
| `switch` | 40 | PARTIAL | PARTIAL | COVERED | COVERED | COVERED | COVERED |
| `tab-nav` | 56 | COVERED | COVERED | COVERED | COVERED | COVERED | N/A |
| `table` | 52 | COVERED | PARTIAL* | MISSING | COVERED | COVERED | N/A |
| `tabs` | 50 | PARTIAL | PARTIAL | COVERED | COVERED | COVERED | N/A |
| `tags-input` | 56 | COVERED | COVERED | COVERED | COVERED | N/A | COVERED |
| `textarea` | 43 | COVERED | COVERED | N/A | COVERED | N/A | PARTIAL |
| `theme` | 19 | COVERED | COVERED | N/A | N/A | N/A | N/A |
| `time-picker` | 44 | PARTIAL | PARTIAL | COVERED | COVERED | MISSING | COVERED |
| `timeline` | 59 | PARTIAL | COVERED | PARTIAL | COVERED | COVERED | N/A |
| `toast` | 34 | COVERED | PARTIAL* | PARTIAL | COVERED | PARTIAL | N/A |
| `tooltip` | 33 | COVERED | COVERED | COVERED | COVERED | N/A | N/A |
| `transfer` | 19 | COVERED | COVERED | COVERED | COVERED | N/A | COVERED |
| `tree` | 33 | COVERED | COVERED | COVERED | COVERED | N/A | N/A |
**Column totals (55 components):**

| Cell | COVERED | PARTIAL | MISSING | N/A |
|---|---:|---:|---:|---:|
| Rendering | 33 | 22 | 0 | 0 |
| Inputs/Outputs | 39 | 13 (+3 `PARTIAL*`) | 0 | 0 |
| Interaction | 27 | 11 | 1 | 16 |
| Accessibility | 49 | 5 | 0 | 1 |
| Content projection | 25 | 6 | 5 | 19 |
| ControlValueAccessor | 14 | 2 | 0 | 39 |

### Weakest specs — ranked

| Rank | Component | Why | Tag |
|---|---|---|---|
| 1 | `table` | **Interaction MISSING.** Exhaustive check of `table.spec.ts` (1,249 lines) finds **zero** `dispatchEvent`, `.click()`, `KeyboardEvent`, `.focus()` or `triggerEventHandler`. The only three `MouseEvent`s (`:422`, `:430`, `:457`) are **constructed and handed straight to a method** — `tableCmp.handleRowClick(row, 0, event)` (`:426`, `:432`, `:461`) — with a hand-forged `composedPath`; they are never dispatched to the DOM. Selection is likewise asserted through the component API (`tableCmp.setSelected()` / `.isSelected()` / `.selected()` at `:508-516`). Listener wiring, template binding and event bubbling are never exercised. Plus `selectionChange` is unreferenced. | **HIGH** |
| 2 | `date-range-picker` | 27 of 48 inputs unreferenced (56%). 4 `it.skip` tests. | **HIGH** |
| 3 | `select` | 16 of 28 inputs unreferenced; `searchChange` output never referenced. | **HIGH** |
| 4 | `combobox` | 17 of 33 inputs unreferenced (52%) — includes the whole `option*` accessor family (`optionLabel`, `optionValue`, `optionGroup`, `optionDisabled`) and `filterFn`. | **HIGH** |
| 5 | `date-picker` | 18 of 37 inputs unreferenced. | MEDIUM |
| 6 | `toast` | `actionClicked` output never referenced; `icon` input never referenced. | **HIGH** |
| 7 | `carousel` | 10 of 22 inputs unreferenced, incl. `pauseOnHover`, `pauseOnFocusIn`, `draggable`, `snapAlign`. | MEDIUM |
| 8 | `time-picker` | 10 of 24 unreferenced, incl. `showClear`/`showSteppers` — both documented `true`-default exceptions in CLAUDE.md. | MEDIUM |
| 9 | `transfer` | Only 19 tests for a dual-list CVA component with 14 inputs and 2 outputs. Also the only e2e component spec with no page object. | MEDIUM |
| 10 | `input` / `textarea` | Assert the directive's **internal signals** (`fixture.componentInstance.directive().empty()`, `.value()`, `.focused()`, `.errorState()`) instead of the DOM — 33 occurrences. Explicit "What NOT to test" violation. | MEDIUM |

Note on `aspect-ratio`, `spinner`, `separator`, `transfer` (12–19 tests each): small ≠ weak. `aspect-ratio` is a one-input directive whose spec covers default / valid / invalid-fallback / reactivity / non-interference — proportionate. `transfer` is the genuinely thin one.

---

## 2. Validator-guard specs — **ALL FOUR PASS**

CLAUDE.md: any control self-providing `NG_VALIDATORS` MUST ship a spec asserting one error code reaches a bound `FormControl`.

Four controls provide `NG_VALIDATORS`. All four have a live guard that asserts a **real error code on a real bound control** — not merely that the component mounts.

| Control | Guard | Evidence |
|---|---|---|
| `calendar` | `calendar.spec.ts:2256` `describe('validator')` → `:2267` *"surfaces calendarMinDate through a bound FormControl"* | `expect('calendarMinDate' in errors).toBe(true)` @ `:2278`; negative case @ `:2291`; `revalidate()` @ `:2308`. Carries the mandated explanatory comment @ `:2249-2255`. |
| `date-picker` | `date-picker.spec.ts:709` `describe('validator')` → `:710` *"surfaces calendarMinDate on a bound FormControl for a date before minDate"* | `expect('calendarMinDate' in (ctrl.errors ?? {})).toBe(true)` @ `:721`; `calendarMaxDate` @ `:735`; re-validation on `minDate` change @ `:817`; signal-forms path @ `:1198-1229`. |
| `date-range-picker` | `date-range-picker.spec.ts:871` `describe('validator')` | `calendarRangeTooShort` @ `:935`; null-error negative @ `:946`; `calendarMinDate` @ `:972`; signal-forms `kinds` assertion @ `:919`. |
| `time-picker` | `time-picker.spec.ts:734` `describe('validator')` → `:735` *"surfaces timePickerMin on a bound FormControl for a time before minTime"* | `expect('timePickerMin' in (ctrl.errors ?? {})).toBe(true)` @ `:743`; `timePickerMax` @ `:755`; re-validation @ `:813`. |

**Explicitly checked and cleared:** the 4 `it.skip` tests in `date-range-picker.spec.ts` (`:451`, `:477`, `:499`, `:583`) are **not** validator guards — they are calendar-panel rendering/commit tests. The `describe('validator')` block at `:871` is fully active. **No validator guard is disabled.** Verdict: **PASS, no action needed.**

---

## 3. Outputs and inputs never referenced by any test

### Outputs never referenced — **HIGH**

**Scoping — verified repo-wide, not just in the owning directory.** A first pass grepped only each output's own entry point; that is insufficient, because an output can be exercised from a consumer's spec. The repo-wide check (`grep -rn "selectionChange\|actionClicked\|searchChange" projects/ngx-tw --include="*.spec.ts"`) returns hits for `selectionChange` in `tree.spec.ts:54,:328,:403`, `stepper.spec.ts:281,:287` and `select.spec.ts:42,:312,:508` — but those are **those components' own, distinct `selectionChange` outputs**, not `table`'s. No spec anywhere instantiates a `tw-table` and asserts its `selectionChange`. `actionClicked` and `searchChange` return **zero hits in any library spec**.

All three could be deleted or broken and the entire unit suite would still pass green.

| Output | Declared at |
|---|---|
| `select.searchChange` | `projects/ngx-tw/select/select.ts:540` |
| `table.selectionChange` | `projects/ngx-tw/table/table.ts:891` |
| `toast.actionClicked` | `projects/ngx-tw/toast/toast-component.ts:221` |

*(`slider.valueInput` was initially flagged and then cleared — it is aliased `'input'` and is exercised via `(input)=` at `slider.spec.ts:33`.)*

### Inputs never referenced — **MEDIUM**

**138 of 647 declared inputs (21.3%)** never appear in any spec, alias- and kebab-aware. Worst offenders:

| Component | Unreferenced | Notable |
|---|---|---|
| `date-range-picker` | 27 / 48 | `rangeBehavior`, `rangeClickBehavior`, `maxRangeLength`, `firstDayOfWeek`, `showSeconds`, `hourStep`, `minuteStep` |
| `date-picker` | 18 / 37 | `startAt`, `startView`, `format`, `parseFormat`, `dateClass`, `cellTemplate` |
| `combobox` | 17 / 33 | `optionLabel`, `optionValue`, `optionGroup`, `optionDisabled`, `filterFn`, `minQueryLength`, `openOnFocus` |
| `select` | 16 / 28 | `optionLabel`, `optionValue`, `optionGroup`, `compareWith`, `filterPredicate`, `panelWidth`, `size`, `color` |
| `carousel` | 10 / 22 | `pauseOnHover`, `pauseOnFocusIn`, `draggable`, `snapAlign`, `position`, `size`, `variant`, `color` |
| `time-picker` | 10 / 24 | `showClear`, `showSteppers`, `variant`, `size`, `placeholder` |
| `popover` | 4 / 18 | `twPopoverCloseOnOutside`, `twPopoverScrollStrategy`, `twPopoverPanelClass`, `twPopoverOffset` |
| `table` | 4 / 22 | `predicate`, `priority`, `stackLabel` (the entire responsive-collapse axis) |

`errorStateMatcher` is unreferenced on **9 form controls** (`checkbox`, `combobox`, `date-picker`, `date-range-picker`, `file-upload`, `radio`, `slider`, `switch`, `tags-input`, `time-picker`, `transfer`) — the `TW_ERROR_STATE_MATCHER` override path is essentially untested at unit level. **MEDIUM.**

`select.size` / `select.color` / `carousel.size` / `carousel.color` / `carousel.variant` / `time-picker.size` / `time-picker.variant` being unreferenced is why those components show `Rendering: PARTIAL` — the shared `TwSize`/`TwColor` axes CLAUDE.md mandates testing are declared but never rendered in a test.

---

## 4. Vitest-rule compliance — **CLEAN**

| Rule | Result |
|---|---|
| `fakeAsync` / `tick` | **0 violations.** 16 grep hits for `tick(` exist but every one is `TestBed.inject(ApplicationRef).tick()` (`toast.spec.ts`, `dialog.spec.ts`, `sheet.spec.ts`) — the `ApplicationRef` API, not the zone helper. Ruled out by inspection; a reader grepping `tick` will find these and should not re-flag them. |
| `jasmine.createSpy` / `jasmine.*` | **0 occurrences.** |
| Bare `spyOn(` without `vi.` | **0 occurrences.** |
| Missing explicit `vitest` imports | **0 files.** All 70 spec files import from `'vitest'`. |
| Missing `detectChanges()` after `setInput` | **0 real violations.** 7 candidates flagged; all 7 inspected (`breadcrumbs:516`, `calendar:733`,`:1132`, `tags-input:709`, `timeline:328`,`:717`,`:1058`) and all are multi-line calls or blocks where `detectChanges()` follows further down. |

### "What NOT to test" violations

| Violation | Count | Tag |
|---|---:|---|
| **Class-name assertions** instead of observable behaviour | **208 tests (7.8%)** | MEDIUM |
| **Internal signal reach-in** — `expect(fixture.componentInstance.directive().someSignal())` | **42 tests (1.6%)** | MEDIUM |

Class-name assertion hot spots: `form-field` 19, `alert` 18, `card` 18, `item` 15, `timeline` 14, `stat` 12, `separator` 11, `segmented-control` 10, `table` 9. Representative: `alert.spec.ts:118` `expect(alert.className).toContain('bg-info-soft')`; `item.spec.ts:153` `expect(item.className).toContain('py-1.5')`; `timeline.spec.ts:322` `expect(marker.className).toContain(dotSizeMap[size])`.

*Counter-argument worth recording:* for a purely presentational component (`alert`, `card`, `stat`, `separator`) the applied class **is** close to the only observable output, so a blanket ban is impractical. The defensible line is that these assertions pin **design-token choices** (`py-1.5`, `size-7`, `bg-info-soft`) that CLAUDE.md's Visual Design System already governs — meaning a legitimate token change breaks ~200 tests for no behavioural reason. This is a **maintenance-cost** finding more than a correctness one.

Internal reach-in is concentrated in exactly three files: `input` 17, `textarea` 16, `number-input` 9. These assert `directive().empty()`, `.value()`, `.focused()`, `.disabled()`, `.errorState()`, `.valueLength()` — all of which have DOM-observable equivalents.

---

## 5. Anti-coverage — tests that cannot fail

**Method.** All 2,672 tests were parsed programmatically (regex-delimited `it(`/`test(` bodies across all 70 spec files — a full census, not a sample). Each test was classified by its assertion content. The classifier was then **hand-verified** against `split.spec.ts:865` and the `button.spec.ts:138-195` variant loops.

| Class | Count | % of 2,672 |
|---|---:|---:|
| Zero `expect()` at all | **1** | 0.04% |
| Truthiness-only (`toBeTruthy`/`toBeDefined`/`not.toBeNull`, ≤2 assertions) | **188** | 7.0% |
| `it.skip` / `it.todo` | **4** | 0.15% |
| **Ceremonial (union, deduped)** | **193** | **7.2%** |
| Class-name-only assertions (weak, not strictly ceremonial) | 208 | 7.8% |
| **Weak-or-ceremonial (union)** | **401** | **15.0%** |

**Caveat on the classifier:** it counts a test as load-bearing if it carries any non-truthiness assertion. It does **not** verify that the assertion *discriminates* — a test can assert something real and still not distinguish the behaviour its name claims (the `variant` loops below are the illustration). 92.8% is therefore an upper bound on genuine discriminating power, not a measurement of it.

**Load-bearing estimate: ~2,479 of 2,672 tests (92.8%)** carry at least one assertion that could fail on a real behavioural regression. Widening to include class-name-only tests as non-load-bearing gives a floor of **~2,271 (85.0%)**.

### The one test that asserts nothing — **HIGH**

`projects/ngx-tw/split/split.spec.ts:865`

```ts
it('fires sizesChange when clamping occurs during pixel resize', async () => {
  const fixture = TestBed.createComponent(SplitComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  // Can't easily set up contentChildren via ComponentFixture on SplitComponent directly.
  // Tested via PixelHost above and pure function tests.
});
```

It passes unconditionally. Its **name** claims `sizesChange`-on-clamp is covered, so a reader auditing `split` will believe it is. Either delete it or convert it to `it.todo`.

### The ceremonial 7% is structural, not sloppy

The 188 truthiness-only tests are overwhelmingly the CLAUDE.md-mandated *"every value of each variant/color/size renders without errors"* loops:

```ts
for (const color of colors) {
  it(`should render color="${color}" without errors`, () => {
    fixture.componentRef.setInput('color', color);
    fixture.detectChanges();
    expect(getButton(fixture)).toBeTruthy();   // ← passes unless the component throws
  });
}
```

These **satisfy the letter of the rule** and do catch a throwing component, but they cannot detect a variant that renders identically to another. `button` is the model to copy: it pairs the loop with real assertions (`:151` outline adds `border`, `:161` link strips padding). Components whose variant coverage is *only* the loop: `alert`, `avatar`, `badge`, `checkbox`, `card`.

---

## 6. Demo route coverage — the five cross-product lists

Mechanical `comm` diff of: 55 library component entry points × 56 dirs in `routes/` × 55 paths wired in `app.routes.ts` × 55 nav groups (165 nav leaf paths) in `layout/shell.ts`.

**(a) Library entry points with NO demo route: _NONE_.** All 55 component entry points (54 under `components/`, plus `theme` under `services/`) have a route directory. *(`core`, `calendar/luxon`, `calendar/testing`, `icon/lucide` are sub-/utility entry points, correctly excluded — they document no component.)*

**(b) Route directories missing `overview` / `examples` / `api`: _NONE_.** All 55 real route dirs contain all three subdirectories, each with a page component, **and** each `<name>.routes.ts` actually wires all three children (verified — a folder present but unrouted would not show in a directory listing).

**(c) Routes present on disk but NOT wired into `app.routes.ts`: _NONE_.**

One directory initially appeared orphaned and was re-checked: `projects/demo/src/app/routes/foundations/rhythm/`. It is **untracked in-flight work** (`git status` → `?? projects/demo/src/app/routes/foundations/`) that gained its route wiring (`app.routes.ts:226`, `path: 'foundations/rhythm'`) and its nav entry (`shell.ts:311-313`, category `Foundations` → "Rhythm Grid") **during this audit**. It is a design-token measurement tool, not a component doc page, and is correctly excluded from the component cross-product. **Not a finding.**

**(d) Routes wired into `app.routes.ts` but MISSING from the nav in `layout/shell.ts`: _NONE_.** All 55 wired paths have a nav group.

**(e) Nav entries pointing at routes that don't exist (dead links): _NONE_.** All 165 nav leaf paths (`55 × {overview, examples, api}`) resolve to a wired route with that child.

**Cosmetic:** the nav's `Components` category is alphabetical except `Toast` and `Tooltip`, which are listed **after** `Tree` (`shell.ts:298-307`). Harmless, but it makes those two hard to find in a 55-item sidebar. **LOW.**

Demo-route coverage is, in short, **complete and correctly wired** — the only defect is one orphan directory.

---

## 7. Demo page convention conformance

Sampled 10 route folders against `.claude/skills/demo-doc-page/SKILL.md`, plus repo-wide mechanical sweeps over all 55.

**Route-folder ages** (`git log --diff-filter=A`) fall into 5 cohorts, not a gradient — the 2026-04-24 date is a **single initial-import commit (`5346c7d`) covering 40 folders**, so it is one authoring event, not 40:

| Added | n | Folders |
|---|---:|---|
| 2026-04-24 | 40 | accordion … tooltip (incl. `select`, `theme`, `tabs`, `menu`, `checkbox`) |
| 2026-05-27 | 3 | breadcrumbs, sheet, textarea |
| 2026-05-28 | 6 | carousel, combobox, empty-state, split, stat, timeline |
| 2026-05-29 | 4 | aspect-ratio, file-upload, number-input, tags-input |
| 2026-07-22 | 2 | transfer, tree |

### Sample verdicts

| Route | Cohort | Shell | Raw `<pre>` | Overview canon | Examples | API | Verdict |
|---|---|---|---|---|---|---|---|
| `select` (canonical) | 04-24 | pass | pass | pass | pass | pass | **Conforms** |
| `tabs` | 04-24 | pass | pass | pass | pass | pass | **Conforms** |
| `checkbox` | 04-24 | pass | pass | pass | pass | pass | **Conforms** |
| `transfer` | 07-22 | pass | pass | pass | pass | pass | **Conforms** |
| `tree` | 07-22 | pass | pass | pass | pass | pass | **Conforms** |
| `number-input` | 05-29 | pass | pass | pass | pass | pass | **Conforms** |
| `menu` | 04-24 | pass | pass | pass | pass | no Types | Near-conforming |
| `split` | 05-28 | `max-w-5xl` | pass | no Accessibility | no Playground | pass | 3 deviations |
| `sheet` | 05-27 | pass | pass | minor | **0 snippets**, no Playground | pass | Major gap |
| `theme` | 04-24 | **fail** | **fail ×3** | **fail** | **fail** | Types via `<pre>` | **Systematically legacy** |

### Repo-wide sweeps (all 55 routes)

| Check | Result |
|---|---|
| `{name}.routes.ts` shape (3 lazy children + `redirectTo: 'overview'`) | **55/55 conform** |
| Canonical `tw-item` + `twTabNav` shell | **54/55** — only `theme-page.component.ts` |
| Container `mx-auto max-w-4xl px-6 py-12` | **54/55** — only `split-page.component.ts:26` (`max-w-5xl`) |
| **API table format (R11)** | **55/55 conform — all 241 tables. Zero deviations.** |
| Overview 4 required sections in order | **54/55** — only `theme` (missing Basic Usage + Import) |
| Examples ends in a Playground | **52/55** — missing in `sheet`, `split`, `theme` |
| API Types section last | **53/55** — missing in `menu` (vacuous: entry point exports no types); drift-renamed in `calendar-api.component.ts:296` |
| Raw Tailwind palette colors | **Zero across all 55** |

### Genuine raw-`<pre>` violations — 3, all in `theme`  · **MEDIUM**

`theme/overview/theme-overview.component.ts:41`, `theme/examples/theme-examples.component.ts:226`, `theme/api/theme-api.component.ts:113` — all the forbidden `<div class="bg-surface-sunken …"><pre><code>` shape.

Four other `<pre` hits (`date-picker`, `date-range-picker` ×2, `time-picker` examples) are **live value read-outs** with `data-testid` for e2e assertions, not code samples — minor cheatsheet drift (`<pre>` where `<p>` is specified), **LOW**. One hit (`tabs-examples.component.ts:208`) is a **false positive**: demo content inside a live tab panel.

### Examples pages missing paired snippets  · **MEDIUM**

`theme` (4/4 sections), `sheet` (8/8), `accordion` (5/5), `calendar` (6 sections: `:104, :132, :159, :183, :247, :282`), `breadcrumbs` (1: `:178`). Missing intro paragraphs: `accordion`, `code-block`, `theme`.

### Era conclusion — **there is no non-conforming era**

The premise does not survive the data:

1. **The canonical shell existed on day one.** In commit `5346c7d`, `button-page.component.ts` already used `tw-item` + `twTabNav` — while `theme-page.component.ts` shipped the hand-rolled form in the *same commit*. The convention and its lone violator were born together.
2. **No retrofit sweep happened.** `aee8235` touched 110 files under `routes/` but only 8 page shells, and touched `theme` only for the package-scope rename. The 04-24 pages were conforming *as authored*.
3. **Deviations do not cluster by age.** ~37 of the 40 oldest-cohort routes fully conform; two of the four substantively broken routes (`sheet`, `split`) were added a month *later*.

**What deviation actually correlates with is subject matter.** `theme` is the only systematically non-conforming page and the only route that does not document a *component* — it documents the theming runtime and was authored outside the doc-page pipeline. It alone accounts for the only shell violation, all three genuine raw-`<pre>` violations, and the only overview-canon violation.

**The real directional signal is the opposite of decay:** the two newest cohorts (2026-05-29 and 2026-07-22 — `aspect-ratio`, `file-upload`, `number-input`, `tags-input`, `transfer`, `tree`) are **100% clean on every check**. Convention adherence has tightened over time.

---

## 8. E2E coverage

Suite: Playwright, `e2e/specs/{00-smoke, 01-components, 02-cross-cutting, 03-accessibility, 04-visual}`. **896 test declarations** on `chromium-light`.

**Tag counts** — `@smoke` 159 · `@a11y` 378 · `@visual` 20 · no tag at all **0**. The three tags partition cleanly (zero overlap). 339 tests carry only other tags (`@interaction` 208, `@overlay` 117, `@forms` 102, `@keyboard` 28, `@rtl` 10, `@mobile` 4).

### HIGH — 5 components have ZERO e2e coverage, and the guard that should have caught it has never run

`aspect-ratio` · `file-upload` · `number-input` · `tags-input` · `tree`

`e2e/support/routes.ts` `COMPONENTS` lists **49** slugs; `app.routes.ts` declares **54** `components/<slug>` routes. The five above are the exact diff (verified by `comm`). Every data-driven sweep — `00-smoke/routes.spec.ts`, `03-accessibility/examples.spec.ts`, `03-accessibility/explicit-assertions.spec.ts` — iterates that constant, so these five are invisible to the **entire** e2e suite despite having live, fully-wired demo routes.

The file's own header comment says:

> *"This list is **derived** from `projects/demo/src/app/app.routes.ts`. A Vitest-level guard (see `projects/demo/src/app/app.routes.spec.ts`) compares this list to the routes extracted from `app.routes.ts` at build time and **fails the build if they diverge**."*

**That guard has never executed.** `projects/demo/src/app/app.routes.spec.ts` exists (3,245 bytes, last touched 2026-05-28), and `angular.json` gives the `demo` project a `test` target — but:

- `package.json:14` → `"test": "ng test ngx-tw"`
- `package.json:15` → `"test:ci": "ng test ngx-tw --no-watch --no-progress"`
- `.github/workflows/ci.yml:118` → `- run: npm run test:ci`

Nothing anywhere invokes the `demo` project's tests. The drift guard is dead code protecting a list that has already drifted. **This is the single highest-value finding in the audit** — fix is one word in `package.json` (`ng test` instead of `ng test ngx-tw`), which will then immediately fail and surface the 5 missing components.

### MEDIUM — ~56 of 896 e2e specs are suppressed stubs

Three distinct suppression mechanisms, which behave differently and are easy to conflate:

| Mechanism | Where | Count | Effect |
|---|---|---:|---|
| `continue` over a backlog array | `03-accessibility/examples.spec.ts` (`A11Y_BACKLOG`) | 12 components | axe sweep **never declared** |
| Runtime `test.fixme(cond, …)` | `03-accessibility/explicit-assertions.spec.ts` (`ARIA_CONTROLS_BACKLOG` 8 + `ACCESSIBLE_NAME_BACKLOG` 9) | 17 | listed, never run |
| Declaration-level `test.fixme` | 19 files | 39 | listed, never run |

Components with **no axe sweep** (in `A11Y_BACKLOG`): `form-field`, `input`, `paginator`, `select`, `sort`, `stepper`, `table`, `tabs`, `textarea`, `time-picker`, `timeline`, `toast`.

Also inert: all 3 `@theme @a11y` **cross-theme colour-contrast tests** in `02-cross-cutting/theme-matrix.spec.ts:82ff` are `test.fixme` — the contrast gate does not currently run. **MEDIUM.**

### Other e2e gaps

- **`/services/theme/*` is never axe-scanned** — both a11y sweeps iterate `COMPONENTS` only. The semantic-token swatch grid is the page most likely to carry contrast violations. **MEDIUM.**
- **Form controls with no `forms-three-strategies` spec:** `textarea`, `combobox`, `number-input`, `tags-input`, `file-upload`, `transfer`. CLAUDE.md requires all three strategies to work; these are unverified end-to-end. **MEDIUM.**
- **`sheet` has no dedicated overlay spec** despite being an overlay-bearing component. Also no page object. **MEDIUM.**
- **Routed components with no dedicated spec (sweeps only):** `breadcrumbs`, `combobox`, `empty-state`, `sheet`, `stat`, `textarea`, `timeline`. `combobox` is the weakest — no spec, no page object, and in **both** explicit-assertion backlogs.
- **Page objects:** no dead POMs (all 42 have ≥1 importer) and no specs referencing a missing POM. `transfer` is the only component spec with no POM.

---

## Prioritised findings

### HIGH — a real regression could ship undetected

| # | Finding | Location |
|---|---|---|
| H1 | **Demo↔e2e route drift guard never runs.** 5 components (`aspect-ratio`, `file-upload`, `number-input`, `tags-input`, `tree`) have zero e2e coverage; `app.routes.spec.ts` was written to prevent exactly this but is excluded by `"test": "ng test ngx-tw"`. | `package.json:14-15`, `.github/workflows/ci.yml:118`, `e2e/support/routes.ts` |
| H2 | **3 outputs never referenced by any test** (verified repo-wide across all specs, not just the owning directory). | `select.ts:540` `searchChange`; `table.ts:891` `selectionChange`; `toast-component.ts:221` `actionClicked` |
| H3 | **A test that asserts nothing**, whose name claims coverage it does not provide. | `split.spec.ts:865` |
| H4 | **`table` never dispatches a DOM event.** No `dispatchEvent`/`.click()`/`KeyboardEvent`/`triggerEventHandler` anywhere in the file; the three `MouseEvent`s built at `:422`/`:430`/`:457` are passed directly to `handleRowClick()` rather than dispatched, and selection is asserted via the component API. Listener wiring and bubbling are untested. | `table.spec.ts:422-461`, `:508-516` |
| H5 | **4 disabled tests in a validator-bearing component** sit silently in the suite. | `date-range-picker.spec.ts:451, :477, :499, :583` |

### MEDIUM

| # | Finding |
|---|---|
| M1 | 138/647 inputs (21%) never referenced in any spec — worst: `date-range-picker` 27/48, `date-picker` 18/37, `combobox` 17/33, `select` 16/28. |
| M2 | `errorStateMatcher` untested on 11 form controls — the `TW_ERROR_STATE_MATCHER` override path is unexercised at unit level. |
| M3 | 208 tests (7.8%) assert class-name strings; 42 assert internal signals (`input`/`textarea`/`number-input`). Both are explicit "What NOT to test" violations. |
| M4 | ~56 e2e specs are suppressed stubs; 12 components have no axe sweep; the cross-theme contrast gate is entirely `fixme`. |
| M5 | `theme` demo route is systematically non-conforming (shell, 3 raw `<pre>`, overview canon, no Playground). |
| M6 | `sheet` (8) and `accordion` (5) examples sections have no code snippets at all. |
| M7 | 6 form controls lack a `forms-three-strategies` e2e spec. |
| M8 | `/services/theme/*` never axe-scanned. |

### LOW

| # | Finding |
|---|---|
| L1 | `split-page.component.ts:26` uses `max-w-5xl` — the only container-width deviation in 55 shells. |
| L2 | `menu-api` has no Types section (vacuous — entry point exports no types); `calendar-api:296` drift-renames its Types section. |
| L3 | 4 `<pre>` value read-outs in date/time examples where the cheatsheet specifies `<p>`. |
| L4 | Nav lists `Toast`/`Tooltip` after `Tree`, breaking alphabetical order in a 55-item sidebar (`shell.ts:298-307`). |
| L5 | `text-white`/`bg-white` in 8 demo files — not palette shades, but not semantic tokens either. Worth a policy decision. |

---

## What is genuinely healthy

- **All 4 `NG_VALIDATORS` guard specs exist, are active, and assert real error codes.** The trap CLAUDE.md warns about is covered.
- **Vitest hygiene is perfect** — 0 `fakeAsync`, 0 Jasmine spies, 0 missing imports, 0 missing `detectChanges`.
- **Demo route wiring is complete** — 55/55 entry points routed, all three subpages each, no unwired routes, no dead nav links.
- **API table format: 241/241 tables conform.**
- **Accessibility is the strongest unit-spec column** — 49/55 COVERED.
- **Every component entry point has at least one spec.**
- **Convention adherence is improving**, not decaying: the two newest demo cohorts are 100% clean.
