# Item — Production-Grade Review

**Entry point:** `ngx-tw/item`
**Files:** `projects/ngx-tw/item/`

## Snapshot
- Selectors: `tw-item` (element); `[twItemLeading]`, `[twItemTitle]`, `[twItemDescription]`, `[twItemTrailing]` (attribute directives).
- Public classes/directives: `ItemComponent`, `ItemLeadingDirective`, `ItemTitleDirective`, `ItemDescriptionDirective`, `ItemTrailingDirective`. Public types: `ItemSize` (`'sm' | 'md' | 'lg'`), `ItemAlign` (`'start' | 'center'`).
- Inputs: 4 (`size`, `align`, `interactive`, `disabled`).
- Outputs: 1 (`selected`).
- Slots: 4 (leading / title / description / trailing) via attribute directives.
- CVA: no.
- `tv()` config: yes; slots: `root`, `leading`, `content`, `title`, `description`, `trailing`.
- A11y CDK utilities used: `FocusMonitor` (`item.ts:13, 138, 157-162`).

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `size` | `ItemSize` | `'md'` | yes (`item.ts:122`) | sm = truncated single-line for table rows; md = list-item; lg = section header. |
| `align` | `ItemAlign` | `'start'` | yes (`item.ts:125`) | start (baseline of title) vs center. |
| `interactive` | `boolean` | `false` | yes (`item.ts:128`) | Adds `role=button`, hover bg, focus ring. |
| `disabled` | `boolean` | `false` | yes (`item.ts:131`) | Only meaningful with interactive. |

### Findings
- Input count: 4 — well under cap.
- `size` is a **narrowed** `Extract<TwSize, 'sm' | 'md' | 'lg'>`. Good — codifies the three real use cases. JSDoc spells each one out.
- Booleans default to `false`. No exceptions needed.
- `interactive`/`disabled` could be modeled as a single `behavior: 'static' | 'interactive' | 'disabled'`, but four states orthogonally is simpler and matches Material's API. Keep as two booleans.
- **No `transform: booleanAttribute`** on `interactive` or `disabled` (`item.ts:128, 131`). Consumers who write `<tw-item interactive>` (bare attribute) would get `''` (empty string) coerced. Most consumers use `[interactive]="true"` so this rarely bites, but adding the transform is cheap and matches `flip-card.ts:129`.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `selected` | `Event` | past-tense action | Fires on click/Enter/Space when interactive & not disabled. |

### Findings
- `Event` payload is general enough to cover both `MouseEvent` and `KeyboardEvent`. Acceptable. Could narrow to `MouseEvent | KeyboardEvent` for stricter typing.
- Past-tense naming matches the codified dual pattern.

## Customization surface
- ng-content slots: four `<ng-content select="[twItem*]">` selectors (`item.ts:113-119`). Leading and trailing are projected at the top level; title and description are wrapped inside a `content` div. Clean.
- Structural directives: four — `ItemLeadingDirective`, `ItemTitleDirective`, `ItemDescriptionDirective`, `ItemTrailingDirective`. All four are pure class-appliers (read computed signals on the parent `ItemComponent`).
- Fallback content: none. Correct — title is optional in markup (description/leading/trailing are also optional). An empty `tw-item` shell is allowed.
- Class merging: `twMerge: true` (`item.ts:98`).
- Findings:
  - **Slot architecture is sound and well-considered.** The comment at `item.ts:30-32` explaining why `leading` does NOT use `flex items-center justify-center` is exactly right — it would conflict with consumer tile classes (e.g. `<tw-avatar>` already centers its initials internally).
  - **Consumer-driven elements**: because the directives are attribute selectors, consumers pick the HTML element (`<i>`, `<svg>`, `<span>`, `<tw-icon>`, `<tw-avatar>`, `<button>`). The demo proves this is heavily used (item demo lines 173, 184, 232, etc.). Strong primitive.
  - **Missing structural directive: chevron / disclosure**. Many usage sites pair a trailing chevron icon (`tw-icon name="chevron-right"`) — the demo does this manually. Not a gap; composition is fine.
  - The `content` slot is rendered by the template (`item.ts:114`) — not exposed via a directive. So if a consumer needs to add a class to the content stack (e.g. `gap-3`), they can't. Acceptable; the `gap-0/1` is already size-driven.

## CSS / Styling
- tailwind-variants: yes; six slots (`item.ts:23-99`).
- twMerge: yes.
- Semantic tokens vs raw palette: 100% semantic — `text-fg`, `text-fg-muted`, `hover:bg-surface-muted`, `focus-visible:outline-primary-500` (`item.ts:26-75`). No raw palette colors.
- Surface/fg/border tokens: correct usage.
- Radius compliance: `rounded-md` only on the interactive variant (`item.ts:75`). Non-interactive items have no radius — they sit flush. Compliant.
- Spacing/gap compliance:
  - root gaps: `gap-2` (sm), `gap-3` (md/lg) (`item.ts:39, 46, 54`) — compliant (one of the allowed values).
  - trailing gaps: `gap-1.5` (sm), `gap-2` (md/lg) (`item.ts:43, 51, 59`) — compliant.
  - content gaps: `gap-0` (sm), `gap-1` (md/lg) (`item.ts:41, 48, 56`) — `gap-0` is permitted (it's a degenerate value); `gap-1` is compliant.
  - vertical padding: `py-1.5` (sm), `py-2` (md), `py-3` (lg) (`item.ts:39, 46, 54`). **Codified memory note**: `py-1.5` is the canonical sm row — don't flag.
  - Interactive carve-out: `-mx-2 ... px-2` (`item.ts:75`) — the negative margin compensates for the horizontal padding so an interactive item's bounding box still aligns visually with its non-interactive sibling. Clever and correct.
- Typography compliance:
  - sm: `text-sm` title (truncate), `text-xs` description (truncate) — compliant.
  - md: `text-sm` title, `text-sm` description — compliant.
  - lg: `text-base` title (`font-semibold`), `text-sm` description — **`text-base` is allowed in lg**; check against `CLAUDE.md` "Body text" / "Titles" rows which both say `text-sm`. `text-base` (16px) is the next step up, which `CLAUDE.md` explicitly disallows: *"Do not use `text-lg`, `text-xl`, or larger in library components"* — but `text-base` is one step below `text-lg`, so it's permitted by the rules' negation. However, the typography table in `CLAUDE.md` does **not** list any `text-base` case for component-internal text; lg item titles are the first such case. Either codify `text-base` as the "section-header item title" exception in `CLAUDE.md`, or downscale to `text-sm font-semibold` (which is what other section headers in the library use).
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (`item.ts:75`) — compliant.
- Dark mode handling: surface-token-driven; no `dark:` overrides needed.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on the interactive variant (`item.ts:75`) — compliant.
- Shadows: none. Correct — items are flat by default.
- Icon sub-scale: not applicable (icons are consumer-projected; component does not size them).
- Findings:
  - One potentially-uncodified typography step: `text-base` on lg title. Either codify or downscale.
  - All other styling clean.

## Accessibility
- ARIA roles/attributes:
  - `role="button"` when interactive (`item.ts:106`).
  - `tabindex="0"` when interactive AND not disabled (`item.ts:107`).
  - `aria-disabled="true"` when disabled (`item.ts:108`).
  - No `role`/`tabindex`/`aria-disabled` when non-interactive (`item.ts:106-108`).
- Keyboard support: Enter, Space, "Spacebar" (legacy IE key string) (`item.ts:171`). `preventDefault()` on activation — good (suppresses Space-induced page scroll).
- CDK a11y utilities: `FocusMonitor.monitor()` on the host (`item.ts:158-161`). `FocusMonitor` adds `cdk-focused`/`cdk-keyboard-focused`/`cdk-mouse-focused` classes. But the component already uses `focus-visible:` directly, so the `FocusMonitor` integration is **redundant for styling** — `focus-visible` already distinguishes keyboard from mouse. The integration may be useful for consumers who want to react to focus origin, but it's largely cosmetic.
- Labels/descriptions wiring: the host has no `aria-label`. When the item is `role="button"`, the title text becomes the accessible name (good). For interactive items that have **no title** (e.g. icon-only), the consumer must add `aria-label` externally.
- AXE risks:
  - **Potential issue**: when a consumer projects a focusable element inside `[twItemTrailing]` (e.g. `<button>...</button>`) on an interactive item, the item itself is `role="button"` with `tabindex="0"` AND contains another button. Nested interactive elements is a real AXE rule violation ("nested interactive controls"). The demo example at `item-examples.component.ts:262-278` has a `<button>` inside a `twItemTrailing` of a non-interactive `tw-item` — which is fine. But if `interactive=true` and a button is in trailing, AXE flags it.
  - The component should make this explicit in JSDoc: "Do not project focusable elements into `[twItemTrailing]` or `[twItemLeading]` when `interactive=true` — wrap differently."
- Findings:
  - Solid baseline for the common case.
  - **Doc gap**: nested interactive guidance is missing from JSDoc.
  - **Potential structural enhancement**: support `role="menuitem"` / `role="option"` so consumers don't fight the default `role="button"` when wrapping this primitive into menu/select/command-palette. Today the role is hardcoded. Several internal consumers (`tw-menu`, `tw-command-palette`, `tw-select`) need different roles. Investigate whether they use `tw-item` directly or just style their own elements similarly.

## Form integration (if applicable)
- CVA: no.
- ErrorStateMatcher: no.
- form-field interop: no.
- Findings: not applicable. `tw-item` is a presentational + interactive primitive, not a form control.

## Tests
- Spec file: yes (`item.spec.ts`).
- Coverage breakdown:
  - Default render: yes (`item.spec.ts:67-106`).
  - Size variants: sm, md, lg with class assertions (`item.spec.ts:108-163`).
  - Align variants: start (default + leading nudge), center (clears nudge) (`item.spec.ts:165-203`).
  - Interactive mode: role/tabindex/hover/focus classes, click emit, Enter/Space emit + preventDefault, other keys ignored (`item.spec.ts:205-272`).
  - Disabled mode: aria-disabled, tabindex null, opacity-50, pointer-events-none, no click/Enter emit (`item.spec.ts:274-317`).
  - Content projection: all four slots, missing-slot absence, class application on title/description/leading/trailing (`item.spec.ts:319-381`).
  - Accessibility: role and tabindex matrix (`item.spec.ts:383-421`).
- Vitest-specific issues: clean — uses `vi.spyOn(event, 'preventDefault')` correctly; no `fakeAsync`/`tick`.
- Findings:
  - Strong coverage. Missing:
    1. No test for `FocusMonitor` integration (cleanup on destroy).
    2. No test asserting `selected` payload `Event` instance type on **keyboard** activation (only on click — `item.spec.ts:236`).
    3. No test for the `'Spacebar'` legacy key string (`item.ts:171`). Consider whether this branch is still needed; IE11 is unsupported.
    4. No coverage for `twMerge` consumer override (e.g. `<tw-item class="py-4">` resolving against internal `py-2`).

## Gaps & lacks
1. **No way to override the `role`** — internal consumers (menu, command-palette, select) need `role="menuitem"`/`option`/`menuitemcheckbox`. Today they likely render their own elements and don't use `tw-item`. Confirm and either add a `role` input or document the intentional split.
2. `text-base` on lg title is not codified in `CLAUDE.md`'s typography table. Either codify or downscale.
3. **No `transform: booleanAttribute`** on `interactive`/`disabled` — bare attributes don't coerce.
4. Nested-interactive guidance missing from JSDoc.
5. `FocusMonitor` integration is redundant given `focus-visible:` styling, but harmless.
6. Tests miss FocusMonitor lifecycle, keyboard payload, and consumer twMerge cases.
7. **No "highlighted" / "selected" persistent state.** A common pattern (selected list item, current menu item) requires consumer to manually add `bg-primary-50` etc. Consider an `aria-current` / `selected` input that applies a low-prominence highlight using `ring-2 ring-primary-500` per the codified pattern.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Harden `tw-item` as the foundational list/row primitive: codify the `text-base` exception, add safety transforms and one missing "selected" state, document composition rules with menu/select, and close the test gaps.

### Tasks

1. **Add `booleanAttribute` transforms** — match the rest of the library.
   - File(s): `projects/ngx-tw/item/item.ts:128, 131`
   - Why: `flip-card.ts:129` already uses `booleanAttribute`; consistency + bare-attribute support.
   - Change: import `booleanAttribute`, set `interactive = input(false, { transform: booleanAttribute })` and same for `disabled`.
   - Acceptance: `<tw-item interactive>` (no value) renders as interactive.

2. **Codify or downscale `text-base` on lg title.**
   - File(s): `projects/ngx-tw/item/item.ts:57` and `.claude/CLAUDE.md` (Typography table).
   - Why: `text-base` is not currently listed as a permitted step in the typography table — only `text-sm` for titles. Today's lg item title is the only place in the library using `text-base`.
   - Change (preferred — codify): add a row to `CLAUDE.md` Typography: "Section-header items (`tw-item` size lg title) | `text-base font-semibold` | `text-sm` body". Justify: at the lg density, the title must visually dominate description. Alternative (downscale): change to `text-sm font-semibold` and tighten `py-3` to `py-3.5`. The codify path is preferred to preserve the section-header role.
   - Acceptance: either `CLAUDE.md` lists the exception, or the source uses `text-sm font-semibold`.

3. **Document nested-interactive caveat in JSDoc.**
   - File(s): `projects/ngx-tw/item/item.ts:128-132`
   - Why: AXE will flag nested interactive controls when consumers put a `<button>` inside `twItemTrailing` of an interactive item.
   - Change: extend the `interactive` JSDoc: "When `true`, do not project additional focusable elements (buttons, links, inputs) into `[twItemLeading]` or `[twItemTrailing]` — they create nested interactive controls. For action-row patterns, keep `interactive=false` and add the action button to trailing instead."
   - Acceptance: Compodoc-generated API table shows the caveat.

4. **Add a `selected` persistent state** — match menu/listbox semantics.
   - File(s): `projects/ngx-tw/item/item.ts` (new input + variant slot).
   - Why: many consumers want a "current" row indicator. Today they hack it via `class="bg-primary-50"`, which is fragile and not a11y-aware.
   - Change: add `readonly selectedState = input(false, { transform: booleanAttribute });` (rename input to avoid clashing with the `selected` output — bikeshed: `current` or `active` instead). In the `tv` config, add a variant `selectedState: { true: { root: 'bg-primary-50 ring-2 ring-inset ring-primary-200 dark:bg-primary-950/30 dark:ring-primary-800' } }`. Bind `[attr.aria-current]="selectedState() ? 'true' : null"` on the host. Document that this is for visual highlighting only — menu/select/listbox a11y semantics still require the parent to set the appropriate role.
   - Acceptance: spec covers visual selected state + `aria-current` attribute; works with interactive=true (focus ring + selected ring stack correctly).
   - **Input count check**: brings to 5 — still at cap.

5. **Investigate role override for internal consumers.**
   - File(s): `projects/ngx-tw/menu/`, `projects/ngx-tw/select/`, `projects/ngx-tw/command-palette/` (read-only exploration).
   - Why: if menu/select/command-palette duplicate the item layout because they need `role="menuitem"` etc., the library has parallel implementations. Audit whether they should compose `tw-item` with a role override.
   - Change: read each consumer's template. If they re-implement the leading/title/description/trailing layout, either: (a) export a slot-only `<tw-item role="...">` (add a `role` input with `'button' | 'menuitem' | 'option' | 'menuitemcheckbox' | 'menuitemradio'`), or (b) document that `tw-item` is intentionally not used inside menu/listbox and they reimplement layout.
   - Acceptance: a decision is captured in a follow-up doc note; if the role-input approach wins, it's added to `tw-item` and at least one consumer migrates.

6. **Test gaps — close them.**
   - File(s): `projects/ngx-tw/item/item.spec.ts`
   - Why: foundational primitive; tests are the safety net for downstream consumers.
   - Change:
     - Add a test that `FocusMonitor.stopMonitoring` is called on destroy (mock provider, spy on `stopMonitoring`).
     - Add a `selected` payload assertion on Enter/Space: `expect(host.lastEvent).toBeInstanceOf(KeyboardEvent)`.
     - Add a consumer-twMerge test: `<tw-item class="py-4">` resolves to `py-4` (overriding `py-2`).
     - Drop `'Spacebar'` from `onKeydown` (`item.ts:171`) or add a test that documents we still accept it. (Browser support: every modern browser emits `' '`, never `'Spacebar'`. Safe to remove.)
   - Acceptance: green; coverage report shows the new paths.

### Out of scope
- Adding a built-in chevron / disclosure slot — composition is preferred.
- Adding `aria-haspopup` / `aria-expanded` for items that open menus — that lives in the parent component.
- Changing the four-directive pattern to single-directive-per-slot config — current is more readable.

### Verification
- Build: `npm run build:lib`
- Test: `npm test` (filter: `item`)
- Visual check: `http://localhost:4600/item`
- A11y: `npm run e2e:a11y` (item route)

## Priority
**P1** — Item is a foundational primitive consumed by menu, command-palette, select, table-row patterns, and most doc pages. The codified typography ambiguity, missing `booleanAttribute`, undocumented nested-interactive trap, and absence of a "selected" state are real friction points that compound across many surfaces. Address before Card.
