# Prompt: Refactor `tw-code-block` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` -- all conventions, visual design system, animation rules
- `projects/ngx-tw/card/card.ts` -- multi-slot `tv()` pattern, variant wiring
- `projects/ngx-tw/alert/alert.ts` -- CDK `LiveAnnouncer` usage, inline SVG icon pattern, dismiss button styling
- `projects/ngx-tw/code-block/code-block.ts` -- the existing implementation being refactored

CDK modules: `@angular/cdk/clipboard` (Clipboard service), `@angular/cdk/a11y` (LiveAnnouncer).

## What to build

Refactor the existing `tw-code-block` component. The component displays preformatted code in a styled container with copy-to-clipboard. No syntax highlighting. The refactored version adds: a header bar with an optional language label and the copy button, a `variant` input for `filled` or `outlined` visual treatments, and improved accessibility on the `<pre>` element (keyboard-scrollable, labeled region). The copy button moves from an absolute overlay into the header, eliminating code overlap.

## API design

### Inputs

- `code` -- `input.required<string>()`. /** The code string to display and copy to clipboard. */
- `language` -- `input<string>()`. /** Optional language label displayed in the header (e.g. 'TypeScript', 'HTML'). */
- `variant` -- `input<CodeBlockVariant>('filled')`. /** Visual style of the container. Defaults to `'filled'`. */
- `wrap` -- `input(false)`. /** When true, wraps long lines instead of horizontal scrolling. Defaults to `false`. */

Export `CodeBlockVariant` type: `'filled' | 'outlined'`. Defined in `code-block.ts`, not in `ngx-tw/core`.

### Outputs

- `copied` -- `output<void>()`. /** Fires when code is successfully copied to clipboard. */

## Usage examples

```html
<!-- Simplest case -->
<tw-code-block [code]="snippet" />

<!-- With language label -->
<tw-code-block [code]="tsSnippet" language="TypeScript" />

<!-- Outlined variant -->
<tw-code-block [code]="htmlSnippet" language="HTML" variant="outlined" />

<!-- With word wrap -->
<tw-code-block [code]="longLine" [wrap]="true" />

<!-- Reacting to copy -->
<tw-code-block [code]="snippet" language="Shell" (copied)="showToast()" />
```

## Styling

Use `tv()` with **slots**: `root`, `header`, `pre`, `copyButton`, `copyIcon`.

**Slot base classes:**
- `root` -- `flex flex-col rounded-lg overflow-hidden font-mono text-sm`. Structural container, no padding.
- `header` -- `flex items-center justify-between px-4 py-2 border-b border-border text-xs text-fg-muted`. Contains language label (left) and copy button (right).
- `pre` -- `p-4 text-fg overflow-x-auto`. Code display area. No right padding reservation needed since copy button is in the header now.
- `copyButton` -- `inline-flex items-center justify-center size-8 rounded-md cursor-pointer text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.
- `copyIcon` -- `size-4 shrink-0`.

**Variants:**
- `variant`:
  - `filled` -- root: `bg-surface-sunken border border-border-strong`
  - `outlined` -- root: `bg-transparent border border-border`
- `copied`:
  - `true` -- copyButton: `text-success-500 hover:text-success-500`
  - `false` -- (empty)

`defaultVariants: { variant: 'filled', copied: false }`. Enable `twMerge: true`.

The `wrap` input is not a tv() variant. Handle via conditional class in the `pre` computed: `whitespace-pre-wrap` when true, `whitespace-pre` when false.

Keep the inline `styles` block for scrollbar hiding on `<pre>` (`scrollbar-width: none` + webkit equivalent) since Tailwind has no utility for this.

## Accessibility

- `<pre>` element: `role="region"`, `tabindex="0"`, dynamic `aria-label` -- `"{language} code"` when language is set, `"Code"` when not. Focus ring on `<pre>`: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.
- Copy button: `aria-label` toggles between `"Copy code"` and `"Copied"` based on copied state.
- CDK `LiveAnnouncer` announces `"Copied to clipboard"` on successful copy (consistent with alert.ts pattern).
- Copy button is a native `<button>` -- keyboard accessible by default.

## Implementation notes

- Inject CDK `Clipboard` and `LiveAnnouncer`. Call `clipboard.copy(this.code())` on click. On success: set `isCopied` signal to true, emit `copied`, announce via LiveAnnouncer, reset after 2 seconds via setTimeout. Clear timeout on destroy via `DestroyRef`.
- The `tv()` result computed reads both `variant()` and `isCopied()`. Per-slot computed signals feed host class binding (root) and template class bindings (header, pre, copyButton, copyIcon).
- Template: header div containing an `@if(language())` span for the label (else empty span for flex spacing) and the copy button. Below the header, `<pre [class]="preClasses()" ...><code>{{ code() }}</code></pre>`.
- Copy button contains two inline SVGs toggled via `@if(isCopied())`: clipboard icon (default) and check icon (copied). Same Heroicons Mini 16x16 pattern as in the current implementation.
- Language label span: `font-sans font-medium select-none` to distinguish it from the mono code content.
- Host binding: `'[class]': 'rootClasses()'`.

## File structure

```
projects/ngx-tw/code-block/
  code-block.ts         -- CodeBlockComponent, CodeBlockVariant type
  code-block.spec.ts    -- Vitest tests
  index.ts              -- export { CodeBlockComponent, type CodeBlockVariant } from './code-block'
  ng-package.json       -- { "lib": { "entryFile": "index.ts" } }
```

Re-export from `projects/ngx-tw/src/public-api.ts` (already exists, verify the line is present).

## Public API exports

From `ngx-tw/code-block`: `CodeBlockComponent`, `CodeBlockVariant` (type export).

## Constraints

- All CLAUDE.md conventions: signal inputs, `host` bindings, OnPush, no NgModules, no `@angular/animations`, no raw palette colors, no `standalone: true`.
- Surface/fg/border tokens for all structural styling. Semantic tokens only.
- No `fakeAsync` in tests. Use `vi.useFakeTimers()` / `vi.advanceTimersByTime()` for the 2-second copy reset.
- Test coverage: default render, both variants render, language label presence/absence, wrap input toggles whitespace mode, copy button click (success state, output emission, aria-label change, LiveAnnouncer call, reset after timeout), `<pre>` has `role="region"` and correct `aria-label` (with and without language), keyboard activation of copy button, clipboard failure does not emit.
