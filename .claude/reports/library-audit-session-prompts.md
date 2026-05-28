# ngx-tw audit — session prompts

**Inputs (both required reading for any session):**
- Audit report: `.claude/reports/library-audit-2026-05-27.md`
- Project rules: `.claude/CLAUDE.md`

**How to use this file.** Each session below is self-contained. The prompt body (after the metadata block) is the text to hand to a fresh Claude Code agent. The agent should read the audit report's relevant batch section + CLAUDE.md before starting; the prompt names the exact file:line anchors.

---

## Design decisions (resolved)

These six decisions were open at the bottom of the implementation plan. They are settled here so Phase 2/3 prompts can be executed without re-litigation.

### D1 — Accordion / collapsible-group consolidation (drives S15a)

**Decision: consolidate by inheritance, keep both selectors.** `AccordionComponent extends CollapsibleGroupComponent` with `accordion = true` semantics baked in. Delete the duplicated `toggleItem` / `syncChildrenFromValue` / FocusKeyManager wiring from `accordion.ts` — these are already 95% identical to the collapsible-group equivalents (`accordion.ts:168-212` vs `collapsible.ts:454-503`). The `useExisting: forwardRef(() => AccordionComponent)` provider at `accordion.ts:70-75` already proves an `AccordionComponent` *is* a `CollapsibleGroupComponent` to its children — finish the job.

**Reject deprecation in favor of `<tw-collapsible-group accordion>`.** `<tw-accordion>` is the discoverable APG name; renaming pre-1.0 is gratuitous churn for a public surface that works. Keep both selectors; deduplicate the implementation.

### D2 — Picker overlay extraction strategy (drives S18)

**Decision: composition via injectable coordinator + pure helpers. No base class.** CLAUDE.md "Compose Angular CDK, don't reinvent it" rules out inheritance as the primary pattern. Split the extraction:

- **Pure functions** in `projects/ngx-tw/core/overlay/` for stateless concerns:
  - `buildPickerPositions(): ConnectedPosition[]` — replaces `buildDatePickerPositions`/`buildDateRangePickerPositions`.
  - `resolvePickerScrollStrategy(input): ScrollStrategy`
  - `mergePickerPanelClass(input, internal)`
  - Exported constant `PICKER_ANIMATION_DURATION = 150` (aligns with `duration-150`).
- **Injectable coordinator** `PickerOverlayCoordinator` provided **at the picker component level** (not `providedIn: 'root'` — per CLAUDE.md library-services rule) for stateful concerns: FocusTrap lifecycle, `opened`-after-animation emission, ID generation via CDK `_IdGenerator`.

Reject mixins (awkward in TS/Angular) and `hostDirectives` (overlay coordination is not a host-binding concern).

### D3 — Calendar `rangeBehavior` config object (drives S19)

**Decision: ship as a single `rangeBehavior` config object input.** The four booleans (`allowSingleDayRange`, `persistPartialRange`, `allowBackwardRange`, `disableRangesCrossingDisabledDates`) are a cohesive set — consumers either accept defaults or tune them as a unit. Pre-1.0 is the right moment to collapse them. Use `Partial<RangeBehaviorConfig>` typing so `[rangeBehavior]="{ allowSingleDayRange: false }"` is the call-site ergonomic. IDE autocomplete still works on object properties; discoverability cost is minor compared to the cap-compliance gain.

### D4 — Paginator input cap (drives S13)

**Decision: codify a fifth CLAUDE.md exception ("Navigation primitives — paginator"). Do NOT pursue the config-object refactor.** Arithmetic: after extracting the six secondary axes the plan lists, the paginator still has ~14 first-class axes (`totalItems`, `pageSize`, `page`, `type`, `layout`, `size`, `color`, `siblingCount`, `boundaryCount`, `showFirstLastButtons`, `showPageSizeSelector`, `pageSizeOptions`, `showPageInfo`, `disabled`). Each is an independent semantic axis — same shape as the structural-layout exception. Material's `MatPaginator` carries comparable surface. Add to CLAUDE.md:

> **Navigation primitives** | Pagination demands many independent semantic axes (boundary/sibling counts, layout, type, page-size selector, jump buttons, responsive collapse) that cannot be flattened. | `paginator`

S13 then scopes down to: raw-palette removal, `FocusKeyManager`, `size-3.5` comment, demo Sizes-section label fix — no API churn.

### D5 — CVA registration target (drives S08)

**Decision: confirm `NG_VALUE_ACCESSOR` + `forwardRef` as canonical.** Angular-native, statically discoverable in the providers array, no runtime DI surprise. Material's `ngControl.valueAccessor = this` pattern exists to dodge `forwardRef` but requires constructor injection of `NgControl` with `self`/`optional` flags — strictly less ergonomic for library consumers reading the source. S08 migrates `checkbox.ts:357`, `slider.ts:545-547`, `date-picker.ts:594,786`, `time-picker.ts:708` to the canonical pattern.

Add a `## ControlValueAccessor` subsection to CLAUDE.md codifying: "Provide `NG_VALUE_ACCESSOR` via the component's `providers` array with `forwardRef`. Never assign `ngControl.valueAccessor = this` at runtime."

### D6 — `text-base` codification (drives S02 + S17)

**Decision: codify a second carve-out for `tw-stat` lg/xl `value`. Step every other `text-base` down.** Stat at lg/xl is the same visual role as `tw-item lg` title — a dominant numeric value above a `text-sm` subtitle (`stat.ts:107, 115`). Audit calls it "borderline justified as dominant KPI tile" (Batch 7). Add a row to CLAUDE.md typography table:

> | KPI value (`tw-stat` size `lg`/`xl`) | `text-base` | `font-bold` (lg) / `font-extrabold` (xl) |

Step down: `sheet-content.ts:70` and `dialog-content.ts:71` → `text-sm font-semibold`. Stepper labels at `stepper.ts:91, 95` are trigger-role; CLAUDE.md's "Trigger font size scale" already permits `text-base` at lg/xl — leave the classes but add an inline `// trigger-scale lg/xl` comment so future audits don't re-flag.

---

## Session boundary audit

**Verdict: 20 sessions → 21 sessions.** One split, no merges.

### Split: S15 → S15a + S15b

S15 as drafted couples two unrelated concerns: accordion/collapsible structural consolidation (high risk, behavioral) and table polish (low risk, mostly token swaps). Splitting lets table polish land in parallel with S16/S17 and keeps the consolidation review surface tight.

- **S15a — Accordion + collapsible consolidation.** Inherits design decision D1.
- **S15b — Table polish.** Token swaps + `INTERACTIVE_TAGS` + stack-mode a11y. Independent of S15a.

### Keep as-is: S09 (select + combobox + shared overlay extraction)

The advisor confirms: the extraction *must* land in the same PR as both migrations, otherwise the next agent re-litigates the helper shapes. Don't split.

### Keep as-is: S11 and S16

Both are large but defensible — they sweep up leaf-fix bullets across unrelated components. Risk is scope sprawl in the prompt itself, not session size. Each prompt below carries a per-component checklist with explicit OUT-OF-SCOPE bullets to keep agents on rails.

### Keep as-is: S08 sequencing

Plan correctly places S08 (CVA convergence) *after* S07 (radio + switch CVA work) and *before* S09/S10 (select/combobox/time-picker). The critical-path note at the plan's bottom already confirms this; no change needed.

### Final sequence

```
Phase 1 (hygiene)         S01 → S02 → S03 → S04 → S05
Phase 2 (component)       S06 → S07 → S08 → S09 → S10 → S11 → S12 → S13 → S14 → S15a → S15b → S16 → S17
Phase 3 (heavy refactor)  S18 → S19 → S20
Phase 4 (lint)            bundled with Phase 1 PRs
```

21 sessions total.

---

## Session prompts

### S01 — `Tw*` class-name rename + CLAUDE.md staleness fix

**Pre-requisites:** none — first session.
**In scope:**
- Rename 9 dialog classes (`projects/ngx-tw/dialog/dialog-content.ts:28, 53, 75, 105, 118, 153, 168, 191` + container at `dialog-container.ts:87`) by dropping the `Tw` prefix.
- Rename 5 table directives (`projects/ngx-tw/table/table.ts:545, 560, 575, 600, 604`) by dropping `Tw`.
- Update both component-local `index.ts` barrels and root `projects/ngx-tw/public-api.ts`.
- Update `.claude/CLAUDE.md` Library Structure paragraph: remove the stale `TwCalendarPresets` entry from the exempt list (already renamed to `CalendarPresetsDirective` per `calendar-presets.ts:14`); record that dialog/table renames have landed.
- Add a changeset (`.changeset/` entry) marking this a public-API breaking change.
**Out of scope:** selector renames (element/attribute selectors keep `tw-`/`tw` prefix), `TwSplit*` family (codified exception), shared types `TwColor`/`TwSize`, any non-rename fix on dialog/table.
**Files to edit:** `projects/ngx-tw/dialog/dialog-content.ts`, `projects/ngx-tw/dialog/dialog-container.ts`, `projects/ngx-tw/dialog/index.ts`, `projects/ngx-tw/table/table.ts`, `projects/ngx-tw/table/index.ts`, `projects/ngx-tw/public-api.ts`, `.claude/CLAUDE.md`, new `.changeset/*.md`.
**Acceptance check:**
```
rg -n '\bTwDialog[A-Z]' projects/ngx-tw         # zero matches
rg -n '\b(TwCellDef|TwHeaderCellDef|TwFooterCellDef|TwNoDataRow|TwRowExpansion)' projects/ngx-tw  # zero matches
rg -n 'TwCalendarPresets' .claude/CLAUDE.md     # zero matches
```

**Prompt body.**
Rename the 9 `TwDialog*` classes in `projects/ngx-tw/dialog/` and the 5 `Tw*Def`/`TwRowExpansion`/`TwNoDataRow` directives in `projects/ngx-tw/table/table.ts` by stripping the `Tw` prefix. Closes the Blocker findings in Batch 4 ("dialog") and Batch 8 ("table"), plus the consolidated theme #1 in the audit report.

Selectors (element + attribute) and the public selectors `tw-dialog-*` and `tw-cell`/etc. are unchanged — only TypeScript class identifiers move. Update every `import` site inside `projects/ngx-tw/dialog/` and `projects/ngx-tw/table/`, then the component-local `index.ts` barrels, then `projects/ngx-tw/public-api.ts`. Run `rg -n '\bTwDialog' projects/ngx-tw` and `rg -n '\bTw(CellDef|HeaderCellDef|FooterCellDef|NoDataRow|RowExpansion)' projects/ngx-tw` to confirm zero residual references.

Also fix CLAUDE.md staleness: the "Existing violators" sentence in the **Library Structure** section currently lists `TwCalendarPresets`, but `projects/ngx-tw/calendar/calendar-presets.ts:14` already exports `CalendarPresetsDirective`. Remove that entry. The codified exception list now contains only the `TwSplit*` family.

Add a `.changeset/` entry marking this a **breaking change** (consumers importing renamed class symbols must update their imports). Update any demo-app TS that imports the renamed classes by name.

Do NOT touch any other dialog/table finding — those land in S02 (`text-base`), S15b (table polish), or S20 (dialog refactor). Do NOT introduce any new behavior; this is a pure rename.

---

### S02 — Token violations sweep (text-base + duration-normal + size-3.5 + raw `<pre>`)

**Pre-requisites:** S01 (so `DialogTitleDirective` is already renamed when you touch its `text-base`).
**In scope:**
- `text-base` step-downs per design decision D6:
  - `projects/ngx-tw/sheet/sheet-content.ts:70` (SheetTitleDirective) → `text-sm font-semibold`.
  - `projects/ngx-tw/dialog/dialog-content.ts:71` (DialogTitleDirective post-S01) → `text-sm font-semibold`.
  - `projects/ngx-tw/stepper/stepper.ts:91, 95` — add `// trigger-scale lg/xl per CLAUDE.md typography` inline comment; keep classes as-is.
  - `projects/ngx-tw/stat/stat.ts:107, 115` — keep `text-base`; add a one-line `// KPI value carve-out — see CLAUDE.md typography` comment.
- Codify `duration-normal` in CLAUDE.md → Visual Design System → Transitions table (the token exists at `theme/_typography.css:8` as 200ms). Add a row: `duration-normal` | "Tabs strip animations, paginator transitions" with a note that `duration-200` is the alias.
- Add per-use `//` justification comments for every `size-3.5`: `sort-header.ts:64`, `paginator.ts:275`, and the `alert.ts:175` template inline SVG.
- Migrate raw `<pre>` blocks to `<tw-code-block>` in: `routes/accordion/**`, `routes/collapsible/**`, `routes/sort/examples/sort-examples.component.ts:425`, `routes/segmented-control/**`.
- Update CLAUDE.md typography table per D6: add a row for "KPI value (`tw-stat` lg/xl)" permitting `text-base`.
**Out of scope:** any non-token concern in the touched files (e.g., do not address `slider.errorState` or `sort` aliasing here), other components flagged for `<pre>` not on the four routes above.
**Files to edit:** see In-scope bullets; CLAUDE.md.
**Acceptance check:**
```
rg -n 'text-base' projects/ngx-tw/{dialog,sheet}                 # zero matches
rg -nB1 'size-3\.5' projects/ngx-tw | rg -v '//'                 # every match preceded by '//'
rg -n '<pre ' projects/demo/src/app/routes/{accordion,collapsible,sort,segmented-control}  # zero
rg -n 'duration-normal' .claude/CLAUDE.md                        # one new row in transitions table
```

**Prompt body.**
Sweep four cross-cutting token violations in one PR. All are documented in the audit's "Cross-library themes" section #2, #4, #5, #8.

**Step (1) — `text-base` step-downs.** Per the resolved design decision D6: `text-base` is permitted only for `tw-item lg` titles and now also `tw-stat` lg/xl values. Step `sheet-content.ts:70` and the renamed `DialogTitleDirective` host class at `dialog-content.ts:71` to `text-sm font-semibold`. At `stepper.ts:91, 95` add an inline `// trigger-scale lg/xl per CLAUDE.md typography` comment and leave classes intact (this qualifies under the existing trigger-scale table). At `stat.ts:107, 115` add a `// KPI value carve-out` comment.

**Step (2) — `duration-normal`.** The token exists (`theme/_typography.css:8`) but isn't codified in CLAUDE.md. Add a row to the **Transitions** table making `duration-normal` an alias for `duration-200`. Don't replace any callsite.

**Step (3) — `size-3.5` justifications.** CLAUDE.md mandates a one-line comment above every use. Add comments at `sort-header.ts:64` ("xs density chevron sits between `size-3` and `size-4`"), `paginator.ts:275` (analogous), and `alert.ts:175` (dismiss icon in xs density).

**Step (4) — `<pre>` migration.** Replace `<pre>…<code>` blocks in the four named demo routes with `<tw-code-block>` (Pattern A: `[code]="…"`; or Pattern B with `<pre>` *inside* the code-block — see `.claude/skills/demo-doc-page/SKILL.md`).

**Step (5) — CLAUDE.md typography update.** Add the stat KPI carve-out row described in D6.

Run the four acceptance checks above. Add a changeset only if `duration-normal` codification counts as a doc-visible API surface change (it does — flag minor).

---

### S03 — Boolean `true`-default rationale sweep + CLAUDE.md codified list refresh

**Pre-requisites:** none.
**In scope:**
- Run `rg -nB1 'input\(true' projects/ngx-tw` and ensure every match either appears in CLAUDE.md's codified list OR carries a `//` rationale on the preceding line.
- Add inline rationale comments where missing: `stepper.ts:321` (`showError`), `stepper.ts:324` (`headerInteractive`).
- Append the codified list in CLAUDE.md (Boolean defaults section) to include: `popover.twPopoverArrow`, `popover.twPopoverCloseOnOutside`, `popover.twPopoverCloseOnEscape`, `popover.twPopoverTrapFocus`, `timePicker.showSteppers`, `timePicker.showClear` — each with the one-line rationale already inline.
- Add the missing *why* to `spinner.track`'s JSDoc (`spinner.ts:138-139`): use the rationale already on the codified list ("without the track ring the spinner reads as a partial arc, not a loading indicator").
**Out of scope:** any non-boolean JSDoc work (see S04), boolean-default inversion proposals (none of the above warrant inversion).
**Files to edit:** `projects/ngx-tw/stepper/stepper.ts`, `projects/ngx-tw/spinner/spinner.ts`, `.claude/CLAUDE.md`.
**Acceptance check:**
```
# Every match of input(true must either have a // comment on the line before OR be on the codified list
rg -nB1 'input\(true' projects/ngx-tw
# CLAUDE.md codified list contains popover x4 + time-picker x2 + the existing entries
rg -n 'twPopoverArrow|showSteppers|showClear' .claude/CLAUDE.md
```

**Prompt body.**
Close the audit's consolidated theme #3 ("Boolean `true` defaults without codified rationale"). CLAUDE.md requires either an inline-JSDoc rationale comment OR membership in the codified list — sweep both.

**Step (1).** Run `rg -nB1 'input\(true' projects/ngx-tw` and inspect every match. Confirmed missing rationale: `stepper.ts:321` (`showError`) — add `// Error states must be visible by default; consumers opt out per step.` `stepper.ts:324` (`headerInteractive`) — add `// Steppers default to clickable headers (free-navigation); restricted flows opt out.`

**Step (2).** Update CLAUDE.md **Boolean defaults** section. Append to the codified list:
- `popover.twPopoverArrow = input(true)` — arrows are the visual anchor of a popover; the arrowless variant is the special case.
- `popover.twPopoverCloseOnOutside = input(true)` — outside-click dismiss is the universal popover gesture.
- `popover.twPopoverCloseOnEscape = input(true)` — Escape is the universal dismiss key.
- `popover.twPopoverTrapFocus = input(true)` — focus trapping is required by APG for modal popovers; non-modal is the special case.
- `timePicker.showSteppers = input(true)` — the stepper buttons are the time-picker's primary affordance.
- `timePicker.showClear = input(true)` — clearing a partial time is the expected gesture; suppressing it is the special case.

**Step (3).** Fix `spinner.ts:138-139` JSDoc to include the *why* already in the codified list: `/** Renders a faint track ring behind the spinner arc. Without it the spinner reads as a partial arc, not a loading indicator. Defaults to \`true\`. */`.

**Out of scope:** all other JSDoc work (handled by S04). Do not change any boolean default to `false` unless your rationale change reveals one was wrong (none of the above are).

---

### S04 — JSDoc → demo API verbatim mirror pass + missing `Defaults to …` suffixes

**Pre-requisites:** S03 (so the new rationale comments are present in library code before the mirror pass copies them into demo API descriptions).
**In scope:**
- Run `rg -n 'input\(|output\(|model\(' projects/ngx-tw` and audit every public declaration. Add missing `Defaults to \`X\`.` suffix on the line above. Known violations from the audit: `skeleton.ts:107` (`announce`), `icon.ts:110` (`ariaLabel`), `icon.ts:113` (`name`), `icon.ts:122` (`img`).
- Verbatim-mirror the library JSDoc one-liner into demo API description cells for the components flagged in the audit: progress-bar, stat, popover, toast, tooltip, select, button. Description in the demo API table MUST equal the library JSDoc string character-for-character (minus surrounding `/** */`).
**Out of scope:** rewriting JSDoc that already exists and is accurate (the goal is parity, not improvement); demo API pages for components not listed above (those land in their per-component sessions).
**Files to edit:** `projects/ngx-tw/skeleton/skeleton.ts`, `projects/ngx-tw/icon/icon.ts`, `projects/ngx-tw/*/*.ts` (one-line suffix additions); `projects/demo/src/app/routes/{progress-bar,stat,popover,toast,tooltip,select,button}/api/*.ts`.
**Acceptance check:**
```
# Every public input/output/model JSDoc ends in "Defaults to `...`" or contains "(required)"
rg -nB1 '^\s*(readonly )?(input|output|model)\s*[<\(]' projects/ngx-tw | rg -B1 '^\s*--' -C0
# Manual: open each demo API page named above and confirm description equals JSDoc verbatim
```

**Prompt body.**
Close the audit's consolidated theme #10 ("JSDoc → demo API description drift") and the "missing `Defaults to …` suffix" findings from Batch 6.

**Pass (1) — Library JSDoc completeness.** Sweep every `input()`/`output()`/`model()` declaration in `projects/ngx-tw`. The JSDoc one-liner above each must end in `Defaults to \`...\`.` (use backticked code style for the literal default) OR explicitly note "(no default — required)". Known offenders: `skeleton.ts:107` (`announce`), `icon.ts:110, 113, 122`. There may be others; the `rg` sweep finds them.

**Pass (2) — Demo API verbatim mirror.** For each of progress-bar, stat, popover, toast, tooltip, select, button: open `routes/<component>/api/<component>-api.component.ts`. Every row's description string must equal the corresponding library JSDoc one-liner character-for-character (strip the leading/trailing `/** */`, keep the body identical, including backticks). Do NOT improve, summarise, or paraphrase — Compodoc renders the library JSDoc into the API page; the demo page must match exactly so consumers see identical text in both surfaces.

**How to find each row's library counterpart.** Each demo API row carries a `name` field that names the input/output/model. Open `projects/ngx-tw/<component>/<component>.ts`, find the matching declaration, copy its JSDoc body. If the JSDoc is missing or stale, fix it in the library first (revealed by Pass 1).

**Out of scope:** any non-text change on the touched files. If you discover a *behavioral* JSDoc inaccuracy (the JSDoc says `Defaults to 'solid'` but the input is `input<X>('outline')`), fix the JSDoc to match runtime, not the other way around — and surface it in the PR description.

Add a changeset only if a public input's default was silently wrong (rare).

---

### S05 — Demo section canon completeness pass

**Pre-requisites:** none — purely additive in the demo app.
**In scope (three concerns):**
1. **Add missing sections.** Variants → `select/examples/select-examples.component.ts`. Template-driven forms → `textarea/`, `calendar/`, `date-picker/`, `date-range-picker/` examples pages. Playground → `textarea/`, `calendar/`, `breadcrumbs/` examples pages. Accessibility → `button/overview/button-overview.component.ts`.
2. **Rename non-canonical section titles.** `form-field/examples`: "Appearance" → "Variants". `combobox/examples`: "Disabled state" → "States".
3. **Strip impl-ref pollution.** `calendar-examples.component.ts:102, 130, 157` — remove `(§21.2)`, `(§10.1)`, and any other parenthetical impl reference from section titles.
**Out of scope:** changing any library JSDoc (S04 owns mirror); editing canonical order on already-correct pages; any new component coverage outside the bullets above.
**Files to edit:** `projects/demo/src/app/routes/{select,textarea,calendar,date-picker,date-range-picker,breadcrumbs,button,form-field,combobox}/**`.
**Acceptance check:** open each named Examples page; section order must follow the canon from `.claude/skills/demo-doc-page/SKILL.md` — Overview → Variants → Sizes → Colors → States → Template-driven forms → Reactive forms → Signal forms → Playground. Manual verification.

**Prompt body.**
Close the audit's consolidated theme #9 ("Demo doc-page section canon drift") plus the per-batch missing-section findings.

Read `.claude/skills/demo-doc-page/SKILL.md` first to confirm the section canon order. Then work through three concerns:

**(1) Add missing sections.** Each new section follows the SKILL's Pattern A (working example, code-block snippet, optional note). For CVA components, the three forms-strategy sections (Template-driven → Reactive → Signal) must appear in that canonical order. Components needing all three: textarea, calendar, date-picker, date-range-picker. The "Template-driven" example shows `[(ngModel)]` with `FormsModule`. "Reactive" uses `formControl` / `formGroup`. "Signal" uses a `signal()` two-way bound via `[(ngModel)]` or the component's own `model()`. Playground sections expose every public input as a control so consumers can toggle live. Accessibility section for button: describe ARIA roles, keyboard contract (`Enter`/`Space`), focus ring, `disabled` semantics — pattern follows `routes/checkbox/overview` if it has an Accessibility section.

**(2) Rename titles.** `form-field/examples`: change the "Appearance" heading to "Variants" (the input is `variant`, not `appearance` — the audit was specific). `combobox/examples`: change "Disabled state" to "States" and broaden the section to include other states (loading, readonly) if present.

**(3) Strip impl-refs.** At `calendar-examples.component.ts:102, 130, 157` remove the `(§21.2)` / `(§10.1)` / etc. text from titles. Section titles describe consumer-facing concerns, not internal phase numbers.

**Out of scope:** library code changes; reordering already-correct sections; adding new examples beyond what each missing section minimally requires.

---

### S06 — Form-control internals A (input, textarea, checkbox)

**Pre-requisites:** S02 (rounded-sm decision), S04 (JSDoc mirror), S05 (demo section canon).
**In scope:**
- **input** (`projects/ngx-tw/input/input.ts`): drop the `*Input` aliasing pattern on `requiredInput, readonlyInput, disabledInput, idInput, userAriaLabelInput, userAriaLabelledbyInput, userAriaDescribedByInput` (~line 210 and 293). Replace with plain `required`, `readonly`, `disabled`, `id`, `userAriaLabel`, etc. Remove the no-op `userAriaDescribedBy = computed(() => this.userAriaDescribedByInput())` at `input.ts:293`.
- **textarea** (`projects/ngx-tw/textarea/textarea.ts:71`): add an `@internal` JSDoc to the `inputs: ['size']` re-declaration explaining why it's needed.
- **checkbox** (`projects/ngx-tw/checkbox/checkbox.ts`):
  - Change `box: 'inline-flex … rounded-sm border …'` (`:55`) → `rounded-md` per CLAUDE.md.
  - Rename `requiredInput` (aliased `required`) at `:357` to plain `required` for consistency with `disabled`.
  - Add a per-input JSDoc explaining the `model()`+`linkedSignal()` mirror at `:312-373` OR simplify if no mirror is needed.
  - In `routes/checkbox/api/checkbox-api.component.ts`, add a Methods row documenting the public `toggle()` method.
**Out of scope:** error-state matcher work (S07), CVA registration changes (S08), demo section restructuring (S05), JSDoc verbatim mirror (S04 already done).
**Files to edit:** `projects/ngx-tw/input/input.ts`, `projects/ngx-tw/textarea/textarea.ts`, `projects/ngx-tw/checkbox/checkbox.ts`, `projects/demo/src/app/routes/checkbox/api/checkbox-api.component.ts`. Add changeset for the input rename (breaking).
**Acceptance check:**
```
rg -n 'requiredInput|readonlyInput|disabledInput|idInput|userAria(Label|Labelledby|DescribedBy)Input' projects/ngx-tw  # zero
rg -n 'rounded-sm' projects/ngx-tw/checkbox  # zero
```

**Prompt body.**
Close the Batch 1 findings on input, textarea, and checkbox.

**Input.** Drop the `*Input` aliasing pattern. The library exposes `requiredInput` (aliased `required`), `readonlyInput`, `disabledInput`, `idInput`, and three `userAria*Input` symbols (`input.ts:210, 293`). All can collapse to plain names because their TypeScript identifier already differs from the inherited HTML attribute name — the alias was solving a problem that doesn't exist. After the rename, remove the no-op `userAriaDescribedBy = computed(() => this.userAriaDescribedByInput())` wrapper; the input directly is the value.

**Textarea.** Verify it picks up the cleaned-up input API automatically. The `inputs: ['size']` re-declaration at `textarea.ts:71` needs a one-line `/** @internal Re-exported so the host class binding sees the inherited signal. */` JSDoc — leave the re-declaration intact, only document it.

**Checkbox.** Change `rounded-sm` → `rounded-md` at `checkbox.ts:55` per CLAUDE.md radius scale. Rename `requiredInput` → `required` at `:357` (matches sibling `disabled`). At `:312-373` the dual `model() + linkedSignal()` storage looks like a deliberate mirror — add a `// @internal Mirrored to allow internal mutation without re-triggering the model() emit cycle.` comment OR, if the mirror isn't justified by a real test scenario, simplify to a single signal. The audit calls it "Document why mirror is needed or simplify" — pick one.

Add a `toggle()` row to `checkbox-api.component.ts` under a new Methods table — the method is public and undocumented in the demo.

This session ships a **breaking change** for `input` consumers using `requiredInput` directly. Add a changeset.

**Out of scope:** error-state matcher unification (S07), CVA registration (S08).

---

### S07 — Form-control internals B (radio, switch, slider) + error-state matcher parity

**Pre-requisites:** S04, S05. Should land before S08 because S08 then converges CVA across all controls.
**In scope:**
- **radio** (`projects/ngx-tw/radio/radio.ts`): wire `NG_VALUE_ACCESSOR` on standalone `<tw-radio>` (currently has `model()` at `:213` but no CVA) OR drop the standalone form-control claim. Add `errorState`/`aria-invalid`/`TW_ERROR_STATE_MATCHER` integration mirroring `input.ts`. Document the `RadioGroupComponent<T = unknown>` generic at `:467` in `routes/radio/api/radio-api.component.ts`.
- **switch** (`projects/ngx-tw/switch/switch.ts`): replace raw `text-white`/`text-black` in the `CHECKED_ICON_COLOR` map (`:113-121`) with `text-on-{color}` semantic tokens. Remove the Enter keydown handler at `:318` (ARIA `switch` pattern is Space-only — match checkbox). Add `TW_ERROR_STATE_MATCHER` integration.
- **slider** (`projects/ngx-tw/slider/slider.ts`): fix `errorState` at `:494-502` to also read `_focused` so blur-driven touched transitions repaint. Refactor the constructor `queueMicrotask` + manual `.subscribe` at `:551-566` to use `takeUntilDestroyed`. Rename `readonly input = output<SliderValue>()` at `:473` (shadowing the `input` import) — call it `valueInput` or similar. Memoize `markClassFor`/`bubbleClassFor` at `:718` as `computed()` instead of re-evaluating each CD cycle.
**Out of scope:** CVA registration pattern unification (S08); demo section work (S05); any non-error-state addition to radio/switch.
**Files to edit:** `projects/ngx-tw/radio/radio.ts`, `projects/ngx-tw/switch/switch.ts`, `projects/ngx-tw/slider/slider.ts`, `projects/demo/src/app/routes/radio/api/radio-api.component.ts`. Add changeset (switch Enter-keydown removal is observable).
**Acceptance check:**
```
# All six form controls expose errorState + aria-invalid wiring
rg -n 'errorState|aria-invalid' projects/ngx-tw/{input,textarea,checkbox,slider,radio,switch}
# Switch no longer handles Enter
rg -n 'keydown\.enter' projects/ngx-tw/switch
# No raw text-white / text-black in switch
rg -n 'text-(white|black)' projects/ngx-tw/switch
```

**Prompt body.**
Close the Batch 1 findings on radio, switch, slider, and the cross-cutting "Error-state matcher coverage is split" finding (audit theme #11).

**Radio.** Decide between two paths and pick A unless tests force otherwise:
- (A) **Wire CVA on the standalone `<tw-radio>`.** Add `NG_VALUE_ACCESSOR` + `forwardRef` (S08 will codify the pattern but you can pre-empt with the same shape; see `switch.ts:130-135`). Implement `writeValue` / `registerOnChange` / `registerOnTouched` / `setDisabledState`. The `model()` at `:213` becomes the internal storage `writeValue` writes to.
- (B) **Drop the form-control claim.** Remove the `model<boolean>('checked')` if external consumers shouldn't form-bind a standalone radio outside a group; document that grouping is required.

Pick A. Then wire `TW_ERROR_STATE_MATCHER` mirroring `input.ts`'s pattern: inject the token, expose `errorStateMatcher` input, compute `errorState` from `NgControl.invalid` + matcher, reflect `aria-invalid` in `host`.

Document `RadioGroupComponent<T = unknown>` at `radio.ts:467` in the demo API page.

**Switch.** In `CHECKED_ICON_COLOR` (`switch.ts:113-121`), replace `text-white`/`text-black` with `text-on-{color}` semantic tokens (e.g., `text-on-primary`). Remove the Enter-keydown handler at `:318` — APG's `switch` role is Space-only (matches `checkbox`). Add `TW_ERROR_STATE_MATCHER` integration.

**Slider.** Three fixes:
1. `errorState` at `:494-502` — add a read of `_focused` so the computation re-fires on blur-driven `touched` transitions.
2. `:551-566` — replace the `queueMicrotask` + manual `.subscribe` with `takeUntilDestroyed(this.destroyRef)` on the relevant observable.
3. `:473` — rename `input` (which shadows the imported factory) to `valueInput` or similar. Update consumer references.
4. `:718` — wrap `markClassFor`/`bubbleClassFor` as `computed()`s instead of recomputing per CD.

Removing Enter on switch is an observable behavior change — add a changeset.

---

### S08 — CVA registration convergence across all form controls

**Pre-requisites:** S07 (radio + switch CVA work lands first so S08 only migrates the four runtime-assignment outliers).
**In scope:** Pick `NG_VALUE_ACCESSOR` + `forwardRef` as the canonical CVA registration pattern (design decision D5). Migrate:
- `projects/ngx-tw/checkbox/checkbox.ts:357` (Material-style `this.ngControl.valueAccessor = this`)
- `projects/ngx-tw/slider/slider.ts:545-547`
- `projects/ngx-tw/date-picker/date-picker.ts:594, 786`
- `projects/ngx-tw/time-picker/time-picker.ts:708`
- Add a `## ControlValueAccessor` subsection to `.claude/CLAUDE.md` codifying the chosen pattern.
**Out of scope:** internal CVA *semantics* changes (writeValue/onChange shape) on the migrated components; any non-CVA fix in those files.
**Files to edit:** the four library files above, `.claude/CLAUDE.md`.
**Acceptance check:**
```
rg -n 'valueAccessor\s*=\s*this' projects/ngx-tw     # zero matches
rg -n 'NG_VALUE_ACCESSOR' projects/ngx-tw            # six components (input, textarea, checkbox, slider, switch, radio-group, select, combobox, date-picker, time-picker)
rg -n 'ControlValueAccessor' .claude/CLAUDE.md       # new subsection
```

**Prompt body.**
Per resolved design decision D5: `NG_VALUE_ACCESSOR` + `forwardRef` is the canonical CVA registration pattern across the library. Closes audit theme #12 ("CVA registration pattern drift").

For each of the four migrated components: remove the constructor block that runs `this.ngControl.valueAccessor = this` (and the `inject(NgControl, { self: true, optional: true })` call if it was only used to attach the accessor). Add to the component's decorator metadata:

```ts
providers: [
  {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CheckboxComponent), // etc.
    multi: true,
  },
],
```

`writeValue`/`registerOnChange`/`registerOnTouched`/`setDisabledState` implementations stay unchanged — only registration mechanics move.

**One subtle case:** components that *also* inject `NgControl` to read `invalid`/`status` (e.g., for `errorState`) must keep that injection but drop the `self: true` flag if it was only needed for the runtime-assignment dance. The injection signature becomes `inject(NgControl, { optional: true })`.

Test on all three forms strategies for each migrated component:
- Template-driven (`[(ngModel)]`)
- Reactive (`[formControl]` and `[formGroup]`)
- Signal-based (`model()` two-way bound)

Add a `## ControlValueAccessor` subsection to CLAUDE.md immediately after the **Form Compatibility** section, codifying:

> Register `ControlValueAccessor` exclusively via the `NG_VALUE_ACCESSOR` provider token with `forwardRef`. Do not assign `this.ngControl.valueAccessor = this` at runtime — that pattern requires `inject(NgControl, { self: true })` and is harder for consumers to discover statically. The provider must use `useExisting: forwardRef(() => MyComponent)` and `multi: true`.

This is a behavior-equivalent refactor — no changeset for runtime behavior, but flag the CLAUDE.md addition.

**Out of scope:** changing what `writeValue` does on any component; touching the `errorState` logic; demo work.

---

### S09 — Select + combobox internal fixes + shared overlay helpers extraction

**Pre-requisites:** S02 (token sweep), S04 (JSDoc mirror), S05 (combobox demo section rename), S08 (CVA pattern set).
**In scope:**
- **select** (`projects/ngx-tw/select/select.ts`):
  - Drop bare `focus:outline-none` at `:173` (keep the `focus-visible:` form).
  - Convert the clear `<span role="button">` at `:398` to native `<button type="button">`.
  - Rewire `errorState` via `NgControl.invalid` + matcher matching time-picker; drop the private `_setErrorState()` shim at `:799, 1498`.
- **combobox** (`projects/ngx-tw/combobox/combobox.ts`):
  - Replace `focus-within:outline-neutral-500` at `:134` with `focus-within:outline-border-strong`.
  - Evaluate the `focus-within:outline-2 focus-within:outline-offset-2` chain at `:113`. If deliberate as a "container focus" indicator, add a one-line `// container-focus indicator — input owns focus-visible: ring` comment; if accidental, drop it.
  - Verify the demo Colors→Sizes ordering already fixed by S05.
- **Shared overlay extraction** (new files in `projects/ngx-tw/core/overlay/`):
  - `buildSelectLikePositions()` — replaces select's and combobox's identical position arrays.
  - `resolveSelectScrollStrategy()` — replaces both scroll-strategy resolvers.
  - `useNakedWhenInFormField()` — single helper for the auto-naked detection currently duplicated in select (`:614`), combobox (`:537`), and time-picker (`:572`).
  - Escape-on-overlay handler util consumed via `keydownEvents()`.
  - Migrate select + combobox to consume. (Time-picker auto-naked migration deferred to S10.)
**Out of scope:** picker-overlay extraction for date-picker/range-picker (S18); time-picker work (S10).
**Files to edit:** `projects/ngx-tw/select/select.ts`, `projects/ngx-tw/combobox/combobox.ts`, new `projects/ngx-tw/core/overlay/*.ts` (export from `projects/ngx-tw/core/index.ts`), `projects/ngx-tw/core/ng-package.json` if helpers live in a sub-entry.
**Acceptance check:**
```
rg -n 'focus:outline-none' projects/ngx-tw/select  # zero
rg -n 'outline-neutral' projects/ngx-tw/combobox   # zero
rg -n 'role="button"' projects/ngx-tw/select       # zero (clear is now <button>)
rg -n 'useNakedWhenInFormField|buildSelectLikePositions' projects/ngx-tw/core/overlay  # present
# Spec coverage: select + combobox open/close/escape/scroll-strategy specs still pass
```

**Prompt body.**
Close Batch 2 select + combobox findings + the cross-cutting overlay duplication noted in audit theme #7.

**Internal fixes first** (so the extraction migrates clean code, not bugs):
- `select.ts:173`: remove bare `focus:outline-none`; keep `focus-visible:outline-none` per CLAUDE.md focus-rings rule (`focus-visible` only).
- `select.ts:398`: convert `<span role="button">` clear affordance to `<button type="button">`. Keep the existing aria-label.
- `select.ts:799, 1498`: replace the private `_setErrorState()` shim with `NgControl.invalid`-driven `errorState`. Mirror time-picker's pattern.
- `combobox.ts:134`: `focus-within:outline-neutral-500` → `focus-within:outline-border-strong` (semantic token).
- `combobox.ts:113`: inspect the `focus-within:outline-2 focus-within:outline-offset-2` chain. If it's a deliberate container-focus marker (the input also has its own `focus-visible:` ring), keep with an inline comment. If accidental duplication, drop.

**Extraction.** Create `projects/ngx-tw/core/overlay/` with four small pure helpers:
- `buildSelectLikePositions(): ConnectedPosition[]` — extract identical position arrays from `select.ts:330, 502` and `combobox.ts:97, 415`.
- `resolveSelectScrollStrategy(name, overlay): ScrollStrategy` — extract scroll-strategy resolver duplicated between the two.
- `useNakedWhenInFormField(explicit: VariantValue): VariantValue` — single helper for the `inject(FormFieldComponent, { optional: true })` + `'naked'` resolution duplicated in select (`:614`), combobox (`:537`), and time-picker (`:572`). This session migrates select and combobox; S10 picks up time-picker.
- `consumeOverlayEscape(overlayRef, onEscape)` — wraps `overlayRef.keydownEvents().pipe(filter(e => e.key === 'Escape'))`.

Export from `projects/ngx-tw/core/index.ts` under an `overlay` namespace OR as flat exports if no naming conflicts. Verify the existing `core/` entry-point shape supports it.

**Dismiss-behavior parity:** the audit notes combobox closes only on backdrop; select also dismisses on Escape via `keydownEvents()` at `select.ts:1393`. Migrate combobox to consume `consumeOverlayEscape` so behaviors match.

**Spec coverage** is critical here — overlay-helper changes touch open/close timing. Re-run select and combobox specs; add tests for the new helpers in `core/overlay/`.

**Out of scope:** date-picker/range-picker (S18). Time-picker's auto-naked migration (S10 — but the helper must exist by end of this session).

---

### S10 — Form-field + time-picker + button

**Pre-requisites:** S04 (button JSDoc mirror); S08 (time-picker CVA already migrated); S09 (auto-naked helper exists).
**In scope:**
- **form-field** (`projects/ngx-tw/form-field/form-field.ts`):
  - Rename `PrefixDirective` selector `'[slot="prefix"]'` → `'[twPrefix]'` at `:339`. Same for `SuffixDirective` → `'[twSuffix]'`.
  - Update every consumer demo page using `slot="prefix"`/`slot="suffix"`.
  - Replace dev-mode `effect()` throw at `:613` with `console.error`.
  - Update form-field's own JSDoc/demo examples.
- **time-picker** (`projects/ngx-tw/time-picker/time-picker.ts`):
  - Route the active meridiem button at `:669` through the `color` input lookup table (currently hard-codes `bg-primary-500 text-on-primary`).
  - Add `// xs-density numeric field width — see CLAUDE.md icon sizing` justification comments next to each `w-5..w-9` at `:127, 134, 141, 148, 155`.
  - Migrate the auto-naked detection at `:572` to the `useNakedWhenInFormField` helper from S09.
- **button** (`projects/ngx-tw/button/button.ts`):
  - Drop `''` from `twButtonIcon` union at `:225` (currently `'' | 'leading' | 'trailing'`).
  - Add a one-line comment at `:232` documenting that `order: 'order-last'` assumes the button is a flex container.
**Out of scope:** button Accessibility-section addition (S05 already handled if present); button JSDoc mirror (S04); error-state matcher work in time-picker (already in place per audit).
**Files to edit:** `projects/ngx-tw/form-field/form-field.ts`, `projects/ngx-tw/time-picker/time-picker.ts`, `projects/ngx-tw/button/button.ts`, every `routes/**/*` demo file using `slot="prefix"`/`slot="suffix"`. Add changeset for form-field selector rename (breaking) and button union narrowing (potentially breaking).
**Acceptance check:**
```
rg -n 'slot="(prefix|suffix)"' projects/demo  # zero
rg -n '\[slot=' projects/ngx-tw/form-field    # zero
rg -n "twButtonIcon.*''" projects/ngx-tw/button  # zero (no empty-string in union)
rg -n 'bg-primary-500' projects/ngx-tw/time-picker  # zero (or only inside compound-variant maps with color lookup)
```

**Prompt body.**
Close Batch 2 form-field, time-picker, and button findings.

**Form-field.** Rename `PrefixDirective` selector to `[twPrefix]` and `SuffixDirective` to `[twSuffix]` at `form-field.ts:339`. The current selectors `[slot="prefix"]` / `[slot="suffix"]` misuse the standard HTML `slot` attribute as a directive selector — non-idiomatic and confusing in templates. Update every demo file that uses `slot="prefix"` or `slot="suffix"` to use `twPrefix` / `twSuffix`. Public-API breaking — add a changeset with migration text.

At `form-field.ts:613` replace the dev-mode `effect()` `throw` with `console.error(...)`. Throwing inside an effect surfaces as an unhandled Angular error with no recovery path; `console.error` keeps the dev signal without crashing the host app.

**Time-picker.** Three concerns:
1. `:669` — the active meridiem button hard-codes `bg-primary-500 text-on-primary`. Route through the `color` input via a `COLOR_LOOKUP` map (mirror checkbox's pattern at `checkbox.ts:55+`).
2. `:127, 134, 141, 148, 155` — the numeric field widths `w-5..w-9` are outside the spacing scale. They're justified by digit-width fitting, but each needs a one-line `// xs-density numeric field — fits 1–2 digit values, see CLAUDE.md` comment immediately above.
3. `:572` — migrate the auto-naked detection to `useNakedWhenInFormField` from S09's `ngx-tw/core/overlay/`.

**Button.** Two trivial fixes:
1. `:225` — drop `''` from the `twButtonIcon` union: `input<'leading' | 'trailing'>('leading')`. The empty-string member is undocumented and silently degrades to default. Public-API narrowing — add a changeset (minor).
2. `:232` — add a `// Assumes the host button is a flex container — order-last places this icon after siblings.` comment above `order: 'order-last'`.

---

### S11 — Display + status fixes (avatar, badge, alert, empty-state, skeleton, spinner, icon)

**Pre-requisites:** S02 (alert `size-3.5` comment already added), S03 (spinner.track rationale done), S04 (icon/skeleton JSDoc mirror).
**In scope (per-component checklist):**
- **avatar** (`projects/ngx-tw/avatar/avatar.ts`):
  - Replace the unconditional `aria-hidden` host binding at `:92-93` with conditional: `true` only when `displayMode() !== 'image'`.
  - Add a dev-mode `console.warn` when `displayMode() === 'image'` and `alt` is empty.
  - Replace `style.display` mutation in the `effect()` at `:252-258` with signal-driven `@if` or `[hidden]` binding.
  - Document `size-16` at `:52` and `size-[60%]` at `:43` as container-scale (not glyph-scale) via inline comment.
- **badge** (`projects/ngx-tw/badge/badge.ts`):
  - Refactor `pill` + `dot` + the cap-busting input set (`:220-242`) into either (a) an `appearance` config object input, or (b) a separate `[twBadgeDot]` directive for dot-mode. Pick (b) — directives are more discoverable than nested config and the dot has unique a11y (no text content).
  - Replace unconditional `role="status"` at `:190` with an opt-in `live = input<boolean>(false)` that toggles the role.
- **alert** (`projects/ngx-tw/alert/alert.ts`): expand `politeness` JSDoc at `:210-219` to call out the `'off'` no-re-announce semantic.
- **empty-state** (`projects/ngx-tw/empty-state/empty-state.ts`): snap `py-1.5`/`py-5` at `:72-76` to the inline-padding scale OR add per-line justification. Drop unused `hasIcon`/`hasActions` computed signals at `:242, 245`.
- **skeleton/spinner/icon**: verify JSDoc work from S03/S04 is complete; no new behavioral changes.
**Out of scope:** any other badge feature work; avatar group restructuring beyond the `style.display` fix.
**Files to edit:** the six library files above; new `projects/ngx-tw/badge/badge-dot.ts` if the directive split is taken; `projects/ngx-tw/badge/index.ts`; matching demo pages for badge + avatar. Add changeset for badge refactor (breaking).
**Acceptance check:**
```
rg -n "aria-hidden.*'true'" projects/ngx-tw/avatar   # gated on displayMode
rg -n 'role="status"' projects/ngx-tw/badge          # only inside @if(live()) or analogous gate
# Badge dot-mode usage migrated in demo
```

**Prompt body.**
Close Batch 6 findings.

**Avatar.** Three fixes:
1. The host binding currently emits `aria-hidden="true"` unconditionally (`:92-93`), which hides image-bearing avatars from screen readers — a serious a11y bug. Make it conditional on `displayMode() !== 'image'`. Image avatars rely on their `alt` text for accessibility.
2. When `displayMode() === 'image'` and `alt` is empty, log a dev-mode `console.warn('<tw-avatar> rendered as image without alt text — provide alt for accessibility')`.
3. `:252-258` — the avatar group `effect()` mutates `style.display` directly. Convert to signal-driven `[hidden]` binding (or `@if` if the element should leave the DOM).
4. Add a one-line `// Container scale — avatars are surfaces, not glyphs (CLAUDE.md icon sizing)` comment near `size-16` at `:52` and `size-[60%]` at `:43`.

**Badge.** Audit calls badge a "visual primitive" — explicitly excluded from the input-cap exception. Current 7 inputs + 1 output exceed the cap. **Split dot-mode into a `[twBadgeDot]` directive** (new file `badge-dot.ts`) — directives are discoverable, the dot has unique a11y (no text), and the remaining `BadgeComponent` lands at ≤6 inputs. Update demo pages to migrate consumers from `[dot]` input to the new directive. Add a changeset (breaking).

Replace unconditional `role="status"` at `:190` with `[attr.role]="live() ? 'status' : null"` and add `/** When true, announces badge content changes to assistive tech. Defaults to \`false\`. */ readonly live = input(false);`.

**Alert.** Expand the `politeness` JSDoc at `:210-219` to one line explaining the `'off'` semantic: "Use `'off'` to suppress re-announcements when the alert content updates after initial render."

**Empty-state.** `:72-76` — `py-1.5` / `py-5` are outside the inline-padding scale. Either snap to `py-2`/`py-4` (visual diff acceptable) or add an inline `// design-specified non-scale padding — alert/empty-state pairing` comment. Drop unused `hasIcon`/`hasActions` computeds at `:242, 245`.

**Skeleton / spinner / icon.** JSDoc work done in S03/S04. No new changes — verify.

---

### S12 — Tabs + tab-nav: keyboard accessibility + shared trigger variants extraction

**Pre-requisites:** S02 (`duration-normal` codified or replaced).
**In scope:**
- **Tab close button keyboard reachability** (`projects/ngx-tw/tabs/tabs.html:55-67`): convert `<span role="button" tabindex="-1">` to `<button type="button">` so keyboard users can reach it. Wire Delete/Backspace on the parent tab to also close.
- Scale the close container with the `size` input (`tabs.ts:43-44`) using the square interactive scale (`size-6`/`size-7`/`size-8`).
- Replace manual `document.activeElement` keyboard scan at `tab-nav.ts:285-323` and the equivalent in `tabs.ts` with CDK `FocusKeyManager`.
- Drop the no-op `linkRole = null` binding at `tab-nav.ts:375`.
- Extract shared trigger `tv()` config + active-state maps from `tabs.ts:38-44, 166-225` and `tab-nav.ts:36-37, 93-130` into `projects/ngx-tw/core/tab-trigger-variants.ts`. Migrate both to consume.
- Verify each component's spec has an Accessibility test group; add if missing.
**Out of scope:** any non-keyboard, non-extraction tab feature; pagination keyboard (S13); menu (S14).
**Files to edit:** `projects/ngx-tw/tabs/tabs.ts`, `projects/ngx-tw/tabs/tabs.html`, `projects/ngx-tw/tab-nav/tab-nav.ts`, new `projects/ngx-tw/core/tab-trigger-variants.ts`, `projects/ngx-tw/core/index.ts`, both spec files.
**Acceptance check:**
```
rg -n 'tabindex="-1"' projects/ngx-tw/tabs           # zero on close affordance
rg -n 'document\.activeElement' projects/ngx-tw/{tabs,tab-nav}  # zero
rg -n 'FocusKeyManager' projects/ngx-tw/{tabs,tab-nav}          # present
rg -n 'tabTriggerVariants' projects/ngx-tw/core                  # present
```

**Prompt body.**
Close Batch 5 tabs + tab-nav findings + the cross-cutting tabs/tab-nav trigger duplication (audit theme #7).

**Fix the keyboard-trap first.** `tabs.html:55-67` ships a tab close affordance as `<span role="button" tabindex="-1">` with `(keydown.enter)`/`(keydown.space)` handlers — `tabindex="-1"` means keyboard users can never focus it, so the keydown handlers can never fire. Convert to a native `<button type="button">`. Also wire Delete or Backspace on the parent tab button so keyboard-first users can dismiss without grabbing the close target.

**Scale the close container.** `tabs.ts:43-44` fixes the close container at `size-4` regardless of tab size. Use the square-interactive-target scale from CLAUDE.md: `size-6` (xs), `size-7` (sm), `size-8` (md). Inner glyph stays `size-4`.

**Adopt FocusKeyManager.** Both `tabs.ts` and `tab-nav.ts:285-323` hand-roll roving focus by scanning `document.activeElement`. Replace with CDK `FocusKeyManager` configured `.withWrap().withHorizontalOrientation('ltr').withHomeAndEnd()`. The pattern is already used in `accordion.ts:140-149` — copy that shape.

Drop the no-op `linkRole = null` binding at `tab-nav.ts:375` (anchors already advertise `role="link"`).

**Extract shared trigger variants.** `tabs.ts:38-44, 166-225` and `tab-nav.ts:36-37, 93-130` duplicate ~110 lines of `tv()` config + active-state lookup tables. Move to `projects/ngx-tw/core/tab-trigger-variants.ts` as a single `tabTriggerVariants` `tv()` config plus the four lookup maps (`UNDERLINE_ACTIVE_HORIZONTAL` etc.). Both components consume.

**Spec coverage.** Both tabs and tab-nav must have an Accessibility test group covering: ARIA `role="tab"`/`role="tablist"`, `aria-selected`/`aria-controls` wiring, arrow-key navigation, Home/End, focus management on tab activation. Add tests if missing.

---

### S13 — Paginator: raw-palette removal + FocusKeyManager + Sizes-section demo fix

**Pre-requisites:** S02 (`size-3.5` comment already in place), S04 (paginator JSDoc mirror), S05 (paginator demo sections).
**In scope:**
- **Codify** the "Navigation primitives" input-cap exception in CLAUDE.md (per design decision D4). Add a row to the **Input count cap** table listing `paginator` as the canonical example. **Do NOT pursue the config-object refactor.**
- Replace `bg-primary-600 text-white border-primary-600` active-page styling at `paginator.ts:155-171` with semantic tokens: `bg-{color}-500 text-on-{color} border-{color}-500` — routed through the `color` input.
- Replace manual roving keyboard navigation with CDK `FocusKeyManager` (mirror S12's pattern).
- Reframe the demo Sizes-section labels (currently `text-sm font-medium text-fg-muted mb-2`) to match the canonical demo-doc-page label pattern. Check `routes/button/examples` for the canonical labeling shape.
**Out of scope:** the API refactor originally proposed in the plan (D4 settles it). No `config` object input changes.
**Files to edit:** `projects/ngx-tw/paginator/paginator.ts`, `.claude/CLAUDE.md`, `projects/demo/src/app/routes/paginator/examples/paginator-examples.component.ts`.
**Acceptance check:**
```
rg -n 'bg-primary-600|text-white|border-primary-600' projects/ngx-tw/paginator  # zero
rg -n 'document\.activeElement' projects/ngx-tw/paginator                      # zero
rg -n 'paginator' .claude/CLAUDE.md                                            # new row under Input count cap
```

**Prompt body.**
**Design decision applied (D4): no config-object refactor.** After extracting the six secondary axes the plan originally listed, the paginator still has ~14 first-class axes — config-objecting doesn't solve the cap. Codify a fifth **Input count cap** exception in CLAUDE.md instead:

> | **Navigation primitives** | Pagination demands many independent semantic axes (boundary/sibling counts, layout, type, page-size selector, jump buttons, responsive collapse) that cannot be flattened. | `paginator` |

Material's `MatPaginator` carries comparable surface; this is the right shape.

**Then close the actual bugs:**

1. **Raw-palette active state** — `paginator.ts:155-171` hard-codes `bg-primary-600 text-white border-primary-600`. Route through the `color` input via a lookup map (mirror checkbox/switch). The active-page button should read `bg-{color}-500 text-on-{color} border-{color}-500` for whichever color the consumer set. Closes the Batch 5 "High" finding.

2. **Manual roving focus** — replace `document.activeElement` scanning with CDK `FocusKeyManager` configured `.withHorizontalOrientation('ltr').withHomeAndEnd()`. Pattern matches S12's tabs/tab-nav migration.

3. **Sizes-section demo labels** — `text-sm font-medium text-fg-muted mb-2` doesn't match the canonical demo-page label pattern. Open `routes/button/examples` (which is canonical) and adopt that shape.

Add a changeset only if the active-state color change is visually breaking — it shouldn't be, since `primary-500` is the default `color` and renders the same shade by default.

**Out of scope:** API surface changes, `[labels]`/`[linkFactory]` etc. removal, page-size selector behavior. The codified exception means those inputs stay.

---

### S14 — Breadcrumbs + menu + command-palette fixes

**Pre-requisites:** S02 (token sweep done), S03 (boolean defaults codified), S05 (breadcrumbs Playground added).
**In scope:**
- **breadcrumbs** (`projects/ngx-tw/breadcrumbs/breadcrumbs.ts`):
  - Rework the custom-separator HTML demo at `routes/breadcrumbs/examples/breadcrumbs-examples.component.ts:76` to go through `*twBreadcrumbsSeparator`.
  - Resolve the `size-9` lg=xl collapse at `:127, 135` — either codify in CLAUDE.md ("breadcrumb overflow trigger lg=xl") or bump xl to `size-10` per the square-interactive-target scale.
  - Drop the redundant `all.length > 2` check at `:432`.
- **menu** (`projects/ngx-tw/menu/menu.ts`):
  - Verify CDK Menu's `FocusKeyManager` integration skips disabled items at `:74`. If it doesn't, add `.skipPredicate(item => item.disabled())`.
  - Default `color = input<TwColor | undefined>(undefined)` at `:207` to a concrete value OR document the widening with a one-line comment.
  - Parametrise the submenu indicator at `:399` off `MenuComponent.size()` so it scales with the menu density.
- **command-palette** (`projects/ngx-tw/command-palette/command-palette.ts`):
  - **Blocker fix:** `activeIndex` `linkedSignal` at `:516-519` resets to first enabled item on every `filteredItems` emission. Key off a stable `id` set so unchanged-id-but-new-array-ref emissions don't reset selection. Use `linkedSignal({ source: () => filteredItems().map(i => i.id), computation: (ids, prev) => prev && ids.includes(prev) ? prev : ids[0] })` or equivalent.
  - Fix the close-timer leak at `:656-672`: early-return in the `setTimeout` callback when `!isAttached()`; clear the timer in destroy.
  - Differentiate active vs hover background at `:119, 125` — both are currently `bg-surface-muted`. Use a stronger token (e.g., `bg-surface-sunken` or `ring-2 ring-primary-500`) for the active option so the activedescendant carve-out is unambiguous.
  - Remove the Tab handler at `:756-758` that forcibly closes the palette — `FocusTrap` already cycles.
**Out of scope:** typeahead addition to command-palette (defer to future session unless trivial); any non-listed menu work.
**Files to edit:** the three library files; matching demo files for breadcrumbs. Add changeset for command-palette behavioral fixes (active-state reset + Tab handler removal).
**Acceptance check:**
```
rg -n 'all\.length > 2' projects/ngx-tw/breadcrumbs    # zero
# Spec: command-palette retains selected item when filteredItems emits same ids
# Spec: command-palette Tab key no longer closes palette
```

**Prompt body.**
Close Batch 5 findings on breadcrumbs + menu + command-palette.

**Breadcrumbs.** Rework `breadcrumbs-examples.component.ts:76` so the custom-separator demo uses `*twBreadcrumbsSeparator` (the recommended API) instead of inline HTML styling. At `breadcrumbs.ts:127, 135` the overflow trigger uses `size-9` for both lg and xl — decide: codify in CLAUDE.md ("breadcrumb overflow lg=xl"; rationale: the dropdown trigger doesn't need to scale further once it's reachable) OR bump xl to `size-10`. Pick codification — overflow trigger isn't size-sensitive past lg. Add the rationale row under the square-interactive scale notes. Drop the redundant `all.length > 2` check at `:432`.

**Menu.** Three fixes:
1. Verify FocusKeyManager honors disabled items. At `:74`, the menu's keyboard nav should `.skipPredicate(item => item.disabled())` — confirm and add if missing.
2. `:207` — `color = input<TwColor | undefined>(undefined)` widens the shared `TwColor` type. Either default to a concrete `'neutral'` OR add `// undefined means "inherit from parent menu context"` comment explaining the widening.
3. `:399` — the submenu indicator hardcodes `size-4`. Parametrise off `MenuComponent.size()` using the glyph scale: xs→`size-3`, sm→`size-4`, md→`size-5`.

**Command-palette.** The blocker first: `activeIndex` at `:516-519` resets to 0 every time `filteredItems()` emits a new array reference — even if the underlying ids are unchanged. Replace with a `linkedSignal` keyed on the **ids set**:

```ts
readonly activeIndex = linkedSignal({
  source: () => this.filteredItems().map(i => i.id),
  computation: (ids, prev) => {
    const prevId = prev !== undefined ? this.filteredItems()[prev.value]?.id : undefined;
    const next = prevId ? ids.indexOf(prevId) : -1;
    return next >= 0 ? next : this.firstEnabledIndex();
  },
});
```

(Verify exact shape against `linkedSignal` typing; the principle is "preserve selection when the id set doesn't change".)

Fix the close-timer leak at `:656-672` — early-return when `!isAttached()`; clear the timer in destroy via `DestroyRef.onDestroy()`.

Differentiate active vs hover at `:119, 125`. Both are `bg-surface-muted` — the activedescendant carve-out requires the active option be unambiguously distinguishable from resting/hover. Bump active to `bg-surface-sunken` plus a left border accent (`border-l-2 border-primary-500`).

Remove the Tab handler at `:756-758` — `FocusTrap` already cycles inside the modal; the explicit close was redundant and surprising.

Add a changeset (behavioral; selection-preservation + Tab handler removal are observable).

---

### S15a — Accordion + collapsible consolidation

**Pre-requisites:** S02 (token sweep applied to any touched files), S05 (demo sections done).
**In scope (per design decision D1):**
- Make `AccordionComponent extends CollapsibleGroupComponent`. The existing `providers: [{ provide: CollapsibleGroupComponent, useExisting: forwardRef(() => AccordionComponent) }]` at `accordion.ts:70-75` already establishes the polymorphism — finish the job in code.
- Delete the duplicated `syncChildrenFromValue` / `toggleItem` / `onTriggerKeydown` / FocusKeyManager wiring at `accordion.ts:107-212`. Override only what differs (e.g., the `aria-multiselectable` host attribute and the `collapsible` opt-out semantics in `'single'` mode).
- Emit explicit `aria-multiselectable="false"` in `'single'` mode at `accordion.ts:65` (currently the binding emits only `'true' || null`).
- Drop the wrapper `role="group"` at `accordion.ts:63` per APG.
- Change `value = model<string | string[]>('')` at `accordion.ts:88` default to `null` (single) or `[]` (multiple). Pick `null` and document — empty-string-as-sentinel is awkward.
- **Collapsible-side:** justify `ViewEncapsulation.None` on `CollapsibleTriggerDirective` at `collapsible.ts:162` with a one-line `// ViewEncapsulation.None — directive host is the consumer's <button>; we cannot scope styles to a host shadow.` comment. (The directive is a Component-as-directive; encapsulation only matters if it has its own template — verify.)
**Out of scope:** table polish (S15b); any behavioral change to `CollapsibleGroupComponent` that isn't required by accordion's consolidation.
**Files to edit:** `projects/ngx-tw/accordion/accordion.ts`, `projects/ngx-tw/collapsible/collapsible.ts`, both `.spec.ts` files. Add changeset (high-risk structural change; behavior should be preserved but verify).
**Acceptance check:**
```
# Accordion class body is now small — extends does the heavy lifting
wc -l projects/ngx-tw/accordion/accordion.ts   # should drop ~80 lines
# Both selectors still work
rg -n 'tw-accordion|tw-collapsible-group' projects/demo  # present
# ARIA explicit
rg -n 'aria-multiselectable' projects/ngx-tw/accordion   # emits both 'true' and 'false', never null
```

**Prompt body.**
**Design decision applied (D1): consolidate by inheritance, keep both selectors.**

The audit's "Batch 8 accordion" + "Batch 8 collapsible" findings reveal `AccordionComponent.toggleItem` (`accordion.ts:168-212`) and `CollapsibleGroupComponent.toggleItem` (`collapsible.ts:454-503`) are ~95% identical. The provider block at `accordion.ts:70-75` already wires accordion to be seen as a collapsible group by descendants. **Finish the deduplication: `class AccordionComponent extends CollapsibleGroupComponent`.**

Override on `AccordionComponent` only:
- `host.role` — drop `'group'` per APG (accordions don't need it).
- `host['[attr.aria-multiselectable]']` — emit `"true"` or `"false"` explicitly (never null) based on `type()`. APG requires the value.
- `value` — re-type as `string` in `'single'` mode while preserving the parent's `string | string[]`. Default to `null` (after widening) rather than `''` — empty-string sentinel was awkward. Document the breaking-default in the changeset.
- The `accordion = true` semantic flows from a `protected override readonly accordion = computed(() => true)` (or equivalent) so the parent's `toggleItem` branches the right way.

Delete `accordion.ts`'s duplicated `syncChildrenFromValue`, `toggleItem`, `onTriggerKeydown`, and the constructor's `effect()` that mirrors what the parent does. The two `useExisting` providers (`CollapsibleGroupComponent` → `AccordionComponent`) and the parent's `contentChildren` / `FocusKeyManager` wiring stay correct.

**Collapsible-side cleanup:** at `collapsible.ts:162`, the `CollapsibleTriggerDirective` declares `encapsulation: ViewEncapsulation.None`. Verify whether the trigger has its own template (a quick check — directives without templates don't apply encapsulation). If template-bearing, add a one-line `// ViewEncapsulation.None — host class binding must apply to the consumer's <button>.` comment. If template-less, drop the encapsulation declaration.

**Spec coverage** is critical: every accordion test scenario must still pass post-inheritance. Add an inheritance-specific test that confirms `<tw-accordion>` and `<tw-collapsible-group accordion>` produce identical DOM + behavior on the same data.

**Out of scope:** table polish (S15b); collapsible behavioral changes beyond the encapsulation comment.

---

### S15b — Table polish

**Pre-requisites:** S01 (table directive renames already landed; `CellDefDirective` etc. exist).
**In scope:**
- Replace `backdrop-blur-[1px]` at `table.ts:353` with `backdrop-blur-sm`.
- Replace `[&>thead>tr>th]:shadow-[0_1px_0_0_var(--color-border)]` at `table.ts:445` with a tokenised shadow. Two options: (a) define `--shadow-table-sticky` in `theme/_semantic.css` and reference; (b) reuse `shadow-sm` with overrides. Pick (a) — sticky-header shadow is a recurring need, deserves a token.
- `data-label` stack-mode at `table.ts:493-497` double-read: add `aria-hidden="true"` on the retained `<th>` so screen readers don't read the label twice (once from `data-label::before`, once from `<th>`).
- Add `'OPTION'` to the `INTERACTIVE_TAGS` set at `table.ts:516`.
- Loading announcement at `table.ts:1207-1223` — keep the `untracked` pattern but add a `// untracked() prevents re-announcement on unrelated state changes` comment so the intent is documented; otherwise leave behavior unchanged.
**Out of scope:** the `Tw*` renames (S01); any restructure of the data-binding API; PR8's v2 grouping refactor mentioned in CLAUDE.md.
**Files to edit:** `projects/ngx-tw/table/table.ts`, possibly `projects/ngx-tw/theme/_semantic.css` (new token).
**Acceptance check:**
```
rg -n 'backdrop-blur-\[' projects/ngx-tw/table        # zero
rg -n 'shadow-\[0_1px_0_0' projects/ngx-tw/table      # zero
rg -n "'OPTION'" projects/ngx-tw/table                # present in INTERACTIVE_TAGS
```

**Prompt body.**
Close Batch 8 table findings (post-S01 rename).

**Arbitrary-value cleanup.** Two arbitrary values:
1. `table.ts:353` — `backdrop-blur-[1px]` → `backdrop-blur-sm`. Tailwind's `sm` is 4px; if the visual diff is meaningful, codify a `--blur-table-overlay` token in `theme/_semantic.css` instead. Inspect visually before choosing.
2. `table.ts:445` — `shadow-[0_1px_0_0_var(--color-border)]` is a sticky-header bottom border posing as a shadow. Define a new token in `theme/_semantic.css`:
   ```css
   --shadow-table-sticky: 0 1px 0 0 var(--color-border);
   ```
   Then use `[&>thead>tr>th]:shadow-(--shadow-table-sticky)` (or the v4 equivalent for custom shadow tokens — verify CSS-var-as-shadow syntax in Tailwind v4).

**Stack-mode a11y.** `table.ts:493-497` renders a `data-label` via `::before` while leaving the `<th>` visible — screen readers read both. Add `aria-hidden="true"` on the retained `<th>` (or `role="presentation"`).

**Interactive tags.** `INTERACTIVE_TAGS` at `:516` is missing `'OPTION'`. Add it. (The set is used to determine when a click on a row should not trigger row selection.)

**Loading announce.** `:1207-1223` uses `untracked` to avoid re-firing the loading announcement. Audit calls this "brittle" — keep the pattern (it works) but add a `// untracked() prevents re-announcement when unrelated signals upstream change. See https://angular.dev/guide/signals/effects` comment so the intent survives future edits.

**Out of scope:** any column-binding refactor; the PR8 v2 grouping work.

---

### S16 — Sort + segmented-control + code-block + carousel + flip-card

**Pre-requisites:** S02 (sort `size-3.5` comment landed), S04 (any JSDoc work).
**In scope (per-component checklist):**
- **sort** (`projects/ngx-tw/sort/sort.ts`, `sort-header.ts`):
  - Verify the `size-3.5` justification comment from S02 is at `sort-header.ts:64`.
  - Drop signal output/input aliasing at `sort.ts:83` (Compodoc noise) OR document why aliasing is needed.
  - Convert constructor `effect` calling `ariaDescriber.describe` at `sort-header.ts:178-187` to `afterNextRender` (one-shot effect, not a reactive subscription).
  - Move lifecycle interfaces at `sort-header.ts:136` to `afterNextRender` + `DestroyRef.onDestroy` if cleaner.
- **segmented-control** (`projects/ngx-tw/segmented-control/segmented-control.ts`):
  - Move `ACTIVE_CLASSES`/`INACTIVE_CLASSES` at `:63-102` into the `tv()` config as `compoundVariants`. Single source of styling.
  - Add a dev-mode guard at `:130`: if `inject(SegmentedControlComponent, { optional: true })` returns null, log a `console.error('<tw-segmented-control-option> must be a child of <tw-segmented-control>')`.
  - Drop `rootClass`/`optionClass` inputs at `:213, 216` (duplicate normal Angular class binding).
- **code-block** (`projects/ngx-tw/code-block/code-block.ts`):
  - Add `role="region"` to the outer host OR document why the inner `<pre>` owns it at `:80, 107`.
  - Change `isCopied` at `:141` from a private signal to a `model()` so consumers can observe.
  - Surface clipboard failure at `:182-194` via a `copyFailed = output<Error>()` event (silently swallowing is bad UX).
  - Remove the duplicated host class on `CodeBlockHeaderDirective` at `:41`.
- **carousel** (`projects/ngx-tw/carousel/carousel.ts`):
  - Define `--color-overlay-control` semantic token in `theme/_semantic.css`. Replace `bg-black/40` and `hover:bg-black/60` at `:206-208, 259`.
  - Verify all 24 `*-solid` / `*-solid-fg` token names referenced at `:122-153` exist in `theme/_semantic.css`. Add any missing.
  - Document the closure-capture pattern in `_onPointerUp` at `:1286-1294` with a one-line comment.
  - Drop `_effectiveSlidesToScrollView()` at `:568` if it's redundant with the corresponding signal.
- **flip-card** (`projects/ngx-tw/flip-card/flip-card.ts`):
  - Announce content via `LiveAnnouncer` in interactive modes too at `:186, 252-264` (currently `aria-live='polite'` only in `'manual'` mode).
  - Replace `MutationObserver` at `:242-250` with `contentChild()` + `read: ElementRef`.
  - Document the hard dependency on `theme/_base.css` keyframe classes (`tw-flip-perspective`, etc.) in a JSDoc comment at `:34-63`.
**Out of scope:** any non-listed feature work on these components; demo restructuring beyond what was done in S05.
**Files to edit:** the five library files; new entry in `theme/_semantic.css` for `--color-overlay-control`. Add changeset for code-block model() conversion (minor breaking) and segmented-control input removals (minor breaking).
**Acceptance check:**
```
rg -nB1 'size-3\.5' projects/ngx-tw/sort | rg -v '//'                # every match preceded by '//'
rg -n 'bg-black/' projects/ngx-tw/carousel                            # zero
rg -n 'ACTIVE_CLASSES|INACTIVE_CLASSES' projects/ngx-tw/segmented-control  # zero (moved into tv())
rg -n 'rootClass|optionClass' projects/ngx-tw/segmented-control       # zero
```

**Prompt body.**
Close Batch 8's sort, segmented-control, code-block, carousel, and flip-card findings.

**Sort.** Verify S02 already added the `size-3.5` comment at `sort-header.ts:64`. Drop the signal-aliasing pattern at `sort.ts:83` — each input/output alias clouds the Compodoc-extracted name. If a specific alias is load-bearing for back-compat, document why with `// alias preserved for back-compat — name change shipped in vX.Y`. Convert `sort-header.ts:178-187`'s constructor `effect` that calls `ariaDescriber.describe` to `afterNextRender` — it's a one-shot DOM-tagging, not a reactive subscription. Cleanup via `DestroyRef.onDestroy(() => ariaDescriber.removeDescription(el))`.

**Segmented-control.** Move `ACTIVE_CLASSES` and `INACTIVE_CLASSES` maps at `:63-102` into the `tv()` config's `compoundVariants` so all styling lives in one place. Add a dev-mode guard at `:130`: when the option's `inject(SegmentedControlComponent, { optional: true })` returns null, log a console.error explaining the parent-requirement. Drop `rootClass`/`optionClass` inputs at `:213, 216` — Angular's standard class binding already handles consumer overrides via `twMerge`. Breaking change — changeset.

**Code-block.** At `:80`-`107` the outer host has no `role` while the inner `<pre role="region" tabindex="0">` owns the a11y semantics. Add `role="region"` to the outer host with `aria-label="Code block"` OR add a JSDoc comment explaining the inner-element semantics. Pick the JSDoc — pre-element ownership is correct, just undocumented. Convert `isCopied` at `:141` from `private signal()` to `model()` so consumers can two-way bind. Surface clipboard failure at `:182-194` via a new `copyFailed = output<Error>()` event (don't throw — just emit). Drop the duplicated host class on `CodeBlockHeaderDirective` at `:41` that overlaps the `headerStart` slot styling.

**Carousel.** Define `--color-overlay-control` token in `theme/_semantic.css`:
```css
--color-overlay-control: oklch(0 0 0 / 0.4);
--color-overlay-control-hover: oklch(0 0 0 / 0.6);
```
Replace `bg-black/40` and `hover:bg-black/60` at `:206-208, 259` with `bg-overlay-control` / `hover:bg-overlay-control-hover`. Run `rg -n '\b(primary|secondary|accent|neutral|info|success|warning|error)-solid' projects/ngx-tw/theme/_semantic.css` and verify all 24 token names referenced at `carousel.ts:122-153` exist; add any missing. Add the closure-capture comment at `:1286-1294`. If `_effectiveSlidesToScrollView()` at `:568` duplicates a signal, drop the method.

**Flip-card.** In interactive modes (`'hover'`, `'click'`), the back content currently toggles silently. Add a `LiveAnnouncer.announce(backLabel)` on flip. Replace the `MutationObserver` at `:242-250` with `contentChild('back', { read: ElementRef })` — signal-driven and lighter. At `:34-63` add a JSDoc note: "Requires keyframe classes `tw-flip-perspective` defined in `ngx-tw/theme/default.css`. Consumers must import the theme stylesheet."

---

### S17 — Indicators + overlays + feedback (progress-bar, stat, timeline, popover, toast, tooltip)

**Pre-requisites:** S02 (`text-base` stat carve-out codified), S03 (popover booleans codified), S04 (JSDoc mirror).
**In scope:**
- **progress-bar** (`projects/ngx-tw/progress-bar/progress-bar.ts`): refactor the `effect()` that mutates closure-scoped `warned` at `:307-319` to an `untracked()` one-time check. Verify API description mirror from S04.
- **stat**: verify `text-base` carve-out from S02 is in place with the inline comment.
- **timeline** (`projects/ngx-tw/timeline/timeline.ts`): mirror the `scrollControls` exception in `routes/timeline/api/timeline-api.component.ts`. Migrate `ngDevMode` global at `:1172` to `isDevMode()` for consistency with progress-bar.
- **popover**: verify boolean codification from S03 is complete.
- **toast** (`projects/ngx-tw/toast/toast-component.ts`):
  - Bump dismiss container from `size-5` at `:26` to `size-6` (keep inner SVG `size-4`).
  - Add a Tokens subsection in `routes/toast/api/toast-api.component.ts` documenting `TW_TOAST_DATA` and `TW_TOAST_REF`.
  - Add a `// safelist: tw-source inline(...) — see theme/index.css:37-41` comment near the `bg-${severity}-soft` compound-variant map so the JIT-safelist dependency survives future edits.
- **tooltip** (`projects/ngx-tw/tooltip/tooltip.ts`):
  - Migrate from raw `setAttribute('aria-describedby')` at `:449-452` to CDK `AriaDescriber.describe`/`removeDescription`. This deduplicates `aria-describedby` IDs when multiple tooltips share a target.
  - Document asymmetric `hideDelay = 0` vs `showDelay = 200` at `:328` with a one-line `// hideDelay defaults to 0 (immediate dismiss); showDelay defaults to 200ms (intent threshold).` comment.
**Out of scope:** new toast severities; popover behavioral changes beyond the boolean rationale work in S03; tooltip positioning math.
**Files to edit:** the five library files; `routes/timeline/api/*.ts`, `routes/toast/api/*.ts`. Add changeset for tooltip (AriaDescriber migration is an a11y improvement; emit-cycle could shift).
**Acceptance check:**
```
rg -n 'setAttribute\(.aria-describedby' projects/ngx-tw/tooltip  # zero
rg -n 'AriaDescriber' projects/ngx-tw/tooltip                    # present
rg -n 'ngDevMode' projects/ngx-tw/timeline                       # zero (migrated to isDevMode)
```

**Prompt body.**
Close Batch 7 findings.

**Progress-bar.** `:307-319` has an `effect()` mutating a closure-scoped `warned` boolean to fire a dev-mode warning once. The pattern is brittle — effect re-runs on dependency changes and the `warned` flag must persist across runs. Refactor to `untracked(() => { if (!this.warned && condition) { this.warned = true; console.warn(...); } })` inside a one-shot check on `afterNextRender`, OR pull the warning into the relevant setter.

**Stat.** S02 owned the `text-base` carve-out comment. Verify present at `stat.ts:107, 115`.

**Timeline.** The `scrollControls` exception in `timeline.ts` is documented inline; mirror in the demo API page. At `:1172` replace `ngDevMode` (global from Angular internals) with `import { isDevMode } from '@angular/core'` for consistency.

**Popover.** S03 owned the boolean codification. Verify CLAUDE.md lists all four popover booleans.

**Toast.** Bump the dismiss container at `toast-component.ts:26` from `size-5` to `size-6` per the square-interactive-target xs row (CLAUDE.md icon sizing). Inner SVG glyph stays `size-4`. In `routes/toast/api/*.ts` add a new "Tokens" subsection documenting `TW_TOAST_DATA` (data passed at open) and `TW_TOAST_REF` (closes the toast programmatically). Add a `// Safelist: see theme/index.css:37-41 @source inline(...) — interpolated bg-${severity}-soft classes` comment near the toast's compound-variant map so the load-bearing safelist dependency is visible at the use site.

**Tooltip.** The audit calls out that tooltip uses raw `setAttribute('aria-describedby')` at `:449-452` while the demo claims `AriaDescriber` usage. Migrate to CDK `AriaDescriber`:
```ts
private readonly _ariaDescriber = inject(AriaDescriber);
// on show:
this._ariaDescriber.describe(this._target, this._text());
// on hide / destroy:
this._ariaDescriber.removeDescription(this._target, this._text());
```
This deduplicates `aria-describedby` ids when multiple tooltips share the same target. Spec coverage: open two tooltips against the same target; verify only one id is added to `aria-describedby`.

Add the asymmetric-delay comment at `:328`. Add a changeset noting the AriaDescriber migration (a11y improvement; potential timing change).

---

### S18 — Picker overlay base extraction (date-picker / date-range-picker)

**Pre-requisites:** S09 (general overlay helpers already extracted to `ngx-tw/core/overlay/`).
**Design decision applied (D2): composition via injectable coordinator + pure helpers. No base class.**

**In scope:**
- **Pure functions** in `projects/ngx-tw/core/overlay/`:
  - `buildPickerPositions(): ConnectedPosition[]` — replaces both `buildDatePickerPositions` (`date-picker.ts:255-262`) and `buildDateRangePickerPositions` (`date-range-picker.ts:155-162`).
  - `resolvePickerScrollStrategy(input, overlay): ScrollStrategy` — replaces the per-picker resolvers.
  - `mergePickerPanelClass(input, internal): string | string[]` — replaces both panel-class resolvers.
  - Export const `PICKER_ANIMATION_DURATION = 150` (replaces the magic constant flagged at `date-picker.ts:259`; aligns with CLAUDE.md `duration-150`).
- **Injectable coordinator** `PickerOverlayCoordinator` in `projects/ngx-tw/core/overlay/picker-overlay-coordinator.ts`:
  - **Provided at the picker component level** (not `providedIn: 'root'` — library-services rule).
  - Wraps `OverlayRef`, `FocusTrap`, `CdkScrollable` lifecycle.
  - Exposes `open(config): Observable<PickerOpenEvent>` and `close(): void`.
  - `open()` emits *after* the enter animation completes (closes the synchronous-emit bug at `date-picker.ts:1199`).
  - Generates panel id via CDK `_IdGenerator`.
- **Migrate** both `DatePickerComponent` and `DateRangePickerComponent` to consume the coordinator + helpers. Delete the inline implementations.
- Bump `date-range-picker.ts:181-184` `clearButton` from `size-5` to `size-6` (sub-WCAG touch target fix from Batch 3).
**Out of scope:** API shape changes on either picker; the calendar refactor (S19); any feature additions.
**Files to edit:** new files under `projects/ngx-tw/core/overlay/`, `projects/ngx-tw/date-picker/date-picker.ts`, `projects/ngx-tw/date-range-picker/date-range-picker.ts`, `projects/ngx-tw/core/index.ts`. Add changeset (high risk — overlay timing).
**Acceptance check:**
```
rg -n 'buildDate(Picker|RangePicker)Positions' projects/ngx-tw  # zero (replaced by buildPickerPositions)
rg -n 'PickerOverlayCoordinator' projects/ngx-tw/{date-picker,date-range-picker}  # both consume
# Spec: opened() fires AFTER animation completes (not synchronously on open() call)
```

**Prompt body.**
**Design decision applied (D2): composition, not inheritance.** Per CLAUDE.md "compose, don't reinvent" — the extraction lives as pure helpers + an injectable coordinator, never as a base class or mixin.

This closes Batch 3's "Picker overlay duplication" theme: date-picker and date-range-picker independently re-implement position arrays, scroll-strategy resolvers, focus-trap lifecycle, animation constants, ID generators, panel-class merging, and aria-label fallback.

**Step (1) — Pure helpers.** Create `projects/ngx-tw/core/overlay/picker-positions.ts`:
- `buildPickerPositions(): ConnectedPosition[]` — verify the two existing arrays are byte-identical (Batch 3 says they are). Export from `core/overlay/index.ts`.
- `resolvePickerScrollStrategy(name: PickerScrollStrategyName, overlay: Overlay): ScrollStrategy`.
- `mergePickerPanelClass(consumer: string | string[] | undefined, internal: string): string[]`.
- Constant `export const PICKER_ANIMATION_DURATION = 150` — replaces the magic `120` at `date-picker.ts:259` and aligns with CLAUDE.md's `duration-150`.

**Step (2) — Coordinator.** Create `projects/ngx-tw/core/overlay/picker-overlay-coordinator.ts`. It's an `@Injectable()` (no `providedIn`) — each picker provides it locally:
```ts
@Component({
  selector: 'tw-date-picker',
  providers: [PickerOverlayCoordinator],
  ...
})
```
The coordinator owns:
- `OverlayRef` creation via `inject(Overlay)`.
- `FocusTrap` lifecycle (attach on open, restore on close).
- `_IdGenerator` (CDK) for panel id.
- An `opened$` `Subject<PickerOpenEvent>` that emits *after* the `animate.enter` animation completes — not synchronously on `open()`. This closes the `date-picker.ts:1199` bug. Hook the animation completion via `animationend` event listener on the panel element, gated on the named animation.
- A `close()` that triggers `animate.leave` then disposes the overlay.

**Step (3) — Migrate both pickers.** Replace their inline overlay logic with calls to the coordinator + helpers. The pickers themselves remain `Component`s; the coordinator does NOT extend anything.

**Step (4) — Polish.** Bump `date-range-picker.ts:181-184` `clearButton` to `size-6` (square-interactive xs row). Verify the `size-3.5` chevron at `date-range-picker.ts:191` keeps its existing justification comment.

**Spec coverage.** Both pickers' open/close/focus-trap/keyboard specs must pass post-migration. Add tests for the coordinator in isolation: `opened$` fires AFTER animation; `close()` cleans up overlay; multiple sequential open/close cycles don't leak.

Add a changeset (high risk — overlay timing change is observable; `opened()` event now fires later than before).

---

### S19 — Calendar / date-picker pre-1.0 deprecated surface removal + rangeBehavior config

**Pre-requisites:** S18 (picker overlay coordinator present; date-picker already migrated).
**Design decision applied (D3): ship `rangeBehavior` as a single config object input.**

**In scope:**
- **calendar** (`projects/ngx-tw/calendar/calendar.ts`):
  - **Drop** the three never-firing public outputs `opened`, `closed`, `renderedMonthsCount` at `:535-542, 553-558`.
  - **Drop** the no-op `blockInvalidRangeCommit` input at `:398`.
  - **Collapse** the four range-behavior booleans at `:418-436` (`allowSingleDayRange`, `persistPartialRange`, `allowBackwardRange`, `disableRangesCrossingDisabledDates`) into a single `rangeBehavior = input<Partial<RangeBehaviorConfig>>({})` input. Define `RangeBehaviorConfig` interface in `projects/ngx-tw/core/types.ts`. Defaults preserved via per-field destructuring: `const { allowSingleDayRange = true, ...} = this.rangeBehavior()`.
- **date-picker** (`projects/ngx-tw/date-picker/date-picker.ts`):
  - **Drop** the nine `@deprecated v2` standalone time inputs at `:491-529`. `timeConfig` is canonical.
- Update demo pages for calendar and date-picker to use the new APIs.
- Migration guide entry in the changeset (this is the biggest breaking change in the audit).
**Out of scope:** any non-deprecated surface change; date-range-picker (consumes calendar but its API doesn't change).
**Files to edit:** `projects/ngx-tw/calendar/calendar.ts`, `projects/ngx-tw/core/types.ts`, `projects/ngx-tw/date-picker/date-picker.ts`, `routes/calendar/**`, `routes/date-picker/**`. Add changeset (major breaking; pre-1.0 → it's the moment).
**Acceptance check:**
```
rg -n 'opened|closed|renderedMonthsCount' projects/ngx-tw/calendar  # zero (outputs)
rg -n '@deprecated v2' projects/ngx-tw/date-picker                  # zero
rg -n 'rangeBehavior' projects/ngx-tw/calendar                      # present (new config input)
rg -n 'allowSingleDayRange\s*=\s*input' projects/ngx-tw/calendar    # zero (moved into config)
```

**Prompt body.**
**Design decision applied (D3): `rangeBehavior` ships as a config object.** Pre-1.0 is the moment to consolidate the four cohesive booleans.

Close Batch 3's "Pre-1.0 deprecated surfaces" finding plus the calendar range-boolean cluster.

**Calendar deprecated surfaces.**
1. Remove the three public outputs at `calendar.ts:535-542, 553-558` (`opened`, `closed`, `renderedMonthsCount`). Each is annotated `@deprecated v1: inline-only` and never emits. Pre-1.0 → drop, don't deprecate longer.
2. Remove `blockInvalidRangeCommit` at `:398` — ships as a no-op with a dev warning. Either it's a real feature (then implement) or it's not (then drop). The audit confirms it's not. Drop.

**Calendar rangeBehavior config.**
Define in `projects/ngx-tw/core/types.ts`:
```ts
export interface RangeBehaviorConfig {
  /** Allow selecting the same day twice as a single-day range. */
  allowSingleDayRange: boolean;
  /** Keep a half-finished range across blur events. */
  persistPartialRange: boolean;
  /** Permit ranges where the second click precedes the first. */
  allowBackwardRange: boolean;
  /** Disable ranges that span a disabled date. */
  disableRangesCrossingDisabledDates: boolean;
}
```
Replace the four inputs at `:418-436` with:
```ts
/** Range-mode behavior knobs. Defaults: { allowSingleDayRange: true, persistPartialRange: true, allowBackwardRange: false, disableRangesCrossingDisabledDates: false }. */
readonly rangeBehavior = input<Partial<RangeBehaviorConfig>>({});
```
Internally destructure with defaults at every read site. The three `true`-codified entries in CLAUDE.md (calendar.allowSingleDayRange, .persistPartialRange) move from "input(true) entries" to a single comment on the config-object default block.

**Date-picker deprecated inputs.** Drop the nine `@deprecated v2` time inputs at `:491-529`. `timeConfig` is canonical (already shipping). Update demo pages.

**Migration guide.** This is a **major breaking change**. Write a changeset entry documenting:
- Calendar outputs `opened`/`closed`/`renderedMonthsCount` removed (no replacement; they never fired).
- Calendar four range booleans → single `[rangeBehavior]` object input.
- Date-picker nine time inputs → `[timeConfig]` object input (with field-name mapping).
- Calendar's `blockInvalidRangeCommit` removed (no replacement; it was a no-op).

**Spec coverage.** Every existing calendar spec covering the four booleans must migrate to the config-object shape. Verify date-picker specs using the dropped time inputs all migrate to `timeConfig`.

---

### S20 — Dialog/sheet overlay-container-base extraction

**Pre-requisites:** S01 (dialog classes renamed), S02 (`text-base` step-down on dialog/sheet titles done).
**Design decision applied (D2 spillover): composition pattern from S18 carries over.**

**In scope:**
- Create `projects/ngx-tw/core/overlay/overlay-container-base/` containing:
  - Pure helpers: `mergeOverlayPanelClass(consumer, internal)`, animation-class resolver, aria-describedby/labelledby id queue management functions.
  - Injectable `OverlayContainerCoordinator` (provided locally, not `providedIn: 'root'`) for FocusTrap + `animate.enter`/`animate.leave` lifecycle.
  - Ancestor-DI helper to replace `findEnclosingDialog`'s DOM walk at `dialog-content.ts:213-225` (e.g., a token + `inject(DIALOG_REF, { host: true, optional: true })` pattern).
- Migrate `DialogContainerComponent` (post-S01 rename) and the sheet container components to consume the helpers + coordinator.
- Resolve `findEnclosingDialog` brittleness by replacing the DOM walk with ancestor-DI injection.
**Out of scope:** dialog/sheet API surface changes; new dialog features.
**Files to edit:** new files under `projects/ngx-tw/core/overlay/overlay-container-base/`, `projects/ngx-tw/dialog/dialog-container.ts`, `projects/ngx-tw/dialog/dialog-content.ts`, `projects/ngx-tw/sheet/sheet-container.ts`, `projects/ngx-tw/sheet/sheet-content.ts`. Add changeset.
**Acceptance check:**
```
rg -n 'findEnclosingDialog' projects/ngx-tw  # zero (replaced by ancestor DI)
rg -n 'OverlayContainerCoordinator' projects/ngx-tw/{dialog,sheet}  # both consume
# Spec: dialog and sheet open/close/escape/backdrop tests pass post-migration
```

**Prompt body.**
**Design decision applied (D2 spillover): composition via injectable coordinator + pure helpers, no base class.** Same shape as S18's picker work — the patterns must be visually consistent across `core/overlay/`.

Close Batch 4's "dialog and sheet duplicate ~80% of plumbing" finding plus `findEnclosingDialog`'s DOM-walk brittleness.

**Step (1) — Pure helpers** in `projects/ngx-tw/core/overlay/overlay-container-base/`:
- `mergeOverlayPanelClass(consumer: string | string[] | undefined, internal: string[]): string[]` — replaces both `panelClass` merge implementations (`sheet-container.ts:168-173` + dialog equivalent).
- `resolveContainerAnimation(state: 'enter' | 'leave'): string` — resolves the `animate.enter`/`animate.leave` class name based on container state.
- A small `AriaIdQueue` helper class for the `aria-describedby` / `aria-labelledby` id queue both containers manage. Pure data structure, no DOM.

**Step (2) — Coordinator.** `OverlayContainerCoordinator` is `@Injectable()` (no `providedIn`); each container provides it locally:
```ts
@Component({
  selector: 'tw-dialog-container',
  providers: [OverlayContainerCoordinator],
  ...
})
```
The coordinator owns:
- `FocusTrap` attach/restore lifecycle.
- `animate.enter` → `animationend` → emit `entered$`; `animate.leave` → `animationend` → emit `exited$`.
- `_IdGenerator` for container id.

**Step (3) — Replace `findEnclosingDialog`.** `dialog-content.ts:213-225` walks the DOM to find the enclosing `<tw-dialog-container>`. This breaks when nested under portals. Replace with ancestor-DI injection:
```ts
private readonly dialogRef = inject<TwDialogRef<unknown, unknown>>(TwDialogRef, { optional: true });
private readonly container = inject(DialogContainerComponent, { optional: true, skipSelf: true });
```
The container's element is the closest provider — Angular's DI finds it without DOM traversal. Apply the same pattern to every directive that currently calls `findEnclosingDialog` (Title, Description, Close — 4-5 directives total). The function itself can be deleted.

**Step (4) — Migrate both containers.** Delete the now-duplicated inline implementations from `DialogContainerComponent` and `SheetContainerComponent`. Both classes shrink to mostly DOM template + variant wiring.

**Spec coverage.** Critical here — touches every dialog/sheet open/close path. Re-run all existing specs. Add coordinator-level specs (entered$/exited$ fire after animations; cleanup on destroy).

Add a changeset (behavior-equivalent refactor; spec coverage is the guarantee).

---

## Audit gaps spotted

These are findings/concerns not in the original audit or plan, but surfaced during this prompt-architecture pass. Logging them here so the team can decide separately; **do NOT add sessions for them in this plan.**

1. **S03 acceptance check tightening.** The original plan's S03 mentions adding popover/time-picker entries to CLAUDE.md's codified list but its acceptance check only greps for `input(true)` rationale comments. This file's S03 prompt tightens the acceptance check with `rg -n 'twPopoverArrow|showSteppers|showClear' .claude/CLAUDE.md` so the documentation update is also verified.

2. **Calendar `model<string | string[]>('')` empty-string default.** Audit calls it Low; S15a folds the fix in. If S15a is delayed, this remains a small ergonomic wart in single-mode (`value() === ''` is not the same shape as `value() === null`).

3. **Sheet `panelClass` extraction parity.** S20 extracts this for both dialog and sheet, but the original Batch 4 finding only flagged it on sheet (`sheet-container.ts:168-173`). The dialog equivalent exists implicitly; verify it's covered in S20's helper.

4. **`core/` entry-point structure under load.** S09, S12, S18, S20 all add to `projects/ngx-tw/core/`. If the `core/` entry point becomes large enough, splitting into `core/overlay`, `core/variants`, `core/types` as separate secondary entry points may be warranted — but only do this if `ng-package.json` build time or tree-shaking measurably suffers. Out of scope for the 21 sessions; flag for future maintenance.

5. **CI lint dependency.** Phase 4's CI lint task is described as "bundled with Phase 1 PRs when convenient" — the lint rules are critical to prevent regression of the S02/S03 token sweeps. Recommend bundling specifically with S02 (which establishes the patterns the lints enforce) rather than leaving "when convenient" — otherwise the next agent re-introduces violations between Phase 1 and Phase 4.

6. **Tabs/tab-nav spec ARIA coverage.** S12 mentions "verify spec covers ARIA tabs pattern; add Accessibility test group if missing" but doesn't anchor the spec path. The check is `rg -l 'describe.*[aA]ccessibility' projects/ngx-tw/{tabs,tab-nav}` — if zero matches, add the test group.

7. **`role="status"` audit follow-up.** Audit Batch 6 pattern #3 calls out `role="status"` proliferation (badge unconditional, spinner always-on, skeleton conditional). S11 fixes badge. Spinner and skeleton may need similar opt-in `live` semantics — not addressed in any session. Low risk; flag.
