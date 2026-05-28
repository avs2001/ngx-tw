# Table — Production-Grade Review

**Entry point:** `ngx-tw/table`
**Files:** `projects/ngx-tw/table/`

## Snapshot
- Selectors: `tw-table` (element), `tw-column` (element), `[twCellDef]` / `[twHeaderCellDef]` / `[twFooterCellDef]` (structural directives), `ng-template[twNoDataRow]`, `ng-template[twRowExpansion]`
- Public classes/directives: `TableComponent<T>`, `ColumnComponent<T>`, `TwCellDefDirective<T>`, `TwHeaderCellDefDirective`, `TwFooterCellDefDirective<T>`, `TwNoDataRowDirective`, `TwRowExpansionDirective<T>`
- Inputs: 13 on `TableComponent` (`data`, `trackBy`, `loading`, `error`, `appearance`, `sticky`, `responsive`, `selection`, `multiTemplateRows`, `labels`, `ariaLabel`, `ariaLabelledby`, `expandedRows` model, `selected` model) + 6 on `ColumnComponent` (`name`, `display`, `hidden`, `priority`, `headerLabel`, `stackLabel`) + 1 on `TwRowExpansionDirective` (`predicate`)
- Outputs: 3 (`rowClicked`, `selectionChange`, `expansionChange`)
- Slots: 6 named (`[slot='caption']`, `[slot='toolbar']`, `[slot='empty']`, `[slot='loading']`, `[slot='error']`, `[slot='footer']`, `[slot='pagination']`) + default for `<tw-column>` metadata
- CVA: no
- `tv()` config: yes, 17 slots, 8 variant axes (`variant`, `density`, `size`, `layout`, `stickyHeader`, `stickyFooter`, `loading`); `defaultVariants` present; `compoundVariants` cover bordered+compact, stickyHeader+striped
- A11y CDK utilities used: `LiveAnnouncer` (politely announces loading + rowsUpdated counts); CDK Table primitives (`CdkTableModule`)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `data` | `TwTableDataSourceInput<T>` | `[]` | yes | Plain array, Observable, or `DataSource<T>` |
| `trackBy` | `TrackByFunction<T> \| undefined` | `undefined` | yes | Forwarded to `CdkTable.trackBy` |
| `loading` | `boolean` | `false` | yes | Renders loading overlay |
| `error` | `unknown \| null` | `null` | yes | Renders error overlay |
| `appearance` | `TwTableAppearance` | `{}` | yes | Config object — variant/density/size/layout/rowAnimations |
| `sticky` | `TwTableSticky` | `{}` | yes | Config object — header/footer/scrollHeight |
| `responsive` | `TwTableResponsive` | `{}` | yes | Config object — mode/stackBelow |
| `selection` | `TwTableSelection` | `{}` | yes | Config object — enabled |
| `multiTemplateRows` | `boolean` | `false` | yes | Forwarded to `CdkTable.multiTemplateDataRows` |
| `labels` | `Partial<TwTableLabels>` | `{}` | yes | i18n strings |
| `ariaLabel` | `string \| undefined` | `undefined` | yes | Aliased to `aria-label` |
| `ariaLabelledby` | `string \| undefined` | `undefined` | yes | Aliased to `aria-labelledby` |
| `expandedRows` (model) | `ReadonlySet<T>` | `new Set<T>()` | yes | Two-way bound expanded set |
| `selected` (model) | `readonly T[]` | `[]` | yes | Two-way bound selection |

### Findings
- 13 inputs + 2 models on `TableComponent`. Codified data-primitive exception applies (per the prompt and MEMORY entry `feedback_input_count_data.md`), pending the PR8 reshape. The component has already done substantial PR8-style reshape work: `appearance`/`sticky`/`responsive`/`selection` are config objects with documented defaults. What remains flat is the data-flow surface (`data`, `trackBy`, `loading`, `error`, `multiTemplateRows`, models, ARIA) — appropriate to remain flat.
- The header comment block (lines 1–26) clearly documents the v2 reshape: `appearance`, `sticky`, `responsive`, `selection`, plus per-column `display`. This is the canonical example PR8 should pattern after.
- All JSDoc is present and uses the codified one-line + default form. Compliant.
- Defaults: all booleans default to `false`. Compliant.
- `expandedRows` model is `ReadonlySet<T>` — good immutability hint; documented "set a new Set, do not mutate".
- Two redundant exports in `index.ts`: `TwHeaderCellDefDirective` is exported but `TwHeaderCellContext` import in core code never appears — fine. `DataSource` is re-exported from CDK (line 36) — convenient.
- The `appearance.rowAnimations: false` default is documented inline ("Off by default to avoid flicker on frequent data updates") — good rationale capture; matches the codified boolean-default rule.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `rowClicked` | `TwRowClickEvent<T>` (`{ row, index, event }`) | past-tense action | Suppressed when click originates inside an interactive descendant |
| `selectionChange` | `TwSelectionChangeEvent<T>` (`{ selected, added, removed, previous }`) | `propertyChange` | Rich payload — good for diff consumers |
| `expansionChange` | `TwRowExpansionChangeEvent<T>` (`{ row, expanded, expandedRows }`) | `propertyChange` | Rich payload |

### Findings
- Output naming follows the codified dual pattern: past-tense for action (`rowClicked`), `propertyChange` for selection/expansion. Compliant.
- The interactive-descendant suppression list at line 491–499 (`BUTTON`, `A`, `INPUT`, `SELECT`, `TEXTAREA`, `LABEL`, `SUMMARY`) is comprehensive; click event path is read via `composedPath()`, shadow-DOM safe. Good.
- Missing: no `sortChange` output. Sorting integrates with the external `[twSort]` directive (mentioned in JSDoc line 768), so this is correct delegation — but the table provides no `aria-sort` plumbing on columns. See Accessibility section.

## Customization surface
- ng-content slots: 6 named slots covering chrome (caption/toolbar/empty/loading/error/footer/pagination)
- Structural directives: `*twCellDef`, `*twHeaderCellDef`, `*twFooterCellDef`, `*twNoDataRow`, `*twRowExpansion` — typed via `ngTemplateContextGuard` static methods for fully-typed `let-row` bindings
- Fallback content: empty/loading/error overlays expose `<ng-content select="[slot='X']">…fallback…</ng-content>` (lines 132–151, 156–175, 179–217). When the consumer projects content, theirs replaces the fallback. When not, the built-in SVG icon + label renders. Correct use of native v18+ fallback.
- Class merging: `twMerge: true` on `tv()` (line 447)
- Findings:
  - Slot strategy is exemplary — every chrome region has a fallback and a slot, and the no-data path takes precedence over the empty-overlay fallback when `*twNoDataRow` is projected (line 919).
  - Typed template contexts (`TwCellContext<T>` etc.) are the right shape for a data primitive — every template gets `$implicit`/`row`/`column`/`index`/`first`/`last`/`even`/`odd`/`count`. Good.
  - `expansionId(row, index)` (line 868) exposes a stable DOM id consumers can wire `aria-controls` against. Good — but no example in JSDoc shows this; a Compodoc note would help.
  - The toolbar / footer / pagination slot classes use `empty:hidden` (lines 327, 351, 352) so the slot collapses to zero height when nothing is projected — clean.
  - `<tw-column>` uses `display: none` on its host (line 629) so the metadata element is harmless inside the table; the actual `<th>`/`<td>` renderers are emitted by the parent template via `@for (col of visibleColumns)`.

## CSS / Styling
- tailwind-variants: yes; 17 slots, 7 variant axes, 2 compound variants. Largest `tv()` config in the library.
- twMerge: yes (line 447)
- Semantic tokens vs raw palette: every colour reference is semantic. `surface-muted` / `surface-sunken` / `surface-raised` / `surface` for backgrounds (lines 336, 343–352, 369). `fg` / `fg-muted` / `fg-subtle` / `error-*` for text (lines 336–349). `border` / `border-strong` for structural lines (lines 336, 351–352, 367). Compliant.
- Surface/fg/border tokens usage: every neutral surface uses surface tokens. `bg-surface-raised` for sticky cells (lines 407, 414) — appropriate because sticky cells need an opaque backdrop. Compliant.
- Radius compliance: `rounded-lg` on `bordered` variant (line 367), `rounded-lg` on stack-mode card wrappers (lines 473–476). Compliant.
- Spacing/gap compliance: density scale `px-{3,4} py-{1.5,3}` (lines 377–384) — `px-4 py-3` (comfortable) and `px-3 py-1.5` (compact). `px-3 py-1.5` matches the codified `sm` inline row. `gap-3` toolbar (line 327). Compliant.
- Typography compliance: header cells `font-semibold text-fg tracking-tight` (line 336) — uses the documented title styling. Sizes use `text-xs` (xs), `text-sm` (sm/md), `text-base` (lg/xl) — matches the trigger scale. Compliant.
- Focus rings compliance: the table itself does not own focus rings; row clicks are handled at the `<tr>` level, but rows are not focusable. Cell-level focus belongs to projected interactive descendants which carry their own rings. Compliant.
- Dark mode handling: relies on semantic surface tokens (`surface-raised`, `surface-muted`, `surface-sunken`) which adapt — no explicit `dark:` overrides needed at the table level. Compliant.
- Transitions: `[&>tbody>tr]:transition-colors [&>tbody>tr]:duration-200 [&>tbody>tr]:motion-reduce:transition-none` (line 336). Compliant.
- Shadows: `stickyHeader+striped` compound applies `shadow-[0_1px_0_0_var(--color-border)]` (line 433) — an arbitrary shadow value. This is the documented carve-out (CLAUDE.md "1px hairline below sticky header") but it uses a raw CSS shadow string instead of a Tailwind utility. Acceptable for a single decorative hairline; flag if a `shadow-hairline` utility is later added to the theme.
- Icon sub-scale: `size-10` empty / error icons (lines 342, 349) — compliant glyph sub-scale top end. `size-5` loading spinner (line 189) — compliant.
- Animations: `animate.enter="fade-in"` / `animate.leave="fade-out"` on loading overlay (line 184–185) — uses theme keyframes. Compliant.
- Findings:
  - Heavy use of arbitrary-descendant selectors (`[&>thead>tr>th]:bg-surface-muted` etc.) is necessary because CDK owns the `<thead>` / `<tbody>` elements (documented in the inline comment at lines 317–321 + lines 320–334). This trades JIT scanning effort for direct cell styling. Tailwind v4's JIT does scan these strings — every variant is statically written out. Compliant.
  - `border-separate border-spacing-0` (line 336) is mandatory for `position: sticky` to work on `<th>`/`<td>` — documented well in the inline comment.
  - Stack-mode utilities (lines 473–485) repeat the `:before:content-[attr(data-label)]` pattern per breakpoint because Tailwind v4 needs literal class strings. Tedious but correct. Each row variant is fully written out.

## Accessibility
- ARIA roles/attributes: native `<table>` element provides `role="table"` etc. implicitly. Header cells get `scope="col"` (line 38 in template). `<table>` gets `aria-label` / `aria-labelledby` from inputs. Loading overlay uses `role="status" aria-live="polite"`. Error overlay uses `role="alert"`. No `role="presentation"` overrides. Compliant.
- Keyboard support: native table — no arrow-key grid pattern. JSDoc lines 22–24 list APG grid navigation as out-of-scope for v1. Consumers can implement their own. Acceptable.
- CDK a11y utilities: `LiveAnnouncer` used for `labels.loading` and `labels.rowsUpdatedAnnouncement` (lines 1149–1165). Both use `'polite'` politeness. Compliant.
- Labels/descriptions wiring: `ariaLabel` / `ariaLabelledby` flat inputs forwarded to `<table>`. Dev-mode warning when neither nor a `<caption>` is present (lines 1137–1146). Excellent.
- AXE risks: none flagged from the static class scan. Two completeness gaps:
  - **No `aria-sort` plumbing.** The integration JSDoc (line 768) mentions `[twSort]` + `[tw-sort-header]`; if sorting is wired, the column header `<th>` should expose `aria-sort="ascending|descending|none"`. The current template's `<th cdk-header-cell scope="col">` has no `aria-sort` binding. The sort directive likely lives in `ngx-tw/sort` — out of this review's scope, but the table is the natural place to wire it.
  - **No `aria-rowcount` / `aria-rowindex` for virtualised tables.** Out of scope for v1 per the header comment; flag for v2.
  - **No `aria-selected` on row elements when `selection.enabled`.** The current `selected` model is opaque to the row; the `<tr>` does not carry `aria-selected`. When the selection feature is rendered (currently the column slot is declared but checkbox rendering ships later — see header comment line 24), row-level `aria-selected` must follow.
- Findings:
  - The dev-mode accessible-name warning (line 1142) is the right ergonomic — caught by consumers immediately.
  - The composed-path interactive-descendant detection (lines 1170–1182) is the right way to suppress row-click on child controls.
  - `<caption>` is projected via `<ng-content select="[slot='caption']">` (line 16 of the template) — natively a `<caption>` is the first child of `<table>`. The `[slot='caption']` attribute is required; consumers must mark their `<caption>` with `slot="caption"`. Document this clearly in JSDoc.

## Tests
- Spec file: yes (`table.spec.ts`, 447 lines)
- Coverage breakdown:
  - rendering: basic table mounts, row/header count, projected `*twCellDef`, static `headerLabel`, `tabular-nums` decoration on numeric column, `data-column` attribute
  - empty/loading/error overlays
  - `*twNoDataRow` precedence over empty overlay
  - row expansion: expansion row rendering + `expansionChange` event
  - footer-cell context (rows snapshot)
  - async data source (BehaviorSubject)
  - row click suppression via interactive descendant
  - aria-label propagation, LiveAnnouncer mock
  - selection API round-trip (`setSelected`/`isSelected`)
- Vitest issues: uses `whenStable()` repeatedly + `detectChanges()` after — correct rhythm for CDK Table reconciliation. No `fakeAsync`/`tick`. Compliant.
- Findings:
  - Missing: nothing tests `appearance.variant`/`density`/`size`/`layout` actually applies the expected class slots (only `striped` is referenced by `TwTableVariant` type; the test imports it but doesn't iterate the matrix).
  - Missing: `responsive.mode='hide'` + `hideBelow` is not tested (HIDE_BELOW_UTILITIES wiring).
  - Missing: `responsive.mode='stack'` is not tested (STACK_TABLE_UTILITIES wiring + `data-label` consumption).
  - Missing: `sticky.scrollHeight` style binding is not tested (max-height application).
  - Missing: duplicate-column-name dev-mode guard (line 1111–1123) is not tested. A simple `expect(() => …).toThrow('duplicate column name')` would close it.
  - Missing: dev-mode `*twRowExpansion` requires `multiTemplateRows` guard (line 1126–1134).
  - Missing: dev-mode accessible-name warning (line 1140) — straightforward `vi.spyOn(console, 'warn')` test.
  - Missing: sticky-header/footer wiring — `[&>thead]:sticky` class application on `stickyHeader: true`.

## Gaps & lacks
1. **No `aria-sort` plumbing on column headers** — needed for the `[twSort]` integration to be a11y-complete.
2. **No row-level `aria-selected`** when `selection.enabled` becomes a rendered feature (currently slot is declared, rendering is deferred per the header comment).
3. **No `aria-rowcount` / `aria-rowindex`** for virtualised tables — out of scope for v1 but flag for v2.
4. **Selection checkbox rendering is deferred** — slot `_selection` is reserved but the actual `<input type="checkbox">` is not emitted; consumers can't yet check or uncheck rows from the UI.
5. **No grid-pattern keyboard navigation** — out of scope for v1.
6. **No CDK virtual scroll integration** — out of scope for v1.
7. **No column resize / drag reorder** — out of scope for v1.
8. **No inline cell editing** — out of scope for v1.
9. **No filter UI primitives** — out of scope for v1.
10. **Sticky-edge shadows missing** — sticky cells currently get `z-[5]` + `bg-surface-raised` but no shadow indicating they overlap scrolled rows. Easy polish.
11. **Tests miss** appearance/responsive/sticky class-application matrices and the three dev-mode guards.

## Concrete recommendations (deep-dive prompt body)

### Goal
Close out the remaining v1 a11y gaps (aria-sort plumbing, row aria-selected, selection rendering), add sticky-edge polish, and fill spec coverage for appearance/responsive/sticky matrices and dev-mode guards. PR8 reshape is already complete in this component — do NOT touch the existing config-object inputs.

### Tasks
1. **Wire `aria-sort` on column headers driven by `<tw-column>`** — closes the largest a11y gap.
   - File(s): `projects/ngx-tw/table/table.ts:632-758` (`ColumnComponent`), `projects/ngx-tw/table/table.html:32-48` (header cell)
   - Why: the table currently has no path from sort state to the `<th>` `aria-sort` attribute. WAI-ARIA APG "Sortable Table" pattern requires `aria-sort` on the active column header.
   - Change: add an optional `sortState = input<'ascending' | 'descending' | 'none' | null>(null)` on `<tw-column>` so consumers using `[twSort]` can push the active state into the column metadata; alternatively expose a shared `TwSortHandle` token consumed by both `<tw-column>` and `[twSort]`. Bind `[attr.aria-sort]="col.sortState() ?? null"` on the `<th>`. Document the integration with `[tw-sort-header]` in JSDoc.
   - Acceptance: a new spec wires a stubbed sort state and asserts `th[aria-sort='ascending']` is present; CLAUDE.md's a11y requirement is satisfied.

2. **Add row-level `aria-selected` and emit `<tr>` selection state in the template** — completes the selection-feature surface.
   - File(s): `projects/ngx-tw/table/table.html:87-91` (row `<tr>` binding) + `projects/ngx-tw/table/table.ts:1232-1250` (selection helpers)
   - Why: the selection API is exposed (`setSelected`, `isSelected`) but the rendered row carries no `aria-selected`. Without it, AT users do not learn that the row is selectable / selected.
   - Change: in the template, on the data-row `<tr>`, bind `[attr.aria-selected]="resolvedSelection().enabled ? isSelected(row) || false : null"`. When `selection.enabled === true`, ensure the `<tr>` is keyboard-reachable (`tabindex="0"`) and toggles selection on `(keydown.space)` — out of scope for the first task; document the deferred work.
   - Acceptance: new spec opens `selection.enabled: true`, calls `setSelected(row, true)`, asserts the row's `aria-selected="true"`; unselected rows carry `aria-selected="false"`.

3. **Ship the `_selection` checkbox column** — completes the deferred v1 feature.
   - File(s): `projects/ngx-tw/table/table.html:81-99` + `projects/ngx-tw/table/table.ts:1232-1250`
   - Why: header comment line 24 documents this as deferred — moving it into v1 lets selection work end-to-end and unblocks adoption.
   - Change: when `resolvedSelection().enabled === true`, emit a `<ng-container cdkColumnDef="_selection">` with a `<th>` "select all" checkbox and a `<td>` per-row checkbox. Reuse `<tw-checkbox>` from `ngx-tw/checkbox` so theming flows. Wire master checkbox state to `selected().length === data.length ? 'true' : selected().length > 0 ? 'mixed' : 'false'` (`aria-checked`). Emit `selectionChange` from the row checkbox path (already wired via `setSelected`).
   - Acceptance: when `selection.enabled` is true, the table renders a leading column with checkboxes; clicking a row checkbox updates `selected`, emits `selectionChange`; the header checkbox toggles all; spec covers the matrix.

4. **Add sticky-edge shadows** — visual polish for sticky columns + sticky header.
   - File(s): `projects/ngx-tw/table/table.ts:487-489` (sticky cell decoration)
   - Why: sticky cells overlap scrolled content with no visual cue; users lose the "this is pinned" affordance.
   - Change: extend `STICKY_CELL_ZINDEX` to also include a shadow when the column is sticky-start (`shadow-[2px_0_0_0_var(--color-border)]`) and sticky-end (`shadow-[-2px_0_0_0_var(--color-border)]`). Apply only when the table is actually scrollable (use a `data-scrolled-x` attribute set by a scroll handler — or accept the simpler always-on visual). Keep the existing `stickyHeader` hairline.
   - Acceptance: a sticky-start column has the expected shadow class; the demo at `/table` shows the hairline visible against scrolled rows.

5. **Close test coverage** — appearance/responsive/sticky/dev-mode.
   - File(s): `projects/ngx-tw/table/table.spec.ts` (new describe blocks)
   - Why: each documented behaviour should have a DOM-level assertion per CLAUDE.md test rules.
   - Change: add `describe('appearance.variant')` iterating `'default'|'striped'|'bordered'` and asserting expected class on `<table>`; `describe('appearance.density')` for `comfortable`/`compact`; `describe('responsive.mode = stack')` setting `responsive: { mode: 'stack', stackBelow: 'md' }` and asserting `[&>tbody>tr]:max-md:block` is on the table; `describe('responsive.mode = hide')` with a column carrying `display.hideBelow='md'` asserting `max-md:hidden`; `describe('sticky.scrollHeight')` asserting `style.maxHeight` is the px-coerced value; `describe('dev-mode guards')` calling `it('throws on duplicate column names')`, `it('throws on expansion without multiTemplateRows')`, `it('warns when no accessible name is provided')` via `vi.spyOn(console, 'warn')`.
   - Acceptance: the table spec roughly doubles in length; all new specs pass; coverage matrix is complete.

### Out of scope
- Grid-pattern keyboard nav (APG) — documented as deferred.
- CDK virtual scroll integration — deferred.
- Column resize / drag-reorder / inline edit / filter UI — deferred.
- Further input reshape — already complete; do NOT touch the config-object inputs.
- Renaming any `tw-table`/`tw-column` selectors — stable public API.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- table`
- Visual check: `http://localhost:4600/table`
- A11y: `npm run e2e:a11y` (table route + new stickied / selection examples)

## Priority
**P1** — Component is structurally exemplary and the PR8-style reshape is complete; the remaining gaps are real feature debt (selection-rendering, aria-sort, sticky-edge shadows) that block "production-grade" claims for a data primitive. Test matrix completion is non-negotiable for a flagship component.
