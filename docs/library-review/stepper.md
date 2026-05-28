# Stepper — Production-Grade Review

**Entry point:** `ngx-tw/stepper`
**Files:** `projects/ngx-tw/stepper/`

## Snapshot
- Selectors: `tw-stepper` (element), `tw-step` (element), `ng-template[twStepperIcon]` (structural), `ng-template[twStepLabel]` (structural), `button[twStepperNext]`, `button[twStepperPrevious]`
- Public classes/directives: `StepperComponent` (extends `CdkStepper`), `StepComponent` (extends `CdkStep`), `StepperIconDirective`, `StepLabelDirective` (extends `CdkStepLabel`), `StepperNextDirective`, `StepperPreviousDirective`, plus the `provideTwStepperOptions` factory
- Inputs: 5 (`variant`, `color`, `size`, `showError`, `headerInteractive`) — **plus CDK inherited inputs**: `selectedIndex` (model), `linear`, `orientation`, `disableRipple`
- Outputs: 0 declared by `StepperComponent` (inherits CDK's `selectionChange`)
- Slots: per `<tw-step>`: 1 default (step body) + optional `<ng-template twStepLabel>` + `<ng-template twStepperIcon>`
- CVA: no (the stepper is not a form control; it integrates with reactive forms via `stepControl`)
- `tv()` config: yes, 13 slots, 3 variant axes (`variant`, `size`, `orientation`); `compoundVariants` cover `dot` indicator sizing and thick connectors for lg/xl; `defaultVariants` present
- A11y CDK utilities used: `LiveAnnouncer` (announces step transitions), `CdkStepper`, `CdkStepHeader`, `CdkStepperNext`/`Previous`

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `variant` | `StepperVariant` (`'default' \| 'dot' \| 'simple'`) | `'default'` | yes | Indicator strip style |
| `color` | `TwColor` (shared) | `'primary'` | yes | Active/completed colour |
| `size` | `TwSize` (shared) | `'md'` | yes | Indicator + label scale |
| `showError` | `boolean` | `true` | yes | Codified `true` candidate — see Findings |
| `headerInteractive` | `boolean` | `true` | yes | Codified `true` candidate — see Findings |
| **inherited** `selectedIndex` | `number` (model-like via CDK) | `0` | inherited | CDK input |
| **inherited** `linear` | `boolean` (`booleanAttribute`) | `false` | inherited | CDK input |
| **inherited** `orientation` | `StepperOrientation` | `'horizontal'` | inherited | CDK input |
| **step** `label` | `string` | `''` | inherited from CDK | |
| **step** `stepControl` | `AbstractControl \| null` | `null` | inherited | Linear-mode gate |
| **step** `hasError` | `boolean` (model in CDK) | `false` | inherited | Error display gate |
| **step** `errorMessage` | `string` | `''` | inherited | Hidden announcement |
| **step** `description` (new) | `string` | `''` | yes | ngx-tw addition |
| **iconDirective** `state` | `StepState \| undefined` | `undefined` | yes | Targets a specific state for custom icon |

### Findings
- 5 inputs declared by `StepperComponent` — well under the cap. Counting CDK inherited inputs, the effective surface is ~9; per the prompt the stepper qualifies for the form-control-ish exception (because of reactive-forms integration via `stepControl`). No reshape recommendation.
- JSDoc one-liners cover purpose + default. Compliant.
- **Boolean defaults `true`** — neither `showError` nor `headerInteractive` appears in the codified `defaults of true` list (CLAUDE.md §Boolean defaults). Both have plausible rationale:
  - `showError: true` — "errors should surface by default; turning them off is the special case" (matches `spinner.track` reasoning). Recommend adding the inline JSDoc rationale and adding to the codified list.
  - `headerInteractive: true` — "clicking a header should advance to that step unless linear/explicitly opted out" (matches `accordion.collapsible` reasoning). Same recommendation.
  - Update `.claude/CLAUDE.md` once these are accepted into the codified list.
- `description` on `StepComponent` defaults to `''` — empty-string vs undefined is fine; the template uses `@if (step.description() && variant() === 'default')` (HTML line 108) to gate rendering.
- The CDK `selectedIndex` is exposed via the parent class as a property (not a `model()` input in the modern signal sense). The `_selectedIndexSignal` (line 341) is a manual mirror that lets templates react under OnPush. This is the right escape hatch given CDK's signature, but it leaks the lifecycle complexity into the subclass. Document this clearly in JSDoc on the class.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| **inherited** `selectionChange` | `StepperSelectionEvent` | propertyChange | from `CdkStepper` |

### Findings
- No ngx-tw-specific outputs declared. The CDK `selectionChange` is sufficient — consumers can wire `[selectedIndex]` + `(selectedIndexChange)` or subscribe to `selectionChange` for the rich payload. Compliant with the dual-output convention.
- A `stepClicked` past-tense output on `<tw-step>` is **not** declared, but the click handler on the header (`onHeaderClick`, line 469) directly mutates `selectedIndex`. If consumers need a per-step click hook (e.g., analytics on a non-selected step), they'd have to wire a `(click)` on the header themselves. Acceptable — keeps the surface lean.

## Customization surface
- ng-content slots: 1 default per `<tw-step>` (the step body)
- Structural directives: `[twStepperIcon]` (custom indicator icon per state), `[twStepLabel]` (custom step header label), `[twStepperNext]` / `[twStepperPrevious]` (action buttons)
- Fallback content: indicator icons default to a built-in SVG per state (number / done / edit / error — HTML lines 41–92); the consumer's `*twStepperIcon` template replaces the matching state's icon (line 33–39). Compliant.
- Class merging: `twMerge: true` (line 147)
- Findings:
  - Composition is clean: `<tw-step>` extends `CdkStep`, `<tw-stepper>` extends `CdkStepper`. The `iconTemplates = contentChildren(StepperIconDirective)` query on each step (line 297) lets consumers override per-state icons. Good.
  - `StepperNextDirective` and `StepperPreviousDirective` use `hostDirectives` (lines 487, 493) to mix in `CdkStepperNext` / `CdkStepperPrevious` — the modern Angular composition pattern. Compliant.
  - `provideTwStepperOptions` (line 500) bridges to `STEPPER_GLOBAL_OPTIONS` — gives consumers an app-wide override path. Re-exported in `index.ts`.
  - The `description` input on `<tw-step>` is the one visible ngx-tw addition over the CDK surface; the template only renders it in `'default'` variant (line 108) — `'dot'` and `'simple'` hide it. Documented.

## CSS / Styling
- tailwind-variants: yes; 13 slots
- twMerge: yes (line 147)
- Semantic tokens vs raw palette: all colour-specific styling uses `{role}-{shade}` via the static class maps (`INDICATOR_ACTIVE`, `INDICATOR_COMPLETED`, `LABEL_ACTIVE`, `CONNECTOR_REACHED`). Compliant.
- Surface/fg/border tokens usage: pending/disabled states use `bg-surface-muted text-fg-muted/text-fg-subtle border border-border` (lines 155–157) — correct surface/fg/border tokens. Compliant.
- Radius compliance: `rounded-md` on `stepHeader` (line 52), `rounded-full` on `stepIndicator` (line 53), `rounded-lg` on `stepPanel` (lines 105, 113) — compliant.
- Spacing/gap compliance: `gap-2` on header (line 52). Connector `mx-2 my-1` (lines 103, 111) is fine — those are non-gap margins. `ml-2`/`ml-3`/`ml-11` are explicit layout margins, allowed.
- Typography compliance: indicator `text-xs` (xs/sm sizes), `text-sm` (md), `text-base` (lg/xl) — matches the trigger scale. Description `text-xs text-fg-muted` (line 59) — matches the codified subtitle pattern.
- Focus rings compliance: stepHeader has `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (line 52) — canonical. Panel has the same ring (lines 105, 113). Compliant per the codified rule that `role="tab"` elements must use the canonical outline ring (not the menu-item bg-shift carve-out).
- Dark mode handling: explicit `dark:ring-{color}-950` on the active indicator (lines 162–175), `dark:text-{color}-300` on active labels (lines 195–202), `dark:text-error-300` on error labels (line 192). Compliant with the codified dark-mode convention.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on header (line 52); `transition-[color,background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none` on indicator (line 54). Compliant.
- Shadows: none on the strip; active indicator uses `ring-4 ring-{color}-100 dark:ring-{color}-950` for a focus halo effect (lines 162–175). The codified rule allows `ring-*` for selected/active states — compliant.
- Icon sub-scale: indicators step through `size-6 / 7 / 8 / 10 / 12` (lines 78–96). The `xl` indicator at `size-12` (48px) **exceeds** the codified square-interactive sub-scale top end (`size-9` = 36px) AND the glyph sub-scale top end (`size-10` = 40px). This is a quantitative violation worth flagging — see Gaps.
- Dot variant uses `size-2 / 2.5 / 2.5 / 3 / 3` (lines 121–125) — matches the dot-indicator sub-scale exactly. Compliant.
- Animations: `animate.enter` on panel switches between `'step-panel-enter-forward'` and `'step-panel-enter-backward'` (line 380–385); keyframes defined in `theme/_base.css:188-203` with reduced-motion carve-out. Compliant — no `@angular/animations`.
- Findings:
  - **`size-12` violates the icon sub-scale.** The codified table caps square-interactive at `size-9` (36px) and glyph at `size-10` (40px). The xl stepper indicator should be `size-10` at most. Either drop xl one notch (lg→xl shift `size-10`/`size-10`) or add `size-12` to the codified scale as an exception for stepper indicators specifically.
  - The dot-variant compound-variant at md says `size-2.5` (line 123) and at sm also `size-2.5` — sm and md share a value. Probably intentional to keep dot indicators visually consistent across small sizes.

## Accessibility
- ARIA roles/attributes: header strip carries `role="tablist"` with `aria-orientation` (HTML line 4–5). Each header is `role="tab"` with `aria-controls`, `aria-selected`, `aria-current="step"` on the active, `aria-disabled` when not navigable, `aria-invalid` on error, `aria-label` / `aria-labelledby` passthrough (lines 13–25). Panel is `role="tabpanel"` with `aria-labelledby` and `tabindex="0"` (lines 129–137, 146–156). Compliant.
- Keyboard support: inherited from `CdkStepper`'s `_onKeydown` (template line 6) — Arrow keys move focus, Enter / Space activate. Linear mode blocks navigation to unreachable steps via `isNavigable()`. Tests confirm Linear correctness.
- CDK a11y utilities: `LiveAnnouncer` announces `"${label}, step ${i+1} of ${n}"` on every selection (lines 402–406). Excellent.
- Labels/descriptions wiring: stepLabel directive lets consumers project rich label content; description renders inline in default variant; `errorMessage` renders inside an `sr-only` span (line 113) for AT exposure without visual duplication. Compliant.
- AXE risks: the `tabindex="0"` on the panel (line 134) makes the panel focusable — recommended by APG for tabpanels with no inherently focusable descendant. Good. The pattern correctly uses canonical outline ring on tab role (NOT the menu-item bg-shift carve-out per CLAUDE.md).
- Findings:
  - The vertical orientation renders the panel inline after each selected step (HTML lines 127–137), not in a single bottom region. The `aria-labelledby` link is preserved per-step. Compliant.
  - When the stepper is `linear` and a step is not yet navigable, the header carries `aria-disabled="true"` AND `pointer-events-none opacity-60` (template lines 16–17). Mouse-disabled + ARIA-disabled — correct combination.
  - The disabled cursor uses `cursor-not-allowed` via the slot definition (line 52). Compliant with the codified disabled-cursor pattern.

## Tests
- Spec file: yes (`stepper.spec.ts`, 500 lines)
- Coverage breakdown:
  - rendering: defaults, variants, all colours, all sizes, both orientations
  - selection: click, external set, `selectionChange`, `next()` / `previous()`
  - linear mode: blocked by invalid control, allowed after valid, `aria-disabled` on future steps
  - `headerInteractive`: blocks/allows click
  - error state: `aria-invalid`, suppressed by `showError=false`, `sr-only` errorMessage, suppressed by `provideTwStepperOptions({ showError: false })`
  - content projection: custom icon, custom label
  - Next/Previous directives: click advances/retreats
  - accessibility: tablist + aria-orientation, role=tab + aria-selected, aria-current="step", aria-controls ↔ aria-labelledby wiring, role=tabpanel + tabindex=0, focus-visible outline classes, LiveAnnouncer
- Vitest issues: none — uses `vi.spyOn(announcer, 'announce')`, `vi.fn()`, plain `subscribe`. No `fakeAsync`/`tick`.
- Findings:
  - Coverage is comprehensive — among the strongest in the library.
  - Missing: nothing tests `size='xl'` actually applies `size-12` (only that variants render without errors). If the xl indicator stays at `size-12` despite the sub-scale violation, a DOM assertion guards against regressions.
  - Missing: nothing tests the `description` input rendering in the `'default'` variant. A simple `<tw-step description="…">` host + DOM assertion.
  - Missing: vertical orientation panel-inline rendering — only the tablist `aria-orientation` is asserted. A test that mounts vertical mode and asserts the panel sibling sits inside the same `stepItem` as the selected step closes the structural correctness.
  - Missing: connector colour state is not asserted (the `getConnectorClass` returns different classes per state but no spec checks the resulting DOM).
  - Missing: the `simple` variant hides labels via `sr-only` — no spec asserts visual hiding.
  - Missing: `provideTwStepperOptions({ displayDefaultIndicatorType: false })` and the other `StepperOptions` fields are not tested (only `showError`).

## Gaps & lacks
1. **`size-12` indicator violates the codified icon sub-scale top end** — `size-10` is the documented max for glyphs, `size-9` for square-interactive. Either downsize the xl indicator or codify the exception.
2. **`showError` and `headerInteractive` default to `true` without being in the codified list** — add inline JSDoc rationale and update CLAUDE.md.
3. **Connector colour states not tested** — `CONNECTOR_REACHED` / `CONNECTOR_ERROR` / `CONNECTOR_DEFAULT` selection is untested.
4. **`description` and `simple`/vertical-panel rendering not tested.**
5. **`StepperOptions` global fields beyond `showError` are not exercised** (e.g., `displayDefaultIndicatorType`).
6. **No `stepClicked` event** — minor; consumers can wire a `(click)` themselves.
7. **The `_selectedIndexSignal` / `_previousIndexSignal` / `_orientationSignal` mirror pattern is non-obvious** — a class-level JSDoc explains it (line 333–339) but it's still a foot-gun for future maintainers. Consider waiting for CDK's signal-native API or wrapping the mirroring in a single helper.

## Concrete recommendations (deep-dive prompt body)

### Goal
Bring indicator sub-scale into compliance, codify the two `true`-default booleans, fill remaining test coverage, and add small documentation polish. Component is otherwise production-grade.

### Tasks
1. **Resolve the `size-12` sub-scale violation** — either rescale or codify.
   - File(s): `projects/ngx-tw/stepper/stepper.ts:93-96` (xl indicator slot)
   - Why: the codified glyph cap is `size-10`. Either the stepper indicator must conform, or the codified table needs a "stepper-xl" exception.
   - Change: (preferred) drop the xl indicator from `size-12` → `size-10` and let the lg indicator drop from `size-10` → `size-9`. (alternative) keep `size-12` and update `.claude/CLAUDE.md` §Icon Sizing to note "stepper-xl indicator is `size-12`". Pick option (a) for cleanliness; bump the xl indicator's typography to `text-lg`? No — `text-lg` isn't in the documented scale either. Keep `text-base`.
   - Acceptance: the xl variant uses `size-10`; specs assert the resulting class on a sized stepper; no consumer breakage in the demo.

2. **Codify `showError: true` and `headerInteractive: true`** — add inline rationale + update CLAUDE.md.
   - File(s): `projects/ngx-tw/stepper/stepper.ts:323-327` (input JSDoc) + `.claude/CLAUDE.md` §Boolean defaults
   - Why: CLAUDE.md requires inline JSDoc rationale or list-entry justification for any boolean defaulting to `true`.
   - Change: add JSDoc one-liner rationale on each input (already present, just promote to the documented form). Append two entries to the codified list in CLAUDE.md: `stepper.showError = input(true)` ("errors should surface by default; turning them off is the special case"), `stepper.headerInteractive = input(true)` ("clicking a step header advances by default unless linear or opted out").
   - Acceptance: linter compliance; CLAUDE.md updated; no behaviour change.

3. **Add the missing connector-state spec** — exercise `getConnectorClass` outcomes.
   - File(s): `projects/ngx-tw/stepper/stepper.spec.ts` (new describe block under `Rendering` or `Selection`)
   - Why: connector colour is the primary "progress" cue; an untested code path is a regression risk.
   - Change: mount BasicHost, advance to step 2, assert that the connector following step 0 has `bg-primary-500` class (or whatever `CONNECTOR_REACHED.primary` resolves to). Mount ErrorHost with `hasError=true`, assert that the connector adjacent to the errored step has `bg-error-500`.
   - Acceptance: two new specs pass.

4. **Test `description` rendering and `'simple'` variant** — close visible spec gaps.
   - File(s): `projects/ngx-tw/stepper/stepper.spec.ts` (new describe blocks)
   - Why: rendering matrix per CLAUDE.md should assert observable DOM output, not just "renders without error".
   - Change: `it('renders description text in default variant')` mounts a host with `<tw-step description="Some text">`, asserts the rendered `<span class="…text-xs text-fg-muted">Some text</span>` is present. `it('hides labels via sr-only in simple variant')` asserts the label wrapper has `sr-only` class.
   - Acceptance: two new specs pass.

5. **Test vertical-mode panel-inline rendering** — closes orientation gap.
   - File(s): `projects/ngx-tw/stepper/stepper.spec.ts` (extend Accessibility describe)
   - Why: vertical orientation renders the panel inline under each selected step (HTML lines 127–137); spec only asserts tablist `aria-orientation`.
   - Change: `it('renders the panel inline under each selected step in vertical orientation')` sets `orientation='vertical'`, advances to step 1, asserts `[role="tabpanel"]` is a sibling of the selected step's `stepItem`, not a child of the root horizontal panel slot.
   - Acceptance: one new spec passes.

6. **Add JSDoc note on the CDK-mirror-signals pattern** — improves future maintainability.
   - File(s): `projects/ngx-tw/stepper/stepper.ts:333-339` (already has a comment) — extend the class-level JSDoc.
   - Why: developers reading the file should understand why three signals exist mirroring CDK properties.
   - Change: add an explicit `@remarks` section to the `StepperComponent` JSDoc noting that CDK exposes state as class properties (non-reactive) and the subclass mirrors them into signals for OnPush compatibility. Reference the file location of the `set orientation` override.
   - Acceptance: Compodoc page for `StepperComponent` displays the remarks.

7. **Document the `provideTwStepperOptions` pass-through fields** — closes documentation gap.
   - File(s): `projects/ngx-tw/stepper/stepper.ts:498-502` (factory JSDoc)
   - Why: the factory accepts `StepperOptions` (CDK type) but only `showError` is consumed today (line 478). Document which fields actually flow through.
   - Change: extend the JSDoc with a bulleted list of consumed fields and a note that other CDK options are accepted but currently inert.
   - Acceptance: Compodoc page is clearer; consumers know the surface.

### Out of scope
- Adding a `(stepClicked)` output — composition via `(click)` on `[cdkStepHeader]` works.
- Removing the CDK-mirror pattern — required until CDK ships signal-native APIs.
- Cross-component theming changes (other components also use `ring-4 ring-{color}-100` for active states) — out of scope here.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- stepper`
- Visual check: `http://localhost:4600/stepper`
- A11y: `npm run e2e:a11y` (stepper route)

## Priority
**P2** — Component is high-quality and comprehensively tested. The `size-12` sub-scale issue is a measurable departure from the codified rule but not a regression; the rest are polish items. No production blockers.
