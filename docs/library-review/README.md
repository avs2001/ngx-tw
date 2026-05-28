# ngx-tw — Production-Grade Library Audit

This directory contains a per-component review of every public surface in `projects/ngx-tw`, plus the `core` and `theme` foundations. The audit was scoped against the rules codified in `.claude/CLAUDE.md` and benchmarks the library against Angular Material's quality bar.

40 components + `core` + `theme` = **42 review documents**.

---

## How to use these docs

- One markdown file per component lives at `docs/library-review/<component>.md`.
- Every file ends with a **`Concrete recommendations (deep-dive prompt body)`** section. That block is structured to be pasted, as-is, into a fresh Claude session as the prompt for fixing that component. It includes goal, tasks (with file paths + line ranges + acceptance criteria), out-of-scope items, verification steps, and priority.
- Each doc carries a single **P0 / P1 / P2** priority for sequencing.
- Cross-cutting issues (theme contrast, token migration, `ErrorStateMatcher` adoption, etc.) are listed below under [Cross-cutting themes](#cross-cutting-themes). Fix these once and the per-component recommendations shrink.

---

## Priority summary

| Tier | Count | Components |
|---|---|---|
| **P0** — ships an a11y bug, contract violation, or non-functional surface | 10 | `alert`, `date-range-picker`, `dialog`, `popover`, `slider`, `split`, `tabs`, `theme`, `toast`, `tooltip` |
| **P1** — feature gap, cross-cutting inconsistency, or undocumented public-API leak | 21 | `avatar`, `badge`, `calendar`, `checkbox`, `collapsible`, `core`, `date-picker`, `flip-card`, `form-field`, `icon`, `item`, `menu`, `paginator`, `radio`, `segmented-control`, `select`, `sort`, `switch`, `tab-nav`, `table`, `time-picker` |
| **P2** — polish, JSDoc, test breadth, minor consistency drift | 11 | `accordion`, `button`, `card`, `code-block`, `command-palette`, `input`, `progress-bar`, `separator`, `skeleton`, `spinner`, `stepper` |

---

## Component index

> The 1-line "top issue" is what tips the priority. Each doc enumerates the full set of findings.

### Foundations

| Component | Priority | Top issue |
|---|---|---|
| [`theme`](./theme.md) | **P0** | `on-info` / `on-error` / `on-neutral` against `bg-{role}-500` likely fail WCAG-AA contrast; no `forced-colors` rule for Windows high-contrast |
| [`core`](./core.md) | **P1** | Shared `TwOrientation` / `TwLabelPosition` / `TwArrowDirection` / `TwOverlayPosition` types are duplicated across components instead of living here; orphan `form-reset.ts` helper not exported |

### Primitives

| Component | Priority | Top issue |
|---|---|---|
| [`button`](./button.md) | P2 | Solid variants still hardcode `text-white`/`text-black` instead of the new `text-on-{role}` tokens |
| [`badge`](./badge.md) | **P1** | Dismiss button hit-target (`size-4`) is below WCAG 2.5.5 24px minimum on xs/sm/md; English-only `"Dismiss"` label |
| [`separator`](./separator.md) | P2 | Tests miss full color matrix and explicit `weight='thin'` toggle; `border-t-[3px]` arbitrary value lacks justification comment |
| [`icon`](./icon.md) | **P1** | 8 inputs exceeds the 5–6 cap; icon is explicitly NOT exempt — reshape via config-object grouping for SVG author config |
| [`avatar`](./avatar.md) | **P1** | `AvatarComponent` has 7 inputs (no exception applies); initials don't auto-uppercase; group label hardcoded English |
| [`skeleton`](./skeleton.md) | P2 | Hardcoded English `"Loading"`; wave-animation gradient uses fixed white `rgba(255 255 255 / 0.5)` — wrong on dark themes |
| [`spinner`](./spinner.md) | P2 | Documentation polish only (SVG arc magic numbers, `size-[1em]` arbitrary value lacks inline justification) |

### Layout & content

| Component | Priority | Top issue |
|---|---|---|
| [`card`](./card.md) | P2 | Missing `hover:shadow-md` on elevated variant violates the codified hover pattern |
| [`flip-card`](./flip-card.md) | **P1** | Invisible face not `aria-hidden`; `role="region"` in manual mode lacks accessible name; likely duplicate `flippedChange` emission |
| [`item`](./item.md) | **P1** | `text-base` on `lg` title is uncodified in typography table; no `transform: booleanAttribute`; nested-interactive trap when consumers project a button into trailing slot |
| [`alert`](./alert.md) | **P0** | `role="alert"` + `LiveAnnouncer.announce` causes double announcement; solid variants still raw `text-white`/`text-black`; soft/outline variants lack `dark:` overrides |
| [`code-block`](./code-block.md) | P2 | Three hardcoded English strings ("Copy code", "Copied", "Copied to clipboard") with no override inputs; inline `styles:` block bypasses "no component CSS" rule |

### Overlays

| Component | Priority | Top issue |
|---|---|---|
| [`tooltip`](./tooltip.md) | **P0** | Duplicate `aria-describedby` wiring (manual + `AriaDescriber`) → double announce; `text-white` on `bg-success-700` / `bg-warning-700` fails WCAG AA |
| [`popover`](./popover.md) | **P0** | Missing `aria-modal="true"` despite focus trap; no `TwPopoverTitleDirective` so heading content can't drive `aria-labelledby`; subscription leak on position-change observers |
| [`menu`](./menu.md) | **P1** | `MenuComponent` lacks `ariaLabel`/`ariaLabelledBy` — icon-only triggers ship unlabelled menus; CDK menu position/offset not exposed |
| [`dialog`](./dialog.md) | **P0** | `ariaModal` has no default in `TwDialogConfig` — modal dialogs ship without `aria-modal="true"` unless every caller sets it; `actionSectionCount` is dead code |
| [`toast`](./toast.md) | **P0** | No `dark:` overrides on any severity; `LiveAnnouncer` + `role="alert"`/`role="status"` both fire → double-announcement; `icon: TemplateRef` is in public type but silently dropped at runtime |

### Navigation

| Component | Priority | Top issue |
|---|---|---|
| [`tabs`](./tabs.md) | **P0** | `<button>` nested inside `<button>` for closable tabs (invalid HTML); per-color active class maps missing `dark:` overrides |
| [`tab-nav`](./tab-nav.md) | **P1** | Per-color active class maps missing `dark:` overrides; no `LiveAnnouncer` integration (parity gap vs `tabs`) |
| [`segmented-control`](./segmented-control.md) | **P1** | `FILLED_ACTIVE` uses raw `text-white`/`text-black` instead of `text-on-{role}` tokens; dead-code `FocusMonitor` subscription |
| [`paginator`](./paginator.md) | **P1** | `PAGE_BUTTON_ACTIVE` missing `dark:` overrides AND raw `text-white`/`text-black`; 19 inputs exceed cap and don't fit any codified exception |
| [`sort`](./sort.md) | **P1** | `aria-sort` on host + `role="button"` on inner container split may confuse ATs; `ARROW_ACTIVE_COLOR` missing `dark:` overrides |

### Form controls

| Component | Priority | Top issue |
|---|---|---|
| [`form-field`](./form-field.md) | **P1** | No `size` axis — xs/sm/lg/xl density unreachable (only component without one); `FormFieldControl` contract lacks `setLabelledByIds` pushdown |
| [`input`](./input.md) | P2 | No size axis (couples with form-field gap); test gaps on signal-forms path and `AutofillMonitor` |
| [`switch`](./switch.md) | **P1** | No `FormFieldControl` interop and no `errorState`/`aria-invalid`/`ErrorStateMatcher` — a required switch in a reactive form cannot paint invalid; raw `text-white`/`text-black` in `CHECKED_ICON_COLOR` |
| [`checkbox`](./checkbox.md) | **P1** | Same trio as switch: no form-field interop, no error state, raw `text-white`/`text-black`; `rounded-[3px]` arbitrary radius violates codified scale |
| [`radio`](./radio.md) | **P1** | No `TW_ERROR_STATE_MATCHER` integration; no `FormFieldControl` implementation — group cannot sit inside `<tw-form-field>` chrome |
| [`select`](./select.md) | **P1** | `errorStateSignal` + `_setErrorState` exist but no `NgControl` injection runs the matcher (manual escape hatch only); clear-button square target `size-5` fails WCAG 2.2 24×24 |
| [`slider`](./slider.md) | **P0** | `required` input declared but never wired to `aria-required` — dead input; thumb hit-target at xs/sm/md fails WCAG 2.5.8; no vertical orientation; no `ErrorStateMatcher`/`FormFieldControl` |
| [`progress-bar`](./progress-bar.md) | P2 | Already reshaped correctly (6 inputs); label uses `text-xs` rather than codified `text-sm font-medium`; dev-mode warning uses `effect()` instead of `afterNextRender` |

### Disclosure, layout & data

| Component | Priority | Top issue |
|---|---|---|
| [`accordion`](./accordion.md) | P2 | Keyboard nav reimplements `FocusKeyManager` via `document.activeElement` (shadow-DOM unsafe); missing `aria-multiselectable` on multi-mode host |
| [`collapsible`](./collapsible.md) | **P1** | `CollapsibleComponent` has 7 inputs (no exception applies) — reshape into `display` config object; `tabindex=0` is unconditional even when `disabled=true` |
| [`table`](./table.md) | **P1** | No `aria-sort` plumbing on column headers despite new Sort directive shipping; selection-checkbox column rendering is deferred — slot exists but no `<input>` emitted; row-level `aria-selected` missing |
| [`split`](./split.md) | **P0** | NO gutter, NO keyboard, NO pointer-drag — all the `keyboardStep`/`disabled`/`storageKey`/`rtl`/`collapseChange`/per-pane `sizeChange` inputs are dead code; demo route absent |
| [`stepper`](./stepper.md) | P2 | xl indicator uses `size-12`, exceeding both codified glyph (`size-10`) and square-interactive (`size-9`) caps; `showError`/`headerInteractive` default `true` without codified justification |
| [`command-palette`](./command-palette.md) | P2 | Search `<input role="combobox">` has no `aria-label`; `description` and `icon` are orphan fields on `CommandPaletteItemDirective` |

### Date & time

| Component | Priority | Top issue |
|---|---|---|
| [`calendar`](./calendar.md) | **P1** | Selection commits silently for AT users — `CalendarIntl` announcement strings defined but never spoken from `commitValue`; phase-placeholder API leaks (`opened`/`closed`/`renderedMonthsCount` never emit) |
| [`date-picker`](./date-picker.md) | **P1** | Imports deprecated `TwCalendarView`/`TwDateFilter` aliases at four call sites (slated for removal); no `locale` input; no `cellTemplate`/`dateClass` forwarding to embedded calendar |
| [`date-range-picker`](./date-range-picker.md) | **P0** | `aria-hidden="true"` on an interactive `<button>` — WAI-ARIA violation; calendar range-mode knobs (`minRangeLength`, `maxRangeLength`, `allowSingleDayRange`, …) not exposed on the picker |
| [`time-picker`](./time-picker.md) | **P1** | `role="radiogroup"` with `aria-pressed` (should be `aria-checked`); spinbutton fields use the menu-item carve-out focus pattern (policy restricts it to `menuitem*` roles) |

---

## Cross-cutting themes

These are findings that appear in 3+ components. Fixing them once compresses the per-component work. Numbered roughly in suggested execution order.

### 1. WCAG-AA contrast on `on-{role}` tokens — **P0**

**Affected tokens:** `--color-on-info`, `--color-on-error`, `--color-on-neutral` (all `white`) paired with `bg-info-500` / `bg-error-500` / `bg-neutral-500` likely sit at ~3.5–4.0:1 — below the 4.5:1 body-text threshold. `on-success` and `on-warning` already use `-950` foregrounds because their `-500` fills are too light; the same fix probably applies to info / error / neutral or the fills should be deepened.

**Components downstream:** every solid-fill variant — `button`, `badge`, `alert`, `tooltip` (success/warning), `segmented-control` filled, `paginator` active page, `stepper` indicator, `switch` checked icon, `checkbox` checked icon, calendar selected cell.

**Fix shape:** run a contrast audit on the seven `{role}-500` × `on-{role}` pairs in `theme/_semantic.css`; for each pair below 4.5:1, either flip `on-{role}` to `-950` or step the role's `-500` shade darker (and reshade dependent components).

### 2. `text-on-{role}` token migration is incomplete — **P0 / P1**

Commit `e952a33` added `on-{role}` tokens, but several components still hardcode `text-white` / `text-black` in their solid-fill variants. **Affected:** `button` (P2), `badge` (P1), `alert` (P0), `tooltip` (P0), `switch` `CHECKED_ICON_COLOR` (P1), `checkbox` `SOLID_ICON` (P1), `segmented-control` `FILLED_ACTIVE` (P1), `paginator` `PAGE_BUTTON_ACTIVE` (P1). Should be done in lockstep with (1) — once tokens pass contrast, this is a mechanical rename.

### 3. Dark-mode parity gap on color variants — **P0 / P1**

Project convention is explicit `dark:{class}` overrides for per-color styling. The navigation family and `toast` ship NO dark variants on their color maps. **Affected:** `tabs`, `tab-nav`, `paginator`, `sort` `ARROW_ACTIVE_COLOR`, `toast` (all severities), `alert` (soft + outline only). Fix as one PR per family for review economy.

### 4. Library-wide `ErrorStateMatcher` adoption gap — **P1**

`TW_ERROR_STATE_MATCHER` from `ngx-tw/core` is currently consumed only by `input` (fully) and `select` (half-implemented — token exists but no `NgControl` injection runs it). **Missing entirely:** `switch`, `checkbox`, `radio`, `slider`, `calendar`. A required switch in a reactive form has no way to paint `aria-invalid`. Fix as one cross-cutting form-control PR: mirror `input.ts:154-162, 250-258` (inject `NgControl`/`NgForm`/`FormGroupDirective`, expose `errorStateMatcher` input, derive `errorState` with revision signals).

### 5. `FormFieldControl` DI wiring missing on non-input form controls — **P1**

Only `input` and `select` extend `FormFieldControl` and provide under `TW_FORM_FIELD_CONTROL`. `switch`, `checkbox`, `radio`, `slider` cannot sit inside `<tw-form-field>` for label/hint/error chrome despite being form controls. The `FormFieldControl` contract itself also lacks an `aria-labelledby` pushdown method (see `core` review). Fix in the same form-control PR as (4).

### 6. Inline `label`/`description` inputs duplicate content projection — **P1**

`switch` and `checkbox` accept both inline `label`/`description` inputs AND `ng-content` slots — and render BOTH simultaneously today. Gate the input-driven text via `contentChild` queries so projection wins, or pick one pattern and remove the other.

### 7. Form-field has no `size` axis — **P1**

The only component without a `size` input. Today every consumer is locked at `md` density. Add an `xs|sm|md|lg|xl` axis to `form-field` (and the bundled `input`) before density variants ship.

### 8. i18n hardcoded English labels — **P1**

`alert` ("Dismiss"), `badge` ("Dismiss"), `flip-card` dismiss, `code-block` ("Copy code"/"Copied"/"Copied to clipboard"), `avatar` group ("Avatar group"), `skeleton` ("Loading"), `time-picker` (Hours/Minutes/AM/PM), `date-range-picker` ("Open calendar"/"Clear date"), `command-palette` search input. Either ship one `*Intl` service per family (calendar already has `CalendarIntl`) or introduce a library-wide `labels` config token.

### 9. Visual primitives exceed input cap — **P1**

`Icon` (8 inputs) and `Avatar` (7 inputs) violate the 5–6 cap. CLAUDE.md explicitly excludes visual primitives from the codified exception list. Reshape each with config-object grouping: `IconComponent` → bundle SVG author config (`strokeWidth`/`absoluteStrokeWidth`/`viewBox`) into one object; `AvatarComponent` → fold `rounded` + `status` into a `decoration` object or drop `rounded` to a `square` boolean.

### 10. `CollapsibleComponent` exceeds input cap — **P1**

7 inputs and not on the codified exception list. Reshape into a `display` config object (similar to `progress-bar`'s recent reshape).

### 11. Hand-rolled keyboard navigation — **P1**

Each of `tabs`, `tab-nav`, `segmented-control`, `paginator`, `accordion`, `collapsible` reimplements Arrow/Home/End walking. `accordion` and `collapsible` walk against `document.activeElement` — shadow-DOM unsafe. Migrate all six to CDK `FocusKeyManager` for consistency, typeahead, and shadow-DOM safety.

### 12. Shared types should lift to `ngx-tw/core` — **P1**

`TwOrientation`, `TwLabelPosition`, `TwArrowDirection`, `TwOverlayPosition`. Currently duplicated as inline literals or local types across `tabs`, `segmented-control`, `separator`, `split`, `popover`, `tooltip`, `menu`, multiple form controls. `popover` and `tooltip` even share byte-for-byte `ArrowDirection` + `resolveArrowDirection` + `ARROW_POSITION_CLASSES` copy-pastes.

### 13. `booleanAttribute` coercion inconsistency — **P2**

Only `flip-card` uses `transform: booleanAttribute` on its boolean inputs. Every other component leaves consumers exposed to `[disabled]="''"` (empty string) being treated as `false`. Add `transform: booleanAttribute` consistently across all boolean inputs.

### 14. No `forced-colors: active` rule — **P1**

Windows high-contrast users lose all `--color-*` tokens and get the same blue focus ring as everyone else. `_high-contrast.css` exists but doesn't hook the `forced-colors: active` media query. Codified rule requires deeper contrast for `border-strong`, `fg`, and focus rings.

### 15. Half-step `size-3.5` lacks inline justification — **P2**

Codified rule: half-step decorative `size-3.5` is permitted only for xs-density chevrons and MUST carry a one-line comment explaining why the half-step is needed. `paginator`, `sort`, `badge`, `time-picker` meridiem chevron, `split` chevron all use it without the inline comment. Add the comment or step to `size-3` / `size-4`.

### 16. Deprecated alias cleanup — **P1**

`TwCalendarView` and `TwDateFilter` aliases are still imported by `date-picker` and `date-range-picker` at four call sites total. Slated for removal after Phase 10; this is post-Phase 10 cleanup.

### 17. Universal test-coverage gaps — **P2**

- **AXE assertion** missing from every spec — should land via a shared a11y harness in `core/testing`.
- **`twMerge` consumer-override test** missing universally — every variant doc shows class-merge behavior is critical; only the alert and table specs cover it incidentally.
- **Vitest `fakeAsync`/`tick` violations** — sampled across batches none were found, but several specs still avoid timer testing entirely; switch to `vi.useFakeTimers()` / `vi.runAllTimers()` per the codified rule.

### 18. Pending historical-debt class renames

These are flagged in `.claude/CLAUDE.md` and scheduled in the library fix plan (PR4 / PR6); do not introduce new ones. Listed here for visibility:

- `TwSplit`, `TwSplitPane`, `TwSplitGutter`, `TwSplitPaneHeader` → split rename pass
- `TwCalendarPresets` → calendar rename pass

---

## Suggested execution order

The cross-cutting fixes are grouped to minimize coordination churn. Phases run in this order; later phases assume earlier ones landed.

### Phase 0 — Theme contrast & token hardening (1 PR)
1. **Cross-cutting #1** — contrast audit + fix `on-info` / `on-error` / `on-neutral` pairs.
2. **Cross-cutting #14** — add `forced-colors: active` rule and high-contrast focus-ring override.
3. **Cross-cutting #2** — migrate every remaining `text-white`/`text-black` to `text-on-{role}` tokens (mechanical, requires #1 first).
4. Lift `--duration-*` tokens or remove unused ones (per `core`/`theme` reviews).

### Phase 1 — P0 component bugs (parallel, 1 PR per component)
5. **`alert.md`** — fix double announcement, ship dark variants.
6. **`tooltip.md`** — drop manual `aria-describedby` (keep `AriaDescriber`), fix success/warning contrast.
7. **`popover.md`** — add `aria-modal`, `TwPopoverTitleDirective`, fix subscription leak.
8. **`dialog.md`** — default `ariaModal: true`, drop dead code.
9. **`toast.md`** — dark variants, resolve `LiveAnnouncer` vs `role` duplication, surface `icon: TemplateRef`.
10. **`tabs.md`** — un-nest close button (use a span + click handler or a side-by-side button-group pattern), add dark variants.
11. **`slider.md`** — wire `required` → `aria-required`, scale thumb to `size-6/7/8`, add vertical orientation, integrate `ErrorStateMatcher` / `FormFieldControl`.
12. **`split.md`** — render the gutter, implement keyboard + pointer + persistence + RTL, ship demo route, backfill tests.
13. **`date-range-picker.md`** — remove `aria-hidden` from interactive button, expose calendar range knobs.

### Phase 2 — Cross-cutting form-control rescue (1 PR)
14. **Cross-cutting #4 + #5** — integrate `TW_ERROR_STATE_MATCHER` and `FormFieldControl` DI across `switch`, `checkbox`, `radio`, `slider`, `calendar`. Add `setLabelledByIds` to the `FormFieldControl` contract.
15. **Cross-cutting #6** — disambiguate inline `label`/`description` vs projection in `switch` and `checkbox`.

### Phase 3 — Dark-mode parity (1 PR per family)
16. **Cross-cutting #3** — ship `dark:` overrides on color-variant maps for `tabs`, `tab-nav`, `paginator`, `sort`, `toast`, and the soft/outline variants in `alert`.

### Phase 4 — Keyboard nav modernization (1 PR)
17. **Cross-cutting #11** — migrate `tabs`, `tab-nav`, `segmented-control`, `paginator`, `accordion`, `collapsible` to CDK `FocusKeyManager`.

### Phase 5 — Type & API hygiene (1 PR)
18. **Cross-cutting #12** — lift `TwOrientation` / `TwLabelPosition` / `TwArrowDirection` / `TwOverlayPosition` into `core/types.ts`; replace inline literals across components.
19. **Cross-cutting #13** — add `transform: booleanAttribute` consistently across all boolean inputs.
20. **Cross-cutting #16** — remove deprecated `TwCalendarView`/`TwDateFilter` alias imports from `date-picker` and `date-range-picker`.

### Phase 6 — i18n strategy (1 PR)
21. **Cross-cutting #8** — adopt a library-wide approach: either one `*Intl` service per family (calendar pattern) or a `LABELS_CONFIG` token. Convert all hardcoded English strings.

### Phase 7 — Visual-primitive reshapes (parallel, small PRs)
22. **Cross-cutting #9** — reshape `icon` and `avatar` with config objects to fit the 5–6 cap.
23. **Cross-cutting #10** — reshape `collapsible` with `display` config object.

### Phase 8 — `form-field` density axis (1 PR)
24. **Cross-cutting #7** — add `size` axis to `form-field` and the bundled `input`.

### Phase 9 — Per-component P1 polish (parallel, 1 PR per component)
25. Remaining P1 docs: `avatar`, `badge`, `calendar`, `core`, `date-picker`, `flip-card`, `form-field` (after #24), `icon`, `item`, `menu`, `paginator`, `radio`, `segmented-control`, `select`, `sort`, `switch`, `tab-nav`, `table`, `time-picker`. Each has its own deep-dive prompt body.

### Phase 10 — P2 polish (parallel, 1 PR per component, low priority)
26. `accordion`, `button`, `card`, `code-block`, `command-palette`, `input`, `progress-bar`, `separator`, `skeleton`, `spinner`, `stepper`. JSDoc completion, test breadth, arbitrary-value justification comments, etc.

### Phase 11 — Test harness uplift (1 PR)
27. **Cross-cutting #17** — ship `ngx-tw/testing` with AXE harness, `twMerge` override assertion helper, deterministic timer helpers for Vitest. Add to every spec.

### Phase 12 — Class renames (1 PR each)
28. **Cross-cutting #18** — `TwSplit*` rename pass.
29. **Cross-cutting #18** — `TwCalendarPresets` rename pass.

---

## How to drive each fix

1. Open the relevant `docs/library-review/<component>.md`.
2. Copy the `### Goal`, `### Tasks`, `### Out of scope`, `### Verification` block from "Concrete recommendations (deep-dive prompt body)" into a fresh Claude session.
3. Add a one-line prelude: *"Use the prompt below as the spec for fixing `<component>`. Cite `.claude/CLAUDE.md` for any token / API rules you reference."*
4. Let the session implement, then verify with the listed commands (`npm run build:lib`, `npm test`, demo at `http://localhost:4600/<route>`, `npm run e2e:a11y`).

For cross-cutting fixes (Phases 0–6), the prompt should include the relevant section from this README plus the affected component files; the per-component docs serve as expected-after-state references rather than spec.

---

## Statistics

- **Components reviewed:** 40
- **Foundations reviewed:** 2 (`core`, `theme`)
- **Total docs:** 42
- **P0 issues:** 10 components (24%)
- **P1 issues:** 21 components (50%)
- **P2 issues:** 11 components (26%)
- **Cross-cutting themes identified:** 18

Generated against `.claude/CLAUDE.md` as of branch `develop` (latest commit `f1fdd48`).
