# Accordion — Production-Grade Review

**Entry point:** `ngx-tw/accordion`
**Files:** `projects/ngx-tw/accordion/`

## Snapshot
- Selectors: `tw-accordion` (element)
- Public classes/directives: `AccordionComponent`
- Inputs: 4 (`type`, `variant`, `collapsible`, `value`)
- Outputs: 0 (state changes flow through the `value` model; child `tw-collapsible` exposes `toggled`)
- Slots: 1 (default content projection — list of `tw-collapsible` panels)
- CVA: no
- `tv()` config: yes, single slot (`root`) plus three `variant` cases (`default`, `bordered`, `ghost`); `defaultVariants` present
- A11y CDK utilities used: `LiveAnnouncer` (indirectly via projected `CollapsibleComponent.announceState`)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `type` | `AccordionType` (`'single' \| 'multiple'`) | `'single'` | yes | Controls single vs multi-open mode |
| `variant` | `AccordionVariant` (`'default' \| 'bordered' \| 'ghost'`) | `'default'` | yes | Container chrome only |
| `collapsible` | `boolean` (with `booleanAttribute`) | `true` | yes | Codified `true` exception |
| `value` | `string \| string[]` (`model`) | `''` | yes | Two-way bound; type changes with `type` |

### Findings
- 4 inputs — well under the 5–6 cap (no exception needed).
- JSDoc one-liners cover purpose + default, compliant.
- `collapsible` defaulting to `true` is in the codified exception list (CLAUDE.md §Boolean defaults); the JSDoc carries the rationale ("accordions are collapsible by definition; opt-out only").
- `value` is correctly a `model<string | string[]>` (two-way binding pattern). The union-typed model is awkward: when the consumer flips `type` between `'single'` and `'multiple'`, the value shape changes silently and there is no runtime guard. Consider a dev-mode warning when `type === 'multiple'` and `value()` is not an array (or vice versa).

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- The accordion has no outputs of its own. State is communicated via the `value` model and via each child `tw-collapsible`'s `toggled` output. This is consistent with Radix / Material patterns. No gap.
- Optional improvement: an `expansionChange` event (`{ panel: string; expanded: boolean }`) on the accordion would let consumers wire a single listener instead of N collapsible subscriptions. Not blocking.

## Customization surface
- ng-content slots: 1 (default — accepts a sequence of `<tw-collapsible>` children); header/content are projected into each child
- Structural directives: none on the accordion itself (children use `[twCollapsibleTrigger]`/`[twCollapsibleIcon]`)
- Fallback content: n/a (empty accordion is a valid render — children are consumer-supplied)
- Class merging: `twMerge: true` on `tv()` config (line 51)
- Findings:
  - Composition is correct — the accordion is a thin policy layer over `CollapsibleGroupComponent`. The `forwardRef` provider at lines 65–70 lets each projected `tw-collapsible` resolve `CollapsibleGroupComponent` and inherit group semantics without an extra wrapper.
  - Header/content live inside the child `tw-collapsible`; the accordion does not need its own `*twAccordionHeader` directive. This matches the prompt's stated shape.

## CSS / Styling
- tailwind-variants: yes; single `root` slot
- twMerge: yes (line 51)
- Semantic tokens vs raw palette: only `border-border` / `divide-border` — no raw palette colors. Compliant.
- Surface/fg/border tokens usage: structural styling delegates to `border-border` / `divide-border` — correct. The accordion itself applies no surface colors.
- Radius compliance: `rounded-lg` on `default`/`bordered` (lines 36, 39) — compliant.
- Spacing/gap compliance: no padding/gap defined at the accordion level (correctly delegated to children). Compliant.
- Typography compliance: n/a (the accordion does not render text).
- Focus rings compliance: n/a — focus is owned by child triggers (canonical ring lives on `CollapsibleTriggerDirective`).
- Dark mode handling: relies on `border-border` / `divide-border` tokens which already adapt — compliant.
- Transitions: n/a at the accordion level; child triggers carry the `transition-colors duration-200` ring.
- Shadows: none. Correct (accordion is flat by default).
- Icon sub-scale: n/a.
- Findings:
  - The `bordered` variant applies `divide-y divide-border border border-border` (line 39). Children inside the group already set `rounded-none border-0` via the `inGroup` variant on the collapsible (line 78 of `collapsible.ts`), so the outer rounded corners on the bordered variant clip the first/last child cleanly. Good interplay.

## Accessibility
- ARIA roles/attributes: `role="group"` on host (line 61). Each child trigger carries `aria-expanded` + `aria-controls` (set by `CollapsibleTriggerDirective`). Each child panel carries `role="region"` + `aria-labelledby` (set by `CollapsibleComponent` template).
- Keyboard support: `onTriggerKeydown` (lines 165–196) implements ArrowDown / ArrowUp / Home / End. ArrowDown wraps, skips disabled. Toggle is owned by the child trigger via Enter / Space.
- CDK a11y utilities: live-region announcement is delegated to the child collapsible's `announceState()` which uses `LiveAnnouncer`. No `FocusKeyManager` is used — the accordion implements its own arrow-key walk against `triggers().findIndex(t => t.elementRef.nativeElement === document.activeElement)` (line 169). This works but reimplements logic that `FocusKeyManager` would provide for free (wrap, typeahead, vertical/horizontal orientation, RTL).
- AXE risks: low. The host `role="group"` lacks an `aria-label` / `aria-labelledby`. WAI-ARIA APG suggests labelling the accordion when its purpose isn't obvious from context. Consider an optional `ariaLabel` input on the accordion.
- Findings:
  - Migrate the keyboard walk to `FocusKeyManager<CollapsibleTriggerDirective>`. The directive already exposes `focus()` (line 192 of `collapsible.ts`); add a `disabled` getter or implement `FocusableOption` on the trigger and wire `withWrap()` + `withHomeAndEnd()`. This gives free typeahead and matches the Tabs / Stepper convention.
  - The accordion uses `document.activeElement` directly (line 170) — this won't work in shadow-DOM contexts. CDK's `FocusKeyManager` handles this for us.
  - No `aria-label` / `aria-labelledby` on the host. Add an optional `ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' })` plus host binding.
  - WAI-ARIA APG recommends `aria-multiselectable="true"` on the container in multi-open mode. Currently absent; add `[attr.aria-multiselectable]="type() === 'multiple' || null"`.

## Tests
- Spec file: yes (`accordion.spec.ts`, 351 lines)
- Coverage breakdown:
  - rendering: default state + three variants
  - single mode: open/close, value sync, parent-driven value, disabled-skip
  - multiple mode: multiple opens, array value, removal, parent-driven array
  - keyboard navigation: ArrowDown / ArrowUp / Home / End + disabled-skip
  - accessibility: `role="group"` on host, `LiveAnnouncer` mock call, `aria-expanded` propagation
- Vitest issues: none — uses `vi.fn()`, `vi.spyOn`-equivalent via mock-injection, no `fakeAsync`/`tick`.
- Findings:
  - Missing: ghost-variant DOM-class assertion. The Rendering block tests `bordered` shows `border` and `ghost` does NOT contain `border-border`, but does not assert the `divide-y` class on default vs ghost.
  - Missing: nothing asserts the `aria-multiselectable` attribute (because it isn't implemented yet — see A11y findings).
  - Missing: nothing covers the `value` model emitting on the parent host. `expect(fixture.componentInstance.active()).toBe('a')` is correct but a `vi.spyOn(host.active, 'set')` would catch double-emits.

## Gaps & lacks
1. Keyboard navigation reimplements logic that `FocusKeyManager` provides for free (wrap, typeahead, shadow-DOM safety).
2. No `aria-multiselectable` on the host in multi-open mode.
3. No optional `aria-label` / `aria-labelledby` input — host carries only `role="group"`.
4. Union-typed `value` (`string | string[]`) has no runtime guard when `type` is flipped between modes.
5. No accordion-level expansion event (consumers must subscribe to N child `toggled` outputs or to `(valueChange)`).
6. Tests do not assert the ghost-variant divider classes or the `value` model shape under `type` changes.

## Concrete recommendations (deep-dive prompt body)

### Goal
Replace hand-rolled focus walking with CDK's `FocusKeyManager`, complete the ARIA surface (multiselectable, optional aria-label), and add a small runtime guard plus optional aggregate `expansionChange` event.

### Tasks
1. **Migrate keyboard navigation to `FocusKeyManager`** — replaces `document.activeElement` walking.
   - File(s): `projects/ngx-tw/accordion/accordion.ts:164-219`, `projects/ngx-tw/collapsible/collapsible.ts:160-195` (`CollapsibleTriggerDirective`)
   - Why: CDK's `FocusKeyManager` is the canonical solution for tablist-like horizontal/vertical rovers. It handles wrap, Home/End, optional typeahead, and is shadow-DOM-safe. CLAUDE.md §Compose Angular CDK directs us to use CDK before reinventing.
   - Change: implement `FocusableOption` on `CollapsibleTriggerDirective` (expose `focus()` — already present — and `disabled` getter mirroring `collapsible.disabled()`). In `AccordionComponent` construct `new FocusKeyManager(this.triggers).withWrap().withHomeAndEnd().withVerticalOrientation()`. Replace `onTriggerKeydown` body with a `manager.onKeydown(event)` call. Keep the existing `triggers` `contentChildren` query; refresh the manager via `effect()` when the list changes (`manager.setActiveItem(0)` after re-init).
   - Acceptance: existing keyboard specs continue to pass; new test verifies typeahead (`fixture.detectChanges(); ... dispatch first letter`) cycles to the matching trigger; `document.activeElement` references are removed from `accordion.ts`.

2. **Add `aria-multiselectable` and optional `aria-label`** — completes ARIA group semantics.
   - File(s): `projects/ngx-tw/accordion/accordion.ts:57-71` (host metadata + new input)
   - Why: WAI-ARIA APG "Accordion" pattern recommends `aria-multiselectable="true"` when the container allows multiple expanded panels. An optional accessible name on the group helps when the accordion's context isn't self-evident.
   - Change: add `readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' })` plus `readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' })`. Bind in `host`: `'[attr.aria-multiselectable]': "type() === 'multiple' || null"`, `'[attr.aria-label]': 'ariaLabel() ?? null'`, `'[attr.aria-labelledby]': 'ariaLabelledby() ?? null'`. Update JSDoc + Compodoc.
   - Acceptance: new tests verify `aria-multiselectable="true"` in MultipleHost, absent in SingleHost; `aria-label` reflects the input; AXE passes on both demo accordion examples.

3. **Add a runtime guard for `value` shape vs `type`** — closes the union-type silent-mismatch.
   - File(s): `projects/ngx-tw/accordion/accordion.ts:96-117` (constructor effect)
   - Why: When `type` and `value` shape diverge (`type='multiple'` + `value=''`, or `type='single'` + `value=['a']`), the sync effect silently does nothing on the wrong branch. A dev-mode console warning surfaces the mismatch.
   - Change: inside the sync `effect()`, when `isSingle && Array.isArray(val)` or `!isSingle && typeof val === 'string' && val !== ''`, `isDevMode() && console.warn('[tw-accordion] `value` shape does not match `type`. Expected string for single, string[] for multiple.')`.
   - Acceptance: new spec triggers a `vi.spyOn(console, 'warn')` and asserts the warning when the host accidentally sets `['a']` on a single-mode accordion.

4. **Add an aggregate `expansionChange` output (optional)** — single listener for expand/collapse events.
   - File(s): `projects/ngx-tw/accordion/accordion.ts:134-162` (`toggleItem`)
   - Why: Today consumers must wire `(toggled)` on every `tw-collapsible` or listen to `(valueChange)` and diff. A single `expansionChange = output<{ value: string; expanded: boolean }>()` mirrors the table's `expansionChange` API and is friendlier.
   - Change: declare `readonly expansionChange = output<{ value: string; expanded: boolean }>()`. Emit inside `toggleItem` after the `value.set` updates, on every branch.
   - Acceptance: new spec subscribes and asserts a single payload `{ value: 'a', expanded: true }` on first open, `{ value: 'a', expanded: false }` on close.

5. **Add ghost-variant divider class assertion and multi-mode multiselect test** — close test gaps.
   - File(s): `projects/ngx-tw/accordion/accordion.spec.ts:114-126` and new block under `Accessibility`
   - Why: spec rendering coverage currently checks `className.includes('border')` but not the `divide-y` decoration, and the new `aria-multiselectable` binding needs a test.
   - Change: add `it('does NOT apply divide-y on ghost', () => …)`, `it('sets aria-multiselectable on multiple mode', () => …)`.
   - Acceptance: both tests pass; file grows by ~15 lines.

### Out of scope
- A separate accordion-level `disabled` input that disables every child — child-level `disabled` is correct; the input cap argues against duplicate state.
- A "non-collapsible always-one-open" mode where Enter on the active trigger does nothing — already implemented via `collapsible=false`.
- Migrating `forwardRef` provider to a non-circular shape — Angular convention for parent/child cycle, leave as-is.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- accordion collapsible`
- Visual check: `http://localhost:4600/accordion`
- A11y: `npm run e2e:a11y` (accordion route)

## Priority
**P2** — Component is functionally correct, well-tested, and visually compliant. The CDK migration and ARIA completeness are quality wins, not bug fixes; the runtime guard and aggregate event are nice-to-have polish.
