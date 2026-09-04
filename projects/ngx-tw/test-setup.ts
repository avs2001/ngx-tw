import 'vitest-axe/extend-expect';
import { beforeAll } from 'vitest';

/**
 * Cross-file guard: a spec that replaces a global timer function and does not
 * put the original back poisons every spec file that runs after it in the same
 * worker, because `isolate: false` shares one jsdom window across a worker's
 * files.
 *
 * The canonical way to trip this is `vi.spyOn(globalThis, 'setTimeout')` called
 * *while* `vi.useFakeTimers()` is installed. The spy captures Sinon's fake as
 * its "original", and Vitest runs `vi.restoreAllMocks()` after every spec file
 * ("mocks should not affect different files"), which re-applies that fake
 * *after* `useRealTimers()` has already uninstalled its clock. What is left
 * behind accepts callbacks and never runs them, while `vi.isFakeTimers()` still
 * reports `false` — so the obvious probe says everything is fine. Angular's
 * zoneless scheduler ticks from `setTimeout`, so `whenStable()` can then never
 * resolve and every test in the *next* spec file times out at the suite budget,
 * naming a component that has nothing to do with it. That signature cost seven
 * audit passes and three wrong diagnoses; this turns it into one named error.
 *
 * The baseline is stashed on `globalThis`, not in module scope: this setup file
 * is re-evaluated once per spec file, so a module-scope capture would re-capture
 * the already-poisoned function and the guard would never fire. It is keyed to
 * the window object so a legitimately fresh test environment re-baselines rather
 * than failing.
 */
/**
 * The globals worth baselining are exactly those whose poisoning can stop the
 * application from ever stabilizing. Angular's zoneless scheduler ticks from
 * `setTimeout` **raced with `requestAnimationFrame`**, and drains microtasks
 * between ticks, so all four belong to the same hazard: kill one and
 * `whenStable()` may never resolve. Nothing in the suite stubs `rAF` or
 * `queueMicrotask` today, which is what makes baselining them free — they are
 * here to close the hole, not to police a known offender.
 *
 * Deliberately NOT baselined: `localStorage`, `matchMedia` and friends.
 * `theme.service.spec.ts` leaks those through `vi.stubGlobal` (fixed there by
 * `vi.unstubAllGlobals()`), but a leaked `localStorage` produces a loud
 * `TypeError` in the file that trips over it, not a hang — a different and
 * much cheaper failure mode. Widening the guard to arbitrary globals would turn
 * every latent stub leak into a hard red at once and needs its own soak.
 */
const GUARDED = ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'queueMicrotask'] as const;

type GuardedName = (typeof GUARDED)[number];

const stash = globalThis as typeof globalThis & {
  __twTimerBaseline?: { window: unknown; fns: Record<GuardedName, unknown> };
};

const snapshot = (): Record<GuardedName, unknown> =>
  Object.fromEntries(GUARDED.map((name) => [name, globalThis[name]])) as Record<
    GuardedName,
    unknown
  >;

beforeAll(() => {
  const baseline = stash.__twTimerBaseline;

  if (!baseline || baseline.window !== globalThis.window) {
    stash.__twTimerBaseline = { window: globalThis.window, fns: snapshot() };
    return;
  }

  const broken = GUARDED.find((name) => globalThis[name] !== baseline.fns[name]) ?? null;

  if (broken) {
    throw new Error(
      `[ngx-tw test-setup] globalThis.${broken} was replaced by an earlier spec ` +
        `file in this worker and never restored. Angular's zoneless scheduler ` +
        `ticks from setTimeout raced with requestAnimationFrame, so a dead one ` +
        `means whenStable() can never resolve and unrelated specs that follow ` +
        `will hang until the suite budget. The usual cause is ` +
        `\`vi.spyOn(globalThis, '${broken}')\` called while ` +
        `\`vi.useFakeTimers()\` is installed; patch the global by plain ` +
        `assignment instead — see the note in carousel.spec.ts. If a spec used ` +
        `\`vi.stubGlobal\`, pair it with \`vi.unstubAllGlobals()\` — ` +
        `\`restoreAllMocks()\` does not undo stubs.`,
    );
  }
});
