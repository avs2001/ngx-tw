# ngx-tw conventions

Rules for writing code that matches how the library is built and styled. These
apply to consumer code too — following them keeps an application visually
consistent with the components it embeds.

## Selectors and imports

- Element selectors are prefixed `tw-` (`tw-card`, `tw-select`).
- Directive selectors use a camelCase `tw` prefix as an attribute
  (`twBadge`, `twButton`, `twTooltip`).
- Class names carry **no** `Tw` prefix — `ButtonDirective`, `BadgeComponent`.
  Only shared *types* do (`TwColor`, `TwSize`).
- Import per component: `import { BadgeComponent } from '@cdevhub/ngx-tw/badge'`.
- Shared types come from `@cdevhub/ngx-tw/core`.

## Color — semantic tokens only

Never use raw Tailwind palette colors (`bg-blue-50`, `text-red-800`). Use
semantic roles on the 50–950 scale so the consumer's theme can retarget them.

| Role | Use for |
|---|---|
| `primary` | primary brand actions, key UI elements |
| `secondary` | secondary actions, supporting UI |
| `accent` | decorative emphasis, highlights |
| `neutral` | borders, backgrounds, subdued text |
| `info` | informational messages, neutral highlights |
| `success` | positive outcomes, confirmations |
| `warning` | caution, attention needed |
| `error` | critical issues, destructive actions |

So: `bg-info-50`, `text-error-800`, `border-primary-300`.

### Surface, foreground and border tokens

For neutral/structural styling use these instead of `neutral-*` shades — they
adapt to dark mode automatically.

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
| `border` | border | standard structural dividers, panel edges |
| `border-muted` | border | very subtle |
| `border-strong` | border | emphasized |

Rule of thumb: color-specific variants use `{color}-{shade}` with explicit
`dark:` overrides; neutral structural styling uses surface/fg/border tokens,
which need no `dark:` variant.

## Border radius

| Token | Use for |
|---|---|
| `rounded-md` | small interactive: buttons, badges, dismiss buttons, pill tab triggers |
| `rounded-lg` | standard containers: alerts, cards, panels, enclosed tabs, code blocks |
| `rounded-xl` | outer wrappers with internal rounded children: pill tablists |
| `rounded-full` | circular: avatars, dot indicators |
| `rounded-none` | explicit "no radius" |

Do not use `rounded`, `rounded-sm`, `rounded-2xl`, or `rounded-3xl`.

## Spacing

Container padding, mapped to the `size` input:

| Size | Padding |
|---|---|
| `xs` | `p-2` |
| `sm` | `p-3` |
| `md` | `p-4` |
| `lg` | `p-6` |
| `xl` | `p-8` |

Inline element padding (buttons, tab triggers, badges):

| Size | Padding |
|---|---|
| `xs` | `px-2 py-1` |
| `sm` | `px-3 py-1.5` |
| `md` | `px-4 py-2` |
| `lg` | `px-5 py-2.5` |
| `xl` | `px-6 py-3` |

Gaps: `gap-1` (pill tabs in a tablist), `gap-1.5` (icon + label in a trigger),
`gap-2` (action button groups, small lists), `gap-3` (icon + content in alerts,
avatar + title in headers). Do not use `gap-0.5`, `gap-4`, or larger — reach for
container padding instead.

## Typography

| Role | Size | Weight |
|---|---|---|
| Body text, alert content | `text-sm` | normal |
| Titles, header labels | `text-sm` | `font-semibold` |
| Subtitles, descriptions | `text-sm` | normal + `text-fg-muted` |
| Interactive triggers (tabs, buttons) | `text-sm` at md, scales with size | `font-medium` |
| Captions, metadata, footers | `text-xs` | normal |
| xs-density secondary text | `text-2xs` | normal |
| Monospace content | `font-mono text-sm` | normal |

Trigger font scale: `xs` → `text-xs`, `sm`–`md` → `text-sm`, `lg`–`xl` → `text-base`.

`text-2xs` (0.6875rem / 11px) is the smallest permitted step. Never use
arbitrary font sizes like `text-[11px]`. Headings inside projected content are
the consumer's responsibility — library components do not use `text-lg` or larger.

## Focus rings

Every interactive element needs a visible focus indicator. The canonical pattern:

```
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
```

Always `focus-visible`, never bare `focus` — mouse users should not see focus
rings. For selected/active states that persist, use
`ring-2 ring-offset-2 ring-primary-500`.

Two carve-outs use a background shift (`focus-visible:bg-surface-muted`) instead:
elements with role `menuitem` / `menuitemcheckbox` / `menuitemradio`, and
`role="option"` inside a combobox+listbox driven by `aria-activedescendant`
(where the option never receives DOM focus, so `focus-visible:` never fires).

## Icon sizing

Four sub-scales — pick by role, never mix them.

**Glyph icons** (inline alongside text): `size-4` (16px) in captions and small
buttons, `size-5` (20px) standard, `size-10` (40px) large standalone/avatars.
`<tw-icon>` parametrises this: `xs`→`size-3`, `sm`→`size-4`, `md`→`size-5`,
`lg`→`size-6`, `xl`→`size-8`.

**Square interactive targets** (icon-only buttons where the container is the
touch target): `xs`→`size-6`, `sm`→`size-7`, `md`→`size-8`, `lg`→`size-9`.

**Dot indicators** (non-interactive status markers): `xs`→`size-2`,
`sm`→`size-2.5`, `md`→`size-3`.

Always add `shrink-0` to icons in flex containers. Use `mt-0.5` on icons beside
multi-line text to align with the first line.

## Shadows, borders, states

Shadows: `shadow-sm` (subtle lift), `shadow` (standard elevation),
`shadow-md` (prominent / hover). Never `shadow-lg` or larger — components are
flat by default and shadows mean explicit elevation.

Borders are 1px: `border-border` structural, `border-border-strong` emphasized,
`border-border-muted` subtle, `border-{color}-300` for semantic outlines. 2px
(`border-b-2`, `border-r-2`) is reserved for active-state indicators like tab
underlines.

Hover: cards deepen shadow (`hover:shadow-md`); outlined surfaces darken border
(`hover:border-border-strong`); filled/ghost surfaces shift background
(`hover:bg-surface-muted`); text triggers use `hover:text-fg`.

Disabled: `opacity-50` with `pointer-events-none` or `cursor-not-allowed`. Within
a group, `disabled:opacity-30 disabled:cursor-default`. For subdued text prefer
`text-fg-muted` / `text-fg-subtle` over opacity.

Flex children that may truncate need `min-w-0`. Rounded containers clipping
children need `overflow-hidden`.

## Transitions and animation

| Duration | Use for |
|---|---|
| `duration-150` | fast micro-interactions |
| `duration-200` | standard hover/focus transitions |
| `duration-normal` | theme-overridable alias for 200ms |

Use `transition-colors`, `transition-shadow`, or an explicit property list like
`transition-[color,shadow]`. **Never `transition-all`.** Append
`motion-reduce:transition-none` for reduced-motion support.

Do **not** use `@angular/animations` (deprecated in v20.2, removed in v23). Use
Angular's native `animate.enter` / `animate.leave`:

```html
<div animate.enter="fade-in" animate.leave="fade-out">…</div>
```

Multiple classes are space-separated (`animate.enter="slide-in fade-in"`).
Keyframes ship in the theme CSS; components reference class names only.

## Angular idioms

- Standalone components only; no NgModules. Do not set `standalone: true` — it
  is the default in v22.
- Signal APIs: `input()`, `output()`, `model()` for two-way binding.
- `computed()` for read-only derived state; `linkedSignal()` for writable state
  that defaults to a source but can be overridden by user interaction.
- `ChangeDetectionStrategy.OnPush` on every component.
- `inject()` for DI, not constructor injection.
- The `host` object for host bindings — never `@HostBinding` / `@HostListener`.
- Native control flow `@if` / `@for` / `@switch`; class and style bindings
  rather than `ngClass` / `ngStyle`.
- No arrow functions in templates.
- Never mutate a signal inside an `effect()` that the same effect reads — that
  cycle is the most common way to freeze a component. Use `computed()` or
  `linkedSignal()` to derive state; reserve `effect()` for side effects that
  leave the signal graph (DOM, focus, announcements, storage).

## Variant styling

Variant-driven classes use `tailwind-variants` (`tv()`), with `slots` for
multi-part components, `defaultVariants` always defined, and `twMerge: true` so
consumer class overrides resolve correctly. Never concatenate class strings by
hand.

## Accessibility

Every component must meet WCAG AA and pass AXE checks. Use Angular CDK's a11y
utilities (`FocusMonitor`, `FocusTrap`, `LiveAnnouncer`, `AriaDescriber`) rather
than reimplementing them. Every interactive component defines keyboard behavior.
Color alone must never carry meaning — pair it with an icon or text.
