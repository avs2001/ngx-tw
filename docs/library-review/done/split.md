# Split — Production-Grade Review

**Entry point:** `ngx-tw/split`
**Files:** `projects/ngx-tw/split/`

## Snapshot
- Selectors: `tw-split` (element), `tw-split-pane` (element), `[twSplitGutter]` (attribute, marker directive), `[twSplitPaneHeader]` (attribute, marker directive)
- Public classes/directives: `SplitComponent`, `SplitPaneComponent`, `SplitGutterDirective`, `SplitPaneHeaderDirective`
- Inputs: 8 on `SplitComponent` (`direction`, `unit`, `gutterSize`, `disabled`, `keyboardStep`, `keyboardStepLarge`, `storageKey`, `rtl`) + 6 on `SplitPaneComponent` (`defaultSize`, `minSize`, `maxSize`, `collapsible`, `collapsedSize`, `snapSize`, `order`) [7] + 0 on the two marker directives
- Outputs: 4 on `SplitComponent` (`sizesChange`, `resizeStart`, `resizeEnd`, `collapseChange`) + 2 on `SplitPaneComponent` (`sizeChange`, `collapsedChange`)
- Slots: 1 on `SplitComponent` (default — children are `<tw-split-pane>`s); 1 on `SplitPaneComponent` (default for pane content)
- CVA: no
- `tv()` config: **no** — uses a small `computed()` returning `'flex h-full w-full ' + (direction === 'horizontal' ? 'flex-row' : 'flex-col')`
- A11y CDK utilities used: **none** (no `FocusMonitor`, no `LiveAnnouncer`, no `Directionality`)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `direction` | `SplitDirection` (`'horizontal' \| 'vertical'`) | `'horizontal'` | yes | Axis layout |
| `unit` | `SplitUnit` (`'percent' \| 'pixel'`) | `'percent'` | yes | Sizing unit (governs whole container) |
| `gutterSize` | `number` | `6` | yes | Pixel thickness |
| `disabled` | `boolean` | `false` | yes | Blocks all resize |
| `keyboardStep` | `number` | `10` | yes | Arrow-key step |
| `keyboardStepLarge` | `number` | `50` | yes | PageUp/Down step |
| `storageKey` | `string \| null` | `null` | yes | localStorage key for persistence |
| `rtl` | `boolean \| null` | `null` | yes | `null` inherits from `dir` ancestor |
| **pane** `defaultSize` | `number \| undefined` | `undefined` | yes | Initial size (unit follows container) |
| **pane** `minSize` | `number` | `0` | yes | Lower bound |
| **pane** `maxSize` | `number` | `Infinity` | yes | Upper bound |
| **pane** `collapsible` | `boolean` | `false` | yes | Allows collapse |
| **pane** `collapsedSize` | `number` | `0` | yes | Rail-style collapse size |
| **pane** `snapSize` | `number` | `0` | yes | Drag-snap threshold |
| **pane** `order` | `number \| undefined` | `undefined` | yes | Stable ordering hint |

### Findings
- 8 + 7 inputs across the two components. Structural-layout primitive exception applies (per CLAUDE.md §Input count cap and MEMORY `feedback_input_count_structural.md`). Each input is an independent geometric or behavioural axis — no reshape recommendation.
- JSDoc one-liners are excellent: every input describes purpose + default + relevant constraint. Compliant.
- Boolean defaults: `disabled: false`, `collapsible: false` — compliant.
- `rtl: null` (inherit) is a tristate, not a boolean — appropriate.
- **Class-naming debt:** the public classes are exported as `SplitComponent`, `SplitPaneComponent`, `SplitGutterDirective`, `SplitPaneHeaderDirective`. CLAUDE.md notes that the historical `Tw*` prefixes for `TwSplit`, `TwSplitPane`, `TwSplitGutter`, `TwSplitPaneHeader` are scheduled for rename in PR4/PR6 of the library fix plan. Reading the source, the rename has already landed — the bare names are present and the prompt's "existing violators" list refers to a state that has since been fixed. Recommend confirming the rename completed across `index.ts`, demo routes (no demo route exists for split — see Gaps), and consumer docs; no further class rename action is needed in the library code.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `sizesChange` | `number[]` | `propertyChange` | Fires on commit, not during drag |
| `resizeStart` | `SplitResizeEvent` (`{ sizes, unit, originPaneIndex, cause }`) | past-tense action | Carries cause (`pointer`/`touch`/`keyboard`/`programmatic`) |
| `resizeEnd` | `SplitResizeEvent` | past-tense action | Mirrors `resizeStart` |
| `collapseChange` | `SplitCollapseEvent` (`{ paneIndex, collapsed, cause }`) | `propertyChange` | Fires on snap, keyboard, or programmatic collapse |
| **pane** `sizeChange` | `number` | `propertyChange` | Per-pane size update |
| **pane** `collapsedChange` | `boolean` | `propertyChange` | Per-pane collapsed update |

### Findings
- Output naming is exemplary — dual pattern (past-tense for actions, propertyChange for state) per the codified convention. Compliant.
- Rich payloads on `SplitResizeEvent` and `SplitCollapseEvent` — consumers can wire analytics or persistence without per-event diffing.
- One contract gap: `collapseChange` is declared (line 97) but `collapse()`/`expand()` on the public API throw "not implemented" (lines 325–335). The output cannot fire today. Either implement the public API or remove the unused output until v2.
- Pane-level `sizeChange` is declared (line 54) but the parent `SplitComponent._applyToPanes` (line 282–294) writes `pane._size` directly without emitting `sizeChange`. The output is currently dead code. Either wire it (in `_applyToPanes` set + emit when the previous size differs from the new size) or remove it.

## Customization surface
- ng-content slots: 1 (default) on each of `SplitComponent` and `SplitPaneComponent`
- Structural directives: two marker directives (`SplitGutterDirective`, `SplitPaneHeaderDirective`) that hold metadata only — their bodies are empty (just `@Directive`). They are placeholders for future projection slots referenced in `split.ts` but no template wiring uses them today. Dead code or pre-staged for a future Dock/Panel pattern.
- Fallback content: n/a
- Class merging: n/a — no `tv()` config; classes are concatenated by string. There is no point at which `twMerge` could resolve consumer overrides. Consumer `class="…"` on `<tw-split>` should still work because of how Angular concatenates class bindings, but the library does not currently consume `twMerge`.
- Findings:
  - `<tw-split>` has only `_hostClass()` returning `'flex h-full w-full flex-row|flex-col'`. There are NO gutters in the DOM today. Reading the template `template: '<ng-content />'` (line 51) and the pane template `template: '<ng-content />'` (line 23 of `split-pane.ts`), the gutters are simply NOT rendered — the layout depends on flex-basis on panes but offers no draggable handle. This is the largest gap. The keyboardStep / disabled / resize* outputs / setSizes(()) all assume a gutter exists; they will never fire from user interaction because there is no gutter to drag or focus.
  - `SplitGutterDirective` and `SplitPaneHeaderDirective` exist as marker directives but are never queried via `contentChildren`. They are pre-staged but not consumed. Document or remove.
  - The library exposes `setSizes()` (line 303) and `reset()` (line 341) which work programmatically; this is the only way to drive the split today.

## CSS / Styling
- tailwind-variants: no
- twMerge: no (irrelevant without `tv()`)
- Semantic tokens vs raw palette: no colour tokens anywhere — the component renders only flex layout. Compliant by absence.
- Surface/fg/border tokens usage: n/a (no surfaces rendered).
- Radius compliance: n/a
- Spacing/gap compliance: n/a (flex layout only)
- Typography compliance: n/a
- Focus rings compliance: **gutter is never rendered**, so there is no focusable handle. The codified pattern for a draggable gutter is a focusable element with `role="separator"`, `aria-orientation`, `aria-valuenow/min/max`, `tabindex=0`, and the canonical focus ring (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`). Currently missing.
- Dark mode handling: n/a (no colours).
- Transitions: none — flex-basis changes are instantaneous. Consider opt-in `transition-[flex-basis] duration-150` so programmatic resizes animate.
- Shadows: n/a
- Icon sub-scale: n/a (no icons in the gutter — and no gutter).
- Findings:
  - The "structural primitive" character of split means colour styling is minimal — that's correct. The gap is the missing **interactive** gutter, not the styling.

## Accessibility
- ARIA roles/attributes: the `<tw-split>` host has only `data-split-direction` (line 49). No `role="presentation"` or similar. Each pane has `data-split-pane-collapsed`. No `role="separator"` exists in the DOM (because no separator element is rendered).
- Keyboard support: `keyboardStep` / `keyboardStepLarge` inputs are declared but no keydown handler is wired. There is no focusable element to handle the keys.
- CDK a11y utilities: none used. `Directionality` from `@angular/cdk/bidi` should be injected to support RTL flipping; `FocusMonitor` should track focus on the gutter (when added).
- AXE risks: low today because there's no interactive surface to mis-label. The risk emerges as soon as a gutter ships.
- Findings:
  - The component is structurally a no-op as far as user interaction is concerned. The entire "drag the gutter to resize" affordance is missing. This is the single biggest gap.
  - WAI-ARIA APG "Window Splitter" pattern requires `role="separator"`, `aria-controls` referencing the pane(s), `aria-orientation`, `aria-valuemin`/`max`/`now`, `aria-label`, and keyboard support for Arrow / Home / End / Enter (toggle collapse). Currently absent.
  - `rtl: null` inherits from `dir` ancestor per JSDoc — but no `Directionality` injection actually reads `dir`. The implementation is a placeholder. When the gutter ships, integrate `Directionality.value` and `change$`.

## Tests
- Spec file: yes (`split.spec.ts`, 817 lines — largest in the library)
- Coverage breakdown:
  - pure sizing functions: extensive — `resolveInitialSizes`, `redistributeWithConstraints`, percent sum invariant, `rescaleForContainerResize`, `redistributeOnPaneAdded`/`Removed`, `computeBasis`, `availableSpace`
  - component rendering: mount, flex-row/flex-col, `data-split-direction`
  - even distribution fallback (2 / 3 / 1 / 0 panes)
  - defaultSize applied
  - minSize / maxSize clamp
  - input defaults round-tripped
  - `setSizes` API + throw-on-mismatch + emit
  - `reset()` API
  - `collapse()` / `expand()` throw "not implemented"
  - container resize (pixel mode rescale, sizesChange suppression)
  - percent sum invariant
  - dynamic pane add / remove
- Vitest issues: none. Uses `whenStable()`, `vi.fn`, plain `subscribe`. No `fakeAsync`/`tick`.
- Findings:
  - The pure-function suite is exemplary — 100% of the sizing math is unit-tested.
  - Component-integration coverage is thorough for what exists today.
  - Missing: nothing tests pointer-drag (because no gutter renders). When the gutter ships, pointer / touch / keyboard tests are mandatory.
  - Missing: nothing tests `storageKey` persistence (the input is declared but `localStorage` is never read or written in the implementation). Either wire it or remove the input.
  - Missing: `disabled: true` is not tested (no DOM consequence today).
  - Missing: `keyboardStep` / `keyboardStepLarge` are not tested (no keydown handler).
  - Missing: `rtl` not tested (no DOM consequence).
  - Missing: `collapseChange` event firing (output is dead code today).
  - Missing: `SplitPaneComponent.sizeChange` emission (dead code today).

## Gaps & lacks
1. **No interactive gutter rendered** — the entire user-facing resize affordance is missing. `keyboardStep`, `disabled`, `resizeStart`, `resizeEnd`, and pointer-drag have no DOM home.
2. **No keyboard handler** — Arrow / Home / End / Enter / Escape (collapse toggle) are unimplemented.
3. **No focusable separator** — `role="separator"` element with `aria-orientation`, `aria-valuemin/max/now`, `aria-controls`, `tabindex=0` is missing.
4. **No pointer/touch drag** — pointer-events listener with `setPointerCapture`, click-vs-drag thresholding, and `requestAnimationFrame` throttling missing.
5. **`storageKey` is non-functional** — input declared, never read/written.
6. **`collapse()` / `expand()` throw "not implemented"** — public API is incomplete.
7. **`collapseChange` and per-pane `sizeChange` outputs are dead code** — declared but never emitted.
8. **`rtl` is non-functional** — input declared, no `Directionality` integration.
9. **Marker directives (`SplitGutterDirective`, `SplitPaneHeaderDirective`) are placeholders** — defined and exported but never queried.
10. **No `tv()` config** — when the gutter ships, slot-based class management is recommended (`root`, `gutter`, `gutterIndicator`).
11. **No transition on flex-basis** — programmatic resizes are instantaneous; an opt-in animated transition would polish `setSizes()` UX.
12. **No demo route** — `projects/demo/src/app/routes/split/` does NOT exist. The component is invisible to consumers exploring the demo app.
13. **`SplitComponent.disabled` has no DOM effect** — no gutter to disable.

## Concrete recommendations (deep-dive prompt body)

### Goal
Make `<tw-split>` a complete production-grade structural primitive: render a focusable, draggable, keyboard-driven gutter; wire the existing inputs/outputs/APIs end-to-end; integrate Directionality and localStorage; ship a demo page; backfill tests.

### Tasks
1. **Render the gutter element** — single biggest gap.
   - File(s): `projects/ngx-tw/split/split.ts:51` (template) + new internal `split-gutter-element.ts` (or extend the existing `SplitGutterDirective`)
   - Why: the component cannot fulfil its name without a draggable separator. Without this, every behavioural input is dead code.
   - Change: change `template: '<ng-content />'` to an explicit template that interleaves panes with gutters via `@for (pane of _panes(); track $index; let i = $index; let last = $last)`. After each non-last pane, emit a `<div role="separator" tabindex="0" [attr.aria-orientation]="direction()" [attr.aria-valuemin]="0" [attr.aria-valuemax]="100" [attr.aria-valuenow]="_sizes()[i]" [attr.aria-label]="…">`. Style: `flex-shrink-0` + `bg-border hover:bg-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-200` + `cursor-{col,row}-resize`. Width/height = `gutterSize()`. Keep `<ng-content />` available so consumers using `[twSplitGutter]` can customise via projection (the existing marker directive becomes meaningful).
   - Acceptance: `<tw-split>` with 3 panes renders 2 `<div role="separator">` siblings; specs cover the element count and ARIA attrs; default cursor reflects direction.

2. **Wire pointer/touch drag** — drives `resizeStart` / `sizesChange` / `resizeEnd`.
   - File(s): `projects/ngx-tw/split/split.ts:128-153` (constructor) + new internal `_onGutterPointerDown` / `_onGutterPointerMove` / `_onGutterPointerUp`
   - Why: pointer-drag is the primary interaction. Without it the component is read-only.
   - Change: on `(pointerdown)` on a gutter element, capture pointer (`setPointerCapture`), record start position + start sizes, set `_dragging = signal(true)`, emit `resizeStart` with `cause: 'pointer'|'touch'`. On `(pointermove)`, throttle via `requestAnimationFrame`, compute delta in container's unit (px → percent if needed), apply via `redistributeWithConstraints` against adjacent pane constraints, update `_sizes` + `_applyToPanes`. On `(pointerup)` / `(pointercancel)`, release capture, emit `resizeEnd`. Listen to events with `{ passive: true }` where applicable.
   - Acceptance: a new pointer-event-based spec uses `Event('pointerdown')` + `dispatchEvent` to drag a gutter and asserts `_sizes` shifted by the expected delta; `resizeStart`/`resizeEnd` outputs fire once each.

3. **Implement keyboard support** — Arrow / Home / End / Enter on the focused gutter.
   - File(s): `projects/ngx-tw/split/split.ts` (new `_onGutterKeydown`)
   - Why: WAI-ARIA APG "Window Splitter" requires it.
   - Change: bind `(keydown)` on the gutter. Map: ArrowLeft/Up → adjust left pane down by `keyboardStep()` (in declared unit), ArrowRight/Down → up; PageUp/Down → `keyboardStepLarge()`; Home → minimise left pane (set to `minSize` or `0`); End → maximise; Enter → toggle collapse on the left pane if `collapsible`. Emit `resizeStart` / `resizeEnd` with `cause: 'keyboard'` per stroke. Respect RTL flip on horizontal: ArrowLeft increases right pane's share when `_isRtl()`.
   - Acceptance: new specs dispatch each key and assert pane sizes; RTL flip covered.

4. **Implement `collapse()` / `expand()`** — closes the dead `collapseChange` output.
   - File(s): `projects/ngx-tw/split/split.ts:321-335`
   - Why: declared in JSDoc and tested for "not implemented" — public-API completeness.
   - Change: `collapse(paneIndex)` snapshots current size into a per-pane `_preCollapsedSize` signal, sets pane size to `collapsedSize()`, redistributes remainder, emits `collapseChange { paneIndex, collapsed: true, cause: 'programmatic' }` plus pane's own `collapsedChange`. `expand(paneIndex)` restores `_preCollapsedSize` (or `defaultSize` if none recorded), emits the inverse.
   - Acceptance: new specs exercise both; the existing "not implemented" specs flip to assertions of correct behaviour.

5. **Wire `storageKey` persistence** — closes the non-functional input.
   - File(s): `projects/ngx-tw/split/split.ts:198-211` (`_onPanesChange`) and a new save-on-commit hook
   - Why: documented persistence behaviour with no implementation; consumers may rely on it.
   - Change: on init, if `storageKey()` is non-null, read `localStorage.getItem(key)` and parse to a `number[]`; if shape matches pane count, use as initial sizes (override `defaultSize` resolution). On every `sizesChange` emission, write `JSON.stringify(sizes)` to the key. On `reset()`, `localStorage.removeItem(key)`. Guard `typeof localStorage !== 'undefined'` for SSR.
   - Acceptance: spec mocks `localStorage` and verifies read-on-init + write-on-resize + clear-on-reset.

6. **Integrate `Directionality` for RTL** — closes non-functional `rtl` input.
   - File(s): `projects/ngx-tw/split/split.ts:80-95` + drag/keyboard handlers
   - Why: `rtl: null` is documented as inheriting from `dir` ancestor but nothing reads `dir`.
   - Change: `inject(Directionality)` and resolve `_isRtl = computed(() => this.rtl() ?? this.dir.value === 'rtl')`. Wire into the drag delta inversion + keyboard mapping above. Subscribe to `dir.change` for live updates.
   - Acceptance: spec mounts inside `<div dir="rtl">` and asserts left-arrow grows the right pane.

7. **Wire `disabled` end-to-end** — block all gutter interaction.
   - File(s): `projects/ngx-tw/split/split.ts` (template + drag/keyboard handlers)
   - Why: input exists with no DOM consequence.
   - Change: bind `[attr.tabindex]="disabled() ? -1 : 0"` on each gutter; early-return all pointer/keydown handlers when `disabled()`; add `aria-disabled="true"` on gutters when disabled.
   - Acceptance: spec sets `[disabled]="true"`, asserts gutter `tabindex === -1`, pointer-drag does not change sizes.

8. **Emit `SplitPaneComponent.sizeChange`** — close per-pane dead output.
   - File(s): `projects/ngx-tw/split/split.ts:282-294` (`_applyToPanes`)
   - Why: declared output never fires.
   - Change: inside the loop, compare `pane._size()` with `size`; if differ, set `pane._size.set(size)` and emit `pane.sizeChange.emit(size)`.
   - Acceptance: spec subscribes to one pane's `sizeChange`, runs `setSizes`, asserts emission count matches the changed-pane count.

9. **Ship the demo route** — `projects/demo/src/app/routes/split/` does not exist.
   - File(s): new `projects/demo/src/app/routes/split/{overview,examples,api}/…` + `split.routes.ts` + `split-page.component.ts`; wire into `app.routes.ts`.
   - Why: the component is invisible to consumers browsing the demo app; CLAUDE.md's `demo-doc-page` skill defines the canonical shape.
   - Change: follow the canonical demo-page pattern (overview / examples / api with `tw-item` + `twTabNav`). Examples: basic horizontal, vertical, three-pane, with collapsible pane (after task 4), persisted via `storageKey` (after task 5), RTL (after task 6).
   - Acceptance: demo page loads at `http://localhost:4600/split`, all examples render and accept drags / keyboard.

10. **Add `tv()` config for gutter visuals** — slot-based class management.
    - File(s): `projects/ngx-tw/split/split.ts` (replace `_hostClass()`)
    - Why: the codified pattern for any multi-slot component is `tv()` with slots, `defaultVariants`, `twMerge: true`. Gives consumers a `gutterClass` override path via `twMerge` resolution.
    - Change: `splitVariants = tv({ slots: { root, gutter, gutterIndicator }, variants: { direction: { horizontal: { root: 'flex flex-row …', gutter: 'cursor-col-resize w-…' }, vertical: {…} }, disabled: { true: { gutter: 'opacity-50 pointer-events-none' } } }, defaultVariants, twMerge: true })`.
    - Acceptance: consumer-supplied `class` on `<tw-split>` resolves correctly against internal classes; specs assert direction classes and gutter cursor.

11. **Backfill specs for everything new** — pointer-drag, keyboard, RTL, persistence, disabled.
    - File(s): `projects/ngx-tw/split/split.spec.ts` (new describe blocks)
    - Why: every new behaviour needs DOM-level assertions per CLAUDE.md test rules.
    - Change: add the test blocks listed under tasks 2–8 above.
    - Acceptance: spec file grows ~250 lines; all new tests pass.

### Out of scope
- Renaming `SplitComponent` → `TwSplit` etc. — the rename has already landed per the source. Confirm no stragglers in demo / consumer docs.
- Reducing the input count — structural-layout exception applies.
- Virtualised pane content — orthogonal concern.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- split`
- Visual check: `http://localhost:4600/split` (after task 9)
- A11y: `npm run e2e:a11y` (split route)

## Priority
**P0** — Despite mature sizing math and a full test suite for pure functions, the component has NO interactive gutter, NO keyboard, NO pointer drag, and NO demo route. Half of the declared inputs/outputs/APIs are dead code today. This is the highest-severity component in the batch.
