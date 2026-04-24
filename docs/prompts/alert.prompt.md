# Prompt: Build `tw-alert` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, design tokens, visual design system
- `projects/ngx-tw/card/card.ts` — multi-part component pattern with parent component + child directives injecting parent for slot classes
- `projects/ngx-tw/badge/badge.ts` — `tv()` with slots and compoundVariants for all 8 colors x 3 variants
- `projects/ngx-tw/core/types.ts` — shared `TwColor` and `TwSize` types
- `projects/ngx-tw/button/button.ts` — CDK `FocusMonitor` usage pattern

## What to build

An alert component (`tw-alert`) that displays contextual feedback messages — informational, success, warning, or error — with optional icon, title, content, actions, and dismiss button. It is a multi-part component following the card pattern: a parent `AlertComponent` with child directives (`AlertIconDirective`, `AlertTitleDirective`, `AlertContentDirective`, `AlertActionsDirective`) that inject the parent to receive slot classes.

On initialization, the alert announces its text content to screen readers via CDK `LiveAnnouncer` based on a configurable politeness level. When dismissed, the host uses `animate.leave="fade-out"` to animate out before removal.

## API design

### AlertComponent (`tw-alert`)

#### Inputs

- `/** Controls the visual style of the alert. Defaults to `'soft'`. */` — `variant: input<AlertVariant>('soft')` where `AlertVariant = 'solid' | 'outline' | 'soft'`
- `/** Sets the semantic color palette. Defaults to `'info'`. */` — `color: input<TwColor>('info')`
- `/** When true, renders a dismiss button. Defaults to `false`. */` — `dismissible: input(false)`
- `/** Sets the ARIA live politeness for screen reader announcements. Defaults to `'polite'`. */` — `politeness: input<'polite' | 'assertive' | 'off'>('polite')`

#### Outputs

- `/** Fires when the dismiss button is clicked. */` — `dismissed: output<void>()`

### Child directives

- **`AlertIconDirective`** — selector `[twAlertIcon]`. Applies icon slot classes (sizing, shrink, alignment).
- **`AlertTitleDirective`** — selector `[twAlertTitle]`. Applies title slot classes (font-semibold, text color).
- **`AlertContentDirective`** — selector `[twAlertContent]`. Applies content slot classes (text-sm, text color).
- **`AlertActionsDirective`** — selector `[twAlertActions]`. Applies actions slot classes (flex, gap-2, margin-top).

Each child directive injects `AlertComponent` and reads the appropriate slot class signal, identical to the card directive pattern.

Export the type `AlertVariant` from the entry point.

## Usage examples

```html
<!-- Simplest: content only -->
<tw-alert>Your settings have been saved.</tw-alert>

<!-- With icon and title -->
<tw-alert color="success">
  <svg twAlertIcon><!-- check icon --></svg>
  <span twAlertTitle>Success</span>
  <span twAlertContent>Your changes have been saved successfully.</span>
</tw-alert>

<!-- Dismissible with actions -->
<tw-alert color="error" variant="outline" [dismissible]="true" (dismissed)="onDismiss()">
  <svg twAlertIcon><!-- error icon --></svg>
  <span twAlertTitle>Deployment failed</span>
  <span twAlertContent>The deployment could not be completed. Check logs for details.</span>
  <div twAlertActions>
    <button twButton color="error" variant="soft" size="sm">View logs</button>
  </div>
</tw-alert>

<!-- Solid variant -->
<tw-alert color="warning" variant="solid">
  <svg twAlertIcon><!-- warning icon --></svg>
  <span twAlertContent>Your trial expires in 3 days.</span>
</tw-alert>

<!-- Assertive announcement for critical alerts -->
<tw-alert color="error" politeness="assertive">
  Connection lost. Retrying...
</tw-alert>
```

## Styling

### `tv()` config

Use slots: `root`, `icon`, `title`, `content`, `actions`, `dismiss`.

**Base classes per slot:**
- `root`: `relative flex gap-3 rounded-lg p-4 text-sm`
- `icon`: `size-5 shrink-0 mt-0.5` (aligns with first text line)
- `title`: `text-sm font-semibold`
- `content`: `text-sm`
- `actions`: `flex items-center gap-2 mt-2`
- `dismiss`: `absolute top-3 right-3 inline-flex items-center justify-center size-5 rounded-md cursor-pointer transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`

**Variants:** `variant` (solid, outline, soft) and `color` (all 8 TwColor values).

**compoundVariants pattern** (follow badge exactly):
- `soft` + `{color}`: `root` gets `bg-{color}-50 text-{color}-800`, `icon` gets `text-{color}-500`, `title` gets `text-{color}-800`, `content` gets `text-{color}-700`, `dismiss` gets `text-{color}-500 hover:bg-{color}-100`
- `outline` + `{color}`: `root` gets `border border-{color}-300 text-{color}-800`, similar icon/title/content/dismiss tokens
- `solid` + `{color}`: `root` gets `bg-{color}-600 text-white`, icon/title/content inherit white, dismiss gets `text-white/70 hover:text-white hover:bg-white/10`
- For `neutral`: use surface/fg/border tokens — `bg-surface-muted`, `text-fg`, `border-border` — same pattern as badge and button neutral variants

**defaultVariants:** `{ variant: 'soft', color: 'info' }`

Enable `twMerge: true`.

**Host bindings:**
- `'[class]': 'rootClasses()'`
- `role: 'alert'`
- `'[animate.leave]': '"fade-out"'`

The dismiss button renders inline SVG (same X icon as badge). When `dismissible()` is true, add `pr-10` to root to prevent content overlapping the absolute-positioned dismiss button — use a compoundVariant or conditional class in the computed.

### Theme CSS addition

Add a `fade-out` keyframe to `projects/ngx-tw/theme/default.css` if not already present:

```css
@keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
.fade-out { animation: fade-out 150ms ease-out; }
@media (prefers-reduced-motion: reduce) { .fade-out { animation-duration: 0ms; } }
```

## Accessibility

- Host has `role="alert"` (implicit `aria-live="assertive"` for the DOM role, but the component also uses `LiveAnnouncer` for explicit programmatic announcements).
- On init, if `politeness` is not `'off'`, inject CDK `LiveAnnouncer` and announce the alert's text content (`elementRef.nativeElement.textContent`) with the configured politeness.
- Dismiss button has `aria-label="Dismiss"` and type `button`.
- Dismiss button has focus ring: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.
- No keyboard navigation beyond standard tab-to-dismiss-button behavior.

## Implementation notes

- Follow the card pattern: `AlertComponent` computes all slot class signals. Child directives inject `AlertComponent` and bind `[class]` to the parent's slot signal.
- Default content (no child directives): wrap `<ng-content />` in the content area. Use `contentChild()` queries for `AlertIconDirective`, `AlertTitleDirective`, `AlertContentDirective`, `AlertActionsDirective` to detect presence and conditionally render wrapper elements.
- When no icon directive is projected, do not render the icon column — the layout should adapt (content takes full width within the gap-3 flex).
- The template will need a flex layout: icon on the left (if present), a `min-w-0` content column (title, content text, actions), dismiss button absolutely positioned.
- `LiveAnnouncer` injection and announcement should happen in an `afterNextRender` callback to ensure projected content is available.
- Use `DestroyRef` for cleanup if needed (LiveAnnouncer does not require explicit cleanup for `announce()`).

## File structure

Files at `projects/ngx-tw/alert/`:
- `alert.ts` — `AlertComponent`, `AlertIconDirective`, `AlertTitleDirective`, `AlertContentDirective`, `AlertActionsDirective`, `AlertVariant` type
- `alert.spec.ts` — Vitest tests covering: default render, all 3 variants x key colors, all inputs, dismissed output emission, dismiss button not present when dismissible is false, content projection with and without child directives, `role="alert"` attribute, dismiss button `aria-label`, LiveAnnouncer called with correct politeness, animate.leave binding
- `index.ts` — public API exports
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`

## Public API exports

Export from `projects/ngx-tw/alert/index.ts`:
- `AlertComponent`
- `AlertIconDirective`
- `AlertTitleDirective`
- `AlertContentDirective`
- `AlertActionsDirective`
- `AlertVariant` (type)

Add `export * from 'ngx-tw/alert';` to `projects/ngx-tw/src/public-api.ts`.

## Constraints

- `ChangeDetection.OnPush` on the component.
- Signal-based inputs only (`input()`, `output()`). No `model()` — nothing needs two-way binding.
- `host` object for all host bindings. No `@HostBinding`/`@HostListener`.
- All colors use semantic tokens. Neutral uses surface/fg/border tokens.
- `tv()` with `twMerge: true` and `defaultVariants`.
- Inline template unless it exceeds ~50 lines — in that case, extract to `alert.html`.
- No `@angular/animations`. Use `animate.leave` for dismiss animation.
- No `fakeAsync`/`tick` in tests. Use `async`/`await` with `fixture.whenStable()`.
- JSDoc on every `input()` and `output()`.
