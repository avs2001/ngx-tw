# Prompt: Build `tw-icon` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, especially: signal APIs, `tv()` with `twMerge`, semantic color tokens, surface/fg/border tokens, secondary entry point structure, `host` bindings, JSDoc requirements, Vitest rules
- `projects/ngx-tw/badge/badge.ts` — pattern for `tv()` with slots, `computed()` host class binding, `input()` with `TwColor`/`TwSize`
- `projects/ngx-tw/button/button.ts` — pattern for `inject()`, `ElementRef`, `Renderer2`-adjacent DI, `computed()` class binding
- `projects/ngx-tw/core/types.ts` — `TwColor` and `TwSize` shared types
- `projects/ngx-tw/core/index.ts` — export pattern for shared types

Study the reference implementation at `/Users/ciprianiuga/dev/sandbox/ngx-com/projects/com/components/icon/` for architectural inspiration (registry, providers, Lucide adapter, imperative SVG rendering). Adapt it to ngx-tw conventions — replace CVA with `tv()`, use semantic tokens, follow CLAUDE.md rules exactly.

## What to build

An icon component (`tw-icon`) that renders SVG icons from a registry or from direct icon data. Icons are registered tree-shakably via provider functions. The component renders SVGs imperatively using `Renderer2` inside an `effect()` — the template is empty. It supports semantic color variants matching `TwColor` plus a `'current'` default that inherits `currentColor`, and a size scale matching `TwSize`. A Lucide adapter lives in a separate sub-entry point (`ngx-tw/icon/lucide`) so `lucide-angular` is only needed by consumers who use Lucide icons.

## API design

### Types (`icon.types.ts`)

```typescript
type TwIconNode = readonly [string, Readonly<Record<string, string | number>>];
type TwIconData = readonly TwIconNode[];
type TwIconMap = Record<string, TwIconData>;
type TwIconColor = TwColor | 'current';
```

### IconRegistry (`icon.registry.ts`)

Injectable service — do NOT use `providedIn: 'root'`. Provided automatically by `provideTwIcons()`.

- `register(icons: TwIconMap): void` — merges icons into the internal map
- `get(name: string): TwIconData | null` — returns icon data by PascalCase name, or `null`

### Provider functions (`icon.providers.ts`)

- `provideTwIcons(icons: TwIconMap): Provider[]` — returns an array of providers: the `IconRegistry` (if not already provided) and a multi-provider `TW_ICON_REGISTRAR` token whose factory calls `registry.register(icons)`. The token is injected by the component to trigger registration.
- The injection token `TW_ICON_REGISTRAR` should be exported for advanced use cases.

### Lucide adapter (`lucide/lucide-adapter.ts`)

- `provideTwLucideIcons(icons: LucideIcons): Provider[]` — converts Lucide icon data to `TwIconData` format and delegates to `provideTwIcons()`. Import `LucideIcons` and `LucideIconData` types from `lucide-angular`.
- `fromLucideIcon(icon: LucideIconData): TwIconData` — type-level identity function for explicit conversion.

### IconComponent (`icon.ts`)

Selector: `tw-icon`. Element selector. `ChangeDetection.OnPush`. Empty template.

#### Inputs

- /** Icon name in kebab-case (e.g. `'chevron-right'`). Resolved via the registry. */ `name = input<string>()`
- /** Direct icon data (SVG element tuples). Takes precedence over `name`. */ `img = input<TwIconData>()`
- /** Semantic color. `'current'` inherits from parent text color. Defaults to `'current'`. */ `color = input<TwIconColor>('current')`
- /** Icon size. Defaults to `'md'` (20px). */ `size = input<TwSize>('md')`
- /** SVG stroke width. Defaults to `2`. */ `strokeWidth = input(2)`
- /** When true, stroke width scales inversely with icon size to maintain consistent visual weight. Defaults to `false`. */ `absoluteStrokeWidth = input(false)`
- /** Accessible label. When set, removes `aria-hidden` and applies `aria-label` to the SVG. */ `ariaLabel = input<string>()`
- /** SVG viewBox attribute. Defaults to `'0 0 24 24'`. */ `viewBox = input('0 0 24 24')`

No outputs. No content projection. No form integration.

## Usage examples

```html
<!-- Simplest: icon by name (requires provideTwLucideIcons in app config) -->
<tw-icon name="star" />

<!-- With color and size -->
<tw-icon name="check" color="success" size="lg" />

<!-- Direct icon data, no registry needed -->
<tw-icon [img]="myCustomIconData" />

<!-- Accessible icon with label -->
<tw-icon name="alert-triangle" color="warning" ariaLabel="Warning" />

<!-- Inherits parent color (default behavior) -->
<span class="text-error-500">
  <tw-icon name="x-circle" size="sm" /> Error occurred
</span>

<!-- Custom viewBox for non-24x24 icons -->
<tw-icon [img]="icon16x16" viewBox="0 0 16 16" size="sm" />
```

## Styling

`tv()` config — no slots (single host element). Base: `inline-flex items-center justify-center shrink-0 align-middle`. Enable `twMerge: true`.

**Variants:**

- `color`: `current` (no class — inherits `currentColor`), `primary` -> `text-primary-500`, `secondary` -> `text-secondary-500`, `accent` -> `text-accent-500`, `neutral` -> `text-fg-muted`, `info` -> `text-info-500`, `success` -> `text-success-500`, `warning` -> `text-warning-500`, `error` -> `text-error-500`
- `size`: `xs` -> `size-3` (12px), `sm` -> `size-4` (16px), `md` -> `size-5` (20px), `lg` -> `size-6` (24px), `xl` -> `size-8` (32px)

**defaultVariants:** `color: 'current'`, `size: 'md'`.

Host binding: `host: { '[class]': 'classes()' }` where `classes` is a `computed()` calling the `tv()` function.

Define a `ICON_SIZE_PX` constant mapping `TwSize` to pixel numbers (`xs: 12, sm: 16, md: 20, lg: 24, xl: 32`) — used as the SVG `width`/`height` attributes.

## Accessibility

- SVG gets `aria-hidden="true"` by default (decorative icon)
- When `ariaLabel` is provided: SVG gets `aria-label` with the value, `role="img"`, and `aria-hidden` is removed
- No keyboard behavior needed — icons are not interactive
- The host element itself needs no ARIA role — the SVG handles it

## Implementation notes

- **SVG rendering:** Use `Renderer2` + `effect()` to imperatively create the SVG element and its children from `TwIconData`. Clear the previous SVG before rendering a new one. Set `xmlns`, `width`, `height`, `viewBox`, `fill="none"`, `stroke="currentColor"`, `stroke-width`, `stroke-linecap="round"`, `stroke-linejoin="round"` on the SVG element.
- **Icon resolution:** `computed()` that returns `img()` if provided, otherwise looks up `toPascalCase(name())` in the registry. A helper function `toPascalCase` converts kebab-case to PascalCase for registry lookup.
- **Dev-mode warnings:** In the render effect, if `name()` is provided but resolved icon is `undefined`, call `console.warn` when `isDevMode()` is `true` — e.g., `Icon "${name}" not found in registry. Did you forget to register it with provideTwIcons()?`
- **`absoluteStrokeWidth`:** When `true`, compute effective stroke width as `strokeWidth * 24 / sizeInPx` — this keeps visual stroke weight consistent across sizes. When `false`, use `strokeWidth` directly. Derive `effectiveStrokeWidth` via `computed()`.
- **SVG caching:** Track the previous `TwIconData` reference in the effect. Skip DOM rebuild if the data reference hasn't changed (only color/size changed — those are handled by host classes, not SVG attributes). Stroke width, absoluteStrokeWidth, and viewBox changes do require SVG rebuild.
- **Registry provision:** `IconRegistry` must not use `providedIn: 'root'`. Instead, `provideTwIcons()` returns `[IconRegistry, { provide: TW_ICON_REGISTRAR, multi: true, useFactory: ... }]`. Angular deduplicates class providers, so multiple `provideTwIcons()` calls won't create multiple registries.
- **Registrar injection:** The component injects `TW_ICON_REGISTRAR` with `{ optional: true }` to trigger the registration factories. The token value is never read.
- **`ViewEncapsulation.None`** — the component has no template content to encapsulate, and this avoids Angular generating empty style scoping attributes.
- Inject `DOCUMENT` for `createElementNS`. Inject `ElementRef` for the host element. Inject `Renderer2` for DOM manipulation.

## File structure

### Primary entry point: `projects/ngx-tw/icon/`

- `icon.ts` — `IconComponent`
- `icon.types.ts` — `TwIconNode`, `TwIconData`, `TwIconMap`, `TwIconColor`
- `icon.registry.ts` — `IconRegistry`
- `icon.providers.ts` — `provideTwIcons()`, `TW_ICON_REGISTRAR`
- `icon.spec.ts` — tests (see below)
- `index.ts` — public exports
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`

### Sub-entry point: `projects/ngx-tw/icon/lucide/`

- `lucide-adapter.ts` — `provideTwLucideIcons()`, `fromLucideIcon()`
- `index.ts` — public exports
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`

### Test coverage (`icon.spec.ts`)

- Default render: mounts without errors, no SVG rendered (no name or img)
- `name` input: resolves from registry, renders SVG with correct children
- `img` input: renders SVG directly, takes precedence over `name`
- All color variants: each `TwIconColor` value applies without errors
- All size variants: each `TwSize` value applies without errors
- `strokeWidth`: SVG `stroke-width` attribute matches input
- `absoluteStrokeWidth`: when true, effective stroke width scales inversely with size (e.g., size `xl` 32px with strokeWidth 2 → effective ~1.5)
- `viewBox`: SVG `viewBox` attribute matches input
- `ariaLabel`: when set, SVG has `aria-label` and `role="img"`, no `aria-hidden`; when absent, SVG has `aria-hidden="true"`
- Dev-mode warning: `console.warn` fires when name is provided but not found in registry
- SVG caching: changing only `color` or `size` does not rebuild SVG DOM (verify by checking SVG element identity)
- No `fakeAsync` — use `async/await` with `fixture.whenStable()`
- Provide icons in test via `provideTwIcons()` in the test module's providers

## Public API exports

**`ngx-tw/icon/index.ts`:**
```
export { IconComponent } from './icon';
export { IconRegistry } from './icon.registry';
export { provideTwIcons, TW_ICON_REGISTRAR } from './icon.providers';
export type { TwIconNode, TwIconData, TwIconMap, TwIconColor } from './icon.types';
```

**`ngx-tw/icon/lucide/index.ts`:**
```
export { provideTwLucideIcons, fromLucideIcon } from './lucide-adapter';
```

**Root `public-api.ts`:** Add `export * from 'ngx-tw/icon';` (do NOT re-export the lucide sub-entry point — consumers import it explicitly).

## Constraints

- `tv()` with `twMerge: true` — no CVA, no manual class concatenation
- Semantic color tokens only — never raw palette colors
- `neutral` color uses `text-fg-muted` — never `text-neutral-*`
- No `providedIn: 'root'` on `IconRegistry`
- No `@angular/animations`
- No component CSS files
- `ChangeDetection.OnPush`, `ViewEncapsulation.None`
- Signal inputs (`input()`), `computed()` for derived state
- `host` object for host bindings — no `@HostBinding`
- `inject()` for DI — no constructor injection
- JSDoc on every public `input()`, public method, and exported type
- Vitest: no `fakeAsync`, use `vi.spyOn()`, import from `vitest`
