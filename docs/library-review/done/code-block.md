# Code Block — Production-Grade Review

**Entry point:** `ngx-tw/code-block`
**Files:** `projects/ngx-tw/code-block/`

## Snapshot
- Selectors: `tw-code-block` (element).
- Public classes/directives: `CodeBlockComponent`. Public type: `CodeBlockVariant`.
- Inputs: 4 (`code` required, `language`, `variant`, `wrap`).
- Outputs: 1 (`copied`).
- Slots: 0 — code is passed as an input string, not projected.
- CVA: no.
- `tv()` config: yes; slots: `root`, `header`, `pre`, `copyButton`, `copyIcon`.
- A11y CDK utilities used: `Clipboard` (`code-block.ts:11, 105`), `LiveAnnouncer` (`code-block.ts:12, 106, 145`).

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `code` | `string` (required) | — | yes (`code-block.ts:90`) | Clipboard target + rendered text. |
| `language` | `string \| undefined` | `undefined` | yes (`code-block.ts:93`) | Header label + aria-label suffix. |
| `variant` | `CodeBlockVariant` ('filled'\|'outlined') | `'filled'` | yes (`code-block.ts:96`) | Bg/border style. |
| `wrap` | `boolean` | `false` | yes (`code-block.ts:99`) | Toggles `whitespace-pre`/`pre-wrap`. |

### Findings
- Input count: 4 — under cap.
- `code` is correctly `input.required<string>()`. Defensible.
- `language`'s JSDoc gives examples ('TypeScript', 'HTML') — clear.
- `wrap` default `false` — correct (long code blocks should horizontally scroll by default; word-wrap is a deliberate opt-in).
- **Missing input — copy label override**: i18n. The button aria-label is hardcoded to "Copy code" / "Copied" (`code-block.ts:67`), and the announcer is hardcoded to "Copied to clipboard" (`code-block.ts:145`). Same i18n gap as `tw-alert`'s dismiss button.
- **No `transform: booleanAttribute`** on `wrap`. Same nit.
- **No `lineNumbers` / `highlight` / `theme` input** — this is a pure plain-text code block, no syntax highlighting. Acceptable scope. But the demo (and the README in `nplx-tw`) calls it a "code block" without qualifying — consumers will expect at least optional language highlighting. Either document the scope ("plain text; bring your own highlighter") or layer one in (out of scope for this review).

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `copied` | `void` | past-tense action | Fires only on successful clipboard copy (`code-block.ts:102, 144`). |

### Findings
- Correctly guarded: only emits when `Clipboard.copy()` returns `true` (`code-block.ts:141-144`).
- `void` payload is fine; consumers know what they passed.

## Customization surface
- ng-content slots: none. Code is a string input. **No way to render a custom header** (e.g. a filename, an executable badge, multiple actions). The header today is a fixed flex container with `{{ language() }}` on the left and a copy button on the right.
- Structural directives: none.
- Fallback content: not applicable.
- Class merging: `twMerge: true` (`code-block.ts:42`).
- Findings:
  - **Header is non-customizable.** Common consumer needs that are blocked:
    - "Add a filename next to the language" — must hack via CSS.
    - "Add a Run button alongside Copy" — impossible.
    - "Hide the language label but keep the copy button" — works (language is optional), but the layout still reserves header space.
  - **Code is input, not projected.** This is a real ergonomic choice: it allows the consumer to keep the string in TypeScript (typed, refactor-friendly) but means consumers can't author code blocks with rich markup (e.g. inline highlights, click-to-reveal sections). For a typed library this is acceptable.
  - The `<code>{{ code() }}</code>` interpolation (`code-block.ts:86`) escapes HTML — correct (no XSS from a `<` in the snippet).
  - **Empty `code` rendering**: `code` is required. If a consumer accidentally passes `""`, the component renders an empty `<pre>` with no fallback message. Acceptable; required-input keeps the contract clear.

## CSS / Styling
- tailwind-variants: yes; five slots (`code-block.ts:18-43`).
- twMerge: yes.
- Semantic tokens vs raw palette: 100% semantic — `bg-surface-sunken`, `bg-transparent`, `border-border`, `border-border-strong`, `text-fg`, `text-fg-muted`, `text-success-500` (`code-block.ts:20-34`). No raw palette.
- Surface/fg/border tokens usage: textbook. `bg-surface-sunken` for filled (recessed feel), `bg-transparent` for outlined, `border-border-strong` for the prominent filled outline (correct usage per `CLAUDE.md` "Emphasized structural borders"). Note from the prompt confirms this is legal — and indeed it's the canonical case.
- Radius compliance: `rounded-lg` on root (`code-block.ts:20`), `rounded-md` on copy button (`code-block.ts:23`) — compliant.
- Spacing/gap compliance: header `px-4 py-2` (`code-block.ts:21`) — inline pattern, compliant (sm row from the inline padding table). `pre p-4` (`code-block.ts:22`) — block scale, compliant.
- Typography compliance: `font-mono text-sm` on root (`code-block.ts:20`) — compliant per the prompt's note. Header `text-xs text-fg-muted` (`code-block.ts:21`) — compliant. Language label has `font-sans font-medium select-none` (`code-block.ts:60`) — `font-sans` is intentional (the language label is not code). Compliant.
- Focus rings compliance:
  - Copy button: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (`code-block.ts:24`) — compliant.
  - `<pre>` element: same focus ring (`code-block.ts:22`) — compliant. **And needed** because the pre has `tabindex="0"` for horizontal scrolling via keyboard.
- Dark mode handling: surface-token-driven; the only color reference outside surface/fg is `text-success-500` for the "copied" check state. `success-500` is dark enough (green) on dark backgrounds to remain visible. Acceptable without an explicit `dark:` override. Verify visually.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on copy button (`code-block.ts:24`) — compliant.
- Shadows: none. Per prompt's note, `shadow-md` is permitted for code blocks (floating panel). Not used here. Acceptable; the codified pattern is *floating* code blocks. The library's code blocks live embedded in the page, so no shadow is correct.
- Icon sub-scale: copy button is `size-8` (`code-block.ts:23`) — square interactive `md`. Inner icon is `size-4` (`code-block.ts:25`) — glyph small. **Compliant** with the codified sub-scales (square interactive uses 6/7/8/9; the glyph inside uses 4/5/10).
- `pre` element uses a tiny inline `styles:` block to hide the scrollbar (`code-block.ts:48-53`). The prompt acknowledges this is expected. **Caveat**: `styles:` on a component imports a CSS scope — this is technically a "component CSS file" per `CLAUDE.md`'s "no CSS files for components" rule. The intent of that rule is "use Tailwind utilities, not custom CSS", and there's no Tailwind utility for `scrollbar-width: none`. The inline `styles:` block is a pragmatic exception (3 lines, scoped). Either:
  - Migrate the scrollbar-hiding to a global utility class in `theme/_base.css` and reference by name (consistent with `tw-flip-*`, `fade-in`, etc.).
  - Codify "small inline `styles:` for unstyleable native pseudo-elements" as an explicit exception in `CLAUDE.md`.
- Findings:
  - Styling is largely clean.
  - One policy ambiguity: inline `styles:` block.

## Accessibility
- ARIA roles/attributes:
  - `<pre>` has `role="region"` + `tabindex="0"` + `[attr.aria-label]="preAriaLabel()"` (`code-block.ts:82-84`). Good — landmark + keyboard-scrollable.
  - Copy button has `[attr.aria-label]` toggling between "Copy code" and "Copied" (`code-block.ts:66`). Correct.
  - Both icons are `aria-hidden="true"` (`code-block.ts:71, 75`). Correct.
- Keyboard support:
  - Copy button is a native `<button>` — Enter/Space work.
  - `<pre>` is focusable (`tabindex="0"`) so a keyboard user can scroll it with Arrow keys. Compliant with WCAG 2.1 SC 1.4.10 / 2.1.1.
- CDK a11y utilities: `LiveAnnouncer.announce('Copied to clipboard')` (`code-block.ts:145`). Polite by default (default for `announce` is `polite`).
- Labels/descriptions wiring:
  - `<pre>` aria-label is computed: `'{language} code'` when set, else `'Code'` (`code-block.ts:127-130`). Good.
  - i18n: "Copied to clipboard", "Copy code", "Copied" are hardcoded strings.
- AXE risks:
  - Copy button color contrast in the `text-success-500` "copied" state may be marginal on `bg-surface-sunken`. Verify with AXE.
  - `role="region"` requires an accessible name — `aria-label` is set, so OK.
- Findings:
  - **i18n gap**: three hardcoded strings.
  - Other than i18n, a11y is in very good shape — landmark, keyboard-scrollable, labeled.

## Form integration (if applicable)
- CVA: no.
- ErrorStateMatcher: no.
- form-field interop: no.
- Findings: not applicable.

## Tests
- Spec file: yes (`code-block.spec.ts`).
- Coverage breakdown:
  - Rendering: required code, displays text, header + button, filled default, outlined variant (`code-block.spec.ts:31-59`).
  - Inputs: code updates, `whitespace-pre`/`pre-wrap`, language presence/absence/update (`code-block.spec.ts:63-106`).
  - Interactions: clipboard.copy called, copied output emits, no emit on failure, success-state styling, 2-second reset via `vi.useFakeTimers`, LiveAnnouncer announces (`code-block.spec.ts:110-169`).
  - Accessibility: aria-labels (default, toggle, with language, without language), role=region, tabindex=0, keyboard via Enter (`code-block.spec.ts:173-218`).
- Vitest-specific issues: clean. Uses `vi.useFakeTimers` / `vi.advanceTimersByTime` correctly. No `fakeAsync`/`tick`.
- Findings:
  - Strongest test suite of this batch — covers most of the public contract.
  - **Minor gaps**:
    1. The "keyboard via Enter" test (`code-block.spec.ts:208-218`) dispatches a `keydown` event AND then calls `button.click()`. The assertion only proves `click()` works, not that the keydown propagates. Native buttons handle Enter via `click` natively. Could be tightened.
    2. No test for the focus ring being visible (`focus-visible` class assertion).
    3. No test that the `pre` is keyboard-scrollable (synthetic Arrow key dispatch + scrollLeft assertion).
    4. No `twMerge` consumer override test.
    5. No test verifying cleanup of the 2-second timeout when component is destroyed mid-success (the `destroyRef.onDestroy` cleanup at `code-block.ts:132-137`).

## Gaps & lacks
1. **i18n** — three hardcoded English strings ("Copy code", "Copied", "Copied to clipboard"); no inputs to override.
2. **Header is not customizable** — no slot for filename, additional actions, or replacement header layout.
3. **Inline `styles:` block** for `scrollbar-width: none` violates "no component CSS files" rule by the letter, even though it's pragmatic.
4. **No `transform: booleanAttribute`** on `wrap`.
5. **No content-projection alternative** for the code itself (e.g. a `[twCodeBlockCode]` directive for templates that want rich markup) — acceptable scope decision, but document.
6. Tests miss timeout cleanup, twMerge override, and keyboard scrolling.
7. `text-success-500` on `bg-surface-sunken` contrast not verified.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Close the i18n gap, give consumers a header customization escape hatch, codify or remove the inline `styles:` block, and harden tests.

### Tasks

1. **Add i18n inputs for the three hardcoded strings.**
   - File(s): `projects/ngx-tw/code-block/code-block.ts:66-79, 127-130, 140-152`
   - Why: three English strings cannot be localized today.
   - Change: add three inputs:
     - `readonly copyLabel = input<string>('Copy code');` (button aria-label resting)
     - `readonly copiedLabel = input<string>('Copied');` (button aria-label after copy)
     - `readonly copiedAnnouncement = input<string>('Copied to clipboard');` (LiveAnnouncer text)
     - Optionally: `readonly codeAriaLabelFn = input<((lang: string | undefined) => string)>(...)` — but defer; the default "{language} code" / "Code" is enough.
   - Use them in the template and in `copyToClipboard`. This brings inputs to 7 — **exceeds the cap**. Either:
     - Group into a single `labels: input<CodeBlockLabels>(...)` config object (preferred, matches the "data primitive" pattern that the library is moving toward).
     - Or codify a "primitive-with-i18n" exception alongside the other exceptions in `CLAUDE.md`. (Less preferred.)
   - Recommendation: `labels: input<{ copy: string; copied: string; announcement: string }>(...)` with a default object.
   - Acceptance: spec asserts each label is overridable; demo shows a localized example. Input count stays at ≤5.

2. **Expose a header slot.**
   - File(s): `projects/ngx-tw/code-block/code-block.ts:58-80`
   - Why: consumers want filenames, extra actions, etc. Today the header is rigidly two-column.
   - Change: add `<ng-content select="[twCodeBlockHeader]" />` after the language label, before the copy button. Wrap the existing language + copy button in their own `<div class="flex items-center gap-2">` so projected header content sits visually alongside them. Add a `CodeBlockHeaderDirective` (attribute selector) that applies the shared header class for typography consistency.
   - Alternative (simpler): allow consumers to **replace** the language label by accepting `<ng-content select="[twCodeBlockLabel]">` that, when provided, overrides the `language` text. This is less powerful but matches simpler need.
   - Acceptance: spec verifies projected header element renders; demo shows a filename + language combo.

3. **Resolve the inline `styles:` block.**
   - File(s): `projects/ngx-tw/code-block/code-block.ts:48-53`, plus possibly `projects/ngx-tw/theme/_base.css`.
   - Why: "no CSS files for components" is codified. The pragmatic carve-out for unstyleable native pseudo-elements is undocumented.
   - Change (preferred): migrate the scrollbar-hiding to `theme/_base.css` as a utility class (e.g. `.tw-scrollbar-none { scrollbar-width: none; &::-webkit-scrollbar { display: none; } }`). Remove the `styles:` block and add `tw-scrollbar-none` to the `pre` slot's class string.
   - Alternative: codify "small inline `styles:` for unstyleable native pseudo-elements" as an explicit exception in `CLAUDE.md`.
   - Acceptance: no component `styles:` block, OR `CLAUDE.md` lists the exception.

4. **Add `transform: booleanAttribute` to `wrap`.**
   - File(s): `projects/ngx-tw/code-block/code-block.ts:99`
   - Why: consistency.
   - Change: `wrap = input(false, { transform: booleanAttribute })`.
   - Acceptance: bare `<tw-code-block wrap>` enables wrap.

5. **Tighten the keyboard-Enter test.**
   - File(s): `projects/ngx-tw/code-block/code-block.spec.ts:208-218`
   - Why: today the test dispatches `keydown` AND calls `.click()` — only the click is verified.
   - Change: drop the `.click()` and confirm the native button's default Enter behavior fires `click`. If the test runner does not simulate this, dispatch `keydown` then `keyup` then check the `copied` output count. Or just drop the test — the button's keyboard behavior is native and tested by the platform.
   - Acceptance: meaningful or removed.

6. **Add timeout-cleanup test.**
   - File(s): `projects/ngx-tw/code-block/code-block.spec.ts`
   - Why: the 2-second reset uses `setTimeout`, and `destroyRef.onDestroy` clears it. Cover this.
   - Change: with fake timers, click the copy button (sets `isCopied=true`), then destroy the fixture before 2s, then `vi.advanceTimersByTime(2000)`. Assert no error fires and no `setState`-after-destroy warning. Use `vi.spyOn(window, 'clearTimeout')` to assert it was invoked.
   - Acceptance: green, no warnings.

7. **Add `twMerge` consumer override test.**
   - File(s): `projects/ngx-tw/code-block/code-block.spec.ts`
   - Change: render `<tw-code-block class="rounded-2xl">` and assert the host has `rounded-2xl` and not `rounded-lg`.
   - Acceptance: passes.

8. **Verify `text-success-500` contrast in copied state.**
   - File(s): `projects/ngx-tw/code-block/code-block.ts:33`
   - Why: light green on `bg-surface-sunken` may be marginal at 3:1 for non-text contrast.
   - Change: if AXE flags it, swap `text-success-500` → `text-success-600` for filled, keep `-500` for outlined. Document.
   - Acceptance: AXE pass; visual diff acceptable.

### Out of scope
- Syntax highlighting — explicitly scope as plain-text. If we ever add it, it should be a separate `tw-syntax-highlight` directive that consumes the code-block output.
- Line numbers — same scope decision.
- File-tab-style multi-snippet container — that's a `tw-tabs` composition, not a code-block concern.

### Verification
- Build: `npm run build:lib`
- Test: `npm test` (filter: `code-block`)
- Visual check: `http://localhost:4600/code-block`
- A11y: `npm run e2e:a11y` (code-block route)

## Priority
**P2** — Best-shaped component of this batch by far. i18n is the only sharp edge; header customization is a quality-of-life enhancement. Address after Alert (P0) and Item / Flip-Card (P1).
