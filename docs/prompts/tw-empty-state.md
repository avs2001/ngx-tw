# Prompt: Build `tw-empty-state` for ngx-tw

## Context

Before writing code, read:

- `.claude/CLAUDE.md` — conventions, semantic tokens, visual design system (spacing scale, icon sub-scales, typography roles, focus rings). Pay close attention to the "Typography" section: `text-base` for component-internal text is **forbidden** outside the codified `tw-item` lg exception. This component's title stays at `text-sm font-semibold` at every size.
- `projects/ngx-tw/alert/alert.ts` + `alert.spec.ts` — closest visual peer. Mirror the slot-directive pattern (`twAlertIcon` / `twAlertTitle` / `twAlertContent` / `twAlertActions`) and its host-driven class wiring.
- `projects/ngx-tw/card/card.ts` + `card/index.ts` — co-located slot directive pattern with `inject(CardComponent)` and per-slot computed classes.
- `projects/ngx-tw/icon/icon.ts` (first 60 lines) — the canonical glyph component used as the default illustration fallback. Confirm the `<tw-icon name="…" size="…">` API and the `ICON_SIZE_PX` map (xs=12, sm=16, md=20, lg=24, xl=32).
- `projects/ngx-tw/core/types.ts` — `TwSize` (the only shared type this component uses; `TwColor` is **not** used — empty state is neutral/structural).
- `projects/ngx-tw/theme/default.css` — no keyframes are needed by this component.

No CDK modules are required. Empty state is a purely visual primitive — no overlay, no focus management, no keyboard handling beyond what its projected actions provide natively.

---

## What to build

A zero-data layout primitive. When a list, table, search result, inbox, or any data surface has nothing to show, the consumer mounts `<tw-empty-state>` to communicate the absence in a calm, opinionated way: an illustration (icon) on top, a title beneath it, a short description, and zero-to-many CTA buttons below. It is the visual counterpart to a successful render of zero rows — not a loading state, not an error boundary, not a 404 page.

User-story framing:

- "As a user searching an empty inbox, I see a friendly icon, the message 'No messages yet', a short subtitle, and a 'Compose' button — not a blank page."
- "As a developer, I drop `<tw-empty-state title='No results' description='Try a different search.'>` into my table's empty row and it Just Works at every size."
- "As a designer, I want one component that handles centered (full-region) and inline (compact row) layouts so the rest of the app stays consistent."

Scope decisions already locked (do not revisit): purely presentational; no inputs for `color` (the component is neutral by design — accent comes from the projected actions); no `live` / `role` input (consumers wrap with `role="status"` themselves if the empty state appears in response to user action — see Open decisions); standalone entry point `ngx-tw/empty-state`; the only shared type imported is `TwSize`; the default illustration is a `<tw-icon name="inbox">` rendered conditionally only when no icon slot is projected.

---

## File layout

Create under `projects/ngx-tw/empty-state/`:

| File | Role |
|---|---|
| `empty-state.ts` | `EmptyStateComponent`, slot directives (`EmptyStateIconDirective`, `EmptyStateTitleDirective`, `EmptyStateDescriptionDirective`, `EmptyStateActionsDirective`), `tv()` config. |
| `empty-state.spec.ts` | Vitest suite — see Test plan. |
| `index.ts` | Re-exports the component, slot directives, and `EmptyStateVariant` type. |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |

Also: add `export * from 'ngx-tw/empty-state';` in `projects/ngx-tw/src/public-api.ts` (keep alphabetical-ish grouping next to the existing visual primitives — after `dialog`, before `command-palette` is fine, or grouped with the other primitives).

---

## Public API checklist

Visual primitive — input cap of ≤5–6 applies (no exception qualifies). Five inputs total.

**Inputs (all required with one-line JSDoc):**

- [ ] `size` — `TwSize`, default `'md'`. JSDoc: `Controls overall spacing and icon scale. Defaults to 'md'.`
- [ ] `variant` — `EmptyStateVariant` (`'centered' | 'inline'`), default `'centered'`. JSDoc: `Layout style. 'centered' stacks icon/title/description/actions vertically with center alignment for full-region usage; 'inline' arranges them horizontally for compact rows. Defaults to 'centered'.`
- [ ] `title` — `string | undefined`, default `undefined`. JSDoc: `Primary heading text. Projected '*twEmptyStateTitle' content takes precedence. Defaults to undefined.`
- [ ] `description` — `string | undefined`, default `undefined`. JSDoc: `Secondary descriptive text. Projected '*twEmptyStateDescription' content takes precedence. Defaults to undefined.`
- [ ] `titleLevel` — `1 | 2 | 3 | 4 | 5 | 6`, default `3`. JSDoc: `Heading level used for the title element. Set to match the surrounding document outline. Defaults to 3.`

**Outputs:** none. Actions are consumer-owned (`<tw-button>` etc.) and emit their own events.

**Models:** none.

Every `input()` must carry the one-line JSDoc shown above.

---

## Slot directive plan

Four projection slots. Each is a standalone directive co-located in `empty-state.ts`. **Title and description are structural directives** (consumer syntax `<span *twEmptyStateTitle>…</span>`) — see the "Why structural" note below. Icon and actions stay attribute selectors.

| Selector | Kind | Purpose | Fallback | Host class binding? |
|---|---|---|---|---|
| `[twEmptyStateIcon]` | Attribute (marker) | User-provided illustration (typically `<tw-icon>`, an `<svg>`, or an `<img>`). | Default `<tw-icon name="inbox" [size]="iconSize()" aria-hidden="true">` renders when no `[twEmptyStateIcon]` content is detected. | **No** — pure marker directive. The icon wrapper around the projected content owns the `iconWrapperClasses`. |
| `*twEmptyStateTitle` | **Structural** (captures `TemplateRef`) | Custom title content (e.g., title with badge, inline link). Replaces the `title` input. | Renders the `title` input inside the heading element (`titleLevel`) when present. Otherwise the heading is omitted entirely. | **No** — the directive's host is the implicit `<ng-template>`; the component renders the captured template inside the `<hN>` wrapper via `ngTemplateOutlet`. |
| `*twEmptyStateDescription` | **Structural** (captures `TemplateRef`) | Custom description content. Replaces the `description` input. | Renders the `description` input inside a `<p>` when present. Otherwise omitted. | **No** — same reasoning. The wrapping `<p>` owns `descriptionClasses`; the captured template renders via `ngTemplateOutlet`. |
| `[twEmptyStateActions]` | Attribute | One or more action buttons (typically two CTAs max — primary + secondary). | Omitted entirely when no content is projected. | **Yes** — there is no separate actions wrapper inside the template; the projected host element *is* the wrapper, so it carries `actionsClasses` (`flex flex-wrap items-center gap-2` etc.). |

**Why structural for title and description (not attribute, as initially specified):** the title and description slots live inside an `@if (hasTitle())` / `@if (hasDescription())` guard so the heading and paragraph wrappers don't render at all when no content is supplied. Plain `<ng-content select="…">` projection has a hard Angular limitation: projection happens once at component creation time, and projected nodes whose matching `<ng-content>` slot doesn't exist at that moment are silently dropped — never re-projected when the slot later materializes (e.g. when `contentChild` populates and `@if` flips true). The cleanest Angular-native fix is `TemplateRef` + `ngTemplateOutlet`: the consumer's template is captured by the directive, and the component instantiates it at the right place via `<ng-container [ngTemplateOutlet]="slot.templateRef" />` — this works correctly inside conditional and dynamic-tag (`@switch (titleLevel())`) contexts.

**Why attribute for icon and actions:** their `<ng-content>` slots are unconditional in the template (the icon wrapper always renders, even when the icon slot is empty — to provide the fallback; the actions `<ng-content>` always renders, leaving the slot empty when no element is projected). With unconditional slots, plain ng-content projection works fine and avoids forcing consumers to use `<ng-template>` / asterisk syntax for icon and actions.

**Asymmetry vs `card.ts`:** card's directives all carry the parent's slot classes because the projected element directly becomes the styled region (header, body, footer). Empty state renders most regions inside its own DOM (the icon wrapper, the heading element, the paragraph), so applying parent classes through the directive would double-stamp them onto the consumer's inner element. Only the actions slot follows the card pattern because actions have no wrapping element.

Slot presence is queried via `contentChild(SlotDirective)` and exposed as `computed()` booleans (`hasIcon`, `hasTitleSlot`, `hasDescriptionSlot`, `hasActions`). Render decisions in the template:

- Icon region: render the fallback content of `<ng-content select="[twEmptyStateIcon]">` (the `<tw-icon name="inbox">`); projected slot replaces it when present.
- Title region: render the `<hN>` wrapper only if `hasTitle()`. Inside: `@if (titleSlot(); as slot) { <ng-container [ngTemplateOutlet]="slot.templateRef" /> } @else { {{ title() }} }`.
- Description region: render the `<p>` wrapper only if `hasDescription()`. Same `ngTemplateOutlet` pattern as title.
- Actions region: always render `<ng-content select="[twEmptyStateActions]" />`; when nothing is projected the slot is simply empty.

---

## DOM structure

Centered variant (default):

```html
<div class="<rootClasses>">
  <div class="<iconWrapperClasses>">
    <!-- <ng-content select="[twEmptyStateIcon]"> with fallback <tw-icon name="inbox" [size]="iconSize()" aria-hidden="true"> -->
  </div>
  <hN class="<titleClasses>">
    <!-- @if (titleSlot()) ngTemplateOutlet @else {{ title() }} -->
  </hN>
  <p class="<descriptionClasses>">
    <!-- @if (descriptionSlot()) ngTemplateOutlet @else {{ description() }} -->
  </p>
  <!-- <ng-content select="[twEmptyStateActions]" /> — the projected host element carries actionsClasses via the directive -->
</div>
```

Inline variant: same children, but the root is `flex flex-row items-center text-left` and the icon sits at the start; title/description stack in a `min-w-0 flex-1` column; actions sit at the end with `ml-auto`. Use the same slot directives — only the root's tailwind-variants slot classes change per `variant`.

**Title-and-description grouping in inline variant:** wrap the heading + paragraph in a `<div class="min-w-0 flex-1">` element whose presence is gated on `hasTitle() || hasDescription()`. The centered variant does not need this wrapper (children stack on the root directly). Encode this by emitting the wrapper conditionally on `variant() === 'inline'` in the template. Keep it simple — do not push the wrapper into a slot.

**Dynamic heading tag:** `[attr.aria-level]` is **not** sufficient — render the literal `<h1>`–`<h6>` tag to preserve native heading semantics. Use Angular's `@switch (titleLevel())` over six cases. To avoid duplicating the heading body across six branches, hoist it into a single `<ng-template #titleBody>` (containing the `ngTemplateOutlet` / fallback-text `@if`/`@else` pair) and reference it from each `@case` via `<ng-container [ngTemplateOutlet]="titleBody" />`. This is *the* reason title/description must be structural directives — `<ng-content>` cannot be repeated across `@switch` cases with the same selector without breaking projection.

---

## `tv()` variant plan

Single `tv()` config in `empty-state.ts`, `twMerge: true`, slot-based. Five slots (`root`, `iconWrapper`, `title`, `description`, `actions`). All neutral structural styling uses surface/fg/border tokens — no color variant axis.

```ts
const emptyState = tv({
  slots: {
    root: 'text-fg',
    iconWrapper: 'text-fg-subtle shrink-0',
    // Title typography is constant across all sizes per CLAUDE.md typography rules:
    // text-base is permitted ONLY for the codified tw-item lg exception, which this
    // component is not. Consumers wanting a larger heading project [twEmptyStateTitle]
    // with their own typography.
    title: 'text-sm font-semibold text-fg',
    description: 'text-fg-muted',
    actions: 'flex flex-wrap items-center gap-2',
  },
  variants: {
    variant: {
      centered: {
        root: 'flex flex-col items-center justify-center text-center',
        actions: 'justify-center',
      },
      inline: {
        root: 'flex flex-row items-center text-left',
        actions: 'ml-auto',
      },
    },
    size: {
      xs: {
        root: 'p-2 gap-1.5',
        description: 'text-xs',
      },
      sm: {
        root: 'p-3 gap-2',
        description: 'text-sm',
      },
      md: {
        root: 'p-4 gap-3',
        description: 'text-sm',
      },
      lg: {
        root: 'p-6 gap-3',
        description: 'text-sm',
      },
      xl: {
        root: 'p-8 gap-3',
        description: 'text-sm',
      },
    },
  },
  compoundVariants: [
    // Inline variant tightens vertical padding regardless of size so the empty
    // state can act as a table row without dominating row height. The horizontal
    // padding still comes from the size's root entry.
    { variant: 'inline', size: 'xs', class: { root: 'py-1.5 gap-2' } },
    { variant: 'inline', size: 'sm', class: { root: 'py-2 gap-3' } },
    { variant: 'inline', size: 'md', class: { root: 'py-3 gap-3' } },
    { variant: 'inline', size: 'lg', class: { root: 'py-4 gap-3' } },
    { variant: 'inline', size: 'xl', class: { root: 'py-5 gap-3' } },
  ],
  defaultVariants: {
    variant: 'centered',
    size: 'md',
  },
}, {
  twMerge: true,
});
```

**Notes on the variant table:**

- No `color` axis — empty state is neutral by design. Accent comes from projected action buttons.
- `gap-3` is the largest gap permitted by CLAUDE.md's gap scale; do not use `gap-4`+. For larger visual breathing room, use root padding.
- The title is locked at `text-sm font-semibold` across all sizes. **Do not** introduce per-size title overrides — that would require `text-base` at `lg`/`xl`, which CLAUDE.md explicitly prohibits outside the `tw-item` lg exception. Visual hierarchy at larger sizes comes from increased padding and a larger icon, not larger title text.
- `iconWrapper` carries no size-specific classes — the icon's own size attribute (from `<tw-icon [size]="iconSize()">` for the fallback, or from the consumer's projected element) determines the rendered glyph size.

---

## Icon sizing

The default illustration uses `<tw-icon>` and follows CLAUDE.md's **glyph sub-scale**. Reference the actual `ICON_SIZE_PX` from `projects/ngx-tw/icon/icon.ts`: `xs=12, sm=16, md=20, lg=24, xl=32` (CSS `size-3` / `size-4` / `size-5` / `size-6` / `size-8`).

| Component `size` | `variant='centered'` → `<tw-icon size>` | `variant='inline'` → `<tw-icon size>` |
|---|---|---|
| `xs` | `sm` (16px) | `xs` (12px) |
| `sm` | `md` (20px) | `sm` (16px) |
| `md` | `xl` (32px) | `md` (20px) |
| `lg` | `xl` (32px) | `lg` (24px) |
| `xl` | `xl` (32px) | `lg` (24px) |

This deliberately upsizes the icon in the centered variant — the icon is the visual anchor of an empty state, and a 32px glyph at the `md`+ scale balances the typography. The inline variant keeps the icon at text-adjacent sizes so it does not dominate a compact row.

**On the 32px ceiling:** CLAUDE.md's glyph sub-scale jumps from `size-5` (20px) to `size-10` (40px) for "large standalone icons, avatars". `<tw-icon>` does not expose `size-10` — its `xl` step is `size-8` (32px). Empty state accepts 32px as the centered maximum so it can use the icon registry. Consumers who need 40px or larger project a hand-authored `<svg twEmptyStateIcon class="size-10">` directly.

Expose the icon sizing as a `iconSize = computed<TwSize>(...)` signal. Only used when no `[twEmptyStateIcon]` is projected (projected icons size themselves).

---

## Accessibility

- **Container role:** none by default. The root is a plain `<div>`. Empty state is a content region, not a status announcement. Consumers that want a status announcement (e.g., "no search results found" updating live) should wrap the component themselves: `<div role="status" aria-live="polite"><tw-empty-state … /></div>`. Document this in JSDoc on the component class.
- **Heading semantics:** the title renders as a real `<h1>`–`<h6>` (per `titleLevel()`) when present, so the empty state participates in the document outline. Default `titleLevel = 3` assumes the empty state sits inside a section already at h2.
- **Description:** renders inside a `<p>` element; no `aria-describedby` wiring (the heading-then-paragraph pair is the standard pattern for screen readers without extra ARIA).
- **Icon:** the default `<tw-icon>` is decorative — pass `aria-hidden="true"` on it. Projected icons are the consumer's responsibility; document in JSDoc.
- **Actions:** projected buttons keep all their native focus/keyboard behavior. Empty state does not intercept Tab order, does not trap focus, does not register keyboard listeners.
- **AXE:** must pass on default render, with projected actions, and across all sizes/variants.

---

## Implementation notes

- `signal`-based throughout. No `linkedSignal` — all derived state is read-only.
- Slot presence:
  ```ts
  readonly iconSlot = contentChild(EmptyStateIconDirective);
  readonly titleSlot = contentChild(EmptyStateTitleDirective);
  readonly descriptionSlot = contentChild(EmptyStateDescriptionDirective);
  readonly actionsSlot = contentChild(EmptyStateActionsDirective);

  readonly hasIcon = computed(() => !!this.iconSlot());
  readonly hasTitleSlot = computed(() => !!this.titleSlot());
  readonly hasDescriptionSlot = computed(() => !!this.descriptionSlot());
  readonly hasActions = computed(() => !!this.actionsSlot());

  readonly hasTitle = computed(() => this.hasTitleSlot() || !!this.title()?.trim());
  readonly hasDescription = computed(() => this.hasDescriptionSlot() || !!this.description()?.trim());
  ```
- Variant resolution: single `private readonly variantResult = computed(() => emptyState({ variant: this.variant(), size: this.size() }))` then per-slot exposed signals: `rootClasses`, `iconWrapperClasses`, `titleClasses`, `descriptionClasses`, `actionsClasses` — each `computed(() => this.variantResult().slotName())`. The actions directive `inject(EmptyStateComponent)` and binds to `actionsClasses`, mirroring `CardFooterDirective`. The icon / title / description directives do **not** inject the component for classes — title/description are structural (template-capturing) and don't have a stylable host; icon is a pure marker.
- Title / description directives expose `readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef)`. The component reads them via `contentChild(EmptyStateTitleDirective)` etc. and renders the captured template inside the heading / paragraph wrapper via `<ng-container [ngTemplateOutlet]="slot.templateRef" />`.
- `iconSize = computed<TwSize>(() => ...)` per the table above. Used as the `[size]` input on the fallback `<tw-icon>`.
- Host binding: `host: { '[class]': 'rootClasses()' }`. No `[attr.role]`, no `[attr.aria-*]` on the host.
- Heading rendering: a single `<ng-template #titleBody>` holds `@if (titleSlot(); as slot) { <ng-container [ngTemplateOutlet]="slot.templateRef" /> } @else { {{ title() }} }`. `@switch (titleLevel())` then has six cases, each emitting `<hN [class]="titleClasses()"><ng-container [ngTemplateOutlet]="titleBody" /></hN>`. The class binding lives on the `<hN>` wrapper, not on the projected slot's inner element.
- Description rendering: `<p [class]="descriptionClasses()"><ng-container [ngTemplateOutlet]="descriptionBody" /></p>` where `#descriptionBody` mirrors the title pattern.
- Icon wrapper: `<div [class]="iconWrapperClasses()"><ng-content select="[twEmptyStateIcon]"><tw-icon name="inbox" [size]="iconSize()" aria-hidden="true" /></ng-content></div>`. Plain `<ng-content>` projection works for icon because the slot is unconditional. No `@if` around the fallback — `ng-content`'s native fallback handles the empty case.
- Inline variant wrapper around title+description: `@if (variant() === 'inline' && (hasTitle() || hasDescription())) { <div class="min-w-0 flex-1">…</div> } @else { … }`. Centered variant emits title + description as direct children of the root. Both branches reference the same `#titleBlock` / `#descriptionBlock` templates to avoid duplication.
- Actions slot: `<ng-content select="[twEmptyStateActions]" />` — the projected host element carries `actionsClasses` via `EmptyStateActionsDirective`'s host binding. Plain `<ng-content>` works here too because the slot is unconditional.
- Component `imports`: `[IconComponent, NgTemplateOutlet]` (the latter from `@angular/common`).
- No animations. Empty state does not animate in/out — the consumer animates the surrounding container if needed (e.g., a fade between loading and empty states is driven by the parent).
- `ChangeDetection.OnPush`. Standalone (do not set `standalone: true`).

---

## Usage examples

Simplest case — inputs only, fallback icon:

```html
<tw-empty-state
  title="No messages"
  description="When you receive a message it'll appear here."
/>
```

With actions:

```html
<tw-empty-state
  title="No projects yet"
  description="Create your first project to get started."
>
  <div twEmptyStateActions>
    <tw-button color="primary">New project</tw-button>
    <tw-button variant="ghost">Import</tw-button>
  </div>
</tw-empty-state>
```

Custom illustration:

```html
<tw-empty-state title="Inbox zero" description="Nice work.">
  <tw-icon twEmptyStateIcon name="check-circle" size="xl" color="success" />
</tw-empty-state>
```

Inline (table-empty-row use case):

```html
<tr>
  <td colspan="6">
    <tw-empty-state
      variant="inline"
      size="sm"
      title="No matching rows"
      description="Adjust filters to see results."
    >
      <div twEmptyStateActions>
        <tw-button size="sm" variant="ghost">Reset filters</tw-button>
      </div>
    </tw-empty-state>
  </td>
</tr>
```

Custom title with badge (structural directive — asterisk syntax):

```html
<tw-empty-state description="Search returned no results.">
  <span *twEmptyStateTitle class="inline-flex items-center gap-2">
    No results
    <span twBadge color="neutral" size="sm">0</span>
  </span>
</tw-empty-state>
```

Custom description with inline link (same pattern):

```html
<tw-empty-state title="No results">
  <span *twEmptyStateDescription>
    Try a <a routerLink="/search">different search</a>.
  </span>
</tw-empty-state>
```

Inside a card:

```html
<tw-card variant="outlined">
  <div twCardBody>
    <tw-empty-state
      title="No team members"
      description="Invite people to collaborate."
    >
      <div twEmptyStateActions>
        <tw-button color="primary">Invite</tw-button>
      </div>
    </tw-empty-state>
  </div>
</tw-card>
```

Wrapped for live announcement (consumer-owned):

```html
<div role="status" aria-live="polite">
  @if (results().length === 0) {
    <tw-empty-state
      title="No results"
      description="Try a different search term."
    />
  }
</div>
```

---

## Test plan (`empty-state.spec.ts`)

Vitest. No `fakeAsync` / `tick`. `async/await` with `fixture.whenStable()` where needed (most tests are synchronous DOM assertions).

**Rendering**
- [ ] Mounts with no inputs (just the component tag).
- [ ] Renders each `size` (`xs`, `sm`, `md`, `lg`, `xl`) without errors.
- [ ] Renders each `variant` (`centered`, `inline`) without errors.
- [ ] Default render includes the fallback `<tw-icon name="inbox">` when no `[twEmptyStateIcon]` is projected.
- [ ] Title element absent from DOM when neither `title()` input nor `*twEmptyStateTitle` slot is provided.
- [ ] Description element absent from DOM when neither `description()` input nor `*twEmptyStateDescription` slot is provided.
- [ ] Actions slot absent from DOM when no `[twEmptyStateActions]` is projected.

**Inputs**
- [ ] `title='X'` renders 'X' inside the heading element.
- [ ] `description='Y'` renders 'Y' inside a `<p>` element.
- [ ] `titleLevel=1` renders an `<h1>`; `titleLevel=6` renders an `<h6>`. Cover at least three levels.
- [ ] `variant='inline'` changes root layout classes (assert presence of `flex-row` token).
- [ ] `size` affects padding (assert presence of correct `p-*` token per size).
- [ ] Title element carries `text-sm font-semibold` regardless of `size` (regression-guard against future `text-base` reintroduction).

**Content projection**
- [ ] `[twEmptyStateIcon]` projection replaces the fallback `<tw-icon name="inbox">` (assert the fallback element is absent).
- [ ] `*twEmptyStateTitle` projection (asterisk syntax) replaces the `title()` input rendering (when both are present, projection wins).
- [ ] `*twEmptyStateDescription` projection replaces the `description()` input rendering.
- [ ] `[twEmptyStateActions]` projection receives `actionsClasses` on its host element (only the actions directive applies parent classes via host binding).
- [ ] `[twEmptyStateIcon]`, `*twEmptyStateTitle`, `*twEmptyStateDescription` directives do **not** stamp parent typography classes onto the projected element's host (assert `font-semibold` and `text-fg-muted` are NOT present on the user's inner element of a projected title / description — they live on the wrapper instead).

**Icon sizing**

Assert via the `<tw-icon>` host class (`size-3`/`size-4`/`size-5`/`size-6`/`size-8` per its `iconVariants` mapping). Do **not** assert the rendered SVG's `width`/`height` attribute — `<tw-icon>` caches the SVG and does not rebuild it on size-only changes, so the SVG dimensions go stale across input updates while the host class stays reactive.

- [ ] Centered + `md` → fallback `<tw-icon>` host carries `size-8` (xl, 32px).
- [ ] Inline + `sm` → fallback `<tw-icon>` host carries `size-4` (sm, 16px).
- [ ] Centered + `xs` → fallback `<tw-icon>` host carries `size-4` (sm, 16px).
- [ ] Inline + `xl` → fallback `<tw-icon>` host carries `size-6` (lg, 24px).

**Accessibility**
- [ ] Host element has **no** `role` attribute by default.
- [ ] Title renders as a real heading element (`H1`–`H6` tagName), not a styled `<div>`.
- [ ] Fallback `<tw-icon>` has `aria-hidden="true"`.
- [ ] AXE passes on: default render, with title+description, with all four slots projected, inline variant, each size.

**Variant classes (smoke — do not assert exhaustively, only the differentiators)**
- [ ] `variant='centered'` root contains `flex-col` and `text-center`.
- [ ] `variant='inline'` root contains `flex-row` and `text-left`.

**Class merging**
- [ ] Consumer-provided `class` on the host merges with internal classes via `twMerge` (assert one consumer class is present alongside an internal token).

---

## Demo coverage

Author under `projects/demo/src/app/routes/empty-state/` (separate task). Examples to ship:

- [ ] **Default** — `title` + `description` only, fallback inbox icon, no actions.
- [ ] **With actions** — primary + secondary `<tw-button>` projected via `[twEmptyStateActions]`.
- [ ] **Sizes gallery** — five cards side-by-side showing `xs` → `xl`, each centered.
- [ ] **Custom illustration** — `<tw-icon twEmptyStateIcon name="search">` with a "Clear filters" action, plus a second example using a hand-authored `<svg twEmptyStateIcon class="size-10">` to demonstrate non-`tw-icon` projection at the 40px size.
- [ ] **Inside a card** — `<tw-empty-state>` inside `[twCardBody]` of an outlined card, demonstrating the recommended container.
- [ ] **Inline in a table empty row** — `<table>` with a single `<tr><td colspan>` containing `<tw-empty-state variant="inline" size="sm">` and a "Reset filters" action.
- [ ] **Custom title slot** — `[twEmptyStateTitle]` with a badge inline next to the heading text.
- [ ] **Live-announcement wrapper** — example of the consumer-owned `role="status"` wrapper for search-results contexts.

---

## Out of scope (do not implement)

- Loading states / skeleton placeholders — that is `tw-skeleton`.
- Error boundary UI / "something went wrong" surfaces — out of scope; would need its own component with retry semantics.
- Full-page 404 / 500 layouts — empty state is a region-level primitive, not a route.
- Built-in CTAs — actions are always consumer-projected; no `primaryAction` / `secondaryAction` inputs.
- Animations (enter/leave) — the consumer wraps with `animate.enter`/`animate.leave` if a transition is wanted.
- Color variants — empty state is neutral by design.
- Density / `compact` boolean — collapsed into the `size` axis (`xs` is the compact mode).
- `live` / `role` / `aria-live` inputs — consumer-owned via wrapping element (see Accessibility).
- `cdk-virtual-scroll-viewport` integration or any list-aware behavior — empty state knows nothing about the list it replaces.
- Per-size title font scaling — locked at `text-sm font-semibold` to honor CLAUDE.md typography rules. Consumers projecting `[twEmptyStateTitle]` may apply their own typography.

---

## Open decisions to flag for the maintainer

Sensible defaults I picked while drafting; verify before merging the implementation.

1. **`titleLevel` default of `3`.** Assumes the component sits inside an `<h2>`-led section. If most demo contexts will not have a surrounding section, default `2` may be safer. **[CONFIRM]**
2. **No `role="status"` on the host.** The empty state is a content region, not a live announcement. Consumers that want live announcement wrap the component themselves. The alternative is mirroring `alert`'s `politeness` input — but that adds a sixth input and conflates "no data" (a static render) with "the data just became empty as a result of user action" (a dynamic announcement). I chose the simpler default; flag if the team prefers the alert symmetry. **[CONFIRM]**
3. **Fallback icon name `'inbox'`.** Assumes the project's icon registry has `inbox` available. If the registry uses a different default name (e.g., `package`, `folder-open`, `archive`), substitute. **[CONFIRM]**
4. **Centered icon ceiling at 32px (`<tw-icon size='xl'>`).** CLAUDE.md's "large standalone" glyph step is `size-10` (40px), but `<tw-icon>` only goes up to `size-8` (32px). Accepting 32px so the fallback uses the icon registry. Consumers wanting 40px project a hand-authored `<svg class="size-10">`. **[ASSUMED SAFE]**
5. **Compound variant table for inline padding.** Per-size overrides for vertical padding in the inline variant because the centered scale (`p-2` … `p-8`) feels too tall when used as a table row. Verify resulting row heights against existing `tw-table` empty-row designs. **[ASSUMED SAFE]**
6. **No `gap-4`+ permitted by CLAUDE.md.** All gaps stick to `gap-1.5`/`gap-2`/`gap-3`. If design review wants more vertical breathing room between icon and title at `xl`, the fix is increasing root padding — not gap. **[ASSUMED SAFE]**
7. **Slot directives are split: attribute for icon and actions, structural for title and description.** This is a deviation from the original "attribute everywhere" plan, discovered during implementation. Title and description slots live inside conditional wrappers (`@if (hasTitle())` + `@switch (titleLevel())`), and plain `<ng-content select="…">` projection drops content whose matching slot isn't materialized at component-creation time. `TemplateRef` + `ngTemplateOutlet` (via structural directives) is the Angular-native fix and works correctly across both conditional and dynamic-tag contexts. Icon/actions remain attribute-selector because their `<ng-content>` slots are unconditional. **[RESOLVED — structural for title/description]**
8. **Only the actions directive carries parent classes via host binding.** Icon is a pure marker; title and description directives only expose `TemplateRef` (their implicit `<ng-template>` host doesn't receive consumer classes). The surrounding `<div>` / `<hN>` / `<p>` wrappers own the typography and spacing classes. This avoids stamping `font-semibold text-fg` onto the user's inner element when they project a `<span *twEmptyStateTitle>` with their own styling. Card's symmetric pattern is appropriate there because card slots have no wrapping element — empty state does. **[RESOLVED — actions only]**

---

## Constraints (from CLAUDE.md — non-negotiable)

- Selector prefix `tw-`; class name `EmptyStateComponent` (no `Tw` prefix on the class).
- Standalone — do not set `standalone: true`.
- `ChangeDetection.OnPush`, `host` object for host bindings, `inject()` for DI, native control flow (`@if`, `@switch`).
- Signal API exclusively. `computed()` for all derived state. No `linkedSignal()` (no writable-derived state in this component).
- Semantic color tokens / surface-fg-border tokens only. No raw palette colors. No raw `neutral-*` for structural styling.
- Visual tokens drawn from CLAUDE.md "Visual Design System" — radius (none on the root; consumers wrap in `tw-card` if they want rounding), spacing (`p-2` / `p-3` / `p-4` / `p-6` / `p-8`), gaps (`gap-1.5` / `gap-2` / `gap-3` only), typography (`text-sm font-semibold` for title across all sizes — `text-base` is forbidden outside the codified `tw-item` lg exception, which this component is not), icon sub-scales (glyph scale only — never square-interactive or dot).
- No `@angular/animations` (not used here either way).
- Vitest, no `fakeAsync` / `tick`.
- All `input()` carry one-line JSDoc.
- Input count: 5 inputs total — within the ≤5–6 cap. Visual primitives do not qualify for the input-cap exception.
