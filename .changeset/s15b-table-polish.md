---
"ngx-tw": minor
---

Table polish — token hygiene, internal safety nets, and an audit false-positive verified.

**Token hygiene (theme + table):**

- Adds three sticky-table shadow tokens to `theme/_semantic.css` that ride `--color-border` (so they auto-adapt to dark mode):
  - `--shadow-table-sticky: 0 1px 0 0 var(--color-border)` — hairline divider under a sticky `<thead>`.
  - `--shadow-table-sticky-cell-start: 1px 0 0 0 var(--color-border)` — right-edge hairline on a `sticky-start` cell.
  - `--shadow-table-sticky-cell-end: -1px 0 0 0 var(--color-border)` — left-edge hairline on a `sticky-end` cell.
  Tailwind v4 auto-generates the matching `shadow-table-sticky*` utilities.
- Replaces three arbitrary-value escape hatches in `projects/ngx-tw/table/table.ts` with the new tokens:
  - The striped + sticky-header compound variant now applies `[&>thead>tr>th]:shadow-table-sticky`.
  - `STICKY_START_SHADOW` / `STICKY_END_SHADOW` constants now reference the token utilities directly.
- Snaps the loading-overlay `backdrop-blur-[1px]` to the codified `backdrop-blur-sm` (≈ 4px). The haze is now visually present rather than imperceptible; consumers relying on a near-zero blur should override via the `[slot='loading']` content projection.

**Accessibility:**

- The Batch 8 audit flagged a `data-label` "double-read" on stack-mode `<th>` elements. **Verified false positive.** The table template renders `<th>` only inside `<thead>`, and stack mode applies `[&>thead]:max-{bp}:hidden` — `display: none` removes the element from the AT tree. The `::before` content with `attr(data-label)` lives on the `<td>` and is the only label rendered below the breakpoint; modern AT (VoiceOver, NVDA, JAWS) do not announce CSS-generated pseudo content by default per ARIA 1.2. No code change required.

**Internal:**

- `INTERACTIVE_TAGS` (used by `handleRowClick` to suppress row-click bubbling) now includes `'OPTION'` so a click on an `<option>` inside a row `<select>` no longer triggers `rowClicked`. `'DETAILS'` is intentionally not added — the clickable element inside a `<details>` widget is `<summary>`, which is already in the set.
- The loading-announcement `effect()` now carries a justification comment explaining why label / row reads are wrapped in `untracked()` — to fire one announcement per loading-state transition rather than re-firing on incidental label or row mutations. Behaviour unchanged.

**Migration:** none. All changes are internal token hygiene plus a behaviour-preserving guard. Consumers overriding the sticky-shadow look via the deep `[&>thead>tr>th]:shadow-[…]` selectors should migrate to overriding `--shadow-table-sticky` (or wrap with `!shadow-…`). The loading overlay's blur intensity is the only user-visible change.
