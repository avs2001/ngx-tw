# Prompt addendum: `tw-timeline` horizontal marker-row alignment fix + long-overflow demo

This document **extends** the original `tw-timeline` prompt at `docs/prompts/tw-timeline.md`
and its horizontal-overflow follow-up at `docs/prompts/tw-timeline-horizontal-overflow.md`.
The component is already shipped — see `projects/ngx-tw/timeline/timeline.ts` and its spec.
Everything in those prompts still applies; this addendum only describes the deltas required to
(1) fix the marker-misalignment bug visible in the horizontal demo and (2) add a long-overflow
horizontal example to the examples page.

When this document and the prior prompts disagree on the same surface, **this document wins**
(it is the more recent design). The component's full contract is otherwise unchanged.

---

## Context (read before changing anything)

- `projects/ngx-tw/timeline/timeline.ts` — current implementation. Key lines for this addendum:
  - `tv()` `item` horizontal variant (line 145): `'flex-col items-center text-center'` — items currently stack body then marker-side via `flex-col` + `order-*` (the item host is a flex column, the body carries `order-1`, the marker-side carries `order-2`).
  - `tv()` `markerSide` horizontal variant (line 146): `'flex-row items-center w-full'`.
  - Horizontal `body` variant (line 147): `'items-center'`.
  - Horizontal-item `min-w-*` floor compoundVariants (lines 196–200).
  - Scroll-viewport class string (line 524) — hand-authored, currently `'tw-scrollbar-none flex flex-row items-start overflow-x-auto scroll-smooth motion-reduce:scroll-auto w-full'`.
  - `markerOrderClass` / `bodyOrderClass` / `oppositeOrderClass` computeds (lines 989–1013) — emit `order-1` / `order-2` / `order-3` for the current flex layout; the horizontal branch always returns `order-2` / `order-1`.
  - The item template (lines 811–863) emits marker-side first in DOM, body second; visual order is currently flipped by the `order-*` classes.
  - `_updateScrollState` (lines 710–718) reads `scrollLeft` / `clientWidth` / `scrollWidth` off `_viewportRef`. **The fix must keep these reads working unchanged.**
- `projects/ngx-tw/timeline/timeline.spec.ts` — every existing test must continue to pass. The spec uses an `setScrollMetrics` helper around lines 764–775 that mocks `scrollWidth` / `clientWidth` / `scrollLeft` via `Object.defineProperty` — JSDOM-friendly. Mirror that style for the alignment test (see § 5 below for why we do NOT use `getBoundingClientRect` in the assertion).
- `projects/demo/src/app/routes/timeline/examples/timeline-examples.component.ts` — the "Orientation" section (lines 91–141) currently renders `ORDER_HOPS` (4 items) horizontally. The fourth item ("Delivered") has `when: ''` and projects only a one-line `<p>` body, while items 1–3 have a title + a timestamp. **This is the visible repro** of the misalignment bug: the last marker bubble sits below the marker row formed by the other three. The horizontal connector line points to where the bubble *should* be, but the bubble itself is offset.
- `projects/demo/src/app/routes/timeline/overview/timeline-overview.component.ts` — also renders `ORDER_HOPS`, indirectly via the basic-usage section. The overview page is **out of scope for this addendum** (the alignment fix lands transparently there too because the underlying component changes).
- `docs/requirements/timeline.requirements.md` — § 4.1 codifies horizontal orientation; § 9 has the "Two adjacent items with very different content heights" row ("connector stretches to fill the gap; marker stays vertically centered to the title's first line"). The current code satisfies that rule in vertical orientation but breaks it in horizontal orientation. This fix brings horizontal in line with the codified expectation.
- `docs/prompts/tw-timeline-horizontal-overflow.md` — the addendum that introduced the inner scroll viewport and chevron buttons. The chevron / scroll-viewport contract lives in that document, **not** in the requirements doc. Specifically the parts of that addendum that this fix must preserve:
  - The inner `#scrollViewport` `<div>` remains the overflow container.
  - `_updateScrollState` reads `scrollLeft / clientWidth / scrollWidth` from that viewport.
  - The chevron buttons absolutely-position against the host (`absolute top-1/2`) and the host stays `relative` in horizontal orientation.
  - `scrollControls="auto"` / `"always"` / `"never"` semantics are untouched.
- `.claude/CLAUDE.md` — visual design system (radius / spacing / gap / typography / focus rings / icon sub-scales) and the "no raw palette colors / use surface-fg-border tokens for structural styling" rule.

No new CDK modules, no new icons, no new injection tokens. This is purely a layout-strategy
swap inside the existing `tv()` config plus a small grid-aware adjustment to the item's
`markerOrderClass` / `bodyOrderClass` computeds, plus one new demo example.

---

# Scope 1 — Fix marker misalignment in horizontal orientation

## 1.1 Repro

In `projects/demo/src/app/routes/timeline/examples/timeline-examples.component.ts` and (indirectly)
in `projects/demo/src/app/routes/timeline/overview/timeline-overview.component.ts`, the
"Orientation → Horizontal" subsection driven by `ORDER_HOPS` shows four items. Items 1–3 carry
a timestamp ("Mar 14, 09:02", "Mar 15, 11:14", "Mar 17, 10:30"); item 4 ("Delivered") has
`when: ''` and renders only a one-line label. The screenshot the user shared shows the last
item's marker bubble sitting **below** the marker row formed by the other three items. The
horizontal connector line lands at the expected y-coordinate, but the bubble itself is offset
downward — the connector visually breaks at the boundary between item 3 and item 4.

## 1.2 Root cause

Confirmed by reading the source (cited line numbers from `projects/ngx-tw/timeline/timeline.ts`):

1. The horizontal `item` variant (line 145) is `flex-col items-center text-center`. Each item
   is a flex column whose own children stack: body (`order-1`) above, marker-side (`order-2`)
   below.
2. The container's horizontal `root` variant (line 140) is `flex-row items-start relative` —
   items are flex children laid out left-to-right with their **top** edges aligned.
3. Each item independently stacks body-then-marker with no shared row constraint across
   siblings.
4. When body heights differ (items 1–3 render a title + timestamp = two text rows; item 4
   renders only a one-line body), each item's marker row ends up at a different y-position
   *inside its own flex column*. Because the items are flex-row siblings aligned at their tops,
   shorter-body items push their marker bubble higher (or lower, depending on which side of the
   text the marker sits) than taller-body items.
5. The horizontal connector segments (`<span>` inside `markerSide`, line 814 / 839 of
   `timeline.ts`) sit inside each item's marker-side `flex-row items-center`, so the connector
   reads as horizontal *within an item* — but the y-coordinate of the marker row differs from
   sibling to sibling, so the connectors do not visually line up across the item boundary.

The fix is to force a **single shared marker-row baseline** across all items in horizontal
orientation, regardless of per-item body height.

## 1.3 Layout strategy — CSS subgrid (canonical choice)

Make the inner scroll viewport a CSS grid laid out in two named rows: row 1 holds every
item's body, row 2 holds every item's marker-side. Each item participates as a `grid-rows-subgrid`
column that spans both rows. Because subgrid inherits the parent grid's row tracks, **every
item's marker-side lands on the same row 2 baseline** regardless of how tall its body content
is in row 1.

### Why subgrid, not ResizeObserver-driven min-height

The alternative (strategy B) is to measure the tallest body via `ResizeObserver` on the
projected items, then apply that measurement as `min-height` to every body. Reject it:

- Adds one `ResizeObserver` per item or one shared RO with N targets — extra reactive plumbing.
- Races change detection — the min-height value lags the first measurement, producing a
  one-frame flicker.
- Requires writing to the DOM from an effect (the anti-pattern called out in the original
  timeline prompt).
- Subgrid is a CSS-native solution that requires zero JS; modern evergreen browsers (Chrome
  117+, Safari 16+, Firefox 71+) all support it. The project's `engines` and the rest of the
  library already assume an evergreen baseline.

### Why `auto-cols-max`, **NOT** `auto-cols-fr` or `auto-cols-[1fr]`

The grid columns must size to their content (which is bounded below by the per-density
`min-w-*` floor on each item, lines 196–200 of `timeline.ts`) and be allowed to grow beyond
the viewport's `clientWidth` so overflow is possible. `auto-cols-fr` and `auto-cols-[1fr]`
size every column to `clientWidth / N` — the grid never overflows, so
`_updateScrollState` reads `scrollLeft + clientWidth === scrollWidth` permanently and the
overflow chevrons would never enable. **Use `auto-cols-max`** (each column = `max-content` of
its contents, which honours the existing item `min-w-*` floor and grows naturally with content).
This preserves the chevron contract documented in
`docs/prompts/tw-timeline-horizontal-overflow.md`.

If a future maintainer wants the per-density floor baked into the grid template itself instead
of trusting the item's `min-w-*` to propagate, the equivalent is
`auto-cols-[minmax(theme(spacing.40),max-content)]` (with the spacing token varying per density).
For this fix, keep the per-density `min-w-*` on the item — no change to those compoundVariants.

### Why `self-end` on the body row

With subgrid, row 1's height equals the tallest body in the viewport (the natural row sizing
behaviour of CSS grid). A one-line "Delivered" body would otherwise float at the **top** of
row 1, leaving a visible gap between the body and the marker row directly below. Apply
`self-end` to the body slot in horizontal orientation so short bodies hang at the **bottom**
of row 1, sitting close to the marker row. This keeps the visual rhythm tight regardless of
body-height variance across items.

## 1.4 `tv()` config changes

Update the horizontal `orientation` variant in `timeline.ts` (around lines 136–148) and add
two new compoundVariants. **No removal** of existing horizontal-orientation `min-w-*` rows
(196–200) — those still establish the floor.

Concretely:

1. **Item slot, horizontal variant.** Remove the `flex flex-col items-center` flex stacking;
   replace with grid-row participation via subgrid:

   ```diff
        horizontal: {
          root: 'flex-row items-start relative',
   -      item: 'flex-col items-center text-center',
   +      // Grid-row participation: each item spans both rows of the viewport's
   +      // grid-template-rows: minmax(0, 1fr) auto. `grid-rows-subgrid` inherits
   +      // the parent grid's row tracks so every item's marker-side lands on a
   +      // shared row 2 baseline regardless of body height in row 1.
   +      item: 'grid grid-rows-subgrid row-span-2 items-center text-center',
          markerSide: 'flex-row items-center w-full',
          body: 'items-center',
        },
   ```

2. **Add a new horizontal compoundVariant for `body` and `markerSide` row placement.** Add
   alongside the existing horizontal-orientation min-width block (line 196):

   ```ts
   // Subgrid row placement (horizontal orientation only):
   // - Body occupies row 1; `self-end` keeps short bodies hanging at the bottom of
   //   the row (close to the marker row directly below) instead of floating at the top.
   // - Marker-side occupies row 2 (the shared marker baseline across all items).
   { orientation: 'horizontal', class: { body: 'row-start-1 self-end', markerSide: 'row-start-2' } },
   ```

3. **No change** to the vertical-orientation variants — vertical items remain `flex-row`
   and the existing flex-order machinery continues to drive `left` / `right` /
   `alternate` / `split`.

## 1.5 `markerOrderClass` / `bodyOrderClass` adjustments

The current `markerOrderClass` (lines 989–996) and `bodyOrderClass` (lines 999–1006)
computeds emit flex-order utilities (`order-1` / `order-2`). In the new grid layout for
horizontal orientation, `order-*` no longer drives placement — `row-start-*` does (applied via
the new compoundVariant above). The flex-order utilities are *harmless* on a grid child
(they're ignored by the grid placement algorithm), but they're noise.

Update both computeds (and `oppositeOrderClass` if its horizontal-orientation branch ever
fires — which it does not today, see § 1.6) to return an empty string when
`orientation === 'horizontal'`:

```diff
   private readonly markerOrderClass = computed(() => {
-    if (this.timeline.orientation() === 'horizontal') return 'order-2';
+    // Horizontal uses CSS grid subgrid for placement — flex order is ignored.
+    if (this.timeline.orientation() === 'horizontal') return '';
     const align = this.timeline.align();
     if (this.hasOppositeColumn()) return 'order-2';
     if (align === 'right') return 'order-2';
     return 'order-1';
   });

   private readonly bodyOrderClass = computed(() => {
-    if (this.timeline.orientation() === 'horizontal') return 'order-1';
+    if (this.timeline.orientation() === 'horizontal') return '';
     const align = this.timeline.align();
     // ... unchanged below
   });
```

`oppositeOrderClass` (lines 1009–1013) does not need a horizontal branch because
`hasOppositeColumn()` already returns `false` in horizontal orientation (line 984) — the
opposite column is never rendered in horizontal, and the computed value is never read.

**DOM order in the template (`timeline.ts` lines 812–842) is unchanged.** The template still
emits marker-side first, body second. Subgrid placement decouples DOM order from visual
order — exactly what we want for assistive tech (reading order is consistent regardless of
orientation).

## 1.6 Scroll-viewport class string change

The viewport (`timeline.ts` line 524) currently carries:

```
'tw-scrollbar-none flex flex-row items-start overflow-x-auto scroll-smooth motion-reduce:scroll-auto w-full'
```

Replace `flex flex-row items-start` with the grid template:

```
'tw-scrollbar-none grid grid-flow-col auto-cols-max [grid-template-rows:minmax(0,1fr)_auto] overflow-x-auto scroll-smooth motion-reduce:scroll-auto w-full'
```

Notes for the implementer:

- `grid grid-flow-col` — auto-flow columns so projected `<tw-timeline-item>` children fill
  successive columns left-to-right (RTL-aware: grid auto-flow column respects `dir="rtl"`
  natively; document direction reversal happens at the grid container level without per-item
  changes).
- `auto-cols-max` — each column sizes to `max-content` of its contents, honouring the existing
  per-density `min-w-*` floor on the item and growing naturally with content. **Do not use
  `auto-cols-fr` or `auto-cols-[1fr]`** — they would collapse the grid's `scrollWidth` to
  `clientWidth` and break the chevron-overflow contract.
- `[grid-template-rows:minmax(0,1fr)_auto]` — arbitrary value (Tailwind v4 arbitrary value
  syntax). Two rows: row 1 minimum 0, max `1fr` (absorbs the body); row 2 `auto` (sized to the
  marker-side's natural height). The `minmax(0, 1fr)` is required so row 1 can shrink below
  `min-content` if needed — without the `min: 0`, long body content would force the column
  wider than the `auto-cols-max` plus item `min-w-*` floor would otherwise allow.
- `overflow-x-auto`, `scroll-smooth`, `motion-reduce:scroll-auto`, `tw-scrollbar-none`,
  `w-full` — **unchanged**. These preserve the existing horizontal-overflow contract from
  `docs/prompts/tw-timeline-horizontal-overflow.md`.

The viewport remains a single `<div>` with `#scrollViewport`. `_updateScrollState` (lines
710–718) continues to read `el.scrollLeft`, `el.clientWidth`, `el.scrollWidth` off it —
unchanged. The grid's `scrollWidth` (sum of `auto-cols-max` column widths) correctly exceeds
`clientWidth` when items overflow, so `_canScrollNext` resolves `true` and the chevrons
activate.

## 1.7 RTL safety

- `grid grid-flow-col` natively respects `dir="rtl"` — the first column lays out on the
  visual right and subsequent columns flow leftward. No explicit `dir`-handling needed in
  the grid container.
- The existing `_isRtl` signal already flips chevron anchoring (`left-0` / `right-0`) and the
  `scrollBy` delta sign in `_scrollPrev` / `_scrollNext` (lines 728–743). **No changes** to
  RTL chevron wiring.
- `scrollLeft` semantics in RTL are normalised by all evergreen browsers (positive
  `scrollLeft` = scrolled-toward-the-end, visually leftward in RTL). The existing
  `_updateScrollState` thresholds (`> 1` / `< scrollWidth - 1`) work identically in LTR and
  RTL.

## 1.8 `align="alternate"` interaction

The current code already short-circuits `hasOppositeColumn` to `false` when
`orientation === 'horizontal'` (line 984). The opposite slot is never rendered in horizontal,
and `align` is ignored in horizontal orientation per the original prompt's contract
(`docs/prompts/tw-timeline.md` § Public API: "Ignored when orientation is 'horizontal'.").

**No new code path for `align="alternate"` in horizontal.** This fix preserves the existing
short-circuit. The grid layout has only two rows (body in row 1, marker-side in row 2); no
third "opposite" row exists. If a consumer sets `align="alternate"` with
`orientation="horizontal"`, the existing short-circuit silently ignores `align` — same as
today.

## 1.9 Acceptance criteria for Scope 1

1. The horizontal `item` `tv()` variant carries `grid grid-rows-subgrid row-span-2` (no
   longer `flex-col items-center text-center`). The `items-center text-center` classes
   are preserved on the new grid item.
2. The viewport `<div>` (template around line 522 of `timeline.ts`) carries
   `grid grid-flow-col auto-cols-max [grid-template-rows:minmax(0,1fr)_auto]` in addition
   to the existing `tw-scrollbar-none overflow-x-auto scroll-smooth motion-reduce:scroll-auto w-full`
   classes. The viewport no longer carries `flex flex-row items-start` (those classes are
   removed from the hand-authored string).
3. A new compoundVariant emits `body: 'row-start-1 self-end'` and
   `markerSide: 'row-start-2'` when `orientation === 'horizontal'`.
4. The horizontal `min-w-*` compoundVariants (lines 196–200) are unchanged.
5. `markerOrderClass` and `bodyOrderClass` return `''` in horizontal orientation; their
   vertical branches are unchanged. `oppositeOrderClass` is unchanged.
6. `_updateScrollState`, `_scrollPrev`, `_scrollNext`, `_pageScrollAmount` are unchanged.
   The chevron buttons render and behave identically (test coverage in the
   `'Horizontal overflow'` describe block must continue to pass without edits to the
   assertions or scroll-metric mocks).
7. `align="alternate"` / `align="split"` continue to short-circuit silently in horizontal
   orientation. No new horizontal opposite-column code path.
8. RTL: `dir="rtl"` continues to flip the visual layout via grid auto-flow column +
   the existing `_isRtl` chevron wiring. No new `rtl:` variants in the `tv()` config.
9. The visible bug in the demo is fixed — all four `ORDER_HOPS` markers sit on a shared
   horizontal baseline regardless of the "Delivered" item's shorter body.

## 1.10 Spec addition — `timeline.spec.ts`

Add a new test inside the existing `describe('Horizontal overflow', ...)` block (or a
sibling block named `describe('Horizontal layout — marker baseline', ...)` if cleaner).

**Test what:** assert the **class bindings** that drive subgrid placement. **Not** the
visual marker-row baseline alignment — that is a layout-engine concern and JSDOM (Vitest's
DOM) returns `0` for every `getBoundingClientRect()` value. An assertion on
`getBoundingClientRect().top` equality would pass vacuously (every top === 0) or fail
meaninglessly. Use class-binding assertions instead; route any pixel-perfect visual
regression check to the existing `e2e/` Playwright suite, not to the Vitest spec.

Suggested assertions (mirror the `setScrollMetrics` / `viewport` helper idioms already in
the spec, around lines 760–775):

```ts
describe('Horizontal layout — marker baseline', () => {
  it('viewport uses grid + subgrid + auto-cols-max for shared marker baseline', () => {
    const fixture = TestBed.createComponent(BasicTimelineHost);
    fixture.componentRef.setInput('orientation', 'horizontal');
    fixture.detectChanges();

    const vp = fixture.nativeElement.querySelector(
      'tw-timeline div.overflow-x-auto',
    ) as HTMLElement;
    expect(vp.className).toContain('grid');
    expect(vp.className).toContain('grid-flow-col');
    expect(vp.className).toContain('auto-cols-max');
    // grid-template-rows arbitrary value preserved (assert presence of the rows token):
    expect(vp.className).toMatch(/\[grid-template-rows:minmax\(0,1fr\)_auto\]/);
    // The old flex layout is gone:
    expect(vp.className).not.toContain('flex-row');
  });

  it('horizontal items participate as subgrid rows (row-span-2 + items-center)', () => {
    const fixture = TestBed.createComponent(BasicTimelineHost);
    fixture.componentRef.setInput('orientation', 'horizontal');
    fixture.detectChanges();

    const itemEls = items(fixture); // existing helper in the spec
    expect(itemEls.length).toBeGreaterThan(0);
    for (const el of itemEls) {
      expect(el.className).toContain('grid');
      expect(el.className).toContain('grid-rows-subgrid');
      expect(el.className).toContain('row-span-2');
      // Flex-order classes are no longer emitted in horizontal:
      expect(el.className).not.toMatch(/\border-1\b/);
      expect(el.className).not.toMatch(/\border-2\b/);
    }
  });

  it('horizontal body slot lands on row 1 with self-end; marker-side lands on row 2', () => {
    const fixture = TestBed.createComponent(BasicTimelineHost);
    fixture.componentRef.setInput('orientation', 'horizontal');
    fixture.detectChanges();

    const firstItem = items(fixture)[0];
    // Body and marker-side are the two children of the item host:
    const body = firstItem.querySelector(':scope > div:nth-child(2)') as HTMLElement;
    const markerSide = firstItem.querySelector(':scope > div:first-child') as HTMLElement;

    expect(body.className).toContain('row-start-1');
    expect(body.className).toContain('self-end');
    expect(markerSide.className).toContain('row-start-2');
  });

  it('vertical orientation does NOT carry the subgrid classes (regression guard)', () => {
    const fixture = TestBed.createComponent(BasicTimelineHost);
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.detectChanges();

    const itemEls = items(fixture);
    for (const el of itemEls) {
      expect(el.className).not.toContain('grid-rows-subgrid');
      expect(el.className).not.toContain('row-span-2');
    }
  });
});
```

Constraints (recap from CLAUDE.md): Vitest only; no `fakeAsync` / `tick`; use
`async/await` with `fixture.whenStable()` if a future test needs to wait on a microtask
flush (none of the above need it — class bindings resolve synchronously on
`detectChanges()`).

---

# Scope 2 — Add a long-overflow horizontal example to the demo

## 2.1 What to add

A new sub-section inside the **existing "Orientation" section** of
`projects/demo/src/app/routes/timeline/examples/timeline-examples.component.ts` (lines 91–141).
The sub-section is titled "Horizontal — long timeline (overflow + chevrons)" and renders a
14-item CI/CD pipeline timeline that overflows at every desktop viewport width. Its purpose
is to demonstrate the horizontal scroll chevrons in action — the existing 4-item
`ORDER_HOPS` example doesn't overflow at typical widths and therefore never shows the
chevrons.

**Do not** add this example to `projects/demo/src/app/routes/timeline/overview/timeline-overview.component.ts`.
The overview page already shows a single canonical horizontal timeline indirectly via its
basic-usage block; that page stays as-is and inherits the marker-alignment fix automatically.

## 2.2 New dataset

Add a new top-level constant alongside `ORDER_HOPS` (top of file, around line 50). Reuse
the existing `Hop` interface — the shape (`{ id, label, when, state, color, icon }`) already
fits a build-pipeline timeline. Pick icons that already exist in the project's icon registry
(check `projects/demo/src/app/main.ts` or the equivalent `provideTwLucideIcons(...)` call
to confirm which icons are registered; if any of the icons named below aren't registered,
substitute with one that is, or omit `icon` on those rows). The dataset must:

- Have **14 items** (well above the threshold needed to overflow at typical desktop demo
  viewport widths, given `size="sm"` → `min-w-36` = 144px → 14 × 144 = 2016px minimum,
  comfortably exceeding the typical 800–1200px demo well width).
- Carry meaningful labels and timestamps that read as a real CI/CD pipeline (not Lorem
  Ipsum).
- Have a mix of states: items 1–7 `reached`, item 8 `current`, items 9–14 `pending`.
- Vary `color` to match state semantics: `success` for the first half (passed steps),
  `primary` for the `current` step, `neutral` for the `pending` tail.

Suggested rows (timestamps relative — adapt naturally if a sibling demo uses a different
timestamp style):

```ts
const BUILD_PIPELINE: readonly Hop[] = [
  { id:  1, label: 'Clone',            when: '14:00:02', state: 'reached', color: 'success', icon: 'git-branch' },
  { id:  2, label: 'Install deps',     when: '14:00:48', state: 'reached', color: 'success', icon: 'package' },
  { id:  3, label: 'Lint',             when: '14:01:31', state: 'reached', color: 'success', icon: 'check-circle' },
  { id:  4, label: 'Unit tests',       when: '14:02:14', state: 'reached', color: 'success', icon: 'flask' },
  { id:  5, label: 'E2E tests',        when: '14:04:09', state: 'reached', color: 'success', icon: 'eye' },
  { id:  6, label: 'Build images',     when: '14:05:33', state: 'reached', color: 'success', icon: 'layers' },
  { id:  7, label: 'Push to registry', when: '14:06:21', state: 'reached', color: 'success', icon: 'upload' },
  { id:  8, label: 'Deploy staging',   when: '14:07:02', state: 'current', color: 'primary', icon: 'play-circle' },
  { id:  9, label: 'Smoke tests',      when: '',         state: 'pending', color: 'neutral', icon: 'eye' },
  { id: 10, label: 'Canary 10%',       when: '',         state: 'pending', color: 'neutral', icon: 'arrow-right' },
  { id: 11, label: 'Canary 50%',       when: '',         state: 'pending', color: 'neutral', icon: 'arrow-right' },
  { id: 12, label: 'Promote to prod',  when: '',         state: 'pending', color: 'neutral', icon: 'arrow-right' },
  { id: 13, label: 'Cache warmup',     when: '',         state: 'pending', color: 'neutral', icon: 'database' },
  { id: 14, label: 'Post-deploy verify', when: '',       state: 'pending', color: 'neutral', icon: 'check-circle' },
];
```

If any icon name above is not registered, replace it with one that is (or remove the
`<tw-icon twTimelineMarker>` projection for that item — the auto-number will render in its
place). The exact icon set is less important than the 14-item count, the state distribution,
and the readable pipeline narrative.

Expose it on the component class alongside `orderHops` / `auditLog`:

```ts
protected readonly buildPipeline = BUILD_PIPELINE;
```

## 2.3 Rendered example

Add the sub-section **inside** the existing `<!-- Orientation -->` section, after the
existing well that holds the vertical + horizontal `ORDER_HOPS` examples. Mirror the
visual structure of the sibling sub-sections (a small uppercase label, a bordered well,
the `<tw-timeline>` inside).

The well's outer container **MUST** constrain the timeline's horizontal extent so overflow
actually occurs. Wrap the timeline in `<div class="max-w-full overflow-hidden">` — this
clips at whatever the well's natural width is and lets the inner scroll viewport handle
the overflow. **Do not** nest a tighter `max-w-2xl` constraint inside — that would defeat
the demo by hiding the chevrons entirely on wider viewports where overflow wouldn't
otherwise occur.

The renderered example must:

- Use `orientation="horizontal"` and `size="sm"` (matches the existing horizontal
  sub-section so the visual rhythm is consistent — and `sm` density's `min-w-36` floor
  guarantees overflow even on wide viewports).
- Use `scrollControls="auto"` (the default — show the chevrons only when there's
  somewhere to scroll). The intro paragraph (§ 2.4) explains how to override with
  `"always"` / `"never"`.
- Render each item with `marker="circle"`, the projected `<tw-icon twTimelineMarker>`
  (only if the icon name is registered — see § 2.2), and a single-line `<p>` label.
- Use `[timestamp]="h.when || null"` so the `pending` tail items (which carry `when: ''`)
  omit the timestamp slot — same convention as the existing `ORDER_HOPS` example.

Template fragment to insert (after line ~133 of `timeline-examples.component.ts`, just
before the closing `</div>` of the orientation section's bordered well, OR as a new
`<div>` block following the existing well — pick whichever reads cleanest in context):

```html
<div>
  <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Horizontal — long timeline (overflow + chevrons)</p>
  <div class="max-w-full overflow-hidden">
    <tw-timeline orientation="horizontal" size="sm">
      @for (h of buildPipeline; track h.id) {
        <tw-timeline-item
          marker="circle"
          [color]="h.color"
          [state]="h.state"
          [timestamp]="h.when || null"
        >
          <tw-icon twTimelineMarker [name]="h.icon" size="xs" />
          <p class="text-xs font-medium">{{ h.label }}</p>
        </tw-timeline-item>
      }
    </tw-timeline>
  </div>
</div>
```

## 2.4 Intro paragraph (above the well)

Add a short explanatory paragraph immediately above the well, matching the voice of the
existing intro paragraphs in this file. Required content:

- Chevrons appear automatically when the inner scroll viewport can scroll in that
  direction (`scrollControls="auto"` is the default).
- Consumers can force the chevrons with `scrollControls="always"` (visible even at the
  edges, disabled when there's nowhere to scroll) or hide them entirely with
  `scrollControls="never"` (consumer manages overflow externally).
- Clicking a chevron scrolls ~75% of the viewport width with smooth scrolling.
- Reduced-motion users get instant snaps (the inner viewport carries
  `motion-reduce:scroll-auto`).

Match the existing inline `<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">…</code>`
pattern used throughout the file when referencing input names / values.

## 2.5 Code snippet

Add a matching snippet on the component class:

```ts
protected readonly longHorizontalSnippet = `<!-- Long horizontal timeline — chevrons appear when overflow exists -->
<div class="max-w-full overflow-hidden">
  <tw-timeline orientation="horizontal" size="sm">
    @for (h of buildPipeline; track h.id) {
      <tw-timeline-item
        marker="circle"
        [color]="h.color"
        [state]="h.state"
        [timestamp]="h.when || null"
      >
        <tw-icon twTimelineMarker [name]="h.icon" size="xs" />
        <p class="text-xs font-medium">{{ h.label }}</p>
      </tw-timeline-item>
    }
  </tw-timeline>
</div>

<!-- Force chevrons even at edges -->
<tw-timeline orientation="horizontal" scrollControls="always">…</tw-timeline>

<!-- Hide chevrons entirely (consumer-managed overflow) -->
<tw-timeline orientation="horizontal" scrollControls="never">…</tw-timeline>`;
```

Reference it via `<tw-code-block [code]="longHorizontalSnippet" language="html" />` beneath
the well, matching the placement convention used by every sibling sub-section in the file.

## 2.6 Where the new sub-section sits

The `<!-- Orientation -->` section currently has one well containing two sub-sections
("Vertical" and "Horizontal"). Two options for the new sub-section's placement, pick whichever
the implementer judges most readable:

- **Option A (preferred)**: extend the existing well with a third sub-section ("Horizontal —
  long timeline …") sitting beneath the existing "Horizontal" sub-section, sharing the same
  bordered well. The shared `<tw-code-block>` for the section then references a combined
  snippet (cover both the canonical short horizontal and the long-overflow case), OR keep
  the existing `orientationSnippet` and add a separate `<tw-code-block>` for the long case
  beneath the well.
- **Option B**: add a new bordered well *after* the existing orientation well (still inside
  the `<!-- Orientation -->` `<section>`), with its own intro paragraph and its own
  `<tw-code-block>`. Cleaner separation; slightly more visual real-estate.

Both options are acceptable. Option B is preferred when the intro paragraph is long enough
that grouping it with the canonical horizontal sub-section's intro would create a wall of
text.

## 2.7 Acceptance criteria for Scope 2

1. A new constant `BUILD_PIPELINE: readonly Hop[]` exists at the top of
   `timeline-examples.component.ts` with 14 items. Items 1–7 are `state: 'reached'`, item 8
   is `state: 'current'`, items 9–14 are `state: 'pending'`.
2. `buildPipeline` is exposed on the component class as a `protected readonly` property.
3. The "Orientation" section renders a new "Horizontal — long timeline (overflow + chevrons)"
   sub-section that uses `orientation="horizontal"` and `size="sm"`, wrapped in
   `<div class="max-w-full overflow-hidden">`.
4. The sub-section's intro paragraph explains `scrollControls="auto"` (default),
   `"always"`, `"never"`, the ~75% page-scroll amount, and reduced-motion behaviour.
5. A new `longHorizontalSnippet` is defined on the component class and referenced via
   `<tw-code-block [code]="longHorizontalSnippet" language="html" />` beneath the well.
6. The overview page (`timeline-overview.component.ts`) is **not** modified.
7. The new example does not introduce any unregistered icons (substitute or omit if the
   suggested icon name isn't in the project's registry).

---

## Files to modify (recap, both scopes)

**MODIFY:**

- `projects/ngx-tw/timeline/timeline.ts` —
  - `tv()` horizontal `orientation` variant (line 145): replace `flex-col items-center text-center`
    with `grid grid-rows-subgrid row-span-2 items-center text-center`.
  - `tv()` compoundVariants block: add a single new entry emitting
    `body: 'row-start-1 self-end'` and `markerSide: 'row-start-2'` for
    `orientation: 'horizontal'`. Place near the existing horizontal `min-w-*` block
    (around line 196).
  - Viewport `<div>` class string (line 524): replace `flex flex-row items-start` with
    `grid grid-flow-col auto-cols-max [grid-template-rows:minmax(0,1fr)_auto]`. Keep
    `tw-scrollbar-none`, `overflow-x-auto`, `scroll-smooth`, `motion-reduce:scroll-auto`,
    `w-full` unchanged.
  - `markerOrderClass` computed (lines 989–996): horizontal branch returns `''` instead of
    `'order-2'`.
  - `bodyOrderClass` computed (lines 999–1006): horizontal branch returns `''` instead of
    `'order-1'`.

- `projects/ngx-tw/timeline/timeline.spec.ts` —
  - Add the four assertions documented in § 1.10. Re-use the existing `items()` and
    viewport-query helpers. No `getBoundingClientRect`. No `fakeAsync`.

- `projects/demo/src/app/routes/timeline/examples/timeline-examples.component.ts` —
  - Add the `BUILD_PIPELINE` constant at the top of the file (alongside `ORDER_HOPS` /
    `AUDIT_LOG`).
  - Expose it as `protected readonly buildPipeline = BUILD_PIPELINE;` on the
    component class.
  - Add the "Horizontal — long timeline (overflow + chevrons)" sub-section inside the
    "Orientation" `<section>` (either extending the existing well or as a sibling well —
    see § 2.6).
  - Add the `longHorizontalSnippet` property on the component class and the
    `<tw-code-block>` reference beneath the well.

**NO CHANGE NEEDED:**

- `projects/demo/src/app/routes/timeline/overview/timeline-overview.component.ts` — the
  alignment fix lands transparently because the underlying component changes.
- `projects/ngx-tw/theme/_base.css` — no new keyframes, no new utilities (`tw-scrollbar-none`
  already exists; the grid/subgrid utilities ship in Tailwind v4 core).
- `projects/ngx-tw/timeline/index.ts` — no new public API.
- `public-api.ts`, `tsconfig.lib.json`, `tsconfig.spec.json`, `angular.json` — no new files.

---

## Risk areas (call out explicitly)

1. **Subgrid browser support.** CSS subgrid is supported in Chrome 117+, Safari 16+,
   Firefox 71+. The library already targets evergreen browsers (the `theme/_base.css`
   uses `color-mix()` and `oklch()` which need similar baselines). If the project commits
   to an older support floor in the future, the fallback is strategy B (ResizeObserver
   min-height) — but for v1 of this fix, ship subgrid.

2. **`auto-cols-fr` trap.** A maintainer reading the new grid template may reach for
   `auto-cols-fr` (more "Tailwindy" than `auto-cols-max`), which would silently break
   the chevron contract by collapsing `scrollWidth` to `clientWidth`. The inline comment
   on the viewport class string MUST call this out explicitly so future refactors don't
   regress. Suggested comment:

   ```
   // auto-cols-max (NOT auto-cols-fr or auto-cols-[1fr]) — columns size to max-content
   // so the grid's scrollWidth can exceed clientWidth and the chevron-overflow contract
   // documented in docs/prompts/tw-timeline-horizontal-overflow.md keeps working.
   ```

3. **JSDOM has no layout engine.** The Vitest spec MUST NOT assert on
   `getBoundingClientRect()` values to verify marker-row alignment — every rect returns
   `0` in JSDOM and the assertion is either vacuously true or meaninglessly false. Test
   the class bindings (which drive the layout) instead. If a maintainer wants pixel-perfect
   visual regression coverage, route it to a Playwright test in the existing `e2e/` suite —
   that is out of scope for this addendum.

4. **`grid-template-rows` arbitrary value syntax.** Tailwind v4 arbitrary values use
   square-bracket syntax with underscores instead of spaces (so
   `[grid-template-rows:minmax(0,1fr)_auto]` not `[grid-template-rows:minmax(0,1fr) auto]`).
   Double-check this resolves in the project's Tailwind v4 build — if the build complains,
   the alternative is to register a new theme token for the timeline grid rows. The
   underscore syntax is the canonical idiom and should work.

5. **The existing horizontal-overflow tests must continue to pass unchanged.** Run the
   `describe('Horizontal overflow', ...)` block end-to-end after the changes land. The
   scroll-metric mocks via `setScrollMetrics` work on any element regardless of layout
   strategy (`Object.defineProperty` overrides the property reads directly), so the chevron
   tests don't see the grid swap. If any test starts failing, the most likely cause is a
   chevron class-string drift — not the layout change itself.

---

## Constraints (recap of the parts that bind this addendum)

- Angular v21, signals, `OnPush`, `host` object, no `@HostBinding` / `@HostListener`, no
  `@angular/animations`.
- Tailwind v4 utilities only, no component CSS files. Subgrid and grid auto-flow are
  CSS-native — no new theme tokens, no new keyframes.
- Semantic tokens — surface, fg, fg-muted, border, primary-500 for the focus ring. No raw
  palette colors. Existing class strings on the chevron buttons and marker/connector
  lookups are unchanged.
- Vitest, no `fakeAsync`, no `tick`. Use `dispatchEvent('scroll')` + `fixture.detectChanges()`
  for scroll-event tests (already in use in the existing spec); use class-binding assertions
  for the layout swap.
- No new inputs, no new outputs, no new injection tokens. Container input count remains
  5 (`orientation`, `align`, `size`, `lineStyle`, `scrollControls`).
- Visual design tokens drawn from CLAUDE.md "Visual Design System" — no invented values.
- The chevron / scroll-viewport contract documented in
  `docs/prompts/tw-timeline-horizontal-overflow.md` is preserved verbatim. If any aspect
  of that contract appears to conflict with this fix, the chevron contract wins and this
  fix must be reshaped to accommodate it.
