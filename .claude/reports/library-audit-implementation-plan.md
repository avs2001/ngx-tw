# ngx-tw audit — implementation plan

**Source report:** `.claude/reports/library-audit-2026-05-27.md`
**Effort estimate:** 20 sessions, sequenced in 4 phases.
**Strategy:** Land the cheap cross-cutting hygiene PRs first (Phase 1) so component-internal sessions in Phase 2 don't keep re-introducing the same patterns. Phase 3 is heavy refactor work that needs design alignment. Phase 4 turns the rules we've enforced manually into CI lint.

---

## Session-count rationale

The audit surfaced ~200 findings. Naïvely 1 PR per component would be 48 sessions; 1 PR per finding would be ~200. Neither is right.

**Coalesce when:**
- Multiple components share the *same rule violation* (text-base, duration-normal, size-3.5 comment, `<pre>` migration, JSDoc mirror) — one cross-cutting sweep PR.
- Findings cluster on a *single component* and touch the same files — one component-focused PR.
- Two siblings have a *duplication problem* that needs a shared base — one refactor PR covers both (e.g. dialog/sheet, date-picker/range-picker).

**Split when:**
- A finding changes *public API* — must land alone so its breaking-change footprint is reviewable (calendar/date-picker deprecated-surface removal; paginator config-object refactor; badge cap-compliance).
- A finding is *high-risk* (CVA convergence touches all form controls; overlay-base extraction touches multiple components).

That math lands at **20 sessions**.

---

## Phase 1 — Hygiene sweeps (cross-cutting, low risk)

These run first because they re-establish the rule baseline. Subsequent Phase 2 sessions inherit a clean canvas and don't have to re-litigate the same violations.

### S01 — `Tw*` class-name rename + CLAUDE.md staleness fix
**Scope.** Rename `TwDialog*` (9 directives in `projects/ngx-tw/dialog/`) and `TwCellDefDirective`/`TwHeaderCellDefDirective`/`TwFooterCellDefDirective`/`TwNoDataRowDirective`/`TwRowExpansionDirective` (5 in `projects/ngx-tw/table/table.ts`) to drop the `Tw*` prefix. Update `index.ts` barrel exports + `public-api.ts`. Update CLAUDE.md to (a) remove the stale `TwCalendarPresets` entry from the exempt list since the rename already landed (`calendar-presets.ts:14` is `CalendarPresetsDirective`), and (b) reflect the dialog+table rename outcome.
**Files.** `projects/ngx-tw/dialog/dialog-content.ts`, `dialog-container.ts`, `dialog/index.ts`; `projects/ngx-tw/table/table.ts`, `table/index.ts`; `projects/ngx-tw/public-api.ts`; `.claude/CLAUDE.md`.
**Selectors unchanged.** Element/attribute selectors keep their `tw-`/`tw` prefix; only class identifiers change. Public-API consumer impact: yes — TS class names are imported.
**Risk.** Medium (breaking — public class names rename). Add changeset.
**Effort.** ~2h.
**Acceptance.** `grep -r "TwDialog" projects/ngx-tw` returns zero matches; same for `TwCellDef`/`TwHeaderCellDef`/`TwFooterCellDef`/`TwNoDataRow`/`TwRowExpansion`. CLAUDE.md exempt list contains only `TwSplit*` (and types `TwColor`/`TwSize`).

### S02 — Token violations sweep (text-base + duration-normal + size-3.5 + raw `<pre>`)
**Scope.** Four cross-cutting rule violations in one sweep:
1. **`text-base` outside the `tw-item lg` carve-out.** Change `sheet-content.ts:70` (SheetTitleDirective) and `dialog-content.ts:71` (TwDialogTitleDirective → renamed in S01) to `text-sm font-semibold`. Verify `stepper.ts:91, 95` qualifies under "Trigger font size scale" — if yes, add inline comment; if no, step down. Decide whether `stat.ts:107, 115` lg/xl value sizes need a codified carve-out (KPI tile) — if yes, update CLAUDE.md; if no, step down.
2. **`duration-normal` codification or replacement.** This token is real (`theme/_typography.css:8`, 200ms) but uncodified. Decide: add `duration-normal` to CLAUDE.md Visual Design System → Transitions table OR replace every usage with `duration-200`. Recommend codification — it's a stable theme token; just add the row.
3. **`size-3.5` half-step justification comments.** Add the missing one-line `//` comment at `sort-header.ts:64`, `paginator.ts:275`, and `alert.ts:175` (template inline SVG).
4. **Raw `<pre>` migration → `tw-code-block`.** Replace `<pre>...<code>` blocks in `projects/demo/src/app/routes/accordion/**`, `routes/collapsible/**`, `routes/sort/examples/sort-examples.component.ts`, `routes/segmented-control/**` with `<tw-code-block>` (Pattern A or B per demo-doc-page SKILL).
**Files.** Multi-target sweep; see paths above.
**Risk.** Low (visual only; demo-only changes for migration #4).
**Effort.** ~3h.
**Acceptance.** `grep -r 'text-base' projects/ngx-tw/{dialog,sheet}` returns zero. `grep -r 'duration-normal' projects/ngx-tw` either decreases to zero OR CLAUDE.md gains a `duration-normal` row. Every `size-3.5` in `projects/ngx-tw` has a `//` comment on the previous line. `grep -r '<pre ' projects/demo/src/app/routes/{accordion,collapsible,sort,segmented-control}` returns zero (excluding `<pre>` inside `<tw-code-block>` template internals).

### S03 — Boolean `true`-default rationale sweep + CLAUDE.md codified list refresh
**Scope.** Three actions:
1. Add inline-JSDoc rationale to every `input(true)` in the library that lacks one (`stepper.showError`, `stepper.headerInteractive`, plus any not-yet-rationalised in time-picker/popover/spinner).
2. Refresh the codified `true`-default list in CLAUDE.md to include the four popover booleans (`twPopoverArrow`, `twPopoverCloseOnOutside`, `twPopoverCloseOnEscape`, `twPopoverTrapFocus`) and time-picker (`showSteppers`, `showClear`). Add `spinner.track` rationale ("without the track ring the spinner reads as a partial arc, not a loading indicator") since CLAUDE.md already lists it.
3. Verify there are no other `input(true)` violations by `grep -n 'input(true' projects/ngx-tw`.
**Risk.** Low (documentation/comments only).
**Effort.** ~1h.
**Acceptance.** Every `input(true)` in `projects/ngx-tw` either appears in the CLAUDE.md codified list OR carries a one-line `//` rationale comment immediately above the declaration.

### S04 — JSDoc → demo API verbatim mirror pass + missing `Defaults to …` suffixes
**Scope.** Two actions:
1. Add missing `Defaults to \`X\`.` suffixes in library JSDoc on every public `input()`/`output()`/`model()` that omits one. Audit driven by `skeleton.ts:107`, `icon.ts:110,113,122` (named in report) plus a `grep`-based sweep across the library.
2. Update demo API page descriptions to **verbatim mirror** the JSDoc one-liner (not paraphrase) for: progress-bar, stat, popover, toast, tooltip, select, button.
**Files.** `projects/ngx-tw/*/*.ts` (JSDoc additions) and `projects/demo/src/app/routes/*/api/*.ts` (description cells).
**Risk.** Low (text/comment changes).
**Effort.** ~3h (bulk of time is the verbatim mirror across all paraphrasing API pages).
**Acceptance.** Every public `input()`/`output()`/`model()` JSDoc ends in `Defaults to \`...\`.` (or notes "no default — required") for inputs with defaults. Demo API description cells match the library JSDoc one-liner verbatim.

### S05 — Demo section canon completeness pass
**Scope.** Three actions across the demo doc-page surface:
1. **Add missing sections.** Variants section → `select/examples`; Template-driven forms section → `textarea/examples`, `calendar/examples`, `date-picker/examples`, `date-range-picker/examples`; Playground section → `textarea/examples`, `calendar/examples`, `breadcrumbs/examples`; Accessibility section → `button/overview`.
2. **Rename non-canonical section titles.** `form-field/examples`: "Appearance" → "Variants"; `combobox/examples`: "Disabled state" → "States".
3. **Strip impl-ref pollution.** Remove `(§21.2)`, `(§10.1)`, etc. from `calendar-examples.component.ts:102, 130, 157` titles.
**Files.** `projects/demo/src/app/routes/{select,textarea,calendar,date-picker,date-range-picker,breadcrumbs,button,form-field,combobox}/**`.
**Risk.** Low (demo-only, additive).
**Effort.** ~4h (writing the new sections is the bulk).
**Acceptance.** Every CVA component's Examples page has all three forms strategies in canonical order (Template-driven → Reactive → Signal). Every Examples page ends with a Playground. Section titles match the demo-doc-page SKILL canon.

---

## Phase 2 — Per-component cleanups (focused, parallelisable)

After Phase 1, the cross-cutting baseline is set. Phase 2 sessions are component-focused and can be picked off in any order. Group by component family for context economy.

### S06 — Form-control internals A (input, textarea, checkbox)
**Scope.**
- **input** — drop the `*Input` aliasing pattern (`requiredInput`, `readonlyInput`, `disabledInput`, `idInput`, `userAria*Input`); remove no-op `userAriaDescribedBy` computed wrapper (`input.ts:293`); unify with switch/radio plain-name pattern.
- **textarea** — verify it inherits the cleaned-up input API; resolve any `inputs: ['size']` re-declaration concerns with an `@internal` note (`textarea.ts:71`).
- **checkbox** — change `box: 'inline-flex … rounded-sm border …'` to `rounded-md` (`checkbox.ts:55`); document the `model()` + `linkedSignal()` dual-storage pattern OR simplify if mirror unjustified (`:312–373`); rename `requiredInput` (aliased) to plain `required`; add a Methods row in `checkbox-api.component.ts` for the public `toggle()` method.
**Risk.** Medium (input renames are breaking — if `requiredInput` is consumed externally). Verify exports before renaming.
**Effort.** ~3h.

### S07 — Form-control internals B (radio, switch, slider) + error-state matcher parity
**Scope.**
- **radio** — wire `NG_VALUE_ACCESSOR` on standalone `<tw-radio>` OR drop the standalone form-control claim (`radio.ts:213`); add `errorState`/`aria-invalid`/`TW_ERROR_STATE_MATCHER` integration; document the `RadioGroupComponent<T = unknown>` generic in the demo API page.
- **switch** — replace raw `text-white`/`text-black` (`switch.ts:113–121`) with `text-on-{color}` tokens; remove Enter keydown toggle (`switch.ts:318`) — ARIA `switch` pattern is Space-only; add `TW_ERROR_STATE_MATCHER` integration.
- **slider** — fix `errorState` to also read `_focused` (`slider.ts:494–502`); refactor `queueMicrotask` + manual `.subscribe` to use `takeUntilDestroyed` (`slider.ts:551–566`); rename `readonly input = output<…>()` shadow (`slider.ts:473`); memoize `markClassFor`/`bubbleClassFor` as `computed()` (`slider.ts:718`).
**Risk.** Medium (Enter keydown removal on switch is observable behavior change; mitigate with changeset entry).
**Effort.** ~4h.

### S08 — CVA registration convergence across all form controls
**Scope.** Pick the canonical CVA registration pattern (`NG_VALUE_ACCESSOR` + `forwardRef`, already used by switch/radio-group/select/combobox) and migrate the runtime-assignment variants: `checkbox.ts:357`, `slider.ts:545–547`, `date-picker.ts:594,786`, `time-picker.ts:708`. Add a `## ControlValueAccessor` subsection to CLAUDE.md codifying the chosen pattern.
**Risk.** Medium (touches every form control's DI plumbing; spec coverage critical).
**Effort.** ~3h.
**Why it lands as its own session.** Affects 5 components' constructors and provider arrays; better as a single coherent change with tests verifying form integration on all three strategies.

### S09 — Select + combobox internal fixes + shared overlay helpers (extraction)
**Scope.**
- **select** — drop bare `focus:outline-none` (`select.ts:173`); convert `<span role="button">` clear to native `<button type="button">` (`select.ts:398`); rewire `errorState` to `NgControl.invalid` matching time-picker (`select.ts:799,1498`).
- **combobox** — replace `focus-within:outline-neutral-500` with `focus-within:outline-border-strong` (`combobox.ts:134`); evaluate `focus-within:` outline chain (`combobox.ts:113`) — keep if deliberate, document if so; fix demo section order Colors→Sizes (`combobox-examples.component.ts:177`); rename "Disabled state" → "States" (already done in S05; verify).
- **Shared overlay infra.** Extract to `projects/ngx-tw/core/overlay/`: position-builder helper (`buildSelectPositions` ≈ `buildCombobox…`), scroll-strategy resolver, auto-naked detection (`useNakedWhenInFormField()`), Escape-on-overlay handler. Migrate select and combobox to consume the helpers.
**Risk.** Medium-high (overlay helpers touch positioning math — spec coverage on open/close, scroll-strategy switch, escape dismiss).
**Effort.** ~6h.

### S10 — Form-field + time-picker + button
**Scope.**
- **form-field** — rename `selector: '[slot="prefix"]'`/`'[slot="suffix"]'` to `'[twPrefix]'`/`'[twSuffix]'` (`form-field.ts:339`); update all consumer demo pages; replace dev-mode `effect()` throw with `console.error` (`form-field.ts:613`).
- **time-picker** — route active meridiem button through color input lookup (`time-picker.ts:669`); add justification comments next to `w-5..w-9` field widths (`:127,134,141,148,155`); migrate to `NG_VALUE_ACCESSOR` (covered in S08, sequence accordingly).
- **button** — drop `''` from `twButtonIcon` union (`button.ts:225`); update API description for `loading` to mirror JSDoc verbatim (handled in S04); document `order: 'order-last'` flex-container assumption.
**Risk.** Medium (form-field selector rename is breaking — every `slot="prefix"` consumer must change to `twPrefix`). Public-API impact.
**Effort.** ~3h.

### S11 — Display + status fixes (avatar, badge, alert, empty-state, skeleton, spinner, icon)
**Scope.**
- **avatar** — fix `aria-hidden` to only set `"true"` when `displayMode() !== 'image'` (`avatar.ts:92-93`); add dev-mode warning when image avatar has empty alt; replace AvatarGroup `style.display` mutation with `@if`/`[hidden]` (`avatar.ts:252-258`); document `size-16`/`size-[60%]` as container-scale (not glyph-scale).
- **badge** — fold `pill` + `dot` into an `appearance` config object OR split `dot`-mode into a `[twBadgeDot]` directive to fit the input cap; replace unconditional `role="status"` (`badge.ts:190`) with opt-in `live` input.
- **alert** — expand `politeness` JSDoc to call out the `'off'` no-re-announce semantic (`alert.ts:210-219`); add per-use comment on `size-3.5` dismiss-icon SVG (handled in S02; verify).
- **empty-state** — snap `py-1.5`/`py-5` to the inline-padding scale or add inline justification (`empty-state.ts:72-76`); drop unused `hasIcon`/`hasActions` computeds.
- **skeleton + spinner + icon** — JSDoc completeness handled in S04; verify in this session.
**Risk.** Medium (badge refactor breaks `[pill]`/`[dot]` consumer bindings).
**Effort.** ~5h.

### S12 — Tabs + tab-nav: keyboard accessibility + shared trigger variants
**Scope.**
- Fix tab close button keyboard reachability: `tabindex="-1"` → `tabindex="0"` on the close `<span role="button">` (preferably convert to `<button type="button">`) OR add Delete/Backspace handling on the parent tab button (`tabs.html:55-67`).
- Scale close container with the `size` input (`tabs.ts:43-44`) — use the square interactive scale (`size-6`/`size-7`/`size-8`).
- Replace manual `document.activeElement` keyboard scan in `tab-nav.ts:285-323` and the equivalent in `tabs` with CDK `FocusKeyManager`.
- Extract shared trigger `tv()` config + active-state maps from `tabs.ts:38-44, 166-225` and `tab-nav.ts:36-37, 93-130` to `projects/ngx-tw/core/tab-trigger-variants.ts`; migrate both components to consume.
- Drop no-op `linkRole = null` binding (`tab-nav.ts:375`).
- Verify spec covers ARIA tabs pattern; add Accessibility test group if missing.
**Risk.** Medium-high (touches keyboard nav and shared style infra simultaneously; high spec-coverage need).
**Effort.** ~6h.

### S13 — Paginator config-object refactor + raw-palette removal + FocusKeyManager
**Scope.**
- Refactor secondary axes (`labels`, `linkFactory`, `customAriaLabel`, `hideOnEmpty`, `hideOnSinglePage`, `responsive`) into a single `config` object input to drop under the 5–6 input cap (`paginator.ts:424-483`).
- Replace `bg-primary-600 text-white border-primary-600` active-page styling with `text-{color}-fg`/`text-on-{color}` tokens (`paginator.ts:155-171`).
- Replace manual roving focus with `FocusKeyManager`.
- Add `size-3.5` justification comment (already done in S02; verify).
- Rework demo Sizes-section labels to use the canonical demo-surface pattern.
**Risk.** High (config-object refactor breaks every existing `[labels]`/`[linkFactory]`/`[customAriaLabel]`/etc. binding). Public-API breaking change — needs migration changeset.
**Effort.** ~5h.

### S14 — Breadcrumbs + menu + command-palette fixes
**Scope.**
- **breadcrumbs** — add Playground section (covered in S05; verify); rework custom-separator HTML demo to go through `*twBreadcrumbsSeparator` (`breadcrumbs-examples.component.ts:76`); resolve `size-9` at lg=xl (`breadcrumbs.ts:127, 135`) — either codify lg=xl in CLAUDE.md or bump xl to `size-10`; drop redundant `all.length > 2` check (`:432`).
- **menu** — verify FocusKeyManager skips disabled items; either default `color` to a value or document the `TwColor | undefined` widening (`menu.ts:207`); parametrise submenu indicator off `MenuComponent.size()` (`menu.ts:399`).
- **command-palette** — fix `activeIndex` `linkedSignal` to key off stable `id` set so unchanged-id but new-array-ref upstream emissions don't reset to 0 (`command-palette.ts:516-519`); fix close-timer leak — early-return in `setTimeout` callback when `!isAttached()` (`:656-672`); differentiate active vs hover background (`:119, 125`) so the activedescendant carve-out is unambiguous; drop the Tab handler that forcibly closes the palette (`:756-758`) — FocusTrap already cycles; consider adding typeahead.
**Risk.** Medium (command-palette behavioral fixes — high spec value).
**Effort.** ~5h.

### S15 — Accordion + collapsible consolidation + table polish
**Scope.**
- **accordion** — emit explicit `aria-multiselectable="false"` in `'single'` mode (`accordion.ts:65`); drop wrapper `role="group"` (`:63`); fix `value = model<…>('')` default to `null` or `[]` (`:88`).
- **collapsible** — justify `ViewEncapsulation.None` on `CollapsibleTriggerDirective` (`collapsible.ts:162`) with a one-line comment, OR refactor to `Directive` (likely the right move).
- **Consolidation.** Merge `AccordionComponent.toggleItem`/`syncChildrenFromValue`/FocusKeyManager wiring with `CollapsibleGroupComponent` equivalents (~95% duplication, `accordion.ts:168-212` vs `collapsible.ts:454-503`). Either:
  - (a) make `AccordionComponent` extend `CollapsibleGroupComponent` with `accordion = true`; or
  - (b) deprecate the standalone `AccordionComponent` in favor of `<tw-collapsible-group accordion>`.
  Decision needed from prompt-architect.
- **table** — replace `backdrop-blur-[1px]` (`table.ts:353`) with `backdrop-blur-sm`; replace `[&>thead>tr>th]:shadow-[0_1px_0_0_var(--color-border)]` (`:445`) with a tokenised `shadow-sm` or define a `--shadow-table-sticky` token; address `data-label` stack-mode double-read (`:493-497`) by adding `aria-hidden` on the retained `<th>` or restructuring; add `'OPTION'` to `INTERACTIVE_TAGS` (`:516`).
**Risk.** High (accordion/collapsible-group merge is a structural change).
**Effort.** ~6h.

### S16 — Sort + segmented-control + code-block + carousel + flip-card
**Scope.**
- **sort** — verify size-3.5 comment from S02; either drop signal aliasing (`sort.ts:83`) or document why; convert constructor `effect` calling `ariaDescriber.describe` to `afterNextRender` (`sort-header.ts:178-187`); evaluate moving lifecycle hooks to `afterNextRender` + DestroyRef (`:136`).
- **segmented-control** — move `ACTIVE_CLASSES`/`INACTIVE_CLASSES` (`segmented-control.ts:63-102`) into the `tv()` config as `compoundVariants`; add a dev-mode guard for missing parent injection (`forwardRef(() => SegmentedControlComponent)` at `:130`); evaluate dropping `rootClass`/`optionClass` inputs (`:213, 216`).
- **code-block** — add `role="region"` to outer host or document why inner `<pre>` owns it (`code-block.ts:80, 107`); change `isCopied` from private signal to `model()` (`:141`); surface clipboard failure (output or dev-mode log, `:182-194`); remove duplicated host class on `CodeBlockHeaderDirective` (`:41`).
- **carousel** — define `--color-overlay-control` semantic token, replace `bg-black/40` and `hover:bg-black/60` (`carousel.ts:206-208, 259`); verify all 24 `*-solid`/`*-solid-fg` token names exist in `theme/_semantic.css` (`:122-153`); document closure-capture pattern in `_onPointerUp` (`:1286-1294`); drop `_effectiveSlidesToScrollView()` if redundant (`:568`).
- **flip-card** — announce content via `LiveAnnouncer` in interactive modes too (`flip-card.ts:186, 252-264`); replace `MutationObserver` with `contentChild()` + `read: ElementRef` (`:242-250`); document hard dependency on `theme/_base.css` keyframe classes (`tw-flip-perspective`, etc.).
**Risk.** Medium.
**Effort.** ~6h.

### S17 — Indicators + overlays + feedback (progress-bar, stat, timeline, popover, toast, tooltip)
**Scope.**
- **progress-bar** — refactor `effect()` mutating closure-scoped `warned` to `untracked` one-time check (`progress-bar.ts:307-319`); verify API description mirror from S04.
- **stat** — verify `text-base` decision from S02; verify API description mirror from S04.
- **timeline** — mirror `scrollControls` exception in the API page (cross-cutting from S04; verify); migrate `ngDevMode` global to `isDevMode()` for consistency with progress-bar (`timeline.ts:1172`).
- **popover** — verify boolean codification from S03.
- **toast** — bump dismiss container from `size-5` to `size-6` (keep inner SVG `size-4`) (`toast-component.ts:26`); add a Tokens subsection to `toast-api.component.ts` documenting `TW_TOAST_DATA`/`TW_TOAST_REF`; add comment near `bg-${severity}-soft` compound-variant map noting the `@source inline()` safelist dependency in `theme/index.css:37-41`.
- **tooltip** — migrate from raw `setAttribute('aria-describedby')` to CDK `AriaDescriber.describe`/`removeDescription` (`tooltip.ts:449-452`); document asymmetric `hideDelay = 0` vs `showDelay = 200` (`:328`).
**Risk.** Medium (tooltip refactor touches a core a11y contract — spec coverage on multi-tooltip dedup is critical).
**Effort.** ~5h.

---

## Phase 3 — Heavy refactors (substantial design work)

These need a design call before implementation. Prompt-architect should produce design notes for each.

### S18 — Picker overlay base extraction (date-picker / date-range-picker)
**Scope.** Extract shared overlay infrastructure from `date-picker.ts` and `date-range-picker.ts` into a `PickerOverlayHost` base / mixin / shared service. Targets: overlay position list, scroll-strategy resolver, focus-trap lifecycle, `ANIMATION_DURATION` constant (align to `duration-150`/`duration-200`), ID generator (use CDK `_IdGenerator`), panel-class resolution, aria-label fallback, `opened` emission timing (fix the synchronous emit at `date-picker.ts:1199`). Migrate both to consume. Bump `date-range-picker.ts:181-184` `clearButton` from `size-5` to `size-6`.
**Risk.** High (touches overlay open/close timing on both pickers).
**Effort.** ~8h.
**Pre-flight.** Decide between base-class inheritance vs composition (preferred per CLAUDE.md "compose over inherit").

### S19 — Calendar / date-picker pre-1.0 deprecated surface removal + range-behavior refactor
**Scope.**
- **calendar** — drop the three never-firing public outputs (`opened`, `closed`, `renderedMonthsCount` at `calendar.ts:535-542, 553-558`); remove the no-op `blockInvalidRangeCommit` input (`:398`); collapse the four range-behavior booleans (`allowSingleDayRange`, `persistPartialRange`, `allowBackwardRange`, `disableRangesCrossingDisabledDates` at `:418-436`) into a single `rangeBehavior` config object.
- **date-picker** — drop the nine `@deprecated v2` standalone time inputs (`date-picker.ts:491-529`) — `timeConfig` is the canonical input.
**Risk.** High — public-API breaking. Library is pre-1.0, so this is the right moment but needs a changeset and migration guide entry.
**Effort.** ~5h.
**Pre-flight.** Confirm with prompt-architect whether `rangeBehavior` config-object shape is preferred over keeping four flat inputs.

### S20 — Dialog/sheet overlay-container-base extraction + tooltip-aware a11y baseline
**Scope.** Extract the ~80% duplicated overlay-container plumbing into `projects/ngx-tw/core/overlay-container-base.ts`. Targets: animation lifecycle (`animate.enter`/`animate.leave` wiring), `aria-described-by` queue, `findEnclosing…` DOM walk → ancestor DI injection, `panelClass` merge. Migrate both `DialogContainerComponent` and `SheetContainer*Component` to consume. Resolves the dialog `findEnclosingDialog` brittleness (`dialog-content.ts:213-225`).
**Risk.** High (touches every dialog/sheet open/close path).
**Effort.** ~7h.

---

## Phase 4 — Policy / CI lint

### (CI-lint task, no session number — bundled with Phase 1 PRs when convenient)
**Scope.** Add CI lint rules to prevent regression of the patterns Phase 1 swept up:
- `grep '<pre ' projects/demo/src/app/routes/**` must return zero (raw `<pre>` ban in demo pages).
- Every `size-3.5` in `projects/ngx-tw` must be preceded by a `//` comment line.
- Every `input(true)` in `projects/ngx-tw` must be preceded by a `//` rationale comment OR appear in CLAUDE.md codified list (latter not enforceable by lint — relies on review).
- `grep -r "^.*class\s\+Tw[A-Z]" projects/ngx-tw/{dialog,table}` must return zero.
**Implementation.** Add to `eslint.config.js` (custom rules) or as a `scripts/check-conventions.sh` invoked from `package.json` test script. Wire into `.github/workflows/*` if a CI workflow exists.

---

## Sequencing summary

```
Phase 1 (hygiene)             S01 → S02 → S03 → S04 → S05
Phase 2 (component cleanups)  S06 → S07 → S08 → S09 → S10 → S11 → S12 → S13 → S14 → S15 → S16 → S17
Phase 3 (heavy refactors)     S18 → S19 → S20
Phase 4 (lint)                bundled with relevant Phase 1 PRs
```

**Critical-path dependencies:**
- S01 (`Tw*` rename) **before** S15 (table polish) and S20 (dialog refactor — references renamed classes).
- S02 (token sweep) **before** any Phase 2 session that touches the affected components, otherwise we re-introduce violations.
- S03 (boolean defaults) **before** S17 (popover/spinner work).
- S04 (JSDoc mirror) **before** any Phase 2 session that touches demo API pages, otherwise we re-do the mirror.
- S05 (demo section canon) **before** S07/S08/S14/S17 (demo work consolidates here).
- S08 (CVA convergence) **before** S09 (select/combobox) and S10 (time-picker) so we don't migrate them twice.
- S09 (select/combobox shared overlay) **before** S18 (picker overlay extraction) — verify the patterns extracted match across both refactors.

**Parallelisation opportunities:**
- S11, S16, S17 can run independently of each other after S02/S04 land.
- S12, S13, S14 can run independently after S02/S03/S05 land.
- Phase 3 sessions are serial because they each touch heavy infrastructure that needs to stabilize before the next builds on it.

---

## Per-session output expectations

Each session, when executed, should produce:
1. The code changes (no scope creep beyond the session's stated bullets).
2. A changeset entry under `.changeset/` (if a public-API surface changed).
3. Spec coverage for any new/changed behavior (Vitest, per CLAUDE.md test conventions).
4. A short PR description quoting the relevant audit-report findings being closed.
5. For Phase 1 sessions: an updated `.claude/reports/library-audit-progress.md` ticking off closed findings (cumulative tracker, to be created in S01).

---

## What's NOT in this plan

Findings explicitly *not* sessioned because they're either already-verified-clean or out of scope:
- `item` component — verified clean (Batch 4).
- `card.compoundVariants` neutral-outlined branch — Low; skip unless visual regression observed.
- `separator` vertical-orientation projected-label drop — Low; documentation update only, bundle opportunistically.
- `split._ariaLabel` English hardcode — Low; i18n is a separate cross-cutting concern.
- `split._setNoSelect` body-class ref-count — Medium but low real-world risk (single-instance dragging is the norm).
- `flip-card` theme-CSS hard dependency — addressed by documentation in S16; no code change needed.
- "JSDoc compliance is uniformly excellent" findings — no action.

---

## Open questions for prompt-architect

1. **S15 accordion/collapsible-group merge:** prefer composition (`extend`) or deprecation (consolidate to `<tw-collapsible-group accordion>`)?
2. **S18 picker overlay extraction:** prefer base class, mixin, or shared service / token? (CLAUDE.md leans "compose, don't reinvent" — points at composition).
3. **S19 calendar `rangeBehavior` config:** ship as a single object input or accept that 4 flat booleans are clearer at the call site? (config object is more composable but flatter is more discoverable in IDE autocomplete).
4. **S13 paginator config refactor:** is the input-cap exception worth pursuing instead? Paginator has 9 logically independent axes; codifying a "navigation-primitive" exception (paginator + breadcrumbs) might be simpler than packing 6 into a config object.
5. **CVA registration target:** confirm `NG_VALUE_ACCESSOR` + `forwardRef` is canonical (the simpler/more-Angular-native pattern) over Material's runtime `ngControl.valueAccessor = this`.
6. **`text-base` codification:** should stat lg/xl values get an explicit carve-out for the "KPI tile dominant number" role, or do we step them down to `text-sm font-bold`?
