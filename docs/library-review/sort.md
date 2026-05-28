# Sort — Production-Grade Review

**Entry point:** `ngx-tw/sort`
**Files:** `projects/ngx-tw/sort/`

## Snapshot
- Selectors: `[twSort]` (directive, any element), `[tw-sort-header]` (component, attribute selector), `[twSortHeaderIcon]` (passive content-projection select)
- Public classes/directives: `SortDirective`, `SortHeaderComponent` (plus types `SortDirection`, `TwSortable`, `TwSortEvent`, `TwSortArrowPosition`, and the pure helper `getSortDirectionCycle`)
- Inputs: 5 on `SortDirective` (`active`, `direction`, `start`, `disableClear`, `disabled`); 7 on `SortHeaderComponent` (`id`, `start`, `disableClear`, `headerDisabled`, `arrowPosition`, `color`, `size`, `sortActionDescription`)
- Outputs: 1 (`sortChange` on `SortDirective`)
- Slots: implicit `<ng-content>` for label; `[twSortHeaderIcon]` selector for custom arrow icon
- `tv()` config: yes, slots = `host`, `container`, `label`, `arrow`, `arrowIcon`
- A11y CDK utilities used: `AriaDescriber` (sort-header.ts:163, 183-186), `FocusMonitor` (sort-header.ts:162, 257)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `SortDirective.active` (model) | `string \| null` | `null` | yes | Aliased `twSortActive` — clean. |
| `SortDirective.direction` (model) | `SortDirection` | `null` | yes | Aliased `twSortDirection`. |
| `SortDirective.start` | `'asc' \| 'desc'` | `'asc'` | yes | Aliased `twSortStart`. |
| `SortDirective.disableClear` | `boolean` | `false` | yes | Aliased `twSortDisableClear`. |
| `SortDirective.disabled` | `boolean` | `false` | yes | Aliased `twSortDisabled`. |
| `SortHeaderComponent.id` | `string` | required | yes | OK |
| `SortHeaderComponent.start` | `'asc' \| 'desc' \| undefined` | `undefined` | yes | Header override; `undefined` inherits. |
| `SortHeaderComponent.disableClear` | `boolean \| undefined` | `undefined` | yes | Header override. |
| `SortHeaderComponent.headerDisabled` | `boolean` | `false` | yes (alias `disabled`) | The alias is `disabled` — consumer writes `<span tw-sort-header [disabled]="…">`. Avoids template-binding clash with native `disabled` on `<button>`. |
| `SortHeaderComponent.arrowPosition` | `TwSortArrowPosition` | `'after'` | yes | `'before' \| 'after'` |
| `SortHeaderComponent.color` | `TwColor` | `'primary'` | yes | Tints the arrow when active. |
| `SortHeaderComponent.size` | `TwSize` | `'md'` | yes | OK |
| `SortHeaderComponent.sortActionDescription` | `string` | `'Sort'` | yes | Sent through `AriaDescriber` so SRs read e.g. "Name. Sort." |

### Findings
- All inputs are well-typed, well-documented, with sensible defaults.
- The **aliases** on `SortDirective` (`twSort*` prefix) are necessary because the directive shares its element with arbitrary host content (table header rows, divs). Excellent design.
- `headerDisabled` aliased as `disabled` is clean. Alternative would be to call it `disabledInput` but the alias is preferable.
- Input count on `SortHeaderComponent` is 7 — within cap with one to spare.
- **Type for `start: 'asc' | 'desc' | undefined`** — the `| undefined` adds an explicit tri-state for "inherit from parent". Document the convention in JSDoc; currently the JSDoc mentions inheritance but `undefined` as a sentinel could be replaced with `'inherit'`. Trade-off: `undefined` is the default; `'inherit'` would be more discoverable. Leave as-is.
- No `clearable` input on the header level — covered by `disableClear` (inverse). Good.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `sortChange` | `TwSortEvent` | propertyChange | Aliased `twSortChange`. Payload includes `previous: { active, direction }` snapshot — useful for undo/event sourcing. |

### Findings
- **`sortChange` only emits on user interaction** — programmatic writes to `active` / `direction` do NOT emit (verified by spec `programmatic writes to active/direction do NOT emit sortChange`). This is the canonical Material behaviour. Excellent.
- Naming is `sortChange` (propertyChange), not `sorted` (past-tense). Both are correct per the dual convention.

## Customization surface
- ng-content slots:
  - Implicit `<ng-content>` in `<span [class]="labelClasses()">` (sort-header.html:10) — the header label.
  - `<ng-content select="[twSortHeaderIcon]">` (sort-header.html:18) — custom icon replaces the default chevron SVG.
- Structural directives: none.
- Fallback content: default chevron SVG when no custom icon is projected.
- Class merging: `twMerge: true` (sort-header.ts:114). Per-color arrow tinting is concatenated (`${base} ${ARROW_ACTIVE_COLOR[color]}` at sort-header.ts:242).
- Findings:
  - **The `[twSortHeaderIcon]` content-selector** is a nice escape hatch. Consumer can project an `<svg>` or a `<tw-icon>` and the variant classes (rotation, opacity) automatically apply via the wrapping `<span [class]="arrowClasses()">`. Verify rotation transforms work for projected SVGs (sort-header.ts:96: `direction.asc → rotate-180`).
  - **No way to override the label slot's classes** without breaking the active-color tinting. Add `labelClass = input<string>('')` or accept that consumers wrap the projected content themselves.
  - The arrow span carries `data-tw-sort-arrow` (sort-header.html:17) for test/style hooks — undocumented public API. Either document or rename to `data-_internal`.

## CSS / Styling
- tailwind-variants: yes, slots `host`, `container`, `label`, `arrow`, `arrowIcon`
- twMerge: yes (sort-header.ts:114)
- Semantic tokens vs raw palette: ARROW_ACTIVE_COLOR (sort-header.ts:35-44) uses `text-{color}-600` and `text-fg` for neutral — semantic and correct. **No dark mode overrides**. Same convention gap as tabs/tab-nav/paginator.
- Surface/fg/border tokens usage: `text-fg`, `text-fg-muted`, `bg-surface-muted` (hover) — correct.
- Radius compliance: `rounded-md` on container — compliant.
- Spacing/gap compliance: container padding `px-2 py-1 / px-2.5 py-1.5 / px-3 py-2 / px-4 py-2.5 / px-5 py-3` — `px-2.5` at sm is a deviation; the canonical sm row is `px-3 py-1.5`. Either align to canonical or document. Project rule notes `px-3 py-1.5` is "the canonical sm row, don't flag py-1.5" — `px-2.5` is non-canonical.
- Typography compliance: xs→`text-xs`, sm/md→`text-sm`, lg/xl→`text-base` — compliant.
- Focus rings compliance: container uses `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (sort-header.ts:53) — canonical. `role=button` on the container (sort-header.html:4) qualifies for canonical outline ring; NOT the menu-item carve-out.
- Dark mode handling: ARROW_ACTIVE_COLOR has no `dark:` overrides. Add `dark:text-{color}-400` per the project convention.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on container (sort-header.ts:53), `transition-opacity duration-200 motion-reduce:transition-none` on arrow wrapper (sort-header.ts:57), `transition-transform duration-200 motion-reduce:transition-none` on arrow icon (sort-header.ts:58) — three separate property-targeted transitions, all compliant. Excellent.
- Shadows: none.
- Icon sub-scale: `size-3.5` at xs (sort-header.ts:64) — half-step decorative chevron. **Requires inline comment** per project convention. Not present.
- Findings:
  - **Missing dark-mode overrides on ARROW_ACTIVE_COLOR** (sort-header.ts:35-44). Add `dark:text-{color}-400` for each.
  - **`px-2.5 py-1.5` at sm** breaks the canonical inline spacing scale. The canonical sm row is `px-3 py-1.5`. Decide whether sort-header is intentionally tighter (because it lives inside table headers and width matters). If intentional, document.
  - **`size-3.5` at xs** is a half-step icon — must carry an inline comment (sort-header.ts:64). Add `// half-step: xs sort chevrons fit between size-3 and size-4 alongside text-xs labels`.
  - Hover state `hover:bg-surface-muted` (sort-header.ts:53) — compliant.

## Accessibility
- ARIA roles/attributes:
  - Host element has `aria-sort` (sort-header.ts:130) and `aria-disabled` (sort-header.ts:131).
  - Inner container (the actual click target) has `role="button"` and `tabindex="0"` when enabled (sort-header.html:5-6). When disabled, both attributes are removed (`null`). This is correct.
- Keyboard support: Enter and Space trigger the sort cycle (sort-header.ts:281-287). Preventd default on Space to avoid scroll.
- CDK a11y utilities:
  - `AriaDescriber` describes the container with `sortActionDescription` (sort-header.ts:163, 184-186). Cleaned up on destroy.
  - `FocusMonitor` monitors the container with subtree=true (sort-header.ts:162, 257). Stopped on destroy.
- Focus management: `tabindex=0` on the container — focus is natural.
- AXE risks:
  - **`role="button"` on inner container** but **`aria-sort` on the host element** — these two attributes live on different elements (host vs container, sort-header.ts:130 sets aria-sort on the host). Screen-readers should still associate the sort state with the header thanks to the parent-child relationship, but some ATs may not. Best practice is to put both `role=button` and `aria-sort` on the same element. Verify with NVDA + JAWS.
  - **`AriaDescriber` describes the container**, but if the container's `role="button"` is removed (disabled), the description still applies — fine.
- Findings:
  - **Split between host (`aria-sort`) and container (`role=button`)** may cause AT confusion. Consider moving `aria-sort` to the container element, OR moving `role=button` to the host. Cross-check Material Components which puts both on the inner `<button>`.
  - **`FocusMonitor` is consumed** for what purpose? The monitor is started but its origin is not used in templates. Same dead-code question as segmented-control. Either wire (e.g. apply a different background when origin === 'keyboard') or remove. The `cdk-focused`/`cdk-keyboard-focused` classes ARE added by `FocusMonitor` automatically so consumer global styling can hook them — possibly intentional. Document.
  - **`AriaDescriber` integration is excellent** — the rare component that actually uses this CDK helper. Material does this for `MatSortHeader`. Parity achieved.
  - **No `LiveAnnouncer` for sort changes** — when the user activates sorting via keyboard, the announcement that "Name column is now sorted ascending" is left to the AT inferring from `aria-sort`. Most ATs DO announce `aria-sort` changes, so this is acceptable. Optional improvement: explicitly announce on sort.
  - **Header without parent `[twSort]` throws in dev mode** (sort-header.ts:171-175) — good developer experience.
  - **Duplicate header id throws in dev mode** (sort.ts:91-95) — good.

## Tests
- Spec file: yes — sort.spec.ts (513 lines).
- Coverage breakdown:
  - Pure helper: `getSortDirectionCycle` covered with 4 cases.
  - SortDirective: initial state, registration, asc→desc→null cycle, disableClear, start=desc, click different header, per-header start, per-header disableClear, disabled directive, disabled header, programmatic writes don't emit, two-way binding, duplicate id throws, deregister on destroy, getNextSortDirection — all covered.
  - SortHeaderComponent: label projection, aria-sort inactive/active, only-active-shows-non-none, role/tabindex enabled/disabled, host aria-disabled, Enter+Space, other keys, default chevron, custom icon, color tinting, asc rotation, opacity-0 inactive, arrowPosition=before, size padding, orphan throws — all covered.
- Vitest issues: none. `vi.spyOn` used. No `fakeAsync`/`tick`.
- Findings:
  - **No AXE check** test.
  - **No `FocusMonitor` consumption test** (because it's not consumed in templates).
  - **No `AriaDescriber` test** — should at least assert the `aria-describedby` attribute is set.
  - **No dark-mode test** — would require theme harness.
  - Spec is excellent overall — comprehensive and well-structured.

## Gaps & lacks
1. **Missing dark-mode overrides on ARROW_ACTIVE_COLOR** (P0).
2. **`size-3.5` xs icon** needs inline comment (P2).
3. **`px-2.5 py-1.5` sm padding** deviates from canonical `px-3 py-1.5` (P2).
4. **`role=button` on container vs `aria-sort` on host** split may confuse some ATs (P1).
5. **`FocusMonitor` is started but not consumed in template** — same dead-code question as segmented-control (P2).
6. **No `aria-describedby` spec assertion** (P2).
7. **No AXE spec** (P1).
8. **`data-tw-sort-arrow` is undocumented public API** — either document or rename to internal (P2).
9. **No optional `LiveAnnouncer`** for sort changes (P3).
10. The arrow's transitions use 3 separate property-targeted entries — efficient, good design (no gap).

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Polish `sort` to production-grade parity with `mat-sort`: ARIA placement on a single element, dark-mode coverage on the active arrow tint, spacing conformance, and either wire or remove the dead `FocusMonitor` subscription.

### Tasks
1. **Move `aria-sort` and `role="button"` to the same element**.
   - File(s): `projects/ngx-tw/sort/sort-header.ts:128-134`, `projects/ngx-tw/sort/sort-header.html:1-6`
   - Why: WAI-ARIA recommends co-locating role and state. Currently `aria-sort` is on the outer host element (often a `<th>` cell) while `role="button"` is on the inner clickable container. Some ATs may not associate the state with the action.
   - Change: choose one — recommended option (a):
     - **(a)** Keep `aria-sort` on the outer host (since `<th>` is the semantic owner of column sorting) and remove `role="button"` from the inner container. Instead, replace the inner `<div>` with a `<button type="button">` element, which conveys role natively. This requires updating the template structure: `<button type="button" #container [class]="containerClasses()" [disabled]="isDisabled()">…</button>`. The host element retains `aria-sort` for AT discovery of column state.
     - **(b)** Move `aria-sort` to the inner container alongside `role="button"`. Simpler but conflates header semantic with action semantic — less correct.
   - Acceptance: tested with NVDA/VoiceOver, sort state and action are announced together when the user focuses the header.

2. **Add dark-mode overrides to ARROW_ACTIVE_COLOR**.
   - File(s): `projects/ngx-tw/sort/sort-header.ts:35-44`
   - Why: project convention requires explicit `dark:` overrides on color variants.
   - Change: extend each entry. Example: `primary: 'text-primary-600 dark:text-primary-400'`. Apply to all 8 colors.
   - Acceptance: dark mode active arrow renders in readable contrast.

3. **Add inline comment on the half-step xs icon**.
   - File(s): `projects/ngx-tw/sort/sort-header.ts:64`
   - Why: project rule requires every `size-3.5` use to carry a rationale comment.
   - Change: add `// half-step: xs sort chevrons fit between size-3 and size-4 next to text-xs labels` above the `arrowIcon: 'size-3.5'` line.
   - Acceptance: rule satisfied.

4. **Align sm inline padding to the canonical `px-3 py-1.5`**.
   - File(s): `projects/ngx-tw/sort/sort-header.ts:66-69`
   - Why: project convention canonical sm row is `px-3 py-1.5`. Current `px-2.5 py-1.5` is non-canonical.
   - Change: `sm: { container: 'px-3 py-1.5 text-sm', arrowIcon: 'size-4' }`. Or document the deviation if intentional (sort headers want tighter columns).
   - Acceptance: sm sort headers match other components' sm padding; spec updates accordingly.

5. **Wire `FocusMonitor` consumption or remove the subscription**.
   - File(s): `projects/ngx-tw/sort/sort-header.ts:162,254-259`
   - Why: `FocusMonitor` is started with `subtree=true` but no signal consumes the emission. The auto-applied `cdk-focused`/`cdk-keyboard-focused` classes are usable for theming, but currently the component doesn't reference them.
   - Change: pick one:
     - **Wire**: subscribe to `monitor()`'s observable, convert to a `keyboardFocused = signal(false)` and apply a stronger ring (e.g. `ring-2 ring-primary-500 ring-offset-2 ring-offset-surface`) when true. Update container classes via a `cdkFocused` variant in `tv()`.
     - **Remove**: drop the FocusMonitor injection, the `ngAfterViewInit` body that calls monitor(), and the cleanup in `ngOnDestroy`. Keep canonical `focus-visible` outline.
   - Recommend **remove** unless task 1(a) is chosen — in (a) the `<button>` element naturally gets `:focus-visible` and `FocusMonitor` is redundant.
   - Acceptance: no dead-code subscription; existing focus-ring behaviour preserved.

6. **Document or internalize `data-tw-sort-arrow`**.
   - File(s): `projects/ngx-tw/sort/sort-header.html:17`
   - Why: this attribute is queried by the spec but isn't part of the documented public API. Consumers may write CSS against it; if it changes, that breaks.
   - Change: option A — document it in the README/component docs as a stable test/style hook. Option B — rename to `data-_internal-arrow` (or simply drop the attribute and have the spec query the inner SVG).
   - Acceptance: clear stance — either public + documented, or internal-only.

7. **Add AXE spec + `aria-describedby` assertion**.
   - File(s): `projects/ngx-tw/sort/sort.spec.ts`
   - Why: completeness. `AriaDescriber` integration is a key feature and should be verified.
   - Change: add `it('passes AXE checks', …)`. Add `it('sets aria-describedby via AriaDescriber', () => expect(container.getAttribute('aria-describedby')).toBeTruthy())`.
   - Acceptance: specs pass.

### Out of scope
- Multi-column sort (out of scope; sort is single-active by design).
- Server-side sort indicator (consumer responsibility — they receive `sortChange` and re-fetch).
- Sort persistence to localStorage (consumer responsibility).

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Visual check: `http://localhost:4600/sort`
- A11y: `npm run e2e:a11y` or AXE in spec

## Priority
**P1** — Component is among the cleanest in the navigation batch: comprehensive spec, real `AriaDescriber` integration, sensible per-header overrides, strong dev-mode guards. The remaining work is ARIA-placement alignment, dark-mode parity, and removing the dead `FocusMonitor` subscription.
