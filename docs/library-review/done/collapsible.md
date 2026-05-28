# Collapsible — Production-Grade Review

**Entry point:** `ngx-tw/collapsible`
**Files:** `projects/ngx-tw/collapsible/`

## Snapshot
- Selectors: `tw-collapsible` (element), `tw-collapsible-group` (element), `[twCollapsibleTrigger]` (attribute, component selector), `[twCollapsibleIcon]` (attribute, directive)
- Public classes/directives: `CollapsibleComponent`, `CollapsibleGroupComponent`, `CollapsibleTriggerDirective`, `CollapsibleIconDirective`
- Inputs: 7 on `CollapsibleComponent` (`value`, `variant`, `color`, `size`, `disabled`, `keepAlive`, `open`); 2 on `CollapsibleGroupComponent` (`accordion`, `value`); 0 on the trigger/icon directives
- Outputs: 1 (`toggled` on `CollapsibleComponent`)
- Slots: 2 (`[twCollapsibleTrigger]` for the header + default for the body)
- CVA: no
- `tv()` config: yes, 4 slots (`root`, `trigger`, `icon`, `content`); slot-keyed `compoundVariants` for filled/bordered × color; `defaultVariants` present
- A11y CDK utilities used: `LiveAnnouncer` (announces "Section expanded/collapsed")

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `value` | `string` | `''` | yes | Used by group to track which panel is open |
| `variant` | `CollapsibleVariant` (`'default' \| 'bordered' \| 'ghost' \| 'filled'`) | `'default'` | yes | Visual container chrome |
| `color` | `TwColor` (shared) | `'neutral'` | yes | Only applies to `bordered`/`filled` variants |
| `size` | `TwSize` (shared) | `'md'` | yes | Drives trigger + content padding |
| `disabled` | `boolean` (`booleanAttribute`) | `false` | yes | Dims, blocks toggle |
| `keepAlive` | `boolean` (`booleanAttribute`) | `false` | yes | Retains content in DOM after first open |
| `open` | `boolean` (`model`) | `false` | yes | Two-way bindable expand state |
| **group** `accordion` | `boolean` (`booleanAttribute`) | `false` | yes | Single-open mode |
| **group** `value` | `string \| string[]` (`model`) | `''` | yes | Two-way bound open set |

### Findings
- 7 inputs on `CollapsibleComponent` — exceeds the 5–6 cap. Collapsible is not on the codified exception list (overlay / form / structural / data). The surface is genuinely larger than a button or card because the component combines visual chrome (`variant`/`color`/`size`) with behaviour (`disabled`/`keepAlive`/`open`) plus a group-id (`value`). Two reshape options exist:
  - (a) Drop `value` from the standalone component and require it only inside a group via `@Input({ required: !!group })`. Standalone collapsibles do not need a `value`. This drops the cap to 6.
  - (b) Group visual concerns into a `display = input<CollapsibleDisplay>({ variant, color, size })` config object — same shape PR8 plans for `<tw-table>`. Drops the cap to 4.
  - Either path keeps the public surface intuitive. The prompt's stated direction is content projection over inputs; option (b) preserves behaviour inputs at top level and follows the codified PR8 pattern.
- All JSDoc one-liners cover purpose + default — compliant.
- `disabled` and `keepAlive` default to `false` — compliant.
- `open` is a `model<boolean>` (correct — consumer can bind `[(open)]`).
- The group's `value` model carries the same union-type issue as the accordion's: `string` vs `string[]` silently changes meaning under `accordion=true/false`. Same dev-mode warning recommendation.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `toggled` | `boolean` (new open state) | past-tense action event | Co-exists with `(openChange)` from the `open` model — both fire on user toggle |

### Findings
- Naming follows the dual pattern documented in MEMORY (`feedback_output_naming_pattern.md`): past-tense `toggled` for the action, automatic `openChange` from the `open` model. Compliant — no gap.
- One implementation issue: `toggled` is emitted in the **standalone** path (`toggle()` line 301) but in the **group** path the emission happens inside `CollapsibleGroupComponent.toggleItem` (line 416). The accordion's `AccordionComponent.toggleItem` also emits to the child (line 160). The collapsible's own `toggled` therefore fires consistently — good — but the duplication of the emit site means a future refactor could miss one path.

## Customization surface
- ng-content slots: 2 (named `[twCollapsibleTrigger]`, default for body content)
- Structural directives: `[twCollapsibleTrigger]` (component selector on a `<button>`), `[twCollapsibleIcon]` (directive marker for custom chevron)
- Fallback content: the built-in chevron renders via `@if (!collapsible.customIcon())` (line 153–157) — appropriate use of `contentChild` + `@if` (NOT `ng-content` fallback) because the icon's rotation animation is tied to internal state.
- Class merging: `twMerge: true` (line 109)
- Findings:
  - The component query for the custom icon is `contentChild(CollapsibleIconDirective)` (line 252). Good — uses the modern signal-based query.
  - The trigger's icon classes (line 169–172) duplicate the rotation logic that lives on `CollapsibleIconDirective` (line 128–131). When a consumer projects a custom `[twCollapsibleIcon]` element, both directives compute the same `rotate-180` class — the directive on the consumer's element actually applies it, and the built-in `<svg>` is suppressed by `@if (!customIcon())`. Acceptable; the duplicate `computed()` is wasted work but not a bug.

## CSS / Styling
- tailwind-variants: yes; 4 slots (`root`, `trigger`, `icon`, `content`); 5 variant axes (`variant`, `size`, `color`, `disabled`, `inGroup`)
- twMerge: yes (line 109)
- Semantic tokens vs raw palette: all colour-specific styling uses `{role}-{shade}` tokens (lines 84–100); neutral structural styling uses `surface-muted`, `surface-sunken`, `fg`, `fg-muted`, `border` — compliant.
- Surface/fg/border tokens usage: correctly used for neutral surfaces (line 87) and the trigger's hover state (lines 41, 50). Compliant.
- Radius compliance: `rounded-lg` on root (line 31), `rounded-md` on ghost trigger (line 50) — compliant. The `inGroup: true` variant strips radius back to `rounded-none` so the outer accordion clips correctly.
- Spacing/gap compliance: inline padding scale `px-{2,3,4,5,6} py-{1,1.5,2,2.5,3}` (lines 57–61) matches the codified scale exactly; block padding scale `p-{2,3,4,6,8}` (lines 57–61) matches. `gap-3` on the trigger (line 32) — compliant.
- Typography compliance: trigger fonts follow the documented trigger scale — `text-xs` (xs), `text-sm` (sm/md), `text-base` (lg/xl). Compliant.
- Focus rings compliance: canonical `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on the trigger (line 33). Compliant.
- Dark mode handling: no explicit `dark:` overrides for `filled` variant `-50` backgrounds (lines 84–91). This is the documented project convention departure — MEMORY's "Dark mode override convention" notes that `dark:bg-{color}-900/X` should be present on solid-fill backgrounds. The filled variant currently relies on the consumer's theme remapping rather than carrying explicit `dark:` classes. Consistent with `alert` / `badge` filled variants in the library; flag for cross-cutting review if needed.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on trigger (line 33), `transition-transform duration-200` on chevron (line 34) — compliant; specific properties, reduced-motion respected.
- Shadows: none — appropriate.
- Icon sub-scale: chevron is `size-5` (line 34) — compliant glyph scale.
- Animations: `animate.enter="collapsible-enter"` / `animate.leave="collapsible-leave"` (line 213–214), keyframes defined in `theme/_base.css:65-78` with `prefers-reduced-motion` carve-out at line 298–299. Compliant — no `@angular/animations`.
- Findings:
  - The `default` variant applies `border-b border-border` on the root (line 40). When two `default` collapsibles are siblings outside of a group, the last child's `border-b` is visually doubled by an ancestor border. Inside the group the `inGroup: true` variant strips this back to `border-0` (line 78), so the issue only surfaces standalone. Low priority — minor visual edge.
  - The trigger uses `cursor-pointer` (line 33) — correct per the codified cursor table; disabled state uses `opacity-50 pointer-events-none` on the root (line 74). Compliant.
  - The `filled + neutral` compound (line 87) maps to `bg-surface-muted text-fg hover:bg-surface-sunken` — uses surface tokens correctly, distinct from the other colour variants which use `-50`/`-100`.

## Accessibility
- ARIA roles/attributes: trigger carries `role="button"`, `aria-expanded`, `aria-controls`, `aria-disabled`, `tabindex=0` (lines 140–146). Panel carries `role="region"`, `aria-labelledby` (lines 210–213). Compliant.
- Keyboard support: Enter / Space toggle (`CollapsibleTriggerDirective.onKeydown`, line 178). Arrow keys delegate to the group (line 187–188) — group implements ArrowDown / ArrowUp / Home / End (line 421–452).
- CDK a11y utilities: `LiveAnnouncer` (line 313). No `FocusKeyManager` — hand-rolled walk (same comment as accordion: shadow-DOM-unsafe, can be replaced).
- Labels/descriptions wiring: consumer-owned (the trigger's accessible name is its projected text content). The component template does not generate an extra `<label>`, which is correct.
- AXE risks: the trigger uses `role="button"` on a `<button>` element (line 141) — assigning `role="button"` to a native button is redundant but not a violation. AXE allows it. Minor: drop the explicit `role="button"` since the consumer's host element already provides the role.
- Findings:
  - The `tabindex=0` host binding (line 146) is unconditional. When `disabled() === true` the trigger should be removed from the tab sequence: bind `[attr.tabindex]="disabled() ? -1 : 0"`.
  - When a consumer mounts `[twCollapsibleTrigger]` on a non-button (e.g., a `<div>`), `role="button"` saves them — but the directive does not assert that the host is a button or fall back to keyboard-only activation. Acceptable; document the recommended host element in JSDoc.
  - Same comment as accordion: replace the hand-rolled key walk with `FocusKeyManager<CollapsibleTriggerDirective>` (the trigger already has a `focus()` method and `elementRef`).
  - The `Tab` key inside an open collapsible naturally moves focus into the projected content because `<div role="region">` is in the tab order via its descendants — correct behaviour.

## Tests
- Spec file: yes (`collapsible.spec.ts`, 528 lines)
- Coverage breakdown:
  - rendering: default state, open state, four variants
  - inputs/outputs: `toggled` emit, two-way `open` binding
  - interactions: click toggle, Enter, Space, disabled-block
  - accessibility: `aria-expanded`, `aria-controls` ↔ `id` link, `aria-labelledby`, `role="button"`, `aria-disabled`, `LiveAnnouncer` mock
  - content projection: custom icon
  - group / accordion mode: single-open enforcement, value sync, disabled-skip, ArrowDown/Up/Home/End
  - independent group mode: multiple opens, array value
  - keepAlive: DOM persistence, no-render-before-first-open, `data-open` attribute, class application
- Vitest issues: none.
- Findings:
  - Missing: nothing tests the `[size]` input drives padding classes. Add a quick DOM-class assertion for `xs` → `px-2 py-1` and `xl` → `px-6 py-3`.
  - Missing: `bordered + color` compound is not asserted (e.g., `bordered + info` should apply `border-info-300`).
  - Missing: focus-ring class assertion on the trigger.
  - Missing: with `disabled=true`, the trigger should not be in the tab sequence — currently the suite tests `aria-disabled` only.
  - Missing: `animate.enter` / `animate.leave` cannot be assertion-tested in jsdom, but a smoke test that the panel acquires `data-open="true"` / `data-open="false"` correctly is present (line 502–508) — good.

## Gaps & lacks
1. **Input count: 7 on `CollapsibleComponent`** — over the 5–6 cap. Collapsible isn't on the codified exception list. Reshape into a `display` config object or drop `value` from standalone use.
2. Keyboard navigation hand-rolled (same as accordion) — should use `FocusKeyManager`.
3. `tabindex` is unconditionally `0` even when disabled — disabled trigger remains tab-stoppable.
4. Group `value` model has the same union-type silent-mismatch issue as accordion.
5. The trigger duplicates icon rotation logic with `CollapsibleIconDirective` — wasted `computed()` but not a bug.
6. The unused `DestroyRef` import on `CollapsibleGroupComponent` (line 340) is dead code.
7. Tests miss: size → padding mapping, bordered+color compound, focus-ring classes, disabled tab-stop suppression.

## Concrete recommendations (deep-dive prompt body)

### Goal
Reshape the input surface to meet the cap, migrate the group key walk to CDK, tighten the tab-stop logic for disabled triggers, and close test gaps. Keep behaviour bit-for-bit compatible.

### Tasks
1. **Reshape `CollapsibleComponent` inputs into a `display` config object** — meets the 5–6 cap.
   - File(s): `projects/ngx-tw/collapsible/collapsible.ts:222-280` (input declarations + variant computation)
   - Why: 7 inputs exceeds the cap and collapsible is not on the codified exception list. PR8 for `<tw-table>` documents the canonical reshape: group visual axes into `display = input<TwCollapsibleDisplay>({})`, merge with defaults at consume time.
   - Change: introduce `TwCollapsibleDisplay = { variant?: CollapsibleVariant; color?: TwColor; size?: TwSize }` and `DISPLAY_DEFAULTS = { variant: 'default', color: 'neutral', size: 'md' }`. Add `readonly display = input<TwCollapsibleDisplay>({})` and `resolvedDisplay = computed(() => ({ ...DISPLAY_DEFAULTS, ...this.display() }))`. Replace `this.variant()` / `this.color()` / `this.size()` reads with `this.resolvedDisplay().variant` etc. Keep `disabled` / `keepAlive` / `open` / `value` flat. Mark the old three inputs `@deprecated` for one minor; remove on the next major. Final input count: 4 flat + `display`.
   - Acceptance: existing specs continue to pass after they update from `[variant]="x"` to `[display]="{ variant: x }"`; a new "display config" describe-block exercises partial-merge behaviour.

2. **Migrate group keyboard nav to `FocusKeyManager`** — same shape as the accordion task.
   - File(s): `projects/ngx-tw/collapsible/collapsible.ts:160-195` (trigger) + `:420-475` (group `onTriggerKeydown` + helpers)
   - Why: hand-rolled `document.activeElement` walk is shadow-DOM-unsafe and reimplements CDK behaviour.
   - Change: implement `FocusableOption` on `CollapsibleTriggerDirective`; instantiate `FocusKeyManager` inside `CollapsibleGroupComponent` constructor; refresh on `triggers()` change.
   - Acceptance: existing keyboard specs pass; one new typeahead spec passes.

3. **Make `tabindex` reflect `disabled`** — disabled triggers leave the tab sequence.
   - File(s): `projects/ngx-tw/collapsible/collapsible.ts:140-149` (host metadata)
   - Why: a disabled trigger that remains focusable confuses keyboard users; the current code only sets `aria-disabled`. WCAG 2.1 SC 2.1.1 (Keyboard) expects unreachable controls.
   - Change: replace `'[attr.tabindex]': '0'` with `'[attr.tabindex]': 'collapsible.disabled() ? -1 : 0'`. Drop the redundant `role="button"` if the host element is a `<button>` — Angular's selector binds the directive to `[twCollapsibleTrigger]` which usually sits on a `<button>`; document this in JSDoc.
   - Acceptance: new spec sets `disabled=true` and asserts `trigger.tabIndex === -1`; existing `aria-disabled` spec continues to pass.

4. **Add dev-mode warning for group `value` shape vs `accordion`** — closes union-type silent mismatch.
   - File(s): `projects/ngx-tw/collapsible/collapsible.ts:348-369` (group sync effect)
   - Why: mirrors the accordion-doc recommendation; the bug class is identical.
   - Change: inside the effect, if `accordion() && Array.isArray(val)` or `!accordion() && typeof val === 'string' && val !== ''`, `isDevMode() && console.warn(...)`.
   - Acceptance: spec asserts `console.warn` spy is called with the right message.

5. **Remove dead `DestroyRef` import** — housekeeping.
   - File(s): `projects/ngx-tw/collapsible/collapsible.ts:9` + line 340
   - Why: `private readonly destroyRef = inject(DestroyRef);` on `CollapsibleGroupComponent` is never used.
   - Change: drop the import and the field.
   - Acceptance: lint passes; no behaviour change.

6. **Close test gaps** — size → padding, bordered+color, focus-ring, disabled tab-stop.
   - File(s): `projects/ngx-tw/collapsible/collapsible.spec.ts` (extend existing `describe` blocks)
   - Why: CLAUDE.md test rules require every input value rendered + observable DOM consequences.
   - Change: (a) loop over `['xs','sm','md','lg','xl']` and assert padding class on the trigger; (b) loop over `TwColor` and assert `border-${c}-300` on the root when `bordered + color` is set; (c) assert focus-ring class on the trigger; (d) assert `tabindex === -1` when `disabled=true`.
   - Acceptance: ~25 lines added; all new tests pass.

### Out of scope
- Replacing the `<svg>` chevron with a `<tw-icon>` — keeps zero dependency on a separate component, consistent with the library's icon strategy elsewhere.
- Adding a `lazy` / `defer` input — `keepAlive` covers the inverse case and the `@if` already handles deferred render.
- Auto-generating accordion-style group wiring outside of `CollapsibleGroupComponent` / `AccordionComponent` — both already exist.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- collapsible`
- Visual check: `http://localhost:4600/collapsible`
- A11y: `npm run e2e:a11y` (collapsible route)

## Priority
**P1** — Component is correct and well-tested, but the 7-input surface exceeds the codified cap and the `tabindex` gap is a real WCAG concern. The reshape + tab-stop fixes are non-cosmetic; the CDK migration and warning are quality polish.
