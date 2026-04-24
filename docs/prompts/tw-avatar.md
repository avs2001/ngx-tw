# Prompt: Build `tw-avatar` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, visual design system tokens, tv() patterns
- `projects/ngx-tw/badge/badge.ts` — reference for tv() with slots, compoundVariants per color, attribute directive pattern
- `projects/ngx-tw/card/card.ts` — reference for multi-part component with child directives injecting parent, element selector
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize` shared types
- `projects/ngx-tw/button/button.ts` — reference for CDK FocusMonitor integration (avatar group items won't need this, but study the pattern)

## What to build

An `AvatarComponent` (`tw-avatar`) — a presentational component that displays a user or entity identity. It supports three content modes with an automatic fallback cascade: **image** (when `src` is provided and loads successfully), **initials** (when `initials` input is set and no image is available), and **custom content** (icons, SVGs, or any projected content via `ng-content` as the final fallback). The component also supports an optional status indicator dot.

Additionally, build an `AvatarGroupComponent` (`tw-avatar-group`) — a lightweight layout wrapper that stacks multiple avatars with negative-margin overlap and optional size/spacing control.

Both live in the same secondary entry point: `ngx-tw/avatar`.

## API design

### `AvatarComponent`

#### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `src` | `input<string \| null>()` | `null` | `/** URL of the avatar image. When set, renders an <img>. Falls back to initials or projected content on load error. Defaults to \`null\`. */` |
| `alt` | `input<string>()` | `''` | `/** Alt text for the avatar image. Also used as \`aria-label\` for non-image avatars. Defaults to \`''\`. */` |
| `initials` | `input<string \| null>()` | `null` | `/** Text initials displayed when no image is available (1-2 characters). Defaults to \`null\`. */` |
| `color` | `input<TwColor>()` | `'neutral'` | `/** Semantic color for the initials/icon background. Only applies when no image is shown. Defaults to \`'neutral'\`. */` |
| `size` | `input<TwSize>()` | `'md'` | `/** Controls the avatar dimensions. Defaults to \`'md'\`. */` |
| `rounded` | `input<'full' \| 'lg' \| 'none'>()` | `'full'` | `/** Border radius shape. \`'full'\` for circle, \`'lg'\` for rounded square, \`'none'\` for sharp square. Defaults to \`'full'\`. */` |
| `status` | `input<'online' \| 'busy' \| 'away' \| 'offline' \| null>()` | `null` | `/** Shows a status indicator dot. Position adapts to the rounded shape. Defaults to \`null\` (no indicator). */` |

#### Content projection

A single default `ng-content` slot. This is the **final fallback** — it renders when no `src` loads and no `initials` are set. Consumers project an icon, SVG, or any custom content here. Provide a default user silhouette SVG as `ng-content` fallback content so the component always renders something meaningful even with zero configuration.

### `AvatarGroupComponent`

#### Inputs

| Input | Type | Default | JSDoc |
|---|---|---|---|
| `size` | `input<TwSize>()` | `'md'` | `/** Sets the size for all child avatars. Individual avatar size inputs are ignored when inside a group. Defaults to \`'md'\`. */` |
| `max` | `input<number \| null>()` | `null` | `/** Maximum number of avatars to display. Remaining count is shown as a "+N" overflow indicator. Defaults to \`null\` (show all). */` |

#### Content projection

Projects `tw-avatar` children. The group uses `contentChildren(AvatarComponent)` to manage visibility and apply consistent sizing.

## Usage examples

```html
<!-- Simplest: renders default user icon fallback -->
<tw-avatar alt="Anonymous user" />
```

```html
<!-- Image avatar -->
<tw-avatar src="/photos/jane.jpg" alt="Jane Doe" />
```

```html
<!-- Initials with color, falls back if no src -->
<tw-avatar initials="JD" color="primary" alt="Jane Doe" />
```

```html
<!-- Custom icon projected as fallback -->
<tw-avatar alt="Team channel" color="accent" rounded="lg">
  <svg><!-- custom icon --></svg>
</tw-avatar>
```

```html
<!-- With status indicator -->
<tw-avatar src="/photos/jane.jpg" alt="Jane Doe" status="online" />
```

```html
<!-- Avatar group with overflow -->
<tw-avatar-group size="sm" [max]="3">
  <tw-avatar src="/photos/a.jpg" alt="Alice" />
  <tw-avatar src="/photos/b.jpg" alt="Bob" />
  <tw-avatar initials="CD" color="warning" alt="Carol D." />
  <tw-avatar initials="DE" color="info" alt="Dave E." />
</tw-avatar-group>
```

```html
<!-- Inside a card header (composition) -->
<tw-card>
  <div twCardHeader class="flex items-center gap-3">
    <tw-avatar src="/photos/jane.jpg" alt="Jane" size="sm" status="online" />
    <div>
      <p class="font-semibold text-sm">Jane Doe</p>
      <p class="text-xs text-fg-muted">Product Designer</p>
    </div>
  </div>
</tw-card>
```

## Styling

### `AvatarComponent` — `tv()` with slots

**Slots:** `root`, `img`, `initials`, `fallback`, `status`.

**`root` base:** `inline-flex items-center justify-center overflow-hidden shrink-0` — the avatar is always a fixed-dimension inline element that clips its children.

**Variants:**

- **`size`:** Maps to fixed dimensions. `xs`: `size-6 text-xs`, `sm`: `size-8 text-xs`, `md`: `size-10 text-sm`, `lg`: `size-12 text-sm`, `xl`: `size-16 text-base`. The `text-*` applies to initials. The `status` slot scales its dot size proportionally: `xs`/`sm` get `size-2`, `md` gets `size-2.5`, `lg`/`xl` get `size-3`.
- **`rounded`:** `full`: `rounded-full`, `lg`: `rounded-lg`, `none`: `rounded-none`. Applies to `root`. Status dot positioning changes: for `rounded-full` the dot sits on the circle edge (e.g., `bottom-0 right-0`); for `rounded-lg`/`rounded-none` it sits at the corner with a slight offset.
- **`color`:** Applies to `root` background and `initials` text color using compoundVariants (same pattern as badge). Only visually relevant when initials or fallback content is shown — image mode covers the background. Use `bg-{color}-100 text-{color}-700` for each semantic color. Neutral uses `bg-surface-muted text-fg-muted`.
- **`status`:** Not a tv() variant — handled via a separate computed signal. Status dot colors: `online`: `bg-success-500`, `busy`: `bg-error-500`, `away`: `bg-warning-500`, `offline`: `bg-fg-subtle`. The dot gets a `ring-2 ring-surface` (or `ring-surface-raised` when inside a card) to create a visual cutout against the avatar edge.

**`img` slot:** `size-full object-cover` — fills the avatar root entirely.

**`initials` slot:** `font-medium select-none` — prevents text selection, uses medium weight.

**`fallback` slot:** `size-[60%] text-fg-subtle` — scales the projected icon/SVG to 60% of the avatar, uses subtle color.

**`status` slot base:** `absolute rounded-full ring-2 ring-surface` — positioned absolutely within the root (root needs `relative`).

**`defaultVariants`:** `size: 'md'`, `rounded: 'full'`, `color: 'neutral'`.

Enable `twMerge: true`.

### `AvatarGroupComponent`

No `tv()` needed — use a simple `computed()` to build host classes. Base: `inline-flex items-center`. Apply negative margin on children via the `root` slot override or via CSS selector in the host: `[&>tw-avatar:not(:first-child)]:-ml-2` pattern (use Tailwind arbitrary variants). The overlap amount scales with size: `xs`/`sm`: `-ml-1.5`, `md`: `-ml-2`, `lg`/`xl`: `-ml-3`. Each child avatar gets `ring-2 ring-surface` to create the stacking border effect.

The "+N" overflow indicator is rendered as a final pseudo-avatar element inside the group's template — same dimensions as the group's size, styled with `bg-surface-muted text-fg-muted font-medium`.

## Accessibility

- **Image avatar:** The `<img>` element uses the `alt` input directly. When `alt` is empty, add `aria-hidden="true"` to the host — the avatar is decorative.
- **Non-image avatar (initials/icon):** Apply `role="img"` and `[attr.aria-label]="alt()"` on the host. When `alt` is empty, apply `aria-hidden="true"` instead.
- **Status indicator:** The status dot is purely decorative (`aria-hidden="true"`). If the status needs to be communicated, the consumer should add a `aria-label` that includes it (e.g., `alt="Jane Doe, online"`). Document this in JSDoc on the `status` input.
- **Avatar group:** Apply `role="group"` on the host. Add an `aria-label` input for the group (e.g., `"Team members"`).
- **No keyboard behavior** — avatar is non-interactive. If a consumer wraps it in a button/link, the focus ring goes on the wrapper, not the avatar.

## Implementation notes

- Track image load state internally with a private signal (`imageLoaded: WritableSignal<boolean | null>`). Initialize to `null` (unknown). On `<img>` `load` event, set `true`. On `error` event, set `false`. When `src` changes, reset to `null`. Use `linkedSignal()` keyed to `src()` for the reset behavior.
- Derive `displayMode` as a `computed()`: if `src()` is truthy and `imageLoaded() !== false` return `'image'`; else if `initials()` is truthy return `'initials'`; else return `'fallback'`. Use `@switch` in the template.
- The `<img>` should always be in the DOM when `src` is truthy (even during loading) but hidden until loaded — this ensures the browser initiates the fetch. Use `[class]` to toggle visibility (`opacity-0` while loading, `opacity-100` when loaded) rather than `@if`, so the load/error events still fire.
- For the avatar group: use `contentChildren(AvatarComponent)` to get child avatars. Override each child's size by calling a package-internal method or using a shared injection token that child avatars read. Prefer an injection token (`AVATAR_GROUP_SIZE`) that `AvatarComponent` optionally injects — if present, it overrides the individual `size` input via `computed()`.
- The overflow indicator in avatar group: use `computed()` to derive `visibleAvatars` and `overflowCount` from `contentChildren` length and `max()` input. Render hidden avatars with `display: none`.

## File structure

```
projects/ngx-tw/avatar/
  avatar.ts          — AvatarComponent, AvatarGroupComponent, AVATAR_GROUP_SIZE token
  avatar.spec.ts     — Vitest tests (see below)
  index.ts           — public API exports
  ng-package.json    — { "lib": { "entryFile": "index.ts" } }
```

**Test coverage in `avatar.spec.ts`:**
- Default render with no inputs (shows fallback SVG)
- Image mode: renders `<img>` with correct `src` and `alt`
- Image error fallback: simulating error event falls back to initials, then to projected content
- Initials mode: displays initials text when no `src`
- All `size` values render correct dimensions
- All `color` values render without error
- All `rounded` values apply correct border radius
- Status indicator: appears when `status` is set, absent when `null`
- Content projection: custom icon replaces default fallback
- Accessibility: `role="img"` and `aria-label` on non-image avatars, `aria-hidden` when `alt` is empty
- Avatar group: renders children with overlap styling
- Avatar group `max`: hides excess avatars and shows "+N" indicator
- Avatar group size override: child avatars adopt group size

No `fakeAsync` — use `async/await` with `fixture.whenStable()`.

## Public API exports

**`index.ts`:**
```typescript
export { AvatarComponent, AvatarGroupComponent } from './avatar';
```

Add `export * from 'ngx-tw/avatar';` to root `public-api.ts`.

## Constraints

- Semantic color tokens only — never raw palette colors
- Surface/fg/border tokens for all neutral structural styling
- `tv()` with `twMerge: true` and `defaultVariants`
- `ChangeDetection.OnPush` on both components
- Signal-based inputs (`input()`), no `model()` (non-interactive component)
- `host` object for all host bindings — no `@HostBinding`
- Inline template unless it exceeds ~50 lines
- No `@angular/animations`
- No CSS files — Tailwind utilities only
- Size dimensions from the visual design system icon scale extended: `size-6`, `size-8`, `size-10`, `size-12`, `size-16`
- Border radius tokens: `rounded-full`, `rounded-lg`, `rounded-none` only
- Status dot ring uses `ring-2 ring-surface` per the visual design system
