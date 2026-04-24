# Prompt: Refactor `tw-segmented-control` variant system

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, semantic tokens, visual design system
- `projects/ngx-tw/segmented-control/segmented-control.ts` — current implementation (the file you are modifying)
- `projects/ngx-tw/segmented-control/segmented-control.spec.ts` — current tests (must be updated)
- `projects/ngx-tw/button/button.ts` — reference for how `solid`, `outline`, and `soft` compound variants define per-color class strings (especially the warning and neutral special cases)
- `projects/ngx-tw/tabs/tabs.ts` — reference for how `PILL_ACTIVE` lookup tables are structured
- `projects/demo/src/app/routes/segmented-control/examples/segmented-control-examples.component.ts` — demo examples page (must be updated)
- `projects/demo/src/app/routes/segmented-control/api/segmented-control-api.component.ts` — API docs page (must be updated)
- `projects/demo/src/app/routes/segmented-control/overview/segmented-control-overview.component.ts` — overview page (update key features list)

## What to change

This is a **refactor of the variant system only**. Do NOT change inputs, keyboard navigation, ARIA behavior, ControlValueAccessor, component structure, or the `tv()` config. The only things changing are:

1. The `SegmentedControlVariant` type — from `'filled' | 'outline'` to `'surface' | 'filled' | 'outline'`
2. The active class lookup constants and the `ACTIVE_CLASSES` record
3. The `variant` input default — from `'filled'` to `'surface'`
4. JSDoc on the `variant` input
5. Tests, demo examples, and API docs to reflect the new variant names

### New variant semantics

**`surface`** (default) — Standard segmented control look. The active option is a raised white/surface pill with colored text. This is what `'filled'` does today — same classes, just renamed.

**`filled`** — The active option gets a SOLID colored background, like the button's `solid` variant. The color is prominent and the text is white (or black for warning).

**`outline`** — The active option gets a colored ring border. No background change. This is unchanged from the current `outline` behavior.

### Updated type

```typescript
export type SegmentedControlVariant = 'surface' | 'filled' | 'outline';
```

### Updated lookup constants

Replace `FILLED_ACTIVE` and `OUTLINE_ACTIVE` with three constants: `SURFACE_ACTIVE`, `FILLED_ACTIVE`, `OUTLINE_ACTIVE`.

**`SURFACE_ACTIVE`** — Copy the current `FILLED_ACTIVE` values exactly. These are:
- Colored: `bg-surface shadow-sm text-{color}-700 dark:text-{color}-300`
- Neutral: `bg-surface shadow-sm text-fg`

Add `dark:text-{color}-300` to every non-neutral entry for dark mode text contrast. The `bg-surface` token already adapts to dark mode.

**`FILLED_ACTIVE`** (new behavior) — Follows the button `solid` compound variant pattern:
- Standard colors (primary, secondary, accent, info, success, error): `bg-{color}-600 text-white shadow-sm`
- Warning: `bg-warning-500 text-black shadow-sm` (matches button — warning needs dark text for contrast)
- Neutral: `bg-surface-muted text-fg shadow-sm` (matches button neutral solid — no "neutral color" to fill)

**`OUTLINE_ACTIVE`** — Keep the current values unchanged.

Update the `ACTIVE_CLASSES` record to include all three variants:

```typescript
const ACTIVE_CLASSES: Record<SegmentedControlVariant, Record<TwColor, string>> = {
  surface: SURFACE_ACTIVE,
  filled: FILLED_ACTIVE,
  outline: OUTLINE_ACTIVE,
};
```

### Updated input default and JSDoc

```typescript
/** Controls the active indicator style. `'surface'` shows a raised white pill; `'filled'` shows a solid colored background; `'outline'` shows a colored ring border. Defaults to `'surface'`. */
readonly variant = input<SegmentedControlVariant>('surface');
```

### Test updates (`segmented-control.spec.ts`)

- In the `TestHost`, change the initial `variant` signal value from `'filled'` to `'surface'`
- In the Variants describe block:
  - Rename "should render with filled variant (default)" to "should render with surface variant (default)"
  - Add a test: "should render with filled variant" — set variant to `'filled'`, detect changes, assert all 3 options render
  - The existing "should render with outline variant" test stays as-is
  - Update the "should render both variants across all colors" test to iterate over all THREE variants: `['surface', 'filled', 'outline']`
  - The "should update selection in outline mode" test stays as-is
- Update the `SegmentedControlVariant` type import if needed (it's already imported as a type)

### Demo examples updates (`segmented-control-examples.component.ts`)

- Update the `VARIANTS` array to `['surface', 'filled', 'outline']`
- Update the playground's initial `playVariant` signal from `'filled'` to `'surface'`
- Everything else in the examples file auto-adapts because the template iterates over `VARIANTS`

### API docs updates (`segmented-control-api.component.ts`)

- Update the variant row in the inputs table:
  - Type: `'surface' | 'filled' | 'outline'`
  - Default: `'surface'`
  - Description: `Controls the active indicator style. Surface shows a raised white pill; filled shows a solid colored background; outline shows a colored ring border.`

### Overview updates (`segmented-control-overview.component.ts`)

- Update the key features list to mention "3 variants: surface, filled, outline" instead of the current implicit two variants

### Public API exports

The `index.ts` already exports `SegmentedControlVariant` as a type — no changes needed there. The type definition change in the source file is sufficient.

## Constraints

- Do NOT change any inputs other than `variant` (its type, default, and JSDoc)
- Do NOT change keyboard navigation, ARIA behavior, or ControlValueAccessor logic
- Do NOT change the `tv()` config, the `rounded` input, `size`, `orientation`, or `color` inputs
- Do NOT change the `INACTIVE_CLASSES` constant
- All class strings in lookup constants must be written statically (no string interpolation) for Tailwind v4 scanning
- Semantic tokens only — no raw palette colors
- Keep the two-level lookup pattern: `ACTIVE_CLASSES[variant][color]`
- Every class string must be on a single line per color entry for readability
- Run tests after changes: `npx vitest run --project ngx-tw`
