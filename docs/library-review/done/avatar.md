# Avatar — Production-Grade Review

**Entry point:** `ngx-tw/avatar`
**Files:** `projects/ngx-tw/avatar/`

## Snapshot
- Selectors: `tw-avatar` (element), `tw-avatar-group` (element)
- Public classes/directives: `AvatarComponent`, `AvatarGroupComponent`, `AVATAR_GROUP_SIZE` (InjectionToken)
- Inputs: 7 on `AvatarComponent` (`src`, `alt`, `initials`, `color`, `size`, `rounded`, `status`) + 3 on `AvatarGroupComponent` (`size`, `max`, `ariaLabel`)
- Outputs: 0 on both
- Slots: 1 (default — fallback content for `AvatarComponent`, when no image/initials)
- CVA: no
- `tv()` config: yes, slots (`root`, `img`, `initials`, `fallback`, `status`)
- A11y CDK utilities used: none

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `src` | `string \| null` | `null` | yes | Image URL; falls back on error |
| `alt` | `string` | `''` | yes | Both `alt` attribute and `aria-label` for non-image variants |
| `initials` | `string \| null` | `null` | yes | 1-2 chars |
| `color` | `TwColor` (shared) | `'neutral'` | yes | |
| `size` | `TwSize` (shared) | `'md'` | yes | Overridden by `AVATAR_GROUP_SIZE` when inside a group |
| `rounded` | `AvatarRounded` (`'full' \| 'lg' \| 'none'`) | `'full'` | yes | |
| `status` | `AvatarStatus \| null` | `null` | yes | |
| `size` (group) | `TwSize` | `'md'` | yes | Propagates via InjectionToken |
| `max` (group) | `number \| null` | `null` | yes | Visibility threshold + overflow indicator |
| `ariaLabel` (group) | `string` | `'Avatar group'` | yes | Hardcoded English default |

### Findings
- All inputs have one-line JSDoc with defaults — compliant.
- `AvatarComponent` has 7 inputs — over the 5–6 cap. CLAUDE.md says "Visual primitives (avatar, icon) and decorative primitives (progress-bar) do NOT qualify [for the input-cap exception]". FLAG: reshape needed.
  - Reasonable reshape: keep `src`, `alt`, `initials`, `color`, `size`. Group `rounded` + `status` into a single `appearance` or `decoration` config object — or keep `rounded` (since it changes geometry) and group `status` + future `outline/ring` into a `decoration` object. Trade-off: `status` is high-value enough to keep top-level. Acceptable reshape: drop `rounded` as a top-level input and replace with a `shape` enum that combines `rounded` (`circle` / `square` / `rounded-square`); cuts one input.
- `AvatarGroupComponent` ariaLabel hardcoded English default `'Avatar group'` — not localisable without consumer override. Acceptable as a default; flag in docs.
- `AVATAR_GROUP_SIZE` injection-token pattern is elegant — child avatars consult it via `inject(..., { optional: true })`. Group writes via `useFactory`. Good DI hygiene.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- No outputs. Consider whether image load/error should be reported. `imageLoaded` is an internal `linkedSignal` (line 141). For consumer-visible state, an `error` output could be useful (`outputFromObservable(...)` is unnecessary — direct event would do). Low priority.

## Customization surface
- ng-content slots: 1 default slot acting as fallback for the SVG glyph (line 100 — `<ng-content>` wraps the default `<svg>`). This is using "native fallback content" (Angular v18+) correctly.
- Structural directives: none.
- Fallback content: yes — uses native `<ng-content>` with a default SVG glyph (lines 100–103). When consumers project content, the SVG is replaced. Correct per CLAUDE.md.
- Class merging: yes — `twMerge: true` (line 66).
- Findings:
  - Fallback content path correctly uses native v18+ projection — modern Angular pattern.
  - The fallback slot only renders in `displayMode === 'fallback'` (no src and no initials, lines 99–105). This means projected content does NOT render when initials or src are provided. Consumers wanting a custom monogram or icon to appear behind a hand-rolled initials display can't compose. Acceptable for the primary use case.

## CSS / Styling
- tailwind-variants: yes, slots — `root`, `img`, `initials`, `fallback`, `status`.
- twMerge: yes (line 66).
- Semantic tokens vs raw palette: compliant. Lines 49–58 use `bg-{role}-100 text-{role}-700`; neutral uses `bg-surface-muted text-fg-muted`.
- Surface/fg/border tokens: neutral row + fallback `text-fg-subtle` + status ring `ring-surface` (line 33) — all using semantic tokens. Compliant.
- Radius compliance: `rounded-full`, `rounded-lg`, `rounded-none` (lines 45–47) — compliant.
- Spacing compliance: not applicable (sizes are width/height, not padding).
- Typography compliance: `text-xs` (xs/sm), `text-sm` (md/lg), `text-base` (xl). Compliant — xl is the only one using `text-base`, which is the trigger-scale lg/xl row. For an avatar's initials this is fine.
- Focus rings compliance: not applicable (non-interactive).
- Dark mode handling: relies on semantic tokens. `bg-{role}-100` and `text-{role}-700` will pick consumer's dark mappings. Status colors are `bg-success-500`/`bg-error-500`/`bg-warning-500`/`bg-fg-subtle` (lines 70–73) — these should look fine in dark mode if the role tokens are remapped.
- Transitions: none — appropriate (avatars are mostly static).
- Shadows: none — appropriate.
- Icon sub-scale: avatar root is sized via the `glyph icons (large standalone)` row — `size-6` (24px), `size-8` (32px), `size-10` (40px), `size-12` (48px), `size-16` (64px). The codified scale lists `size-4/5/10` for glyphs. `size-6/8/10/12/16` is the standalone-avatar scale, NOT glyph. CLAUDE.md states "large standalone icons, avatars" → `size-10`. So `size-10` is the only documented value. The 5-size avatar scale (xs–xl) does not match. Same documentation reconciliation issue as Icon.
- Findings:
  - Status indicator uses `size-2` (xs/sm), `size-2.5` (md), `size-3` (lg/xl) — these are the codified DOT INDICATOR sub-scale (`size-2/2.5/3` for xs/sm/md). xl using `size-3` slightly larger than the codified "md dot" — acceptable since avatar xl is large.
  - Fallback icon uses `size-[60%]` arbitrary value (line 34) — justified (intent is "60% of parent"), but should carry an inline comment. The codified rule says arbitrary values need a one-line comment.
  - Group overlap uses `[&>tw-avatar+tw-avatar]:-ml-{N}` with `N ∈ {1.5, 2, 3}` — the values are not in any documented spacing axis but visually correct for the rendered ring overlap. Document as intentional.

## Accessibility
- ARIA roles/attributes:
  - When `displayMode !== 'image'`: `role="img"` + `aria-label` (from `alt`). Compliant.
  - When `displayMode === 'image'`: no `role` (the `<img>` element owns it). Compliant.
  - When `alt` is empty: `aria-hidden="true"` (line 83). Correctly hides decorative avatars from AT.
- Keyboard support: not focusable — correct (avatars are not interactive on their own).
- CDK a11y utilities: none required.
- Labels/descriptions wiring: `alt` is the single source of truth for AT label. Correct.
- AXE risks: none expected.
- Findings:
  - The decision to suppress `role="img"` on image avatars relies on the native `<img>` having its own `alt`. Correct, but the host element `tw-avatar` won't be a recognised landmark — AT will read the `<img>` directly. Good.
  - Status indicator is `aria-hidden="true"` (line 108) — correct (status info should be in alt or aria-label, not a colored dot).
  - `AvatarGroupComponent` uses `role="group"` + `aria-label="Avatar group"` (default) — compliant.

## Form integration (if applicable)
- CVA: not applicable.

## Tests
- Spec file: yes (`avatar.spec.ts`, 376 lines).
- Coverage breakdown:
  - rendering: default fallback SVG, img element, initials, fallback on image error.
  - sizes: every value + class assertion.
  - colors: every value.
  - rounded: full/lg/none.
  - status: null + every status value.
  - projection: projected fallback replaces default SVG.
  - a11y: role=img on non-image, aria-hidden on empty alt, no role on image, status dot aria-hidden.
  - group: render, role=group, aria-label, max overflow, +N indicator, size propagation.
  - outputs: n/a.
- Vitest-specific issues: none. `whenStable()` used correctly in group tests.
- Findings:
  - Missing: `imageLoaded` reset behavior when `src` changes — the `linkedSignal` resets `computation: () => null` on `src` change. Not directly tested.
  - Missing: `displayMode` precedence when both `src` and `initials` are set (image priority — covered implicitly by the basic image test, but not asserted as priority).
  - Missing: `text-2xs`/`text-sm`/`text-base` text-size assertions on initials.

## Gaps & lacks
1. **Input count on AvatarComponent is 7 — exceeds the 5–6 cap.** Visual primitives are explicitly NOT exempt. Reshape via config object or eliminate one axis.
2. Group's `ariaLabel` default is hardcoded English `'Avatar group'` — same l10n gap as Badge's dismiss label, mitigated by consumer override.
3. Arbitrary `size-[60%]` for fallback glyph lacks an inline-comment justification.
4. Sub-scale documentation mismatch (5-size avatar scale vs codified `size-10` standalone) — same issue as Icon.
5. No output for image load failures — consumers who need to react to failed avatars (e.g., re-fetch from a different CDN) can't subscribe.
6. Initials display has no automatic uppercase transform — `<tw-avatar initials="jd">` shows "jd". Convention is uppercase; consider `text-transform: uppercase` on the initials slot.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal
Reduce Avatar's input surface, polish defaults, and close minor a11y/test gaps.

### Tasks
1. **Reduce AvatarComponent inputs to ≤ 6** — input-cap compliance.
   - File(s): `projects/ngx-tw/avatar/avatar.ts:112-133` (input declarations)
   - Why: 7 inputs exceeds the 5–6 cap. Visual primitives have no exception.
   - Change: merge `rounded` and `status` into a single `appearance: { rounded?: AvatarRounded; status?: AvatarStatus | null }` config object OR drop the `rounded='lg'` middle option and replace `rounded` with a boolean `square` (default `false`). Recommended path: keep `rounded` as top-level (geometry input deserves first-class) but reshape `status` into a wider `decoration` axis later. For now, accept reshape as accepting `appearance` config combining `rounded` + `status`. New surface: `src`, `alt`, `initials`, `color`, `size`, `appearance` = 6 inputs.
   - Acceptance: 6 public inputs; existing demo continues to work via a backward-compat fallback (deprecated `rounded` and `status` inputs read through `appearance`).

2. **Auto-uppercase initials** — DX polish.
   - File(s): `projects/ngx-tw/avatar/avatar.ts:31` (`initials` slot), `projects/ngx-tw/avatar/avatar.ts:97` (initials template)
   - Why: Convention is uppercase initials; consumers shouldn't have to remember `.toUpperCase()`.
   - Change: add `uppercase` class to `initials` slot. If a consumer wants mixed-case, the slot config still allows them to project custom content.
   - Acceptance: `<tw-avatar initials="jd">` renders "JD" in the DOM. Spec adds an assertion.

3. **Add an `error` output for image load failures** — consumer hook.
   - File(s): `projects/ngx-tw/avatar/avatar.ts:88-94` (image template), `projects/ngx-tw/avatar/avatar.ts:135-144` (signal block)
   - Why: Consumers may want to swap CDNs or report telemetry on failed avatars. Today the image silently falls back.
   - Change: add `readonly imageError = output<Event>()` and emit from the `<img>` `(error)` handler.
   - Acceptance: spec asserts `imageError` emits when `<img>` dispatches `error`; existing fallback behavior remains.

4. **Add inline comment for `size-[60%]`** — codified arbitrary-value rule.
   - File(s): `projects/ngx-tw/avatar/avatar.ts:34` (`fallback` slot)
   - Why: CLAUDE.md requires a one-line comment on arbitrary classes explaining why no token suffices.
   - Change: add a comment above the slot config: `// 60% of parent — keeps the user-glyph proportional regardless of avatar size; no Tailwind size token expresses a percentage.`
   - Acceptance: comment present.

5. **Document the AvatarGroup ariaLabel default** — JSDoc.
   - File(s): `projects/ngx-tw/avatar/avatar.ts:212-213` (`ariaLabel` input on group)
   - Why: Hardcoded `'Avatar group'` is a sensible default but should be flagged for l10n. Consumers must override.
   - Change: extend the JSDoc to read: "Accessible label. Defaults to `'Avatar group'` (English). Override for localisation."
   - Acceptance: Compodoc shows the updated description.

6. **Test gaps** — image-priority over initials, text-size assertions.
   - File(s): `projects/ngx-tw/avatar/avatar.spec.ts`
   - Why: Codified test rule — interaction and a11y coverage.
   - Change: add `it('renders image when both src and initials are set')`, `it('renders text-sm on md initials')`, `it('emits imageError on broken src')` (after task 3 lands).
   - Acceptance: three new passing tests.

### Out of scope
- Splitting `AvatarComponent` and `AvatarGroupComponent` into separate entry points — they share state and live together cleanly.
- Adding a `borderColor` axis — out of scope.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- avatar`
- Visual check: demo app at `http://localhost:4600/avatar`
- A11y: `npm run e2e:a11y`

## Priority
**P1** — Input-cap violation is real (visual primitives are not exempt). l10n + auto-uppercase are quick wins.
