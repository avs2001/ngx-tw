# Resizable Split Pane — Component Requirements

A container that lays out two or more panels along a single axis and lets the user interactively resize them by dragging the divider(s) between them. Sibling components commonly seen in editors, file browsers, IDEs, and dashboards.

This document is the build-time specification. It describes *what* the component does, *how* it must behave, and *what* its public surface looks like. Implementation details (how the drag math is computed, how touch events are normalized, etc.) are suggestions, not mandates, unless explicitly marked **MUST**.

Normative language follows RFC 2119 conventions: **MUST** / **MUST NOT** are hard rules, **SHOULD** / **SHOULD NOT** are strong defaults with justified exceptions, **MAY** is permitted.

---

## 1. Scope and goals

### 1.1 What this component is

A headless-ish, accessibility-first Angular primitive that:

1. Arranges two or more arbitrary content panes along a horizontal or vertical axis.
2. Renders a draggable gutter between each pair of adjacent panes.
3. Lets the user resize adjacent panes by dragging, keyboard, or touch.
4. Respects per-pane minimum and maximum sizes, and total-container constraints.
5. Supports collapsing, snap points, and optional persistence.
6. Works correctly inside nested split panes of either orientation.

### 1.2 What this component is not

- **Not a layout grid.** It is strictly one-dimensional. Two-axis layouts are composed by nesting.
- **Not a docking system.** Panes do not detach, reorder, or float. A separate Dock component may build on this one.
- **Not a carousel, tabbed panel, or accordion.** Panes are all simultaneously visible (or collapsed, but still present in the DOM).

### 1.3 Non-goals

- Virtualized content within panes (panes are plain content projection).
- Animations on resize (resizing is direct-manipulation; transitions are an anti-pattern during drag).
- Server-side sizing logic.

---

## 2. Use cases

| Use case | Shape |
|---|---|
| Sidebar + main | Horizontal, 2 panes, sidebar has min/max, main flexes |
| Three-column editor (file tree / editor / inspector) | Horizontal, 3 panes, outer columns collapsible |
| Top preview + bottom console | Vertical, 2 panes, bottom pane has snap at 40%, collapsible |
| IDE layout | Nested: outer horizontal (tree / middle / inspector), middle is vertical (editor / terminal) |
| Diff viewer | Horizontal, 2 panes, always symmetric (both default 50%, min matching) |
| Split-screen form wizard | Horizontal, 2 panes, fixed left nav, flexible right content |

Every requirement below must hold for every use case in this table.

---

## 3. Public API

The component surface follows ngx-tw composition conventions: a container component plus projected child components/directives. Colors and tokens follow the library's semantic palette; no raw Tailwind palette classes appear in the default styling.

### 3.1 Anatomy

```
<tw-split>                    ← container; owns orientation, sizing state, gutter rendering
  <tw-split-pane>             ← a single pane; declares its own size constraints
    …projected content…
  </tw-split-pane>
  <tw-split-pane>…</tw-split-pane>
  <tw-split-pane>…</tw-split-pane>
</tw-split>
```

Gutters are rendered **by the container**, between adjacent panes. Consumers do not author `<tw-split-gutter>` manually in the normal case, though a `twSplitGutter` projection slot **MAY** be provided for heavily customized gutter content (see § 3.5).

### 3.2 `TwSplit` — container component

**Selector:** `tw-split`

**Inputs:**

| Name | Type | Default | Description |
|---|---|---|---|
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Axis along which panes are laid out. Horizontal = side-by-side; vertical = stacked. |
| `unit` | `'percent' \| 'pixel'` | `'percent'` | How sizes are expressed and reported; see § 4.1. |
| `gutterSize` | `number` | `6` | Thickness of each gutter in pixels, perpendicular to the split axis. |
| `disabled` | `boolean` | `false` | Disables all resize interactions. Panes keep their current sizes; gutters are not focusable and do not respond to pointer or keyboard input. |
| `keyboardStep` | `number` | `10` | How much to move the gutter per arrow-key press, in the units declared by `unit`. |
| `keyboardStepLarge` | `number` | `50` | Step for `PageUp` / `PageDown`. |
| `storageKey` | `string \| null` | `null` | If non-null, pane sizes are persisted to `localStorage` under this key and restored on init; see § 7. |
| `rtl` | `boolean` | inherited from `dir` attribute | When true, horizontal direction is visually reversed; see § 10. |

**Outputs:**

| Name | Type | Description |
|---|---|---|
| `sizesChange` | `EventEmitter<number[]>` | Fires after any committed resize, with the ordered array of current pane sizes in the declared `unit`. Does **not** fire on every pointer move during drag; see § 5.4. |
| `resizeStart` | `EventEmitter<SplitResizeEvent>` | Fires on pointer/touch down or keyboard-initiated resize. |
| `resizeEnd` | `EventEmitter<SplitResizeEvent>` | Fires on pointer/touch up, blur, or keyboard resize commit. |
| `collapseChange` | `EventEmitter<SplitCollapseEvent>` | Fires when a pane collapses or expands via snap, keyboard, or programmatic API. |

**Exposed methods:**

| Name | Signature | Description |
|---|---|---|
| `setSizes` | `(sizes: number[]) => void` | Programmatically set all pane sizes. Array length **MUST** equal pane count; sizes **MUST** be compatible with the declared unit. Throws on mismatch. |
| `collapse` | `(paneIndex: number) => void` | Collapse the pane at `paneIndex` to its `collapsedSize`. |
| `expand` | `(paneIndex: number) => void` | Restore the pane to its pre-collapse size, or its `defaultSize` if none recorded. |
| `reset` | `() => void` | Restore all panes to their declared `defaultSize`. |

### 3.3 `TwSplitPane` — child component

**Selector:** `tw-split-pane`

**Inputs:**

| Name | Type | Default | Description |
|---|---|---|---|
| `defaultSize` | `number` | evenly distributed | Initial size of this pane in the container's unit. |
| `minSize` | `number` | `0` | Minimum size in the container's unit. The gutter **MUST NOT** allow dragging past this. |
| `maxSize` | `number` | `Infinity` | Maximum size in the container's unit. |
| `collapsible` | `boolean` | `false` | When true, the pane may collapse to `collapsedSize` on snap, keyboard shortcut, or programmatic call. |
| `collapsedSize` | `number` | `0` | Size to use when the pane is collapsed. May be greater than zero for "rail" style collapse. |
| `snapSize` | `number` | `0` | If > 0, dragging within `snapSize` of `collapsedSize` snaps the pane closed; dragging back out past `snapSize` re-expands. See § 5.3. |
| `order` | `number` | declaration order | Stable ordering token so content projection order and resize math stay consistent across change detection. |

**Outputs:**

| Name | Type | Description |
|---|---|---|
| `sizeChange` | `EventEmitter<number>` | Fires when this pane's size changes. |
| `collapsedChange` | `EventEmitter<boolean>` | Fires when this pane's collapsed state changes. |

### 3.4 Types (library-exported)

```ts
export interface SplitResizeEvent {
  sizes: number[];
  unit: 'percent' | 'pixel';
  originPaneIndex: number;    // pane immediately before the gutter being dragged
  cause: 'pointer' | 'touch' | 'keyboard' | 'programmatic';
}

export interface SplitCollapseEvent {
  paneIndex: number;
  collapsed: boolean;
  cause: 'snap' | 'keyboard' | 'programmatic';
}

export type SplitDirection = 'horizontal' | 'vertical';
export type SplitUnit = 'percent' | 'pixel';
```

### 3.5 Optional projection slots

- `twSplitGutter` (directive) — projects custom gutter content (e.g., a grip icon or label). The container **MUST** still own the interaction logic; consumers provide visuals only.
- `twSplitPaneHeader` (directive, inside `tw-split-pane`) — an optional header region that a parent Dock or Panel component may key off of; this component itself does not style it.

---

## 4. Sizing model

### 4.1 Units

- **`percent`** (default): sizes are percentages of the container's content-box along the split axis. All pane sizes **MUST** sum to 100 (within a floating-point epsilon of 0.01). Gutter thickness is subtracted from the available space before percentages are computed.
- **`pixel`**: sizes are absolute pixel values. The last flexible pane absorbs leftover space; if every pane has a fixed pixel size and their sum does not match the container, the container **SHOULD** scale them proportionally rather than overflow.

Mixing units across panes is not supported. A single `unit` governs the whole container.

### 4.2 Constraints and their priority

When resolving sizes, constraints apply in this order:

1. Container width / height available along the split axis (outer bound).
2. Per-pane `minSize` (hard floor).
3. Per-pane `maxSize` (hard ceiling).
4. `defaultSize` (initial suggestion, overridden by persistence).
5. Even distribution (fallback when nothing else is declared).

If `minSize` values sum to more than the container can provide, the component **MUST** still render without layout collapse: panes clamp to their minimums and overflow is allowed on the axis. A console warning **SHOULD** be emitted in dev mode.

### 4.3 Reflow on container resize

- When the container resizes (observed via `ResizeObserver`), panes **MUST** rescale to preserve their relative proportions, then re-clamp against `minSize` / `maxSize`.
- If any pane hits a minimum during rescale, the remaining slack distributes proportionally across unpinned panes.
- No `sizesChange` event fires for a pure container-resize rescale unless clamping changed a pane's proportional share.

### 4.4 Adding and removing panes at runtime

The pane list is tracked by `@ContentChildren`. When panes are added or removed:

- Existing panes' sizes **SHOULD** be preserved proportionally.
- A newly added pane enters at its `defaultSize`; if that would overflow, existing panes shrink proportionally (respecting minimums).
- A removed pane's space redistributes proportionally across remaining panes.

---

## 5. Interaction

### 5.1 Pointer (mouse / stylus) drag

- **Activation:** `pointerdown` on the gutter captures the pointer via `setPointerCapture`. Drag begins immediately; no drag threshold is required.
- **Move:** `pointermove` updates the two adjacent panes' sizes; other panes do not move. Delta is applied to the "before" pane; the "after" pane absorbs the inverse delta.
- **Clamping:** before applying the delta, both adjacent panes' proposed new sizes are clamped against their `minSize` / `maxSize`. If either would be violated, the gutter stops at the nearest valid position; it **MUST NOT** "jump" past a minimum.
- **Cursor:** during drag, the document-level cursor is forced to `col-resize` (horizontal) or `row-resize` (vertical). The cursor **MUST** be restored on pointer release, including on cancel (e.g. `pointercancel`, `Escape`, window blur).
- **Text selection:** must be suppressed during drag (`user-select: none` on the document body).
- **Iframes:** when the pointer enters an iframe during drag, events are lost. The component **SHOULD** overlay a transparent full-viewport capture element during drag to prevent this.
- **Release:** `pointerup` or `pointercancel` releases capture, restores cursor, and fires `resizeEnd` and `sizesChange`.

### 5.2 Touch

Touch interaction mirrors pointer interaction through the unified Pointer Events API. No separate `touchstart` / `touchmove` path is required if Pointer Events are used. The gutter's hit area **MUST** be at least 24px perpendicular to the split axis on touch devices, regardless of `gutterSize`, to meet WCAG 2.5.5 target size guidance. The visual gutter stays at `gutterSize`; the hit area expands invisibly.

### 5.3 Snap and collapse behavior

When a pane has `snapSize > 0` and `collapsible = true`:

- Dragging the adjacent gutter such that the pane's size would fall below `collapsedSize + snapSize` snaps the pane to `collapsedSize` and fires `collapseChange` with `collapsed: true`.
- While collapsed, dragging the gutter outward past `collapsedSize + snapSize` restores the pane to its pre-collapse size and fires `collapseChange` with `collapsed: false`.
- Snap transitions **SHOULD NOT** be animated during active drag; they **MAY** be animated for programmatic `collapse()` / `expand()` calls.

### 5.4 Event cadence

- `resizeStart` fires exactly once per interaction.
- `sizesChange` fires **only at commit** (release, keyboard step applied, programmatic call). It **MUST NOT** fire on every pointer move. Consumers who need live feedback during drag listen to `resizeEnd` is not sufficient — a live-update mode is out of scope for v1; defer to custom template binding on internal state if needed.
- `resizeEnd` fires exactly once per interaction, after the final `sizesChange`.

Rationale: preventing firehose events keeps consumer `(sizesChange)` handlers and persistence writes cheap and predictable.

### 5.5 Keyboard

When a gutter has focus:

| Key | Action |
|---|---|
| `ArrowLeft` / `ArrowRight` | Horizontal split only. Move gutter by `keyboardStep` toward the arrow direction. |
| `ArrowUp` / `ArrowDown` | Vertical split only. Move gutter by `keyboardStep` toward the arrow direction. |
| `PageUp` / `PageDown` | Move gutter by `keyboardStepLarge`. In horizontal splits, `PageUp` moves the gutter toward the start; `PageDown` toward the end. In vertical splits, same mapping. |
| `Home` | Move gutter to the minimum position permitted by adjacent panes' constraints. |
| `End` | Move gutter to the maximum position permitted by adjacent panes' constraints. |
| `Enter` / `Space` | If either adjacent pane is `collapsible`, toggle its collapsed state. If both are collapsible, toggle the one most recently resized; tiebreak: the pane before the gutter. |
| `Escape` | Cancel an in-progress pointer drag (if any) and restore the pre-drag sizes. Has no effect if no drag is in progress. |

Keyboard steps respect `minSize` / `maxSize` the same way pointer drags do.

### 5.6 Tab order and focus

- Each gutter is focusable (`tabindex="0"`).
- Focused gutters render a visible focus ring using the library's `focus-visible` ring tokens.
- Tab order follows DOM order of the gutters.
- Focus **MUST NOT** move to the gutter on pointer click (use `preventDefault` on `mousedown` after capturing, then focus the gutter only if the last non-pointer input was keyboard — alternatively, always focus the gutter on drag so keyboard and pointer feel unified; the library picks one and documents it).

### 5.7 Programmatic API

`setSizes`, `collapse`, `expand`, and `reset` all:

- Validate inputs; throw a descriptive Error if invalid.
- Apply constraints (§ 4.2).
- Fire `sizesChange` once per call (and `collapseChange` if applicable), with `cause: 'programmatic'`.
- Trigger persistence write if `storageKey` is set (§ 7).

---

## 6. Accessibility

### 6.1 ARIA pattern

Each gutter implements the [WAI-ARIA *Window Splitter* pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/):

- `role="separator"` on the gutter element.
- `aria-orientation="horizontal"` for a **vertical** split (the separator is horizontal) and `aria-orientation="vertical"` for a horizontal split. This is the ARIA convention and it's confusing — the attribute describes the *separator's* orientation, not the split's. The component **MUST** get this right.
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` reflect the size of the pane *before* the gutter, in the container's unit. For `percent`, values are whole numbers 0–100. For `pixel`, values are rounded integers.
- `aria-controls` points to the IDs of the two adjacent panes.
- `aria-label` or `aria-labelledby` is required. If neither is provided, the component falls back to `aria-label="Resize panel"` and emits a dev-mode warning encouraging a meaningful label (e.g., `"Resize sidebar"`).

### 6.2 Screen reader behavior

- Keyboard resize **MUST** update `aria-valuenow` synchronously. Screen readers will announce the new value.
- Collapse / expand **SHOULD** be announced via a polite live region at the container level; text like "Sidebar collapsed" / "Sidebar expanded".

### 6.3 Reduced motion

The component respects `prefers-reduced-motion: reduce`:

- Programmatic `collapse()` / `expand()` animations are skipped.
- Drag-time behavior is unaffected (direct manipulation is not animation).

### 6.4 High contrast / forced colors

- Gutter and its focus ring **MUST** remain visible under `forced-colors: active`. Use `CanvasText` / `Highlight` system colors in a `@media (forced-colors: active)` block.

### 6.5 Target size

See § 5.2 — 24px minimum hit area perpendicular to the split axis on touch devices.

---

## 7. Persistence

When `storageKey` is set:

- On init: attempt to read sizes from `localStorage[storageKey]`. If valid (array of numbers, length matches pane count, all values satisfy constraints), apply them. Otherwise fall back to `defaultSize` values and emit a dev-mode warning.
- On `sizesChange`: write current sizes to `localStorage` synchronously. Throttle to at most one write per 200ms if the cause is programmatic; commit-events from interaction already fire at natural cadence.
- Writes are wrapped in try/catch; quota errors are swallowed silently in production, logged in dev.
- Storage format: JSON-encoded `{ version: 1, unit: 'percent' | 'pixel', sizes: number[] }`. A version mismatch discards the stored value.

Server-side rendering: reading `localStorage` is deferred until after `afterNextRender` (or equivalent); SSR renders with `defaultSize` values, and the first client render may snap to persisted sizes on hydration. This single snap is acceptable and **MUST NOT** emit `sizesChange`.

`storageKey` is intentionally the only persistence mechanism. Custom persistence (e.g., write to a user's server profile) is done by the consumer via `(sizesChange)`.

---

## 8. Styling

### 8.1 Semantic tokens only

The default gutter styling **MUST** use the library's semantic tokens — no raw palette colors:

| Element | Default classes |
|---|---|
| Container | `flex h-full w-full` (direction-dependent `flex-row` / `flex-col`) |
| Pane | `min-w-0 min-h-0 overflow-auto` (prevents flex children from ignoring constraints) |
| Gutter (idle) | `bg-border hover:bg-border-strong transition-colors` |
| Gutter (focused) | adds library focus ring tokens |
| Gutter (dragging) | `bg-primary-300` (one of the rare palette usages; see note) |
| Gutter (disabled) | `bg-border-muted cursor-not-allowed` |

> **Color exception:** the dragging-state gutter uses `primary-*` to mirror the focus ring convention established for interactive controls in ngx-tw. All other states use semantic surface/border tokens.

### 8.2 Dark mode

All tokens are dark-mode-aware; the component **MUST NOT** include any `dark:` variants manually.

### 8.3 Overridability

- The container and each pane expose host classes and `data-*` attributes that consumers can target for one-off overrides without forking the component:

  ```
  [data-split-direction="horizontal" | "vertical"]
  [data-split-pane-collapsed="true" | "false"]
  [data-split-gutter-state="idle" | "hover" | "focus" | "dragging" | "disabled"]
  ```

- Consumers **MAY** pass classes through standard Angular host binding. The component **MUST NOT** strip them.

### 8.4 Cursor

- Global cursor override during drag is applied via a document-level class toggle, not inline styles, so that CSP-strict apps are unaffected.

---

## 9. States and edge cases

| Situation | Required behavior |
|---|---|
| Single pane only | Container renders the pane filling the axis. No gutter is rendered. All gutter-related inputs are ignored. |
| Zero panes | Container renders nothing. No error. |
| `minSize` sums > container | Panes clamp to minimums, content overflows, dev warning. |
| Identical `minSize = maxSize` | The pane becomes non-resizable; gutters adjacent to it are disabled visually and operationally while remaining focusable for consistency. |
| Content pane with `overflow: hidden` children larger than its size | The pane clips. The split pane **MUST NOT** enforce content-based minimum sizes. |
| Rapid pane addition/removal | Resize math tolerates a pane list change mid-interaction; any active drag is canceled, `resizeEnd` fires with the last valid sizes, and the new layout is computed as in § 4.4. |
| Nested splits | No special handling required. Each `tw-split` owns its own `ResizeObserver`, its own gutter focus ring, and its own storage key. |
| RTL + horizontal | See § 10. |
| Drag outside viewport | Pointer capture keeps events flowing until release. The iframe overlay (§ 5.1) covers out-of-viewport scroll bars too if inside a scrollable parent. |
| Window blur during drag | Treated as `pointercancel`. Sizes revert to their state at `resizeStart` (like Escape). |
| Programmatic `setSizes` during drag | Rejects (throws) in dev mode; silently ignored in prod. Document this explicitly in the API page. |

---

## 10. RTL

For `direction: 'horizontal'` with `rtl: true` (or a CSS-inherited `dir="rtl"`):

- Visual pane order is reversed (first declared pane renders rightmost).
- Pointer drag coordinates are inverted: dragging the gutter leftward enlarges the pane after it (visually the left pane), not before.
- `ArrowLeft` / `ArrowRight` are swapped to preserve the "arrow moves the pane that side of the gutter" mental model.
- `aria-valuenow` still reports the pane's own size; it does not flip.
- Vertical splits are unaffected by RTL.

---

## 11. Performance

- Drag loop **MUST** use `requestAnimationFrame` throttling; `pointermove` handlers coalesce into at most one style update per frame.
- Pane sizes are applied via inline `flex-basis` (or `width` / `height` in pixel mode), not via `transform`. This keeps layout correct for content that depends on its pane's actual measured size.
- The container uses a single `ResizeObserver`; per-pane `ResizeObserver` instances are forbidden.
- No per-frame DOM reads during drag. All reads (container size, constraints) are taken at `resizeStart` and cached.
- Change detection: the component runs most drag work outside `NgZone` and re-enters only on commit events. Internal size state is held in Angular signals so template bindings update without full tree CD.

---

## 12. Technical requirements

- **Angular version:** 18+ (signals, `input()` / `output()` / `model()` APIs, standalone components, new control flow).
- **Standalone:** every exported component, directive, and pipe is standalone. No NgModule.
- **Change detection:** `ChangeDetectionStrategy.OnPush` throughout.
- **Signals over RxJS for state.** Outputs **MAY** be `EventEmitter` (default Angular output shape) or `output()` depending on library convention.
- **No `document` / `window` access at module load.** All browser APIs are accessed inside `afterNextRender`, effects, or event handlers, so SSR works out of the box.
- **Peer dependencies:** `@angular/core`, `@angular/common`. No third-party runtime dependencies.
- **Bundle budget:** the whole entry point (`ngx-tw/split`) tree-shakes to under 6 KB minified + gzipped, excluding Angular.
- **Public entry point:** `ngx-tw/split`, exporting `TwSplit`, `TwSplitPane`, `TwSplitGutter` (directive), and the types in § 3.4.

---

## 13. Testing requirements

Each of the following **MUST** have unit or integration coverage:

- Sizing: even distribution fallback; `defaultSize` applied; `minSize` and `maxSize` clamp on drag, keyboard, and programmatic set; percentage sum invariant; pixel unit distribution on container resize.
- Interaction: pointer drag path through down → move → up; keyboard steps, `PageUp` / `PageDown`, `Home`, `End`; `Escape` cancels drag; `Enter` / `Space` toggles collapse; drag cancel on blur.
- Collapse: snap threshold in and out; collapsible-only constraint; `collapse()` / `expand()` API; event emission.
- Accessibility: `role="separator"`, `aria-orientation` correct for both split directions, `aria-valuenow` updates on keyboard and pointer commit, `aria-controls` refers to valid pane IDs.
- Persistence: round-trip save and restore; invalid stored data falls through to defaults; SSR does not read storage; version mismatch discards.
- Resize reflow: container resize preserves proportions; minimum constraints take precedence over proportional preservation.
- RTL: horizontal drag and arrow keys invert correctly; `aria-valuenow` does not flip.
- Nested: inner split inside outer pane resizes independently; inner gutter focus does not interact with outer.
- Performance: no more than one style update per frame during sustained drag; no zone-triggered CD cycles during drag (measured via `NgZone.onStable`).

---

## 14. Example usage

```html
<!-- IDE-style layout -->
<tw-split direction="horizontal" storageKey="ide-outer" (sizesChange)="persistOuter($event)">
  <tw-split-pane [defaultSize]="20" [minSize]="12" [maxSize]="40" collapsible [snapSize]="5">
    <app-file-tree />
  </tw-split-pane>

  <tw-split-pane [defaultSize]="55" [minSize]="30">
    <tw-split direction="vertical" storageKey="ide-inner">
      <tw-split-pane [defaultSize]="70" [minSize]="30">
        <app-editor />
      </tw-split-pane>
      <tw-split-pane [defaultSize]="30" [minSize]="10" collapsible [collapsedSize]="3">
        <app-terminal />
      </tw-split-pane>
    </tw-split>
  </tw-split-pane>

  <tw-split-pane [defaultSize]="25" [minSize]="15" [maxSize]="45">
    <app-inspector />
  </tw-split-pane>
</tw-split>
```

---

## 15. Open questions

These are flagged for explicit decision during implementation; none should slip to "figure out later":

1. **Live drag events.** Should a `sizesDrag` output fire on every frame during pointer drag, for consumers that want live feedback (e.g., animated previews)? Default position: no; add in v1.1 if requested.
2. **Pixel / percent mixing.** Do we want a `'auto'` pane type (percent panes coexisting with one or more fixed-pixel panes)? Default position: no; recommend authors pick a unit.
3. **Animated programmatic collapse.** Animate `collapse()` / `expand()` by default, or require a consumer-supplied CSS transition? Default position: no default animation; document the class hook so consumers can add one.
4. **Drag handle beyond the gutter.** Should the split pane expose a directive (`twSplitDragHandle`) that consumers can attach to arbitrary projected content to act as an alternative drag source (e.g., a title bar)? Default position: defer to v1.1.
5. **`aria-label` fallback.** Fail loudly (dev-mode throw) on missing label, or fall back silently? Default position: warn in dev, fall back in prod.

Resolve each of these before the first public release and record the decision in the component's API doc page.
