# Prompt: Refactor `tw-segmented-control` — pill shape + variant input

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, especially Visual Design System, semantic tokens, tv() usage
- `projects/ngx-tw/segmented-control/segmented-control.ts` — the file you are modifying
- `projects/ngx-tw/segmented-control/segmented-control.spec.ts` — existing tests to extend
- `projects/ngx-tw/core/types.ts` — shared `TwColor`, `TwSize` types

This is a **refactor** of an existing component. Do not rewrite from scratch. Preserve all existing functionality: ControlValueAccessor, keyboard navigation, ARIA, FocusMonitor, disabled states, content projection, all signal-based APIs.

## What to change

Two modifications to `segmented-control.ts`:

### 1. Pill-shaped border radius

Change the `tv()` config:
- **Root slot:** `rounded-xl` becomes `rounded-full`
- **Option slot:** `rounded-md` becomes `rounded-full`

Both the container track and individual option buttons become fully rounded pills.

### 2. New `variant` input: `'filled' | 'outline'`

Add a `variant` input to `SegmentedControlComponent` that controls how the **active** option is visually distinguished. Inactive options remain unchanged regardless of variant.

#### API addition

On `SegmentedControlComponent`, add:

```typescript
/** Controls the active indicator style. `'filled'` shows a raised surface; `'outline'` shows a colored ring. Defaults to `'filled'`. */
variant = input<SegmentedControlVariant>('filled');
```

Define the type locally in the same file (not exported, not in core — it is component-specific):

```typescript
type SegmentedControlVariant = 'filled' | 'outline';
```

#### Restructure ACTIVE_CLASSES

The current `ACTIVE_CLASSES` is `Record<TwColor, string>`. Restructure it as a two-level lookup keyed by variant then color:

**Filled variant** (identical to current behavior):
- Pattern: `bg-surface shadow-sm text-{color}-700`
- Neutral special case: `bg-surface shadow-sm text-fg`

**Outline variant:**
- Pattern: `ring-2 ring-offset-2 ring-{color}-500 text-{color}-700`
- Neutral special case: `ring-2 ring-offset-2 ring-border-strong text-fg`

All 8 `TwColor` values must have entries for both variants. Write every class string statically — no template literals — so Tailwind v4 can scan them.

#### Wire variant into option classes

In `SegmentedControlOptionComponent.classes`, the active branch currently reads `ACTIVE_CLASSES[this.parent.color()]`. Change it to read `ACTIVE_CLASSES[this.parent.variant()][this.parent.color()]` (or however the restructured lookup is shaped). The parent must expose `variant()` so the option can read it — add it to the set of signals the option accesses from the parent (same pattern as `color()` and `size()`).

The `INACTIVE_CLASSES` string does not change. The variant only affects active state.

#### Update tv() defaultVariants

The `tv()` config does not need a `variant` axis in its variants object — the variant styling is handled via the static class lookup, not through tv(). No changes to the tv() variants block beyond the radius fix.

## Usage examples

```html
<!-- Default: filled variant, pill shape -->
<tw-segmented-control [(value)]="view">
  <tw-segmented-option value="grid">Grid</tw-segmented-option>
  <tw-segmented-option value="list">List</tw-segmented-option>
</tw-segmented-control>

<!-- Outline variant -->
<tw-segmented-control [(value)]="view" variant="outline">
  <tw-segmented-option value="grid">Grid</tw-segmented-option>
  <tw-segmented-option value="list">List</tw-segmented-option>
</tw-segmented-control>

<!-- Outline + color -->
<tw-segmented-control [(value)]="plan" variant="outline" color="accent">
  <tw-segmented-option value="monthly">Monthly</tw-segmented-option>
  <tw-segmented-option value="yearly">Yearly</tw-segmented-option>
</tw-segmented-control>
```

## Spec file changes

In `segmented-control.spec.ts`:

1. Add `variant` to the `TestHost` template — bind it to a new `variant = signal<'filled' | 'outline'>('filled')` signal on the test host.

2. Add a new `describe('Variants')` block with these tests:
   - Renders without errors with `variant="filled"` (default)
   - Renders without errors with `variant="outline"`
   - Renders both variants across all colors without errors (loop `TwColor` x variant)
   - Clicking an option in outline mode updates selection (aria-checked changes)

Do not test class names — test observable behavior only (renders, aria attributes, interactions still work).

## Constraints

- Do not change any existing public API — only add the `variant` input
- Do not change INACTIVE_CLASSES
- Do not change keyboard navigation, CVA, ARIA, or FocusMonitor logic
- All class strings in the lookup must be written statically (no string interpolation) for Tailwind scanning
- Semantic tokens only — no raw palette colors
- Neutral structural styling uses surface/fg/border tokens
- Every new `input()` must have a JSDoc comment
- Keep `twMerge: true` on the tv() config
- Export `SegmentedControlVariant` type from `index.ts` if consumers need it for typing their own code — otherwise keep it internal. Bias toward exporting it since consumers may want to bind a variable of that type.
