---
"ngx-tw": minor
---

Content & display cleanup — sort, segmented-control, code-block, carousel, and flip-card.

## Breaking

**segmented-control — `rootClass` / `optionClass` inputs removed.**
Consumers should bind classes via Angular's standard `[class]` binding on
`<tw-segmented-control>` and `<tw-segmented-option>` directly. Both elements
still apply their tv() base classes through a host `[class]` binding, so
consumer classes merge into the element's `classList` automatically. Note:
unlike the removed `rootClass`/`optionClass` inputs (which ran `twMerge`
*inside* the host binding), the standard `[class]` binding does **not** drop
conflicting base utilities — to truly override `rounded-full` with
`rounded-md`, consumers must use a higher-specificity selector or
`!`-prefixed utilities (e.g. `!rounded-md`) in their own stylesheet.

## API additions

**code-block — `isCopied` is now a `model()` (was a private `signal`).**
Two-way bindable via `[(isCopied)]`. Existing one-way callers see no behavior
change; the symbol is also surfaced in Compodoc as a public API member.

**code-block — new `copyFailed = output<Error>()`.**
Fires when `CDK.Clipboard.copy()` returns `false` (permissions blocked,
insecure context, jsdom). Existing successful-copy emissions (`copied`) and
the auto-reset of `isCopied` are unchanged.

## a11y

**flip-card — `LiveAnnouncer.announce` now fires in interactive modes
(`hover`, `click`, `both`), not only `manual`.**
Previously, screen-reader users hovering or clicking a flip card received no
announcement of the face change. The new behavior announces `"Back face
visible"` / `"Front face visible"` on every flip when a back face is
projected. Consumers who relied on the silent behavior in interactive modes
should suppress the announcement at the consumer level (e.g. by overriding
the `LiveAnnouncer` provider with a no-op for the local injector scope).

## Tokens

**theme — new `--color-overlay-control` and `--color-overlay-control-hover`
semantic tokens** in `theme/_semantic.css`:

```css
--color-overlay-control: oklch(0 0 0 / 0.4);
--color-overlay-control-hover: oklch(0 0 0 / 0.6);
```

These tokens own the translucent dark capsule used by chrome that floats
over arbitrary consumer content (carousel pause control, carousel indicator
overlay capsule). Tailwind v4 auto-generates the matching
`bg-overlay-control{,-hover}` utilities.

**carousel — migrated from raw `bg-black/40` / `hover:bg-black/60` to
`bg-overlay-control` / `hover:bg-overlay-control-hover`.**
The visual contract is unchanged; consumers can now retheme the overlay
chrome through theme-CSS overrides instead of monkey-patching the carousel.

## Internal refactors

- **segmented-control — `ACTIVE_CLASSES` / `INACTIVE_CLASSES` constants
  moved into the `tv()` config as `compoundVariants`.** All option styling
  (3 variants × 8 colors × 2 active states + inactive default + disabled) now
  lives in a single tv() call. The option's class computation collapses to a
  single `segmentedControlVariants({...}).option()` call.
- **segmented-control — dev-mode parent guard.** When
  `<tw-segmented-option>` is rendered without a `<tw-segmented-control>`
  ancestor, a `console.error` fires (dev mode only) explaining the
  parent-requirement. Switching `forwardRef(...)` to
  `inject(..., { optional: true })` lets the component degrade silently in
  production while making the dev-mode error explicit.
- **carousel — dropped the `_effectiveSlidesToScrollView()` thin wrapper.**
  The underlying `_effectiveSlidesToScroll` signal was already public-internal
  (`readonly`); the indicator directive now reads it directly as
  `this.carousel._effectiveSlidesToScroll()`.

## Polish (no behavior change)

- **sort — documents the `tw*` input/output aliasing pattern** on
  `SortDirective` (precedent: Angular Material's `MatSort`). The aliases
  namespace bindings under the directive selector to avoid attribute
  collisions on the host element; removing an alias is a breaking API
  change. Verified the audit's "drop the aliases" finding would have broken
  every existing consumer template.
- **sort — annotates the `ariaDescriber.describe` effect** at
  `sort-header.ts:178-191` to document its reactive contract. Audit suggested
  converting to `afterNextRender` (one-shot), but the effect reads the
  `sortActionDescription` public signal input and must re-run on consumer
  rebinds (e.g. i18n state changes) — `afterNextRender` would silently freeze
  the description at first render.
- **carousel — extends the closure-capture comment in `_onPointerUp`**
  documenting the read-then-null pattern that protects against re-entrant
  pointer events fired synchronously by `releasePointerCapture`.
- **code-block — JSDoc on `CodeBlockComponent` explaining the
  `role="region"` inner-element ownership.** Outer host is presentational;
  the inner `<pre tabindex="0" role="region">` owns the focusable
  scroll-region semantics. Audit suggested promoting the outer host to
  `role="region"`; verified that would double-announce the landmark.
- **code-block — JSDoc on `CodeBlockHeaderDirective`** documenting that its
  host class lays out the projected element's *own* children (filename
  `<span>` + badges), distinct from the parent `headerStart` slot wrapper
  that contains it. Audit flagged "duplicate classes"; verified the two
  apply to different DOM nodes with different jobs.
- **flip-card — JSDoc on `FlipCardComponent`** documenting the hard
  dependency on theme keyframe classes (`tw-flip-perspective`,
  `tw-flip-inner`, etc.) defined in `projects/ngx-tw/theme/_base.css`.
  Without the theme stylesheet the card renders as two flat stacked faces
  with no perspective or rotation.
- **flip-card — annotates the `MutationObserver` setup** explaining why
  `contentChild` is *not* a valid replacement: the back content is projected
  through `<ng-content select="[slot='back']" />`, and `contentChild`
  resolves the parent's own content children rather than projected
  descendants. The spec exercises dynamic projection toggled by an `@if`
  in the host (`DynamicBackHost`), which `contentChild` cannot satisfy. The
  observer is single-target on a `childList` mutation only, so the cost is
  bounded.

## Migration guide

- **`rootClass` / `optionClass` (segmented-control):**
  ```html
  <!-- before -->
  <tw-segmented-control [rootClass]="'shadow-2xl'" [optionClass]="'uppercase'">
    ...
  </tw-segmented-control>

  <!-- after -->
  <tw-segmented-control class="shadow-2xl">
    <tw-segmented-option value="a" class="uppercase">A</tw-segmented-option>
    <tw-segmented-option value="b" class="uppercase">B</tw-segmented-option>
  </tw-segmented-control>
  ```
  For utility overrides (consumer wants `rounded-md` to win over the default
  `rounded-full`), prefix with `!` (`!rounded-md`) or write the override in
  your own stylesheet — the standard `[class]` binding adds classes without
  dropping conflicts.

- **`copyFailed` (code-block):** previously the clipboard failure was
  silently swallowed. Consumers who wrapped `(copied)` in `try { … } catch`
  saw nothing fire — there was no rejection path to catch. Subscribe to
  `(copyFailed)` instead:
  ```html
  <tw-code-block code="..." (copied)="onCopied()" (copyFailed)="onCopyError($event)" />
  ```
