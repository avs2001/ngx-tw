# Segmented-Control — Production-Grade Review

**Entry point:** `ngx-tw/segmented-control`
**Files:** `projects/ngx-tw/segmented-control/`

## Snapshot
- Selectors: `tw-segmented-control` (element), `tw-segmented-option` (element)
- Public classes/directives: `SegmentedControlComponent`, `SegmentedControlOptionComponent` (plus `SegmentedControlVariant`, `SegmentedControlRounded` types)
- Inputs: 7 on `SegmentedControlComponent` (`variant`, `color`, `size`, `orientation`, `rounded`, `disabled`, plus `value` model); 2 on `SegmentedControlOptionComponent` (`value`, `disabled`)
- Outputs: 0 explicit — `valueChange` auto-emitted by the `model()`
- Slots: implicit `<ng-content>` per `tw-segmented-option`
- `tv()` config: yes, slots = `root`, `option`
- A11y CDK utilities used: `FocusMonitor` (segmented-control.ts:212, 332-335)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `variant` | `SegmentedControlVariant` | `'surface'` | yes | `'surface' \| 'filled' \| 'outline'` |
| `color` | `TwColor` | `'primary'` | yes | OK |
| `size` | `TwSize` | `'md'` | yes | OK |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | yes | Literal duplicated again — promote to `TwOrientation`. |
| `rounded` | `SegmentedControlRounded` | `'pill'` | yes | `'pill' \| 'md'`. Vertical orientation forces `'md'` (segmented-control.ts:227-229). |
| `disabled` | `boolean` | `false` | yes | OK |
| `value` (model) | `string \| null` | `null` | yes | Correct: nullable. Good model. |
| Option `value` | `string` | required | yes | OK |
| Option `disabled` | `boolean` | `false` | yes | OK |

### Findings
- Input count is 7 (including model) — within the cap with one to spare. Sound.
- `value` model is properly typed `string | null` with `null` default — better than `tabs`.
- `rounded` enum is only `'pill' | 'md'`. Project radius scale allows `lg`, `xl`, `full`, `none` — no consumer requirement to support those for a pill control, so OK. Document.
- `SegmentedControlOptionComponent` does not expose a `label` input — relies on projection. Correct.
- Missing **input-driven icon slot** — consumers must use plain text. Material's `mat-button-toggle` supports leading icons. Currently a consumer can project `<svg>` content, but no canonical pattern is documented.
- No `name` input — segmented-control is a radiogroup. When inside an HTML form with `<input type=radio>` siblings, the `name` would be expected. Since the component synthesises radios via ARIA, this matters less, but if the consumer wants to submit values via traditional form posts they're forced into reactive forms.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| (implicit `valueChange`) | `string \| null` | propertyChange | OK — emitted by model. |

### Findings
- No explicit `change` (action) output. Acceptable since `valueChange` covers it.
- No `optionFocused` / `optionBlurred` — usually not needed.

## Customization surface
- ng-content slots: implicit body of each `<tw-segmented-option>` (text + arbitrary content).
- Structural directives: none.
- Fallback content: none.
- Class merging: `twMerge: true` (segmented-control.ts:57). Option classes use plain string concatenation (segmented-control.ts:151,156). The active-class lookup goes through twMerge implicitly via `tv()`.
- Findings:
  - **Plain string concat** for option classes risks duplicate classes that twMerge won't reconcile. Lines `${base} opacity-50 pointer-events-none cursor-default` and `${base} ${state}` should be wrapped in `twMerge(...)` for safety.
  - **No per-slot class hooks** (`optionClass`, `rootClass`). Add as inputs.
  - **No way to project an icon-only option** with consistent sizing. Document a canonical recipe (e.g. `<tw-segmented-option><tw-icon name="bold"/></tw-segmented-option>`) and possibly expose an `iconOnly` boolean that adjusts padding.

## CSS / Styling
- tailwind-variants: yes, slots `root`, `option`
- twMerge: yes (segmented-control.ts:57)
- Semantic tokens vs raw palette: ACTIVE class maps use `text-primary-700 dark:text-primary-300` etc. — **dark-mode overrides are present**, in contrast to tabs/tab-nav. Good. However, FILLED_ACTIVE uses literal `text-white` and `text-black` (segmented-control.ts:73-80). Project now ships `on-{role}` tokens (e.g. `text-on-primary`); switch to those.
- Surface/fg/border tokens usage: correct — uses `bg-surface`, `bg-surface-muted`, `text-fg`, `text-fg-muted`.
- Radius compliance: `rounded-full` (pill), `rounded-md` — compliant.
- Spacing/gap compliance: inline padding follows canonical xs/sm/md/lg/xl scale (segmented-control.ts:37-41) — compliant. Outer `gap-1` (segmented-control.ts:44-45) — compliant.
- Typography compliance: xs→`text-xs`, sm/md→`text-sm`, lg/xl→`text-base` — compliant. `font-medium` — compliant.
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (segmented-control.ts:33) — canonical. `role=radio` does NOT qualify for menu-item carve-out — correctly using outline ring.
- Dark mode handling: SURFACE_ACTIVE and OUTLINE_ACTIVE have proper `dark:text-{color}-300` overrides. FILLED_ACTIVE uses `text-white`/`text-black` raw. Replace with `text-on-{role}`.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` — compliant.
- Shadows: `shadow-sm` on active — compliant.
- Icon sub-scale: no inline icons rendered by the component itself.
- Findings:
  - **Replace `text-white`/`text-black` in FILLED_ACTIVE** with `text-on-{role}` semantic tokens (segmented-control.ts:73-80) — the project just landed `on-primary`/`on-success`/`on-warning`/`on-error` etc. tokens.
  - **OUTLINE_ACTIVE missing dark overrides** (segmented-control.ts:83-92). Filled and outline both should add `dark:text-{color}-300` like surface does.
  - Disabled-group root class is concatenated as `'${base} opacity-50 pointer-events-none'` (segmented-control.ts:241) — wrap in `twMerge` for safety.
  - No `aria-orientation` issue, but consider rendering a focus ring on the **group** (not just options) when `FocusMonitor` reports keyboard focus. Currently `FocusMonitor.monitor()` is set up but its result isn't observed in the template.

## Accessibility
- ARIA roles/attributes: `role="radiogroup"` on host (segmented-control.ts:183), `role="radio"` on each option (segmented-control.ts:111). `aria-checked` reflects active state. `aria-disabled` reflects disabled. `aria-orientation` matches the input.
- Keyboard support: Arrow Right/Down → next; Arrow Left/Up → prev (segmented-control.ts:268-275). Home → first enabled; End → last enabled. Wraps around. Skips disabled. This is the canonical WAI-ARIA "radio group" behavior.
- CDK a11y utilities: `FocusMonitor` is started in `ngOnInit` and stopped on destroy (segmented-control.ts:331-336). The focus origin isn't used anywhere — dead code unless something else consumes it. Either consume it (e.g. apply a "focus-visible" surrogate class when origin === 'keyboard') or remove the monitor.
- Focus management: roving tabindex via `isFocusable` computed (segmented-control.ts:136-146). The active option gets tabindex=0; if no option is active, the first non-disabled option is focusable. Correct.
- AXE risks: none obvious. The roving tabindex + `role=radio` + `aria-checked` is a clean radiogroup implementation.
- Findings:
  - **`FocusMonitor` is started but never consumed** — its purpose was likely to add a keyboard-only focus indicator to the group. Either tie it into a `keyboardFocused` signal that applies `ring-2 ring-primary-500` to the root, or remove the monitor (and the `OnInit` lifecycle) entirely.
  - **No `Tab` / `Shift+Tab` handling**, which is correct — focus is roving, so Tab leaves the group; the next focused option is whatever has tabindex=0.
  - **No Enter/Space handler** to commit selection. With `role=radio`, ATs may expect Space to toggle. Currently arrow keys auto-commit (no manual mode), so Space is unnecessary BUT also unhandled — if a screen-reader fires a synthetic click on the option, the existing click handler will fire. Verify.
  - **Disabled group does NOT remove tabindex** from options — `isFocusable` returns `false` when `isDisabled()` is true (segmented-control.ts:137), so individual options become `-1`. Good.
  - The component uses **automatic activation** (arrow key selects immediately). For a radio group, automatic activation is the standard WAI-ARIA recommendation, so this is correct.
  - **Live announcement** of the selected option is not wired. For a small radiogroup most ATs will announce naturally, but the announcement when navigating between options is dependent on the AT reading `aria-checked` changes. Consider adding `LiveAnnouncer` for parity with tabs.

## Tests
- Spec file: yes — segmented-control.spec.ts (521 lines).
- Coverage breakdown:
  - Rendering: default + sizes + orientations + colors — covered (renders + length).
  - Rounded: pill/md + vertical forcing md — covered.
  - Variants: surface/filled/outline + variant × color matrix — covered.
  - Interactions: click select, disabled option, disabled group, ArrowRight/Down/Left/Up, wrap, skip-disabled, Home, End — all covered.
  - Accessibility: `role=radiogroup`, `role=radio`, `aria-checked`, `aria-orientation`, `aria-disabled` (group and option), roving tabindex — all covered.
  - CVA: FormControl initial value, click → control, control → DOM, disabled — covered.
  - Template-driven (ngModel): initial reflect, click → ngModel — covered.
  - Signal forms (`form()`): initial reflect, click → field, programmatic — covered.
- Vitest issues: none. No `fakeAsync`/`tick`.
- Findings:
  - **No AXE check** test.
  - **No test for the `FocusMonitor` flow** (because it's not used in the template).
  - **No test asserting `text-on-{role}` is applied** once the semantic tokens are introduced.
  - Spec is one of the best in the navigation batch — comprehensive across the three form strategies.

## Gaps & lacks
1. FILLED_ACTIVE uses raw `text-white`/`text-black` instead of **`text-on-{role}`** semantic tokens (P0).
2. OUTLINE_ACTIVE is missing **dark-mode text overrides** (P1).
3. `FocusMonitor` is started but **never consumed** — dead code or missing keyboard-focus styling (P1).
4. **String concatenation** for some option/root classes bypasses `twMerge` (P2).
5. **No per-slot class hooks** (`rootClass`, `optionClass`) (P2).
6. No **icon-only** input or documented icon recipe (P2).
7. **`orientation` literal union** duplicated across components — promote to `TwOrientation` (P2).
8. No **AXE spec** (P1).
9. No **`LiveAnnouncer`** for selection feedback (P2).
10. **CVA** correctly implemented; no gaps.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Tighten `segmented-control` against the post-`on-*` token landscape: switch filled foregrounds to `text-on-{role}`, complete dark-mode overrides, either wire or remove `FocusMonitor`, and add per-slot class hooks.

### Tasks
1. **Switch FILLED_ACTIVE foregrounds to `text-on-{role}` semantic tokens**.
   - File(s): `projects/ngx-tw/segmented-control/segmented-control.ts:72-81`
   - Why: the library landed `on-{role}` tokens (commit `e952a33`) precisely so solid-fill components stop using raw `text-white`/`text-black`. Segmented-control still uses raw values, which break for consumers who override the `on-{role}` token (e.g. inverted brand).
   - Change: rewrite each FILLED_ACTIVE entry to use `text-on-{role}`. Drop the warning-specific `text-black` line (the token handles it). Example: `primary: 'bg-primary-600 text-on-primary shadow-sm'`. Apply to all 8 colors.
   - Acceptance: snapshot specs still pass; consumer-defined `--color-on-primary` is picked up.

2. **Add dark-mode overrides to OUTLINE_ACTIVE**.
   - File(s): `projects/ngx-tw/segmented-control/segmented-control.ts:83-92`
   - Why: SURFACE_ACTIVE has them, OUTLINE_ACTIVE does not. Project convention is explicit `dark:` on color variants.
   - Change: extend each entry: `primary: 'ring-2 ring-primary-500 dark:ring-primary-400 text-primary-700 dark:text-primary-300'`. Apply to all 8 colors.
   - Acceptance: dark-mode outline variant renders in readable contrast.

3. **Wire or remove `FocusMonitor`**.
   - File(s): `projects/ngx-tw/segmented-control/segmented-control.ts:212,331-336`
   - Why: `FocusMonitor` is started/stopped but its origin signal is never consumed. This is dead code (and an injection that adds bundle weight).
   - Change: pick one:
     a. **Wire**: convert the monitor's emission to a `keyboardFocused` signal; apply `ring-2 ring-primary-500 ring-offset-2` to the root when `keyboardFocused()` is true. Update `rootClasses` to merge the conditional ring.
     b. **Remove**: drop the `FocusMonitor` injection, `ngOnInit`, the destroy hook, and the `OnInit` import. Options keep their own `focus-visible` rings.
   - Recommend (a) for parity with Material's `mat-button-toggle-group`.
   - Acceptance: with (a), keyboard-focusing into the group shows a group-level ring; mouse-clicking shows only the option ring. With (b), no dead code remains.

4. **Wrap option/root class concatenation in `twMerge`**.
   - File(s): `projects/ngx-tw/segmented-control/segmented-control.ts:149-157,239-242`
   - Why: the current `${base} ${state}` and `${base} opacity-50 pointer-events-none` are plain string concats. If the consumer overrides via `class="..."` later, twMerge inside `tv()` reconciles, but disabled and base utilities can still collide. Use `twMerge(...)` explicitly.
   - Change: `return twMerge(base, state)` and `return twMerge(base, 'opacity-50 pointer-events-none cursor-default')`.
   - Acceptance: no class collisions; specs still pass.

5. **Add per-slot class hooks**.
   - File(s): `projects/ngx-tw/segmented-control/segmented-control.ts`
   - Why: consumers need to override option/root styling without a global selector.
   - Change: add `rootClass = input<string>('')`, `optionClass = input<string>('')`. Merge into the corresponding `tv()` slot.
   - Acceptance: `<tw-segmented-control optionClass="shadow-md">` applies to every option.

6. **Add an AXE check + `LiveAnnouncer` assertion**.
   - File(s): `projects/ngx-tw/segmented-control/segmented-control.spec.ts`
   - Why: parity with the rest of the library; live-announce parity with tabs.
   - Change: add `it('passes AXE checks', …)`. If task 3a is chosen, add a spec covering keyboard-focus ring. If a `LiveAnnouncer` is added, add a `vi.spyOn(announcer, 'announce')` assertion.
   - Acceptance: AXE returns zero violations.

7. **Promote `TwOrientation` literal to `ngx-tw/core`**.
   - File(s): `projects/ngx-tw/core/types.ts`, `projects/ngx-tw/segmented-control/segmented-control.ts`, `projects/ngx-tw/tabs/tabs.ts`, `projects/ngx-tw/tab-nav/tab-nav.ts`, `projects/ngx-tw/split/*`
   - Why: the literal `'horizontal' | 'vertical'` is repeated in many places. A shared `TwOrientation` type makes the public API uniform.
   - Change: add `export type TwOrientation = 'horizontal' | 'vertical'` to `core/types.ts`. Update each component's input to use it.
   - Acceptance: no behavioural change; consumer imports the shared type.

### Out of scope
- Refactoring CVA into a directive — `ControlValueAccessor` is fine as-is.
- Adding a multi-select mode — out of scope for a radio-group-style control. Use `tw-button-toggle` / `tw-toggle-group` if needed later.

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Visual check: `http://localhost:4600/segmented-control`
- A11y: `npm run e2e:a11y` or AXE in spec

## Priority
**P1** — Strong baseline. The `on-{role}` token migration is required to keep the library consistent post-`e952a33`. Dark-mode parity in outline variant and removing the dead `FocusMonitor` are quality polish that should land together. Component is otherwise close to production-grade.
