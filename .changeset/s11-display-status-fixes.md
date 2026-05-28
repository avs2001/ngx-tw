---
"ngx-tw": minor
---

S11 — Display + status fixes for `avatar`, `badge`, `alert`, `empty-state`, `skeleton`, `spinner`, and `icon` (Batch 6 wrap-up). Includes one consumer-visible breaking change on `badge`, one a11y bug fix on `avatar`, and a small set of API additions, polish, and JSDoc cleanups across the batch.

**`BadgeComponent` — BREAKING: `dot` input removed, dot-mode split into `BadgeDotDirective`.**

The `BadgeComponent` reached 7 inputs (`color`, `variant`, `size`, `pill`, `dismissible`, `dot`, `dismissLabel`) plus 1 output — well over the library's 5–6 input cap, and badge is explicitly excluded from the codified input-cap exceptions (it is a visual primitive, not an overlay / form control / structural primitive / data primitive). The dot mode also carried unique a11y semantics: no text content, no padding, no leading slot, no dismiss affordance — structurally distinct from the labelled badge.

Dot-mode now ships as a separate `BadgeDotDirective` (`[twBadgeDot]`) under `ngx-tw/badge`. `BadgeComponent` drops `dot` from its surface and lands at 6 inputs + 1 output, on the cap.

```html
<!-- Before -->
<span twBadge [dot]="true" color="success"></span>

<!-- After -->
<span twBadgeDot color="success"></span>
```

`BadgeDotDirective` exposes `color`, `size`, and the new `live` input (see below). Demo pages and snippets under `projects/demo/src/app/routes/badge/` migrated to the directive. The badge API documentation page now lists `BadgeDotDirective` as a sibling component.

**`BadgeComponent` + `BadgeDotDirective` — API addition: opt-in `live` input.**

Both surfaces previously emitted an unconditional `role="status"` on the host, treating every badge as an ARIA live region. Most badges are decorative tags or counts that never change in place; announcing them on every render produces screen-reader noise. The new `live = input(false)` toggles the role: `role="status"` when `live` is true, no role otherwise. The default of `false` matches the dominant usage and surfaces the live-region semantic only when the consumer actually wants the change announced (e.g. a counter that updates in place, an unread-messages dot).

**`AvatarComponent` — a11y bug fix: `aria-hidden` no longer hides image-mode avatars.**

The previous host binding `'[attr.aria-hidden]': '!alt() ? "true" : null'` set `aria-hidden="true"` on the host whenever `alt` was empty — including image-mode avatars, which rely on the underlying `<img>`'s `alt` attribute for accessibility. With the bug in place, an image avatar without `alt` text was both unlabelled and explicitly hidden from assistive tech; with the fix, it is unlabelled but discoverable (the consumer-visible bug).

The binding is now `'displayMode() !== "image" && !alt() ? "true" : null'` — `aria-hidden` only fires for non-image avatars without alt. Image-mode avatars are never hidden from AT regardless of `alt` presence.

A dev-mode `console.warn` covers the missing-alt case on image avatars: `<tw-avatar> rendered as image without alt text — provide alt for accessibility`. The warn fires from a `constructor`-level `effect()` guarded by `isDevMode()` so production builds carry no overhead.

**`AvatarGroupComponent` — visibility moved from `style.display` mutation to signal-driven `[hidden]`.**

The group's overflow logic previously walked the child avatars in an `effect()` and mutated each one's `style.display` directly. The mutation worked but was imperative DOM manipulation outside Angular's reactive surface. Replaced with a new `@internal groupHidden = signal(false)` on `AvatarComponent` that the avatar host-binds to `[attr.hidden]`. The group's effect now calls `avatar.groupHidden.set(...)` instead of touching DOM — the visibility flows through the reactive graph, the avatar host attribute is declarative, and the spec asserts on `hasAttribute('hidden')` instead of `style.display !== 'none'`.

**`AvatarComponent` — container-scale comments on `size-16` and `size-[60%]`.**

Both values sit outside the CLAUDE.md glyph scale's ceiling (`size-10`). Avatars are not glyphs — they are surfaces that host imagery, initials, or icons — so the values are correct, but they look like violations on a skim audit. Added one-line `// Container scale — avatars are surfaces, not glyphs (see CLAUDE.md icon sizing)` comments on the xl `root: 'size-16 …'` row and on the `fallback: 'size-[60%] …'` slot to defend against future audit flags.

**`AlertComponent` — `politeness` JSDoc expanded to cover `'off'` semantic.**

Added one sentence: "Use `'off'` to suppress re-announcement when the alert content updates after initial render — assistive tech treats the alert as a static region rather than a live region." No behavioral change.

**`EmptyStateComponent` — dead-code cleanup + inline-padding progression justification.**

- Dropped the unused `hasIcon` / `hasActions` computed signals (verified: zero references inside `projects/`). The companion `iconSlot` / `actionsSlot` content-child queries that fed them are also gone — the `EmptyStateIconDirective` / `EmptyStateActionsDirective` selectors are still used directly by `<ng-content select="[twEmptyStateIcon]">` projection and by the actions directive's own host class binding.
- Added a block comment to the `inline` compound-variant table explaining the `py-1.5 → py-2 → py-3 → py-4 → py-5` progression. `py-1.5` (sm row in the inline-padding scale) and the `py-5` halfway step before xl rows reach a container-padding step are design-specified to keep the inline empty state visually distinct from adjacent rows without over-jumping into container-padding density.

**`SpinnerComponent` — JSDoc `slot="suffix"` → `twSuffix` (S10 follow-up).**

S10 renamed the form-field projection selectors from `[slot="*"]` to `[twPrefix]` / `[twSuffix]` / etc. but deliberately left the spinner JSDoc references in place per S10's scope guard. The two strings at `spinner.ts:65` and `:73` now match the canonical selector. No behavioral change.

**`SkeletonComponent` and `IconComponent` — no edits.**

S03 already added the `track = input(true)` rationale in spinner. S04 already brought `announce` (skeleton), `name`/`img`/`ariaLabel` (icon) JSDoc up to spec with `Defaults to …` suffixes. Re-verified — no S11 edits needed.

**Spec additions:**

- `avatar.spec.ts` — three new accessibility cases covering the fixed binding (image avatars without alt no longer carry `aria-hidden`; image avatars with alt no longer carry `aria-hidden`; image avatars without alt fire the dev-mode warn; image avatars with alt do not fire the warn). The existing AvatarGroup overflow test rewritten from `style.display !== 'none'` to `hasAttribute('hidden')` and asserts the `style.display` property remains empty (proving the signal-driven path is the only one touching visibility).
- `badge.spec.ts` — `LiveBadgeHost` added; new "accessibility" cases assert (1) no implicit role on the host by default, (2) `role="status"` only when `live` is true, (3) the role attribute is removed when `live` flips back to false. All previous `[dot]` tests were dropped from this spec; the existing `DotBadgeHost` / `DotDismissibleBadgeHost` / `DotWithAvatarHost` helpers were removed.
- `badge-dot.spec.ts` (new) — covers default rendering (no children, base classes applied), per-color background tokens for all 8 `TwColor` values, per-size dot dimensions for all 5 `TwSize` values, and the same `live` opt-in pattern (no role default, role="status" when live, role removed when live → false).

**Migration guide:**

Replace every `[dot]="…"` usage on `[twBadge]` with the `[twBadgeDot]` directive. The two surfaces are now structurally separate — `twBadge` no longer renders dot mode.

```html
<!-- Before -->
<span twBadge [dot]="true" color="success" size="md"></span>

<!-- After -->
<span twBadgeDot color="success" size="md"></span>
```

If you toggle between labelled badge and dot via a signal, use an `@if` at the call site to switch between the two surfaces — they accept different inputs.

```html
@if (isDot()) {
  <span twBadgeDot [color]="status()" [size]="size()"></span>
} @else {
  <span twBadge [color]="status()" [size]="size()">{{ label() }}</span>
}
```

If your code relies on the previous unconditional `role="status"` on every badge for live-region announcements (rare — most badges are static labels), add `[live]="true"` to opt back in.

**Acceptance check:**

```bash
rg -n "aria-hidden.*'true'" projects/ngx-tw/avatar         # only in spec assertions + decorative SVG children
rg -n "displayMode\(\).*'image'" projects/ngx-tw/avatar    # gate present
rg -n 'style\.display' projects/ngx-tw/avatar/avatar.ts    # zero — replaced with [attr.hidden]
rg -n '\bdot\b.*input\(' projects/ngx-tw/badge/badge.ts    # zero — input removed
rg -n 'twBadgeDot|BadgeDotDirective' projects/ngx-tw/badge # directive + spec + index export present
rg -n '\[dot\]' projects/                                  # zero — demos migrated
rg -n 'slot="suffix"' projects/ngx-tw/spinner              # zero — replaced with twSuffix
```

Type-check clean across `tsconfig.lib.json`, `tsconfig.spec.json`, `tsconfig.app.json` (including Angular template type-check). Full library suite: **2558 passing / 4 pre-existing skipped** (18 net new tests added — badge-dot suite plus avatar a11y / dev-warn cases). No regressions.

**Known follow-up:** none. The audit's "Medium" badge dismiss-button `transition-colors` note (targets only background) was not addressed — the existing transition is correct as-is (`transition-colors` covers both color and background-color per Tailwind v4); the audit observation was inaccurate. The audit's "Low" skeleton width/height object-vs-string-style note was deferred — the current semicolon-string serialisation is a minor style preference with no behavioral impact.
