# Prompt: Refactor `tw-segmented-control` — add `rounded` variant axis

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, especially `computed()` vs `linkedSignal()`, `tv()` usage, Visual Design System border-radius tokens, and JSDoc requirements.
- `projects/ngx-tw/segmented-control/segmented-control.ts` — the full current implementation.
- `projects/ngx-tw/segmented-control/segmented-control.spec.ts` — the full current test suite.
- `projects/ngx-tw/segmented-control/index.ts` — current public API exports.

## What to change

Add a `rounded` input to `SegmentedControlComponent` that controls the border-radius of both the container (`root` slot) and each option (`option` slot). The input accepts `'pill' | 'md'`. Vertical orientation forces the effective value to `'md'` regardless of the consumer's input.

This is a non-breaking additive change. Do NOT modify any existing inputs, outputs, behavior, keyboard navigation, ARIA attributes, or ControlValueAccessor logic.

## API changes

### New type

Define a local type in `segmented-control.ts`:

```typescript
export type SegmentedControlRounded = 'pill' | 'md';
```

### New input on `SegmentedControlComponent`

```typescript
/** Controls the border-radius shape of the container and options. `'pill'` uses fully rounded corners; `'md'` uses standard radius. Vertical orientation forces `'md'`. Defaults to `'pill'`. */
rounded = input<SegmentedControlRounded>('pill');
```

### Resolved rounded value

Add a `computed()` (not `linkedSignal` — the value is always fully determined by `orientation()` and `rounded()`):

```typescript
effectiveRounded = computed(() => this.orientation() === 'vertical' ? 'md' : this.rounded());
```

This is a private/internal computed. The option component does not need to access it — it flows through the `tv()` variant result.

## Styling changes

### Remove hardcoded `rounded-full`

The current `root` slot base string includes `rounded-full` and the `option` slot base string includes `rounded-full`. Remove both — radius is now controlled by the `rounded` variant axis.

### Add `rounded` variant axis to `tv()` config

Add a `rounded` variant to `segmentedControlVariants`:

```
rounded: {
  pill: { root: 'rounded-full', option: 'rounded-full' },
  md: { root: 'rounded-md', option: 'rounded-md' },
}
```

Add to `defaultVariants`:

```
rounded: 'pill',
```

### Update `variantResult` computed

Pass `effectiveRounded` (not the raw input) to the `tv()` call:

```
segmentedControlVariants({
  size: this.size(),
  orientation: this.orientation(),
  rounded: this.effectiveRounded(),
})
```

This ensures vertical orientation always produces `rounded-md` classes.

## Export changes

In `projects/ngx-tw/segmented-control/index.ts`, add `SegmentedControlRounded` to the type exports.

## Test changes

In `projects/ngx-tw/segmented-control/segmented-control.spec.ts`:

### Update TestHost

Add a `rounded` signal to `TestHost` with default `'pill'` and bind it: `[rounded]="rounded()"`.

Import `SegmentedControlRounded` type.

### Add `describe('Rounded')` block

Tests to add inside the main `describe('SegmentedControl')`:

1. **should render with pill rounded by default** — verify the root element's class list contains `rounded-full`.
2. **should render with md rounded** — set `rounded` to `'md'`, verify root element's class list contains `rounded-md` and does not contain `rounded-full`.
3. **should force md rounded when orientation is vertical** — set `rounded` to `'pill'` and `orientation` to `'vertical'`, verify root element's class list contains `rounded-md` and does not contain `rounded-full`.
4. **should apply rounded to options** — verify option elements have `rounded-full` by default; set `rounded` to `'md'` and verify they have `rounded-md`.
5. **should switch back to pill when orientation returns to horizontal** — set orientation to `'vertical'` (forcing `md`), then back to `'horizontal'` with `rounded` still `'pill'`, verify `rounded-full` is restored.

## Constraints

- Follow all CLAUDE.md conventions — signal inputs, `computed()` for derived state, `tv()` with `twMerge`, JSDoc on inputs.
- Do not modify any existing inputs, outputs, keyboard navigation, ARIA, or CVA logic.
- Do not add CSS files — Tailwind utilities only via `tv()`.
- Keep `effectiveRounded` as a private computed — it is internal derivation logic.
- Use `computed()`, not `linkedSignal()` — the resolved value is always fully determined by two signals and is never set independently.
