
# ngx-tw — Angular + Tailwind CSS Component Library

This is **ngx-tw**, an Angular component library built exclusively for projects using **Tailwind CSS v4+**. It depends on **Angular CDK** for behavior primitives (overlays, focus management, a11y, collections). The quality bar is [Angular Material](https://github.com/angular/components): well-tested, accessible, composable — but styled with Tailwind utilities instead of Material Design tokens.

## Core Principles

- **Flexible and simple.** Components must be highly customizable — consumers should be able to adapt appearance and behavior to their needs. At the same time, the API should remain intuitive: sensible defaults, clear naming, minimal ceremony for common cases. Flexibility is the goal; simplicity is how you deliver it.
- **Compose Angular CDK, don't reinvent it.** Use CDK for focus traps, keyboard navigation, overlays, ARIA, coercion, and collections. Never rewrite what CDK provides.
- **Tailwind CSS v4 for all styling.** Components use Tailwind utility classes directly. No component CSS files. No `@tailwind` directives (v4 doesn't use them). Consumers must have Tailwind v4 installed.
- **Accessible by default.** Every component MUST pass AXE checks and meet WCAG AA. Use Angular CDK's a11y module (`LiveAnnouncer`, `FocusMonitor`, `FocusTrap`, etc.).

## Angular Conventions (v21)

- Standalone components only. Do NOT set `standalone: true` — it's the default in Angular v21.
- Signal-based APIs: `input()`, `output()`, `model()` for two-way binding.
- `computed()` and `linkedSignal()` for derived state.
- Do NOT use `mutate` on signals. Use `update` or `set` instead.
- `ChangeDetection.OnPush` on every component.
- `host` object in `@Component`/`@Directive` for host bindings. Never use `@HostBinding` or `@HostListener`.
- `inject()` for dependency injection. No constructor injection.
- Native control flow: `@if`, `@for`, `@switch`.
- Do NOT use `ngClass` or `ngStyle`. Use `class` and `style` bindings.
- Do not write arrow functions in templates.

## TypeScript

- Strict type checking. Avoid `any`; use `unknown` when the type is uncertain.
- Prefer type inference when obvious.
- Export only what consumers need from each entry point's `index.ts`.

## Library Structure

- Library lives at `projects/ngx-tw/`.
- Each component gets its own directory under `projects/ngx-tw/src/lib/` (e.g., `button/`, `badge/`).
- Selector prefix: `tw`. Use element selectors for components (`tw-button`, `tw-card`) and attribute selectors for directives (`twBadge`, `twTooltip`).
- Follow Angular v21 style guide naming: bare names without type suffixes — `button.ts` (not `button.component.ts`), `badge.ts`, `button.spec.ts`.
- **Secondary entry points:** every component directory is its own entry point (e.g., `ngx-tw/button`, `ngx-tw/badge`). Consumers import per-component: `import { ButtonComponent } from 'ngx-tw/button'`.
- **Class naming:** follow Angular CLI conventions — `ButtonComponent`, `BadgeDirective`, `TooltipDirective`. No manual prefix; the package scope (`ngx-tw/button`) provides namespacing. Shared types use `Tw` prefix (`TwColor`, `TwSize`) since they are hand-authored and appear in consumer code.
- Each component directory must contain its own `ng-package.json` with `{ "lib": { "entryFile": "index.ts" } }` and an `index.ts` that re-exports the public API for that entry point.
- Shared code (e.g., `types.ts`) lives in a `core/` secondary entry point (`ngx-tw/core`).
- The root `public-api.ts` re-exports all entry points for convenience, but consumers are encouraged to use direct imports for tree-shaking.
- The `theme/` directory at `projects/ngx-tw/theme/` contains the default theme CSS that maps semantic tokens to Tailwind palette colors. It is shipped as a CSS asset, not a secondary entry point.
- Peer dependencies: `@angular/core`, `@angular/common`, `@angular/cdk`, `tailwindcss`, `tailwind-variants`.

## Styling with Tailwind CSS v4

- Tailwind v4 has **no config file** (`tailwind.config.js` does not exist). Customization uses `@theme` in CSS.
- Apply utilities directly via `host` class bindings or in templates. No separate `.css`/`.scss` files for components.
- Use Tailwind's built-in design tokens (spacing, typography). Do not hardcode hex values or pixel sizes.
- Disabled states: use Tailwind's `disabled:` variant with `aria-disabled` for accessibility.

### Semantic Color Tokens

Components use **semantic color tokens**, not raw Tailwind palette colors. This enables consumers to define custom themes, dark mode, and brand-specific palettes by remapping tokens.

**Semantic token naming:** `{role}-{shade}` where role is the semantic purpose and shade follows the Tailwind 50–950 scale.

**Semantic color roles used in components:**
- `info` — informational messages, neutral highlights
- `success` — positive outcomes, confirmations
- `warning` — caution, attention needed
- `error` — critical issues, destructive actions
- `primary` — primary brand actions, key UI elements
- `secondary` — secondary actions, supporting UI
- `accent` — decorative emphasis, highlights
- `neutral` — borders, backgrounds, subdued text

**In component code**, always use semantic tokens: `bg-info-50`, `text-error-800`, `border-primary-300` — never `bg-blue-50`, `text-red-800`, `border-indigo-300`.

### Surface, Foreground & Border Tokens

For neutral/structural styling, use the **surface**, **fg**, and **border** tokens defined in the theme — never raw `neutral-*` shades. These tokens automatically adapt to dark mode.

**Surface tokens (backgrounds):**
- `surface` — default page/component background
- `surface-raised` — elevated elements (cards, modals)
- `surface-overlay` — overlays, popovers
- `surface-sunken` — recessed areas (code blocks, wells)
- `surface-muted` — subtle backgrounds (gutters, inactive tabs, headers)

**Foreground tokens (text/icons):**
- `fg` — primary text, high contrast
- `fg-muted` — secondary text, descriptions, subtitles
- `fg-subtle` — tertiary text, placeholders, line numbers

**Border tokens:**
- `border` — standard structural borders (dividers, panel edges)
- `border-muted` — very subtle borders (ghost variant footers)
- `border-strong` — emphasized borders (code-block outlines)

**Usage rule:** For color-specific variants (alert colors, tab active states), use `{color}-{shade}` tokens with explicit `dark:` overrides. For neutral structural styling (backgrounds, text, borders that don't change with the color variant), always use surface/fg/border tokens — they handle dark mode automatically.

**The library ships a default theme** at `projects/ngx-tw/theme/default.css` that maps semantic tokens to Tailwind palette colors. Consumers must import this theme (or their own) in their app's CSS:

```css
/* Consumer's styles.css */
@import 'ngx-tw/theme/default.css';
```

**To customize**, consumers override semantic tokens via `@theme` in their own CSS:

```css
@import 'ngx-tw/theme/default.css';

@theme {
  --color-primary-500: oklch(0.55 0.2 260);  /* rebrand primary to indigo */
  --color-info-50: var(--color-sky-50);       /* remap info to sky */
}
```

**Dark mode** is handled by the consumer's theme layer — components use semantic tokens which resolve to whatever the consumer defines for light/dark contexts.

### Visual Design System

All components must follow these design tokens and patterns for visual consistency. When building a new component, reference this section — do not invent new values.

#### Border Radius

Use a consistent radius scale. Pick the value that matches the component's visual weight:

| Token | Usage |
|---|---|
| `rounded-md` | Small interactive elements: buttons, badges, dismiss buttons, pill tab triggers |
| `rounded-lg` | Standard containers: alerts, cards, panels, enclosed tabs, code blocks |
| `rounded-xl` | Outer wrappers with internal rounded children: pill tablists |
| `rounded-full` | Circular elements: avatars, dot indicators |
| `rounded-none` | Explicit "no radius" variant |

Do not use `rounded`, `rounded-sm`, `rounded-2xl`, or `rounded-3xl`. Stick to `md`, `lg`, `xl`, `full`, `none`.

#### Spacing Scale

Components expose a `size` input mapped to a padding scale. Use this scale consistently:

| Size | Padding | Tailwind |
|---|---|---|
| `xs` | 0.5rem | `p-2` |
| `sm` | 0.75rem | `p-3` |
| `md` | 1rem | `p-4` |
| `lg` | 1.5rem | `p-6` |
| `xl` | 2rem | `p-8` |

For inline element padding (buttons, tabs triggers, badges), use the horizontal/vertical pattern:

| Size | Padding | Tailwind |
|---|---|---|
| `xs` | `px-2 py-1` | tight |
| `sm` | `px-3 py-1.5` | compact |
| `md` | `px-4 py-2` | default |
| `lg` | `px-5 py-2.5` | comfortable |
| `xl` | `px-6 py-3` | spacious |

#### Gap Values

Use these standard gap values in flex/grid layouts:

| Gap | Usage |
|---|---|
| `gap-1` | Tight spacing between pill tabs in a tablist |
| `gap-1.5` | Icon + label inside a trigger/button |
| `gap-2` | Action button groups, small item lists |
| `gap-3` | Icon + content in alerts, avatar + title in headers |

Do not use `gap-0.5`, `gap-4`, `gap-5`, or larger. If a layout needs more separation, use padding on the container instead.

#### Typography

**Font sizes** by component role:

| Role | Size | Weight |
|---|---|---|
| Body text, alert content | `text-sm` | normal (400) |
| Titles, header labels | `text-sm` | `font-semibold` (600) |
| Subtitles, descriptions | `text-sm` | normal + `text-neutral-500` |
| Interactive triggers (tabs, buttons) | `text-sm` (md), scale with size | `font-medium` (500) |
| Captions, metadata, footers | `text-xs` | normal |
| Monospace content | `font-mono text-sm` | normal |

**Trigger font size scale** (for tabs, segmented controls, button groups):

| Size | Font |
|---|---|
| `xs` | `text-xs` |
| `sm`–`md` | `text-sm` |
| `lg`–`xl` | `text-base` |

Do not use `text-lg`, `text-xl`, or larger in library components. Headings inside projected content are the consumer's responsibility.

#### Shadows

Shadows are used sparingly. Three levels:

| Shadow | Usage |
|---|---|
| `shadow-sm` | Subtle lift: active pill tabs, small floating elements |
| `shadow` | Standard elevation: elevated cards (resting state), raised surfaces |
| `shadow-md` | Prominent elevation: elevated cards on hover, floating panels (code blocks) |

Do not use `shadow-lg`, `shadow-xl`, or `shadow-2xl`. Components should feel flat by default — shadows are reserved for explicit elevation variants.

#### Transitions

All interactive state changes must be animated. Use these standard durations:

| Duration | Usage |
|---|---|
| `duration-150` | Fast micro-interactions: panel entry animations, fade-ins |
| `duration-200` | Standard hover/focus transitions: color changes, shadow changes, border changes |

**Transition properties:**
- Color changes (background, text, border): `transition-colors duration-200`
- Shadow changes: `transition-shadow duration-200`
- Multiple properties: `transition-[color,shadow] duration-200` — never use `transition-all`

**Panel/content animations:** Use CSS `@keyframes` with `150ms ease-in` for entry. Always respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) { animation-duration: 0ms; }
```

#### Focus Rings

Every interactive element must show a visible focus indicator. Use this exact pattern:

```
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
```

- Always use `focus-visible`, never `focus`. Users navigating with a mouse should not see focus rings.
- Outline width: `2` (2px). Offset: `2` (2px). Color: `primary-500`.
- For selected/active states that persist, use `ring-2 ring-offset-2 ring-primary-500` instead.

#### Icon Sizing

Icons inside components follow this scale:

| Context | Size | Tailwind |
|---|---|---|
| Inside captions, small buttons | `size-4` (16px) | `size-4` |
| Standard icons (alerts, navigation) | `size-5` (20px) | `size-5` |
| Large standalone icons, avatars | `size-10` (40px) | `size-10` |

Always add `shrink-0` to icons in flex containers to prevent them from collapsing. Use `mt-0.5` on icons next to multi-line text to align with the first line's baseline.

#### Opacity & Disabled States

| State | Opacity | Additional |
|---|---|---|
| Disabled elements | `opacity-50` | `pointer-events-none` or `cursor-not-allowed` |
| Muted/inactive controls | `opacity-70` | `hover:opacity-100` for interactive |
| Disabled buttons in groups | `disabled:opacity-30` | `disabled:cursor-default` |
| Subdued text (line numbers, metadata) | use `text-fg-muted` or `text-fg-subtle` | prefer semantic fg tokens over opacity |

For disabled states, prefer `opacity-50 pointer-events-none` on the container. For individual disabled controls within a group (e.g., scroll buttons), use `disabled:opacity-30 disabled:cursor-default`.

#### Borders

**Structural dividers** (between sections within a component): `border-border` (1px) — uses the theme's border token.
**Emphasized structural borders** (container outlines): `border-border-strong` (1px).
**Subtle structural borders** (ghost variants): `border-border-muted` (1px).
**Semantic borders** (colored outlines for alert/badge variants): `border-{color}-300` (1px).
**Active indicators** (tab underlines, selection marks): `border-{color}-500` (2px via `border-b-2` or `border-r-2`).

Do not use `border-2` or thicker for structural borders. Reserve 2px borders for active state indicators only.

#### Hover States

Follow these patterns based on component type:

| Component type | Hover pattern |
|---|---|
| Elevated surfaces (cards) | `hover:shadow-md` — shadow deepens |
| Outlined surfaces | `hover:border-border-strong` — border darkens |
| Filled/ghost surfaces | `hover:bg-surface-muted` or `hover:bg-surface-sunken` — background shifts |
| Icon buttons, dismiss controls | `hover:opacity-100` or `hover:bg-surface-muted` |
| Text-based triggers (tabs) | `hover:text-fg` or `hover:bg-surface-muted` |

#### Overflow & Scrolling

- Containers with rounded corners that clip children: `overflow-hidden`.
- Scrollable content areas: `overflow-x-auto` (horizontal) or `overflow-y-auto` (vertical).
- Hidden scrollbars (for tab strips): use a CSS class with `scrollbar-width: none` and `::-webkit-scrollbar { display: none }`.
- Flex children that may truncate: always add `min-w-0` to enable text truncation.
- Code/preformatted content: `whitespace-pre` (default), `whitespace-pre-wrap` (word-wrap mode).

#### Cursor States

| State | Cursor |
|---|---|
| Interactive/clickable | `cursor-pointer` |
| Disabled | `pointer-events-none` (on container) or `disabled:cursor-not-allowed` (on control) |
| Disabled in a group | `disabled:cursor-default` |
| Non-interactive text areas | inherit (no explicit cursor) |

## Variants — tailwind-variants

- Use **tailwind-variants** (`tv`) for all variant-driven styling. It is the single pattern for managing class strings across the library.
- Define a `tv()` config per component, co-located in the same file. Do not export variant configs.
- Use **slots** for multi-part components (e.g., a card with root/header/body/footer). Single-element components use `tv()` without slots.
- Wire variants to signal inputs via `computed()` and apply through `host: { '[class]': 'classes()' }` (or per-slot in templates).
- Always define `defaultVariants` so the component works with zero configuration.
- Use `compoundVariants` when a combination of variants needs special styling (e.g., `color: 'primary'` + `size: 'sm'`).

## Consumer Customization

- Enable `twMerge` in all `tv()` configs so consumer class overrides resolve correctly against internal classes.
- Use `ng-content` for structural flexibility. Keep the DOM flat — avoid unnecessary wrapper `<div>` elements.
- Use template directives (e.g., `*twCardHeader`) for complex slot customization when content projection alone is insufficient.
- Components must work with any consumer theme. Use semantic color tokens exclusively — never raw palette colors in component code.

## Form Compatibility

- Interactive controls (inputs, selects, toggles, etc.) MUST work with **all three** Angular form strategies: template-driven forms, reactive forms, and signal-based forms.
- Implement `ControlValueAccessor` from `@angular/forms` for any component that acts as a form control.
- Do NOT prescribe a form approach — the consumer decides.

## Component API Design

- **Inputs:** adjectives for state (`disabled`, `selected`), nouns for data (`label`, `color`, `size`). Boolean inputs default to `false`.
- **Outputs:** follow Angular's `propertyChange` pattern (`valueChange`, `openedChange`). Action events use past tense (`closed`, `selected`).
- Use `input()` for configuration. Use `model()` only when the consumer needs two-way binding syntax `[(prop)]` — the component mutates a value the parent owns.
- Prefer a single `variant` input for the primary visual axis (`solid | outline | ghost`). Use separate inputs when axes are independent (`color`, `size`).
- **Shared variant types:** define common variant types (`TwColor`, `TwSize`) in the `core/` secondary entry point (`ngx-tw/core`). Every component that exposes `color` or `size` must use these shared types.
- **Class merging:** `twMerge` is enabled globally via `tv()` — never concatenate class strings manually.
- Content projection over inputs for rich content. Use `ng-content` for a button's label, not a `label` input.
- Keep inputs under 5–6 per component. More signals a need to split or use content projection.

## Accessibility

- MUST pass all AXE checks.
- MUST meet WCAG AA: focus management, color contrast, ARIA attributes.
- Use Angular CDK's a11y utilities: `FocusMonitor`, `FocusTrap`, `LiveAnnouncer`, `AriaDescriber`.
- Every interactive component must define keyboard behavior.

## Testing

- Tests use **Vitest** (not Jasmine/Karma).
- Test files live next to the source: `button.spec.ts` beside `button.ts` (matching the bare-name convention).
- Test behavior, not implementation details. Focus on: user interactions, accessibility (ARIA states), input/output contracts.
- Use Angular's `TestBed` with CDK test harnesses where available.

## Templates

- Prefer inline templates (`template:`) to keep everything in one file.
- When a template exceeds ~50 lines, extract it to an external `.html` file to keep files readable.

## What NOT To Do

- Do not add NgModules.
- Do not create wrapper services for simple logic.
- Do not create helper utilities or abstractions for one-off operations.
- Do not add CSS files to components — Tailwind utilities only.
- Do not use `providedIn: 'root'` in library services (consumers control injection scope).
- Do not use raw Tailwind palette colors (`blue-*`, `red-*`, etc.) in components — use semantic tokens (`info-*`, `error-*`, etc.).
- Do not assume the consumer's theme — components must work with any semantic token mapping.
