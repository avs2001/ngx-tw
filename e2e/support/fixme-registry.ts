/**
 * Expiry registry for `test.fixme` suppressions.
 *
 * ## Why this exists
 *
 * `A11Y_BACKLOG` (`support/a11y.ts`) self-expires because axe still *runs*:
 * `partitionViolations` diffs the live violation list against the allowance
 * set and reports `staleAllowances`, so an entry whose violation is gone
 * shows up as debt that no longer exists. A `test.fixme` body never executes,
 * so nothing can make the same observation — a fixme whose bug was fixed is
 * undetectable by construction and the suite reports green forever.
 *
 * That is not hypothetical. Audit pass 5 promoted two fixmes and both showed a
 * failure mode: `dialog.spec.ts:92` had gone stale (its premise fixed, with
 * three unit tests already asserting it), and `calendar.spec.ts:153` held a
 * correct diagnosis of a real library defect that was found and fixed by a
 * completely independent route while the fixme sat there, invisible to every
 * gate.
 *
 * ## The two shapes, and how to choose
 *
 * Pass 6 measured every suppressed body by temporarily running it. The split
 * is not a matter of taste:
 *
 * - **The body fails on a real assertion** → use **`test.fail()`**, not a
 *   registry row. Playwright runs the body and fails the suite the day it
 *   unexpectedly passes, which is exactly the `A11Y_BACKLOG` self-expiry
 *   property. Nine entries qualify — see `EXPECTED_FAILURE_TIMEOUT_MS`.
 * - **The body cannot run at all** — it is empty, or it hangs waiting for DOM
 *   the demo never renders → it belongs **here**. `test.fail()` is wrong for
 *   these: an empty body passes (permanently red under `test.fail`), and a
 *   hanging body times out, which Playwright reports as a hard failure even
 *   under `test.fail()`. Measured, not assumed.
 *
 * ## The contract
 *
 * Every `test.fixme` title starts with its registry id in the form
 * `[fixme:<area>/<slug>] <title>`, so the id is visible in the report and
 * greppable from the shell. Both directions of the pairing — a call site whose
 * id has no row, and a row no call site references — are enforced by the
 * `Guard — every test.fixme carries a registry id` step in
 * `.github/workflows/e2e.yml`, which runs before the Playwright install and
 * fails in seconds.
 *
 * The title is a plain literal rather than a `fixmeTitle(id)` call for a
 * mundane reason worth recording: `playwright/valid-title` is an **error** in
 * this repo's ESLint config and rejects a non-literal test title, so a helper
 * that threw at collection time on an unknown id would have cost 23 lint
 * errors. And a source-scanning meta-test would be the natural home for the
 * pairing check, but `@types/node` is not a dependency of this workspace (the
 * same gap the audit register records against `scripts/verify-theme-parity.mjs`),
 * so a spec cannot `import 'node:fs'` without failing
 * `tsc -p e2e/tsconfig.json`. Hence: literal titles, checked in CI.
 *
 * ## Reviewing an entry
 *
 * When `reviewBy` passes, `specs/00-smoke/fixme-registry.spec.ts` fails. The
 * only correct responses are to delete the entry (its blocker is gone — check
 * by flipping the call site to a plain `test()` and running it) or to move the
 * date **deliberately**, with a fresh reason. Bulk-postponing is how a backlog
 * rots into permanent permission.
 */

export interface FixmeEntry {
  /** Stable id, `<area>/<slug>`. Referenced by exactly one `test.fixme` call site. */
  readonly id: string;

  /** The test title, minus the `[fixme:<id>] ` prefix the call site carries. */
  readonly title: string;

  /** Why the body cannot run today. One sentence, in the present tense. */
  readonly reason: string;

  /** The concrete thing whose absence blocks it — a route, an affordance, an API. */
  readonly blockedOn: string;

  /**
   * `yyyy-mm-dd`. After this date the registry meta-test fails. Move it only
   * with a re-checked reason.
   */
  readonly reviewBy: string;
}

/**
 * Per-test timeout applied to every `test.fail()` promotion.
 *
 * A `test.fail()` body that hangs is reported as a hard failure (a timeout is
 * not an "expected" failure in Playwright), so the rot risk is covered — but
 * an uncapped hang would still burn the suite's default 30 s per run. Every
 * promoted body currently fails on an assertion in under 7 s.
 */
export const EXPECTED_FAILURE_TIMEOUT_MS = 15_000;

/**
 * The live registry. Ordered by review horizon, nearest first.
 *
 * Census at the time of writing: 35 `test.fixme` call sites — 33 at statement
 * position plus the 2 conditional in-body ones in
 * `03-accessibility/explicit-assertions.spec.ts`, which gate the
 * `ARIA_CONTROLS_BACKLOG` / `ACCESSIBLE_NAME_BACKLOG` sets and are exempt (they
 * take a boolean, not a title, and their expiry already lives in those
 * backlogs). Of the 33: 9 became `test.fail()`, 1 was promoted to a live test
 * (it had gone stale), and the 23 below remain suppressed.
 */
export const FIXME_REGISTRY: readonly FixmeEntry[] = [
  // ── Nearest horizon: one demo change unblocks each of these ───────────
  {
    id: 'concurrent-overlays/dialog-select',
    title: '@overlay dialog + select: opening a select inside a dialog does not break the dialog trap',
    reason: 'The body hangs on `dialog.topDialog.getByRole("combobox")` — no dialog example mounts a select.',
    blockedOn: 'a `tw-select` inside a dialog example, or the `_e2e/concurrent-overlays` route',
    reviewBy: '2026-10-15',
  },
  {
    id: 'concurrent-overlays/dialog-toast',
    title: '@overlay dialog + toast: toast appears above the dialog, focus stays in the dialog',
    reason: 'The body hangs on a "Show toast" button — no dialog example injects ToastService.',
    blockedOn: 'a toast affordance inside a dialog example, or the `_e2e/concurrent-overlays` route',
    reviewBy: '2026-10-15',
  },
  {
    id: 'concurrent-overlays/dialog-tooltip',
    title: '@overlay tooltip on dialog button: tooltip renders above the dialog backdrop',
    reason: 'The body hangs on `[twTooltip]` inside the dialog — no dialog example wires one.',
    blockedOn: 'a `[twTooltip]` on a dialog action button',
    reviewBy: '2026-10-15',
  },
  {
    id: 'concurrent-overlays/z-index-canary',
    title: '@overlay z-index canary: all six overlay types coexist with documented stacking',
    reason:
      'The body is a `goto` plus a plan. It would pass vacuously today — an SPA `goto` to a route that does not exist does not throw — which is why it must stay suppressed rather than become `test.fail()`.',
    blockedOn: 'the `_e2e/concurrent-overlays` route that mounts all six overlays at once',
    reviewBy: '2026-10-15',
  },
  {
    id: 'focus-restoration/route-nav-landing',
    title: '@keyboard route nav: focus moves to the new page landing target',
    reason: 'The shell has no `NavigationEnd` listener, so focus stays on the sidebar link after a route change.',
    blockedOn: 'a shell `NavigationEnd` handler focusing `<main tabindex="-1">`',
    reviewBy: '2026-10-15',
  },
  {
    id: 'focus-restoration/history-back',
    title: '@keyboard route nav: History.back() restores focus to the originating link',
    reason: 'Needs the landing-target affordance above plus an explicit `popstate` branch.',
    blockedOn: 'the same shell focus handler, plus back-navigation focus restore',
    reviewBy: '2026-10-15',
  },
  {
    id: 'mobile/sidebar-drawer',
    title: '@mobile sidebar drawer collapses below md breakpoint',
    reason:
      'The `<aside>` at `shell.ts:346` carries `w-64 shrink-0` and no responsive variant. NOTE: the body asserts `toBeHidden()`, which also passes for an element that has not attached yet — it went green when run, so the assertion must be strengthened (not just un-suppressed) when the drawer lands.',
    blockedOn: 'a hamburger + `hidden md:flex` sidebar in `shell.ts`',
    reviewBy: '2026-10-15',
  },

  // ── The three-strategy contract: real gaps, no demo surface to prove them ──
  {
    id: 'forms/date-picker-signal-reset',
    title: '@forms @signal signal-forms: reset clears the trigger',
    reason:
      'The Signal Forms section of the date-picker examples page renders no reset surface, so there is no gesture to drive. (The original title blamed `onFormReset`; no component imports it — see the file header.)',
    blockedOn: 'a reset button in the demo\'s Signal Forms section',
    reviewBy: '2026-11-01',
  },
  {
    id: 'forms/time-picker-signal-reset',
    title: '@forms @signal signal-forms: reset clears the spinbuttons',
    reason: 'Same as the date-picker entry — the Signal Forms section renders no reset surface.',
    blockedOn: 'a reset button in the demo\'s Signal Forms section',
    reviewBy: '2026-11-01',
  },
  {
    id: 'forms/date-range-picker-signal-reset',
    title: '@forms @signal signal-forms: reset clears the trigger',
    reason: 'Same as the date-picker entry — the Signal Forms section renders no reset surface.',
    blockedOn: 'a reset button in the demo\'s Signal Forms section',
    reviewBy: '2026-11-01',
  },
  {
    id: 'forms/calendar-signal-reset',
    title: '@forms @signal signal-forms: reset clears the selection',
    reason:
      'Calendar is the one control that really does hand-roll a `control.events` / `FormResetEvent` subscription (`calendar.ts:824`), and Signal Forms\' FieldState exposes no `events` stream — so the mechanism genuinely is absent here. The demo also renders no signal-forms reset surface.',
    blockedOn: 'Signal Forms reset support in `calendar.ts`, plus a demo reset surface',
    reviewBy: '2026-11-01',
  },
  {
    id: 'forms/date-range-picker-selection-cleared',
    title: '@forms @reactive `selectionCleared` only fires mid-draft',
    reason: 'Counting emissions needs a spy the demo does not expose; the page shows only the current value.',
    blockedOn: 'an emission-count readout in the date-range-picker examples page',
    reviewBy: '2026-11-01',
  },

  // ── Demo affordances that do not exist ────────────────────────────────
  {
    id: 'calendar/constraints-shorthand',
    title: '@interaction CalendarConstraints shorthand (NEEDS-DEMO-CHANGE)',
    reason: 'No example binds the `constraints` shorthand object.',
    blockedOn: 'a `[constraints]` example in the calendar examples page',
    reviewBy: '2026-12-01',
  },
  {
    id: 'calendar/custom-selection-strategy',
    title: '@interaction Range click-strategy hand-off with custom CALENDAR_SELECTION_STRATEGY',
    reason: 'No example provides a custom selection strategy.',
    blockedOn: 'a custom `CALENDAR_SELECTION_STRATEGY` example',
    reviewBy: '2026-12-01',
  },
  {
    id: 'command-palette/trigger-directive',
    title: '@interaction @overlay [twCommandPaletteTrigger] declarative trigger directive',
    reason: 'No example uses the declarative trigger directive.',
    blockedOn: 'a `[twCommandPaletteTrigger]` example',
    reviewBy: '2026-12-01',
  },
  {
    id: 'date-picker/german-locale',
    title: '@interaction @overlay German locale renders day names in German (NEEDS-DEMO-CHANGE)',
    reason: 'No example switches the date adapter locale.',
    blockedOn: 'a locale-switching example on the date-picker page',
    reviewBy: '2026-12-01',
  },
  {
    id: 'date-range-picker/min-max-range-length',
    title: '@interaction minRangeLength / maxRangeLength surfaced on the picker (NEEDS-DEMO-CHANGE)',
    reason: 'No example binds `minRangeLength` / `maxRangeLength`.',
    blockedOn: 'a range-length example on the date-range-picker page',
    reviewBy: '2026-12-01',
  },
  {
    id: 'time-picker/meridiem-locale',
    title: '@a11y locale: meridiem labels switch per locale (NEEDS-DEMO-WIRING)',
    reason: 'Meridiem labels are hardcoded `AM` / `PM`; no example switches locale.',
    blockedOn: 'locale-aware meridiem labels plus a demo locale switch',
    reviewBy: '2026-12-01',
  },
  {
    id: 'tab-nav/routerlink-url',
    title: '@interaction routerLink-driven tab updates the URL on click',
    reason: 'No example wires `twTabNav` links to router routes.',
    blockedOn: 'a routed tab-nav example',
    reviewBy: '2026-12-01',
  },
  {
    id: 'tab-nav/routerlink-restore',
    title: '@interaction refreshing the page restores the active routed tab',
    reason: 'Needs the routed tab-nav example above.',
    blockedOn: 'a routed tab-nav example',
    reviewBy: '2026-12-01',
  },
  {
    id: 'split/nested',
    title: '@interaction nested split — inner gutter resizes inner panes only',
    reason: 'The nested-split demo was removed in the S* refactor; nesting is covered by the unit spec.',
    blockedOn: 'a "Nested splits" section in the split examples page',
    reviewBy: '2026-12-01',
  },
  {
    id: 'split/live-region',
    title: '@a11y live region announces collapse / expand',
    reason:
      '`SplitComponent` renders no `aria-live` region and calls no `LiveAnnouncer` on collapse/expand — a planned enhancement, not a regression. The demo\'s "Last event:" span is presentational.',
    blockedOn: 'a `LiveAnnouncer` announcement in `split.ts`',
    reviewBy: '2026-12-01',
  },
  {
    id: 'table/grid-keyboard-nav',
    title: '@a11y keyboard nav across cells follows the WAI-ARIA grid pattern',
    reason: 'Explicitly out of scope for v1 per the `table.ts` header note — the table is not a `role="grid"`.',
    blockedOn: 'a v2 decision to implement the grid pattern',
    reviewBy: '2026-12-01',
  },
];

/**
 * The title a call site must use, as a literal: `[fixme:<id>] <title>`.
 *
 * Exported for the meta-test, not for call sites — a test title has to be a
 * string literal to satisfy `playwright/valid-title`. Keeping the format in one
 * place is what lets the CI guard parse it.
 */
export function expectedTitle(entry: FixmeEntry): string {
  return `[fixme:${entry.id}] ${entry.title}`;
}

/** Registry entries whose `reviewBy` is on or before `today` (ISO `yyyy-mm-dd`). */
export function expiredEntries(today: string): readonly FixmeEntry[] {
  return FIXME_REGISTRY.filter((entry) => entry.reviewBy <= today);
}
