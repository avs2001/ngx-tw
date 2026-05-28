# Flip Card — Production-Grade Review

**Entry point:** `ngx-tw/flip-card`
**Files:** `projects/ngx-tw/flip-card/`

## Snapshot
- Selectors: `tw-flip-card` (element).
- Public classes/directives: `FlipCardComponent`. Public types: `FlipCardVariant`, `FlipCardDirection`, `FlipCardTrigger`.
- Inputs: 5 (`variant`, `direction`, `trigger`, `disabled`, `flipped` as `model`).
- Outputs: 1 (`flippedChange`) + the implicit `flippedChange` from the `model`.
- Slots: 2 (named `select="[slot='front']"`, `select="[slot='back']"`).
- CVA: no.
- `tv()` config: yes; slots: `root`, `inner`, `face`, `front`, `back`.
- A11y CDK utilities used: `LiveAnnouncer` (manual-mode face announcements, `flip-card.ts:137, 205`).

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `variant` | `FlipCardVariant` ('outlined'\|'elevated'\|'ghost') | `'outlined'` | yes (`flip-card.ts:119`) | Mirrors `tw-card` chrome. |
| `direction` | `FlipCardDirection` | `'horizontal'` | yes (`flip-card.ts:122`) | Rotation axis. |
| `trigger` | `FlipCardTrigger` | `'both'` | yes (`flip-card.ts:125`) | hover\|click\|manual\|both. |
| `disabled` | `boolean` (booleanAttribute) | `false` | yes (`flip-card.ts:128`) | Freezes current face. |
| `flipped` | `model<boolean>` | `false` | yes (`flip-card.ts:131`) | Two-way bindable. |

### Findings
- Input count: 5 — exactly at the cap. Good restraint.
- `disabled` correctly uses `booleanAttribute` transform (`flip-card.ts:129`) — supports `[disabled]` and bare `disabled` attribute.
- `model(false)` is correct here: parent can `[(flipped)]`, child also writes on click/hover. Matches `linkedSignal` semantics inside a `model`.
- All defaults are `false`/safe — no codified-exception boolean defaults needed.
- **JSDoc nit**: `trigger`'s JSDoc says "both enables click and hover. manual disables all triggers" — accurate. Could be tightened, but fine.
- **Default mismatch**: `variant` defaults to `'outlined'` here but `tw-card.variant` defaults to `'elevated'`. The class doc says it "mirrors tw-card variants" but the defaults differ. Either align defaults or document the divergence explicitly.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `flippedChange` | `boolean` | `propertyChange` | Fires after flip. Explicit `output()` *in addition to* the `model('flipped')` (`flip-card.ts:134`). |

### Findings
- **Duplicate emission risk.** Angular's `model()` already exposes a `flippedChange` output internally. Declaring a second `output<boolean>('flippedChange')` on the same name can cause two emissions per change or shadow the model's emission. Investigate (`flip-card.ts:131-135`). The `setFlipped` method (`flip-card.ts:249-253`) calls both `this.flipped.set(next)` (model write triggers model's `flippedChange`) and `this.flippedChange.emit(next)` (explicit output). Recommend removing the explicit output and relying on the model's built-in change emission.
- The spec at `flip-card.spec.ts:264-291` only checks the count of consumer-bound `(flippedChange)` calls — it doesn't catch double emission because the host's `[(flipped)]` binding captures only the consumer-facing event. Add a test that subscribes directly to `componentInstance.flippedChange.subscribe(...)` while also observing `flipped` changes — count both.

## Customization surface
- ng-content slots: named via `select="[slot='front']"` and `select="[slot='back']"` (`flip-card.ts:110, 113`). Consumer uses `<div slot="front">…</div>`. Clean.
- Structural directives: none.
- Fallback content: none. **Gap**: when only a `front` slot is projected, the component still renders the face wrapper for `back` but applies `hidden` (`flip-card.ts:112`). Acceptable, but consider adding native fallback content on the front slot so a totally empty `tw-flip-card` renders something reasonable.
- Class merging: `twMerge: true` (`flip-card.ts:89`).
- Findings:
  - Slots are well-named and accept any element type.
  - The "presence detection" via `_hasBack` (`flip-card.ts:140-194`) uses `afterNextRender` + `viewChild` + `childElementCount`. This is correct **once**, but it does not re-evaluate if the consumer dynamically projects content later (e.g. `@if` toggling). Consider using `contentChild` or a `MutationObserver`, or document the limitation: back content must be present from first render.

## CSS / Styling
- tailwind-variants: yes; slots `root` / `inner` / `face` / `front` / `back` (`flip-card.ts:30-90`).
- twMerge: yes.
- Semantic tokens vs raw palette: 100% semantic — `bg-surface`, `bg-surface-raised`, `bg-transparent`, `text-fg`, `border-border` (`flip-card.ts:43-54`).
- Surface/fg/border tokens usage: correct — exactly mirrors `tw-card`.
- Radius compliance: `rounded-lg` on `root` and `face` (`flip-card.ts:34, 38`) — compliant.
- Spacing/gap compliance: no internal spacing; spacing is consumer's responsibility (slot content). Correct.
- Typography compliance: no text styling; consumer-owned. Correct.
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (`flip-card.ts:72`) — compliant. Only applied when `interactive: true` (good — non-interactive flip cards aren't focusable).
- Dark mode handling: surface-token-driven; no `dark:` overrides needed. Correct.
- Transitions:
  - root: `transition-shadow duration-200 motion-reduce:transition-none` (`flip-card.ts:34`) — compliant.
  - inner: `transition-transform duration-[400ms] ease-in-out motion-reduce:transition-none` (`flip-card.ts:36`) — uses **arbitrary value `duration-[400ms]`**. Per `CLAUDE.md`, durations are limited to `duration-150` / `duration-200`. This is the only explicit policy violation. Either widen the policy to allow a documented `duration-300` / `duration-400` step for transform animations, or pick the closest standard (`duration-300` from Tailwind's scale). See recommendations.
- Shadows: `shadow` on elevated, `hover:shadow-md` (`flip-card.ts:48-50`) — compliant and demonstrates the pattern that `tw-card` misses.
- Icon sub-scale: not applicable.
- Findings:
  - Sole real policy miss: `duration-[400ms]` for the flip transform. Decide: codify a `duration-300`/`duration-400` exception for "compound transforms" or change to `duration-300`.
  - The custom `tw-flip-*` CSS classes (`flip-card.ts:33-90`) live in `projects/ngx-tw/theme/_base.css:206-230` — correct location per `CLAUDE.md` (keyframes/CSS classes in theme, components reference names).

## Accessibility
- ARIA roles/attributes:
  - `role="button"` when interactive (any trigger except manual + has-back + not-disabled) (`flip-card.ts:150-152`).
  - `role="region"` + `aria-live="polite"` in manual mode (`flip-card.ts:151, 163-165`).
  - `aria-pressed` reflects `flipped` only when interactive (`flip-card.ts:157-160`). Correct semantic — `aria-pressed` makes the toggle state announceable.
  - `aria-disabled="true"` when disabled (`flip-card.ts:167-170`).
  - `tabindex` set to `0` when interactive, `null` otherwise (`flip-card.ts:154-156`).
- Keyboard support: Enter / Space toggle (`flip-card.ts:221-227`), with `preventDefault` to suppress page scroll. Compliant.
- CDK a11y utilities: `LiveAnnouncer` for manual-mode face transitions (`flip-card.ts:198-209`). Sound — only announces on user-initiated changes (skips first run).
- Labels/descriptions wiring: the `tw-flip-card` host has `role="button"` but no `aria-label`. **Gap**: a screen reader hears the projected front content concatenated with the back content, which is confusing. Recommendation: when interactive, expose an `ariaLabel` input or use `aria-describedby` to point at the back-slot's content, OR set `aria-hidden="true"` on the currently-invisible face and rely on the visible face's text as the accessible name. The latter is more flexible.
- AXE risks: the merged front+back text content being read aloud is the main risk. AXE may not flag it, but real screen readers will.
- Findings:
  - **Critical a11y gap**: invisible face is not `aria-hidden`. A screen reader announces both faces' text simultaneously when `role="button"` derives its accessible name from descendant text. Add `[attr.aria-hidden]="flipped()"` to the front face wrapper and `[attr.aria-hidden]="!flipped()"` to the back face wrapper. This also helps with `inert` if we want to belt-and-suspenders it for tab order.
  - The `region` in manual mode has no label — `role="region"` requires an accessible name (AXE rule). Add an `ariaLabel` input (with sensible JSDoc) or use a generic default like `"Flip card"`.

## Form integration (if applicable)
- CVA: no.
- ErrorStateMatcher: no.
- form-field interop: no.
- Findings: not applicable.

## Tests
- Spec file: yes (`flip-card.spec.ts`).
- Coverage breakdown:
  - Rendering: front-only, two-sided, every variant, every direction (`flip-card.spec.ts:67-138`).
  - Inputs: `flipped`, `disabled` (`flip-card.spec.ts:140-167`).
  - Interactions: click toggles, manual ignores click, hover under each trigger mode, Enter/Space, other keys, disabled (`flip-card.spec.ts:169-262`).
  - Outputs: `flippedChange` count via host (`flip-card.spec.ts:264-291`).
  - Accessibility: role/tabindex/aria-pressed for click/both/hover and manual; front-only non-interactive (`flip-card.spec.ts:293-329`).
  - Content projection: both slots into their face wrappers; front-only hides back (`flip-card.spec.ts:331-356`).
- Vitest-specific issues: clean. Uses `vi.fn`, `vi.useFakeTimers` not needed (no setTimeouts). Uses `whenStable` before assertions on `hasBack` (`flip-card.spec.ts:55-59`). No `fakeAsync`/`tick`.
- Findings:
  - **Coverage holes**:
    1. No test for double-emission of `flippedChange` (see Outputs Findings).
    2. No test that `LiveAnnouncer.announce` is invoked in manual mode on transition. Should mock the provider and assert `'Back face visible'` / `'Front face visible'`.
    3. No test that the `aria-hidden` on invisible face is applied (because the feature isn't implemented yet — but blocks that should be added together).
    4. No test for `model('flipped')` parent two-way write: e.g. parent sets `flipped(true)`, the host renders the back face, and clicking back to front updates the parent's signal.

## Gaps & lacks
1. **A11y — invisible face not `aria-hidden`**, so screen readers announce both faces' text via the `role="button"` accessible name.
2. **A11y — `role="region"` has no accessible name** in manual mode; AXE will flag this.
3. **Duplicate `flippedChange`** emission likely (explicit `output()` alongside `model()`).
4. `duration-[400ms]` is an arbitrary value, violating the codified duration scale.
5. `_hasBack` does not re-evaluate after first render — dynamically-projected back content won't activate the flip.
6. `variant` default (`outlined`) differs from `tw-card.variant` default (`elevated`) despite "mirrors tw-card" JSDoc. Align or document.
7. Tests don't cover LiveAnnouncer invocation or double-emission.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Close the a11y gaps, eliminate the duplicate `flippedChange` emission, and resolve the `duration-[400ms]` policy miss. Reach production-grade.

### Tasks

1. **Hide the invisible face from assistive tech** — apply `aria-hidden` to the non-active face.
   - File(s): `projects/ngx-tw/flip-card/flip-card.ts:107-115`
   - Why: `role="button"` derives its accessible name from descendant text. Today both faces' text are concatenated when the screen reader reads the toggle.
   - Change: in the template, bind `[attr.aria-hidden]="flipped() ? 'true' : null"` on the front wrapper and `[attr.aria-hidden]="!flipped() ? 'true' : null"` on the back wrapper. Also add `[inert]="flipped() ? '' : null"` (front) and `[inert]="!flipped() ? '' : null"` (back) so tab order excludes the hidden face when the face contains focusable controls (e.g. a button inside the back slot).
   - Acceptance: new spec asserts `aria-hidden="true"` flips between the two wrappers as `flipped` toggles; AXE clean.

2. **Give `role="region"` an accessible name in manual mode** — add an `ariaLabel` input.
   - File(s): `projects/ngx-tw/flip-card/flip-card.ts:118-170`
   - Why: AXE rule "ARIA region must have accessible name". Today the manual-mode host fails this rule with no label.
   - Change: add `readonly ariaLabel = input<string | undefined>(undefined);` with JSDoc. In the host bindings add `'[attr.aria-label]': 'computedAriaLabel()'` where `computedAriaLabel` returns the input if set, otherwise `'Flip card'` when in manual mode, otherwise `null`. This brings the input count to 6 — still at the cap because flip-card is borderline overlay-adjacent (manages multiple focusable faces); document the rationale in JSDoc or inline.
   - Acceptance: spec asserts `aria-label` exists in manual mode by default and is overridable.

3. **Eliminate duplicate `flippedChange` emission** — remove the explicit `output()` and rely on `model()`'s built-in change emission.
   - File(s): `projects/ngx-tw/flip-card/flip-card.ts:131-135, 249-253`
   - Why: `model('flipped')` already exposes a `flippedChange` event. Declaring an additional `output()` with the same name risks shadowing / double-firing.
   - Change: delete line 134-135 (`flippedChange = output<boolean>()`). In `setFlipped`, only call `this.flipped.set(next)` — do not also call `.emit(next)`. Verify the host two-way binding `[(flipped)]` still works (it should — `model` is two-way by design).
   - Acceptance: new spec subscribes directly to `componentInstance.flipped` via `effect` and to the model's change event; asserts each toggle yields exactly one emission to the consumer.

4. **Resolve the `duration-[400ms]` policy miss** — choose between codifying or aligning.
   - File(s): `projects/ngx-tw/flip-card/flip-card.ts:36`, plus `.claude/CLAUDE.md` "Transitions" section if widening the policy.
   - Why: arbitrary durations are explicitly forbidden by the codified visual system.
   - Change (Option A — preferred): change `duration-[400ms]` to `duration-300` (closest standard step). Verify the flip still feels natural; if 300ms is too snappy, widen the codified policy in `CLAUDE.md` to also permit `duration-300` for **transform-based reveals** (flip, slide-in panels) and document it as an exception inline.
   - Acceptance: source no longer has `duration-[`; the chosen value is justified either by the codified scale or a documented exception.

5. **Make `_hasBack` reactive to dynamic projection** — replace `afterNextRender` snapshot with `contentChild` + observer.
   - File(s): `projects/ngx-tw/flip-card/flip-card.ts:138-141, 192-195`
   - Why: today a consumer doing `@if (showBack()) { <div slot="back">…</div> }` will not flip — `_hasBack` stayed `false` from first render.
   - Change: replace the `viewChild` + `afterNextRender` snapshot with either: (a) a `contentChildren` query of `[slot='back']` elements via `contentChildren()`, or (b) keep `viewChild` but use a `MutationObserver` watching `childList` on the back wrapper. Option (a) is cleaner. Set `_hasBack = computed(() => this.backNodes().length > 0)`.
   - Acceptance: new spec dynamically toggles the back slot via `@if` in the host and asserts `hasBack` updates.

6. **Align `variant` default with `tw-card`** — or document divergence.
   - File(s): `projects/ngx-tw/flip-card/flip-card.ts:120`
   - Why: JSDoc claims it "mirrors tw-card variants" but defaults differ (outlined vs elevated). Inconsistent for consumers.
   - Change: pick one. Recommendation: leave the default as `'outlined'` (matches the demo's visual emphasis) and tighten JSDoc to "Mirrors `tw-card` variants. Defaults to `'outlined'` (vs `tw-card`'s `'elevated'` default) so the flip animation reads more clearly without baseline shadow." Optional: align to `'elevated'`.
   - Acceptance: JSDoc explains the divergence or both defaults match.

7. **Add LiveAnnouncer test** — confirm announcements only fire in manual mode after the first run.
   - File(s): `projects/ngx-tw/flip-card/flip-card.spec.ts` (new `describe`).
   - Why: `LiveAnnouncer` is the only CDK a11y integration; currently untested.
   - Change: provide a `vi.fn()` mock for `LiveAnnouncer`, set `trigger='manual'`, toggle `flipped`, assert `'Back face visible'` then `'Front face visible'`. Verify it is **not** called on first render (skipped via `firstRun` flag).
   - Acceptance: two calls in correct order; zero calls when trigger != manual.

### Out of scope
- Adding a tilt/3D pseudo-shadow on hover (visual polish, not policy).
- Auto-flip on focus — would conflict with the `hover` trigger semantics.
- Replacing the named slot pattern with structural directives — the current pattern matches HTML web components and works fine.

### Verification
- Build: `npm run build:lib`
- Test: `npm test` (filter: `flip-card`)
- Visual check: `http://localhost:4600/flip-card`
- A11y: `npm run e2e:a11y` (flip-card route), plus manual screen-reader check (VoiceOver Rotor) of front vs back announcement after the `aria-hidden` change.

## Priority
**P1** — Two real a11y gaps (invisible face announces, region has no name) plus a likely double-emit bug. Visually solid but the a11y misses can fail an audit. Address before card and code-block.
