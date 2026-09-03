import { expect, type Page } from '@playwright/test';

/**
 * Shared timing primitives for the e2e suite.
 *
 * These exist because audit passes 2, 4 and 5 each recorded a *different*
 * flaky test with the *same* shape: a value read once, at one instant, under
 * full-suite parallel load. Four independent flakes in three passes is not
 * four bugs — it is one missing primitive. Left alone they train a maintainer
 * to re-run a red suite until it goes green, which is exactly how a real
 * failure gets waved through.
 *
 * The unit suite already solved this: `pumpUntil` in `select.spec.ts` /
 * `combobox.spec.ts` pumps change detection until a predicate holds instead of
 * sleeping a fixed number of milliseconds. `pollUntil` below is the e2e
 * equivalent, built on Playwright's own `expect.poll` so retries, timeouts and
 * failure reporting all come from the framework rather than a hand-rolled
 * loop.
 */

/**
 * Ceiling for "the lazy route chunk has compiled and its outlet has mounted".
 *
 * The demo is served by `ng serve` in dev mode, so the first hit on a route
 * triggers an on-demand esbuild compile of a chunk that can be 600+ lines of
 * examples. With four Playwright workers racing the same dev server this
 * routinely exceeds the default 5 s expect timeout, and pass 4 measured
 * `/components/sort/api` exceeding **20 s** — the value this constant used to
 * hold, hand-copied into seven files. The same page re-runs in 1.9 s alone.
 *
 * This is deliberately generous: the cost of a too-high ceiling is a slower
 * failure on a genuinely broken page; the cost of a too-low one is a red
 * suite that goes green on re-run.
 */
export const OUTLET_READY_TIMEOUT_MS = 45_000;

/**
 * Ceiling for "a CDK overlay finished attaching or detaching".
 *
 * Overlay teardown is scheduled work — a detach hook plus a change-detection
 * pass, and on the close path an animation callback. Under parallel load that
 * can outrun the default 5 s expect timeout even though nothing is wrong,
 * which is what pass 4's `date-picker.spec.ts` flake was (`expected 0
 * received 1` on an overlay that had simply not detached yet).
 */
export const OVERLAY_SETTLE_TIMEOUT_MS = 15_000;

/**
 * Poll an in-page expression until the assertion on its result passes.
 *
 * Use this instead of `const x = await page.evaluate(...); expect(x).toBe(...)`
 * for anything the browser settles asynchronously — above all **focus**, which
 * this library moves from `afterNextRender`, CDK's `FocusMonitor` and overlay
 * attach/detach hooks. A bare `page.evaluate` samples one instant and has no
 * retry, so it is a race by construction; `expect.poll` re-runs the evaluate
 * until the matcher passes or the timeout expires, and reports the last value
 * it saw on failure.
 *
 * ```ts
 * await pollUntil(page, () => document.activeElement?.tagName ?? 'none',
 *   'focus should land on the listbox').toBe('UL');
 * ```
 *
 * `fn` runs in the page, so it must be self-contained — no closure over
 * Node-side variables.
 */
export function pollUntil<R>(page: Page, fn: () => R, message: string, timeout = 10_000) {
  // The matcher is applied by the caller (`await pollUntil(...).toBe(x)`), which
  // the rule cannot see across the return. One disable here is the point of
  // having a single helper rather than 35 inline `expect.poll` call sites.
  // eslint-disable-next-line playwright/valid-expect
  return expect.poll(async () => await page.evaluate(fn), { message, timeout });
}
