# Page Object Models

One file per component route. POMs stay **thin**: `goto()`, one accessor per
`<section class="mb-10">` on the examples page, and the smallest set of
named-element shortcuts the spec needs. Anything richer than a locator + a
small composite action belongs in `support/` so it can be reused across pages.

See chapter 02 of `docs/e2e/` for the architecture rationale.

## Overlay components — copy `dialog.page.ts`

`dialog.page.ts` + `specs/01-components/dialog.spec.ts` are the reference
implementation for every overlay-driven control (select, menu, popover,
command-palette, tooltip, toast). To author a new overlay POM and spec, copy
the pair and adapt — the same shape covers every CDK-overlay control. Keep
these conventions:

1. **Section anchors use raw `h2` + text, not `getByRole('heading')`.** CDK
   sets `aria-hidden="true"` on `<main>` while a modal/overlay is open, which
   flips the page's section headings to inaccessible. `getByRole` returns
   zero matches in that state and the spec breaks the moment it tries to
   read page chrome (lifecycle log, stack depth, "Result:" code) without
   first dismissing the overlay. The DOM-level selector
   `this.main.locator('section').filter({ has: this.page.locator('h2').filter({ hasText: /^…$/ }) })`
   survives `aria-hidden` and matches the chapter 02 heading-anchored pattern.
2. **Expose the overlay container, the open-dialog stack, and a `topDialog`
   shortcut.** Every overlay test asserts either against the top-most overlay
   (`overlayContainer.locator('tw-dialog-container').last()`) or against the
   full stack count. Putting both on the POM keeps specs declarative.
3. **Wait for `data-state="open"` / `"closed"`, not for a fixed delay.** The
   container exposes its animation phase as a `data-state` attribute. Wrap
   `waitForOpen()` / `waitForClosed()` on the POM and call them after every
   open / close in the spec — never `waitForTimeout`.
4. **Click backdrops via `.cdk-overlay-backdrop`, not the library-specific
   class.** `tw-dialog-backdrop` is intended but currently never applied (see
   the bug note in `dialog.page.ts`). The generic CDK class is always
   present and is what every overlay control uses today.
5. **Anchor "value" `<code>` elements with `span > code`.** The demo wraps
   live result/stack/lifecycle outputs as `<span>Label: <code>value</code></span>`.
   `span > code` isolates them from `<tw-code-block>`'s `<pre><code>` snippets
   that often contain the same literal value (e.g. `'followed'`, `'cancelled'`)
   verbatim in source-form documentation.
6. **Tag every test.** `@interaction` for behaviour, `@overlay` for every
   overlay test (so CI can grep one filter for the whole family), `@a11y`
   for focus-trap / ARIA / focus-restore assertions. Multiple tags per
   test are fine and expected.
7. **Triage failures as: real bug | test bug | flake.** Real bugs become
   `test.fixme` with the bug description inline (no skip-without-link). Test
   bugs get fixed in the POM / spec. Flakes get a deterministic wait — never
   a sleep.
