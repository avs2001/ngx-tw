# Prompt: Build `tw-flip-card` for ngx-tw

## One-line summary
A two-sided card that flips between a front face and a back face via click, hover, manual control, or both — styled with the same visual variants as `tw-card` and driven by CSS 3D transforms.

## Context
Before implementing, read:
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/.claude/CLAUDE.md` — every convention (Angular v21 signals, Tailwind v4 semantic tokens, `tv()` slots, `twMerge`, accessibility bar, Vitest rules, no `@angular/animations`).
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/card/card.ts` — closest structural sibling. Mirror its variant vocabulary (`outlined | elevated | ghost`), its `tv()` slot pattern, and its single-file co-located variant config.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/collapsible/collapsible.ts` — reference for the state-toggle pattern: `model()` for two-way binding, `LiveAnnouncer` usage, disabled handling, `booleanAttribute` transform, keyboard handling via `host: { '(keydown)': '...' }`.
- `/Users/ciprianiuga/dev/sandbox/ngx-tw/projects/ngx-tw/theme/_base.css` — shows where animation/utility classes ship (e.g., `collapsible-enter`). New 3D perspective/backface utilities go in `theme/default.css` per this spec.

Relevant CDK:
- `@angular/cdk/a11y` — `LiveAnnouncer` for announcing the visible face in manual mode.
- `@angular/cdk/keycodes` — `ENTER`, `SPACE` constants for key matching.

Shared types from `ngx-tw/core`: none are reused (no `color` or `size` input). The component introduces two local types (`FlipCardVariant`, `FlipCardTrigger`, `FlipCardDirection`) exported from its entry point.

## What to build
A standalone Angular component `tw-flip-card` that renders two content faces (front and back) and flips between them using CSS 3D transforms. The flip is triggered by one or more of: mouse click, hover, programmatic (`[(flipped)]`), or a combination. The component visually matches `tw-card`'s variants so consumers can drop it into existing layouts. It does not own its dimensions — consumers must set a height and width on the host.

When no back content is projected, the component must render the front face and no-op all flip triggers — silently, no warning.

## API design

### Inputs

```ts
/** Visual style of the card chrome. Mirrors tw-card variants. Defaults to `'outlined'`. */
readonly variant = input<FlipCardVariant>('outlined');

/** Axis of rotation. `'horizontal'` rotates around the Y axis (left/right flip); `'vertical'` rotates around the X axis (top/bottom flip). Defaults to `'horizontal'`. */
readonly direction = input<FlipCardDirection>('horizontal');

/** Which user action flips the card. `'both'` enables click and hover. `'manual'` disables all triggers and defers control to the `flipped` model. Defaults to `'both'`. */
readonly trigger = input<FlipCardTrigger>('both');

/** When true, all triggers and keyboard handling are disabled; the current face stays visible. Defaults to `false`. */
readonly disabled = input(false, { transform: booleanAttribute });
```

Exported types:

```ts
export type FlipCardVariant = 'outlined' | 'elevated' | 'ghost';
export type FlipCardDirection = 'horizontal' | 'vertical';
export type FlipCardTrigger = 'hover' | 'click' | 'manual' | 'both';
```

### Models

```ts
/** Whether the back face is currently visible. Two-way bindable via `[(flipped)]`. Defaults to `false`. */
readonly flipped = model(false);
```

### Outputs

```ts
/** Fires after the visible face changes. Payload is the new `flipped` state (`true` when the back is showing). */
readonly flippedChange = output<boolean>();
```

Note: `model()` already emits a `flippedChange` signal by convention. This explicit `output()` is intentionally separate — it fires only on genuine user- or programmatic-initiated flips, carrying a semantic "a flip just happened" event. If the implementer finds this redundant in practice, drop it and rely on the `model`'s implicit `flippedChange` stream. `[CONFIRM]` — prefer keeping the explicit output for parity with `CollapsibleComponent.toggled`.

## Content projection

Two named slots, both projected via `[slot="..."]` attribute selectors:

| Slot | Required | Fallback |
|---|---|---|
| `[slot="front"]` | Yes | None — if missing, the front face renders empty |
| `[slot="back"]` | No | None — if missing, flip triggers no-op and the component behaves as a static front-only card |

Back-face presence is detected via `contentChild('backSlot', { read: ElementRef })` on an internal `<div #backSlot>` that wraps the `<ng-content select="[slot='back']" />`. Gate flip behavior on `hasBack = computed(() => ...)`.

No template directives (`*twFlipCardFront`) — slot attributes are sufficient for a two-slot component.

## Usage examples

```html
<!-- Simplest case: both hover and click flip. Consumer provides height. -->
<tw-flip-card class="h-64 w-96">
  <div slot="front">Hover or click me</div>
  <div slot="back">Surprise!</div>
</tw-flip-card>
```

```html
<!-- Click-only, elevated variant, vertical flip -->
<tw-flip-card trigger="click" variant="elevated" direction="vertical" class="h-48 w-72">
  <div slot="front">Click to see details</div>
  <div slot="back">Hidden details</div>
</tw-flip-card>
```

```html
<!-- Manual control with two-way binding -->
<tw-flip-card trigger="manual" [(flipped)]="isFlipped" class="h-64 w-96">
  <div slot="front">Front</div>
  <div slot="back">Back</div>
</tw-flip-card>
<button (click)="isFlipped.set(!isFlipped())">Toggle</button>
```

```html
<!-- Disabled — current face is frozen -->
<tw-flip-card [disabled]="true" [flipped]="true" class="h-64 w-96">
  <div slot="front">Front</div>
  <div slot="back">Back (frozen showing)</div>
</tw-flip-card>
```

```html
<!-- Ghost variant, hover only -->
<tw-flip-card trigger="hover" variant="ghost" class="h-40 w-40">
  <div slot="front">Hover</div>
  <div slot="back">Flipped</div>
</tw-flip-card>
```

```html
<!-- Back slot omitted — component renders front only, no flip behavior -->
<tw-flip-card class="h-40 w-40">
  <div slot="front">Only front exists</div>
</tw-flip-card>
```

## `tv()` config sketch

Slots: `root`, `inner`, `face`, `front`, `back`. All slots receive class strings from `tv()`; the 3D transform primitives come from theme utility classes declared in `theme/default.css` (see Manual steps).

```ts
const flipCardVariants = tv({
  slots: {
    // Host element — establishes perspective, sets up focus ring when interactive.
    root: 'relative block rounded-lg transition-shadow duration-200 motion-reduce:transition-none tw-flip-perspective',
    // Full-size container that actually rotates. Holds preserve-3d.
    inner: 'relative h-full w-full tw-flip-inner transition-transform duration-[400ms] ease-in-out motion-reduce:transition-none',
    // Shared face base — absolute fill, backface hidden, inherits rounded corners.
    face: 'absolute inset-0 h-full w-full rounded-lg overflow-hidden tw-flip-face',
    // Front-specific face — no extra transform; sits at rotate 0.
    front: '',
    // Back-specific face — pre-rotated so it faces away until flipped.
    back: 'tw-flip-back-face',
  },
  variants: {
    variant: {
      outlined: {
        face: 'bg-surface border border-border',
      },
      elevated: {
        face: 'bg-surface-raised shadow',
        root: 'hover:shadow-md',
      },
      ghost: {
        face: 'bg-transparent',
      },
    },
    direction: {
      horizontal: {
        inner: 'tw-flip-axis-y',
        back: 'tw-flip-back-y',
      },
      vertical: {
        inner: 'tw-flip-axis-x',
        back: 'tw-flip-back-x',
      },
    },
    flipped: {
      true: { inner: 'tw-flip-rotated' },
      false: {},
    },
    interactive: {
      true: {
        root: 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      },
      false: {},
    },
    disabled: {
      true: { root: 'opacity-50 cursor-not-allowed pointer-events-none' },
      false: {},
    },
  },
  defaultVariants: {
    variant: 'outlined',
    direction: 'horizontal',
    flipped: false,
    interactive: true,
    disabled: false,
  },
}, { twMerge: true });
```

Wire variants through a single `variantResult = computed(() => flipCardVariants({ ... }))` and expose per-slot computeds: `rootClasses`, `innerClasses`, `frontClasses`, `backClasses`. Apply `rootClasses()` via host class binding; apply the others in the template.

`interactive` is computed: `trigger !== 'manual' && !disabled() && hasBack()`.

## Template shape

Inline template (well under 50 lines):

```html
<div [class]="innerClasses()" aria-hidden="false">
  <div [class]="frontClasses()">
    <ng-content select="[slot='front']" />
  </div>
  @if (hasBack()) {
    <div [class]="backClasses()" #backSlot>
      <ng-content select="[slot='back']" />
    </div>
  } @else {
    <div #backSlot hidden><ng-content select="[slot='back']" /></div>
  }
</div>
```

The `@else` block exists only to give `contentChild('backSlot')` a stable query target for presence detection — it is `hidden` and never rendered visually. If presence detection is done via a different mechanism (e.g., querying `ng-content`'s projected nodes), the `@else` branch can be removed.

## Host bindings

Apply via the `host: {}` object on `@Component`. Never `@HostBinding` / `@HostListener`.

| Binding | Value | Applies when |
|---|---|---|
| `'[class]'` | `rootClasses()` | Always |
| `'[attr.role]'` | `hostRole()` — `'button'` when interactive, `'region'` when manual | Always |
| `'[attr.tabindex]'` | `hostTabindex()` — `0` when interactive, `null` otherwise | Always |
| `'[attr.aria-pressed]'` | `flipped()` coerced to string | Only when interactive (else `null`) |
| `'[attr.aria-live]'` | `'polite'` when `trigger === 'manual'`, `null` otherwise | Always |
| `'[attr.aria-disabled]'` | `disabled() \|\| null` | Always |
| `'(click)'` | `onClick($event)` | Always (handler internally gates on trigger + disabled + hasBack) |
| `'(keydown)'` | `onKeydown($event)` | Always (handler internally gates) |
| `'(mouseenter)'` | `onMouseEnter()` | Always (handler internally gates) |
| `'(mouseleave)'` | `onMouseLeave()` | Always (handler internally gates) |

Derived via `computed()`:
- `hostRole = computed(() => trigger() === 'manual' ? 'region' : 'button')`
- `hostTabindex = computed(() => interactive() ? 0 : null)`
- `interactive = computed(() => trigger() !== 'manual' && !disabled() && hasBack())`

## Accessibility

**Per-mode ARIA:**

| Trigger mode | `role` | `tabindex` | `aria-pressed` | `aria-live` |
|---|---|---|---|---|
| `'click'` | `button` | `0` (or none if disabled) | reflects `flipped()` | none |
| `'hover'` | `button` | `0` (or none if disabled) | reflects `flipped()` | none |
| `'both'` | `button` | `0` (or none if disabled) | reflects `flipped()` | none |
| `'manual'` | `region` | none | none | `polite` |

Rationale: `'hover'` keeps button semantics because hover alone is inaccessible to keyboard users — Enter/Space must still toggle the state, and touch devices fall back to tap. `'manual'` removes button semantics because the host is not interactive; an `aria-live="polite"` region announces face changes.

**Keyboard map (applies when `interactive === true`):**

| Key | Action |
|---|---|
| `Enter` | Toggle `flipped`. `preventDefault()`. |
| `Space` (` `) | Toggle `flipped`. `preventDefault()` to prevent page scroll. |
| All other keys | No-op; do not `preventDefault`. |

**LiveAnnouncer usage:** In `'manual'` mode — and only when `hasBack()` — inject `LiveAnnouncer` and announce `'Front face visible'` / `'Back face visible'` whenever `flipped()` changes (via an `effect()`). In button modes the `aria-pressed` change is already announced by screen readers on focus/activation, so do not double-announce.

**Focus indicator:** the standard library ring — `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` — applied only when `interactive` is true. Disabled and manual hosts show no ring.

**Contrast & content:** the chrome uses `bg-surface`, `bg-surface-raised`, `text-fg` via the variant classes. Actual face content is the consumer's responsibility — document that consumers must ensure projected content meets WCAG AA.

## Interaction flow

- **Click handler (`onClick`)**: if `disabled() || !hasBack()` → no-op. Else if `trigger() === 'click' || trigger() === 'both'` → toggle `flipped` (set + emit `flippedChange`). If `trigger() === 'hover'` on a touch device there is no reliable detection, so also toggle on click when `trigger() === 'hover'` — this is the touch fallback, documented but not special-cased; any click toggles under `'hover'` as well. `[CONFIRM]` — if the implementer prefers strict mode (hover-only means literally hover-only), drop the touch fallback and document the limitation.
- **Keydown handler (`onKeydown`)**: if `disabled() || !hasBack() || trigger() === 'manual'` → no-op. On `Enter` or `' '`: `event.preventDefault()`; toggle `flipped`.
- **Mouseenter (`onMouseEnter`)**: if `disabled() || !hasBack()` → no-op. If `trigger() === 'hover' || trigger() === 'both'` → `flipped.set(true)` (only emit `flippedChange` if the value actually changed).
- **Mouseleave (`onMouseLeave`)**: same gating as mouseenter. If applicable → `flipped.set(false)` (guard against redundant emissions).
- **No debounce** on hover — instant flip on `mouseenter`/`mouseleave`. The 400ms CSS transition provides visual smoothing; a JS debounce would compound with it badly.
- **Programmatic changes** via `[(flipped)]` or `flipped.set(...)` always work, regardless of `trigger` or `disabled`. The consumer is assumed to know what they are doing.

## Implementation notes

- Use `booleanAttribute` for `disabled` (matches `collapsible.ts`).
- Use `model(false)` for `flipped` — the user confirmed two-way binding support is required.
- Use `contentChild('backSlot', { read: ElementRef })` to detect back-face presence. Wrap `hasBack = computed(() => !!backSlot()?.nativeElement?.hasChildNodes())` or similar; if simpler, use `contentChildren(..., { descendants: true })` against a marker class. Pick the simplest reliable approach; do not over-engineer.
- Announcements in manual mode via `effect()` watching `flipped()` — only fire after first change (skip the initial value). Guard on `trigger() === 'manual' && hasBack()`.
- Emit `flippedChange` output only when the value genuinely changes. Do not emit when `flipped.set(x)` is called with the same current value.
- `LiveAnnouncer` is injected via `inject(LiveAnnouncer)` (no `providedIn: 'root'` — CDK provides it).
- Do NOT use `@angular/animations`. The flip uses a Tailwind `transition-transform duration-[400ms] ease-in-out` with a `motion-reduce:transition-none` guard (the rotation still applies instantly under reduced motion — the spec requires the flip to still happen).
- Do NOT write any component CSS file. All Tailwind utilities go in `tv()`; the three 3D-transform primitives (`perspective`, `transform-style: preserve-3d`, `backface-visibility: hidden`) ship as utility classes in `theme/default.css` because they are not expressible as Tailwind utilities without an arbitrary-property bloat.

## File structure

New secondary entry point at `projects/ngx-tw/flip-card/`:

- `flip-card.ts` — component, `tv()` config, exported types (`FlipCardVariant`, `FlipCardDirection`, `FlipCardTrigger`).
- `flip-card.spec.ts` — Vitest specs (see Test coverage outline). No `fakeAsync` / `tick` — use `async/await` with `fixture.whenStable()` or `vi.useFakeTimers()` where timing is needed.
- `index.ts` — re-exports `FlipCardComponent` and the three types.
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`.

## Public API exports

From `projects/ngx-tw/flip-card/index.ts`:

```ts
export { FlipCardComponent } from './flip-card';
export type { FlipCardVariant, FlipCardDirection, FlipCardTrigger } from './flip-card';
```

Add the entry point to the root `projects/ngx-tw/src/public-api.ts`:

```ts
export * from 'ngx-tw/flip-card';
```

## Test coverage outline

All via Vitest (`describe`/`it`/`expect`/`vi`), no `fakeAsync`. Query the DOM, not component internals.

**Rendering**
- Mounts without errors with no inputs (front-only content projected).
- Each `variant` value (`outlined`, `elevated`, `ghost`) renders without errors.
- Each `direction` value renders without errors.
- Each `trigger` value renders without errors.
- When back slot is absent, the component still renders the front and flip is inert.

**Inputs**
- Changing `flipped` via `componentRef.setInput('flipped', true)` applies the flipped styling (inner container has the rotated utility class — query the rendered class list, not the computed signal).
- Changing `variant` swaps the chrome classes on the face element.
- Changing `disabled` to `true` applies `opacity-50` and removes `tabindex` from the host.
- Changing `trigger` to `'manual'` changes host `role` from `button` to `region` and removes `tabindex`.

**Models**
- `[(flipped)]` updates the host's internal state when the consumer sets it.
- User interaction in non-manual mode updates the consumer's bound signal.

**Outputs**
- `flippedChange` emits `true` then `false` on consecutive clicks (when `trigger` includes click).
- `flippedChange` does not emit when `disabled` is true and a click occurs.
- `flippedChange` does not emit when back slot is absent, regardless of trigger.
- `flippedChange` does not emit if `flipped.set(currentValue)` is called (no-change case).

**Interactions**
- Click toggles `flipped` when `trigger` is `'click'` or `'both'`.
- Click does not toggle when `trigger` is `'manual'`.
- `mouseenter` flips to `true`, `mouseleave` flips to `false` when `trigger` is `'hover'` or `'both'`.
- Hover events are ignored when `trigger` is `'click'` or `'manual'`.
- `Enter` key toggles `flipped` (and calls `preventDefault`) when interactive.
- `Space` key toggles `flipped` and calls `preventDefault` to prevent scroll.
- Unrelated keys (e.g., `Escape`) do not toggle and do not call `preventDefault`.
- When disabled, none of click/hover/keyboard produce any emission or DOM change.

**Accessibility**
- In `'click'`/`'both'`/`'hover'` modes: host has `role="button"`, `tabindex="0"`, `aria-pressed` reflecting `flipped()`.
- In `'manual'` mode: host has `role="region"`, no `tabindex`, `aria-live="polite"`, no `aria-pressed`.
- `aria-pressed` updates from `"false"` to `"true"` after a click-toggle.
- When `disabled` is true: host has `aria-disabled="true"` and `tabindex` is absent.
- When back slot is absent: host still behaves sanely — implementation's choice whether to drop button role or keep it; test whichever is chosen.

**Content projection**
- Front content renders inside the front face element.
- Back content renders inside the back face element when projected.
- Without back content, the back face element is not rendered (or is hidden) and no back content appears in the DOM.

**Disabled state**
- Visual: host has `opacity-50` and `cursor-not-allowed`.
- Interactive: clicking, hovering, Enter, and Space all produce no state change.
- `flipped` model set programmatically still works (parent retains control).

## Manual steps

The implementer must perform these manual edits — they cannot be auto-inferred from the component code alone.

### 1. Add 3D-transform utility classes to `projects/ngx-tw/theme/default.css`

Append this block:

```css
/* ── tw-flip-card 3D transform primitives ── */

.tw-flip-perspective {
  perspective: 1000px;
}

.tw-flip-inner {
  transform-style: preserve-3d;
}

.tw-flip-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* Axis: horizontal (Y rotation) */
.tw-flip-axis-y.tw-flip-rotated {
  transform: rotateY(180deg);
}
.tw-flip-back-y {
  transform: rotateY(180deg);
}

/* Axis: vertical (X rotation) */
.tw-flip-axis-x.tw-flip-rotated {
  transform: rotateX(180deg);
}
.tw-flip-back-x {
  transform: rotateX(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .tw-flip-inner {
    transition-duration: 0ms !important;
  }
}
```

If `projects/ngx-tw/theme/default.css` does not yet exist, create it and append the block (the CLAUDE.md references it as the canonical theme entry; the working tree currently has `_base.css`, `_dark.css`, `_high-contrast.css`, `_semantic.css` partials — add to `_base.css` alongside `collapsible-enter` if that is the actual shipping file, and flag this in the PR description).

### 2. Register the entry point in `projects/ngx-tw/src/public-api.ts`

Append:

```ts
export * from 'ngx-tw/flip-card';
```

### 3. Verify `ng-package.json` and `index.ts` exist in `projects/ngx-tw/flip-card/`

Use the same shape as `projects/ngx-tw/card/ng-package.json` and `projects/ngx-tw/card/index.ts`.

## Constraints

- **Angular v21:** no `standalone: true`; signal APIs (`input`, `model`, `output`, `computed`); `inject()`; `host: {}` object; `OnPush`. No `@HostBinding`/`@HostListener`. No arrow functions in templates. No `ngClass`/`ngStyle`.
- **Tailwind v4 only:** no component CSS file. Semantic tokens exclusively — `bg-surface`, `bg-surface-raised`, `text-fg`, `border-border`. No raw `neutral-*`/`gray-*`/`blue-*` classes.
- **Visual design system (from CLAUDE.md):** `rounded-lg` for the card and faces; `shadow` for elevated resting, `hover:shadow-md` for elevated hover; `transition-shadow duration-200` and `transition-transform duration-[400ms]` with `motion-reduce:transition-none`; standard focus ring pattern; `opacity-50 cursor-not-allowed` for disabled.
- **tailwind-variants:** single `tv()` config, co-located, slots-based, `twMerge: true`, `defaultVariants` defined.
- **Animations:** no `@angular/animations`. CSS transitions only; keyframes/utilities live in theme CSS.
- **Testing:** Vitest only. No `fakeAsync`/`tick`. Use `fixture.componentRef.setInput(...)` for signal inputs. Query the DOM for assertions, not component signals.
- **JSDoc:** required on every `input()`, `output()`, and `model()`. Copy the strings above verbatim.
