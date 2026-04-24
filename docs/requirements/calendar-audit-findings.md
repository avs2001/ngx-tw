# Calendar Spec v2.4 — Parallel Audit Findings (Merged)

Six independent agents audited disjoint slices of `calendar-component-requirements.md`:

- **A**: §§1–7 (Foundations, Timezone, Selection Modes, Forms, Value Contract)
- **B**: §§8–11 (State Model, Text Input, Constraints, Runtime Conflicts)
- **C**: §§12–14 (Display & Navigation, Overlay Lifecycle, Interaction Modes)
- **D**: §§15–20 (A11y, Keyboard, Focus, Mobile, I18n, Adapters)
- **E**: §§21–26 (Range Flow, View Switching, Multi-Month, Cell Customization, Presets, Cross-Field)
- **F**: §§27–43 (Security, Errors, Event Ordering, SSR, Perf, API, Theming, Testing, DX, Versioning, Docs, NFR, ACs, Out of Scope, Remaining Decisions)

Findings are deduped across reports and grouped by target section. Severity:
**P0** = ship-blocker (contradiction or undefined behavior in a normative flow).
**P1** = important (gap or ambiguity a consumer will hit in the first week).
**P2** = polish (editorial, cross-ref hygiene, additional clarity).

---

## A. Document-wide / conventions

1. **[P0] `[REQ] [SHOULD]` normative-weight clash** (A-A3, B-A1). The convention table does not reconcile the `[REQ]` track marker with the `[MUST]/[SHOULD]/[COULD]` rigor marker. Every `[REQ] [SHOULD]` row in the doc is ambiguous. **Fix:** clarify in §Document Conventions that track (`REQ`/`REC`/`OPT`) declares ship-intent and rigor (`MUST`/`SHOULD`/`COULD`) declares bindingness; `[REQ] [SHOULD]` = "scheduled for v1, non-blocking if we slip to v1.1". Add an explicit `[REQ] [MUST]` = "must ship v1" note.
2. **[P1] `v1.1` vs `v1.1+` inconsistency** (A-A2). The changelog uses both; §42/§43 pick different forms. **Fix:** adopt `post-v1` for "deferred indefinitely" and `v1.1` for "committed to v1.1".
3. **[P2] Shared types must use `Tw` prefix** (E-#48). CLAUDE.md requires `Tw` prefix on hand-authored shared types. `CalendarPreset<D>`, `DayCellContext<D,T>`, `BadgeConfig`, `PresetGroup`, `CalendarValueTransformer<M,D,TOut>` lack the prefix. **Fix:** per ngx-tw convention, these are per-component types exported from their own entry point, so the prefix does NOT apply — add a short note to §7.4 confirming this.

## B. §4 Timezone model

4. **[P1] SSR hydration mechanism unspecified** (A-G5, F-#58). §4.3 says "today" must be hydration-tolerant but never says how — re-evaluate in `afterNextRender`? Use `ngSkipHydration`? **Fix:** add §4.3.1: on hydration, re-evaluate `today()` in an `afterNextRender` hook and silently re-decorate the "today" cell without emitting any events.
5. **[P1] `TZ_OVERRIDE` on wall-clock adapters undefined** (A-G6). Floating adapters have no TZ; override is meaningless. **Fix:** state that `TZ_OVERRIDE` is honored only by TZ-aware adapters; floating adapters log a dev warning and ignore.
6. **[P2] DST `startOfDay` edge for zones where midnight skipped** (A-G7). **Fix:** one-line note that `startOfDay` may return 01:00 local on exotic zones and must not throw.

## C. §5 Selection modes

7. **[P0] `allowDeselect` default undocumented** (A-G1). Referenced but never defaulted or declared. **Fix:** declare `allowDeselect: boolean = false` in §5.1 and add to §33.1.
8. **[P0] `emit-limit-reached` emission contract undefined** (A-G2). §5.2 names the option but no event/payload. **Fix:** add `selectionLimitReached: { limit: number; attempted: D }` to §33.2; reference from §5.2 and §30.2.
9. **[P1] `replace-oldest` semantics under `sorted: true`** (A-G3). "Oldest" is ambiguous. **Fix:** define as "oldest by insertion order"; chronological sort is a post-mutation presentation concern.

## D. §6 Form integration

10. **[P0] Reset detection heuristic not uniform across all three form strategies** (A-C1). Template-driven `NgModel` does not surface the same pristine transitions as Reactive. **Fix:** in §6.5, enumerate detection per strategy: Reactive uses `AbstractControl.pristine`; NgModel uses `NgModel.control.pristine`; Signal Forms uses `FormValueControl.touched`/`dirty`.
11. **[P1] `FormValueControl<T>` shape when transformer is present** (A-A5). **Fix:** state `T = TOut` when `valueTransformer` is set, else `T = CalendarValue<M, D>`.
12. **[P1] `dirty` signal source for Signal Forms** (A-G10). **Fix:** add `dirty` to §6.3's optional signals list or cross-reference §6.4.

## E. §7 Value contract & type system

13. **[P0] `TOut` generic missing from component class** (A-G11, F-#12, F-#66). `CalendarValueTransformer<M,D,TOut>` references a `TOut` that the `CalendarComponent<M, D>` generic never declares. **Fix:** extend to `CalendarComponent<M, D, TOut = CalendarValue<M, D>>`; directives reparameterize to `Field<TOut>` when transformer is supplied.
14. **[P0] `timestampTransformer` range shape unstated** (A-G12). **Fix:** mirror `isoStringTransformer`'s range shape (`{ start: number | null; end: number | null }`).
15. **[P0] `serializeCalendarValue` output shape ambiguous for TZ-aware adapters** (A-G16). **Fix:** fix format to `YYYY-MM-DD` across adapters (strip time post-normalization).
16. **[P0] `externalValue` state after `fromForm` throw** (A-C3). **Fix:** on `fromForm` failure, set `externalValue` to the empty-state for mode; expose the raw `TOut` on a `lastInvalidFormValue` signal.
17. **[P1] Exported state types lack canonical declarations** (A-G13). `CalendarSelectionState | CalendarViewState | CalendarOverlayState` exported but not declared. **Fix:** add TypeScript literal declarations in §7.4.
18. **[P1] `CalendarValueTransformer` generics elided in §7.4 export list** (A-G14). **Fix:** show full `<M, D, TOut>` parameterization.
19. **[P1] `DateAdapter` forward-reference in §7.5** (A-G15). **Fix:** add "(see §20 for the full `DateAdapter` surface)".
20. **[P1] `disabledDates` type overlaps `dateFilter`** (A-C4). Narrow `disabledDates` to `D[]` only.
21. **[P1] `valueChange` payload shape with transformer** (A-C2). **Fix:** explicitly state: CVA `onChange` carries `TOut`; public `valueChange` output still emits `CalendarValue<M, D>` (unless consumers want the transformed form — pick one; recommendation: public output stays untransformed to preserve API stability).
22. **[P1] Range equality for `null` endpoints** (A-G8). **Fix:** define component-level structural equality for range; `writeValue(null)` in range mode normalizes to `{ start: null, end: null }`.

## F. §8 Internal state model

23. **[P0] Emit-path ordering in §8.4 contradicts §30.2** (A-C2, B-C1, F-#4, F-#5, F-#6). §8.4 prescribes `valueChange → selection-lifecycle → activeDateChange`; §30.2 canonical ordering is `activeDateChange → valueChange → selection-lifecycle`. **Fix:** rewrite §8.4 to match §30.2 and cross-link.
24. **[P0] `internalDraftValue` shape undeclared across modes** (B-G4, A-G4). **Fix:** declare `internalDraftValue: { start: D } | null`; always `null` outside range mode.
25. **[P0] `selectedPresetId` lifecycle vs reset behavior** (A-G9, A-G14, B-C4, F-#31). `'value-only'` reset clears `selectedPresetId`, but §8.3 says programmatic writes preserve it. Also, preset-id clearing during 3rd-click restart doesn't emit any event. **Fix:** (a) carve reset exception into §8.3; (b) emit `presetChange(null)` on every preset-id clear (mode change, clear(), value-only reset, 3rd-click restart).
26. **[P0] State machine missing rows** (B-G1, B-G2, B-G3, E-#11, E-#14, E-#15):
    - EMPTY + outside click / Escape
    - COMPLETE + outside click / Escape (no draft)
    - SELECTING + hover across disabled cell (with `disableRangesCrossingDisabledDates=true`)
    - SELECTING + click on same cell as draft.start (depends on `allowSingleDayRange`)
    - Click on any disabled cell (no-op)
    - Programmatic `writeValue` during SELECTING (discards draft, no selection-lifecycle events)
    - Escape key during SELECTING (abort draft, emit `selectionCleared` if draft existed)
    - `clear()` / `reset()` from any state
    **Fix:** expand §8.3 table.
27. **[P1] Simultaneous-trigger precedence** (B-A6). If `disabled=true` and `mode` change fire in the same microtask, the two rows emit different sequences. **Fix:** add to §8.4: "When multiple structural triggers fire within a microtask, process in order: `disabled` → `adapter` → `mode` → constraints → value writes".
28. **[P1] `stateId` cache invalidation on mode/constraint/adapter change** (B-G13). **Fix:** `mode` change invalidates cache; constraint tightening revalidates `internalDraftValue` and drops if invalid.
29. **[P1] Form reset and `stateId` cache** (B-G14). **Fix:** "Form reset clears cache entries for any coordinator bound to the reset control."
30. **[P2] `disabled=true` row self-inconsistency** (B-C5). "Prior state retained" vs "draft cleared if SELECTING". **Fix:** rephrase: "state → EMPTY if was SELECTING; otherwise unchanged. Emit `selectionCleared` only in that branch".

## G. §9 Text input

31. **[P0] Parse for `multiple` and `range` modes undefined** (B-G6). **Fix:** add §9.2.1: single = `adapter.parse`; multiple = comma-delimited parse (configurable separator); range with one input = `start – end` separator token.
32. **[P0] Two-input range commit semantics** (B-G7). **Fix:** "Range commits (`selectionComplete` + `valueChange`) when both inputs have valid parse and `end ≥ start`. Until then, draft only."
33. **[P1] Mask + paste + autofill + IME collision** (B-G8). **Fix:** mask is suspended between `compositionstart` and `compositionend`; parse fires only post-composition.
34. **[P1] `calendarParseError` external-value behavior** (B-G9). **Fix:** on parse error, `externalValue` becomes `null`; raw string is retained on the input's native value and in the error payload.
35. **[P1] `virtualKeyboard` belongs on directive, not component** (F-#77). **Fix:** move the input to the `CalendarInputDirective` section; keep the consumer-facing API surface on the directive.

## H. §10 Constraints & validation

36. **[P0] Missing error codes** (B-G10). `calendarSingleDayRangeNotAllowed` and `calendarRangeCrossesDisabledDate` are referenced behaviorally but not enumerated. **Fix:** either add both codes to §10.2 or state explicitly that these are interaction-only (click no-op) rejections that never reach validation.
37. **[P0] `calendarInvalidValue` payload shape missing** (B-G11). **Fix:** `{ expected: 'single' | 'multiple' | 'range'; actual: unknown; reason: 'shape' | 'transformer' }`.
38. **[P1] `nearest-edge` crossing `maxDate`** (B-G12). **Fix:** bullet — "nearest-edge applies the same disabled-cell block; if swap would put `end` on a disabled cell, no-op with invalid-flash".
39. **[P1] Validation timing vs microtask batching** (B-A2). **Fix:** "validation runs once per emitted `valueChange`, i.e. at end-of-microtask".

## I. §11 Runtime conflicts

40. **[P0] Programmatic `writeValue` during retained partial-range draft** (B-C3). **Fix:** add rule in §11.1: "Programmatic `writeValue` while a draft is retained behind a closed overlay discards the draft and fires `selectionCleared` on the next open or immediately, whichever comes first".
41. **[P0] `adapter` change mid-SELECTING behavior** (B-G4). **Fix:** §11.7 `[MUST]` — throw dev error; production behavior undefined. Consumers must destroy/recreate the component to change adapters.
42. **[P0] `mode` change event ordering when draft exists** (B-G5). **Fix:** clarify order: draft cleared first (fires `selectionCleared`), then `externalValue` coerced to empty shape, then `modeChange`/`valueChange`.
43. **[P1] Runtime `interaction` mode switch** (C-#20, C-#32). §14 silent; §11 silent. **Fix:** add §11.8 — "Switching `interaction` (inline ↔ overlay) at runtime is `[COULD]`: if supported, overlay destroyed/created; draft discarded; committed value preserved."

## J. §12 Display & navigation

44. **[P0] `navigationBoundaryLookahead` — three sources disagree** (C-#3, F-#3, F-#27). §13.3 hardcodes 24; §12.6 says configurable default 24; §43 decision #9 lists as open. **Fix:** close decision #9 (default 24); §13.3 references the input instead of hardcoding.
45. **[P1] `autoSkipEmptyPeriods` default — open decision vs listed default** (F-#3, C-#38). **Fix:** close decision #8 (default `false`); §33.1/§12.6 mark default explicitly.
46. **[P1] `autoSkipEmptyPeriods` event/SR behavior** (C-#10). **Fix:** document — emits `viewChange`; announces skipped periods to live region; respects `navigationBoundaryLookahead`; if no destination found within lookahead, button remains disabled.
47. **[P1] `navigationStep` + dead-end prevention combination** (C-#12). **Fix:** "dead-end checks the destination period only, not intermediate periods".
48. **[P1] Empty-state focusability vs focus trap** (C-#11). **Fix:** "when grid is fully disabled, the empty-state element becomes the initial focus target; §13.3 step 4 routes to it".

## K. §13 Overlay lifecycle

49. **[P0] Close sequence ordering: commit → `valueChange` → `closed` must precede focus return** (C-#1, F-#8, F-#50). **Fix:** rewrite §13.4 step order: commit → `valueChange` → `closed` → focus return → `onTouched`. Add invariant: `valueChange` (if any) precedes `closed`.
50. **[P0] Initial focus: trap activation order** (C-#4). **Fix:** activate focus trap before or immediately when focus transfers (swap §13.2 steps 5 and 7, or merge into single atomic step).
51. **[P0] §13.5 missing close-reason rows** (C-#8). **Fix:** add rows for:
    - Scroll dismissal (CDK Overlay `scrollStrategy: 'close'`)
    - Focus loss from overlay
    - Form reset while open
    - Adapter change at runtime
    - Constraint tightening mid-draft
    - Mobile back-button / hardware dismissal
    - Trigger unmount (align with §13.7 invariant 1 exception)
52. **[P1] §13.5 `disabled`-close `onTouched` exception** (C-#2). **Fix:** explicitly state `closed` always fires; `onTouched` fires only for user-initiated closes.
53. **[P1] Overlay phase transition predicates missing** (C-#6). **Fix:** add §13.1 transitions table (each edge + trigger + debounce).
54. **[P1] Trigger-unmount `closed` invariant** (C-#24). **Fix:** either add invariant exception or make `closed` fire synchronously on unmount.
55. **[P1] Initial-focus fallback when every date in lookahead is disabled** (C-#9). **Fix:** route to empty-state template (see K-48).
56. **[P1] `openOnFocus` re-entry guard** (C-#16). **Fix:** suppress `openOnFocus` for one focus tick after close (debounce).
57. **[P1] `appendTo` runtime change** (C-#17). **Fix:** runtime change closes overlay first, then re-attaches on next open.
58. **[P1] `dirty` across overlay re-opens / inline / reset** (C-#13). **Fix:** extend §13.6 bullet to cover inline (first `valueChange` from user action), reset (clears `dirty` per §6.5), and multi-open (persists across overlay re-opens within same component instance).

## L. §14 Interaction modes

59. **[P0] `mobileMode: 'auto'` details absent from §14.3** (C-#18, F-#16). **Fix:** inline-summary in §14.3 (input name, enum values `'auto' | 'overlay' | 'inline' | 'bottom-sheet' | 'fullscreen'`, default `'auto'`). Promote §18.5 from `[SHOULD]` to `[MUST]`.
60. **[P0] Inline mode `overlayState` value undefined** (C-#14). **Fix:** state `overlayState === null` in inline mode; §13.6 focus-loss / `onTouched` rules still apply (driven by component blur).
61. **[P1] `openOnFocus` / `closeOnSelect` per-mode** (C-#15, C-#21). **Fix:** `closeOnSelect: boolean = true` (single mode default), `false` (multiple and range defaults). Runtime `openOnFocus: boolean = false`.
62. **[P1] `bottom-sheet` behavior** (C-#34). **Fix:** document gesture model (swipe-down to dismiss), positioning (pinned to bottom of viewport), safe-area handling.

## M. §15 Accessibility

63. **[P0] §15.3 missing ARIA** (D-#9, D-#10, D-#11, D-#12, D-#13). **Fix:** require — `aria-label` on prev/next buttons (sourced from CalendarIntl); `aria-current="date"` on today's cell; roving-tabindex pattern explicitly declared (forbid `aria-activedescendant`); `aria-rowcount`/`aria-colcount` on grid; `aria-describedby` pointer on dialog for keyboard help.
64. **[P0] Range endpoints need `aria-selected`** (D-#7). **Fix:** set `aria-selected="true"` on range start/end; accessible name carries "range start"/"range end".
65. **[P1] Live-region politeness + debounce** (D-#14). **Fix:** commit announcements = `role="status"` (polite); hover/drag range-length = `polite` with 150ms debounce; arrow key-by-key navigation does NOT announce (only view changes do).
66. **[P1] §15.6 canonical cell-name template via CalendarIntl** (D-#16). **Fix:** add template: `{date long} · {selectionRole} · {stateFlags}`; CalendarIntl provides the template.
67. **[P1] §15.8 pass criteria undefined** (D-#17). **Fix:** "critical" = any blocker preventing task completion; test on latest AT versions at each release.
68. **[P2] Add WCAG 2.2 SC 2.4.11 (Focus Not Obscured) and 2.5.7 (Dragging Movements)** (D-#76). **Fix:** add rows to §15.2.

## N. §16 Keyboard interaction

69. **[P0] Month view missing keys** (D-#19). **Fix:** add Home (Jan), End (Dec), PageUp/PageDown (prev/next year), Shift+PageUp/Down (prev/next decade), Space (select if `rangeGranularity='month'`), Escape, Tab.
70. **[P0] Year view missing keys** (D-#20). **Fix:** add Home (first year of decade), End (last), PageUp/PageDown (prev/next decade), Shift+PageUp/Down (prev/next century), Space, Escape, Tab.
71. **[P1] Ctrl+Home jump-to-today** (D-#21). **Fix:** add to §16.1–16.3 — Ctrl+Home focuses today (if within constraints).
72. **[P1] RTL arrow-key logical mapping cross-ref from §16** (D-#6). **Fix:** add an RTL note to §16.1 pointing to §19.3.

## O. §17 Focus management

73. **[P0] §17.1 triggers vs §17.2 rows mismatch** (D-#2). **Fix:** add rows for "prev/next navigation (month view)" and "prev/next navigation (year view)"; reconcile "drill" into drill-up vs drill-down.
74. **[P0] Mode change vs writeValue cascade** (D-#3). **Fix:** mode-change focus reset takes precedence over the cascaded writeValue trigger; suppress the cascade.
75. **[P0] §17.2 pane shift vs §17.4** (D-#4). **Fix:** §17.2 handles programmatic/click pane shift; §17.4 handles arrow-driven pane shift.
76. **[P1] Disabled cells and roving focus** (D-#5). **Fix:** disabled cells CAN receive roving focus (tabindex="0" when active), but Enter/Space is a no-op.
77. **[P1] writeValue during SELECTING / invalid-date / null / opening/closing** (D-#25). **Fix:** writeValue during SELECTING discards draft (cross-ref §21); writeValue to disabled date moves focus to nearest enabled date per §17.2; writeValue(null) focuses first enabled cell of current view; writeValue during `opening`/`closing` transition is queued and applied after phase completes.
78. **[P1] Day → year view focus mapping** (D-#8). **Fix:** focus the year containing the previously focused day; when drilling back, restore previously focused month first, then day. Remove asymmetry with month → year.
79. **[P2] Search direction / infinite loop guard on "all months disabled"** (D-#24). **Fix:** cap search at `navigationBoundaryLookahead`; if exhausted, focus remains in place and empty-state template takes over.

## P. §18 Mobile & touch

80. **[P1] Swipe during range SELECTING** (D-#28). **Fix:** swipe changes pane; draft is preserved and continues to follow pointer across the new pane.
81. **[P1] Long-press behavior** (D-#29, D-#30). **Fix:** long-press is a no-op in v1 (reserved for future); long-press on disabled cell is also a no-op.
82. **[P1] `touch-action` value pinned** (D-#31). **Fix:** `touch-action: pan-y` on grid (allows vertical scroll of page; blocks horizontal to reserve swipe).
83. **[P1] Breakpoint unified between §18.3 and §18.5** (D-#32). **Fix:** cross-reference `< 600px` from both.
84. **[P1] Range first-tap on close** (D-#33). **Fix:** if user closes without second tap, first-tap is discarded (respects `persistPartialRange`); no event emitted.
85. **[P2] Auto-mode breakpoint measurement source** (D-#54). **Fix:** use CSS `matchMedia('(max-width: 600px)')`; on SSR, default to overlay mode (bottom-sheet is client-only decision made post-hydration).

## Q. §19 I18n & §20 Adapters

86. **[P0] First-day-of-week fallback** (D-#35). **Fix:** if `LOCALE_ID` is unresolvable, default to Monday; log dev warning.
87. **[P0] `CalendarIntl` missing fields** (D-#37). **Fix:** add — weekday names, month names (overrides), "today" button label, "today's date" announcement, clear button label, clear confirmation, "no date selected", parse-error messages, keyboard-help text, cell-name template, range "X days selected" plural templates, "Selecting X, now select end" in-progress template.
88. **[P0] `CalendarIntl` plural/gender rule declaration** (D-#38). **Fix:** explicitly mark which templates use ICU `plural` (range length, multi-select count, N items selected).
89. **[P0] `DateAdapter` missing methods for TZ-aware claim** (D-#39, D-#73). **Fix:** add `getTimezone(): string | null`, `withTimezone(date: D, tz: string): D`, `isDST(date: D): boolean`, `resolveAmbiguous(date: D, prefer: 'earlier' | 'later'): D`. Alternatively, drop the TZ-aware claim for Luxon in v1.
90. **[P0] `parse` invalid-state return type** (D-#40). **Fix:** standardize — all failures return `null`; `invalid()` creates an internal sentinel usable only by adapter consumers, not surfaced as the `parse` return.
91. **[P0] `startOfWeek` / `endOfWeek` missing** (D-#41). Required for Home/End in day view. **Fix:** add methods; respect `firstDayOfWeek` configuration.
92. **[P0] Month-number convention** (D-#56). JS `Date` is 0-based, Luxon is 1-based. **Fix:** pin adapter to 1-based months in `create(year, month, day)`; document.
93. **[P0] `getDayOfWeek` convention** (D-#57). **Fix:** 0 = Sunday through 6 = Saturday (ISO 8601 alternative; most JS developers expect Sunday=0).
94. **[P1] DateFormats completeness** (D-#43). **Fix:** add `decadeLabel` (e.g., "2020–2029"); add year-view month header a11y name.
95. **[P1] `NativeDateAdapter` DST fallback** (D-#45). **Fix:** state that skipped-hour dates fall to next valid hour; document behavior.
96. **[P2] `CalendarIntl` partial vs full replacement** (D-#55). **Fix:** merge override; consumers replace per-field, not the entire bag.
97. **[P2] Era handling hook** (D-#42). **Fix:** adapter version field in `DateAdapter` contract, so a future era-aware major release can branch.

## R. §21–26 Flows

98. **[P0] §21.1 state machine missing transitions** (E-#1, E-#11, E-#12, E-#13). **Fix:**
    - Split `clear/reset` and `3rd-click restart` into separate labeled arrows.
    - Add transitions for `clear()`, programmatic `writeValue`, Escape key (see F-26 for §8 alignment).
    - Add rows for endpoints-in-different-panes (multi-month commit).
99. **[P0] `rangePreview` driven by hover AND keyboard focus** (E-#5). **Fix:** explicit in §21.5.
100. **[P1] `selectionRestart` payload** (E-#4). **Fix:** `start` = newly-clicked date (the new draft start).
101. **[P1] `rangePreview` payload shape** (E-#34). **Fix:** `tentativeRange: { start: D; end: D }` (post-normalization for direction).
102. **[P1] §22.1 orthogonality claim** (E-#7). **Fix:** remove the parenthetical `rangeGranularity` exception from the orthogonality statement; move clarification to §22.4.
103. **[P1] `rangeGranularity` × view × state matrix** (E-#8). **Fix:** add the full matrix to §22.4/§22.5.
104. **[P1] `DayCellContext` missing range-preview boundary fields** (E-#18). **Fix:** add `isRangePreviewStart`, `isRangePreviewEnd`, `isRangePreviewBoundary` to the context type.
105. **[P1] Preset value type vs current `mode`** (E-#36). **Fix:** either type presets generically or explicitly mark presets as range-only in v1.
106. **[P1] Preset + subsequent manual click** (E-#24). **Fix:** any subsequent manual selection clears `selectedPresetId`.
107. **[P1] `independentMonthNavigation` default** (E-#28). **Fix:** default `false`.
108. **[P1] `navigationStep` semantics** (E-#26). **Fix:** explicit — `'single'` = 1-period shift for linked panes / advance focused pane by 1 for independent; `'page'` = shift by pane-count.
109. **[P1] Responsive pane breakpoint** (E-#27). **Fix:** container-query driven with `minPaneWidth: 280px`; hide panes smaller than threshold.
110. **[P2] Preset role** (E-#35). **Fix:** `role="listbox"` with single-select semantics.
111. **[P2] Custom preset no-constraint focus** (E-#19). **Fix:** focus `adapter.today()` if within constraints, else first enabled date.
112. **[P2] `BadgeConfig.color` constrained to semantic token role** (E-#21). **Fix:** `color: TwColor` (or the component-local equivalent).
113. **[P2] `dayDataFn` + `dayData` precedence** (E-#22). **Fix:** `dayData` map takes precedence; `dayDataFn` is the fallback for unmapped dates.
114. **[P2] §26.1 split controls bypass §21 state machine** (E-#23). **Fix:** add explanatory note.

## S. §27 Security / §28 Error display / §29 Safety nets

115. **[P1] Sample CSP policy** (F-#57). **Fix:** publish reference — `default-src 'self'; style-src 'self'; script-src 'self'`.
116. **[P2] Dev-warning logger injectable** (F-#63). **Fix:** `debug: boolean | (msg: DebugEvent) => void`.

## T. §30 Event ordering

117. **[P0] §30.2 missing sequences** (F-#84, F-#52). **Fix:** add sequences for — "disabled=true flip", "backward click with auto-swap", "writeValue from form during SELECTING".
118. **[P0] `onTouched` ordering** (F-#8, F-#50). **Fix:** for every sequence ending in `closed` due to user action, append `onTouched` after `closed`.
119. **[P1] `activeDateChange` conditional vs unconditional on first click** (F-#4). **Fix:** unconditional — `activeDateChange` fires whenever focus target updates, including when the target is the already-active date (the signal value may be structurally equal, but semantic event still fires).
120. **[P1] Signal Forms model update vs `valueChange`** (F-#7). **Fix:** Signal Forms `field.value()` updates after `valueChange` (parity with Reactive `valueChanges`).

## U. §31 SSR & Hydration

121. **[P0] Hydration mechanism for today-indicator** (F-#58). **Fix:** use `ngSkipHydration` on the today cell's state decoration OR re-render in `afterNextRender`. State one mechanism.
122. **[P1] Server overlay rendering** (F-#59). **Fix:** server MUST NOT render overlay DOM; `open` signal defaults to `false` on server regardless of binding.

## V. §32 Performance

123. **[P1] Measurement methodology** (F-#55, F-#56). **Fix:** Chrome DevTools 4× CPU throttle, Fast 3G network; bundle measurement via `@angular/build` stats-json; "gzipped" column is brotli-compressed alternative (state both).
124. **[P1] `autoSkipEmptyPeriods` predicate threshold** (F-#19). **Fix:** per-predicate 200µs at P95 on Moto G4; aggregate budget `navigationBoundaryLookahead × cell count × 200µs` must fit within 50ms first-render.
125. **[P1] `CDK virtual scroll` axis for year view** (F-#60). **Fix:** clarify — not virtualized; year view's 12-month grid is always fully rendered (small enough).

## W. §33 Component API contract

126. **[P0] Missing inputs from table** (F-#22): `timezone` (per-instance), `adapter` note (DI only, not an input), `dateFormats` precedence note (input overrides DI default).
127. **[P0] Status annotations** (F-#1, F-#2, F-#3). **Fix:**
    - `blockInvalidRangeCommit` annotated `[v1.1]` OR removed (decision #5).
    - `valueTransformer` annotated `[SHOULD]` (decision #7 resolved to v1).
    - `autoSkipEmptyPeriods` annotated `[REC]` (decision #8 resolved: `false`).
    - `navigationBoundaryLookahead` annotated with resolved default 24 (decision #9 resolved).
    - `mobileMode` promoted to `[REQ] [MUST]` aligning with §43 L2100.
128. **[P0] Missing outputs** (F-#30, F-#31, F-#32): `selectionLimitReached` payload (B-8 above); `touchedChange` output OR explicit note that `onTouched` is CVA callback only; `presetChange` output (for preset-id changes, per F-25).
129. **[P0] Duplicate state surface `overlayState` + `overlayStateChange`** (F-#18, F-#20). **Fix:** keep signal only; drop the output. Signals are the canonical Angular v21 pattern.
130. **[P0] `selectionCleared` payload** (F-#30). **Fix:** `{ reason: 'user' | 'programmatic' | 'mode-change' | 'reset' | 'disabled' }`.
131. **[P1] `valueChange` generic parameterization** (F-#12). **Fix:** `valueChange: OutputEmitterRef<CalendarValue<M, D>>` (the public output stays untransformed for API stability; transformer only intermediates to the form control via CVA).
132. **[P1] Missing methods** (F-#34, F-#35, F-#36). **Fix:** `revalidate(): void`; `focusDate(date: D, opts?: { navigate?: boolean }): void`; `clear()` documented as alias for `clearSelection()`.
133. **[P2] `overlayStateChange` phase emission behavior** (F-#20). Moot if dropped per 129; otherwise: emit on every phase transition.
134. **[P2] `events` input removed everywhere** (F-#25, E-#49). **Fix:** audit §11.5 and any remaining mentions; remove from v1.

## X. §34 Theming

135. **[P0] §34.1 rewrite around Tailwind v4** (F-#13). CSS custom property exposure contradicts CLAUDE.md's Tailwind-semantic-token / `@theme` pattern. **Fix:** rewrite §34.1 to describe the semantic-token model; drop the component stylesheet language.
136. **[P0] §34.6 drop framework-agnostic claim** (F-#14). **Fix:** state explicitly: Tailwind v4 is required; compatible with consumer `@theme` overrides.
137. **[P1] `data-state-*` attribute reference table** (F-#62, F-#53). **Fix:** add canonical table listing all `data-state-*` attributes and which elements carry them.

## Y. §35–37 Testing / Harness / DX

138. **[P1] Test coverage categories missing** (F-#38, F-#39, F-#40, F-#41, F-#42). **Fix:** add §27 security, §29 error handling, §28 error display a11y, §22 view switching focus landing, §7.6 valueTransformer test categories.
139. **[P1] `jitter injection` definition** (F-#43). **Fix:** "jitter = uniform random delay 0–16ms injected between user actions; seeded per test run for reproducibility".
140. **[P1] Harness API expansion** (F-#44, F-#45). **Fix:** require one method per §33.2 output + `hover(date)`, `getBadge(date)`, `getOverlayPhase()`, `clearSelection()`, `goToToday()`, `focusDate(date)`, `setDisabled(bool)`, `isInvalid()`, `getErrors()`.

## Z. §38–43 Versioning / Docs / NFR / AC / OOS / Open decisions

141. **[P0] Semver policy additions** (F-#46, F-#47, F-#48). **Fix:** changing `DateAdapter` signature = breaking; event payload field rename/remove = breaking (add optional field = minor); CSS token / semantic token rename = breaking.
142. **[P1] Deprecation runtime-warning policy** (F-#49). **Fix:** `@deprecated` emits console.warn once per session (dev mode only); grace-period minimum = 6 months regardless of major cadence.
143. **[P1] AC §41.10 add the `opened` + `activeDateChange` sequence** (F-#50). **Fix:** align with §30.2.
144. **[P1] `todayDateChange` observable event for hydration TZ shift** (F-#51). **Fix:** either add this output OR state explicitly that this is a silent re-decorate (no event).
145. **[P1] AC §41.2 explicit about no `selectionRestart` on auto-swap** (F-#52). **Fix:** add "`selectionRestart` does NOT fire in backward-click auto-swap path; `selectionComplete` fires with swapped payload".
146. **[P1] Close decisions 1 and 3 moved to resolved** (F-#83). **Fix:** decision #1 (masking default `false`) already resolved by §9.3; decision #3 (schematics v1.1) already implied by §37.1.
147. **[P2] License decision** (F-#64). **Fix:** confirm MIT; add LICENSE file commitment.

---

## Summary of change volume

- **P0 (ship-blocker):** 45 items
- **P1 (important):** 85 items
- **P2 (polish):** ~15 items

The spec bumps to **v2.5** on this revision. Body edits prioritize P0 items. P1 items are applied where the fix is a single-line clarification; larger P1s are listed in this file as a follow-up backlog.

## Agent sources

- Agent A (§§1–7): ~30 findings
- Agent B (§§8–11): ~35 findings
- Agent C (§§12–14): ~38 findings
- Agent D (§§15–20): ~76 findings
- Agent E (§§21–26): ~50 findings
- Agent F (§§27–43): ~84 findings

Raw reports are captured in the conversation transcript of the audit run.
