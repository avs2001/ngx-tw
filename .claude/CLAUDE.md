# ngx-tw — Angular + Tailwind CSS Component Library

**ngx-tw** is an Angular component library for projects using **Tailwind CSS v4+**. It depends on **Angular CDK** for behavior primitives (overlays, focus management, a11y, collections). Quality bar: [Angular Material](https://github.com/angular/components) — well-tested, accessible, composable — but styled with Tailwind utilities instead of Material Design tokens.

## Core Principles

- **Flexible and simple.** Components must be highly customizable — consumers should be able to adapt appearance and behavior to their needs. The API stays intuitive: sensible defaults, clear naming, minimal ceremony for common cases.
- **Compose Angular CDK, don't reinvent it.** Use CDK for focus traps, keyboard navigation, overlays, ARIA, coercion, and collections. Never rewrite what CDK provides.
- **Tailwind CSS v4 for all styling.** Components use utility classes directly. No component CSS files. No `@tailwind` directives (v4 doesn't use them). Consumers must have Tailwind v4 installed.
- **Accessible by default.** Every component MUST pass AXE checks and meet WCAG AA. Use Angular CDK's a11y module (`LiveAnnouncer`, `FocusMonitor`, `FocusTrap`, etc.).

## Operating mode

For non-trivial code changes — new components, animation work, `ControlValueAccessor` wiring, `public-api.ts` updates, multi-file refactors — treat your own conclusions as suspicious until verified. Call the `advisor` tool before committing to an approach and again before declaring done. Surface unresolved risks explicitly in the closing summary; never declare "done" with hidden uncertainty.

## Angular Conventions (v21)

- Standalone components only. Do NOT set `standalone: true` — it's the default in v21.
- Signal-based APIs: `input()`, `output()`, `model()` for two-way binding.
- `computed()` and `linkedSignal()` for derived state (see below).
- Do NOT use `mutate` on signals. Use `update` or `set`.
- `ChangeDetection.OnPush` on every component.
- `host` object for host bindings. Never `@HostBinding` or `@HostListener`.
- `inject()` for DI. No constructor injection.
- Native control flow: `@if`, `@for`, `@switch`. No `ngClass`/`ngStyle` — use `class`/`style` bindings.
- No arrow functions in templates.

### `computed()` vs `linkedSignal()`

- **`computed()`** — read-only derived state, fully determined by other signals.
- **`linkedSignal()`** — writable derived state that defaults to a source signal but can be overridden by user interaction. Canonical case: a controlled internal value initialized from an `input()` and updated on user action (e.g., a tab component's `activeTab` that defaults to `defaultTab` input but updates locally on click).
- Never use `linkedSignal()` for purely derived/calculated values — that's `computed()`'s job.

## TypeScript

- Strict type checking. Avoid `any`; use `unknown` when uncertain. Prefer type inference when obvious.
- Export only what consumers need from each entry point's `index.ts`.

## JSDoc Requirements

All public API members must have JSDoc. Compodoc parses these to generate API tables in the demo app — missing JSDoc means empty tables.

Required on every `input()` (what it controls + default), `output()` (when it fires + payload), `model()` (two-way bound value + when it changes), and public methods on directives/services.

```typescript
/** Controls the visual style of the button. Defaults to `'solid'`. */
variant = input<ButtonVariant>('solid');

/** Fires when the button is clicked. Payload is the native MouseEvent. */
clicked = output<MouseEvent>();
```

Describe *purpose and behavior* in one line. Do not describe TypeScript types — Compodoc extracts those automatically.

## Library Structure

- Library lives at `projects/ngx-tw/`. Each component is its own directory under `projects/ngx-tw/src/lib/` (e.g., `button/`, `badge/`).
- **Selectors.** Prefix `tw`. Element selectors for components (`tw-button`, `tw-card`); attribute selectors for directives (`twBadge`, `twTooltip`).
- **Naming.** Angular v21 style guide: bare names, no type suffixes — `button.ts`, `badge.ts`, `button.spec.ts`.
- **Secondary entry points.** Every component directory is its own entry point. Consumers import per-component: `import { ButtonComponent } from 'ngx-tw/button'`. Each directory needs its own `ng-package.json` with `{ "lib": { "entryFile": "index.ts" } }` and an `index.ts` re-exporting the public API.
- **Class naming.** Angular CLI conventions — `ButtonComponent`, `BadgeDirective`, `TooltipDirective`. **Never** apply a `Tw*` prefix to component or directive class identifiers — the package scope (`ngx-tw/button`) provides namespacing, and Angular CLI reserves bare names for component classes. Selectors are unaffected: element selectors keep the `tw-` prefix (`tw-button`); attribute selectors keep the `tw` camelCase prefix (`twBadge`). Shared **types** are the only identifiers that carry a `Tw` prefix (`TwColor`, `TwSize`) because they are hand-authored and appear in consumer code with no other namespace cue. Codified exception: the `TwSplit*` family (`TwSplit`, `TwSplitPane`, `TwSplitGutter`, `TwSplitPaneHeader`) is scheduled for rename in a future PR — do not introduce new violators.
- Shared code (e.g., `types.ts`) lives in a `core/` secondary entry point (`ngx-tw/core`).
- Root `public-api.ts` re-exports all entry points for convenience; consumers are encouraged to use direct imports for tree-shaking.
- `projects/ngx-tw/theme/` contains the default theme CSS that maps semantic tokens to Tailwind palette colors. Shipped as a CSS asset, not a secondary entry point.
- Peer dependencies: `@angular/core`, `@angular/common`, `@angular/cdk`, `tailwindcss`, `tailwind-variants`.

## Styling with Tailwind CSS v4

- Tailwind v4 has **no config file** (`tailwind.config.js` does not exist). Customization uses `@theme` in CSS.
- Apply utilities directly via `host` class bindings or templates. No `.css`/`.scss` files for components.
- Use Tailwind's built-in design tokens (spacing, typography). Do not hardcode hex values or pixel sizes.
- Disabled states: Tailwind's `disabled:` variant with `aria-disabled` for accessibility.

### Semantic Color Tokens

Components use **semantic color tokens** (`{role}-{shade}` on the 50–950 scale), never raw Tailwind palette colors. This lets consumers retheme (including dark mode and brand palettes) by overriding tokens via `@theme` in their own CSS. Dark mode is handled by the consumer's theme layer.

| Role | Use for |
|---|---|
| `info` | informational messages, neutral highlights |
| `success` | positive outcomes, confirmations |
| `warning` | caution, attention needed |
| `error` | critical issues, destructive actions |
| `primary` | primary brand actions, key UI elements |
| `secondary` | secondary actions, supporting UI |
| `accent` | decorative emphasis, highlights |
| `neutral` | borders, backgrounds, subdued text |

In component code: `bg-info-50`, `text-error-800`, `border-primary-300` — never `bg-blue-50`, `text-red-800`, `border-indigo-300`.

### Surface, Foreground & Border Tokens

For neutral/structural styling, use these tokens instead of raw `neutral-*` shades — they automatically adapt to dark mode.

| Token | Kind | Use for |
|---|---|---|
| `surface` | bg | default page/component background |
| `surface-raised` | bg | elevated elements (cards, modals) |
| `surface-overlay` | bg | overlays, popovers |
| `surface-sunken` | bg | recessed areas (code blocks, wells) |
| `surface-muted` | bg | subtle backgrounds (gutters, inactive tabs, headers) |
| `fg` | text | primary text, high contrast |
| `fg-muted` | text | secondary text, descriptions, subtitles |
| `fg-subtle` | text | tertiary text, placeholders, line numbers |
| `border` | border | standard structural (dividers, panel edges) |
| `border-muted` | border | very subtle (ghost variant footers) |
| `border-strong` | border | emphasized (code-block outlines) |

**Rule.** For color-specific variants (alert colors, tab active states), use `{color}-{shade}` tokens with explicit `dark:` overrides. For neutral structural styling (backgrounds, text, borders that don't change with the color variant), use surface/fg/border tokens — they handle dark mode automatically.

### Visual Design System

All components must follow these design tokens and patterns for visual consistency. Reference this section — do not invent new values.

#### Border Radius

| Token | Use for |
|---|---|
| `rounded-md` | small interactive: buttons, badges, dismiss buttons, pill tab triggers |
| `rounded-lg` | standard containers: alerts, cards, panels, enclosed tabs, code blocks |
| `rounded-xl` | outer wrappers with internal rounded children: pill tablists |
| `rounded-full` | circular: avatars, dot indicators |
| `rounded-none` | explicit "no radius" variant |

Do not use `rounded`, `rounded-sm`, `rounded-2xl`, or `rounded-3xl`.

#### Spacing Scale

Container padding (mapped to `size` input):

| Size | Padding |
|---|---|
| `xs` | `p-2` (0.5rem) |
| `sm` | `p-3` (0.75rem) |
| `md` | `p-4` (1rem) |
| `lg` | `p-6` (1.5rem) |
| `xl` | `p-8` (2rem) |

Inline element padding (buttons, tab triggers, badges):

| Size | Padding | Density |
|---|---|---|
| `xs` | `px-2 py-1` | tight |
| `sm` | `px-3 py-1.5` | compact |
| `md` | `px-4 py-2` | default |
| `lg` | `px-5 py-2.5` | comfortable |
| `xl` | `px-6 py-3` | spacious |

#### Gap Values

| Gap | Use for |
|---|---|
| `gap-1` | tight spacing between pill tabs in a tablist |
| `gap-1.5` | icon + label inside a trigger/button |
| `gap-2` | action button groups, small item lists |
| `gap-3` | icon + content in alerts, avatar + title in headers |

Do not use `gap-0.5`, `gap-4`, `gap-5`, or larger. Use container padding for more separation.

#### Typography

Font sizes by component role:

| Role | Size | Weight |
|---|---|---|
| Body text, alert content | `text-sm` | normal (400) |
| Titles, header labels | `text-sm` | `font-semibold` (600) |
| Section-header item title (`tw-item` size `lg`) | `text-base` | `font-semibold` (600) |
| KPI value (`tw-stat` size `lg`/`xl`) | `text-base` | `font-bold` (lg) / `font-extrabold` (xl) |
| Subtitles, descriptions | `text-sm` | normal + `text-neutral-500` |
| Interactive triggers (tabs, buttons) | `text-sm` (md), scale with size | `font-medium` (500) |
| Captions, metadata, footers | `text-xs` | normal |
| xs-density secondary text (xs descriptions, xs meridiem buttons, kbd hints) | `text-2xs` | normal |
| Monospace content | `font-mono text-sm` | normal |

`text-base` (16px) is permitted **only** for the codified exceptions above — the lg-density `tw-item` title (dominant section header above a `text-sm` description) and the `tw-stat` lg/xl value (dominant KPI numeric above a `text-sm` label/description). Do not introduce new uses of `text-base` for component-internal text.

Trigger font size scale (tabs, segmented controls, button groups):

| Size | Font |
|---|---|
| `xs` | `text-xs` |
| `sm`–`md` | `text-sm` |
| `lg`–`xl` | `text-base` |

`text-2xs` (defined in `theme/_semantic.css` as `0.6875rem` / 11px) is the smallest permitted step, only when xs density genuinely needs to sit below `text-xs`. Do not use `text-lg`, `text-xl`, or larger in library components — headings inside projected content are the consumer's responsibility. Never use arbitrary font-size values like `text-[11px]` or `text-[0.6875rem]` — use `text-2xs`.

#### Shadows

| Shadow | Use for |
|---|---|
| `shadow-sm` | subtle lift: active pill tabs, small floating elements |
| `shadow` | standard elevation: elevated cards (resting), raised surfaces |
| `shadow-md` | prominent elevation: elevated cards on hover, floating panels (code blocks) |

Do not use `shadow-lg`, `shadow-xl`, or `shadow-2xl`. Components feel flat by default; shadows are reserved for explicit elevation variants.

#### Transitions

| Duration | Use for |
|---|---|
| `duration-150` | fast micro-interactions: panel entry animations, fade-ins |
| `duration-200` | standard hover/focus transitions: color, shadow, border |
| `duration-normal` | alias for `duration-200` defined in `theme/_typography.css`. Used by tabs, tab-nav, paginator, menu, command-palette, progress-bar — components whose transitions ride a single theme-overridable token |

Properties: `transition-colors duration-200` for color shifts; `transition-shadow duration-200` for shadows; `transition-[color,shadow] duration-200` for combinations. **Never `transition-all`.** For `prefers-reduced-motion` on Tailwind transitions, append `motion-reduce:transition-none`.

#### Enter/Leave Animations

Do NOT use `@angular/animations` — deprecated in v20.2, removed in v23. Use Angular's native `animate.enter`/`animate.leave` for DOM insertion/removal animations (compiler-level features, not directives):

- `animate.enter="fade-in"` — applies the class on DOM entry; removes when the animation completes
- `animate.leave="fade-out"` — Angular holds the element in the DOM until the animation finishes
- Host binding: `host: { '[animate.enter]': 'enterAnimation' }` where `enterAnimation` is a signal or string property
- Multiple classes are space-separated: `animate.enter="slide-in fade-in"`

**Keyframe definitions live in `projects/ngx-tw/theme/default.css`** (e.g., `.fade-in`, `.slide-in`), not in component files. Components reference class names only. Handle `prefers-reduced-motion` in the theme CSS alongside the keyframe: `@media (prefers-reduced-motion: reduce) { .fade-in { animation-duration: 0ms; } }`.

#### Focus Rings

Every interactive element must show a visible focus indicator. Canonical pattern:

```
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
```

Always use `focus-visible`, never `focus` — mouse users should not see focus rings. Outline 2px, offset 2px, color `primary-500`. For selected/active states that persist, use `ring-2 ring-offset-2 ring-primary-500`.

**Menu-item carve-out.** Elements with `role` `menuitem`, `menuitemcheckbox`, or `menuitemradio` MAY use a background-shift focus indicator (`focus-visible:bg-surface-muted`) instead of the canonical outline ring. This matches Material, Radix, and Headless UI conventions and keeps the menu visually quiet during keyboard traversal. The element must still expose `focus-visible:` styling — never bare `focus:` — and the background shift must be unambiguously distinguishable from the resting state. Canonical example: `projects/ngx-tw/menu/menu.ts`.

**Activedescendant-listbox carve-out.** Elements rendered as `role="option"` inside a combobox+listbox using `aria-activedescendant` (DOM focus stays on the combobox input; the "active" option is identified only by id reference) MAY use the same background-shift indicator. In this pattern the option element never receives DOM focus, so `focus-visible:` never fires and the canonical outline ring is unreachable — the background shift is the only viable visual signal. The shift must be unambiguous and the option must still carry `aria-selected` / `aria-activedescendant` wiring for assistive tech. Canonical example: `projects/ngx-tw/command-palette/command-palette.ts`. The canonical outline ring still applies to focus-managed listboxes where each option receives `tabindex` / `focus()` directly.

These carve-outs do NOT extend to other listbox-like roles (`tab`, `treeitem`) or to focus-managed options; those still take the canonical outline ring.

#### Icon Sizing

Four sub-scales for `size-*` utilities. Pick the sub-scale that matches the role, then pick the value within it. Do not mix sub-scales (never `size-7` for a glyph; never `size-5` for a dot indicator).

**Glyph icons** — SVG icons rendered inline alongside text:

| Context | Tailwind |
|---|---|
| inside captions, small buttons | `size-4` (16px) |
| standard icons (alerts, navigation) | `size-5` (20px) |
| large standalone, avatars | `size-10` (40px) |

The `<tw-icon>` component parametrises the glyph scale across the full `TwSize` axis — `xs` → `size-3` (12px), `sm` → `size-4` (16px), `md` → `size-5` (20px), `lg` → `size-6` (24px), `xl` → `size-8` (32px). Hand-authored SVGs outside `<tw-icon>` should stick to the three canonical sizes above unless they share the component's `size` input.

**Square interactive targets** — icon-only buttons where the container *is* the touch target (paginator chevrons, stepper indicators, sort-header arrow buttons). The glyph inside still uses the glyph scale.

| Size | Tailwind |
|---|---|
| `xs` | `size-6` (24px) |
| `sm` | `size-7` (28px) |
| `md` | `size-8` (32px) |
| `lg` | `size-9` (36px) |

**Saturation note.** The square-interactive scale stops at `lg`. The breadcrumb overflow trigger reuses `size-9` for both `lg` and `xl` — once the dropdown trigger is keyboard-reachable and clearly tappable, scaling further reads as visual bloat rather than a meaningful size step.

**Dot indicators** — non-interactive status markers (stepper dots, presence indicators):

| Size | Tailwind |
|---|---|
| `xs` | `size-2` (8px) |
| `sm` | `size-2.5` (10px) |
| `md` | `size-3` (12px) |

**Half-step decorative.** `size-3.5` (14px) is permitted **only** for xs-density chevrons inside compact triggers (sort, pickers, time-picker meridiem, split chevron) where neither `size-3` nor `size-4` lines up with adjacent text. Each use must carry a one-line comment explaining why the half-step is needed.

Always add `shrink-0` to icons in flex containers to prevent collapse. Use `mt-0.5` on icons next to multi-line text to align with the first line's baseline.

#### Opacity & Disabled States

| State | Opacity | Additional |
|---|---|---|
| Disabled elements | `opacity-50` | `pointer-events-none` or `cursor-not-allowed` |
| Muted/inactive controls | `opacity-70` | `hover:opacity-100` if interactive |
| Disabled buttons in groups | `disabled:opacity-30` | `disabled:cursor-default` |
| Subdued text (line numbers, metadata) | — | use `text-fg-muted`/`text-fg-subtle` instead of opacity |

Prefer `opacity-50 pointer-events-none` on the container. For individual disabled controls within a group (e.g., scroll buttons), use `disabled:opacity-30 disabled:cursor-default`.

#### Borders

| Use | Token | Width |
|---|---|---|
| Structural dividers (between sections) | `border-border` | 1px |
| Emphasized structural (container outlines) | `border-border-strong` | 1px |
| Subtle structural (ghost variants) | `border-border-muted` | 1px |
| Semantic (colored outlines for alert/badge variants) | `border-{color}-300` | 1px |
| Active indicators (tab underlines, selection marks) | `border-{color}-500` | 2px via `border-b-2`/`border-r-2` |

Do not use `border-2` or thicker for structural borders. Reserve 2px borders for active state indicators only.

#### Hover States

| Component type | Hover pattern |
|---|---|
| Elevated surfaces (cards) | `hover:shadow-md` — shadow deepens |
| Outlined surfaces | `hover:border-border-strong` — border darkens |
| Filled/ghost surfaces | `hover:bg-surface-muted` or `hover:bg-surface-sunken` |
| Icon buttons, dismiss controls | `hover:opacity-100` or `hover:bg-surface-muted` |
| Text-based triggers (tabs) | `hover:text-fg` or `hover:bg-surface-muted` |

#### Overflow & Scrolling

- Containers with rounded corners that clip children: `overflow-hidden`.
- Scrollable content areas: `overflow-x-auto` (horizontal) or `overflow-y-auto` (vertical).
- Hidden scrollbars (tab strips): CSS class with `scrollbar-width: none` and `::-webkit-scrollbar { display: none }`.
- Flex children that may truncate: always add `min-w-0` to enable text truncation.
- Code/preformatted content: `whitespace-pre` (default), `whitespace-pre-wrap` (word-wrap mode).

#### Cursor States

| State | Cursor |
|---|---|
| Interactive/clickable | `cursor-pointer` |
| Disabled (container) | `pointer-events-none` |
| Disabled (control) | `disabled:cursor-not-allowed` |
| Disabled in a group | `disabled:cursor-default` |
| Non-interactive text areas | inherit |

## Variants — tailwind-variants

- Use **tailwind-variants** (`tv`) for all variant-driven styling. The single pattern for managing class strings across the library.
- Define a `tv()` config per component, co-located in the same file. Do not export variant configs.
- **Slots** for multi-part components (e.g., a card with root/header/body/footer). Single-element components use `tv()` without slots.
- Wire variants to signal inputs via `computed()` and apply through `host: { '[class]': 'classes()' }` (or per-slot in templates).
- Always define `defaultVariants` so the component works with zero configuration.
- Use `compoundVariants` when a combination of variants needs special styling (e.g., `color: 'primary'` + `size: 'sm'`).
- Enable `twMerge` in every `tv()` config so consumer class overrides resolve correctly against internal classes. Never concatenate class strings manually.

## Consumer Customization

- Use `ng-content` for structural flexibility. Keep the DOM flat — avoid unnecessary wrapper `<div>` elements.
- Use template directives (e.g., `*twCardHeader`) for complex slot customization when content projection alone is insufficient.
- Components must work with any consumer theme. Use semantic color tokens exclusively — never raw palette colors in component code.

### Content Projection Fallback

Angular v18+ supports native fallback content in `ng-content` slots:

```html
<ng-content select="[slot='icon']">
  <!-- fallback renders when no icon is projected -->
  <tw-icon name="default" />
</ng-content>
```

- Provide fallback content for optional slots with a meaningful default (e.g., a dismiss icon, a placeholder avatar).
- Do NOT provide fallback for structural slots (header, body, footer of a card) — if absent, the region should not render at all; use `@if` with a `contentChild()` query to detect presence.
- Do NOT rely on fallback for logic — fallback does not activate when content is conditionally projected via `@if`. To detect presence, use `contentChild()` and check for `undefined`.

## Form Compatibility

- Interactive controls (inputs, selects, toggles, etc.) MUST work with **all three** Angular form strategies: template-driven, reactive, and signal-based forms.
- Implement `ControlValueAccessor` from `@angular/forms` for any component that acts as a form control.
- Do NOT prescribe a form approach — the consumer decides.

## ControlValueAccessor

Register `ControlValueAccessor` exclusively via runtime assignment:

```ts
private readonly ngControl = inject(NgControl, { optional: true, self: true });

constructor() {
  if (this.ngControl) {
    this.ngControl.valueAccessor = this;
  }
}
```

**Do not** provide `NG_VALUE_ACCESSOR` via the `providers` array. This pattern is incompatible with `inject(NgControl, { self: true })`, which every ngx-tw form control needs for `TW_ERROR_STATE_MATCHER` integration — the static provider creates a circular DI on the same instance.

Exception: pure-CVA controls that do *not* integrate `TW_ERROR_STATE_MATCHER` (`input`, `textarea`) may use static `NG_VALUE_ACCESSOR`. Any new form control that adds matcher integration MUST migrate to the runtime pattern at the same time.

## Component API Design

- **Inputs:** adjectives for state (`disabled`, `selected`), nouns for data (`label`, `color`, `size`). Boolean inputs default to `false` unless they qualify for the documented exception below.
- **Outputs:** Angular's `propertyChange` pattern (`valueChange`, `openedChange`). Action events use past tense (`closed`, `selected`).
- Use `input()` for configuration. Use `model()` only when the consumer needs two-way binding `[(prop)]` — the component mutates a value the parent owns.
- Prefer a single `variant` input for the primary visual axis (`solid | outline | ghost`). Use separate inputs when axes are independent (`color`, `size`).
- **Shared variant types:** define common variant types (`TwColor`, `TwSize`) in `ngx-tw/core`. Every component exposing `color` or `size` must use these shared types.
- Content projection over inputs for rich content — use `ng-content` for a button's label, not a `label` input.

### Input count cap

Default cap: **≤ 5–6 inputs per component.** More signals over-configuration; the fix is content projection or splitting into multiple components.

The library codifies five exceptions where the cap is impractical because the component shape inherently demands a wider configuration surface. A new component that fits one of the shapes below MAY exceed the cap; otherwise, refactor.

| Exception | Why the surface is wide | Canonical example |
|---|---|---|
| **Overlay-bearing components** | CDK overlay primitives demand position, scroll strategy, backdrop, focus-trap, close-behavior, etc. | popover, menu, tooltip, dialog, command-palette, select, calendar/date-picker, time-picker |
| **Form controls** | ARIA + Forms baseline (`aria-label{ledby,by}`, `name`, `label`, `description`, `required`, `disabled`, `labelPosition`, plus `color`/`size`/`variant`) is ~12 inputs minimum | `checkbox` (12+ inputs) |
| **Structural-layout primitives** | Each input is an independent geometric or behavioural axis (axis, unit, gutter, persistence, keyboard step, RTL, label) | `split` (`SplitComponent` 10 + `SplitPaneComponent` 8) |
| **Data primitives** | Tabular APIs have multiple orthogonal config axes (appearance, sticky, responsive, selection) | `table` — temporary; PR8 reshapes into config objects, after which this exception no longer applies |
| **Navigation primitives** | Pagination demands many independent semantic axes (boundary/sibling counts, layout, type, page-size selector, first/last jump buttons, responsive collapse, link-mode factory, custom labels for i18n) that cannot meaningfully be flattened into config objects. Material's `MatPaginator` carries a comparable surface. | `paginator` (~20 inputs) |

Visual primitives (avatar, icon) and decorative primitives (progress-bar) do **not** qualify — reshape with config objects.

### Boolean defaults

Boolean inputs default to `false`. The exception: defaults of `true` are permitted when the resting "off" state would surprise consumers and the rationale is documented in an inline JSDoc comment on the same input. The codified list:

- `spinner.track = input(true)` — without the track ring the spinner reads as a partial arc, not a loading indicator
- `accordion.collapsible = input(true)` — accordions are collapsible by definition; opt-out only
- `calendar.bordered = input(true)` — embedded calendar reads as bordered; the borderless variant is the special case
- `calendar.showAdjacentMonths = input(true)` — month grid expects the leading/trailing days to render
- *(calendar range-behavior knobs `allowSingleDayRange` / `persistPartialRange` previously codified here are now per-field defaults inside `RangeBehaviorConfig`; the rationale lives on the interface JSDoc in `projects/ngx-tw/core/types.ts`)*
- `commandPalette.closeOnSelect = input(true)` — a command palette is a fire-and-dismiss surface; the "run many" launcher is the special case
- `commandPalette.closeOnEscape = input(true)` — Escape is the universal dismiss key for modal surfaces; non-dismissible palettes are the special case
- `commandPalette.closeOnBackdropClick = input(true)` — clicking outside a modal is the expected dismiss gesture; enforcing an explicit choice is the special case
- `commandPalette.autoFocus = input(true)` — without auto-focus the user must click into the input before typing, defeating the keyboard-first design
- `popover.twPopoverArrow = input(true)` — arrows are the visual anchor of a popover; the arrowless variant is the special case
- `popover.twPopoverCloseOnOutside = input(true)` — outside-click dismiss is the universal popover gesture
- `popover.twPopoverCloseOnEscape = input(true)` — Escape is the universal dismiss key
- `popover.twPopoverTrapFocus = input(true)` — focus trapping is required by APG for modal popovers; non-modal is the special case
- `timePicker.showSteppers = input(true)` — the stepper buttons are the time-picker's primary affordance
- `timePicker.showClear = input(true)` — clearing a partial time is the expected gesture; suppressing it is the special case

New boolean inputs that default to `true` MUST land with the same inline-comment justification or the input must be inverted (e.g., `disabled` instead of `enabled`).

## Accessibility

- MUST pass all AXE checks and meet WCAG AA: focus management, color contrast, ARIA attributes.
- Use Angular CDK's a11y utilities: `FocusMonitor`, `FocusTrap`, `LiveAnnouncer`, `AriaDescriber`.
- Every interactive component must define keyboard behavior.

## Testing

Tests use **Vitest** (default in Angular v21 via `@angular/build:unit-test`). No additional setup packages are needed for new projects. Test files live next to source: `button.spec.ts` beside `button.ts`.

### What every spec must cover

- **Rendering.** Default mount with no inputs; every value of each `variant`/`color`/`size` renders without errors; conditional DOM elements appear/disappear based on inputs.
- **Inputs and outputs.** Each input changes the rendered DOM (query the DOM, not the component class). Each output emits with the correct payload when triggered. Set signal inputs via `fixture.componentRef.setInput('name', value)`.
- **Interaction.** Click, keyboard, and focus interactions produce expected DOM changes and emissions. Disabled state blocks emissions.
- **Accessibility.** Correct ARIA roles/attributes in the default state; ARIA updates on state change (`aria-expanded`, `aria-selected`); every interactive element has a visible focus indicator (query for `focus-visible` styles or check CDK FocusMonitor).
- **Content projection.** Fallback renders when nothing is projected; projected content renders and replaces fallback.
- **ControlValueAccessor (form controls).** `writeValue()` updates the rendered state; user interaction calls `onChange` with the correct value; `setDisabledState(true)` applies the disabled appearance and blocks interaction.

### Vitest-specific rules

- Use `vi.spyOn()` for spies — Jasmine-style spies do not exist in Vitest.
- Do NOT use `fakeAsync` or `tick` — they are not supported with the Vitest runner. Use `async/await` with `fixture.whenStable()` or `vi.useFakeTimers()` / `vi.runAllTimers()` for timer control.
- Import test utilities explicitly: `import { describe, it, expect, vi } from 'vitest'`.
- Always call `fixture.detectChanges()` after setting inputs or triggering interactions before querying the DOM.

### What NOT to test

- Internal signal values or computed property values — test DOM output instead.
- Class names applied to elements — test observable behavior, not implementation details.
- Implementation details of CDK modules — trust CDK; test your integration with it.

## Templates

- Prefer inline templates (`template:`). When a template exceeds ~50 lines, extract it to an external `.html` file.

## What NOT To Do

- Do not add NgModules.
- Do not create wrapper services for simple logic.
- Do not create helper utilities or abstractions for one-off operations.
- Do not use `providedIn: 'root'` in library **services** (consumers control injection scope). Stateless **policy tokens** (canonical example: `TW_ERROR_STATE_MATCHER` in `ngx-tw/core`) are exempt — they ship a single canonical default, hold no per-consumer state, and have no behavior worth scoping. New exempt tokens must be similarly stateless and pure-default.
- Do not assume the consumer's theme — components must work with any semantic token mapping.
