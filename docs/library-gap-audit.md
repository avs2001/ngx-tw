# ngx-tw — Missing Component Audit

> **Date:** 2026-06-01
> **Baseline:** 52 shipped components (see inventory below).
> **Method:** Multi-agent audit benchmarking the shipped surface against Angular
> Material (the stated quality bar), shadcn/ui + Radix (the Tailwind idiom this
> library follows), then PrimeNG, Ant Design, Mantine, Tailwind-native kits
> (Flowbite / DaisyUI / Bootstrap) and Angular kits (Spartan/ng, Taiga UI,
> Nebular, NG-ZORRO) for breadth. 107 raw candidates → 49 deduped →
> capability-verified **by reading the existing source** that might cover each
> (not by name-matching) → completeness-gated against known-standard components.

Because each candidate was confirmed against source, aliases of existing
components are **not** flagged: `sheet` ≈ drawer, `split` ≈ resizable,
`combobox` ≈ autocomplete, `menu` ≈ context-menu, `segmented-control` ≈
toggle-group (single-select), `badge` ≈ tag/chip, `stat` ≈ statistic,
`paginator` ≈ pagination, `empty-state` ≈ result, etc.

---

## Inventory at time of audit (52 components)

accordion, alert, aspect-ratio, avatar, badge, breadcrumbs, button, calendar,
card, carousel, checkbox, code-block, collapsible, combobox, command-palette,
date-picker, date-range-picker, dialog, empty-state, file-upload, flip-card,
form-field, icon, input, item, menu, number-input, paginator, popover,
progress-bar, radio, segmented-control, select, separator, sheet, skeleton,
slider, sort, spinner, split, stat, stepper, switch, tab-nav, table, tabs,
tags-input, textarea, time-picker, timeline, toast, tooltip.

_(plus `core` shared types and `theme` CSS — not components.)_

---

## Tier 1 — Clear gaps (shipped by the library's own benchmarks: Angular Material and/or shadcn + Radix)

| Component | What it is | Shipped by |
|---|---|---|
| **tree** | Hierarchical collapsible tree-view: expand/collapse, tri-state checkbox nodes, roving-tabindex nav. `@angular/cdk/tree` is the ready-made primitive. | Material, PrimeNG, Ant, Mantine, all Angular kits |
| **listbox** | Always-visible focus-managed selection list (single/multi), `aria-selected`, roving focus — Material's `MatSelectionList` / `cdkListbox`. Listbox semantics currently live **only** inside the non-exported `select` overlay. | Material, PrimeNG, Angular kits |
| **toggle** | Single two-state button (`aria-pressed`) — the bold/italic-style control. | shadcn, Radix, Material (button-toggle), PrimeNG, Angular kits |
| **toggle-group** | Multi-select cluster of toggles (`role="group"`, array value). Distinct from `segmented-control`, which is hard single-select (`role="radiogroup"`, scalar value). | Material, Radix, shadcn |
| **toolbar** | Action container as a single tab stop with arrow-key roving (`role="toolbar"`). | Material, Radix, PrimeNG |
| **sidebar** | Non-modal app-shell nav rail: inline layout participant, collapses to icon rail, overlay on mobile. Distinct from `sheet` (modal overlay drawer). | shadcn, Material (sidenav) |
| **menubar** | Persistent app menu bar (`role="menubar"`), horizontal roving across top-level triggers, each opening a vertical submenu. | shadcn, Radix, PrimeNG, Angular kits |
| **navigation-menu** | Primary nav bar with hover/focus-activated mega-menu panels and a shared animated viewport. | shadcn, Radix |
| **hover-card** | Non-modal pointer-interactive preview card with open/close intent delays (link/user previews). | shadcn, Radix, Mantine, Angular kits |
| **input-otp** | Segmented OTP/PIN entry: fixed-length cells with auto-advance, backspace orchestration, paste distribution. | shadcn, Radix, PrimeNG, Mantine, Angular kits |
| **button-group** | Visually attaches a row of buttons into one cluster (shared corners, orientation, split-button / addon composition). | shadcn, Tailwind kits, Angular kits |
| **scroll-area** | Custom thin cross-browser overlay scrollbars over a `CdkScrollable` viewport. | shadcn, Radix, Mantine, Spartan, NG-ZORRO |
| **kbd** | Inline key-cap indicator for a key or combo (⌘K). | shadcn, Radix, Mantine, Tailwind kits |
| **indicator** | Wrapper that overlays a status dot / count badge at a configurable corner of any child. | Mantine, Tailwind kits, Material (matBadge) |

## Tier 2 — Widely-expected across the broader ecosystem

| Component | What it is | Shipped by |
|---|---|---|
| **rating** | Star (or custom glyph) score control: hover preview, half-steps, read-only mode. (near-universal) | PrimeNG, Ant, Mantine, Tailwind kits, Angular kits |
| **color-picker** | Saturation/hue/alpha surface + swatches + hex/rgb entry, as a form control. | PrimeNG, Ant, Mantine, Angular kits |
| **data-list** | Read-only description list of term/definition (label/value) pairs for record detail views. | Radix, Ant, Angular kits |
| **tree-select** | Dropdown whose options form a tree; single/multi with branch expand + parent-child cascade. | Ant, Mantine |
| **cascader** | Multi-level dependent select (country→state→city) emitting a path value. | Ant, Angular kits |
| **transfer** | Dual-listbox shuttle to move items between source/target with search + bulk move. | Ant, Angular kits |
| **anchor** | Scrollspy / table-of-contents: active-section highlight + smooth-scroll on click. | Ant, Mantine, Angular kits |
| **input-mask** | Directive enforcing a character-by-character format mask (phone/date/card) with caret mgmt. | PrimeNG, Mantine |
| **password** | Masked input with show/hide toggle + optional strength meter (composes `twInput`). _Borderline — could be a feature of `input`._ | PrimeNG, Mantine |
| **image** | Display primitive: lazy load, placeholder/error fallback, object-fit, click-to-zoom lightbox. | Ant, Mantine |

## Tier 3 — In-scope but niche / fewer sources

| Component | What it is | Shipped by |
|---|---|---|
| **split-button** | Primary action joined to a dropdown trigger of secondary actions, shared seam + ARIA. | PrimeNG |
| **tree-table** | Table whose rows form an expandable parent/child hierarchy (vs. the existing flat detail-row expansion). | PrimeNG |
| **loading-overlay** | Scrim + centered spinner that blocks a relative container while async work runs (`aria-busy`). | Mantine |
| **nav-link** | Vertical nav item (link/button) with active state, icon + label + description, nestable children — the building block for `sidebar`. | Mantine |
| **spoiler** | Clips content past a height threshold; shows a show-more/less toggle only when it overflows. | Mantine |
| **overflow-list** | Responsive row that collapses items that no longer fit into an overflow menu (ResizeObserver). | Mantine |
| **highlight** | Wraps matched substrings in `<mark>` for search-term emphasis (pipe/directive). | Mantine |
| **time-grid** | Grid of selectable discrete time slots from a min/max range + interval. | Mantine |

---

## Not new components — variants/features of existing components

Surfaced in the sweep but verification showed each is better added as a
variant/feature of an existing component, **not** a new one:

| Candidate | Fold into | Note |
|---|---|---|
| circular-progress | `progress-bar` | ring variant |
| input-group | `form-field` | prefix/suffix addons |
| multiselect | `select` | model already supports multi internally |
| float-button (FAB) | `button` | fixed-position variant |
| icon-button | `button` | square icon-only variant |
| copy-button | `button` | copy-to-clipboard affordance |
| month-year-picker | `calendar` | view-mode variant |
| list-group | `item` | grouped/bordered list layout |
| popconfirm | `popover` | confirm-in-popover preset |
| avatar-group | `avatar` | stacked/overlapping layout |

**Already fully covered (no action):** `chip` → `badge`, `context-menu` → `menu`
(ships `ContextMenuTriggerDirective`), `list` → `item`, `date-time-picker` →
`date-picker`, `drawer` → `sheet`.

---

## Excluded as out-of-scope

`tour`/onboarding, `color-swatch`, `affix` (sticky), `navbar` (Tailwind-trivial),
and a bare `overlay` scrim (pure Tailwind utility; its behavioral form is the
in-scope `loading-overlay`). Also excluded by the library's scope: charts/dataviz,
rich-text/WYSIWYG editors, maps, org-charts, terminals, watermarks, QR codes,
gauges/knobs, video/audio players, markdown renderers, full event-calendar/scheduler.

---

## Confidence notes

- **Sanity gate passed:** the four bellwether components the audit was calibrated
  to surface — `tree`, `rating`, `color-picker`, `input-otp` — all landed in
  Tiers 1–2, and no out-of-scope noise (org-chart/terminal/watermark) reached the
  list. Good signal the benchmark depth and scope filter were calibrated correctly.
- **High confidence:** Tiers 1–2.
- **Lower confidence (single-source; reasonable to treat as variants or
  out-of-scope):** the Tier 3 items — `split-button`, `tree-table`, `spoiler`,
  `overflow-list`, `highlight`, `time-grid`, `nav-link`. `password` is the most
  borderline Tier-2 keep (arguably an `input` feature).
