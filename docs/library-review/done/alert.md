# Alert — Production-Grade Review

**Entry point:** `ngx-tw/alert`
**Files:** `projects/ngx-tw/alert/`

## Snapshot
- Selectors: `tw-alert` (element); `[twAlertIcon]`, `[twAlertTitle]`, `[twAlertContent]`, `[twAlertActions]` (attribute directives).
- Public classes/directives: `AlertComponent`, `AlertIconDirective`, `AlertTitleDirective`, `AlertContentDirective`, `AlertActionsDirective`. Public type: `AlertVariant`.
- Inputs: 4 (`variant`, `color`, `dismissible`, `politeness`).
- Outputs: 1 (`dismissed`).
- Slots: 4 (icon / title / content / actions) + a default `<ng-content/>` for raw text.
- CVA: no.
- `tv()` config: yes; slots: `root`, `icon`, `title`, `content`, `actions`, `dismiss`.
- A11y CDK utilities used: `LiveAnnouncer` (announces content on render, `alert.ts:13, 188, 214-224`).

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `variant` | `AlertVariant` ('solid'\|'outline'\|'soft') | `'soft'` | yes (`alert.ts:173`) | Standard set. |
| `color` | `TwColor` | `'info'` | yes (`alert.ts:176`) | Default differs from buttons (info vs primary) — sensible. |
| `dismissible` | `boolean` | `false` | yes (`alert.ts:179`) | Renders X button. |
| `politeness` | `'polite' \| 'assertive' \| 'off'` | `'polite'` | yes (`alert.ts:182`) | LiveAnnouncer level. |

### Findings
- Input count: 4 — under cap.
- Boolean default of `dismissible` is `false` — correct.
- No `transform: booleanAttribute` on `dismissible` (`alert.ts:179`). Same nit as `item`. Add for consistency.
- `politeness` type is inline — consider hoisting `AriaPoliteness = 'polite' | 'assertive' | 'off'` to `ngx-tw/core` and reusing across `toast`, `dialog`, etc. if those use the same triplet.
- **Missing input — title/aria-label override**: when content is rich (HTML inside `[twAlertContent]`), `LiveAnnouncer` reads the full `textContent` (`alert.ts:218`). This is often the right thing, but verbose alerts will read at length and interrupt the user. A `announceMessage?: string` input would let consumers provide a short summary. Add as a P2 enhancement.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `dismissed` | `void` | past-tense action | Fires on dismiss-button click (`alert.ts:185, 163`). |

### Findings
- `void` payload is fine — the consumer already knows which alert dismissed (it's their template binding).
- Past-tense matches the codified action-event pattern.

## Customization surface
- ng-content slots:
  - `select="[twAlertIcon]"` — only rendered when an icon directive is present (`alert.ts:149-151`) via `@if(hasIcon())`. Good — no empty icon column.
  - `select="[twAlertTitle]"`, `select="[twAlertContent]"` — always projected if provided.
  - `<ng-content />` (catch-all) — renders raw text/HTML inline alongside the directive-tagged slots (`alert.ts:155`).
  - `select="[twAlertActions]"` — always projected if provided.
- Structural directives: four — `AlertIconDirective`, `AlertTitleDirective`, `AlertContentDirective`, `AlertActionsDirective` (`alert.ts:96-138`).
- Fallback content: none. The dismiss button has a hardcoded SVG (`alert.ts:165-167`). Consider exposing it as a slot so consumers can use their own icon set. Today the dismiss icon is a custom inline `path` — not a `tw-icon`. See recommendations.
- Class merging: `twMerge: true` (`alert.ts:93`).
- Findings:
  - Strong slot architecture; matches Material's `mat-snack-bar-action` / `mat-icon-button` pattern.
  - **Order quirk**: the template projects `title`, then `content`, then default `<ng-content/>`, then `actions` (`alert.ts:153-156`). If a consumer writes the children in a different order, the rendered order is still title→content→default→actions. That's correct (this is how slots work) but **may surprise** consumers who expect document order. Document or accept.
  - `hasIcon()` is computed from `contentChild(AlertIconDirective)` (`alert.ts:192-194`). Same pattern as flip-card's back detection but uses content child (correct API). Reactive — if the icon is added/removed via `@if`, the column adjusts.
  - Dismiss button is not exposed as a slot. **Consumer can't replace the X icon**, change the aria-label per locale (it's hardcoded to `'Dismiss'`), or use a different shape. For an i18n-ready library this is a real gap.

## CSS / Styling
- tailwind-variants: yes; six slots (`alert.ts:20-94`).
- twMerge: yes.
- Semantic tokens vs raw palette: mostly semantic. **Violation**: `text-white`, `text-black`, `text-white/90`, `text-black/80`, `text-white/70`, `hover:bg-white/10`, `hover:bg-black/10` etc. across the solid compoundVariants (`alert.ts:51, 56, 61, 71, 76, 81, 86`). `text-white` / `text-black` are raw palette literals — they don't adapt to theme; and the `on-{role}` tokens were added precisely to fix this in the recent `feat(theme): add on-{role} semantic tokens` commit (e952a33). Stepper and calendar already migrated. **Alert is the largest remaining consumer that still uses raw `white`/`black`.**
  - This is the single highest-impact finding in this review.
- Surface/fg/border tokens: neutral compoundVariants use `bg-surface-muted`, `text-fg`, `text-fg-muted`, `border-border` (`alert.ts:64-66`) — correct.
- Radius compliance: `rounded-lg` on root (`alert.ts:22`), `rounded-md` on dismiss (`alert.ts:28`) — both compliant.
- Spacing/gap compliance: `p-4` block (`alert.ts:22`), `gap-3` root, `gap-2` actions, `mt-2` actions (`alert.ts:22, 26`) — all compliant. The `mt-0.5` on icon (`alert.ts:23`) is the documented baseline-alignment nudge for icons next to multi-line text. Compliant.
- Typography compliance: `text-sm` body, `text-sm font-semibold` title (`alert.ts:22-25`) — compliant.
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on dismiss button (`alert.ts:28`) — compliant.
- Dark mode handling:
  - Neutral path uses surface tokens — auto-adapts.
  - Color paths (`bg-info-50 text-info-800`, `bg-primary-50 text-primary-800`, etc.) **have no `dark:` overrides**. The `feedback_dark_mode_overrides` memory says explicit `dark:bg-{color}-900/X` is the project convention. Today alert's soft variant against a dark page background will look incorrect — `bg-info-50` is near-white, and `text-info-800` is dark, so soft alert renders as light pill on a dark page. This is a real dark-mode gap.
  - Outline path same problem — `border-info-300` and `text-info-800` on a dark page look anemic.
  - Solid path: works in dark mode because `-600` shades are dark enough.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on dismiss (`alert.ts:28`) — compliant.
- Shadows: none on alerts — correct (per `CLAUDE.md` "Alert content" is `text-sm` body, shadow not in scope).
- Icon sub-scale: dismiss is `size-5` (`alert.ts:28`), inner SVG `size-full`. The dismiss button is a **square interactive target**. Per `CLAUDE.md` "Square interactive targets" table: `xs` = `size-6`. The dismiss button at `size-5` is **smaller than the smallest documented square-interactive size**. This is the second policy miss. Either codify a tighter alert-dismiss sub-size or upgrade to `size-6` and tighten the inner SVG accordingly.
  - Note: `[twAlertIcon]` slot uses `size-5` (`alert.ts:23`) — that's the glyph scale "Standard icons (alerts, navigation)". That sizing is correct for the glyph.
- `animate.leave="fade-out"` host binding (`alert.ts:146`) — uses the codified `fade-out` keyframe class from `theme/_base.css:37-38`. Compliant.
- Findings:
  - **`text-white`/`text-black` should migrate to `text-on-{role}`** across all solid compoundVariants.
  - **Dark-mode pairs for soft and outline variants** are missing.
  - **Dismiss button square-interactive target** at `size-5` is below the codified `xs` minimum (`size-6`).

## Accessibility
- ARIA roles/attributes: hardcoded `role="alert"` (`alert.ts:144`) — meaning every alert is announced immediately and *interrupts* the screen reader's current speech. This is the correct WAI-ARIA semantics for *error/critical* alerts but **too aggressive** for `info`/`success` toasts that don't need interruption. WAI-ARIA's `role="status"` (assertive=false, behaves like `aria-live="polite"`) is the lighter alternative.
- Keyboard support: dismiss button is a native `<button>` so Enter/Space work for free.
- CDK a11y utilities: `LiveAnnouncer.announce(text, politeness)` (`alert.ts:220`). But: combining `role="alert"` (which is itself `aria-live="assertive"`) **with** `LiveAnnouncer.announce` on first render produces a **double announcement**. Screen readers read the alert's text via the role, then `LiveAnnouncer` announces the same text via its hidden live region. This is a real bug.
- Labels/descriptions wiring: dismiss button has `aria-label="Dismiss"` (`alert.ts:161`) — hardcoded, not i18n-ready (see customization surface).
- AXE risks:
  - Double announcement above.
  - Contrast: soft variants use `text-{color}-800` on `bg-{color}-50` — these pairs are codified for WCAG AA in the palette but the `warning` variant uses `text-warning-800` on `bg-warning-50` (amber on amber-50) — verify. Most likely passes.
  - Dismiss button's hover state on solid alerts is `hover:bg-white/10` — 10% white over a `-600` background. May not be a distinct enough visual cue for low-vision users; the focus ring saves it.
- Findings:
  - **Double-announcement is the main a11y bug.** Either:
    - Keep `role="alert"` and remove the `LiveAnnouncer.announce` call (let the role do it).
    - Keep `LiveAnnouncer` and drop `role="alert"` for `politeness !== 'assertive'` (use `role="status"` or no role).
    - The clean fix is: `role` should reflect `politeness` (`alert` for assertive, `status` for polite, no role for off), and `LiveAnnouncer` should NOT also announce.
  - **`role="alert"` for info / success messages** is over-aggressive WAI-ARIA practice. Map it based on `politeness`.
  - **i18n gap**: `aria-label="Dismiss"` hardcoded.

## Form integration (if applicable)
- CVA: no.
- ErrorStateMatcher: no.
- form-field interop: no.
- Findings: not applicable.

## Tests
- Spec file: yes (`alert.spec.ts`).
- Coverage breakdown:
  - Default render: yes (`alert.spec.ts:74-110`).
  - Variants: soft, outline, solid + loop over all (`alert.spec.ts:112-151`).
  - Color input: error, success, neutral (with surface tokens), warning-solid (text-black), all-colors loop (`alert.spec.ts:153-204`).
  - Dismissible: button presence, pr-10 padding, emits on click, emits on each click (`alert.spec.ts:206-241`).
  - Content projection: icon, title, content, actions presence + class application (`alert.spec.ts:243-294`).
  - Content without directives: simple text (`alert.spec.ts:296-316`).
  - Accessibility: role=alert, aria-label, type=button (`alert.spec.ts:318-352`).
  - LiveAnnouncer: polite by default, assertive, off (`alert.spec.ts:354-407`).
  - animate.leave binding: presence check only (`alert.spec.ts:409-421`).
- Vitest-specific issues: clean. Uses `vi.fn().mockResolvedValue(undefined)`, proper provider mocking for `LiveAnnouncer`. No `fakeAsync`/`tick`.
- Findings:
  - Strong coverage on the core API.
  - **Missing**:
    1. No test for double-announcement (would catch the bug above).
    2. No test that `role` is `'alert'` vs `'status'` based on `politeness` (because the feature doesn't exist yet — add when fixing).
    3. No test for `twMerge` consumer override.
    4. No test for `text-on-{role}` tokens (would lock in after migration).
    5. No test for dark-mode classes on color variants (because they don't exist — add when fixing).
    6. The `animate.leave binding` test (`alert.spec.ts:410-421`) doesn't actually assert anything specific — just that the element exists. Could be removed or tightened to inspect the `_nghost-` attribute that Angular emits for the binding.

## Gaps & lacks
1. **Double-announcement** — `role="alert"` + `LiveAnnouncer` both fire on first render. Real screen-reader bug.
2. **`text-white`/`text-black`** still used across solid compoundVariants — should use `text-on-{role}` tokens.
3. **No dark-mode overrides** on soft/outline color variants — soft alerts on a dark page render as light pills.
4. **Dismiss button size** below codified square-interactive minimum (`size-5` vs `size-6`).
5. **i18n: hardcoded `aria-label="Dismiss"`** with no input override.
6. **No `transform: booleanAttribute`** on `dismissible`.
7. `role="alert"` is over-aggressive for non-assertive alerts — should track `politeness`.
8. Custom dismiss SVG instead of `tw-icon` — minor; locks in the icon style.
9. No `announceMessage` input — full content is announced verbatim, which can be too verbose.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Bring `tw-alert` to production grade: fix the double-announcement, migrate to `text-on-{role}` tokens, add dark-mode pairs to soft/outline variants, and close the i18n & sizing gaps.

### Tasks

1. **Fix the double-announcement bug** — let `role` track `politeness` and drop the redundant `LiveAnnouncer.announce`.
   - File(s): `projects/ngx-tw/alert/alert.ts:143-147, 188-224`
   - Why: today `role="alert"` (implicit `aria-live="assertive"`) AND `LiveAnnouncer.announce(text, politeness)` both fire on first render, so screen readers read the same text twice.
   - Change:
     - Replace the static `'role': 'alert'` host binding with `'[attr.role]': 'computedRole()'` where `computedRole` returns:
       - `'alert'` when `politeness() === 'assertive'`
       - `'status'` when `politeness() === 'polite'`
       - `null` when `politeness() === 'off'`
     - Delete the `LiveAnnouncer` injection and `afterNextRender` block. The role's implicit live region does the announcement.
     - Keep the `politeness` input but rename its semantics in JSDoc: "Maps to ARIA `role`: `assertive` → `alert`, `polite` → `status`, `off` → no role / no announcement."
   - Acceptance:
     - Spec asserts each `politeness` value produces the expected `role` attribute.
     - Existing LiveAnnouncer-based spec is replaced with a role-attribute spec.
     - Manual screen-reader pass: one announcement per alert.

2. **Migrate solid variants to `text-on-{role}` tokens.**
   - File(s): `projects/ngx-tw/alert/alert.ts:48-86`
   - Why: the library has shipped `--color-on-{role}` (`projects/ngx-tw/theme/_semantic.css:144-151`). Alert is the largest remaining holdout.
   - Change: replace every `text-white`, `text-black`, `text-white/90`, `text-white/70`, etc. on solid compoundVariants with `text-on-{color}`. For semi-transparent variants (`text-white/90`), use `text-on-{color}/90`. Replace `hover:bg-white/10` and `hover:bg-black/10` with `hover:bg-on-{color}/10`. The `warning` solid case stays correct because `--color-on-warning` is `amber-950` (near-black) by design.
   - Acceptance:
     - No `text-white` / `text-black` / `bg-white` / `bg-black` in `alert.ts`.
     - Spec asserts `text-on-primary`, `text-on-warning`, etc. instead of `text-white`/`text-black`.
     - Visual diff on each color's solid variant: identical to before in the default theme.

3. **Add dark-mode pairs to soft and outline variants** — match the codified project convention.
   - File(s): `projects/ngx-tw/alert/alert.ts:47-86`
   - Why: `feedback_dark_mode_overrides` memory codifies explicit `dark:bg-{color}-900/X` as the project convention. Today soft and outline alerts render as a light pill on dark pages.
   - Change: for each color × variant compoundVariant on `soft`, append `dark:bg-{color}-900/30 dark:text-{color}-200` (or similar pair). For `outline`, append `dark:border-{color}-700 dark:text-{color}-200`. Pick the exact opacities/shades to match the rest of the library's dark-mode pattern (cross-check with `tw-button` solid+dark).
   - Acceptance: spec asserts dark-mode classes are emitted per variant; manual dark-mode visual check.

4. **Resolve dismiss button square-interactive size policy.**
   - File(s): `projects/ngx-tw/alert/alert.ts:28`
   - Why: codified "Square interactive targets" minimum is `xs = size-6`. Today's `size-5` is below that.
   - Change (preferred): upgrade dismiss to `size-6` and use `size-3.5` inner SVG (half-step decorative — add an inline comment explaining why the half-step is required to keep the X visually centered in the smaller target). Reposition: change `top-3 right-3` to `top-2.5 right-2.5` if needed for visual balance.
   - Alternative: codify a new "dismiss-button" sub-scale of `size-5` in `CLAUDE.md` (less preferred — proliferates sub-scales).
   - Acceptance: source uses one of the codified sub-scales; visual diff confirms the dismiss button still reads as a small, unobtrusive X.

5. **Expose dismiss button label as an input** — i18n readiness.
   - File(s): `projects/ngx-tw/alert/alert.ts:158-169` + new input
   - Why: hardcoded `aria-label="Dismiss"` is not localizable.
   - Change: add `readonly dismissLabel = input<string>('Dismiss');` with JSDoc "Accessible label for the dismiss button. Override for localization." Bind via `[attr.aria-label]="dismissLabel()"`. Brings input count to 5 — still under cap.
   - Acceptance: spec asserts default + override; demo page shows a localized example.

6. **Add `booleanAttribute` to `dismissible`.**
   - File(s): `projects/ngx-tw/alert/alert.ts:179`
   - Why: consistency with `flip-card`.
   - Change: `dismissible = input(false, { transform: booleanAttribute })`. Add the import.
   - Acceptance: `<tw-alert dismissible>` (bare) renders the X.

7. **Add `announceMessage` input — quieter screen reader output.**
   - File(s): `projects/ngx-tw/alert/alert.ts` (new input + role tweak).
   - Why: rich content alerts read at length and can interrupt. Many consumers want a short summary.
   - Change: add `readonly announceMessage = input<string | undefined>(undefined);` with JSDoc. When set, use `aria-labelledby` pointing at a `sr-only` element with the message, OR set `aria-label` on the host. Then the role's implicit live region announces the short label rather than the full content.
   - This brings inputs to 6 — right at the cap. **Defer to a P2 follow-up** if the cap pressure matters.
   - Acceptance: when set, screen readers announce only `announceMessage`; visual content unchanged.

8. **Test gaps — close them.**
   - File(s): `projects/ngx-tw/alert/alert.spec.ts`
   - Change:
     - Drop the `LiveAnnouncer` tests; replace with role-attribute tests (`role="alert"` for assertive, `role="status"` for polite, no role for off).
     - Add tests asserting `text-on-{color}` instead of `text-white`/`text-black`.
     - Add tests asserting dark-mode classes per color variant.
     - Add a consumer-twMerge test.
     - Drop the meaningless `animate.leave` test.
   - Acceptance: green; locks in the new contract.

### Out of scope
- Adding entry animation (`animate.enter="fade-in"`) — useful, but a separate ergonomics PR.
- Replacing the dismiss SVG with `tw-icon` — drags in an icon-name dependency; defer.
- Adding `toast`-style auto-dismiss timing — that lives in `tw-toast`.

### Verification
- Build: `npm run build:lib`
- Test: `npm test` (filter: `alert`)
- Visual check: `http://localhost:4600/alert` (also check dark mode)
- A11y: `npm run e2e:a11y` + a manual VoiceOver / NVDA pass to confirm single announcement.

## Priority
**P0** — Two real a11y bugs (double announcement, role=alert for all severities) plus a token-migration debt (`text-white`/`text-black`) and dark-mode regressions on the most-visible color variants. Highest-priority component in this batch.
