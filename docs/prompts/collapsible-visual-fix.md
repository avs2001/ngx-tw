# Prompt: Fix visual/aesthetic issues in `tw-collapsible`

## Context

Read these files before starting:
- `.claude/CLAUDE.md` — all conventions, especially the Visual Design System section
- `projects/ngx-tw/collapsible/collapsible.ts` — the component to modify
- `projects/ngx-tw/alert/alert.ts` — reference for how a multi-slot `tv()` component renders a default icon
- `projects/ngx-tw/card/card.ts` — reference for slot-based structural styling
- `projects/demo/src/app/routes/collapsible/examples/collapsible-examples.component.ts` — demo page to update
- `projects/ngx-tw/theme/_base.css` — animation keyframes

## What to fix

The collapsible component is functionally complete but looks broken visually. There are six specific issues to address, all in the `tv()` config, the component template, and the demo examples.

## Issue 1: No default chevron icon

The component has a `CollapsibleIconDirective` and an `icon` slot in `tv()`, but the template never renders a default chevron. Consumers must manually provide an SVG with `twCollapsibleIcon` to see any indicator. This makes the trigger look like plain text — not an expandable control.

**Fix:** Add a default chevron-down SVG to the `CollapsibleComponent` template, rendered inside the trigger projection area. Use the same approach as the alert dismiss button: an inline SVG with `size-5 shrink-0` that rotates 180 degrees when open. The default icon should only render when no `twCollapsibleIcon` is projected — use the existing `customIcon` contentChild query to detect this.

Place the default chevron inside the component template, after the trigger content projection slot but still within the trigger's flex layout. The trigger directive already has `justify-between`, so the chevron will align to the right automatically.

The chevron SVG path (Heroicons chevron-down): `M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z` (viewBox `0 0 20 20`, `fill="currentColor"`).

Apply the `icon` slot classes from `tv()` to this SVG. Add `rotate-180` when `open()` is true. Use `text-fg-muted` as the default icon color so it's visible but subordinate to the trigger text.

**Important architectural note:** The default chevron must be rendered inside the trigger element's DOM, not alongside it. Currently the template has `<ng-content select="[twCollapsibleTrigger]" />` which projects the trigger button. The chevron needs to live inside that button. This means the chevron SVG should be part of the trigger directive's template, not the collapsible component's template. Change `CollapsibleTriggerDirective` from a bare `@Directive` to a `@Component` (still using attribute selector `[twCollapsibleTrigger]`) with an inline template that includes `<ng-content />` (for the trigger's text) followed by the default chevron SVG. The trigger already uses `display: flex` and `justify-between` via the `tv()` trigger slot, so the chevron will sit at the right edge.

## Issue 2: Native button styling conflicts

The demos use `<button twCollapsibleTrigger>`. The native `<button>` element has user-agent styles (border, padding, background) that conflict with the trigger's Tailwind classes.

**Fix:** Add `bg-transparent border-0 appearance-none` to the `trigger` slot base classes in `tv()`. This resets the native button chrome so only Tailwind classes apply.

## Issue 3: No dividers between items in a group / accordion

The `CollapsibleGroupComponent` has no visual styling — it renders `<ng-content />` with no classes. When items are stacked in an accordion, there are no dividers. The demos use `space-y-2` which creates visible gaps between colored items (thin lines of page background bleeding through).

**Fix:** Two changes:

1. In `CollapsibleGroupComponent`, add a `variant` input that mirrors the child variant (so the group knows whether to apply dividers). Add host class styling: `divide-y divide-border` for `bordered` and `default` variants, and remove `rounded-lg` from individual items when inside a group so they stack flush. For `filled` variant groups, use `divide-y divide-{color}-200` (matching the fill color).

   Actually, a simpler approach: add a `divided` boolean input (defaulting to `true`) to `CollapsibleGroupComponent`. When true, apply `divide-y divide-border` via the host class. Also add `rounded-lg overflow-hidden` to the group host so the first/last items get rounded corners from the parent container instead of individually.

   Then update individual `tw-collapsible` components to detect when they are inside a group and suppress their own `rounded-lg` (set it to `rounded-none`) so they stack flush.

2. Update the demo examples to remove the inner `<div class="space-y-2">` wrapper from the accordion and group sections. The group component itself should handle the visual stacking — no wrapper `div` needed.

## Issue 4: Content area lacks visual separation from trigger

When the content panel opens, it appears as undifferentiated text below the trigger. There is no visual boundary between the trigger and its content.

**Fix:** For the `bordered` variant, the content slot already has `border-t border-border` — good. For `default` and `ghost` variants, add a subtle top padding offset so content doesn't press directly against the trigger. For `filled` variants, the content should have a slightly different background opacity to distinguish it from the trigger row — use `bg-{color}-50/50` or just rely on the existing color classes but ensure padding creates visual breathing room.

The content slot's padding is already defined per size in `tv()`. Verify it is sufficient. The key fix is ensuring the content area in `default` and `ghost` variants gets a subtle top border or visual separator. Add `border-t border-border-muted` to the `content` slot base classes for `default` variant.

## Issue 5: The `default` variant is nearly invisible

No border, no background — items look disconnected. There is no visual container.

**Fix:** Add a bottom border to the `default` variant root: `border-b border-border`. This creates a clean ruled-line look (like macOS disclosure groups or GitHub's FAQ sections). Each item gets a bottom rule, visually separating items without a full box. When inside a group, the group's `divide-y` handles this instead.

## Issue 6: `filled` variant color for the `default`/`ghost` icon

The chevron icon uses `text-fg-muted` as its base color. For `filled` variants with semantic colors, the icon should match the trigger text color (e.g., `text-primary-800` for `filled`+`primary`). The icon color should be set in the `compoundVariants` for each `filled`+`color` combination.

**Fix:** Add `icon` slot overrides to the existing `filled`+`color` compound variants. For example, `{ variant: 'filled', color: 'primary', class: { icon: 'text-primary-600' } }`. This ensures the chevron matches the trigger text in colored variants.

## Demo example updates

After fixing the component, update `collapsible-examples.component.ts`:

1. Remove the inner `<div class="space-y-2">` wrappers from the Accordion and Independent Group sections — let the group's `divide-y` handle visual separation.
2. Remove the `<div class="space-y-2">` from the Disabled section too — wrap those two items in a `tw-collapsible-group` instead, or keep `space-y-2` if they are standalone.
3. Remove manually-added chevron SVGs from any triggers that use them — the default chevron now renders automatically.
4. Keep the Custom Icon section as-is since it demonstrates the `twCollapsibleIcon` override.

## Styling summary

Changes to `tv()` slots:

- **`trigger` base:** add `bg-transparent border-0 appearance-none` for button reset
- **`icon` base:** add `text-fg-muted` for default color
- **`default` variant root:** add `border-b border-border`
- **`default` variant content:** add `border-t border-border-muted` (or omit if the border-b on root is sufficient)
- **`filled`+color compound variants:** add `icon` slot with matching color (e.g., `text-primary-600`)
- **In-group behavior:** collapsible items inside a group should have `rounded-none` on the root. Detect group presence via the existing `inject(CollapsibleGroupComponent, { optional: true })` and apply conditionally in the `rootClasses` computed.

Changes to `CollapsibleGroupComponent`:

- Host classes: `rounded-lg overflow-hidden divide-y divide-border` (base). Enable `twMerge` so consumers can override.
- Consider a small `tv()` config for the group or just use `computed()` with string concatenation (since it's a single element, `tv()` without slots is fine).

Changes to `CollapsibleTriggerDirective`:

- Convert from `@Directive` to `@Component` with attribute selector `[twCollapsibleTrigger]`
- Inline template: `<ng-content />` + default chevron SVG (conditionally rendered via `@if (!collapsible.customIcon())`)
- Keep all existing host bindings

## Implementation notes

- The trigger conversion from Directive to Component requires `changeDetection: ChangeDetectionStrategy.OnPush` and keeping the attribute selector `[twCollapsibleTrigger]`.
- The default chevron rotation should use the `icon` slot classes from `tv()` plus a conditional `rotate-180` class based on `collapsible.open()`. This is the same pattern the existing `CollapsibleIconDirective` uses.
- When the trigger is inside a group, `rounded-none` on the collapsible root ensures items stack flush. The group's `rounded-lg overflow-hidden` provides the outer radius.
- Do not change any behavioral logic (toggle, accordion, keyboard navigation, keepAlive). This is a visual-only fix.
- All colors must use semantic tokens. No raw palette colors.
- Ensure the trigger's `cursor-pointer` is visible — it's already in the base classes.
- Run the demo app on port 4600 to verify visually after changes.

## Files to modify

- `projects/ngx-tw/collapsible/collapsible.ts` — `tv()` config, trigger directive, component template, group component
- `projects/demo/src/app/routes/collapsible/examples/collapsible-examples.component.ts` — remove wrapper divs, let group handle stacking

## Constraints

- All conventions from CLAUDE.md apply
- No CSS files — Tailwind utilities only
- Semantic color tokens only — no raw palette colors
- Surface/fg/border tokens for structural styling
- `rounded-lg` for containers per the Visual Design System
- `duration-200` for hover transitions, `duration-150` for entry animations
- `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` for focus rings
- `size-5 shrink-0` for standard icons
- Do not use `@angular/animations`
- Do not change behavioral logic — visual fixes only
- Test the result visually in the demo app
