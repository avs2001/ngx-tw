# ngx-tw — Angular + Tailwind CSS Component Library

**ngx-tw** is an Angular component library for projects using **Tailwind CSS v4+**. It depends on **Angular CDK** for behavior primitives (overlays, focus management, a11y, collections). Quality bar: [Angular Material](https://github.com/angular/components) — well-tested, accessible, composable — but styled with Tailwind utilities instead of Material Design tokens.

## Core Principles

- **Flexible and simple.** Components must be highly customizable — consumers should be able to adapt appearance and behavior to their needs. The API stays intuitive: sensible defaults, clear naming, minimal ceremony for common cases.
- **Compose Angular CDK, don't reinvent it.** Use CDK for focus traps, keyboard navigation, overlays, ARIA, and collections. Never rewrite what CDK provides.

  **Coercion is the exception, and the exception is now the rule.** This line used to name coercion as a CDK responsibility. It is stale: the library makes **49 uses of Angular's own `booleanAttribute` / `numberAttribute`** across 14 files and imports `@angular/cdk/coercion` **zero** times. The code is right and the instruction was wrong — `@angular/cdk/coercion` is redundant in v22 and must not be reintroduced. Verified 2026-09-03.

  **The CDK gap in this library is drift, not absence.** Nine of ten "is a CDK package missing?" leads close clean; what is actually wrong is that four concerns CDK already owns are *also* hand-rolled, and the hand-rolled copies have diverged from the CDK-backed siblings beside them — list keyboard navigation (8 CDK-backed vs 8 hand-rolled), layout direction, announcements (`LiveAnnouncer` in 17 vs `aria-live` host regions in 9, with 2 components doing **both**), and unique DOM ids (`_IdGenerator` in 4 files vs `let nextId = 0` in 28). Before hand-rolling any of those four, read what the CDK-backed sibling does.
- **Tailwind CSS v4 for all styling.** Components use utility classes directly. No component CSS files. No `@tailwind` directives (v4 doesn't use them). Consumers must have Tailwind v4 installed.
- **Accessible by default.** Every component MUST pass AXE checks and meet WCAG AA. Use Angular CDK's a11y module (`LiveAnnouncer`, `FocusMonitor`, `FocusTrap`, etc.).

## Operating mode

For non-trivial code changes — new components, animation work, `ControlValueAccessor` wiring, `public-api.ts` updates, multi-file refactors — treat your own conclusions as suspicious until verified. Call the `advisor` tool before committing to an approach and again before declaring done. Surface unresolved risks explicitly in the closing summary; never declare "done" with hidden uncertainty.

## Angular Conventions (v22)

- Standalone components only. Do NOT set `standalone: true` — it's the default in v22.
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

### No signal cycles in `effect()`

**Never mutate a signal inside an `effect()` that the same effect track-reads** (directly, transitively, or through a method it calls). That read → write → re-trigger loop is a signal cycle — the canonical symptom is a UI freeze (e.g. an effect that read `items()` and `thumbnails()` then called `thumbnails.set(...)`). It is the single most common way to hang a component.

Reach for the right primitive instead of an effect:

- **Derived, read-only** → `computed()`.
- **Writable-derived-from-a-source** (reconcile against the previous value, mint/release resources, mirror an `input()` into controllable internal state) → `linkedSignal()` with the two-arg computation `(source, previous) => ...`. The computation does **not** track its own reads, so reconciliation that needs the prior value belongs here, not in an effect.

`effect()` is for side effects that leave the signal graph (DOM, focus, `LiveAnnouncer`, overlay lifecycle, `output.emit`, storage, plain-field bookkeeping) — not for computing state.

**The only permitted signal write inside an `effect()`** is a one-way sync to a **different** signal the effect does **not** track-read — mirroring an `input()` to a child-instance signal, or clamping a `model()` against a sibling source. Such a write **must** be wrapped in `untracked()`, and `untracked()` only breaks the cycle when the written signal is not track-read elsewhere in the same effect (canonical safe example: `carousel.ts` clamps `activeIndex` against `slides()` entirely inside `untracked`). Note `untracked()` around a write is **not** a fix when the written signal is still track-read in the effect body — see the trap below.

**Codified exception.** `paginator.ts` has an intrinsic, documented cycle: its effect must track `page()` (to clamp when the consumer assigns an out-of-range page) *and* write `page.set(clamped)` (to clamp when `totalPages` shrinks). It is bounded by a `clamped !== newPage` guard that settles in exactly one extra tick and never loops; the inline comment on that effect is mandatory reading before touching it. Do not introduce new effects of this shape — if a new one seems unavoidable, it needs the same guard + inline justification, or a `linkedSignal()` refactor.

## TypeScript

- Strict type checking. Avoid `any`; use `unknown` when uncertain. Prefer type inference when obvious.
- Export only what consumers need from each entry point's `index.ts`.

## JSDoc Requirements

All public API members must have JSDoc. **`scripts/mcp/extract-api.mjs` parses these** — its `jsDocOf()` reads the TypeScript compiler's `node.jsDoc` array, it runs as part of `npm run build:lib`, and its output ships in `dist/ngx-tw/index.json` for the `@cdevhub/ngx-tw-mcp` server. JSDoc also reaches the emitted `.d.ts`, and therefore a consumer's IDE hover. Missing JSDoc means both surfaces are blank.

> This rule previously said *"Compodoc parses these to generate API tables in the demo app"*. **Compodoc is not a dependency of this repo** — not in `package.json`, no config, no script; `docs/mcp-server-architecture.md:60-62` already said so in writing, and the demo's API tables are hand-authored HTML. The consequence the rule describes is real, but it runs through the MCP extractor and the `.d.ts`, not Compodoc. Citing a tool that does not exist invites a maintainer to check, find nothing, and conclude the rule is dead ceremony. Corrected 2026-09-03.

Required on every `input()` (what it controls + default), `output()` (when it fires + payload), `model()` (two-way bound value + when it changes), and public methods on directives/services.

```typescript
/** Controls the visual style of the button. Defaults to `'solid'`. */
variant = input<ButtonVariant>('solid');

/** Fires when the button is clicked. Payload is the native MouseEvent. */
clicked = output<MouseEvent>();
```

Describe *purpose and behavior* in one line. Do not describe TypeScript types — the extractor and the `.d.ts` carry those already.

## Library Structure

- Library lives at `projects/ngx-tw/`. Each component is its own directory directly under it (e.g., `projects/ngx-tw/button/`, `projects/ngx-tw/badge/`). There is no `src/lib/` — `projects/ngx-tw/src/` holds only `public-api.ts`.
- **Selectors.** Prefix `tw`. Element selectors for components (`tw-button`, `tw-card`); attribute selectors for directives (`twBadge`, `twTooltip`).
- **Naming.** Angular v22 style guide: bare names, no type suffixes — `button.ts`, `badge.ts`, `button.spec.ts`.
- **Secondary entry points.** Every component directory is its own entry point. Consumers import per-component: `import { ButtonComponent } from '@cdevhub/ngx-tw/button'`. Each directory needs its own `ng-package.json` with `{ "lib": { "entryFile": "index.ts" } }` and an `index.ts` re-exporting the public API.
- **Class naming.** Angular CLI conventions — `ButtonComponent`, `BadgeDirective`, `TooltipDirective`. **Never** apply a `Tw*` prefix to component or directive class identifiers — the package scope (`@cdevhub/ngx-tw/button`) provides namespacing, and Angular CLI reserves bare names for component classes. Selectors are unaffected: element selectors keep the `tw-` prefix (`tw-button`); attribute selectors keep the `tw` camelCase prefix (`twBadge`). Shared **types** are the only identifiers that carry a `Tw` prefix (`TwColor`, `TwSize`) because they are hand-authored and appear in consumer code with no other namespace cue. The `TwSplit*` family has since been renamed (`SplitComponent`, `SplitPaneComponent`, `SplitGutterDirective`, `SplitPaneHeaderDirective`); no component or directive class carries a `Tw` prefix today. The remaining `Tw*` classes — `TwDialog`, `TwDialogRef`, `TwDialogConfig`, `TwDateRange` — are a service, a ref, a config and a value type, none of which this rule covers.

  **Scope of the rule, stated positively** so it stops being read as ambiguous:

  | Identifier kind | Prefix | Why |
  |---|---|---|
  | Component / directive class | **never** `Tw` | the entry point namespaces it, and Angular CLI reserves the bare name |
  | Shared type, interface, enum | `Tw` | hand-authored, appears in consumer code with no other namespace cue (`TwColor`, `TwSize`, `TwDateRange`) |
  | Service, ref, config class | `Tw` **permitted** | these are injected or constructed by name in consumer code, where the bare name would collide with common words (`TwDialog`, `TwDialogRef`, `TwDialogConfig`) |
  | Injection token | `TW_` | matches the Angular convention for tokens (`TW_ERROR_STATE_MATCHER`) |

  A `Tw`-prefixed service or config is therefore correct, not a tolerated exception.
- Shared code (e.g., `types.ts`) lives in a `core/` secondary entry point (`@cdevhub/ngx-tw/core`).
- Root `public-api.ts` re-exports all entry points for convenience; consumers are encouraged to use direct imports for tree-shaking.
- `projects/ngx-tw/theme/` ships **both** the default theme CSS (semantic-token → Tailwind palette mapping, copied as a CSS asset via the root `ng-package.json` `assets` glob and consumed by direct file path) **and** a secondary entry point `@cdevhub/ngx-tw/theme` exporting the runtime theming API (`provideTheme`, `ThemeService`, `ThemeDirective`, `THEME_CONFIG`). The TS entry is re-exported from the root barrel like every other entry point.
- Peer dependencies: `@angular/core`, `@angular/common`, `@angular/cdk`, `@angular/forms`, `rxjs`, `tailwindcss`, `tailwind-variants`, `tailwind-merge`, plus `luxon` and `lucide` as **optional** peers (the `calendar/luxon` and `icon/lucide` nested entry points).

  **Every package the shipped bundles import must be declared here and in `projects/ngx-tw/package.json`.** Under npm's hoisted `node_modules` an undeclared import still resolves, so this is invisible locally; under pnpm or Yarn PnP a package resolves only what it declares, and the entry point fails to load *even when the consumer has the package installed*. `@angular/forms` (16 entry points), `rxjs` (19) and `tailwind-merge` (2, imported directly by `tabs.ts` and `tab-nav.ts`) were all undeclared until 2026-09-02. `npm run verify:package` does not catch this — it compiles CSS and never imports a library module. To re-check: `grep -l "from '<pkg>'" dist/ngx-tw/fesm2022/*.mjs`.

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

**Rule.** For color-specific variants (alert colors, tab active states), use `{color}-{shade}` tokens. For neutral structural styling (backgrounds, text, borders that don't change with the color variant), use surface/fg/border tokens. Both handle dark mode automatically.

**Never write a `dark:` variant in a component.** The theme layer already inverts the ramp: `theme/_dark.css` maps `--color-primary-50` onto `blue-950`, so `bg-primary-50` *is* the dark wash in dark mode. A `dark:` override on top re-inverts it — `dark:bg-primary-900/20` resolves to `blue-100`, near-white. Dark mode belongs entirely to the consumer's theme layer; a component that names it has already broken it.

> This rule previously said the opposite — "use `{color}-{shade}` tokens with **explicit `dark:` overrides**". Only two `dark:` utilities were ever written against that instruction, both in `file-upload`, and both inverted the drag-over affordance into a bright flash in dark mode. The instruction was the defect. Corrected 2026-09-02; the library now contains zero `dark:` variants, which makes this greppable as a lint rule.

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

`text-base` (16px) is permitted in exactly two places: the **`lg`/`xl` steps of the trigger font-size scale** below, and the two codified content exceptions above — the lg-density `tw-item` title (dominant section header above a `text-sm` description) and the `tw-stat` lg/xl value (dominant KPI numeric above a `text-sm` label/description). Outside those, do not introduce `text-base` for component-internal text.

> This clause previously read "permitted **only** for the codified exceptions above", which contradicted the trigger table eight lines below and put 27 components in nominal violation of a rule they were correctly following. The trigger table is the authoritative half; this sentence was the stale one. Resolved 2026-09-02.

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

**Keyframe definitions live in `projects/ngx-tw/theme/_base.css`** (e.g., `.fade-in`, `.slide-in`), not in component files. Components reference class names only. Handle `prefers-reduced-motion` in the theme CSS alongside the keyframe: `@media (prefers-reduced-motion: reduce) { .fade-in { animation-duration: 0ms; } }`.

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
| `lg` | `size-3.5` (14px) |
| `xl` | `size-4` (16px) |

The `lg` / `xl` rows exist because `badge-dot` spans the full `TwSize` axis while the table originally defined three steps, leaving it to render 6/6/8/10/10 — both a dead step and a scale violation. Continuing the table's own 2px cadence to five steps admits exactly one assignment. `size-5` (20px) is not a dot; the scale stops at 16px.

**Half-step decorative.** `size-3.5` (14px) is permitted **only** for xs-density chevrons inside compact triggers (sort, pickers, time-picker meridiem, split chevron) where neither `size-3` nor `size-4` lines up with adjacent text, **and** as the `lg` step of the dot sub-scale above. Each chevron use must carry a one-line comment explaining why the half-step is needed; dot-scale uses need none, because the table is the justification.

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
- **Carve-out: a `tv()` config shared by two or more components** may live in `core/` and be exported, because the alternative is duplicating it and letting the copies drift. `tabTriggerVariants` (`core/tab-trigger-variants.ts`, shared by `tabs` and `tab-nav`) is the only one today. A shared config is still not consumer API — it is exported so a sibling entry point can import it, and it carries no compatibility promise.
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

**The assignment MUST happen in the constructor.** Angular v22 decides at directive-creation time whether a host is a classic CVA or a signal-forms custom control: any component exposing a `value` / `checked` `model()` is compiled as a custom control, and `FormControlDirective` takes the classic path only if a value accessor is already visible then (a static `NG_VALUE_ACCESSOR` provider, or `valueAccessor` already assigned). The constructor runs before that hook; `ngOnInit` does not.

Deferring the assignment to `ngOnInit` without a static provider silently routes the control down the custom-control branch, which skips `setUpValidators` entirely — a self-provided `NG_VALIDATORS` never composes onto the control and `validate()` is never called. The branch is otherwise behavior-preserving (value and disabled still round-trip through the model), so nothing else fails and **no test catches it** unless a spec asserts a validator error surfacing through a bound `FormControl`. This cost us every `tw-date-range-picker` error code during the v22 upgrade.

Two supported shapes:

| Case | Registration | Static `NG_VALUE_ACCESSOR` |
|---|---|---|
| Standard form control | `inject(NgControl, { self: true })` + assign in the **constructor** | No — circular DI |
| Control that also self-provides `NG_VALIDATORS` (`calendar`, `date-range-picker`) | Lookup deferred to `ngOnInit` (eager `inject(NgControl, { self })` deadlocks against the self-provided validator) | **Yes — required**, or validators are silently dropped |

**What actually triggers the custom-control branch is structural, and it is broader than `model()`.** Angular's check is `hasInput(def, 'value') && hasOutput(def, 'valueChange')` (and the same for `checked`/`checkedChange`) — a pure lookup in the compiled inputs/outputs maps, at `@angular/core/fesm2022/_debug_node-chunk.mjs:8513`. A `model()` is the *usual* way to produce that pair, but a hand-written `input(..., { alias: 'value' })` plus a separate `output()` named `valueChange` is **indistinguishable to the compiler**. Verified 2026-09-02.

This matters because it is easy to look at a component with no `model()` and conclude it is exempt. `calendar` is exactly that trap: `calendar.ts:369` declares `input(..., { alias: 'value' })` and `:533` declares `output()` named `valueChange`, so it is on the custom-control path despite having no `model()` anywhere. Measured on the real component (not a replica): commenting out its static `NG_VALUE_ACCESSOR` makes the reactive guard spec **fail**, and there is **no** loud `NG01914` — the field mounts and silently stops validating. Treat any `value`-aliased input paired with a `valueChange` output as carrying the full trap.

The genuinely different shape is a control with **no `value` input at all** — `tags-input`, `transfer`, `file-upload`. Those are not custom controls, and for them the constructor/static registration is the only thing keeping `[formField]` from throwing `NG01914`.

Any control providing `NG_VALIDATORS` MUST ship a spec asserting one error code reaches a bound `FormControl`, and **you must confirm the spec fails when the registration is removed**. A guard that cannot fail is worse than none, because it advertises coverage that does not exist. Do not reason about which branch your control takes — delete the provider, watch the test go red, put it back.

Note also that `[formField]` provides `NgControl` as an `InteropNgControl`, whose `valueAccessor` field the constructor assignment fills in before `ɵngControlCreate` runs — which is *why* every Shape-A control takes the classic branch under signal forms, and why self-provided `NG_VALIDATORS` compose there too.

> An earlier draft of this section claimed the trap "requires a `value`/`checked` `model()`" and that `calendar` was therefore exempt on the reactive branch. That was wrong, and it came from testing a synthetic replica instead of the real component — the replica omitted the aliased-input/output pair that makes `calendar` a custom control. Corrected 2026-09-02 against the Angular source predicate and a forced-failure run on `calendar.ts` itself. The lesson generalises: **verify a claim about a component against that component, not a model of it.**

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
| **Overlay-bearing components** | CDK overlay primitives demand position, scroll strategy, backdrop, focus-trap, close-behavior, etc. | popover, menu, tooltip, dialog, command-palette, select, combobox, calendar/date-picker, date-range-picker |
| **Segmented value editors** | One input pair per editable field (hour/minute/second/meridiem), times format, step, min/max and clear/stepper affordances | `time-picker` (24 inputs) |

> `time-picker` sat in the overlay-bearing row until 2026-09-03 and does not belong there: it imports `@angular/cdk/overlay` **zero** times and renders its fields inline. Its 24 inputs are genuinely wide, but for a different reason, so it needed its own row rather than a borrowed justification. Verified by grep against the component.
| **Form controls** | ARIA + Forms baseline (`aria-label{ledby,by}`, `name`, `label`, `description`, `required`, `disabled`, `labelPosition`, plus `color`/`size`/`variant`) is ~12 inputs minimum | `checkbox` (12+ inputs) |
| **Structural-layout primitives** | Each input is an independent geometric or behavioural axis (axis, unit, gutter, persistence, keyboard step, RTL, label) | `split` (`SplitComponent` 8 + `SplitPaneComponent` 7) |
| **Data primitives** | Tabular APIs have multiple orthogonal config axes (appearance, sticky, responsive, selection) that do not usefully collapse into config objects — each is independently set and independently read | `table` |
| **Navigation primitives** | Pagination demands many independent semantic axes (boundary/sibling counts, layout, type, page-size selector, first/last jump buttons, responsive collapse, link-mode factory, custom labels for i18n) that cannot meaningfully be flattened into config objects. Material's `MatPaginator` carries a comparable surface. | `paginator` (~20 inputs) |

Visual primitives (avatar, icon) and decorative primitives (progress-bar) do **not** qualify — reshape with config objects.

### Boolean defaults

Boolean inputs default to `false`. The exception: defaults of `true` are permitted when the resting "off" state would surprise consumers and the rationale is documented **in the JSDoc block on the same input** — not in a bare `//` comment. `jsDocOf()` reads `/** */` blocks **only**, so a `//` justification is silently dropped from the MCP index and never reaches the `.d.ts` or a consumer's IDE hover.

The list below is **illustrative, not exhaustive**. It records the cases that were codified first; the library has ~30 such inputs and every one carries a justification. The rule is the JSDoc requirement, not membership of this list — do not treat an absent entry as a violation, and do not expect to update this list when adding a justified input.

- `spinner.track = input(true)` — without the track ring the spinner reads as a partial arc, not a loading indicator
- `accordion.collapsible = input(true)` — accordions are collapsible by definition; opt-out only
- `calendar.bordered = input(true)` — embedded calendar reads as bordered; the borderless variant is the special case
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

New boolean inputs that default to `true` MUST carry their justification in the input's JSDoc block, or the input must be inverted (e.g., `disabled` instead of `enabled`).

## Accessibility

- MUST pass all AXE checks and meet WCAG AA: focus management, color contrast, ARIA attributes.
- Use Angular CDK's a11y utilities: `FocusMonitor`, `FocusTrap`, `LiveAnnouncer`, `AriaDescriber`.
- Every interactive component must define keyboard behavior.

## Testing

Tests use **Vitest** (default in Angular v22 via `@angular/build:unit-test`). No additional setup packages are needed for new projects. Test files live next to source: `button.spec.ts` beside `button.ts`.

### Running tests locally

Tests resolve `@cdevhub/ngx-tw/*` via the `tsconfig.json` path alias, which points at `./dist/ngx-tw/*` — **not** raw source. This is the configuration Angular's own docs recommend for libraries. Eight components use `templateUrl`, which ng-packagr inlines during the library build (there are no `styleUrls` anywhere — the Styling section forbids component CSS files); the Vitest runner does NOT resolve those side files on its own (upstream bug [angular-cli #32055](https://github.com/angular/angular-cli/issues/32055), closed not-planned).

Practical consequences:

- A missing `dist/ngx-tw/` produces cryptic TestBed `templateUrl` failures, not a clean "build first" error. If you see that, run `npm run build:lib`.
- A stale `dist/ngx-tw/` runs tests against old compiled output. Edits to `.ts` source are NOT picked up until you rebuild.
- Local workflow: run `npm run watch:lib` in one terminal alongside `npm test` in another. The watch task rebuilds `dist/` on every source change so Vitest sees the latest output.
- CI handles this via `unit-test` depending on `build-lib` and downloading the `ngx-tw-dist` artifact before running `npm run test:ci` (see `.github/workflows/ci.yml`).
- **`npm test` runs BOTH projects** — `ng test ngx-tw && ng test demo`. The `demo` project holds one
  load-bearing spec: `projects/demo/src/app/app.routes.spec.ts`, a drift guard that fails the build
  when a `components/<slug>` route exists in `app.routes.ts` but is missing from `e2e/support/routes.ts`.
  Every data-driven Playwright sweep (smoke, axe, visual) iterates that constant, so a slug missing
  from it means the component has **zero** e2e coverage while the suite still reports green. The
  demo target was historically excluded from `npm test`, so the guard never ran and five components
  (`aspect-ratio`, `file-upload`, `number-input`, `tags-input`, `tree`) went uncovered. Do not narrow
  these scripts back to the library alone.

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
