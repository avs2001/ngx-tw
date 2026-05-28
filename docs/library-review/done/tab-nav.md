# Tab-Nav — Production-Grade Review

**Entry point:** `ngx-tw/tab-nav`
**Files:** `projects/ngx-tw/tab-nav/`

## Snapshot
- Selectors: `nav[twTabNav]` (host component), `a[twTabLink]` (directive on anchors), `tw-tab-nav-panel` (element)
- Public classes/directives: `TabNavComponent`, `TabLinkDirective`, `TabNavPanel` (plus `TabNavVariant` type)
- Inputs: 5 on `TabNavComponent` (`variant`, `color`, `size`, `fitted`, `tabPanel`); 3 on `TabLinkDirective` (`active`, `disabled`, `linkId`); 1 on `TabNavPanel` (`id`)
- Outputs: 0 (state is owned by the consumer / router)
- Slots: implicit `<ng-content>` body for both nav and panel
- `tv()` config: yes, slots = `nav`, `list`, `link`
- A11y CDK utilities used: none

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `TabNavComponent.variant` | `TabNavVariant` | `'underline'` | yes | OK |
| `TabNavComponent.color` | `TwColor` | `'primary'` | yes | OK |
| `TabNavComponent.size` | `TwSize` | `'md'` | yes | OK |
| `TabNavComponent.fitted` | `boolean` | `false` | yes | OK |
| `TabNavComponent.tabPanel` | `TabNavPanel \| undefined` | `undefined` | yes | When set, switches the host from "nav landmark + aria-current" to "ARIA tablist + tabpanel" pattern. Elegant. |
| `TabLinkDirective.active` | `boolean` | `false` | yes | Consumer binds from `routerLinkActive`. |
| `TabLinkDirective.disabled` | `boolean` | `false` | yes | OK |
| `TabLinkDirective.linkId` | `string` | auto-`tw-tab-link-N` | yes | OK |
| `TabNavPanel.id` | `string` | auto-`tw-tab-nav-panel-N` | yes | OK |

### Findings
- All inputs have JSDoc, types are correct.
- `tabPanel` input as **the** mode switch is a clean API. Consumers pick the pattern by passing a panel reference (template ref `panel`). Document this trade-off prominently in the docs page.
- No `orientation` input. Tab-nav is horizontal-only. If consumers want vertical they fall back to `tw-tabs`. Reasonable but should be documented.
- No `routerLink` integration. The directive is intentionally router-agnostic; the consumer wires `routerLinkActive` themselves. This is correct for a library — but the demo page must show the canonical `routerLinkActive="…"` + `[active]="rla.isActive"` recipe.
- TabNavPanel does NOT register itself with TabNavComponent automatically. Consumer must wire the reference: `<nav twTabNav [tabPanel]="panel()">`. A `contentChild(TabNavPanel)` would simplify the API.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| (none) | — | — | State is owned by the router or consumer; `active` is a one-way input. |

### Findings
- Zero outputs is fine for a routing-driven control. If a "tabPanelChanged" output is desired later, it can be added without breaking the API.

## Customization surface
- ng-content slots: implicit content on `<nav twTabNav>` and `<tw-tab-nav-panel>`.
- Structural directives: none for the body; `TabLinkDirective` is applied imperatively on `<a>`.
- Fallback content: N/A.
- Class merging: `tv({…}, { twMerge: true })` (tab-nav.ts:78). Combined classes via `twMerge(base, state, disabled)` in `TabLinkDirective.classes` (tab-nav.ts:358).
- Findings:
  - **No per-slot class hooks** (e.g. `navClass`, `linkClass`). Add `linkClass: input<string>('')` etc., or accept a `classes` config object.
  - The shared TV config is a verbatim copy of the tabs TV config — `variant.underline`, `variant.enclosed`, `variant.pill` are duplicated literally. Lift the shared trigger/link styling into a shared `nav-trigger.ts` helper inside `ngx-tw/core` so the same variants stay in lock-step.

## CSS / Styling
- tailwind-variants: yes, slots `nav`, `list`, `link`
- twMerge: yes (tab-nav.ts:78)
- Semantic tokens vs raw palette: ALL active classes are written statically per color (tab-nav.ts:83-114). Uses `{color}-500/600/700` and `text-fg` / `border-border` / `bg-surface-muted` correctly.
- Surface/fg/border tokens usage: correct.
- Radius compliance: `rounded-md`, `rounded-xl` (pill outer) — compliant.
- Spacing/gap compliance: inline padding follows canonical scale (tab-nav.ts:50-54). Pill outer `gap-1`, link inner `gap-1.5` — compliant.
- Typography compliance: xs→`text-xs`, sm/md→`text-sm`, lg/xl→`text-base` — compliant. `font-medium` on link — compliant.
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (tab-nav.ts:28) — canonical. Links are anchors which get a default browser focus ring; this overrides it correctly. Add `outline-none` on baseline to remove the default visible ring when not focus-visible? Test in browsers.
- Dark mode handling: NONE of the per-color active maps include `dark:` overrides — SAME issue as tabs.ts. The tabs PR0 dark-mode work must include tab-nav in the same pass.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on link — compliant.
- Shadows: pill active uses `shadow-sm` — compliant.
- Icon sub-scale: no icons rendered inline by the directive itself; consumers project icons in their anchor content.
- Findings:
  - **Missing dark-mode overrides** on every active-class map (tab-nav.ts:83-114). Same fix as tabs PR0/2.
  - The TV config duplication with `tabs.ts` is a maintenance liability — both files have to be edited in lockstep to keep variants visually identical. P2 refactor: share the variant config.
  - `no-underline` on the link (tab-nav.ts:28) is correct since anchors default to underlined.
  - Pill variant on nav lacks the `relative` qualifier the tabs has — verify pill renders correctly when active.

## Accessibility
- ARIA roles/attributes:
  - When `tabPanel` is unset (default): root is `<nav>` (landmark). Active link gets `aria-current="page"`. No `aria-selected`, no `role=tab`. Correct for the navigation pattern.
  - When `tabPanel` is set: root gets `role="tablist"` + `aria-orientation="horizontal"`. Links get `role="tab"` + `aria-selected="true|false"` + `aria-controls="panel-id"`. Panel gets `role="tabpanel"` + `aria-labelledby="active-link-id"` (synced via `effect` in `TabNavComponent` constructor, tab-nav.ts:222-229).
- Keyboard support: ArrowLeft/Right, Home, End — only when `tabPanel` is set (tab-nav.ts:232-270). Manual activation pattern: ArrowKey moves focus, but does NOT click the link. The consumer (or router) decides when to commit.
- CDK a11y utilities: none. `FocusKeyManager` would simplify the same hand-rolled cycling as in tabs.
- Focus management on tab change: roving tabindex via `tabIndex()` computed signal — active link gets `tabindex=0`, others `tabindex=-1`, disabled `tabindex=-1` (tab-nav.ts:343-347).
- AXE risks:
  - Anchor without `href` is still focusable here because the consumer always passes `href`. If a consumer forgets the href, AXE may complain ("Anchors must have a discernible name"). Add a dev-mode warning when no href is present.
  - `aria-orientation` is only set in the tabs pattern. The default `<nav>` does NOT carry an aria-orientation — correct.
- Findings:
  - **No LiveAnnouncer integration** for tab change in the tabs pattern. Tabs.ts announces; tab-nav.ts does not. Add a `LiveAnnouncer` announcement when `tabPanel` is set and the active link changes (use an `effect` that watches `links().find(l => l.active())`).
  - **Manual activation default** is the correct WAI-ARIA pattern for tabs that swap routes — moving focus across links would otherwise trigger navigation. Confirm this is intentional and documented.
  - **No Enter/Space handler on the link** — relies on the anchor's default browser behaviour. That handles Enter on `<a href>` correctly; Space generally does not navigate on anchors. Add an explicit Space handler to navigate, OR document that only Enter activates.
  - **TabNavPanel could expose `aria-busy` / `aria-live`** for route loading, but that's a future concern.
  - The `aria-orientation` is hardcoded to `'horizontal'` (tab-nav.ts:211). If a vertical mode is added later, this becomes dynamic.

## Tests
- Spec file: yes — tab-nav.spec.ts (555 lines).
- Coverage breakdown:
  - Rendering: basic render + role + content covered.
  - Navigation pattern: `aria-current` covered.
  - Tabs pattern: `role=tablist`, `role=tab`, `aria-selected`, `aria-controls`, `aria-labelledby`, `tabindex` roving — all covered.
  - Disabled: `aria-disabled`, `tabindex=-1`, click/Enter preventDefault — covered.
  - Variants, sizes, colors, fitted — covered (renders without errors + one class assertion for fitted).
  - Focus ring class presence — covered (tab-nav.spec.ts:432-437).
  - Keyboard nav in tabs pattern: ArrowLeft/Right/Home/End + skip-disabled — covered.
  - TabNavPanel: role, tabindex, content projection — covered.
- Vitest issues: none. No `fakeAsync`/`tick`.
- Findings:
  - **No router integration test** with `RouterTestingModule` + `routerLinkActive`. Add at least one end-to-end smoke test showing the directive cooperates with `routerLinkActive` (or document the recipe explicitly).
  - **No AXE check** test.
  - **No test for Space-key navigation** (currently relies on anchor default).
  - **No test for LiveAnnouncer** because it's not wired (see Findings above).

## Gaps & lacks
1. Missing **dark-mode overrides** on per-color active maps (P0, same fix as tabs).
2. Missing **LiveAnnouncer** integration for tab changes in the tabs pattern (P1).
3. **TV config duplication** with `tabs.ts` — share a single variant table (P2 refactor).
4. **No per-slot class hooks** (`linkClass`, `navClass`) (P2).
5. **No router-integration spec** showing `routerLinkActive` coupling (P1).
6. **Space-key activation** ambiguity (P2).
7. No **AXE check** in spec (P1).
8. No **`tabPanel` auto-discovery** via `contentChild(TabNavPanel)` (P2 ergonomic).
9. `TabNavPanel` is set up so the panel-aria-labelledby effect runs every render — fine, but verify no leak.
10. **Demo page** should explicitly show the canonical `routerLinkActive` recipe.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Bring `tab-nav` to production-grade parity with Material's `mat-tab-nav-bar`: full dark-mode parity with tabs, live-announce route changes in the ARIA tabs pattern, share variant config with tabs, and provide a documented router-integration recipe.

### Tasks
1. **Add dark-mode overrides to all per-color active maps**.
   - File(s): `projects/ngx-tw/tab-nav/tab-nav.ts:83-114`
   - Why: matches the same gap as `tabs`. Project convention is explicit `dark:` overrides on color variants.
   - Change: extend each entry with a `dark:` companion (e.g. `'border-b-2 border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-300'`). Apply to UNDERLINE_ACTIVE, ENCLOSED_ACTIVE, PILL_ACTIVE.
   - Acceptance: dark mode renders the active link in readable contrast for every variant × color combination.

2. **Add LiveAnnouncer integration in the tabs pattern**.
   - File(s): `projects/ngx-tw/tab-nav/tab-nav.ts:222-229`
   - Why: parity with `tabs`. Screen-reader users should hear the new tab when focus moves and a route resolves.
   - Change: inject `LiveAnnouncer`. In the existing `effect` that syncs the panel `aria-labelledby`, also call `liveAnnouncer.announce(...)` when the active link changes (skip the first run). Gate on `tabPanel()` being set. Make the announcement template configurable via a new `labels` input (`{ activeTabAnnouncement: string }`).
   - Acceptance: a manual screen-reader run announces the new active tab when route changes; the announcement is suppressed in nav-landmark mode.

3. **Share the tv() config with `tabs`**.
   - File(s): `projects/ngx-tw/tab-nav/tab-nav.ts:22-79`, `projects/ngx-tw/tabs/tabs.ts:33-159`, new `projects/ngx-tw/core/tab-variants.ts`
   - Why: identical visual variants are defined twice. Drift between the two files is a known risk.
   - Change: extract the inactive/active class tables and the tv() config into `ngx-tw/core` as `tabVariants`, `getActiveLinkClasses`, `INACTIVE_CLASSES`. Re-export the shared parts from both `tabs.ts` and `tab-nav.ts`. Keep component-specific slot names where they differ (`trigger` vs `link`).
   - Acceptance: a single source-of-truth file controls all variant styling; existing specs pass; ng-package builds both entry points without circular imports.

4. **Auto-discover the panel via `contentChild`** (ergonomic).
   - File(s): `projects/ngx-tw/tab-nav/tab-nav.ts:160-217`
   - Why: consumer must today write `<nav twTabNav [tabPanel]="panel">` AND ensure the panel is a sibling. With `contentChild(TabNavPanel)` the panel can simply live inside the nav.
   - Change: add `readonly _projectedPanel = contentChild(TabNavPanel)` and a `linkedSignal` that prefers the explicit `tabPanel()` input, falling back to the projected one. Document both patterns.
   - Acceptance: `<nav twTabNav> … <tw-tab-nav-panel> … </nav>` works without manual wiring.

5. **Add per-slot class hooks**.
   - File(s): `projects/ngx-tw/tab-nav/tab-nav.ts`
   - Why: consumers can't currently override link classes without a global selector.
   - Change: add `navClass` / `listClass` / `linkClass` as `input<string>('')`. Merge via `twMerge`.
   - Acceptance: `<nav twTabNav linkClass="rounded-lg shadow-sm">` applies to every link without breaking active styling.

6. **Document the router-integration recipe + add a smoke spec**.
   - File(s): `projects/demo/src/app/routes/tab-nav/…`, `projects/ngx-tw/tab-nav/tab-nav.spec.ts`
   - Why: tab-nav is intentionally router-agnostic; the canonical wiring `[active]="rla.isActive" routerLinkActive #rla="routerLinkActive"` must be visible to consumers.
   - Change: add a demo example. Add a Vitest spec using `RouterTestingModule` (or `provideRouter([...])` v21 API) with two routes and assert `aria-current="page"` flips when the URL changes.
   - Acceptance: demo renders the wired-up example; spec passes.

7. **Add Space-key activation on links**.
   - File(s): `projects/ngx-tw/tab-nav/tab-nav.ts:375-380`
   - Why: anchors do not navigate on Space by default; this is an a11y best-practice gap.
   - Change: extend `onKeydown` to handle `Space` (when not disabled) by calling `this.elementRef.nativeElement.click()`. Preserve `preventDefault()` to avoid scroll.
   - Acceptance: Space on a focused link navigates; spec covers it.

8. **Add AXE check to the spec**.
   - File(s): `projects/ngx-tw/tab-nav/tab-nav.spec.ts`
   - Why: parity with the rest of the library's a11y bar.
   - Change: add an `it('passes AXE checks', …)` in both nav-landmark and tabs patterns.
   - Acceptance: AXE returns zero violations.

### Out of scope
- Vertical orientation (defer until consumer demand).
- A `[routerLink]` integration directive (consumer keeps full control of routing).
- Animated active-indicator ink-bar (same parking lot as tabs).

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Visual check: `http://localhost:4600/tab-nav`
- A11y: `npm run e2e:a11y` or AXE in spec

## Priority
**P1** — Component is well-formed, with strong a11y. The dark-mode and i18n live-announcement work is required parity for the library bar. Variant-config sharing is a refactor that prevents drift but isn't blocking. Router-integration smoke spec closes a meaningful gap given the intended use-case.
