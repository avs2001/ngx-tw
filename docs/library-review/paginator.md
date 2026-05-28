# Paginator — Production-Grade Review

**Entry point:** `ngx-tw/paginator`
**Files:** `projects/ngx-tw/paginator/`

## Snapshot
- Selectors: `tw-paginator` (element), `ng-template[twPaginatorLabel]`, `ng-template[twPaginatorEmpty]`, `ng-template[twPaginatorPageSizeSelector]`
- Public classes/directives: `PaginatorComponent`, `PaginatorLabelDirective`, `PaginatorEmptyDirective`, `PaginatorPageSizeSelectorDirective` (plus types `TwPaginatorType`, `TwPaginatorLayout`, `TwPaginatorResponsive`, `TwPaginatorLabelSlot`, `TwPaginatorLabels`, `TwPaginatorPageChangeEvent`, `TwPaginatorLabelContext`, `TwPaginatorPageSizeSelectorContext`)
- Inputs: 18 + `customAriaLabel` (alias `aria-label`) ⇒ 19 total, of which 2 are models (`page`, `pageSize`). Above the 5-6 cap but qualifies for an exception? See Findings.
- Outputs: 1 (`paginated`)
- Slots: 3 templated slots (`twPaginatorLabel` with 6 slot keys, `twPaginatorEmpty`, `twPaginatorPageSizeSelector`)
- `tv()` config: yes, slots = `root`, `inner`, `pageSizeGroup`, `pageSizeLabel`, `pageSizeSelect`, `pageInfo`, `navGroup`, `pageList`, `navButton`, `pageButton`, `ellipsis`, `emptyState`, `icon`
- A11y CDK utilities used: `LiveAnnouncer` (paginator.ts:505, 884-893)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `totalItems` | `number` | `0` | yes | OK |
| `pageSize` (model) | `number` | `10` | yes | OK |
| `page` (model) | `number` | `1` | yes | OK |
| `type` | `TwPaginatorType` | `'numbered'` | yes | `'basic' \| 'numbered'` |
| `layout` | `TwPaginatorLayout` | `'compact'` | yes | `'compact' \| 'spread'` |
| `size` | `TwSize` | `'md'` | yes | OK |
| `color` | `TwColor` | `'primary'` | yes | OK |
| `siblingCount` | `number` | `1` | yes | OK |
| `boundaryCount` | `number` | `1` | yes | OK |
| `showFirstLastButtons` | `boolean` | `true` | yes | Default `true` — **needs inline justification per the docs convention** (the codified list does NOT include this). Either invert (`hideFirstLastButtons`) or add the inline JSDoc justification. |
| `showPageSizeSelector` | `boolean` | `false` | yes | OK |
| `pageSizeOptions` | `readonly number[]` | `[10,25,50,100]` | yes | OK |
| `showPageInfo` | `boolean` | `true` | yes | Same `true` default issue. |
| `hideOnEmpty` | `boolean` | `true` | yes | Same `true` default issue. |
| `hideOnSinglePage` | `boolean` | `false` | yes | OK |
| `responsive` | `TwPaginatorResponsive` | `'auto'` | yes | OK |
| `disabled` | `boolean` | `false` | yes | OK |
| `labels` | `Partial<TwPaginatorLabels>` | `{}` | yes | OK |
| `linkFactory` | `((page: number) => string) \| undefined` | `undefined` | yes | OK |
| `customAriaLabel` | `string \| undefined` | `undefined` | yes (via `alias: 'aria-label'`) | OK |

### Findings
- **Input count is 19**. This exceeds the 5-6 cap. The library codifies four exceptions: overlay, form-control, structural-layout, data-primitive. **Paginator does not cleanly map to any of these.** Possible options:
  1. Treat paginator as a data-primitive (alongside `table`) and codify the exception explicitly in the project rules.
  2. Refactor into a config object: collapse `showFirstLastButtons`, `showPageInfo`, `showPageSizeSelector`, `hideOnEmpty`, `hideOnSinglePage`, `responsive` into a single `display` config; collapse `siblingCount`, `boundaryCount` into a `range` config.
  3. Split into sub-components (e.g. `<tw-paginator-info>`, `<tw-paginator-nav>`) the way Material splits `mat-paginator` from `mat-paginator-default-options`.
- Recommendation: option 2 — config-object reshape. This is the same pattern PR8 applies to `table`. The current API works but doesn't scale.
- **Three `true`-default booleans** (`showFirstLastButtons`, `showPageInfo`, `hideOnEmpty`) — not on the codified `true` defaults list. Each needs either an inline JSDoc rationale or an API flip. `hideOnEmpty` is harmless (the inverted name carries the rationale: empty = nothing useful). `showFirstLastButtons` and `showPageInfo` could be inverted to `hideFirstLastButtons`/`hidePageInfo` to align with the codified defaults convention.
- `customAriaLabel` with `alias: 'aria-label'` is elegant — lets consumers write `<tw-paginator aria-label="Customer pages">` directly.
- `linkFactory` is a clean way to support anchor-mode pagination. The convention is well documented in JSDoc. Good.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `paginated` | `TwPaginatorPageChangeEvent` | past-tense (action) | OK. Rich payload includes `previousPage`, `start`, `end`, `source`. Excellent. |

### Findings
- `paginated` is a single output — clean. The `source` discriminant (`'click' \| 'keyboard' \| 'pageSizeChange' \| 'programmatic'`) is great for consumer analytics.
- No `pageChange` legacy alias. Material uses `pageChange` historically; if migrating from Material, document this.
- Output name `paginated` is past-tense — correct per the project's dual naming convention.
- `previousPage` / `previousPageSize` are included — most consumers don't need them, but they're cheap.

## Customization surface
- ng-content slots: none — paginator owns its full DOM, projection is via structural directives only.
- Structural directives: `*twPaginatorLabel slot="…"` (6 slots), `*twPaginatorEmpty`, `*twPaginatorPageSizeSelector`. Each ng-template has typed context.
- Fallback content: every slot has a default rendering using `resolvedLabels()`.
- Class merging: `twMerge: true` (paginator.ts:339). Active-color classes for the current page button are concatenated in `pageButtonClasses()` — uses `${base} ${PAGE_BUTTON_ACTIVE[color]}` (paginator.ts:634-638). Plain concat is fine here because the static map doesn't overlap with the base.
- Findings:
  - **Excellent template-projection design** — Material's `mat-paginator` has nothing comparable. Each slot exposes a `TwPaginatorLabelContext` with all derived state.
  - **The 6 named label slots** (`pageInfo`, `previous`, `next`, `first`, `last`, `pageSizeLabel`) cover the practical cases. Missing: `pageButton` (per-page label customization).
  - **`labelTemplateFor()` runs a linear search** per call. With 6 slots this is fine, but consider caching to a map. P3.
  - The default page-size `<select>` is unstyled beyond border + padding — `tw-select` would integrate but would couple `paginator` to `select`. The structural directive escape hatch is sufficient.

## CSS / Styling
- tailwind-variants: yes, 13 slots
- twMerge: yes (paginator.ts:339)
- Semantic tokens vs raw palette: PAGE_BUTTON_ACTIVE (paginator.ts:155-171) uses raw `text-white` and `text-black` for the active button — same gap as segmented-control. Should switch to `text-on-{role}`. The `bg-fg text-surface` for the `neutral` color (paginator.ts:163) is an unusual choice — the `on-neutral` token already exists; align.
- Surface/fg/border tokens usage: nav buttons use `bg-surface`, `border-border`, `text-fg`, `hover:bg-surface-muted` — correct. `text-fg-subtle` on ellipsis — correct.
- Radius compliance: `rounded-md` on every button — compliant.
- Spacing/gap compliance: inline padding `px-2 py-1 / px-2.5 py-1.5 / px-3 py-2 / px-4 py-2.5 / px-5 py-3` (paginator.ts:269-303) — `px-2.5` and `min-w-7/8/9/10/11` are slight deviations from the canonical scale (`px-3 py-1.5` for sm). The intent here is to make page buttons square; `min-w-*` enforces that. Document as a deliberate square-button override.
- Typography compliance: xs→`text-xs`, sm/md→`text-sm`, lg/xl→`text-base` — compliant.
- Focus rings compliance: nav and page buttons use `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (paginator.ts:259-262). When active, the focus-outline is **overridden per color** (paginator.ts:157-170: e.g. `focus-visible:outline-primary-500`). For the `neutral` color, `focus-visible:outline-fg` — verify this token resolves to the right shade.
- Dark mode handling: PAGE_BUTTON_ACTIVE has NO `dark:` overrides (paginator.ts:155-171). Project convention says explicit `dark:` overrides on color variants. Add them.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` — compliant.
- Shadows: none.
- Icon sub-scale: glyph icons rendered inline. `size-3.5` at xs (paginator.ts:275) — this is the half-step decorative icon size. Project says `size-3.5` is permitted only with an inline comment justifying why neither `size-3` nor `size-4` fits. Add a one-line comment.
- Findings:
  - **PAGE_BUTTON_ACTIVE missing dark-mode overrides** (paginator.ts:155-171). Add `dark:bg-{color}-700 dark:hover:bg-{color}-600` etc.
  - **PAGE_BUTTON_ACTIVE uses raw `text-white`/`text-black`** — switch to `text-on-{role}`.
  - **`size-3.5` at xs** is a half-step icon — must carry an inline comment per the project's icon-scale convention (paginator.ts:275). Add `// half-step: xs paginator icons fit between size-3 and size-4`.
  - **`min-w-7/8/9/10/11`** are non-canonical Tailwind values BUT they are valid `min-width` utilities. They serve to make page buttons square. Keep, but document.
  - `disabled:opacity-50` is used (paginator.ts:255, 260, 261). The project convention says paginator disabled buttons typically use `disabled:opacity-30 disabled:cursor-default`. Update to align (this is explicitly called out as the paginator-specific convention in the project rules).

## Accessibility
- ARIA roles/attributes:
  - Root: `role="navigation"` with `aria-label` (paginator.ts:414-417) — correct landmark.
  - Numbered page buttons: `aria-current="page"` on the active button (paginator.html:228-243). `aria-label="Go to page N"` / `aria-label="Page N, current page"` for ATs (paginator.html:229-233).
  - Prev/Next/First/Last buttons: `aria-label` from labels (paginator.html:113, 150, 180, 268, 298, 334).
  - Ellipsis: `aria-label="More pages"` with a hidden glyph (paginator.html:210-215). Correct.
- Keyboard support: ArrowRight/Left/Home/End across the focusable navigation items inside the nav group (paginator.ts:817-855). Uses a `data-tw-paginator-focusable` attribute to discover items.
- CDK a11y utilities: `LiveAnnouncer` for page changes (paginator.ts:884-893). Announcement template configurable via `labels.announcement`. Excellent.
- Focus management on pagination: focus is NOT moved when a page button is clicked. Consumer's parent table/list should handle "focus first item" if needed. Document.
- AXE risks: none obvious. The link-mode anchors strip `href` and apply `aria-disabled="true"` when disabled — correct pattern. Ellipsis `aria-label="More pages"` is generic; some ATs might prefer "More pages, button is non-interactive" — but the surrounding text gives context.
- Findings:
  - **`role="navigation"` only when `shouldRender()` is true** (paginator.ts:414). Verify that the empty/hidden states don't leave a stray landmark.
  - **Keyboard nav uses `document.activeElement`** (paginator.ts:830). This is a global lookup; if the paginator is inside a portal or shadow root, this may misfire. For now, acceptable.
  - **`disabled:opacity-50` vs project convention** — see Styling Findings above.
  - **No focus trap** — by design. Paginator is a navigation landmark, not a modal.
  - **Live-announce on initial render is suppressed** via `_initialized` flag (paginator.ts:713,751). Verified by `should not announce on initial render` spec (paginator.spec.ts:684-695).
  - Per-page button `aria-label` includes both the page number AND the current state — good for ATs.

## Tests
- Spec file: yes — paginator.spec.ts (828 lines).
- Coverage breakdown:
  - Pure helper: `buildPaginationRange` covered with 10 cases — excellent.
  - Rendering: roles, default labels, nav buttons, page buttons, empty state — covered.
  - Pagination math: totalPages, page info, page-change updates — covered.
  - Clamping: out-of-bounds page, zero page, shrinking totalItems — covered.
  - Interactions: next/prev/first/last/page click — covered.
  - Disabled state: blocks clicks, disables all buttons — covered.
  - Variants: type=basic, no first/last, no page-info, with page-size selector, empty options, page-size reanchor — covered.
  - Accessibility: aria-current, aria-label per button, ellipsis aria-label, keyboard ArrowRight/Home, LiveAnnouncer announce — covered.
  - Link mode: anchor render, disabled href stripping, pageChange emission — covered.
  - Labels/i18n: merge with defaults, `{page}` substitution — covered.
  - Content projection: page-info template, empty template, page-size template — covered.
- Vitest issues: none. `vi.spyOn` on `LiveAnnouncer` — clean.
- Findings:
  - **No AXE check** test.
  - **No End-key navigation** test (Home is covered, End is not).
  - **No `responsive=off`** test — only `responsive=auto` (the default).
  - **No `customAriaLabel` (aliased `aria-label`)** test.
  - **No `pageButtonAriaLabel`** test as a sole label-key — covered indirectly.
  - **Per-color active class assertions** not done — only "renders without errors". Add `expect(activeBtn.className).toContain('bg-primary-600')` at minimum.
  - Spec is otherwise exemplary.

## Gaps & lacks
1. **PAGE_BUTTON_ACTIVE** missing dark-mode overrides AND uses raw `text-white`/`text-black` (P0).
2. **`disabled:opacity-50`** instead of the paginator-specific `disabled:opacity-30 disabled:cursor-default` convention (P1).
3. **19 inputs** exceed the 5-6 cap — either codify a "data-primitive" exception or reshape into config objects (P1).
4. **Three `true`-default booleans** (`showFirstLastButtons`, `showPageInfo`, `hideOnEmpty`) need inline rationale or inversion (P1).
5. **`size-3.5` xs icon** needs an inline comment (P2).
6. **No AXE spec** (P1).
7. **No `pageButton` label slot** — consumers can't customize per-page rendering (P2).
8. **No End-key spec, no `responsive=off` spec, no `customAriaLabel` spec** (P2).
9. **No focus-move on page-change** — by design; document so consumer can wire `cdkFocusInitial` on their target list (P2).
10. Active button **focus-visible** outline is per-color — verify `focus-visible:outline-fg` resolves for `neutral` color (P2).

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Tighten `paginator` to current library conventions: dark-mode + `on-{role}` token migration on the active-page button, conform to the project's disabled-opacity rule for paginator buttons, justify or rename the `true`-default booleans, and either codify the "data primitive" input-count exception or reshape inputs into config objects.

### Tasks
1. **Migrate PAGE_BUTTON_ACTIVE to `text-on-{role}` and add dark-mode overrides**.
   - File(s): `projects/ngx-tw/paginator/paginator.ts:155-171`
   - Why: matches the post-`on-*` token convention and the project's "explicit dark: overrides on color variants" rule. Currently uses raw `text-white`/`text-black` and no `dark:` overrides.
   - Change: rewrite each entry. Example for primary: `'bg-primary-600 dark:bg-primary-500 text-on-primary hover:bg-primary-700 dark:hover:bg-primary-600 border border-primary-600 dark:border-primary-500 focus-visible:outline-primary-500'`. Apply to all 8 colors. For `neutral`, use `text-on-neutral` instead of the bespoke `bg-fg text-surface` pair.
   - Acceptance: dark mode active page renders correctly; consumer `--color-on-primary` overrides flow through.

2. **Align disabled opacity to the paginator convention**.
   - File(s): `projects/ngx-tw/paginator/paginator.ts:255,260,261`
   - Why: project rule says paginator disabled buttons use `disabled:opacity-30 disabled:cursor-default`. Current code uses `disabled:opacity-50`.
   - Change: replace `disabled:opacity-50` with `disabled:opacity-30 disabled:cursor-default` on `pageSizeSelect`, `navButton`, `pageButton` slot definitions. Keep `aria-disabled:opacity-30` for the anchor-link variant.
   - Acceptance: disabled buttons render at 30% opacity with default cursor; specs that assert disabled state still pass.

3. **Reshape inputs into config objects (preferred) OR codify a data-primitive exception**.
   - File(s): `projects/ngx-tw/paginator/paginator.ts:420-484`, `.claude/CLAUDE.md`
   - Why: 19 inputs exceeds the cap. Two paths:
     - **Reshape (preferred)**: collapse 6 display-toggle inputs into a `display` config object `{ firstLast?, pageInfo?, pageSizeSelector?, hideOnEmpty?, hideOnSinglePage?, responsive? }`. Collapse `siblingCount` + `boundaryCount` into a `range = { siblingCount?, boundaryCount? }` object. This drops the count to ~8 inputs total.
     - **Codify exception**: add paginator to the "data primitives" exception list with the rationale "paginator surfaces are inherently wide because they expose display toggles, range configuration, layout, color, size, type, AND labels/linkFactory simultaneously." Update `.claude/CLAUDE.md` and `feedback_input_count_data.md`.
   - Recommend the codify-exception path for v1 (preserves consumer API) and schedule a v2 reshape for the next major.
   - Acceptance: chosen path documented; if reshape is taken, demo and tests updated; if exception is taken, the CLAUDE.md addition is merged.

4. **Add inline justifications or invert `true`-default booleans**.
   - File(s): `projects/ngx-tw/paginator/paginator.ts:450-466`
   - Why: project codifies that `true`-default booleans need inline JSDoc rationale or must be inverted. Currently `showFirstLastButtons`, `showPageInfo`, and `hideOnEmpty` default to `true` without rationale.
   - Change: option A — add a one-line rationale to each JSDoc (e.g. `/** When true, renders jump-to-first/last buttons. Defaults to true because first/last navigation is the dominant expectation; opt-out via false. */`). Option B — invert to `hideFirstLastButtons`, `hidePageInfo`, and keep `hideOnEmpty` since the name carries its own rationale.
   - Acceptance: each `true`-default carries an explanation; reviewers do not have to ask "why default true?".

5. **Add inline comment on the half-step xs icon**.
   - File(s): `projects/ngx-tw/paginator/paginator.ts:275`
   - Why: project rule requires every `size-3.5` use to carry a one-line rationale.
   - Change: add `// half-step: xs paginator icons fit between size-3 and size-4 to align with px-2/py-1 button height` above the `icon: 'size-3.5'` line.
   - Acceptance: rule satisfied.

6. **Add `pageButton` label slot for per-page label customization**.
   - File(s): `projects/ngx-tw/paginator/paginator.ts:38-44`, `paginator.html:236-251`
   - Why: consumers may want to render page buttons as custom badges, icons, or rich content.
   - Change: extend `TwPaginatorLabelSlot` with `'pageButton'`. In the template, look up `labelTemplateFor('pageButton')` and pass `{ ...labelContext, $implicit: { ...ctx, isActive, pageNumber } }`. Document a richer typed context `TwPaginatorPageButtonContext`.
   - Acceptance: a consumer can render a custom page button via `*twPaginatorLabel slot="pageButton"`.

7. **Backfill spec coverage: End-key, `responsive=off`, `customAriaLabel`, active-class assertions, AXE**.
   - File(s): `projects/ngx-tw/paginator/paginator.spec.ts`
   - Why: gaps identified in Tests/Findings.
   - Change: add specs for each. Use `expect(navGroup.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', ... })))`. Add `it('passes AXE checks', …)` per pattern.
   - Acceptance: all new specs pass.

### Out of scope
- Replacing the internal `<select>` with `tw-select` (would couple entry points; keep the structural-directive escape hatch).
- A "compact" mode that shrinks all controls (the existing `size` axis covers it).
- Adding a `[total]` shorthand input (already handled by `totalItems`).

### Verification
- Build: `npm run build:lib`
- Test: `npm test`
- Visual check: `http://localhost:4600/paginator`
- A11y: `npm run e2e:a11y` or AXE in spec

## Priority
**P1** — Paginator is the strongest component in this batch: rich event payload, type-safe label slots, comprehensive spec, proper `LiveAnnouncer` integration. The remaining work is alignment with library conventions (dark mode, `on-{role}` tokens, disabled-opacity rule, input-count policy). No critical defects.
