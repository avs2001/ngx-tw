---
"ngx-tw": minor
---

Indicators, overlays, and feedback cleanup — progress-bar, stat, timeline, popover, toast, tooltip.

## a11y (tooltip)

**Tooltip migrated to CDK `AriaDescriber` (dual-mode wiring).** The directive
now uses two `aria-describedby` paths depending on the content type:

- **String `twTooltip`** — routed through
  `ariaDescriber.describe(trigger, message)` / `removeDescription` on
  show/hide. AriaDescriber maintains a single hidden message-container on the
  document and dedupes identical strings across all describers — nested
  tooltips sharing a message announce once instead of twice. Mirrors the
  `SortHeaderComponent` pattern.
- **`TemplateRef` `twTooltip`** — AriaDescriber's dedup table is keyed by
  string, so template tooltips fall back to a direct
  `setAttribute('aria-describedby', overlayId)` against the role="tooltip"
  overlay. Without this fallback, AT would lose the description link for
  templated tooltip content. Symmetrical teardown branches on the active
  path.

## a11y polish (toast)

**Toast dismiss container bumped from `size-5` to `size-6`** to match the
xs square-interactive-target scale codified in CLAUDE.md. The inner `<svg>`
now uses the canonical `size-4` glyph step (it previously expanded to
`size-full`, which inflated to match the container). Result: visually
unchanged glyph at 16px sitting inside a 24px target the user can hit.

## API addition (toast demo)

`projects/demo/src/app/routes/toast/api/toast-api.component.ts` already
carried the Injection Tokens subsection documenting `TW_TOAST_DATA`,
`TW_TOAST_REF`, and `TW_TOAST_DEFAULT_OPTIONS` — no addition needed here, but
called out so reviewers can verify the demo coverage.

## API addition (timeline demo)

`scrollControls` row added to `TimelineComponent` inputs table — was missing
entirely. Includes a footnote summarising the "Overflow-control axis on
layout primitives" cap-exception justification (paraphrased from the
~16-line inline JSDoc in `timeline.ts`). New `TimelineScrollControls` type
appears in the types snippet.

## Refactor (progress-bar)

**`warned` closure-scoped flag retained inside `effect()` but the warn
side-effect now runs inside `untracked()`.** The effect remains reactive
because a consumer can remove the only accessible name they had after mount
(e.g. swapping `label="x"` for `label=undefined`); the warning must fire on
the next render. `untracked` wraps the `console.warn` + flag mutation so any
future signal reads inside the warning block cannot accidentally create a
reactive subscription.

## Refactor (progress-bar)

**Migrated dev-mode guard from `isDevMode()` to the `ngDevMode` declared
global**, matching the pattern already in `timeline.ts`. `ngDevMode` is a
build-time globalThis flag the bundler dead-code-eliminates in production;
`isDevMode()` is a runtime function call that costs a few cycles per check.
Tree-shaking the entire warn-effect setup in prod is a real win because the
effect ran in every mount even when the consumer correctly supplied
accessible names.

## Polish

- **tooltip** — `twTooltipShowDelay` and `twTooltipHideDelay` JSDoc now
  explain the asymmetric defaults (show 200ms = intent threshold; hide 0ms =
  no lingering over content the user moved on from).
- **progress-bar** — demo API description for the `options` input copied
  verbatim from the library JSDoc (was previously paraphrased to a single
  line).
- **toast** — single-line pointer comment near the `compoundVariants`
  template-literal map referencing the `@source inline(...)` safelist in
  `theme/index.css` so the dependency is visible at the use site.
- **timeline** — no `ngDevMode` change (already in place); progress-bar now
  matches.

## Migration guide

**Tooltip `aria-describedby` id format changed for string content.**
Consumers that asserted on the literal id value (`tw-tooltip-N`) of the
`aria-describedby` attribute will need to update for **string-valued**
tooltips — the id is now a CDK-generated `cdk-describedby-message-N`.
Consumers using **`TemplateRef` content** see no id-format change (the
fallback path keeps the `tw-tooltip-N` id). Consumers that only check for
attribute presence or read the resolved-text via
`document.getElementById(id).textContent` are unaffected. The shipped
tooltip overview / API demo pages already describe the AriaDescriber wiring;
no demo updates were needed.
