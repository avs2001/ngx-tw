# Prompt: Build `tw-stepper` for ngx-tw

## Overview

Build an accessible, highly customizable stepper component for multi-step flows (wizards, onboarding, checkout, guided forms). The component wraps Angular CDK's `CdkStepper` — CDK owns all step iteration, selection, linear-mode `stepControl` validation, keyboard navigation via `FocusKeyManager`, and ARIA index/id plumbing. We skin it with Tailwind v4 semantic tokens and `tailwind-variants`.

**Research summary**

- **Material Design stepper** — horizontal + vertical orientations; linear + non-linear; editable / optional / error step states; step states (`number | edit | done | error`) swap the indicator glyph.
- **Ant Design Steps** — adds `default | dot | simple` visual variants, per-step `status`, clickable navigation in non-linear mode, and a compact inline form factor.
- **Chakra UI / Radix patterns** — emphasise composition: root + step + separator + indicator + title + description sub-parts; consumers can slot any of them. We mirror this via directives + content projection.
- **CDK `CdkStepper`** is the behaviour primitive and MUST be used. It already provides: selection state, `selectedIndex` + `selectionChange` + `selectedIndexChange`, `next()` / `previous()` / `reset()`, linear-mode gating on `stepControl.invalid`, keyboard navigation (ArrowLeft/Right/Up/Down respecting RTL + orientation, Home, End, Enter, Space), `interactedStream`, `indicatorType` signal per step, `isNavigable` signal per step, `STEPPER_GLOBAL_OPTIONS` (for `showError`), `STEP_STATE` constants, and `StepperSelectionEvent`. Do **not** re-implement any of that.

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, Visual Design System, semantic tokens, `tv()` usage, animation rules.
- `projects/ngx-tw/tabs/tabs.ts` + `projects/ngx-tw/tabs/tabs.html` — pattern for parent/child coordination, `contentChildren()`, multi-slot `tv()`, per-color static class lookups for Tailwind v4 static scanning, external template when > 50 lines.
- `projects/ngx-tw/collapsible/collapsible.ts` — directive-injected-parent pattern, `animate.enter`/`animate.leave` usage.
- `projects/ngx-tw/menu/menu.ts` — pattern for composing CDK via `hostDirectives` with input/output aliasing (use this same pattern for `twStepperNext` / `twStepperPrevious`).
- `projects/ngx-tw/core/types.ts` + `projects/ngx-tw/core/index.ts` — `TwColor`, `TwSize`.
- `projects/ngx-tw/theme/_base.css` — add stepper keyframes here (do NOT create a component CSS file).
- `node_modules/@angular/cdk/types/stepper.d.ts` — authoritative CdkStepper / CdkStep API.

## What to build

Six exported artifacts in a new secondary entry point `ngx-tw/stepper`:

1. **`StepperComponent`** (`tw-stepper`) — root container. **Extends `CdkStepper`** (class inheritance, the canonical pattern since `CdkStepper` is a directive base class). Owns the variant/color/size/orientation visual axes, renders the header strip and panel region, wires CdkStep state into Tailwind classes.
2. **`StepComponent`** (`tw-step`) — individual step. **Extends `CdkStep`**. Inherits every CdkStep input (`stepControl`, `label`, `errorMessage`, `aria-label`, `aria-labelledby`, `state`, `editable`, `optional`, `completed`, `hasError`) — we do not re-declare them; we add a single `description` input for a sub-label. Content is projected as the panel body.
3. **`StepLabelDirective`** (`*twStepLabel`) — structural directive on an `<ng-template>` for a fully custom header label. Thin re-export of `CdkStepLabel` (so consumers write `*twStepLabel` consistently).
4. **`StepperIconDirective`** (`*twStepperIcon`) — structural directive on an `<ng-template>` with a `state` input (`'number' | 'edit' | 'done' | 'error' | string`) that scopes the custom icon to a specific indicator state. Context `$implicit` is `{ index: number; active: boolean }`.
5. **`StepperNextDirective`** (`[twStepperNext]`) — attribute directive on a button. Composes `CdkStepperNext` via `hostDirectives`. Aliases CDK's `type` input.
6. **`StepperPreviousDirective`** (`[twStepperPrevious]`) — same pattern for `CdkStepperPrevious`.

Plus:
- `StepperVariant` type (`'default' | 'dot' | 'simple'`)
- Re-export `STEPPER_GLOBAL_OPTIONS`, `STEP_STATE`, `StepperSelectionEvent`, `StepState` from `@angular/cdk/stepper` through our entry point so consumers don't reach into CDK directly.
- `provideTwStepperOptions(options: StepperOptions): Provider[]` helper for DI (wraps `STEPPER_GLOBAL_OPTIONS`).

## Component architecture

```
tw-stepper   (extends CdkStepper)
├── tw-step  (extends CdkStep)           ×N — content-projected
│   ├── *twStepLabel                     — optional custom header label
│   ├── *twStepperIcon [state]           — optional per-state custom icon
│   └── (projected default content)      — panel body
├── [twStepperNext]                      — buttons inside step panels
└── [twStepperPrevious]
```

The **`tw-stepper` template** owns:
- A **header strip** — one button per step, with connector lines between.
- A **panel region** — only the selected step's content is rendered (CdkStep exposes `content: TemplateRef`; we render it via `ngTemplateOutlet`).

Because `CdkStepper` already declares `_steps: QueryList<CdkStep>` as a content query, inheriting `StepperComponent extends CdkStepper` and inheriting `StepComponent extends CdkStep` wires the content query automatically. Do NOT re-declare `contentChildren(StepComponent)`.

## API design

### `StepperComponent` — selector `tw-stepper`

Inherited from `CdkStepper` (already available, do NOT re-declare):
- `linear: boolean`
- `selectedIndex: number` — we re-expose this as a `model<number>()` below for signal-based two-way binding.
- `orientation: 'horizontal' | 'vertical'`
- `selectionChange: EventEmitter<StepperSelectionEvent>`
- `selectedIndexChange: EventEmitter<number>`
- `next()`, `previous()`, `reset()`

#### New inputs

```typescript
/** Controls the visual style of the header. `'default'` renders numbered circles with labels. `'dot'` renders small filled dots (compact). `'simple'` hides labels and descriptions, showing only indicators + connectors. Defaults to `'default'`. */
variant = input<StepperVariant>('default');

/** Sets the semantic color for active and completed indicators and connectors. Defaults to `'primary'`. */
color = input<TwColor>('primary');

/** Controls padding and indicator size. Defaults to `'md'`. */
size = input<TwSize>('md');

/** Two-way bindable index of the selected step. Kept in sync with CdkStepper's `selectedIndex`. */
selectedIndexModel = model<number>(0, { alias: 'selectedIndex' });

/** When true, the CdkStep `hasError` / error state is rendered with error styling and icon. Mirrors CDK's `STEPPER_GLOBAL_OPTIONS.showError`. Defaults to `true`. */
showError = input(true);

/** Whether the header is clickable in linear mode for navigable steps. When false, advancement is only via the Next/Previous buttons. Defaults to `true`. */
headerInteractive = input(true);
```

> Note: `orientation` and `linear` are CDK inputs — do NOT re-declare them. Consumers already bind `[orientation]="'vertical'"` / `[linear]="true"` directly on `tw-stepper`.

> Note: `selectedIndex` binding — CDK uses a getter/setter for `selectedIndex`; our `model()` needs to forward user interaction (via CDK's `selectedIndexChange`) into the model, and push external model updates back into CDK via the setter. Wire this with an `effect()` in the constructor + a subscription to `selectedIndexChange` on `ngAfterViewInit`.

#### Outputs

`selectionChange` and `selectedIndexChange` come from `CdkStepper` — do not re-declare. They fire as-is; consumers listen with `(selectionChange)` / `(selectedIndexChange)`.

### `StepComponent` — selector `tw-step`

Inherits every CdkStep input (`stepControl`, `label`, `errorMessage`, `ariaLabel`, `ariaLabelledby`, `state`, `editable`, `optional`, `completed`, `hasError`). Do NOT re-declare them — they're already accessible via inheritance.

#### New inputs

```typescript
/** Optional descriptive text shown below the label in `'default'` variant. Ignored in `'dot'` and `'simple'` variants. */
description = input<string>('');
```

### `StepLabelDirective` — selector `[twStepLabel]`

Structural directive on `<ng-template>`. Extends `CdkStepLabel` so Angular's content-query magic (`@ContentChild(CdkStepLabel)` inside `CdkStep`) picks it up automatically — consumers write `*twStepLabel` and CDK sees it as its own label.

```typescript
/** Custom template for a step's header label. Context is empty; the label receives no implicit value. */
@Directive({ selector: '[twStepLabel]', providers: [{ provide: CdkStepLabel, useExisting: StepLabelDirective }] })
export class StepLabelDirective extends CdkStepLabel {}
```

### `StepperIconDirective` — selector `[twStepperIcon]`

Structural directive on `<ng-template>`. Carries a `state` input matching `StepState` (`'number' | 'edit' | 'done' | 'error' | string`). The `StepperComponent` queries `contentChildren(StepperIconDirective)` and, when rendering a step indicator, picks the directive whose `state` matches the current `indicatorType`. If none match, the default icon for that state is rendered.

```typescript
/** Which step state this template replaces. Matches `StepState` values from CDK. */
state = input<StepState>();

/** @internal */
templateRef = inject(TemplateRef<StepperIconContext>);
```

Context: `{ $implicit: { index: number; active: boolean } }`.

### `StepperNextDirective` — selector `button[twStepperNext]`

```typescript
@Directive({
  selector: 'button[twStepperNext]',
  hostDirectives: [{
    directive: CdkStepperNext,
    inputs: ['type'],
  }],
})
export class StepperNextDirective {}
```

(Same pattern for `StepperPreviousDirective` with `CdkStepperPrevious`.)

No new inputs/outputs. These directives exist purely to give consumers a `tw`-prefixed attribute that still triggers CDK's next/previous behaviour. Style is left to the consumer (they'll wrap their own `<button twButton>`).

## Content projection

Inside `<tw-step>`:
- **Default slot** — the panel body. Wrapped by CdkStep into its `content: TemplateRef` automatically, rendered by `StepperComponent` into the panel region via `ngTemplateOutlet`.
- `*twStepLabel` (optional `<ng-template>`) — custom header label. If absent, the `label` input string is shown.
- `*twStepperIcon [state]` (optional, repeatable) — one template per state to override. If absent for a given state, the default icon renders.

Inside `<tw-stepper>`:
- `<tw-step>` children only (enforced by `CdkStepper`'s content query).

## Styling

### `tv()` config — multi-slot

Slots (one `tv()` config, enabled `twMerge: true`, variants keyed by `variant`, `size`, `orientation`):

- `root` — outer wrapper
- `header` — the strip of step headers + connectors (flex container)
- `stepItem` — per-step header button + its trailing connector
- `stepHeader` — the clickable header button (indicator + label block)
- `stepIndicator` — circle / dot wrapper rendered inside `stepHeader`
- `stepNumber` — the `<span>` inside the indicator that shows the number
- `stepIconSlot` — wrapper for the icon when a non-number state is rendered
- `stepLabelWrapper` — vertical stack of label + description + optional "(Optional)" hint
- `stepLabel` — label text
- `stepDescription` — description text
- `stepConnector` — line between two step items
- `stepPanel` — the container that holds the selected step's `TemplateRef`
- `stepActions` — small wrapper class consumers can opt into for button rows (exported via `tv()` slot so compound variants can tweak it; not mandatory)

**Base classes:**

```
root:           'flex'
header:         'flex items-start'
stepItem:       'flex items-center'
stepHeader:     'group inline-flex items-center gap-2 cursor-pointer transition-colors duration-200 motion-reduce:transition-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed'
stepIndicator:  'inline-flex items-center justify-center shrink-0 rounded-full font-medium transition-[color,background-color,border-color] duration-200 motion-reduce:transition-none'
stepNumber:     'leading-none'
stepIconSlot:   'inline-flex items-center justify-center'
stepLabelWrapper: 'flex flex-col min-w-0 text-left'
stepLabel:      'text-sm font-medium text-fg leading-tight'
stepDescription:'text-xs text-fg-muted leading-tight mt-0.5'
stepConnector:  'shrink-0 transition-colors duration-200 motion-reduce:transition-none'
stepPanel:      'min-w-0'
stepActions:    'flex items-center gap-2 mt-4'
```

**Variants — `variant`:**

| Variant | Behaviour |
|---|---|
| `default` | Indicator is a `size-8` circle (scales with `size`) with number/icon inside. Label + description visible next to indicator. |
| `dot` | Indicator shrinks to a `size-2.5` filled dot (`rounded-full`). Label + description still visible below dot (horizontal) or beside (vertical). Indicator has NO number. |
| `simple` | Indicator is the same as `default` but label + description are HIDDEN (`sr-only` so screen readers still get the text). |

**Variants — `size`** (indicator diameter × typography):

| Size | Indicator | Label font | Connector thickness |
|---|---|---|---|
| `xs` | `size-6 text-xs` | `text-xs` | `h-px` (horizontal) / `w-px` (vertical) |
| `sm` | `size-7 text-xs` | `text-sm` | `h-px` / `w-px` |
| `md` | `size-8 text-sm` | `text-sm` | `h-px` / `w-px` |
| `lg` | `size-10 text-base` | `text-base` | `h-0.5` / `w-0.5` |
| `xl` | `size-12 text-base` | `text-base` | `h-0.5` / `w-0.5` |

For the `dot` variant, ignore the indicator column above and use `size-2 → size-3` across the scale.

**Variants — `orientation`:**

- `horizontal` — `root: 'flex-col'`, `header: 'flex-row'`, `stepItem: 'flex-row items-center flex-1 last:flex-none'`, `stepConnector: 'flex-1 mx-2 h-px'` (or `h-0.5` per size), `stepLabelWrapper: 'ml-2'`, `stepPanel: 'mt-4'`.
- `vertical` — `root: 'flex-row'` is wrong for vertical in the traditional sense; vertical steppers still flow top-to-bottom with the panel inline with each step. Use `root: 'flex-col'`, `header: 'flex-col items-stretch w-auto'`, `stepItem: 'flex-col items-start'`, `stepConnector: 'w-px ml-4 flex-1 min-h-8'` (vertical line under each indicator), `stepLabelWrapper: 'ml-3'`, `stepPanel: 'ml-11 mt-2 mb-4'` (inset under the label, aligned with the indicator column).

Compound variant: for vertical orientation, each `stepItem` wraps indicator + label + connector + panel in a single column; see the template notes below.

**`defaultVariants`**: `{ variant: 'default', color: 'primary', size: 'md', orientation: 'horizontal' }`.

### Per-state styling — static class lookups

Tailwind v4 scans source statically. Write every per-color class string out. Follow the exact shape used in `tabs.ts` (`UNDERLINE_ACTIVE_HORIZONTAL: Record<TwColor, string>` etc.). You need four state lookups for the indicator + four for the label + two for the connector:

**Indicator state tokens** (`Record<TwColor, string>` per state):

| State | Semantic intent | Class pattern |
|---|---|---|
| `pending` | Step not yet visited | `bg-surface-muted text-fg-muted border border-border` — same across all colors (color-agnostic). Write once, not per color. |
| `active` | Currently selected | Per color — `bg-{color}-500 text-white ring-4 ring-{color}-100 border border-{color}-500`. Neutral: `bg-fg text-surface ring-4 ring-surface-muted border border-fg`. |
| `completed` | Step cleared | Per color — `bg-{color}-500 text-white border border-{color}-500`. Neutral: `bg-fg text-surface border border-fg`. |
| `error` | Step failed validation | Fixed: `bg-error-500 text-white border border-error-500` — always error-colored regardless of stepper `color` input (this is a universal signal). |
| `disabled` | Linear mode, not yet navigable | `bg-surface-muted text-fg-subtle border border-border opacity-60` — color-agnostic. |

**Label text tokens** (`Record<TwColor, string>` per state):

| State | Class pattern |
|---|---|
| `pending` | `text-fg-muted` (color-agnostic) |
| `active` | Per color — `text-{color}-700 font-semibold`. Neutral: `text-fg font-semibold`. |
| `completed` | `text-fg` (color-agnostic) — completed steps should not visually scream; description reads `text-fg-muted`. |
| `error` | `text-error-700 font-semibold` |
| `disabled` | `text-fg-subtle` |

**Connector tokens** (single class per adjacent-state combo):

The connector sits between step _i_ and step _i+1_. Its color is determined by step _i_'s state:

- Step _i_ is `completed` or `active` (trailing chain reached here) → `bg-{color}-500`. Neutral: `bg-fg`.
- Step _i_ is `error` → `bg-error-500`.
- Otherwise → `bg-border` (color-agnostic).

Write these as a single helper `getConnectorClass(fromState: 'completed' | 'active' | 'error' | 'pending' | 'disabled', color: TwColor): string` returning a static class string from pre-declared `Record<TwColor, string>` maps. The connector itself is a `<span>` or `<div>` with the sizing class from the `tv()` `stepConnector` slot plus the color class from this helper.

### Default indicator icons

Inline SVGs (no `ngx-tw/icon` dependency — keep the stepper entry point lean; Heroicons 16px mini-style matches existing components):

- `state === 'number'` → render `<span>{{ index + 1 }}</span>` inside the indicator.
- `state === 'done'` → render check-mark SVG (`M4.5 8.5l2.5 2.5 4.5-4.5` style).
- `state === 'error'` → render exclamation SVG (`path` for `!` inside a circle OR a simple `!` glyph sized with the indicator).
- `state === 'edit'` → render pencil SVG.
- `variant === 'dot'` → no inner content; the indicator itself is the dot.

When a `*twStepperIcon [state]="..."` template matches the current `indicatorType`, render that template instead of the default. Context: `{ $implicit: { index, active } }`.

### Animations

Panels slide in/out when `selectedIndex` changes. CdkStepper's `_getAnimationDirection(index)` returns `'previous' | 'current' | 'next'` — use it to pick the direction.

Add to `projects/ngx-tw/theme/_base.css`:

```css
@keyframes step-panel-enter-forward {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.step-panel-enter-forward { animation: step-panel-enter-forward 150ms ease-out; }

@keyframes step-panel-enter-backward {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.step-panel-enter-backward { animation: step-panel-enter-backward 150ms ease-out; }
```

Add both to the existing `prefers-reduced-motion: reduce` block with `animation-duration: 0ms`.

In the panel template, use `animate.enter` with a computed class name based on `_getAnimationDirection`. Vertical orientation skips panel animations (the panel is inline, not replaced) — set `animate.enter` to `null` when `orientation === 'vertical'`.

## Accessibility

CdkStepper + CdkStepHeader + CdkStepLabel already deliver:
- `FocusKeyManager`-driven roving `tabindex` on step headers.
- Keyboard navigation: ArrowLeft/Right (horizontal), ArrowUp/Down (vertical), Home, End, Enter, Space (handled by CdkStepper's `_onKeydown`).
- RTL-aware arrow key direction.
- `aria-disabled` propagation on non-navigable steps in linear mode (via `isNavigable`).
- Unique ids: `_getStepLabelId(i)` and `_getStepContentId(i)`.

**We must add in the template:**

- **Header strip container** — `role="tablist"`, `[attr.aria-orientation]="orientation()"`.
- **Each step header button** — native `<button type="button">`, `cdkStepHeader` (attribute, required so CdkStepper's focus manager sees it), `role="tab"`, `[id]="_getStepLabelId(i)"`, `[attr.aria-controls]="_getStepContentId(i)"`, `[attr.aria-selected]="selectedIndex === i"`, `[attr.aria-disabled]="!step.isNavigable() || null"`, `[attr.aria-current]="selectedIndex === i ? 'step' : null"`, `(click)="onHeaderClick(i)"`.
- **Each panel** — `role="tabpanel"`, `[id]="_getStepContentId(i)"`, `[attr.aria-labelledby]="_getStepLabelId(i)"`, `tabindex="0"`.
- **Error state** — when a step has `hasError && showError()`, the header button gets `aria-invalid="true"`. The error message (from `step.errorMessage`) is rendered in a `<span class="sr-only">` inside the header so screen readers announce it.
- **Optional state** — when `step.optional` is true and the step is not completed, render a small "(Optional)" hint as `<span class="text-xs text-fg-subtle ml-1">` and include it in the accessible name.
- **LiveAnnouncer** — inject `LiveAnnouncer` from `@angular/cdk/a11y`. On `selectionChange`, announce `"{{label}}, step {{selectedIndex + 1}} of {{total}}"`. Must pass AXE and WCAG AA.
- **`sr-only` labels in `simple` variant** — when variant is `simple`, the label is visually hidden but kept in the DOM with `sr-only` so screen readers still announce it.
- **Focus indicator** — the standard `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on the `stepHeader` slot (already in base classes).

**Keyboard** — all of the following are already implemented by CdkStepper; do NOT re-add:
- ArrowLeft/Right (horizontal LTR) — prev/next step header
- ArrowUp/Down (vertical) — prev/next step header
- Home / End — first / last header
- Enter / Space — select the focused header
- Tab — moves out of the stepper once a header is focused

## Forms integration

The stepper itself is NOT a form control and does NOT implement `ControlValueAccessor`. Forms integrate at the **step** level:

```html
<tw-step [stepControl]="profileForm" label="Profile">
  <form [formGroup]="profileForm"><!-- fields --></form>
  <button twButton twStepperNext>Next</button>
</tw-step>
```

CdkStepper reads `step.stepControl` in linear mode and blocks `next()` when `stepControl.invalid` (or any projected `NgForm` / `FormGroupDirective` is invalid). Works with reactive forms, template-driven forms, and signal-based forms (signal forms expose an `AbstractControl`-compatible surface). The stepper does not touch the control value — it just gates advancement.

**Error surfacing:** when linear mode blocks advancement because `stepControl.invalid`, CdkStep sets `hasError = true` (after the user has `interacted`). Our `showError` input gates whether this error is visually rendered. Consumers can also manually `[hasError]="..."` + `[errorMessage]="..."` for custom validation.

## Keyboard behavior

Fully delegated to `CdkStepper._onKeydown`. Do not re-implement. The only thing to verify in tests is that `cdkStepHeader` is on every header button so `CdkStepper._stepHeader: QueryList<CdkStepHeader>` picks them up.

## Implementation notes

- **Extend CdkStepper / CdkStep directly** — this is the idiomatic composition pattern CDK intends (see Material's stepper). Content queries, keyboard handling, selection, linear-mode validation all work automatically. Do not use `hostDirectives` for `CdkStepper` — its `QueryList<CdkStep>` content query only resolves correctly when the host component _is_ the CdkStepper.
- **`CdkStepperNext` / `CdkStepperPrevious` DO work via `hostDirectives`** — they only need to `inject(CdkStepper)`, not contain children. Use `hostDirectives` there.
- **Signal bridge for `selectedIndex`** — in the stepper constructor, use `effect()` to push the `selectedIndexModel()` value into `super.selectedIndex` via the setter. Subscribe to `this.selectedIndexChange` in `ngAfterViewInit` (use `takeUntilDestroyed`) to push CDK updates back into the model. Guard against re-entrancy with a boolean flag or by comparing the incoming value.
- **Per-step `indicatorType`** — read `step.indicatorType()` (CdkStep signal). Map to the icon template: prefer a matching `*twStepperIcon [state]` from `contentChildren()`, else fall back to the built-in default.
- **Template length** — the stepper template will exceed 50 lines. Put it in `stepper.html`. `step.ts` and directive files remain inline.
- **Static class lookups** — all per-color/per-state class strings live in `stepper.ts` as `const` maps (exactly like `tabs.ts`'s `UNDERLINE_ACTIVE_HORIZONTAL`). No string interpolation of Tailwind class names.
- **Computed classes** — `stepperVariants()` (the `tv()` config) returns slot functions; compute once per render with `computed(() => stepperVariants({ variant: this.variant(), size: this.size(), orientation: this.orientation() }))`. Per-step classes (state-dependent) are computed in template via a helper method `getIndicatorClass(step, i)`, `getLabelClass(step, i)`, `getConnectorClass(i)`.
- **`showError` global option** — when `showError()` input changes, do NOT mutate `STEPPER_GLOBAL_OPTIONS` (it's injection-scoped). Instead, make `getShowError(): boolean` return `showError() ?? inject(STEPPER_GLOBAL_OPTIONS, { optional: true })?.showError ?? false`. CdkStep's internal `_showError()` method already reads the token; override it in `StepComponent` via a getter if per-step control is needed, otherwise just use our `showError()` input to gate visual rendering.
- **`provideTwStepperOptions`** — returns `[{ provide: STEPPER_GLOBAL_OPTIONS, useValue: options }]`. Document this for consumers who want app-wide defaults.
- **No `@angular/animations`** — panel transitions use `animate.enter` only. CdkStepper's internal animation hook (`_getAnimationDirection`) gives us the direction; pass it to the template class binding.
- **CDK import paths** — `import { CdkStepper, CdkStep, CdkStepLabel, CdkStepperNext, CdkStepperPrevious, STEP_STATE, STEPPER_GLOBAL_OPTIONS, type StepState, type StepperSelectionEvent, type StepperOptions } from '@angular/cdk/stepper';`.
- **`ChangeDetection.OnPush`** on every component.
- **No `@HostBinding` / `@HostListener`** — use the `host` object in the decorator.

## File structure

All files in `projects/ngx-tw/stepper/`:

- `stepper.ts` — `StepperComponent` (extends `CdkStepper`), `StepComponent` (extends `CdkStep`), `StepLabelDirective` (extends `CdkStepLabel`), `StepperIconDirective`, `StepperNextDirective`, `StepperPreviousDirective`, `StepperVariant` type, static class lookup maps, `provideTwStepperOptions()` helper, re-exports of `STEP_STATE`, `STEPPER_GLOBAL_OPTIONS`, `StepperSelectionEvent`, `StepState`.
- `stepper.html` — external template for `StepperComponent` (will exceed 50 lines).
- `stepper.spec.ts` — Vitest tests covering: default render (horizontal, 3 steps), all variants (`default`, `dot`, `simple`) render without error, all sizes render, all orientations render, all colors render, two-way `[(selectedIndex)]` reflects user clicks + external updates, `selectionChange` emits with correct `StepperSelectionEvent` payload, `next()` / `previous()` work, linear mode gates advancement when `stepControl.invalid` (use a reactive `FormControl` with a required validator), non-linear mode allows clicking any header, `editable=false` prevents returning to a completed step, `optional=true` allows skipping a step in linear mode, `hasError=true` + `showError=true` renders error icon + error styling + `aria-invalid`, `headerInteractive=false` disables header clicks, default step icons render per `indicatorType`, `*twStepperIcon [state="done"]` template replaces the default done icon, `*twStepLabel` template replaces the string label, `[twStepperNext]` advances selection, `[twStepperPrevious]` goes back, keyboard: ArrowRight advances focus + selects (horizontal), ArrowDown advances (vertical), Home/End go to first/last navigable step, Enter selects focused header, ARIA: `role="tablist"`, `aria-orientation`, `role="tab"`, `aria-selected`, `aria-controls`, `aria-labelledby`, `aria-current="step"` on selected header, `aria-disabled` on locked linear steps, panels have `role="tabpanel"` with correct `aria-labelledby`, `LiveAnnouncer` called on selection change, `provideTwStepperOptions({ showError: false })` suppresses error rendering. No `fakeAsync` / `tick` — use `async/await` with `fixture.whenStable()`; if testing animations, use `vi.useFakeTimers()` + `vi.runAllTimers()`.
- `index.ts` — public API exports (see below).
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

Also update:
- `projects/ngx-tw/theme/_base.css` — add `step-panel-enter-forward` / `step-panel-enter-backward` keyframes + reduced-motion handling.
- `projects/ngx-tw/src/public-api.ts` — add `export * from 'ngx-tw/stepper';`.

## Public API exports

From `projects/ngx-tw/stepper/index.ts`:

```typescript
export {
  StepperComponent,
  StepComponent,
  StepLabelDirective,
  StepperIconDirective,
  StepperNextDirective,
  StepperPreviousDirective,
  provideTwStepperOptions,
} from './stepper';
export type { StepperVariant } from './stepper';

// Re-exports from CDK so consumers don't depend on @angular/cdk/stepper directly
export {
  STEP_STATE,
  STEPPER_GLOBAL_OPTIONS,
  StepperSelectionEvent,
} from '@angular/cdk/stepper';
export type { StepState, StepperOptions } from '@angular/cdk/stepper';
```

## Usage examples

```html
<!-- Simplest: 3-step horizontal, non-linear, clickable headers -->
<tw-stepper [(selectedIndex)]="step">
  <tw-step label="Account"><p>Account fields…</p></tw-step>
  <tw-step label="Profile"><p>Profile fields…</p></tw-step>
  <tw-step label="Review"><p>Review…</p></tw-step>
</tw-stepper>
```

```html
<!-- Vertical, linear, with reactive-form validation and navigation buttons -->
<tw-stepper orientation="vertical" linear color="primary">
  <tw-step [stepControl]="accountForm" label="Account" description="Create credentials">
    <form [formGroup]="accountForm">
      <tw-input formControlName="email" label="Email" />
    </form>
    <div class="flex gap-2 mt-4">
      <button twButton twStepperNext>Next</button>
    </div>
  </tw-step>

  <tw-step [stepControl]="profileForm" label="Profile" description="Tell us about yourself">
    <form [formGroup]="profileForm"><!-- fields --></form>
    <div class="flex gap-2 mt-4">
      <button twButton variant="ghost" twStepperPrevious>Back</button>
      <button twButton twStepperNext>Next</button>
    </div>
  </tw-step>

  <tw-step label="Review" optional>
    <p>Everything good? Submit to finish.</p>
    <div class="flex gap-2 mt-4">
      <button twButton variant="ghost" twStepperPrevious>Back</button>
      <button twButton (click)="submit()">Submit</button>
    </div>
  </tw-step>
</tw-stepper>
```

```html
<!-- Custom icons and label template, 'dot' variant, success color -->
<tw-stepper variant="dot" color="success">
  <tw-step>
    <ng-template twStepLabel>
      <span class="font-semibold">Upload</span>
      <span class="text-xs text-fg-muted"> — drag files here</span>
    </ng-template>

    <ng-template twStepperIcon state="done">
      <tw-icon name="cloud-check" class="size-4" />
    </ng-template>

    <p>Upload content…</p>
  </tw-step>

  <tw-step label="Transcode"><p>Transcoding…</p></tw-step>
  <tw-step label="Publish"><p>Ready to publish.</p></tw-step>
</tw-stepper>
```

```html
<!-- Error state with custom message, compact 'simple' variant, error color -->
<tw-stepper variant="simple" [(selectedIndex)]="idx">
  <tw-step label="Connect" [hasError]="!canConnect()" errorMessage="Unable to connect">
    <p>Connection step…</p>
  </tw-step>
  <tw-step label="Verify"><p>Verification step…</p></tw-step>
  <tw-step label="Done"><p>All set.</p></tw-step>
</tw-stepper>
```

## Constraints

- Extend `CdkStepper` / `CdkStep` / `CdkStepLabel` directly — do NOT re-implement selection, keyboard nav, linear validation, or id generation.
- Use `hostDirectives` for `CdkStepperNext` / `CdkStepperPrevious` only.
- All styling via Tailwind utilities + `tv()` with `twMerge: true` — no component CSS files.
- All per-color / per-state class strings written out statically in `Record<TwColor, string>` maps — no Tailwind class interpolation.
- Semantic color tokens only (`primary-*`, `error-*`, `success-*`, etc.) — never raw palette colors (`blue-*`, `red-*`).
- Neutral structural styling uses `surface-*` / `fg-*` / `border-*` tokens — never raw `neutral-*` shades.
- `error` state always uses `error-*` tokens regardless of the stepper's `color` input.
- All visual tokens (radius `rounded-full` / `rounded-md`, spacing, shadows, focus rings, icon sizes, transitions `duration-200`) follow the CLAUDE.md Visual Design System — no invented values.
- Signal-based API: `input()`, `model()`, `output()`; `computed()` / `linkedSignal()` for derived state.
- `ChangeDetection.OnPush` on every component.
- `host` object for host bindings; `inject()` for DI; native control flow (`@if` / `@for`) in templates; no arrow functions in templates.
- `animate.enter` for panel transitions — no `@angular/animations`.
- Every `input()`, `output()`, `model()`, and public method has a one-line JSDoc.
- Tests use Vitest (`vi.spyOn()`, `async/await` + `fixture.whenStable()`, no `fakeAsync` / `tick`).
