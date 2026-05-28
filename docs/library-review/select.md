# Select — Production-Grade Review

**Entry point:** `ngx-tw/select`
**Files:** `projects/ngx-tw/select/`

## Snapshot
- Selectors: `tw-select` (element, `SelectComponent`), `tw-select-overlay` (internal, not exported), plus five structural template directives — `[twSelectOption]`, `[twSelectTrigger]`, `[twSelectEmpty]`, `[twSelectHeader]`, `[twSelectFooter]`
- Public classes/directives: `SelectComponent<T>`, `SelectOptionTemplateDirective`, `SelectTriggerTemplateDirective`, `SelectEmptyTemplateDirective`, `SelectHeaderTemplateDirective`, `SelectFooterTemplateDirective`
- Inputs: 24 on `SelectComponent` (including aliased `disabled`/`required`) + 2 models (`value`, `open`)
- Outputs: 3 (`openedChange`, `selectionChange`, `searchChange`)
- Slots: 5 named template slots (option / trigger / empty / header / footer)
- CVA: yes
- `tv()` config: yes, multi-slot (`root`, `trigger`, `valueText`, `placeholderText`, `chevron`, `clearButton`)
- A11y CDK utilities used: `Overlay`, `ComponentPortal`, `FocusMonitor`, `LiveAnnouncer`, `ConnectedPosition`, `ScrollStrategy`

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `options` | `readonly unknown[]` | `[]` | yes | Accepts `TwSelectOption<T>` or arbitrary records |
| `optionLabel` | `(option: unknown) => string` | `defaultOptionLabel` | yes | Accessor |
| `optionValue` | `(option: unknown) => T` | `defaultOptionValue` | yes | Accessor |
| `optionDisabled` | `(option: unknown) => boolean` | `defaultOptionDisabled` | yes | Accessor |
| `optionGroup` | `(option: unknown) => string \| undefined` | `defaultOptionGroup` | yes | Accessor |
| `multiple` | `boolean` | `false` | yes | Toggles multi-select + checkable rows |
| `searchable` | `boolean` | `false` | yes | Renders in-panel search input |
| `filterPredicate` | `(option, search) => boolean` | case-insensitive substring | yes |  |
| `placeholder` | `string \| undefined` | `undefined` | yes |  |
| `disabledInput` (alias `disabled`) | `boolean` | `false` | yes | Alias kept to avoid clash with `FormFieldControl.disabled` |
| `requiredInput` (alias `required`) | `boolean` | `false` | yes | Alias kept to avoid clash with `FormFieldControl.required` |
| `size` | `TwSize` | `'md'` | yes |  |
| `color` | `TwColor` | `'primary'` | yes |  |
| `variant` | `SelectVariant \| undefined` | `undefined` (auto-resolves) | yes | `'default' \| 'naked'`; `naked` when inside `tw-form-field` |
| `panelWidth` | `'trigger' \| 'auto' \| number \| string` | `'trigger'` | yes |  |
| `panelClass` | `string \| readonly string[]` | `''` | yes |  |
| `panelMaxHeight` | `number` | `256` | yes |  |
| `closeOnSelect` | `boolean \| undefined` | `undefined` (auto: `!multiple`) | yes |  |
| `scrollStrategy` | `'reposition' \| 'close' \| 'block'` | `'reposition'` | yes |  |
| `offset` | `number` | `4` | yes |  |
| `emptyMessage` | `string` | `'No results'` | yes |  |
| `ariaLabel` (alias) | `string \| undefined` | `undefined` | yes |  |
| `ariaLabelledby` (alias) | `string \| undefined` | `undefined` | yes |  |
| `ariaDescribedby` (alias) | `string \| undefined` | `undefined` | yes |  |
| `compareWith` | `(a: T, b: T) => boolean` | `Object.is` | yes |  |
| `value` (model) | `T \| readonly T[] \| null` | `null` | yes |  |
| `open` (model) | `boolean` | `false` | yes |  |

### Findings
- 26 inputs (24 plus 2 models). Far over the 5–6 cap, but `select` qualifies under **both** the form-control AND the overlay-bearing exceptions (CLAUDE.md lines for input-cap exceptions). Compliant.
- All inputs carry one-line JSDoc — compliant.
- All booleans default to `false`; no codified exception breaches.
- Three input pairs use the alias trick to avoid clashes with `FormFieldControl` abstract members: `disabledInput`/`disabled`, `requiredInput`/`required`. Sensible workaround given the abstract requires `disabled: Signal<boolean>` as a member.
- `compareWith` defaults to `Object.is`; downstream consumers needing structural equality must opt in. Matches Material's API.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `openedChange` | `TwSelectOpenedEvent` (`{ open, trigger }`) | propertyChange | Fires when the panel's visibility transition completes |
| `selectionChange` | `TwSelectSelectionChangeEvent<T>` | action | Rich payload with `added`/`removed`/`previousValue`/`source` |
| `searchChange` | `TwSelectSearchEvent` (`{ search, visibleCount }`) | action | Only fires when `searchable=true` |

### Findings
- Outputs use the dual pattern intentionally: `openedChange` follows propertyChange (matching the `open` model); `selectionChange`/`searchChange` are richer events. Both forms are documented as correct in the project's codified output-naming policy.
- `selectionChange` has a `source: 'user' | 'reset' | 'programmatic'` discriminator. Excellent — consumers can filter telemetry. Used in `writeValue` (line 1411) so programmatic writes are distinguishable.
- `model<value>` provides a fourth event via two-way `valueChange` syntax. No conflict.

## Customization surface
- ng-content slots: five structural-directive slots — `*twSelectOption`, `*twSelectTrigger`, `*twSelectEmpty`, `*twSelectHeader`, `*twSelectFooter`. Each is a structural directive with `templateRef` and (where useful) typed context guards (lines 244–300).
- Structural directives: yes — option, trigger, empty contexts are strongly typed via `ngTemplateContextGuard`. Excellent.
- Fallback content: each slot has a sensible default — option falls back to label + checkmark; empty falls back to `emptyMessage`; trigger falls back to a joined label list or placeholder.
- Class merging: yes — `twMerge: true` on `tv()` (line 214).
- `panelClass` input lets consumers append classes to the overlay panel.
- Findings:
  - Customization surface is exemplary — five named slots, four with typed contexts. Matches Angular Material's flexibility.
  - The internal `SelectOverlayComponent` is exported only as a type via the index? Confirmed: `index.ts` does NOT export `SelectOverlayComponent` (only the public component + template directives + types). Compliant.

## CSS / Styling
- tailwind-variants: yes, multi-slot (`root`, `trigger`, `valueText`, `placeholderText`, `chevron`, `clearButton`). Compound variants for focused-trigger border color per `TwColor` (lines 195–204).
- twMerge: yes (line 214).
- Semantic tokens vs raw palette: compliant. All option-state lookups (lines 219–239) use semantic tokens; checkmark colors use `text-{role}-600` and bg-tints use `bg-{role}-50 dark:bg-{role}-950/40`. No raw palette colors.
- Surface/fg/border tokens usage:
  - `bg-surface-overlay` on the panel root (overlay line 210). Compliant.
  - `border-border`, `border-border-strong` on trigger (lines 167–168). Compliant.
  - `text-fg`/`text-fg-muted`/`text-fg-subtle` for trigger/placeholder/chevron (lines 150–153). Compliant.
  - `bg-surface-muted` for unselected hover/active option (line 766–767). Compliant.
- Radius compliance: `rounded-md` on trigger and clear button (lines 154–167); `rounded-lg` on overlay panel (overlay line 210). Compliant.
- Spacing compliance: trigger uses canonical inline padding (`px-2/3/4/5/6 py-1/1.5/2/2.5/3`, lines 159–163). Options use `px-2/3/4 py-1/1.5/2/2.5/3 gap-1.5` (lines 736–746). Compliant.
- Gap compliance: `gap-2` on trigger, `gap-1.5` on options (xs row). Compliant.
- Typography compliance:
  - Trigger font scale `text-xs/sm/base` matches the codified trigger scale (xs→xs, sm/md→sm, lg/xl→base, lines 159–163).
  - Group label `text-xs font-semibold uppercase tracking-wide text-fg-subtle` (overlay line 79). `text-xs` is the codified caption size — compliant.
  - Empty message `text-sm text-fg-muted` (overlay line 73). Compliant.
- Focus rings compliance:
  - Trigger: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (line 168). Canonical. Compliant.
  - Clear button: same canonical ring (line 155). Compliant.
  - Listbox panel: same canonical ring (overlay line 67). Compliant.
  - **Important per review brief**: option rows use `role=option` — they should use the canonical outline, NOT the menu-item bg-shift carve-out. Active option state is `bg-surface-muted` (line 766); selected uses `OPTION_SELECTED_BG` per-color tinting. **Neither is rendered as a focus indicator** — they signal active-descendant and selected state respectively. The keyboard model uses `aria-activedescendant` on the trigger (line 369) instead of moving DOM focus to option elements. Compliant — the canonical ring policy is satisfied at the trigger, and options never receive DOM focus.
- Dark mode handling: `OPTION_SELECTED_BG` defines explicit `dark:bg-{role}-950/40` overrides (lines 219–227). Per the codified dark-mode-overrides convention this is canonical. Compliant.
- Transitions: `transition-[color,border-color,background-color,box-shadow] duration-200` on trigger (line 150); `transition-colors duration-200` on options (line 757); `transition-transform duration-200` on chevron (line 153). All specific-property — compliant. `motion-reduce:transition-none` everywhere. Compliant.
- Shadows: panel uses `shadow-md` (overlay line 210). Compliant per the codified scale.
- Enter/leave animation: `animate.enter="scale-in fade-in"`, `animate.leave="scale-out fade-out"` (overlay lines 33–34). References keyframes in `theme/_base.css`. Compliant.
- Icon sub-scale: chevron uses `size-3.5` for `xs`, `size-4` for `sm`/`md`, `size-5` for `lg`/`xl` (lines 159–163); clear-X uses `size-3`; check mark uses `size-3.5`/`size-4` (overlay line 217). The chevron `size-3.5` is a half-step from the glyph scale — needs the codified inline-comment justification.
- Findings:
  - Chevron `size-3.5` (line 159) is a half-step glyph; add an inline comment justifying why neither `size-3` nor `size-4` fits adjacent xs trigger text (matches the codified pattern for time-picker/sort).
  - Clear button uses `size-5` (line 155) — that is a glyph scale value (5) being used as a *square interactive target*. Per the codified sub-scales, square interactive targets are `size-6/7/8/9`. The clear-X is effectively a 20px square hit area inside the trigger; `size-5` is too small (~16px). Consider `size-6` (xs) → `size-7` (sm/md) and update the inner SVG to `size-3.5`. P2.

## Accessibility
- ARIA roles/attributes:
  - Trigger: `role="combobox"` + `aria-haspopup="listbox"` + `aria-expanded` + `aria-controls` + `aria-activedescendant` + `aria-autocomplete` (lines 365–371). Compliant.
  - Trigger: `aria-label`/`aria-labelledby`/`aria-describedby`/`aria-required`/`aria-invalid`/`aria-disabled` (lines 372–376). Compliant.
  - Listbox: `role="listbox"` + `aria-multiselectable` when multi (overlay lines 62–67). Compliant.
  - Option: `role="option"` + `aria-selected` + `aria-disabled` (overlay lines 85–88). Compliant.
  - Group: `role="group"` + `aria-label` on group-label divs (overlay line 78). Compliant.
- Keyboard support: Enter/Space open + select (lines 1000–1027); ArrowUp/Down with `alt` opens/closes (line 993); Home/End jump (lines 1047–1059); PageUp/Down ±10 (lines 1061–1071); Escape closes (line 1073); Tab closes (line 1080); type-ahead (line 1099). Disabled options skipped via `findEnabledFrom` (line 1149). Compliant — matches WAI-ARIA APG combobox-listbox pattern.
- CDK a11y utilities:
  - `FocusMonitor.monitor(elementRef, true)` with descendants (line 869). Compliant.
  - `LiveAnnouncer.announce(...)` for multi-select toggle (line 1207). Compliant.
- Label/hint/error wiring: `describedBy` computed merges form-field IDs (via `setDescribedByIds`, line 1430) with user-supplied `aria-describedby` (lines 692–698). Excellent.
- Dev-mode accessible-name warning: present (lines 854–865). Compliant.
- AXE risks: none expected — the combobox pattern is correctly implemented.

### Findings
- A11y implementation is excellent and APG-compliant.
- One minor: `[attr.aria-invalid]="errorStateSignal() || null"` (line 375). Currently `errorStateSignal` is a private signal with no automatic wiring to `NgControl` invalid state — only `_setErrorState(invalid)` exposes a setter (line 1446). There is no integration with `TW_ERROR_STATE_MATCHER`. P1 gap.
- `aria-activedescendant` correctly points at the active option (line 369). Compliant.

## Form integration
- CVA implementation: yes (lines 1393–1425). `writeValue` normalises single vs multi-select payloads and emits `selectionChange` with `source: 'programmatic'` — excellent. `registerOnChange`/`registerOnTouched`/`setDisabledState` implemented.
- ErrorStateMatcher integration: **partial** — `errorStateSignal` exists and is bound to `aria-invalid`, but there is no `TW_ERROR_STATE_MATCHER` injection, no `NgControl` injection, and no `effect()` that runs the matcher. The `_setErrorState(invalid)` setter (line 1446) is documented as "callable by future NgControl integration" — meaning the wiring was deferred. P1 gap.
- form-field interop: yes (line 354–357). Provides `TW_FORM_FIELD_CONTROL`; implements `FormFieldControl<T | readonly T[]>` (lines 774–793). Pushes describedBy IDs through `setDescribedByIds`. `onContainerClick` focuses the trigger + opens the panel.
- Auto-naked variant when inside `tw-form-field`: `resolvedVariant` (line 609) — excellent UX. The trigger drops its own border/ring inside the form-field chrome.
- Works with all three form strategies: yes — tests cover reactive (line 567), template-driven (line 597), and signal forms (line 615).
- Findings:
  - Wire `TW_ERROR_STATE_MATCHER` similarly to other production form controls (e.g., once landed in `input`/`checkbox`). The setter is already there — finish the injection + effect. P1.
  - When the parent form is submitted, the matcher needs `NgForm`/`FormGroupDirective` access — inject both as optional.

## Tests
- Spec file: yes (`select.spec.ts`, 660 lines).
- Coverage breakdown:
  - Rendering: trigger role, aria-haspopup, placeholder, selected label, aria-expanded, data-variant (lines 140–183).
  - Inputs: aria-required, aria-disabled, blocked click when disabled, aria-label (lines 186–217).
  - Open/close lifecycle: panel mount, openedChange event, listbox role, focus-visible classes on listbox, options render, Escape closes (lines 221–283).
  - Single-select: option click, selectionChange `source=user`, closeOnSelect, disabled options blocked, aria-selected (lines 287–351).
  - Multi-select: panel stays open, accumulation, toggle off, aria-multiselectable (lines 355–404).
  - Keyboard: ArrowDown opens, Enter opens, ArrowDown advances, skips disabled, Enter selects (lines 408–475).
  - Clear button: renders/hides, clears + emits `source=reset` (lines 479–519).
  - Searchable: input renders, filtering, empty-state fallback (lines 523–562).
  - CVA: reactive, template-driven, signal forms (lines 566–635).
  - Accessibility: unique IDs, aria-controls wiring (lines 639–658).
- Vitest issues:
  - Uses `vi.useFakeTimers()` + `vi.advanceTimersByTime(200)` to push through the close animation (lines 271, 296, 318, 462, 581). Correct per Vitest rules (NO `fakeAsync`/`tick`). Compliant.
  - Cleanup teardown via `afterEach` removes overlay containers (line 133). Sensible.
- Findings:
  - Excellent coverage. Notable gaps:
    - No test for `compareWith` — custom equality is documented but not exercised.
    - No test for type-ahead (line 1099 of select.ts — typing characters jumps to matching option). Important keyboard a11y path.
    - No test for `panelClass`/`panelWidth` resolution.
    - No test asserting the option `role=option` rows use the canonical focus-visible outline classes (only the listbox is asserted at lines 251–260). Confirms there is no menu-item carve-out — the test is currently passive on that point.

## Gaps & lacks
1. **Incomplete `ErrorStateMatcher` integration.** `errorStateSignal` and `_setErrorState` exist, but no automatic wiring to `TW_ERROR_STATE_MATCHER` / `NgControl`. Setter is a manual escape hatch.
2. **Chevron `size-3.5` half-step lacks inline comment.** Same pattern as time-picker/sort needs justification.
3. **Clear-button square target undersized.** `size-5` (~20px) is below the codified square-interactive scale (`size-6/7/8/9`).
4. **Missing type-ahead test.** Functional path with significant a11y value is untested.
5. **No `compareWith` test.** Documented API is unverified.
6. **No `panelClass` / `panelWidth` test coverage.**
7. **Active hover on options uses `bg-surface-muted`, but `mouseenter` updates `activeIndex` even for disabled rows is guarded — disabled rows skip activation (overlay line 272).** Verify this remains consistent with keyboard navigation.

## Concrete recommendations (deep-dive prompt body)

### Goal
Complete the form-control integration (`ErrorStateMatcher` wiring), justify the half-step chevron, normalise the clear-button target size, and close the test-coverage gaps around type-ahead, `compareWith`, and panel sizing.

### Tasks
1. **Wire `TW_ERROR_STATE_MATCHER` automatically** — finish the deferred integration.
   - File(s): `projects/ngx-tw/select/select.ts:1444-1448` (replace stub), `1391-1425` (CVA region)
   - Why: The setter `_setErrorState` was added but never connected. Other form controls inject the matcher + `NgControl` to compute `errorState` automatically.
   - Change: Inject `NgControl` (`{ self: true, optional: true }`), `TW_ERROR_STATE_MATCHER`, and `NgForm`/`FormGroupDirective` (both optional). In the constructor, add an `effect()` that reads `ngControl?.control` state + form submitted + matcher.isErrorState() and pushes the result into `errorStateSignal`. Mirror the pattern that landed in `checkbox.ts`/`input.ts`. Keep `_setErrorState` as a manual override (mark `@internal`).
   - Acceptance: A Vitest case: bind a `FormControl<string>(null, Validators.required)`, mark touched, and assert `aria-invalid="true"` on the trigger.

2. **Add half-step chevron justification** — comply with the codified comment rule.
   - File(s): `projects/ngx-tw/select/select.ts:159`
   - Why: CLAUDE.md "Half-step decorative" requires an inline comment justifying any `size-3.5` glyph.
   - Change: Add a one-line comment above the `xs` chevron `size-3.5` explaining xs density (the chevron lines up between `text-xs` and the surrounding `py-1` trigger).
   - Acceptance: Comment present; visually unchanged.

3. **Resize clear-button target** — align with the square-interactive sub-scale.
   - File(s): `projects/ngx-tw/select/select.ts:155`
   - Why: Per the icon sub-scale policy, square interactive targets use `size-6/7/8/9`. The clear control is currently `size-5` (~20px), below the AAA 24×24 minimum target.
   - Change: Refactor `clearButton` to size per `TwSize`: `xs: size-6`, `sm: size-7`, `md: size-8`, `lg: size-9`, `xl: size-9` (or as a compound variant). Shrink the inner SVG to `size-3.5` (xs/sm) and `size-4` (md/lg/xl).
   - Acceptance: Each size renders with a target ≥24×24 (axe-core target-size check passes); visual spacing in demo remains compact.

4. **Test type-ahead** — close the keyboard-a11y gap.
   - File(s): `projects/ngx-tw/select/select.spec.ts:408-475`
   - Why: `applyTypeAhead` (line 1099 of select.ts) is a primary a11y path; no spec covers it.
   - Change: Use `vi.useFakeTimers()` to control the type-ahead buffer reset; dispatch `keydown` events with `key: 'b'`, `key: 'a'`, `key: 'n'` on the trigger and assert `aria-activedescendant` ends at Banana (option index 1).
   - Acceptance: Test passes; `applyTypeAhead` covered.

5. **Test `compareWith`** — verify custom equality is honoured.
   - File(s): `projects/ngx-tw/select/select.spec.ts:566`
   - Why: Documented API; protects against accidental regressions to `Object.is`.
   - Change: Use options of shape `{ id: number; label: string }` with `optionValue: o => o.id` and `compareWith: (a, b) => a === b`. Set value via reactive form to `2`, assert the matching option is `aria-selected="true"`.
   - Acceptance: Test passes.

6. **Test `panelClass` / `panelWidth`** — round out customization coverage.
   - File(s): `projects/ngx-tw/select/select.spec.ts:639`
   - Why: Documented inputs without tests.
   - Change: Two new cases: (a) `panelClass="extra-class"` + assert the overlay panel `className` contains `extra-class`; (b) `panelWidth=400` + assert the overlay element's inline `style.width` is `400px` after open.
   - Acceptance: Tests pass.

### Out of scope
- Reshaping the 24-input surface into config objects (overlay + form-control exceptions cover the count).
- Replacing `aria-activedescendant` with DOM-focus mode (current approach is APG-compliant and works with screen readers).
- Adding async option-loading (defer to a follow-up).
- Editable combobox mode (`aria-autocomplete="both"`) — current implementation only supports `aria-autocomplete="list"`.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- select`
- Visual check: `http://localhost:4600/select/examples` (single, multi, searchable, custom trigger, groups, header/footer)
- A11y: `npm run e2e:a11y` and run AXE against the overlay open state.

## Priority
**P1** — Functional implementation is at production quality; the missing `TW_ERROR_STATE_MATCHER` auto-wiring is the one notable form-control parity gap. Clear-button target size and chevron half-step are P2 polish. Test gaps are P2 hardening.
