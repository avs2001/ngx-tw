# Tabs — Production-Grade Review

**Entry point:** `ngx-tw/tabs`
**Files:** `projects/ngx-tw/tabs/`

## Snapshot
- Selectors: `tw-tabs` (element), `tw-tab` (element), `ng-template[twTabTrigger]`, `ng-template[twTabContent]`, internal `[twTabTriggerElement]`
- Public classes/directives: `TabsComponent`, `TabComponent`, `TabTriggerDirective`, `TabContentDirective` (plus exported `TabsVariant` type)
- Inputs: 5 on `TabsComponent` (`variant`, `color`, `size`, `orientation`, `fitted`); 5 on `TabComponent` (`value`, `label`, `disabled`, `closable`, `lazy`); 1 model (`value`)
- Outputs: 1 (`closed`)
- Slots: 2 templated slots per tab (`twTabTrigger`, `twTabContent`) + implicit `<ng-content>` body
- `tv()` config: yes, slots = `root`, `tablist`, `tablistInner`, `trigger`, `panel`, `scrollButton`, `closeButton`
- A11y CDK utilities used: `LiveAnnouncer` (for tab change announcement). **No `FocusKeyManager`** — keyboard nav rolled by hand.

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `variant` | `TabsVariant` | `'underline'` | yes | Class name `TabsVariant` is fine; literal union. |
| `color` | `TwColor` | `'primary'` | yes | OK |
| `size` | `TwSize` | `'md'` | yes | OK |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | yes | Inline literal — consider extracting to `TwOrientation` in core. |
| `fitted` | `boolean` | `false` | yes | OK |
| `value` (model) | `string` | `''` (empty) | yes | Default of empty string is a sentinel — see Findings. |
| `TabComponent.value` | `string` | required | yes | Required input — good. |
| `TabComponent.label` | `string` | `''` | yes | Ignored when `*twTabTrigger` is projected. |
| `TabComponent.disabled` | `boolean` | `false` | yes | OK |
| `TabComponent.closable` | `boolean` | `false` | yes | OK |
| `TabComponent.lazy` | `boolean` | `false` | yes | "Render only after first activation" — semantics fine but tab stays mounted afterwards (no destroy). |

### Findings
- `value` is `model<string>('')` rather than `model<string | null>(null)` or `model<string | undefined>(undefined)`. Empty string as "no selection" is fragile: a real tab with `value=""` is technically legal and would collide. Use `string | null` / `null` default.
- `orientation: 'horizontal' | 'vertical'` is duplicated across tabs/tab-nav/segmented-control — promote `TwOrientation` to `ngx-tw/core` (and possibly a shared `TwOrientationKey` re-export).
- No `defaultTab` input — initial selection happens via `ngAfterViewInit` finding the first enabled tab. With `model<string>('')` users cannot easily "uncontrol" the active tab while still setting an initial one. Add `defaultTab` (or accept `value` as `model<string | null>` with a `linkedSignal()` that falls back to the first enabled child). See library prompt convention.
- No `activation` input (auto vs manual). The current implementation is "auto activation": Arrow-key navigation immediately selects + announces. WAI-ARIA pattern allows manual activation (move focus only; Enter/Space commits). Add `activation: input<'automatic' | 'manual'>('automatic')`.
- `TabsComponent` exposes 5 inputs which is at the cap — orientation could fold into the variant or move to an "advanced" config object if it grows further, but currently fits.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `closed` | `string` (tab value) | past-tense (action) | OK. Consider richer payload `{ value, index }`. |

### Findings
- No `change` output (only `value` model). For consumers who don't want two-way binding, an explicit `valueChange` is auto-emitted by the model. Good.
- No `panelOpened` / `panelClosed` lifecycle outputs — usually not needed but worth flagging if `lazy` destroys are added.

## Customization surface
- ng-content slots: implicit body of `<tw-tab>` (used as the panel content unless `*twTabContent` is given); `*twTabTrigger` for custom header; `*twTabContent` for explicit panel template.
- Structural directives: `twTabTrigger` (TemplateRef), `twTabContent` (TemplateRef).
- Fallback content: trigger falls back to `tab.label()` text; content falls back to the projected implicit `<ng-content>`.
- Class merging: `twMerge: true` in tv() config (tabs.ts:158). Per-trigger combination via `twMerge(base, extra)` in `getTriggerClasses()` (tabs.ts:407).
- Findings:
  - **No way to inject classes per slot** (e.g. `triggerClass`, `panelClass`). Consumers must rely on `class="…"` on `<tw-tabs>` which then resolves only against `root`. Add per-slot inputs (or accept a `classes: Partial<Record<Slot,string>>` config object) — Material's `mat-tab-group` exposes header/body class hooks.
  - The trigger template context (`{ active, disabled, value }`) is a one-off object literal on tabs.html:46 — type it and export the interface (e.g. `TwTabTriggerContext`).

## CSS / Styling
- tailwind-variants: yes, slots = `root`, `tablist`, `tablistInner`, `trigger`, `panel`, `scrollButton`, `closeButton`
- twMerge: yes (tabs.ts:158)
- Semantic tokens vs raw palette: ALL active classes are written statically per color (tabs.ts:163–216). Uses semantic `{color}-500/600/700` correctly. `text-fg`, `text-fg-muted`, `border-border-strong`, `bg-surface*` are all proper surface/fg tokens.
- Surface/fg/border tokens usage: correct.
- Radius compliance: `rounded-md`, `rounded-xl` (pill outer wrapper) — compliant.
- Spacing/gap compliance: trigger padding follows canonical scale `px-2 py-1 / px-3 py-1.5 / px-4 py-2 / px-5 py-2.5 / px-6 py-3` (tabs.ts:69–88) — compliant. Inner gap `gap-1.5` for trigger flex — compliant.
- Typography compliance: xs→`text-xs`, sm/md→`text-sm`, lg/xl→`text-base` — compliant. Trigger weight `font-medium` — compliant.
- Focus rings compliance: tablist trigger uses `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (tabs.ts:39) — canonical. Close button uses same pattern (tabs.ts:44) — canonical. Tabs do NOT use the menu-item carve-out, which is correct.
- Dark mode handling: NONE of the per-color active class maps include `dark:` overrides (e.g. `text-primary-600` has no `dark:text-primary-300`). This breaks the project's "explicit dark: overrides on color variants is convention" rule. Compare with `segmented-control.ts:62-69` which does ship `dark:` shades.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on trigger and scrollButton — compliant. Close button uses same — compliant.
- Shadows: pill active uses `shadow-sm` (tabs.ts:208–215) — compliant.
- Icon sub-scale: glyph `size-4` inside the scroll buttons (tabs.html:18) and close button (`size-4` rounded-md, tabs.ts:44). Scroll button itself is a "square interactive target" — sizes `size-5/5/6/7/8` per scale (tabs.ts:71–87). The xs/sm scroll buttons use `size-5` which is technically a glyph size on the square-interactive table; closest canonical pair would be `size-6 / size-7 / size-8 / size-9`. Reconcile.
- Findings:
  - **Missing dark-mode overrides** on every active-class map. Apply `dark:text-{color}-300` / `dark:border-{color}-400` etc. to underline/enclosed/pill ACTIVE maps (tabs.ts:163–216).
  - **Scroll button square-target scale** mismatched: xs/sm use `size-5` which conflicts with the canonical square-interactive scale (`xs→6, sm→7, md→8, lg→9`). Either reclassify scroll buttons as glyph icons (and shrink to `size-5` for visual buttons) or up-size to the square scale.
  - The `transition-colors` on the trigger does not animate the moving underline/border-bottom — visually the active indicator jumps. Material animates the underline ink-bar; consider a relative ink-bar (absolute-positioned `<span>`) animated with `transform`, or accept the jump but document. P2.
  - The `compoundVariants` block (tabs.ts:118–147) handles vertical variants for `underline`/`enclosed`/`pill`. The pill-vertical case only overrides the panel padding; the active pill in vertical layout still uses horizontal `border-b-2` styling because `PILL_ACTIVE` has no border rules. Verify with manual demo.

## Accessibility
- ARIA roles/attributes: `role="tablist"` on inner wrapper (tabs.html:4), `role="tab"` on each trigger button (tabs.html:29), `role="tabpanel"` on each panel (tabs.html:91). `aria-orientation` reflects orientation. `aria-selected`, `aria-controls`, `aria-disabled` correctly bound. `aria-labelledby` from panel → tab id (tabs.html:93). 
- Keyboard support: Arrow Right/Left for horizontal, Arrow Up/Down for vertical, Home/End. Handled in `onKeydown()` (tabs.ts:486). Disabled tabs skipped.
- CDK a11y utilities: `LiveAnnouncer` injected and called on `selectTab` (tabs.ts:452). No `FocusKeyManager` or `FocusMonitor`. The roving tabindex is implemented manually via `TabTriggerElementDirective` (tabs.ts:298–314).
- Focus management on tab change: `triggers[targetIndex].focus()` is called from `onKeydown` (tabs.ts:522). Panel does NOT pull focus on click — only the trigger.
- AXE risks: none obvious. Trigger button is a `<button type="button">` so screen-readers will announce role. Close button is nested INSIDE the tab button (tabs.html:54) — `<button>` inside `<button>` is invalid HTML. Many ATs will still announce both, but it is a structural defect.
- Findings:
  - **`<button>` inside `<button>` for closable tabs.** The close icon is wrapped in `<button>` nested inside the main tab `<button>` (tabs.html:54 nested in tabs.html:27). Browsers handle this inconsistently. Refactor: make the close affordance a `<span role="button" tabindex="-1">` with click+keydown handlers, OR move the close button to a sibling and use CSS grid. P0 (HTML validity + a11y).
  - **Manual activation mode missing.** Per WAI-ARIA, manual activation is the recommended pattern when panel mounting is expensive. Add `activation` input + decouple arrow-key focus movement from selection.
  - **Live announcement template not configurable.** `${tab.label() || val} tab, ${idx+1} of ${tabsArr.length}` is hardcoded (tabs.ts:452). Cannot be translated. Add an `announcement` label or use a configurable `labels` input à la paginator.
  - **`tabindex="0"` on the panel** is correct so the panel itself can be focused; works well. Verify behavior with `prefers-reduced-motion` for any tab-switch transitions.
  - The `triggerElements()` view-children query depends on `viewChildren(TabTriggerElementDirective)` — relies on the directive being instantiated on each trigger button (tabs.html:30). This is fragile but currently works because the directive applies inside the `@for`.
  - Consider using CDK `FocusKeyManager` directly. The current implementation duplicates focus-cycling logic that `FocusKeyManager` provides.

## Tests
- Spec file: yes — tabs.spec.ts (607 lines).
- Coverage breakdown:
  - Rendering: default render covered (tabs.spec.ts:130). All 3 variants + sizes + colors not covered as IO assertions, only "renders without errors".
  - Inputs/outputs: `value` two-way binding covered. `closed` output covered.
  - Keyboard: ArrowRight/Left/Home/End covered.
  - A11y: roles + aria-selected/controls/labelledby + tabindex roving — all covered.
  - Closable / lazy / custom-trigger projection — covered.
- Vitest issues: none — uses `vi`, `setInput`, `whenStable()`. No `fakeAsync`/`tick`.
- Findings:
  - **No test for vertical-orientation keyboard nav** (Up/Down arrows). Add explicit Up/Down spec under `orientation`.
  - **No test asserting the `aria-orientation` attribute round-trips to vertical and Up/Down arrows fire.**
  - **No AXE check** test. Add an `axe-core` assertion (project uses Vitest browser-mode or Playwright per a11y triage).
  - **No tests for `LiveAnnouncer.announce()`** — spy on it like paginator.spec.ts:670.
  - Spec only checks "renders without errors" for variants — promote a few to query specific classes (e.g. underline variant adds `border-b-2`).
  - `fitted` only renders without errors — assert `class.includes('flex-1 justify-center')`.

## Gaps & lacks
1. **`<button>` inside `<button>`** structural defect on closable tabs (P0).
2. Missing **dark-mode overrides** on per-color active class maps (P0).
3. Missing **manual activation** support (P1).
4. **`value` model defaults to empty string** sentinel — should be `string | null` / `null` (P1).
5. **Hardcoded live-announcement** string is not internationalizable (P1).
6. No `defaultTab` input or **uncontrolled** mode (P2).
7. **Per-slot class hooks** missing (`triggerClass`, `panelClass`, `tablistClass`) (P2).
8. Scroll-button **icon sub-scale** mismatched at xs/sm sizes (P2).
9. Tab-switch underline does **not animate** (P2).
10. No **AXE test** in the spec (P1).
11. Could **reuse `FocusKeyManager`** rather than rolling keyboard cycling by hand (P2).
12. Missing **vertical-orientation Up/Down keyboard tests** (P1).
13. The `orientation` literal union is **duplicated** across tabs/tab-nav/segmented-control — promote to `core/TwOrientation` (P2).
14. `triggerTemplate` ng-template **context type** is implicit — export as `TwTabTriggerContext` (P2).

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Bring `tabs` to production-grade parity with Angular Material's `mat-tab-group`: structurally valid HTML for closable tabs, full dark-mode support across active states, WAI-ARIA-conformant manual activation, internationalized live announcement, and richer customization hooks.

### Tasks
1. **Fix `<button>`-in-`<button>` invalid HTML on closable tabs** — top priority.
   - File(s): `projects/ngx-tw/tabs/tabs.html:27-66`
   - Why: HTML disallows interactive content (`button`, `a`) nested inside another button. Behaviour is undefined across browsers and ATs. AXE flags this.
   - Change: replace the inner close `<button>` with a `<span role="button" aria-label="…" tabindex="-1" (click)="closeTab(...)" (keydown.enter)="closeTab(...)" (keydown.space)="closeTab(...)">`. Stop propagation on the click. Update `closeButton` slot classes to drop button-only utilities (`button` resets don't apply to `span`). Add `inline-flex items-center justify-center rounded-md size-4 cursor-pointer hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.
   - Acceptance: structural HTML is valid; close still works on click and Enter/Space; AXE no longer flags nested-interactive; existing `closed` output spec passes.

2. **Add dark-mode overrides to per-color active maps** — visual parity with the project convention.
   - File(s): `projects/ngx-tw/tabs/tabs.ts:163-216`
   - Why: Components must include explicit `dark:` overrides for color variants. Tabs currently use only light shades (`text-primary-600`, `border-primary-500`).
   - Change: extend each entry with a `dark:` companion. Example for underline-horizontal primary: `'border-b-2 border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-300'`. Apply to UNDERLINE_ACTIVE_HORIZONTAL, UNDERLINE_ACTIVE_VERTICAL, ENCLOSED_ACTIVE_HORIZONTAL, ENCLOSED_ACTIVE_VERTICAL, PILL_ACTIVE. Use the project pattern: `dark:bg-{color}-900/{X}` only where backgrounds exist (enclosed/pill).
   - Acceptance: switching the demo to `class="dark"` shows readable text on every variant × color combination; existing specs still pass.

3. **Add `activation` input for manual activation mode (WAI-ARIA pattern)**.
   - File(s): `projects/ngx-tw/tabs/tabs.ts:330-525`
   - Why: WAI-ARIA recommends manual activation when panel mounting is non-trivial (e.g. expensive lazy panels). Today arrows always select.
   - Change: add `activation = input<'automatic' | 'manual'>('automatic')`. In `onKeydown`, when activation === 'manual', move focus to the target trigger but do NOT call `selectTab`. Bind `Enter`/`Space` on the trigger button to commit. Document in JSDoc and add a demo example.
   - Acceptance: in manual mode, ArrowRight moves focus to the next trigger without changing the active panel; Enter commits.

4. **Replace `value: model<string>('')` with `value: model<string | null>(null)`**.
   - File(s): `projects/ngx-tw/tabs/tabs.ts:346,367,592`
   - Why: empty string is a fragile sentinel; nullable model is the canonical "no selection".
   - Change: switch the default. Update `activeValue` initialization (`linkedSignal(() => this.value())` already passes through). Update `initializeActiveTab` to check `=== null`. Adjust spec to allow `null`.
   - Acceptance: tabs work when no `value` is provided (auto-select first enabled tab); `value()` returns `null` only before any tab exists.

5. **Internationalize the live announcement**.
   - File(s): `projects/ngx-tw/tabs/tabs.ts:449-454`
   - Why: hardcoded English string blocks i18n.
   - Change: add `labels = input<Partial<{ tabAnnouncement: string }>>({})` (or follow paginator's pattern with full `TwTabsLabels` interface). Template variables: `{label}`, `{index}`, `{total}`. Resolve via `formatLabel()` (lift the helper out of paginator into `ngx-tw/core`).
   - Acceptance: passing `labels={{ tabAnnouncement: 'Pestaña {label}, {index} de {total}' }}` produces the localized string; default English announcement still works.

6. **Add `defaultTab` input** for uncontrolled usage.
   - File(s): `projects/ngx-tw/tabs/tabs.ts:346,576-609`
   - Why: enables `<tw-tabs defaultTab="settings">` without two-way binding.
   - Change: add `defaultTab = input<string | null>(null)`. Use it in `initializeActiveTab` as the preferred fallback before "first enabled tab". Keep `value` model for controlled usage.
   - Acceptance: `<tw-tabs defaultTab="b">` opens with `b` selected; subsequent clicks update internal state without parent involvement; consumer can switch to two-way binding by adding `[(value)]`.

7. **Per-slot class hooks**.
   - File(s): `projects/ngx-tw/tabs/tabs.ts:330-398`
   - Why: consumers need to inject classes onto the tablist/panel/trigger without subclassing.
   - Change: add `tablistClass`, `triggerClass`, `panelClass` as `input<string>('')`. Merge each into the corresponding `tv()` slot via `twMerge(base, extra)`.
   - Acceptance: `<tw-tabs panelClass="bg-white shadow-lg">` applies the classes to every panel; `twMerge` resolves conflicts.

8. **Fix the scroll-button square-target sub-scale**.
   - File(s): `projects/ngx-tw/tabs/tabs.ts:69-87`
   - Why: `size-5` at xs/sm sits between the glyph and square-interactive scales. Project convention is `xs→6, sm→7, md→8, lg→9` for square interactive targets.
   - Change: rewrite scrollButton sizes to `size-6 / size-7 / size-8 / size-9 / size-10` (matching the trigger height step). The inner SVG stays `size-4`.
   - Acceptance: scroll buttons match the height of the corresponding triggers; demo looks balanced.

9. **Use CDK `FocusKeyManager` instead of hand-rolled cycling**.
   - File(s): `projects/ngx-tw/tabs/tabs.ts:486-535`
   - Why: reduce maintenance surface; CDK handles RTL, skip-disabled, wrap, type-ahead.
   - Change: implement `FocusableOption` on `TabTriggerElementDirective`; instantiate `FocusKeyManager` with `withWrap().withHorizontalOrientation('ltr')` (auto-switch by orientation). Subscribe to `manager.change` for tracking the focused index. Keep selection coupling for "automatic" mode; decouple for "manual".
   - Acceptance: keyboard nav behaviour is identical (or improved); spec still passes; manual-activation flag still works.

10. **Add vertical-orientation keyboard tests + AXE check**.
    - File(s): `projects/ngx-tw/tabs/tabs.spec.ts`
    - Why: vertical Up/Down code path is currently uncovered. Spec should also assert AXE compliance.
    - Change: add `describe('vertical keyboard navigation', …)` with ArrowUp/Down/Home/End assertions. Add `import { axe } from 'jest-axe'` (or the project's a11y harness) and assert `expect(await axe(fixture.nativeElement)).toHaveNoViolations()`.
    - Acceptance: all new tests pass; AXE returns no violations on the default render.

### Out of scope
- Routing integration (use `tab-nav` instead).
- Drag-to-reorder tabs.
- Tab overflow menu (the current scroll buttons are sufficient).
- Animated underline ink-bar (parked at P2; can be a follow-up).

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Visual check: `http://localhost:4600/tabs`
- A11y: `npm run e2e:a11y` or AXE in spec

## Priority
**P0** — The nested-button HTML defect is a structural a11y failure; dark-mode parity is part of the project's stated quality bar. Both must land before the component is "production-grade". Manual activation and i18n live-announcement are close behind at P1.
